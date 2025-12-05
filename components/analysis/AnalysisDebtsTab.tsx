
import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/calculations';
import { Line } from 'react-chartjs-2';
import { Calendar, Activity, Sparkles, TrendingDown } from 'lucide-react';
import { BudgetData } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface AnalysisDebtsTabProps {
    sortedHistory: BudgetData[];
    currentPeriod: BudgetData;
    currentTotals: any;
    currencySymbol: string;
}

export const AnalysisDebtsTab: React.FC<AnalysisDebtsTabProps> = ({ sortedHistory, currentPeriod, currentTotals, currencySymbol }) => {
    // 1. Calculations
    const currentDebts = currentPeriod.debts;
    const totalDebtBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
    const totalMonthlyPayment = currentDebts.reduce((sum, d) => sum + d.payment, 0);
    
    // Payoff Projection
    let monthsToFreedom = 0;
    let payoffDate = new Date();
    if (totalMonthlyPayment > 0) {
        monthsToFreedom = Math.ceil(totalDebtBalance / totalMonthlyPayment);
        payoffDate.setMonth(payoffDate.getMonth() + monthsToFreedom);
    }

    // DTI Ratio
    const monthlyIncome = currentTotals.totalIncome;
    const dtiRatio = monthlyIncome > 0 ? (totalMonthlyPayment / monthlyIncome) * 100 : 0;

    // Historical Tracking for Progress Bars
    const debtProgress = currentDebts.map(debt => {
        // Find max historical balance for this debt to simulate "original loan amount"
        const historicalBalances = sortedHistory.map(h => {
            const histDebt = h.debts.find(d => d.name === debt.name); // Using name for loose matching across periods
            return histDebt ? histDebt.balance : 0;
        });
        const maxBalance = Math.max(...historicalBalances, debt.balance);
        const paidOff = maxBalance - debt.balance;
        const percentage = maxBalance > 0 ? (paidOff / maxBalance) * 100 : 0;
        
        return { ...debt, maxBalance, percentage };
    });

    // Strategy Tip Logic
    let strategyTitle = "Maintain Course";
    let strategyDesc = "Your debt payments are manageable. Keep it up!";
    let strategyColor = "text-emerald-500";
    let strategyBg = "bg-emerald-50 dark:bg-emerald-900/20";
    
    if (dtiRatio > 40) {
        strategyTitle = "Aggressive Repayment Needed";
        strategyDesc = "Your Debt-to-Income ratio is high. Consider the 'Snowball Method': pay minimums on everything else and throw extra cash at the smallest debt first.";
        strategyColor = "text-red-500";
        strategyBg = "bg-red-50 dark:bg-red-900/20";
    } else if (dtiRatio > 25) {
        strategyTitle = "Optimize Payments";
        strategyDesc = "Consider the 'Avalanche Method': focus extra payments on the debt with the highest interest rate (usually credit cards) to save money long-term.";
        strategyColor = "text-orange-500";
        strategyBg = "bg-orange-50 dark:bg-orange-900/20";
    }

    const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

    // Chart Data for Debt Trend
    const debtTrendData = {
        labels: labels,
        datasets: [{
            label: 'Total Debt',
            data: sortedHistory.map(h => h.debts.reduce((s, d) => s + d.balance, 0)),
            borderColor: '#ef4444',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        interaction: { mode: 'index' as const, intersect: false },
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          {/* Projection & DTI Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2 opacity-80">
                          <Calendar size={14} />
                          <span className="text-[10px] font-bold uppercase">Debt Free By</span>
                      </div>
                      <h3 className="text-xl font-bold">
                          {totalMonthlyPayment > 0 ? payoffDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Never'}
                      </h3>
                      <p className="text-[10px] opacity-60 mt-1">
                          {monthsToFreedom} months to go
                      </p>
                  </div>
              </Card>

              <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">DTI Ratio</p>
                          <h3 className={`text-xl font-bold ${dtiRatio > 40 ? 'text-red-500' : dtiRatio > 25 ? 'text-orange-500' : 'text-emerald-500'}`}>
                              {dtiRatio.toFixed(1)}%
                          </h3>
                      </div>
                      <div className={`p-2 rounded-full ${dtiRatio > 40 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <Activity size={16} />
                      </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                          className={`h-full rounded-full ${dtiRatio > 40 ? 'bg-red-500' : dtiRatio > 25 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(dtiRatio, 100)}%` }}
                      ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5">
                      {dtiRatio < 30 ? 'Healthy Range' : 'High Burden'}
                  </p>
              </Card>
          </div>

          {/* AI Strategy Tip */}
          <div className={`p-4 rounded-xl border ${strategyBg} ${strategyColor.replace('text-', 'border-').replace('500', '200')} flex gap-3`}>
              <Sparkles size={20} className={`shrink-0 mt-0.5 ${strategyColor}`} />
              <div>
                  <h4 className={`text-xs font-bold ${strategyColor} uppercase mb-1`}>{strategyTitle}</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {strategyDesc}
                  </p>
              </div>
          </div>

          {/* Payoff Progress List */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Payoff Progress</h3>
              <div className="space-y-4">
                  {debtProgress.map((debt) => (
                      <div key={debt.id}>
                          <div className="flex justify-between items-end mb-1">
                              <div>
                                  <span className="text-xs font-bold text-slate-700 dark:text-white block">{debt.name}</span>
                                  <span className="text-[10px] text-slate-500">
                                      Bal: {formatCurrency(debt.balance, currencySymbol)}
                                  </span>
                              </div>
                              <div className="text-right">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      {Math.round(debt.percentage)}% Paid
                                  </span>
                              </div>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                              <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative z-10"
                                  style={{ width: `${debt.percentage}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between mt-1 text-[9px] text-slate-400">
                              <span>Start: {formatCurrency(debt.maxBalance, currencySymbol)}</span>
                              <span>Monthly: {formatCurrency(debt.payment, currencySymbol)}</span>
                          </div>
                      </div>
                  ))}
                  {debtProgress.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">No debts recorded.</p>
                  )}
              </div>
          </Card>

          {/* Historical Trend Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-500" /> Total Balance Trend
              </h3>
              <div className="h-48 relative">
                  <Line 
                      data={debtTrendData}
                      options={chartOptions}
                  />
              </div>
          </Card>
      </div>
    );
};
