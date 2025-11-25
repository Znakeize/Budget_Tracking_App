import React, { useMemo } from 'react';
import { BudgetData } from '../types';
import { Card } from '../components/ui/Card';
import { formatCurrency, calculateTotals } from '../utils/calculations';
import { Doughnut, Line } from 'react-chartjs-2';
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
import { TrendingUp, ChevronLeft, PieChart, Layers, DollarSign, ArrowUpRight } from 'lucide-react';
import { MONTH_NAMES } from '../constants';

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

interface InvestmentAnalysisViewProps {
  history: BudgetData[];
  currencySymbol: string;
  onBack: () => void;
}

export const InvestmentAnalysisView: React.FC<InvestmentAnalysisViewProps> = ({ history, currencySymbol, onBack }) => {
  // 1. Get Current Data (Latest in history)
  const sortedHistory = useMemo(() => [...history].sort((a, b) => a.created - b.created), [history]);
  const currentData = sortedHistory[sortedHistory.length - 1];
  const currentInvestments = currentData?.investments || [];

  // 2. Metrics Calculation
  const metrics = useMemo(() => {
    const totalValue = currentInvestments.reduce((sum, item) => sum + item.amount, 0);
    const count = currentInvestments.length;
    
    // Find top performer (largest holding)
    const topAsset = [...currentInvestments].sort((a, b) => b.amount - a.amount)[0];
    
    // Calculate simple growth from previous period if available
    let growth = 0;
    let growthPercent = 0;
    if (sortedHistory.length >= 2) {
        const prevData = sortedHistory[sortedHistory.length - 2];
        const prevTotal = prevData.investments.reduce((sum, item) => sum + item.amount, 0);
        growth = totalValue - prevTotal;
        growthPercent = prevTotal > 0 ? (growth / prevTotal) * 100 : 0;
    }

    return { totalValue, count, topAsset, growth, growthPercent };
  }, [currentInvestments, sortedHistory]);

  // 3. Allocation Chart Data
  const allocationData = useMemo(() => {
    return {
      labels: currentInvestments.map(i => i.name),
      datasets: [
        {
          data: currentInvestments.map(i => i.amount),
          backgroundColor: [
            'rgba(139, 92, 246, 0.8)', // Violet
            'rgba(16, 185, 129, 0.8)', // Emerald
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(249, 115, 22, 0.8)', // Orange
            'rgba(236, 72, 153, 0.8)', // Pink
            'rgba(99, 102, 241, 0.8)', // Indigo
          ],
          borderColor: 'transparent',
          hoverOffset: 4
        },
      ],
    };
  }, [currentInvestments]);

  // 4. History Trend Chart Data
  const trendData = useMemo(() => {
    const labels = sortedHistory.map(d => `${d.period === 'monthly' ? MONTH_NAMES[d.month].substring(0,3) : 'Pd'} ${d.year.toString().substring(2)}`);
    const values = sortedHistory.map(d => calculateTotals(d).totalInvestments);

    return {
      labels,
      datasets: [
        {
          label: 'Total Portfolio Value',
          data: values,
          fill: true,
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        },
      ],
    };
  }, [sortedHistory]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
            label: (context: any) => {
                const val = context.raw;
                const total = context.chart._metasets[context.datasetIndex].total;
                const pct = ((val / total) * 100).toFixed(1) + '%';
                return ` ${context.label}: ${formatCurrency(val, currencySymbol)} (${pct})`;
            }
        }
      }
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
            label: (context: any) => ` ${formatCurrency(context.raw, currencySymbol)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
        ticks: { display: false } // Hide Y axis labels for cleaner look
      }
    },
    interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
    }
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex items-end gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Wealth Tracking</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Investments</h1>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-none">
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                        <DollarSign size={14} />
                        <span className="text-xs font-bold uppercase">Total Portfolio</span>
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue, currencySymbol)}</div>
                    <div className="mt-2 text-xs flex items-center gap-1 bg-white/20 w-fit px-2 py-0.5 rounded-full">
                        {metrics.growth >= 0 ? <ArrowUpRight size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                        {metrics.growthPercent.toFixed(1)}% vs last period
                    </div>
                </Card>

                <div className="space-y-3">
                     <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Top Asset</span>
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                            {metrics.topAsset ? metrics.topAsset.name : 'N/A'}
                        </div>
                        <div className="text-xs text-violet-500 font-bold">
                            {metrics.topAsset ? formatCurrency(metrics.topAsset.amount, currencySymbol) : '-'}
                        </div>
                     </Card>
                     <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Total Holdings</span>
                        <div className="flex items-center gap-2">
                             <Layers size={16} className="text-slate-400" />
                             <span className="font-bold text-slate-900 dark:text-white">{metrics.count} Assets</span>
                        </div>
                     </Card>
                </div>
            </div>

            {/* Growth Trend Chart */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <TrendingUp size={14} className="text-violet-500" /> Portfolio Growth
                    </h3>
                </div>
                <div className="h-48 w-full">
                    <Line data={trendData} options={lineOptions} />
                </div>
            </Card>

            {/* Allocation Chart & List */}
            <Card className="p-4">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <PieChart size={14} className="text-violet-500" /> Asset Allocation
                </h3>
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="h-48 w-full sm:w-1/2 relative">
                        <Doughnut data={allocationData} options={doughnutOptions} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-[10px] text-slate-400 block">Total</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(metrics.totalValue, currencySymbol)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                        {currentInvestments.sort((a,b) => b.amount - a.amount).map((item, idx) => {
                             const percent = metrics.totalValue > 0 ? (item.amount / metrics.totalValue) * 100 : 0;
                             const color = allocationData.datasets[0].backgroundColor[idx % allocationData.datasets[0].backgroundColor.length];
                             
                             return (
                                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color as string }}></div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.name}</div>
                                            <div className="text-[9px] text-slate-400">{percent.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount, currencySymbol)}</div>
                                        {/* Simple bar for visual weight */}
                                        <div className="w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 ml-auto overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color as string }}></div>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                        {currentInvestments.length === 0 && (
                            <div className="text-center py-4 text-xs text-slate-400">No investments added yet.</div>
                        )}
                    </div>
                </div>
            </Card>
       </div>
    </div>
  );
};