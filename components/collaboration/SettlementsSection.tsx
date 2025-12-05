import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { ChevronDown, ChevronUp, ArrowRight, CheckCircle, Send, BellRing } from 'lucide-react';
import { SharedGroup, SharedExpense } from '../../types';

interface SettlementsSectionProps {
  groups: SharedGroup[];
  onUpdateGroup: (g: SharedGroup) => void;
}

export const SettlementsSection: React.FC<SettlementsSectionProps> = ({ groups, onUpdateGroup }) => {
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [expandedSettlementId, setExpandedSettlementId] = useState<string | null>(null);

  // Efficient Debt Simplification Algorithm (Netting)
  const balances = useMemo(() => {
    let allDebts: { 
        id: string,
        from: string, 
        to: string, 
        fromId: string,
        toId: string,
        fromAvatar: string,
        toAvatar: string,
        fromName: string,
        toName: string,
        amount: number, 
        group: string, 
        groupId: string, 
        currency: string
    }[] = [];
    
    groups.forEach(g => {
        if (filterGroupId !== 'all' && g.id !== filterGroupId) return;

        const netBalances: Record<string, number> = {};
        g.members.forEach(m => netBalances[m.id] = 0);

        g.expenses.forEach(e => {
            if (e.type === 'settlement') {
                const receiverId = e.sharedWith[0]; 
                if (receiverId) {
                    netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount;
                    netBalances[receiverId] = (netBalances[receiverId] || 0) - e.amount;
                }
            } else if (e.type === 'expense') {
                netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount; 
                if (e.split) {
                    Object.entries(e.split).forEach(([userId, share]) => {
                        netBalances[userId] = (netBalances[userId] || 0) - (share as number); 
                    });
                }
            }
        });

        const debtors: {id: string, amount: number}[] = [];
        const creditors: {id: string, amount: number}[] = [];

        Object.entries(netBalances).forEach(([id, amount]) => {
            if (amount < -0.01) debtors.push({ id, amount });
            else if (amount > 0.01) creditors.push({ id, amount });
        });

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let i = 0; 
        let j = 0; 

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
            
            const fromMember = g.members.find(m => m.id === debtor.id);
            const toMember = g.members.find(m => m.id === creditor.id);

            if (fromMember && toMember) {
                allDebts.push({
                    id: `settle-${g.id}-${debtor.id}-${creditor.id}`,
                    from: debtor.id === 'me' ? 'You' : fromMember.name,
                    to: creditor.id === 'me' ? 'You' : toMember.name,
                    fromId: debtor.id,
                    toId: creditor.id,
                    fromName: fromMember.name,
                    toName: toMember.name,
                    fromAvatar: fromMember.avatarColor,
                    toAvatar: toMember.avatarColor,
                    amount: amount,
                    group: g.name,
                    groupId: g.id,
                    currency: g.currency
                });
            }

            debtor.amount += amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }
    });

    return allDebts;
  }, [groups, filterGroupId]);

  const handleSettleClick = (e: React.MouseEvent, settlement: any) => {
      e.stopPropagation();
      setSelectedSettlement(settlement);
      setSettleModalOpen(true);
  };

  const handleConfirmSettle = () => {
      if (!selectedSettlement) return;
      
      const group = groups.find(g => g.id === selectedSettlement.groupId);
      if (group) {
          if (selectedSettlement.from === 'You') {
              // I am the payer -> Record Payment (Settlement)
              const payerId = group.members.find(m => m.id === 'me')?.id;
              const receiverId = group.members.find(m => m.name === selectedSettlement.to)?.id;

              if (payerId && receiverId) {
                  const settlementExpense: SharedExpense = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: 'Settlement Payment',
                      amount: selectedSettlement.amount,
                      paidBy: payerId,
                      sharedWith: [receiverId],
                      category: 'Settlement',
                      date: new Date().toISOString().split('T')[0],
                      split: { [receiverId]: selectedSettlement.amount },
                      type: 'settlement',
                  };
                  
                  onUpdateGroup({
                      ...group,
                      expenses: [settlementExpense, ...group.expenses],
                      activityLog: [{
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'settlement',
                          text: `settled ${group.currency} ${selectedSettlement.amount.toLocaleString()} with ${selectedSettlement.to}`,
                          date: 'Just now',
                          user: 'You'
                      }, ...group.activityLog]
                  });
              }
          } else {
              // I am the receiver -> Send Reminder (Create Reminder Expense)
              const debtorName = selectedSettlement.from;
              const debtorId = selectedSettlement.fromId;

              const reminderExpense: SharedExpense = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: `Reminder to ${debtorName}`,
                  amount: selectedSettlement.amount,
                  paidBy: 'me',
                  sharedWith: [debtorId],
                  category: 'Reminder',
                  date: new Date().toISOString().split('T')[0],
                  split: {}, 
                  type: 'reminder',
              };

              onUpdateGroup({
                  ...group,
                  expenses: [reminderExpense, ...group.expenses],
                  activityLog: [{
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'edit',
                      text: `sent a reminder to ${debtorName}`,
                      date: 'Just now',
                      user: 'You'
                  }, ...group.activityLog]
              });
          }
      }

      setSettleModalOpen(false);
  };

  const getTransactionHistory = (settlement: any) => {
      const group = groups.find(g => g.id === settlement.groupId);
      if (!group) return [];

      return group.expenses.filter(e => {
          if (e.type === 'settlement' || e.type === 'reminder') return false; 
          
          const payerId = e.paidBy;
          const involvedIds = [settlement.fromId, settlement.toId];
          
          if (!involvedIds.includes(payerId)) return false;

          const otherId = payerId === settlement.fromId ? settlement.toId : settlement.fromId;
          return e.sharedWith.includes(otherId) && (e.split[otherId] || 0) > 0;
      }).map(e => {
          const isDebit = e.paidBy === settlement.toId;
          const amountOwed = e.split[isDebit ? settlement.fromId : settlement.toId] || 0;
          
          return {
              ...e,
              displayAmount: amountOwed,
              isDebit
          };
      }).slice(0, 5); 
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-center relative flex items-center justify-between">
            <div className="text-left">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Settle Balances</h3>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                {balances.length} <span className="text-sm font-normal text-slate-500">Pending</span>
                </div>
            </div>
            
            <div className="relative">
                <select 
                    value={filterGroupId} 
                    onChange={(e) => setFilterGroupId(e.target.value)}
                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold px-3 py-2 rounded-lg outline-none shadow-sm appearance-none pr-8"
                >
                    <option value="all">All Groups</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>

        <div className="space-y-3">
        {balances.length > 0 ? (
            balances.map((b) => {
                const isExpanded = expandedSettlementId === b.id;
                const transactions = isExpanded ? getTransactionHistory(b) : [];
                
                const group = groups.find(g => g.id === b.groupId);
                const reminderSent = group?.expenses.some(e => 
                    e.type === 'reminder' && 
                    e.sharedWith.includes(b.fromId) && 
                    e.paidBy === b.toId 
                );
                const reminderDate = reminderSent ? group?.expenses.find(e => e.type === 'reminder' && e.sharedWith.includes(b.fromId))?.date : null;

                return (
                <Card 
                    key={b.id} 
                    className={`transition-all duration-300 overflow-hidden border-l-4 ${b.from === 'You' ? 'border-l-orange-500' : 'border-l-emerald-500'} ${isExpanded ? 'ring-1 ring-indigo-500/20 shadow-md' : 'hover:shadow-sm'}`}
                >
                    <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedSettlementId(isExpanded ? null : b.id)}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full ${b.fromAvatar} flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-800`}>
                                        {b.fromName.charAt(0)}
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300" />
                                    <div className={`w-8 h-8 rounded-full ${b.toAvatar} flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-800`}>
                                        {b.toName.charAt(0)}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                        {b.from === 'You' ? (
                                            <>You owe <span className="text-indigo-600 dark:text-indigo-400">{b.to}</span></>
                                        ) : (
                                            <><span className="text-indigo-600 dark:text-indigo-400">{b.from}</span> owes You</>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{b.group}</div>
                                    {reminderSent && reminderDate && (
                                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-[9px] font-bold text-orange-600 dark:text-orange-400">
                                            <BellRing size={10} /> Reminded {new Date(reminderDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right pl-2">
                                <div className={`font-bold text-lg ${b.from === 'You' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                    {b.currency} {b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
                                    Details {isExpanded ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                                </div>
                            </div>
                        </div>
                        
                        {isExpanded && (
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Mutual Activity</h4>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    {transactions.map(t => (
                                        <div key={t.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-200">{t.title}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-900 dark:text-white">{b.currency} {t.displayAmount.toLocaleString()}</div>
                                                <div className={`text-[9px] ${t.paidBy === b.toId ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                    {t.paidBy === 'me' ? 'You paid' : `${groups.find(g=>g.id===b.groupId)?.members.find(m=>m.id===t.paidBy)?.name} paid`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-xs text-slate-400 italic">No recent shared expenses found.</p>}
                                </div>

                                <button 
                                    onClick={(e) => handleSettleClick(e, b)}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    {b.from === 'You' ? <CheckCircle size={14} /> : <Send size={14} />}
                                    {b.from === 'You' ? 'Record Payment' : 'Send Reminder'}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            )})
        ) : (
            <div className="text-center py-12 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                <p className="text-sm font-bold text-slate-500">All Settled Up!</p>
                <p className="text-xs">No pending debts found.</p>
            </div>
        )}
        </div>
        
        {settleModalOpen && selectedSettlement && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettleModalOpen(false)} />
                <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        {selectedSettlement.from === 'You' ? 'Record Payment' : 'Send Reminder'}
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedSettlement.currency} {selectedSettlement.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-2">
                            {selectedSettlement.from === 'You' ? `Paying to ${selectedSettlement.to}` : `Reminding ${selectedSettlement.from}`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSettleModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                        <button onClick={handleConfirmSettle} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Confirm</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};