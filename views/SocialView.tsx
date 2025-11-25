import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Users, ChevronLeft, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Split, Wallet, Receipt, Share2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface SocialViewProps {
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
}

export const SocialView: React.FC<SocialViewProps> = ({ currencySymbol, onBack, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'shared' | 'split'>('shared');

  // Mock Data for Shared Budgets
  const [sharedBudgets, setSharedBudgets] = useState([
    {
      id: 1,
      name: 'Home & Groceries',
      total: 1200,
      spent: 850,
      members: ['You', 'Alex'],
      color: 'indigo'
    },
    {
      id: 2,
      name: 'Summer Trip',
      total: 3000,
      spent: 1200,
      members: ['You', 'Mike', 'Sarah'],
      color: 'emerald'
    }
  ]);

  // Mock Data for Splits
  const [splits, setSplits] = useState([
    { id: 1, title: 'Friday Pizza', amount: 45, type: 'owed', from: 'Mike', date: '2 days ago', settled: false },
    { id: 2, title: 'Internet Bill', amount: 30, type: 'owe', to: 'Alex', date: '5 days ago', settled: false },
    { id: 3, title: 'Uber Ride', amount: 18, type: 'owed', from: 'Sarah', date: '1 week ago', settled: false },
    { id: 4, title: 'Cinema', amount: 25, type: 'owe', to: 'Alex', date: '2 weeks ago', settled: true },
  ]);

  const handleSettle = (id: number) => {
    setSplits(splits.map(s => s.id === id ? { ...s, settled: true } : s));
  };

  const totalOwedToYou = splits.filter(s => s.type === 'owed' && !s.settled).reduce((acc, curr) => acc + curr.amount, 0);
  const totalYouOwe = splits.filter(s => s.type === 'owe' && !s.settled).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Community</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Collaborative</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4">
                <button 
                    onClick={() => setActiveTab('shared')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'shared' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Shared
                </button>
                <button 
                    onClick={() => setActiveTab('split')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'split' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Split
                </button>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">
           
           {activeTab === 'shared' && (
               <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                   <Card className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                       <div className="flex items-start justify-between mb-4">
                           <div>
                               <h3 className="text-lg font-bold">Manage Together</h3>
                               <p className="text-xs text-indigo-100 opacity-90">Collaborate on family budgets or trips.</p>
                           </div>
                           <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                               <Users size={20} />
                           </div>
                       </div>
                       <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                           <Plus size={16} /> Create New Group
                       </button>
                   </Card>

                   <div className="space-y-3">
                       {sharedBudgets.map(budget => {
                           const percent = (budget.spent / budget.total) * 100;
                           return (
                               <Card key={budget.id} className="p-4">
                                   <div className="flex justify-between items-start mb-3">
                                       <div className="flex items-center gap-3">
                                           <div className={`p-2.5 rounded-xl ${budget.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                               <Wallet size={20} />
                                           </div>
                                           <div>
                                               <h4 className="font-bold text-slate-900 dark:text-white">{budget.name}</h4>
                                               <div className="flex items-center gap-1 mt-0.5">
                                                   {budget.members.map((m, i) => (
                                                       <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{m}</span>
                                                   ))}
                                               </div>
                                           </div>
                                       </div>
                                       <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                                            <Share2 size={18} />
                                       </button>
                                   </div>
                                   
                                   <div className="mb-2">
                                       <div className="flex justify-between text-xs font-bold mb-1.5">
                                           <span className="text-slate-500 dark:text-slate-400">Spent</span>
                                           <span className="text-slate-900 dark:text-white">{formatCurrency(budget.spent, currencySymbol)} <span className="text-slate-400 font-normal">/ {formatCurrency(budget.total, currencySymbol)}</span></span>
                                       </div>
                                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                           <div 
                                                className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-orange-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                           ></div>
                                       </div>
                                   </div>
                                   
                                   <div className="flex gap-2 mt-3">
                                       <button className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
                                           Add Expense
                                       </button>
                                       <button className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">
                                           View History
                                       </button>
                                   </div>
                               </Card>
                           );
                       })}
                   </div>
               </div>
           )}

           {activeTab === 'split' && (
               <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                   {/* Summary */}
                   <div className="grid grid-cols-2 gap-3">
                       <Card className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20">
                           <div className="flex items-center gap-2 mb-1">
                               <ArrowDownLeft size={16} className="text-emerald-500" />
                               <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Owed to you</span>
                           </div>
                           <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalOwedToYou, currencySymbol)}</div>
                       </Card>
                       <Card className="p-3 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-500/20">
                           <div className="flex items-center gap-2 mb-1">
                               <ArrowUpRight size={16} className="text-orange-500" />
                               <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400">You owe</span>
                           </div>
                           <div className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalYouOwe, currencySymbol)}</div>
                       </Card>
                   </div>

                   {/* Add Button */}
                   <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                       <Split size={18} /> Split a New Expense
                   </button>

                   {/* List */}
                   <div>
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-1">Recent Activity</h3>
                       <div className="space-y-2">
                           {splits.map(split => (
                               <Card key={split.id} className={`p-3 flex items-center justify-between ${split.settled ? 'opacity-60 grayscale' : ''}`}>
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2.5 rounded-full ${split.type === 'owed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                                           <Receipt size={16} />
                                       </div>
                                       <div>
                                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">{split.title}</h4>
                                           <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                               {split.settled ? 'Settled' : (split.type === 'owed' ? `${split.from} owes you` : `You owe ${split.to}`)} • {split.date}
                                           </p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <div className={`text-sm font-bold ${split.settled ? 'text-slate-400' : (split.type === 'owed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400')}`}>
                                           {split.type === 'owed' ? '+' : '-'}{formatCurrency(split.amount, currencySymbol)}
                                       </div>
                                       {!split.settled && (
                                           <button 
                                                onClick={() => handleSettle(split.id)}
                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                                           >
                                               {split.type === 'owed' ? 'Remind' : 'Settle Up'}
                                           </button>
                                       )}
                                       {split.settled && (
                                           <span className="flex items-center justify-end gap-1 text-[9px] font-bold text-emerald-500 mt-0.5">
                                               <CheckCircle2 size={10} /> Paid
                                           </span>
                                       )}
                                   </div>
                               </Card>
                           ))}
                       </div>
                   </div>
               </div>
           )}

       </div>
    </div>
  );
};