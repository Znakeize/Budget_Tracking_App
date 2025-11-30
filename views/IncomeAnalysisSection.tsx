
import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { formatCurrency, calculateTotals } from '../utils/calculations';
import { BudgetData } from '../types';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, 
  PieChart, CheckCircle, AlertCircle 
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface IncomeAnalysisSectionProps {
  history: BudgetData[];
  currentPeriod: BudgetData;
  currencySymbol: string;
}

export const IncomeAnalysisSection: React.FC<IncomeAnalysisSectionProps> = ({ 
  history, 
  currentPeriod, 
  currencySymbol 
}) => {
  // --- Data Processing ---
  const sortedHistory = useMemo(() => [...history].sort((a, b) => a.created - b.created), [history]);
  
  // 1. Current Period Totals
  const currentTotalActual = currentPeriod.income.reduce((sum, i) => sum + i.actual, 0);
  const currentTotalPlanned = currentPeriod.income.reduce((sum, i) => sum + i.planned, 0);
  const realizationRate = currentTotalPlanned > 0 ? (currentTotalActual / currentTotalPlanned) * 100 : 0;

  // 2. Historical Comparison (MoM)
  const previousPeriod = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;
  const prevTotalActual = previousPeriod ? previousPeriod.income.reduce((sum, i) => sum + i.actual, 0) : 0;
  const momGrowth = prevTotalActual > 0 ? ((currentTotalActual - prevTotalActual) / prevTotalActual) * 100 : 0;

  // 3. Trend Data (Last 6 Months)
  const trendData = useMemo(() => {
      const periods = sortedHistory.slice(-6);
      return {
          labels: periods.map(h => `${MONTH_NAMES[h.month].substring(0, 3)}`),
          datasets: [
              {
                  label: 'Actual',
                  data: periods.map(h => h.income.reduce((sum, i) => sum + i.actual, 0)),
                  borderColor: '#10b981', // Emerald
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 4
              },
              {
                  label: 'Planned',
                  data: periods.map(h => h.income.reduce((sum, i) => sum + i.planned, 0)),
                  borderColor: '#94a3b8', // Slate 400
                  borderDash: [5, 5],
                  tension: 0.4,
                  fill: false,
                  pointRadius: 0
              }
          ]
      };
  }, [sortedHistory]);

  // 4. Source Breakdown & Analysis
  const sourceAnalysis = useMemo(() => {
      return currentPeriod.income.map(item => {
          // Find historical average for this specific source
          const historicalValues = sortedHistory
              .map(h => h.income.find(i => i.name === item.name)?.actual || 0)
              .filter(v => v > 0);
          
          const historicalAvg = historicalValues.length > 0 
              ? historicalValues.reduce((a,b) => a+b, 0) / historicalValues.length 
              : item.actual;
          
          const variance = item.actual - historicalAvg;
          const variancePct = historicalAvg > 0 ? (variance / historicalAvg) * 100 : 0;
          const progress = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;

          return { ...item, variance, variancePct, progress, historicalAvg };
      }).sort((a, b) => b.actual - a.actual);
  }, [currentPeriod, sortedHistory]);

  // 5. Source Distribution Chart
  const distributionData = {
      labels: currentPeriod.income.map(i => i.name),
      datasets: [{
          data: currentPeriod.income.map(i => i.actual),
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
          borderWidth: 0,
          cutout: '70%'
      }]
  };

  const topSource = sourceAnalysis[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
            {/* Total Actual */}
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Total Received</span>
                    <DollarSign size={14} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(currentTotalActual, currencySymbol)}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${momGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {momGrowth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(momGrowth).toFixed(1)}% vs last month
                </div>
            </Card>

            {/* Realization Rate */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Realization</span>
                    <Target size={14} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {realizationRate.toFixed(0)}%
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${realizationRate >= 100 ? 'bg-emerald-500' : realizationRate >= 90 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(realizationRate, 100)}%` }}
                    ></div>
                </div>
            </Card>

            {/* Top Source */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top Source</span>
                    <Activity size={14} className="text-purple-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {topSource ? topSource.name : '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    {topSource ? `${((topSource.actual / currentTotalActual) * 100).toFixed(0)}% of total` : 'No income'}
                </div>
            </Card>

            {/* Annual Run Rate */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Annual Run Rate</span>
                    <Calendar size={14} className="text-orange-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(currentTotalActual * 12, currencySymbol, true)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                    Projected
                </div>
            </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reliability Trend */}
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> Income Consistency
                </h3>
                <div className="h-48 relative">
                    <Line 
                        data={trendData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } },
                            scales: { 
                                x: { grid: { display: false } },
                                y: { display: false }
                            }
                        }}
                    />
                </div>
            </Card>

            {/* Distribution */}
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Source Distribution</h3>
                <div className="h-40 relative flex justify-center">
                    <Doughnut 
                        data={distributionData}
                        options={{
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: { legend: { display: false } }
                        }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(currentTotalActual, currencySymbol)}</span>
                    </div>
                </div>
            </Card>
        </div>

        {/* Detailed Source Breakdown */}
        <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white">Performance by Source</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sourceAnalysis.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</span>
                                    {item.actual >= item.planned && (
                                        <CheckCircle size={12} className="text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.variancePct >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                        {item.variancePct > 0 ? '+' : ''}{item.variancePct.toFixed(0)}% vs avg
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        Avg: {formatCurrency(item.historicalAvg, currencySymbol)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(item.actual, currencySymbol)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    Planned: {formatCurrency(item.planned, currencySymbol)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`absolute top-0 left-0 h-full rounded-full ${item.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {sourceAnalysis.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                        No income sources recorded for this period.
                    </div>
                )}
            </div>
        </Card>

        {/* Insight Box */}
        {realizationRate < 90 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20 rounded-xl flex gap-3">
                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                <div>
                    <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase mb-1">Income Alert</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Your realized income is <strong>{(100 - realizationRate).toFixed(0)}% lower</strong> than planned. Consider adjusting your expense budget or checking for delayed payments.
                    </p>
                </div>
            </div>
        )}
    </div>
  );
};
