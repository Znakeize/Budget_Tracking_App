
import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency, calculateTotals } from '../../utils/calculations';
import { Line, Doughnut } from 'react-chartjs-2';
import { Target, Shield, TrendingUp, Zap } from 'lucide-react';
import { BudgetData } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface AnalysisSavingsTabProps {
    sortedHistory: BudgetData[];
    currentPeriod: BudgetData;
    currentTotals: any;
    currencySymbol: string;
}

export const AnalysisSavingsTab: React.FC<AnalysisSavingsTabProps> = ({ sortedHistory, currentPeriod, currentTotals, currencySymbol }) => {
    // 1. Calculate Metrics
    const totalLiquid = currentTotals.totalSavings + currentTotals.totalPortfolioValue;
    
    const savingsRateHistory = sortedHistory.map(h => {
        const t = calculateTotals(h);
        return t.totalIncome > 0 ? ((t.totalSavings + t.actualInvestments) / t.totalIncome) * 100 : 0;
    });
    
    const currentSavingsRate = savingsRateHistory[savingsRateHistory.length - 1] || 0;
    const avgSavingsRate = savingsRateHistory.reduce((a,b) => a+b, 0) / (savingsRateHistory.length || 1);
    
    const avgMonthlyExpenses = sortedHistory.reduce((acc, h) => acc + calculateTotals(h).totalExpenses + calculateTotals(h).actualBills, 0) / (sortedHistory.length || 1);
    const runwayMonths = avgMonthlyExpenses > 0 ? totalLiquid / avgMonthlyExpenses : 0;

    const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

    // 2. Chart Data: Savings Rate Trend
    const rateData = {
        labels,
        datasets: [{
            label: 'Savings Rate %',
            data: savingsRateHistory,
            borderColor: '#10b981',
            backgroundColor: (ctx: any) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0,0,0,200);
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    };

    // 3. Chart Data: Allocation (Cash Funds vs Investments)
    // Extract specific savings buckets
    const savingsBuckets = currentPeriod.savings.map(s => ({ name: s.name, value: s.balance || 0, type: 'Cash' }));
    const investTotal = currentTotals.totalPortfolioValue;
    
    const allocationLabels = [...savingsBuckets.map(b => b.name), 'Investments'];
    const allocationValues = [...savingsBuckets.map(b => b.value), investTotal];
    const allocationColors = [
        '#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1', // Blues/Purples for cash
        '#10b981' // Green for investments
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Savings Rate</span>
                      <Target size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{currentSavingsRate.toFixed(1)}%</div>
                  <div className="text-[10px] text-slate-500 mt-1">Avg: {avgSavingsRate.toFixed(1)}%</div>
              </Card>
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20">
                  <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Runway</span>
                      <Shield size={14} className="text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{runwayMonths.toFixed(1)} <span className="text-sm font-medium">mo</span></div>
                  <div className="text-[10px] text-slate-500 mt-1">Based on avg spend</div>
              </Card>
          </div>

          {/* Savings Rate Trend */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Savings Consistency
              </h3>
              <div className="h-48 relative">
                  <Line 
                      data={rateData}
                      options={{
                          responsive: true, 
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { 
                              x: { display: false },
                              y: { beginAtZero: true, grid: { display: false } }
                          }
                      }}
                  />
              </div>
              <div className="mt-2 text-center text-xs text-slate-400 italic">
                  Goal: Try to maintain above 20% consistently.
              </div>
          </Card>

          {/* Composition */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Wealth Composition</h3>
              <div className="flex items-center justify-between">
                  <div className="w-1/2 h-32 relative">
                      <Doughnut 
                          data={{
                              labels: allocationLabels,
                              datasets: [{
                                  data: allocationValues,
                                  backgroundColor: allocationColors,
                                  borderWidth: 0
                              }]
                          }}
                          options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(totalLiquid, currencySymbol)}</span>
                      </div>
                  </div>
                  <div className="flex-1 pl-4 space-y-2">
                      {allocationLabels.slice(0, 4).map((label, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: allocationColors[i] }}></div>
                                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{label}</span>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                  {Math.round((allocationValues[i] / totalLiquid) * 100)}%
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </Card>

          {/* Smart Insight */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg h-fit text-indigo-600 dark:text-indigo-300">
                  <Zap size={18} />
              </div>
              <div>
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-1">Financial Health</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {runwayMonths < 3 
                          ? "Your emergency runway is low. Prioritize building a cash buffer of at least 3 months of expenses before aggressive investing." 
                          : runwayMonths > 6 
                              ? "You have a solid 6+ month safety net. Consider shifting excess cash into higher-yield investments." 
                              : "Good job! You're building a healthy safety net. Keep maintaining your savings rate."}
                  </p>
              </div>
          </div>
      </div>
    );
};
