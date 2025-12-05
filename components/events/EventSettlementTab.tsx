
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, generateId } from '../../utils/calculations';
import { ArrowRight, CheckCircle, X, CircleDollarSign, Bell, Check } from 'lucide-react';
import { EventData, EventExpense } from '../../types';

interface EventSettlementTabProps {
  event: EventData;
  currencySymbol: string;
  onUpdate: (e: EventData) => void;
}

export const EventSettlementTab: React.FC<EventSettlementTabProps> = ({ event, currencySymbol, onUpdate }) => {
    // State for Partial Settlement
    const [partialMode, setPartialMode] = useState<string | null>(null); // Stores ID of the settlement being partially paid
    const [partialAmount, setPartialAmount] = useState('');

    // Logic to calculate settlements
    const calculateSettlements = () => {
        const members = event.members;
        const expenses = event.expenses;
        
        // 1. Calculate Net Balances
        const balances: Record<string, number> = {};
        members.forEach(m => balances[m.id] = 0);
        
        let totalExpense = 0;

        expenses.forEach(e => {
            if (e.category === 'Settlement') {
                // If it's a settlement, it's a transfer.
                // It increases the payer's contribution (balance) without increasing the total shared cost of the event.
                // We assume 'paidBy' is the person sending the money.
                const payerId = e.paidBy || 'me';
                if (balances[payerId] !== undefined) {
                    balances[payerId] += e.amount;
                }
                
                // NEW: Handle receiver logic via vendorId convention or direct calculation
                // For proper settlement logic, we need to debit the receiver.
                // We assume the settlement expense `vendorId` field stores the receiver's member ID.
                const receiverId = e.vendorId;
                if (receiverId && balances[receiverId] !== undefined) {
                    balances[receiverId] -= e.amount;
                }
            } else if (e.category !== 'Reminder') {
                const amount = e.amount;
                totalExpense += amount;
                // Default to 'me' if paidBy is undefined, assuming the current user paid
                const payerId = e.paidBy || 'me';
                
                // Payer gets credit
                if (balances[payerId] !== undefined) {
                    balances[payerId] += amount;
                } else {
                    // If payer isn't in member list (edge case), default to 'me' bucket or ignore
                    if (balances['me'] !== undefined) balances['me'] += amount;
                }
            }
        });

        // Simple equal split logic for events
        const splitAmount = members.length > 0 ? totalExpense / members.length : 0;

        // Subtract fair share from everyone
        members.forEach(m => {
            balances[m.id] -= splitAmount;
        });

        // 2. Resolve Debts
        const debtors = members.filter(m => balances[m.id] < -0.01).map(m => ({ ...m, balance: balances[m.id] })).sort((a,b) => a.balance - b.balance);
        const creditors = members.filter(m => balances[m.id] > 0.01).map(m => ({ ...m, balance: balances[m.id] })).sort((a,b) => b.balance - a.balance);

        const settlements = [];
        let i = 0; 
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
            
            settlements.push({
                id: `settle-${debtor.id}-${creditor.id}`, // Generate a key for UI
                from: debtor,
                to: creditor,
                amount: amount
            });

            debtor.balance += amount;
            creditor.balance -= amount;

            if (Math.abs(debtor.balance) < 0.01) i++;
            if (creditor.balance < 0.01) j++;
        }

        return { settlements, totalExpense, splitAmount };
    };

    const { settlements, totalExpense, splitAmount } = calculateSettlements();

    const handleSettle = (settlement: any, amount: number) => {
        const newExpense: EventExpense = {
            id: generateId(),
            name: `Settlement to ${settlement.to.name}`,
            amount: amount,
            category: 'Settlement',
            date: new Date().toISOString(),
            paidBy: settlement.from.id,
            vendorId: settlement.to.id // Use vendorId to store receiver ID for internal logic
        };
        
        onUpdate({ ...event, expenses: [...event.expenses, newExpense] });
        setPartialMode(null);
        setPartialAmount('');
    };

    const handleRemind = (settlement: any) => {
        const newExpense: EventExpense = {
            id: generateId(),
            name: `Reminder: ${settlement.from.name} owes ${currencySymbol}${settlement.amount.toLocaleString()}`,
            amount: 0, // No financial impact
            category: 'Reminder',
            date: new Date().toISOString(),
            paidBy: 'me',
            vendorId: settlement.from.id // Target of reminder
        };
        
        onUpdate({ ...event, expenses: [...event.expenses, newExpense] });
        
        // Visual feedback
        alert(`Reminder sent to ${settlement.from.name}`);
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                <div className="grid grid-cols-2 gap-4 divide-x divide-white/20">
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-100">Total Event Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(totalExpense, currencySymbol)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-100">Cost Per Person</p>
                        <p className="text-xl font-bold">{formatCurrency(splitAmount, currencySymbol)}</p>
                    </div>
                </div>
            </Card>

            <h3 className="text-sm font-bold text-slate-700 dark:text-white mt-2">Settlement Plan</h3>
            
            {settlements.length > 0 ? (
                <div className="space-y-3">
                    {settlements.map((s, i) => {
                        const isPartialMode = partialMode === s.id;

                        return (
                        <Card key={s.id} className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-slate-400`}>
                                            {s.from.name.charAt(0)}
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300" />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500`}>
                                            {s.to.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {s.from.id === 'me' ? 'You' : s.from.name} pays {s.to.id === 'me' ? 'You' : s.to.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">to settle share</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(s.amount, currencySymbol)}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Row */}
                            {isPartialMode ? (
                                <div className="flex gap-2 items-center animate-in slide-in-from-top-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2.5 text-xs text-slate-400">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-100 dark:bg-slate-900 rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none border border-slate-200 dark:border-slate-700" 
                                            placeholder="Amount"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSettle(s, parseFloat(partialAmount) || 0)}
                                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => { setPartialMode(null); setPartialAmount(''); }}
                                        className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleSettle(s, s.amount)}
                                        className="flex-1 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-200 transition-colors"
                                    >
                                        <CheckCircle size={12} /> Full Settle
                                    </button>
                                    <button 
                                        onClick={() => setPartialMode(s.id)}
                                        className="flex-1 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors"
                                    >
                                        <CircleDollarSign size={12} /> Partial
                                    </button>
                                    <button 
                                        onClick={() => handleRemind(s)}
                                        className="flex-1 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-200 transition-colors"
                                    >
                                        <Bell size={12} /> Remind
                                    </button>
                                </div>
                            )}
                        </Card>
                    )})}
                </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Settled Up!</p>
                    <p className="text-xs text-slate-500">Everyone has paid their fair share.</p>
                </div>
            )}
        </div>
    );
};
