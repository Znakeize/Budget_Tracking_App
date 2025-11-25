import React from 'react';
import { BudgetData } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { ExpenseBreakdown } from '../components/charts/BudgetCharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Bell, BellRing } from 'lucide-react';
import { MONTH_NAMES } from '../constants';

interface DashboardProps {
  data: BudgetData;
  setTab: (tab: string) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ data, setTab, notificationCount, onToggleNotifications }) => {
  const totals = calculateTotals(data);
  
  const percentSpent = totals.totalIncome > 0 
    ? Math.min(100, Math.round((totals.totalOut / totals.totalIncome) * 100)) 
    : 0;

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Fixed Header */}
      <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
          <div className="flex justify-between items-end">
            <div>
                <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">{data.period} Budget</h2>
                <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">{MONTH_NAMES[data.month]} {data.year}</h1>
            </div>
            
            {/* Bell Icon for notifications */}
            <button 
                onClick={onToggleNotifications}
                className="relative pb-1 focus:outline-none active:scale-95 transition-transform"
            >
                {notificationCount > 0 ? (
                    <>
                        <BellRing size={22} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                    </>
                ) : (
                    <Bell size={22} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                )}
            </button>
          </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">
      
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card gradient="from-indigo-600/20 to-blue-600/20 dark:from-indigo-600/40 dark:to-blue-600/40" className="flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                    <div className="p-2 bg-white/40 dark:bg-white/10 rounded-lg text-indigo-700 dark:text-white"><Wallet size={18} /></div>
                    <span className="text-[10px] bg-white/40 dark:bg-white/20 px-2 py-0.5 rounded-full text-indigo-900 dark:text-white font-medium">Available</span>
                </div>
                <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">Left to Spend</p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{formatCurrency(totals.leftToSpend, data.currencySymbol)}</p>
                </div>
            </Card>
            
            <Card className="flex flex-col justify-between h-32">
                <div className="h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Out</p>
                         <TrendingDown size={16} className="text-red-500 dark:text-red-400"/>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalOut, data.currencySymbol)}</p>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${percentSpent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${percentSpent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-right mt-1 text-slate-500 dark:text-slate-400">{percentSpent}% of Income</p>
                </div>
            </Card>
          </div>

          {/* Charts Section */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-white">
                <PieChartIcon /> Spending Breakdown
            </h3>
            <ExpenseBreakdown data={data} />
          </Card>

          {/* Budget Limits (Progress Bars) */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                 <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category Limits</h3>
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Sorted by Usage</span>
            </div>
            <div className="space-y-4">
                {[...data.expenses]
                    .sort((a, b) => {
                        const aRatio = a.budgeted > 0 ? a.spent / a.budgeted : 0;
                        const bRatio = b.budgeted > 0 ? b.spent / b.budgeted : 0;
                        return bRatio - aRatio;
                    })
                    .map((expense) => {
                    const percent = expense.budgeted > 0 ? (expense.spent / expense.budgeted) * 100 : 0;
                    let barColor = 'bg-emerald-500';
                    let textColor = 'text-slate-500 dark:text-slate-400';
                    let isOver = false;
                    
                    if (percent >= 100) {
                        barColor = 'bg-red-500';
                        textColor = 'text-red-500 dark:text-red-400';
                        isOver = true;
                    } else if (percent >= 85) {
                        barColor = 'bg-orange-500';
                        textColor = 'text-orange-500 dark:text-orange-400';
                    } else if (percent >= 60) {
                        barColor = 'bg-yellow-400';
                        textColor = 'text-yellow-600 dark:text-yellow-400';
                    }

                    return (
                        <div key={expense.id} className="group">
                            <div className="flex justify-between items-end mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{expense.name}</span>
                                    {isOver && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                                </div>
                                <div className="text-right flex items-baseline gap-2">
                                    <span className={`text-[10px] font-bold ${textColor}`}>{Math.round(percent)}%</span>
                                    <div>
                                        <span className={`text-xs font-bold ${textColor}`}>
                                            {formatCurrency(expense.spent, data.currencySymbol)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 ml-1">
                                            / {formatCurrency(expense.budgeted, data.currencySymbol)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} 
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                 {data.expenses.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-500 italic">
                        No expense categories added yet. Go to Budget tab to add some.
                    </div>
                )}
            </div>
          </Card>

          {/* Quick Actions / Mini Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform" onClick={() => setTab('budget')}>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Income</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalIncome, data.currencySymbol)}</p>
                    </div>
                 </div>
            </div>
            <div className="glass-panel rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform" onClick={() => setTab('budget')}>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                        <TrendingDown size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Expenses</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalExpenses, data.currencySymbol)}</p>
                    </div>
                 </div>
            </div>
          </div>
          
          {/* Cash Flow Summary */}
          <Card>
            <h3 className="text-sm font-semibold mb-3 border-b border-slate-200 dark:border-white/10 pb-2 text-slate-700 dark:text-white">Cash Flow</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Rollover (Start)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(data.rollover || 0, data.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Expenses</span>
                    <span className="text-pink-500 dark:text-pink-400">{formatCurrency(totals.totalExpenses, data.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Bills Paid</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(totals.totalBills, data.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Debts Paid</span>
                    <span className="text-orange-500 dark:text-orange-400">{formatCurrency(totals.totalDebts, data.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Investments</span>
                    <span className="text-violet-500 dark:text-violet-400">{formatCurrency(totals.totalInvestments, data.currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Savings</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(totals.totalSavings, data.currencySymbol)}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <span className="font-bold text-slate-700 dark:text-white">Net Cash Flow</span>
                    <span className={`font-bold text-lg ${totals.leftToSpend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {formatCurrency(totals.leftToSpend, data.currencySymbol)}
                    </span>
                </div>
            </div>
          </Card>

      </div>
    </div>
  );
};

const PieChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
);