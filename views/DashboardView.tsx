
import React, { useMemo } from 'react';
import { BudgetData } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { ExpenseBreakdown } from '../components/charts/BudgetCharts';
import { 
  TrendingUp, TrendingDown, Wallet, AlertCircle, Bell, BellRing, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, PiggyBank, 
  CreditCard, ShoppingBag, Car, Home, Zap, Coffee, Gift, Tag,
  MoreHorizontal, CheckCircle2, Sparkles, Target, Clock, Layers,
  ArrowRight, RefreshCw
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  data: BudgetData;
  setTab: (tab: string) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  onProfileClick: () => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ data, setTab, notificationCount, onToggleNotifications, onProfileClick }) => {
  const totals = calculateTotals(data);
  const { t } = useLanguage();
  
  // --- Calculations for Enhanced UI ---
  const percentSpent = totals.totalIncome > 0 
    ? Math.min(100, Math.round((totals.totalOut / totals.totalIncome) * 100)) 
    : 0;

  const savingsRate = totals.totalIncome > 0 
    ? ((totals.totalSavings + totals.actualInvestments) / totals.totalIncome) * 100 
    : 0;

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate());
  const dailySafeSpend = Math.max(0, totals.leftToSpend / daysRemaining);

  const paidBillsCount = data.bills.filter(b => b.paid).length;
  const totalBillsCount = data.bills.length;
  const paidDebtsCount = data.debts.filter(d => d.paid).length;
  const totalDebtsCount = data.debts.length;

  const getGreeting = () => {
      const hour = today.getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Advanced Sticky Header */}
      <div className="flex-none pt-6 px-5 pb-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-30 sticky top-0 border-b border-slate-200/50 dark:border-white/5 transition-all">
          <div className="flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                        {data.period === 'monthly' ? MONTH_NAMES[data.month] : data.period}
                    </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    {getGreeting()} <span className="text-2xl animate-pulse">👋</span>
                </h1>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={onToggleNotifications}
                    className="relative p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none active:scale-95"
                >
                    {notificationCount > 0 ? (
                        <>
                            <BellRing size={20} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                        </>
                    ) : (
                        <Bell size={20} />
                    )}
                </button>
                <div className="shadow-sm rounded-full">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
          </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-6 pb-32">
      
          {/* Hero Card: Net Position */}
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-2xl shadow-indigo-500/20 group animate-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors duration-500"></div>
                
                <div className="relative z-10 p-6 flex flex-col items-center text-center">
                    <div className="mb-2 flex items-center gap-2 opacity-80">
                        <Wallet size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">{t('dash.left_to_spend')}</span>
                    </div>
                    
                    <h2 className="text-5xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-300">
                        {formatCurrency(totals.leftToSpend, data.currencySymbol)}
                    </h2>

                    <div className="grid grid-cols-2 gap-4 w-full mt-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                             <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Daily Safe Spend</p>
                             <p className="text-lg font-bold flex items-center justify-center gap-1">
                                 <Clock size={14} className="text-emerald-400" />
                                 {formatCurrency(dailySafeSpend, data.currencySymbol, true)}
                             </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                             <p className="text-[10px] font-bold text-slate-300 uppercase mb-1">Days Left</p>
                             <p className="text-lg font-bold flex items-center justify-center gap-1">
                                 <Calendar size={14} className="text-amber-400" />
                                 {daysRemaining}
                             </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full mt-6">
                         <div className="flex justify-between text-[10px] font-bold opacity-70 mb-1.5 px-1">
                             <span>{Math.round(percentSpent)}% Spent</span>
                             <span>{formatCurrency(totals.totalOut, data.currencySymbol)} / {formatCurrency(totals.totalIncome, data.currencySymbol)}</span>
                         </div>
                         <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                             <div 
                                 className={`h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out bg-gradient-to-r ${percentSpent > 90 ? 'from-red-500 to-orange-500' : 'from-indigo-400 to-cyan-400'}`}
                                 style={{ width: `${Math.min(percentSpent, 100)}%` }}
                             ></div>
                         </div>
                    </div>
                </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-bottom-6 duration-700 delay-100">
               <Card className="p-3 flex flex-col items-center justify-center gap-2 border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/50 dark:bg-emerald-900/10" onClick={() => setTab('budget')}>
                   <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-emerald-500">
                       <ArrowDownRight size={20} />
                   </div>
                   <div className="text-center">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Income</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalIncome, data.currencySymbol, true)}</p>
                   </div>
               </Card>

               <Card className="p-3 flex flex-col items-center justify-center gap-2 border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10" onClick={() => setTab('budget')}>
                   <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-red-500">
                       <ArrowUpRight size={20} />
                   </div>
                   <div className="text-center">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Expense</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalExpenses, data.currencySymbol, true)}</p>
                   </div>
               </Card>

               <Card className="p-3 flex flex-col items-center justify-center gap-2 border-blue-100 dark:border-blue-900/20 bg-blue-50/50 dark:bg-blue-900/10" onClick={() => setTab('budget')}>
                   <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-blue-500">
                       <Target size={20} />
                   </div>
                   <div className="text-center">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Save Rate</p>
                       <p className="text-sm font-bold text-slate-900 dark:text-white">{savingsRate.toFixed(0)}%</p>
                   </div>
               </Card>
          </div>

          {/* Interactive Chart Section */}
          <Card className="p-5 animate-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-500" /> Spending Insights
                </h3>
            </div>
            <ExpenseBreakdown data={data} />
          </Card>

          {/* Compact Category Breakdown (No Icons) */}
          <div className="animate-in slide-in-from-bottom-10 duration-700 delay-300">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Category Limits
                </h3>
                <span className="text-[10px] font-medium text-slate-400">Sorted by Usage</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
                {[...data.expenses]
                    .sort((a, b) => (b.spent / (b.budgeted || 1)) - (a.spent / (a.budgeted || 1)))
                    .map((expense) => {
                    const percent = expense.budgeted > 0 ? (expense.spent / expense.budgeted) * 100 : 0;
                    const isOver = percent >= 100;
                    const isWarning = percent >= 80 && !isOver;
                    
                    // Colors
                    const colorMap = isOver 
                        ? { bar: 'bg-red-500', text: 'text-red-500' }
                        : isWarning
                            ? { bar: 'bg-orange-500', text: 'text-orange-500' }
                            : { bar: 'bg-emerald-500', text: 'text-emerald-500' };

                    return (
                        <div key={expense.id} className="relative group">
                            <div className="relative px-2 py-2 flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs tracking-tight">{expense.name}</h4>
                                        {isOver && <AlertCircle size={10} className="text-red-500" />}
                                    </div>
                                    <div className="text-[10px] font-bold flex items-center gap-2">
                                        <span className={`font-bold ${colorMap.text}`}>{Math.round(percent)}%</span>
                                        <span className="text-slate-400 dark:text-slate-500">
                                            <span className={colorMap.text}>{formatCurrency(expense.spent, data.currencySymbol)}</span> 
                                            <span className="opacity-50"> / {formatCurrency(expense.budgeted, data.currencySymbol)}</span>
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${colorMap.bar} shadow-sm transition-all duration-1000 ease-out`}
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
                 {data.expenses.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        No expenses tracked yet.
                    </div>
                )}
            </div>
          </div>

          {/* Financial Pulse / Cash Flow */}
          <Card className="animate-in slide-in-from-bottom-12 duration-700 delay-400 p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" /> Financial Pulse
                </h3>
                <div className="text-[10px] font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg">
                    {new Date().toLocaleDateString(undefined, {month: 'long'})} Snapshot
                </div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* 1. Rollover */}
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <RefreshCw size={18}/>
                        </div>
                        <div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.rollover')}</span>
                             <span className="text-[10px] text-slate-400">From last month</span>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">+{formatCurrency(data.rollover || 0, data.currencySymbol)}</span>
                </div>

                {/* 2. Income */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <ArrowDownRight size={18}/>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.income')}</span>
                                <span className="text-[10px] text-slate-400">Total Earnings</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(totals.totalIncome, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.plannedIncome, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((totals.totalIncome / (totals.plannedIncome || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 3. Expenses */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                                <ArrowUpRight size={18}/>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.expenses')}</span>
                                <span className="text-[10px] text-slate-400">Variable Spending</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">-{formatCurrency(totals.totalExpenses, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.budgetedExpenses, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-red-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((totals.totalExpenses / (totals.budgetedExpenses || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* 4. Bills */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                                <Zap size={18}/>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.bills_paid')}</span>
                                <span className="text-[10px] text-slate-400">{paidBillsCount}/{totalBillsCount} settled</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">-{formatCurrency(totals.actualBills, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.totalBills, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${(totals.actualBills / (totals.totalBills || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* 5. Debts */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                                <CreditCard size={18}/>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.debts_paid')}</span>
                                <span className="text-[10px] text-slate-400">{paidDebtsCount}/{totalDebtsCount} paid</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">-{formatCurrency(totals.actualDebts, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.totalDebts, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div 
                            className="h-full bg-rose-500 rounded-full" 
                            style={{ width: `${(totals.actualDebts / (totals.totalDebts || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* 6. Investments */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl"><TrendingUp size={18}/></div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.investments')}</span>
                                <span className="text-[10px] text-slate-400">Asset Growth</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">-{formatCurrency(totals.actualInvestments, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.totalInvestments, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((totals.actualInvestments / (totals.totalInvestments || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 7. Savings */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl"><PiggyBank size={18}/></div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{t('dash.savings')}</span>
                                <span className="text-[10px] text-slate-400">Funds Saved</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">-{formatCurrency(totals.totalSavings, data.currencySymbol)}</span>
                            <span className="text-[10px] text-slate-400 block">of {formatCurrency(totals.plannedSavings, data.currencySymbol)}</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min((totals.totalSavings / (totals.plannedSavings || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* 8. Net Cash Flow Footer */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-50 uppercase tracking-wider">{t('dash.net_cash_flow')}</span>
                         <span className="text-[10px] text-slate-400">Remaining Unallocated</span>
                    </div>
                    <div className={`text-xl font-black ${totals.leftToSpend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(totals.leftToSpend, data.currencySymbol)}
                    </div>
                </div>
            </div>
          </Card>

      </div>
    </div>
  );
};
