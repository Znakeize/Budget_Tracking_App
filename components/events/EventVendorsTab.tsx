
import React, { useState, useEffect } from 'react';
import { formatCurrency, generateId } from '../../utils/calculations';
import { EventData, EventVendor, EventCategory, EventExpense } from '../../types';
import { Plus, Pencil, Clock, DollarSign, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { AddVendorModal, EditVendorModal } from './EventModals';

interface EventVendorsTabProps {
  event: EventData;
  onUpdate: (e: EventData) => void;
  currencySymbol: string;
  focusItemId?: string;
}

export const EventVendorsTab: React.FC<EventVendorsTabProps> = ({ event, onUpdate, currencySymbol, focusItemId }) => {
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<EventVendor | null>(null);
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (focusItemId) {
            setTimeout(() => {
                const el = document.getElementById(focusItemId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [focusItemId]);

    // Intelligent mapping helper
    const getMatchingCategory = (serviceName: string) => {
        if (!event.categories || event.categories.length === 0) return 'General';
        
        // 1. Exact match
        const exact = event.categories.find((c: EventCategory) => c.name.toLowerCase() === serviceName.toLowerCase());
        if (exact) return exact.name;

        // 2. Partial match (e.g. "Venue" service -> "Venue & Food" category)
        const partial = event.categories.find((c: EventCategory) => c.name.toLowerCase().includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(c.name.toLowerCase()));
        if (partial) return partial.name;

        // 3. Fallback
        return event.categories[0].name;
    };

    const handleAddVendor = (vendor: any) => {
        const adv = vendor.advance || 0;
        const vendorId = generateId();
        const paymentId = generateId();
        const newVendor: EventVendor = {
            id: vendorId, ...vendor, paidAmount: adv, 
            status: adv > 0 ? (adv >= vendor.totalAmount ? 'paid' : 'partial') : 'pending',
            paymentHistory: adv > 0 ? [{ id: paymentId, date: new Date().toISOString().split('T')[0], name: "Advance Payment", amount: adv, paidBy: 'me' }] : []
        };
        
        let newExpenses = [...event.expenses];
        if (adv > 0) {
            // Use matched category to ensure it shows in Budget Tab
            const cat = getMatchingCategory(vendor.service);
            newExpenses.push({ id: paymentId, name: vendor.name, amount: adv, category: cat, date: new Date().toISOString(), vendorId: vendorId, paidBy: 'me' });
        }
        
        onUpdate({ ...event, vendors: [...event.vendors, newVendor], expenses: newExpenses });
        setIsAddVendorOpen(false);
    };

    const handleUpdateVendor = (updatedVendor: EventVendor) => {
        const status = updatedVendor.paidAmount >= updatedVendor.totalAmount ? 'paid' : updatedVendor.paidAmount > 0 ? 'partial' : 'pending';
        const finalVendor = { ...updatedVendor, status };

        // Sync changes to linked expenses in Budget
        let updatedExpenses = [...event.expenses];
        const oldVendor = event.vendors.find((v: any) => v.id === updatedVendor.id);
        
        if (oldVendor && (oldVendor.name !== updatedVendor.name || oldVendor.service !== updatedVendor.service)) {
            const newCategory = getMatchingCategory(updatedVendor.service);
            updatedExpenses = updatedExpenses.map((e: any) => {
                if (e.vendorId === updatedVendor.id) {
                    return {
                        ...e,
                        name: updatedVendor.name,
                        category: newCategory
                    };
                }
                return e;
            });
        }

        onUpdate({ 
            ...event, 
            vendors: event.vendors.map((v: any) => v.id === updatedVendor.id ? finalVendor : v),
            expenses: updatedExpenses
        });
        setEditingVendor(null);
    };

    const handleDeleteVendor = (id: string) => {
        if(confirm('Delete vendor?')) onUpdate({ ...event, vendors: event.vendors.filter((v: any) => v.id !== id), expenses: event.expenses.filter((e: any) => e.vendorId !== id) });
        setEditingVendor(null);
    };

    const handleUpdatePayment = (id: string, amount: number) => {
        const paymentId = generateId();
        let newExpense: EventExpense | null = null;
        const updatedVendors = event.vendors.map((v: EventVendor) => {
            if (v.id === id) {
                const newPaid = v.paidAmount + amount;
                return { 
                    ...v, 
                    paidAmount: newPaid, 
                    status: newPaid >= v.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'pending', 
                    paymentHistory: [
                        ...(v.paymentHistory || []), 
                        { 
                            id: paymentId, 
                            date: new Date().toISOString().split('T')[0], 
                            name: "Payment", 
                            amount, 
                            paidBy: 'me' 
                        }
                    ] 
                };
            }
            return v;
        });
        
        // Update Expenses Logic
        let updatedExpenses = [...event.expenses];
        const existingExpenseIndex = updatedExpenses.findIndex((e: EventExpense) => e.vendorId === id);

        if (existingExpenseIndex >= 0) {
            // Update existing expense
            updatedExpenses[existingExpenseIndex] = {
                ...updatedExpenses[existingExpenseIndex],
                amount: updatedExpenses[existingExpenseIndex].amount + amount
            };
        } else {
            // Create new aggregate expense
            // Need to find the vendor to get details
            const vendor = event.vendors.find((v: EventVendor) => v.id === id);
            if (vendor) {
                const matchedCategory = getMatchingCategory(vendor.service);
                const newExpense: EventExpense = {
                    id: paymentId, // Use payment ID for the creation
                    name: vendor.name,
                    amount: amount,
                    category: matchedCategory,
                    date: new Date().toISOString(),
                    vendorId: id,
                    paidBy: 'me'
                };
                updatedExpenses.push(newExpense);
            }
        }
        
        onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
    };

    const handleDeletePayment = (vendorId: string, paymentId: string) => {
        if (!confirm('Delete this payment record? This will also remove the entry from your budget.')) return;
        
        let amountRemoved = 0;

        const updatedVendors = event.vendors.map((v: any) => {
            if (v.id === vendorId) {
                const paymentToRemove = v.paymentHistory?.find((p: any) => p.id === paymentId);
                if (!paymentToRemove) return v;
                
                amountRemoved = paymentToRemove.amount; // Capture amount
                const newPaid = Math.max(0, v.paidAmount - amountRemoved);
                const newHistory = v.paymentHistory.filter((p: any) => p.id !== paymentId);
                
                return {
                    ...v,
                    paidAmount: newPaid,
                    status: newPaid >= v.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'pending',
                    paymentHistory: newHistory
                };
            }
            return v;
        });
        
        let updatedExpenses = [...event.expenses];
        const expenseIndex = updatedExpenses.findIndex((e: any) => e.vendorId === vendorId);
        
        if (expenseIndex >= 0 && amountRemoved > 0) {
            const currentAmount = updatedExpenses[expenseIndex].amount;
            if (currentAmount <= amountRemoved) {
                // Remove if 0 or less
                updatedExpenses.splice(expenseIndex, 1);
            } else {
                // Decrement
                updatedExpenses[expenseIndex] = {
                    ...updatedExpenses[expenseIndex],
                    amount: currentAmount - amountRemoved
                };
            }
        }
        
        onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
             <button onClick={() => setIsAddVendorOpen(true)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={18} /> Add Vendor</button>
            <div className="space-y-4">
                {event.vendors.map((vendor: EventVendor) => {
                    const percent = vendor.totalAmount > 0 ? (vendor.paidAmount / vendor.totalAmount) * 100 : 0;
                    return (
                    <div key={vendor.id} className="bg-[#1e293b] rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">{vendor.name}</h3>
                                <button onClick={() => setEditingVendor(vendor)} className="text-slate-500 hover:text-white transition-colors">
                                    <Pencil size={14} />
                                </button>
                            </div>
                            <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                vendor.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 
                                vendor.status === 'partial' ? 'bg-[#ffedd5] text-[#9a3412]' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {vendor.status}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{vendor.service}</p>

                        {/* Financials */}
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-sm text-slate-500">Total: {formatCurrency(vendor.totalAmount, currencySymbol)}</div>
                            <div className="text-base font-bold text-emerald-400">Paid: {formatCurrency(vendor.paidAmount, currencySymbol)}</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
                            <div 
                                className="h-full rounded-full transition-all duration-500 bg-[#10b981]"
                                style={{width: `${Math.min(percent, 100)}%`}}
                            ></div>
                        </div>

                        {/* Make Payment */}
                        {vendor.status !== 'paid' && (
                            <div className="mb-5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">MAKE A PAYMENT</p>
                                <div className="flex gap-3 mb-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white outline-none focus:border-indigo-500 placeholder:text-slate-600" 
                                            placeholder="Amount" 
                                            value={customAmounts[vendor.id] || ''} 
                                            onChange={(e) => setCustomAmounts({...customAmounts, [vendor.id]: e.target.value})} 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => { const amt = parseFloat(customAmounts[vendor.id]); if(amt > 0) { handleUpdatePayment(vendor.id, amt); setCustomAmounts({...customAmounts, [vendor.id]: ''}); } }} 
                                        disabled={!customAmounts[vendor.id]} 
                                        className="px-6 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20"
                                    >
                                        Pay
                                    </button>
                                </div>
                                
                                <div className="flex gap-2">
                                    {[
                                        { label: 'Full Balance', val: vendor.totalAmount - vendor.paidAmount },
                                        { label: '50%', val: (vendor.totalAmount - vendor.paidAmount) * 0.5 },
                                        { label: '25%', val: (vendor.totalAmount - vendor.paidAmount) * 0.25 }
                                    ].map((preset, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCustomAmounts({...customAmounts, [vendor.id]: preset.val.toFixed(2)})}
                                            className="flex-1 py-2 bg-[#0f172a] hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 transition-colors"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment History */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={12} /> PAYMENT HISTORY
                            </p>
                            <div className="space-y-3">
                                {vendor.paymentHistory && vendor.paymentHistory.length > 0 ? vendor.paymentHistory.map(hist => {
                                    const isAdvance = hist.name.toLowerCase().includes('advance');
                                    // Payer lookup logic
                                    const payerName = hist.paidBy === 'me' ? 'You' : (event.members.find((m: any) => m.id === hist.paidBy)?.name || hist.paidBy);
                                    
                                    return (
                                        <div key={hist.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center text-slate-400">
                                                    {isAdvance ? <DollarSign size={14} /> : <CheckCircle size={14} className="text-emerald-500"/>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold text-slate-200">{hist.name}</span>
                                                        {isAdvance && (
                                                            <span className="px-1.5 py-[2px] rounded bg-indigo-500/20 text-[8px] font-bold text-indigo-300 uppercase tracking-wide">ADVANCE</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500">{hist.date}</div>
                                                    {hist.paidBy && (
                                                        <div className="text-[9px] text-indigo-400/80 mt-0.5 font-medium">Paid by {payerName}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-[#6366f1]">{formatCurrency(hist.amount, currencySymbol)}</span>
                                                <button 
                                                    onClick={() => handleDeletePayment(vendor.id, hist.id)}
                                                    className="text-slate-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-[10px] text-slate-600 italic pl-1">No payments recorded</p>
                                )}
                            </div>
                        </div>

                        {/* Due Date Footer */}
                        {vendor.dueDate && vendor.status !== 'paid' && (
                            <div className="flex items-center gap-2 text-xs text-orange-500 font-bold mt-4 pt-4 border-t border-slate-700/50">
                                <AlertCircle size={14} /> Due: {vendor.dueDate}
                            </div>
                        )}
                    </div>
                )})}
            </div>
            <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} onConfirm={handleAddVendor} currencySymbol={currencySymbol} categories={event.categories} />
            <EditVendorModal isOpen={!!editingVendor} onClose={() => setEditingVendor(null)} onConfirm={handleUpdateVendor} onDelete={handleDeleteVendor} vendor={editingVendor} currencySymbol={currencySymbol} categories={event.categories} />
        </div>
    );
};
