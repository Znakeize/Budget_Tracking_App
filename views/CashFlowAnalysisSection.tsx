
import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { formatCurrency, calculateTotals } from '../utils/calculations';
import { BudgetData } from '../types';
import { Line, Bar } from 'react-chartjs-2';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, Droplets, Waves, 
  PiggyBank, Wallet, ArrowRight, ArrowLeftRight, Layers, BarChart3,
  Calendar, CheckCircle2
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashFlowAnalysisSectionProps {
  history: BudgetData[];
  currentPeriod: BudgetData;
  currencySymbol: string;
}

export const CashFlowAnalysisSection: React.FC<CashFlowAnalysisSectionProps> = ({ 
  history, 
  currentPeriod, 
  currencySymbol 
}) => {
  const [forecastMonths, setForecastMonths] = useState(3);

  // --- Data Processing ---
  const sortedHistory = useMemo(() => {
      const all = [...history];
      // Ensure current period is included if not already in history (depending on app logic)
      if (!all.find(h => h.id === currentPeriod.id)) {
          all.push(currentPeriod);
      }
      return all.sort((a, b) => a.created - b.created);
  }, [history, currentPeriod]);

  // 1. Time Series Data Construction
  const timeSeriesData = useMemo(() => {
      return sortedHistory.map(period => {
          const t = calculateTotals(period);
          const inflows = t.totalIncome + (period.rollover || 0);
          const fixedOutflows = t.actualBills + t.actualDebts;
          const variableOutflows = t.totalExpenses;
          const totalOutflows = fixedOutflows + variableOutflows;
          const savedInvested = t.totalSavings + t.actualInvestments;
          
          // Net Cash Flow: Money left after ALL spending (excluding savings transfers)
          const netOperatingCashFlow = t.totalIncome - totalOutflows;
          
          // Unallocated Cash: Money left after everything including savings
          const unallocated = t.leftToSpend;

          return {
              id: period.id,
              label: `${MONTH_NAMES[period.month].substring(0, 3)} '${period.year.toString().slice(2)}`,
              inflows,
              fixedOutflows,
              variableOutflows,
              totalOutflows,
              savedInvested,
              netOperatingCashFlow,
              unallocated
          };
      });
  }, [sortedHistory]);

  // 2. Aggregate Metrics
  const metrics = useMemo(() => {
      const count = timeSeriesData.length;
      if (count === 0) return { avgIn: 0, avgOut: 0, avgSave: 0, burnRate: 0, saveRate: 0 };

      const totalIn = timeSeriesData.reduce((s, d) => s + d.inflows, 0);
      const totalOut = timeSeriesData.reduce((s, d) => s + d.totalOutflows, 0);
      const totalSave = timeSeriesData.reduce((s, d) => s + d.savedInvested, 0);

      return {
          avgIn: totalIn / count,
          avgOut: totalOut / count,
          avgSave: totalSave / count,
          burnRate: totalIn > 0 ? (totalOut / totalIn) * 100 : 0,
          saveRate: totalIn > 0 ? (totalSave / totalIn) * 100 : 0
      };
  }, [timeSeriesData]);

  // 3. Current Period Snapshot
  const currentSnapshot = useMemo(() => {
      const data = timeSeriesData[timeSeriesData.length - 1] || { 
          inflows: 0, totalOutflows: 0, netOperatingCashFlow: 0, unallocated: 0 
      };
      return data;
  }, [timeSeriesData]);

  // --- Charts Configuration ---

  // A. Inflow vs Outflow Trend (Bar + Line)
  const flowTrendData = {
      labels: timeSeriesData.map(d => d.label),
      datasets: [
          {
              type: 'bar' as const,
              label: 'Outflows',
              data: timeSeriesData.map(d => d.totalOutflows),
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderRadius: 4,
              order: 2
          },
          {
              type: 'line' as const,
              label: 'Inflows',
              data: timeSeriesData.map(d => d.inflows),
              borderColor: '#10b981',
              borderWidth: 2,
              pointRadius: 3,
              pointBackgroundColor: '#fff',
              tension: 0.3,
              fill: false,
              order: 1
          }
      ]
  };

  // B. Net Cash Flow Area (Surplus/Deficit)
  const netFlowData = {
      labels: timeSeriesData.map(d => d.label),
      datasets: [
          {
              label: 'Net Cash Flow',
              data: timeSeriesData.map(d => d.netOperatingCashFlow),
              borderColor: '#6366f1',
              backgroundColor: (context: any) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
                  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                  return gradient;
              },
              fill: true,
              tension: 0.4,
              pointRadius: 4
          }
      ]
  };

  // C. Waterfall Composition (Current Period Breakdown)
  // Logic: Start with Income, subtract categories to show where money went
  const waterfallData = {
      labels: ['Income', 'Fixed Bills', 'Debt Pay', 'Variable Exp', 'Savings', 'Remaining'],
      datasets: [
          {
              label: 'Amount',
              data: (() => {
                  const t = calculateTotals(currentPeriod);
                  // Construct waterfall steps
                  // 1. Income (Base)
                  // 2. Fixed Bills (Negative)
                  // 3. Debt (Negative)
                  // 4. Expenses (Negative)
                  // 5. Savings (Negative/Transfer)
                  // 6. Remaining (Result)
                  return [
                      t.totalIncome,
                      t.actualBills, // Visualized as consumption
                      t.actualDebts,
                      t.totalExpenses,
                      t.totalSavings + t.actualInvestments,
                      t.leftToSpend
                  ];
              })(),
              backgroundColor: [
                  '#10b981', // Income (Green)
                  '#f59e0b', // Bills (Amber)
                  '#f97316', // Debt (Orange)
                  '#ef4444', // Exp (Red)
                  '#3b82f6', // Save (Blue)
                  '#8b5cf6'  // Left (Violet)
              ],
              borderRadius: 4
          }
      ]
  };

  // D. Forecast Generation
  const forecastData = useMemo(() => {
      const last3 = timeSeriesData.slice(-3);
      if (last3.length === 0) return [];
      
      const avgGrowthIn = last3.length > 1 
          ? (last3[last3.length-1].inflows - last3[0].inflows) / last3.length 
          : 0;
      
      const avgGrowthOut = last3.length > 1
          ? (last3[last3.length-1].totalOutflows - last3[0].totalOutflows) / last3.length
          : 0;

      let currentIn = last3[last3.length-1].inflows;
      let currentOut = last3[last3.length-1].totalOutflows;
      
      const forecast = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for(let i=1; i<=forecastMonths; i++) {
          currentIn += avgGrowthIn;
          currentOut += avgGrowthOut;
          
          const futureDate = new Date(currentYear, currentMonth + i, 1);
          forecast.push({
              label: `${MONTH_NAMES[futureDate.getMonth()].substring(0, 3)} (Est)`,
              in: currentIn,
              out: currentOut,
              net: currentIn - currentOut
          });
      }
      return forecast;
  }, [timeSeriesData, forecastMonths]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        
        {/* 1. Header & Primary KPI */}
        <div className="flex flex-col gap-4">
            <Card className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs text-indigo-100 font-bold uppercase mb-1 flex items-center gap-1">
                                <Waves size={12} /> Net Operating Cash Flow
                            </p>
                            <h2 className="text-3xl font-bold">
                                {formatCurrency(currentSnapshot.netOperatingCashFlow, currencySymbol)}
                            </h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${currentSnapshot.netOperatingCashFlow >= 0 ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}`}>
                            {currentSnapshot.netOperatingCashFlow >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {currentSnapshot.netOperatingCashFlow >= 0 ? 'Positive' : 'Negative'}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase">Inflow</p>
                            <p className="text-lg font-bold">{formatCurrency(currentSnapshot.inflows, currencySymbol)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-indigo-200 font-bold uppercase">Outflow</p>
                            <p className="text-lg font-bold">{formatCurrency(currentSnapshot.totalOutflows, currencySymbol)}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Burn Rate</span>
                        <Activity size={14} className={metrics.burnRate > 90 ? 'text-red-500' : metrics.burnRate > 70 ? 'text-orange-500' : 'text-emerald-500'} />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metrics.burnRate.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">of income spent</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Savings Rate</span>
                        <PiggyBank size={14} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metrics.saveRate.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">avg. saved/invested</div>
                </Card>
            </div>
        </div>

        {/* 2. Flow Trend Chart */}
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-indigo-500" /> Inflow vs Outflow
                </h3>
                <div className="flex gap-2 text-[10px]">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> In</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Out</div>
                </div>
            </div>
            <div className="h-56 relative">
                <Bar 
                    data={flowTrendData as any}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                ticks: { 
                                    font: { size: 10 },
                                    callback: (v) => formatCurrency(v as number, currencySymbol, true) 
                                }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 10 } }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 10,
                                titleFont: { size: 13 },
                                bodyFont: { size: 12 },
                                callbacks: {
                                    label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw as number, currencySymbol)}`
                                }
                            }
                        }
                    }}
                />
            </div>
        </Card>

        {/* 3. Waterfall Breakdown */}
        <Card className="p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                <Layers size={16} className="text-violet-500" /> Where did it go? (This Period)
            </h3>
            
            <div className="space-y-3">
                {/* Custom Waterfall Visualization using CSS Grid/Flex */}
                <div className="relative pt-2 pb-6">
                    {/* Income Bar */}
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Total Income</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(waterfallData.datasets[0].data[0], currencySymbol)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                        <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-1">
                        {[
                            { label: 'Bills (Fixed)', val: waterfallData.datasets[0].data[1], color: 'bg-amber-500' },
                            { label: 'Debt Payments', val: waterfallData.datasets[0].data[2], color: 'bg-orange-500' },
                            { label: 'Living Expenses', val: waterfallData.datasets[0].data[3], color: 'bg-red-500' },
                            { label: 'Savings & Inv', val: waterfallData.datasets[0].data[4], color: 'bg-blue-500' },
                        ].map((item, idx) => {
                            const pct = waterfallData.datasets[0].data[0] > 0 
                                ? (item.val / waterfallData.datasets[0].data[0]) * 100 
                                : 0;
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                        <span>{item.label}</span>
                                        <span>{formatCurrency(item.val, currencySymbol)} ({pct.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Remaining */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Unallocated</span>
                            <span className="font-bold text-violet-600">{formatCurrency(waterfallData.datasets[0].data[5], currencySymbol)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1">
                            <div 
                                className="h-full bg-violet-500 rounded-full" 
                                style={{ width: `${Math.min((waterfallData.datasets[0].data[5] / waterfallData.datasets[0].data[0]) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        {/* 4. Forecast Section */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" /> Cash Flow Forecast
                </h3>
                <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                    Next 3 Months
                </span>
            </div>

            <div className="space-y-3">
                {forecastData.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${f.net >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                {f.net >= 0 ? '+' : '-'}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-700 dark:text-white">{f.label}</div>
                                <div className="text-[10px] text-slate-400">Est. Net</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-bold text-sm ${f.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {formatCurrency(f.net, currencySymbol)}
                            </div>
                            <div className="text-[9px] text-slate-400">
                                In: {formatCurrency(f.in, currencySymbol, true)} • Out: {formatCurrency(f.out, currencySymbol, true)}
                            </div>
                        </div>
                    </div>
                ))}
                {forecastData.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-2">Not enough history to forecast.</p>
                )}
            </div>
        </div>

        {/* 5. Health Check */}
        <div className={`p-4 rounded-xl border flex gap-3 ${metrics.burnRate < 80 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-500/20'}`}>
            <div className={`p-2 rounded-full h-fit ${metrics.burnRate < 80 ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' : 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300'}`}>
                {metrics.burnRate < 80 ? <CheckCircle2 size={18} /> : <Activity size={18} />}
            </div>
            <div>
                <h4 className={`text-xs font-bold uppercase mb-1 ${metrics.burnRate < 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
                    Cash Flow Health: {metrics.burnRate < 80 ? 'Excellent' : metrics.burnRate < 100 ? 'Fair' : 'Critical'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {metrics.burnRate < 80 
                        ? `You are consistently spending less than you earn, maintaining a ${formatCurrency(metrics.avgIn - metrics.avgOut, currencySymbol)} surplus on average.`
                        : metrics.burnRate < 100
                            ? "You are living within your means but have little room for error. Try to reduce variable expenses."
                            : "You are spending more than you earn. Review your fixed costs and debt obligations immediately."}
                </p>
            </div>
        </div>

    </div>
  );
};
