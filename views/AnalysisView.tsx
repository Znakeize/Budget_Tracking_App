import React, { useState, useMemo } from 'react';
import { BudgetData } from '../types';
import { Card } from '../components/ui/Card';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
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
  ArcElement,
  Filler
} from 'chart.js';
import { Filter, TrendingUp, TrendingDown, Lightbulb, Calendar, X, Bell, BellRing, ArrowUp, ArrowDown, Check, ChevronDown, ChevronUp, ChevronLeft, Trash2 } from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { HeaderProfile } from '../components/ui/HeaderProfile';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface AnalysisViewProps {
  history: BudgetData[];
  currencySymbol: string;
  notificationCount: number;
  onToggleNotifications: () => void;
  onBack: () => void;
  onProfileClick: () => void;
}

type TimeRange = '3M' | '6M' | '1Y' | 'ALL' | 'CUSTOM';

export const AnalysisView: React.FC<AnalysisViewProps> = ({ history, currencySymbol, notificationCount, onToggleNotifications, onBack, onProfileClick }) => {
  // Filter State
  const [range, setRange] = useState<TimeRange>('6M');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAverages, setShowAverages] = useState(true);

  // Category Filter State
  const [selectedIncomeFilters, setSelectedIncomeFilters] = useState<string[]>([]);
  const [selectedExpenseFilters, setSelectedExpenseFilters] = useState<string[]>([]);
  const [showIncomeOptions, setShowIncomeOptions] = useState(false);
  const [showExpenseOptions, setShowExpenseOptions] = useState(false);

  // Get Unique Options for Filters
  const uniqueIncomeSources = useMemo(() => {
    const s = new Set<string>();
    history.forEach(d => d.income.forEach(i => s.add(i.name)));
    return Array.from(s).sort();
  }, [history]);

  const uniqueExpenseCategories = useMemo(() => {
    const s = new Set<string>();
    history.forEach(d => d.expenses.forEach(e => s.add(e.name)));
    return Array.from(s).sort();
  }, [history]);

  const toggleIncomeFilter = (name: string) => {
    setSelectedIncomeFilters(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const toggleExpenseFilter = (name: string) => {
    setSelectedExpenseFilters(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const clearFilters = () => {
    setRange('6M');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedIncomeFilters([]);
    setSelectedExpenseFilters([]);
    setShowAverages(true);
  };

  const isFilterActive = useMemo(() => {
    return selectedIncomeFilters.length > 0 || selectedExpenseFilters.length > 0 || range !== '6M';
  }, [selectedIncomeFilters, selectedExpenseFilters, range]);

  // Filter Data Logic (Date Range + Category Filters)
  const filteredData = useMemo(() => {
    // 1. Date Filtering
    let sorted = [...history].sort((a, b) => a.created - b.created);
    
    let dateFiltered = sorted;
    if (range !== 'ALL') {
        let startTimestamp = 0;
        let endTimestamp = Date.now();

        if (range === 'CUSTOM') {
            if (customStartDate) startTimestamp = new Date(customStartDate).getTime();
            if (customEndDate) endTimestamp = new Date(customEndDate).getTime() + 86400000; // End of day
        } else {
            const now = new Date();
            const monthsToSubtract = range === '3M' ? 3 : range === '6M' ? 6 : 12;
            const cutoffDate = new Date();
            cutoffDate.setMonth(now.getMonth() - monthsToSubtract);
            startTimestamp = cutoffDate.getTime();
        }
        
        dateFiltered = sorted.filter(item => item.created >= startTimestamp && item.created <= endTimestamp);
    }

    // 2. Category Filtering
    if (selectedIncomeFilters.length === 0 && selectedExpenseFilters.length === 0) {
        return dateFiltered;
    }

    return dateFiltered.map(period => ({
        ...period,
        income: selectedIncomeFilters.length > 0 
            ? period.income.filter(i => selectedIncomeFilters.includes(i.name)) 
            : period.income,
        expenses: selectedExpenseFilters.length > 0
            ? period.expenses.filter(e => selectedExpenseFilters.includes(e.name))
            : period.expenses
    }));
  }, [history, range, customStartDate, customEndDate, selectedIncomeFilters, selectedExpenseFilters]);

  // Filtered History for Metrics (Category filtered ONLY, ignores Date Range)
  const filteredHistoryForMetrics = useMemo(() => {
      if (selectedIncomeFilters.length === 0 && selectedExpenseFilters.length === 0) {
          return history;
      }
      return history.map(period => ({
        ...period,
        income: selectedIncomeFilters.length > 0 
            ? period.income.filter(i => selectedIncomeFilters.includes(i.name)) 
            : period.income,
        expenses: selectedExpenseFilters.length > 0
            ? period.expenses.filter(e => selectedExpenseFilters.includes(e.name))
            : period.expenses
      }));
  }, [history, selectedIncomeFilters, selectedExpenseFilters]);

  // Performance Comparison Logic (Latest vs History)
  const performanceMetrics = useMemo(() => {
    const sorted = [...filteredHistoryForMetrics].sort((a, b) => a.created - b.created);
    if (sorted.length < 2) return null;

    const current = sorted[sorted.length - 1];
    
    // Average of last 3 periods excluding current (if available) as baseline
    const historySlice = sorted.slice(Math.max(0, sorted.length - 4), sorted.length - 1);
    const hasHistory = historySlice.length > 0;
    
    // Fallback to previous single period if no deeper history
    const previous = sorted[sorted.length - 2];

    const avgTotals = historySlice.reduce((acc, item) => {
        const t = calculateTotals(item);
        return {
            income: acc.income + t.totalIncome,
            expenses: acc.expenses + t.totalOut,
        };
    }, { income: 0, expenses: 0 });
    
    const baselineIncome = hasHistory ? avgTotals.income / historySlice.length : calculateTotals(previous).totalIncome;
    const baselineExpense = hasHistory ? avgTotals.expenses / historySlice.length : calculateTotals(previous).totalOut;

    const currTotals = calculateTotals(current);
    const prevTotals = calculateTotals(previous); 

    const calcVariance = (curr: number, baseline: number) => {
        if (baseline === 0) return 0;
        return ((curr - baseline) / baseline) * 100;
    };

    const currentSavingsRate = currTotals.totalIncome > 0 ? ((currTotals.totalSavings + currTotals.totalInvestments) / currTotals.totalIncome) * 100 : 0;
    const prevSavingsRate = prevTotals.totalIncome > 0 ? ((prevTotals.totalSavings + prevTotals.totalInvestments) / prevTotals.totalIncome) * 100 : 0;
    
    return {
        periodLabel: `${current.period === 'monthly' ? MONTH_NAMES[current.month] : current.period} ${current.year}`,
        baselineLabel: hasHistory ? `Avg of prev ${historySlice.length} periods` : 'Previous Period',
        income: {
            current: currTotals.totalIncome,
            baseline: baselineIncome,
            variance: calcVariance(currTotals.totalIncome, baselineIncome),
        },
        expenses: {
            current: currTotals.totalOut,
            baseline: baselineExpense,
            variance: calcVariance(currTotals.totalOut, baselineExpense),
        },
        savingsRate: {
            current: currentSavingsRate,
            previous: prevSavingsRate,
            diff: currentSavingsRate - prevSavingsRate
        }
    };
  }, [filteredHistoryForMetrics]);

  // Expense Comparison Chart Data
  const expenseComparisonData = useMemo(() => {
    if (!performanceMetrics) return { labels: [], datasets: [] };
    
    const isBad = performanceMetrics.expenses.variance > 0; // Higher expenses is usually bad
    
    return {
        labels: ['Average', 'Current'],
        datasets: [
            {
                label: 'Expenses',
                data: [performanceMetrics.expenses.baseline, performanceMetrics.expenses.current],
                backgroundColor: [
                    'rgba(148, 163, 184, 0.5)', // Slate 400 for Baseline
                    isBad ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)' // Red or Green for Current
                ],
                borderRadius: 4,
                barThickness: 25,
            }
        ]
    };
  }, [performanceMetrics]);

  const expenseComparisonOptions = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context: any) => ` ${formatCurrency(context.raw, currencySymbol)}`
            }
        }
    },
    scales: {
        x: { 
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: { 
                callback: (val: any) => formatCurrency(val, currencySymbol),
                color: '#94a3b8',
                font: { size: 9 }
            },
            beginAtZero: true
        },
        y: {
            grid: { display: false },
            ticks: {
                font: { size: 10, weight: 'bold' as const },
                color: '#64748b'
            }
        }
    }
  }), [currencySymbol]);

  // Insights Logic (Manual/Heuristic)
  const insights = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => a.created - b.created);
    if (sorted.length === 0) return [];

    const generatedInsights: { type: 'warning' | 'positive' | 'info' | 'neutral', text: string }[] = [];
    
    if (sorted.length >= 2) {
        const current = sorted[sorted.length - 1];
        const previous = sorted[sorted.length - 2];
        const currTotals = calculateTotals(current);
        const prevTotals = calculateTotals(previous);

        // Global Expense Trend
        const expenseDiff = currTotals.totalExpenses - prevTotals.totalExpenses;
        const expensePct = prevTotals.totalExpenses > 0 ? (expenseDiff / prevTotals.totalExpenses) * 100 : 0;
        
        if (expensePct > 5) {
            generatedInsights.push({
                type: 'warning',
                text: `Total expenses increased by ${Math.round(expensePct)}% vs last period.`
            });
        } else if (expensePct < -5) {
            generatedInsights.push({
                type: 'positive',
                text: `Expenses reduced by ${Math.abs(Math.round(expensePct))}% vs last period.`
            });
        }

        // Top 3 Categories Analysis (Using Filtered Categories if any selected)
        const categoryTotals: Record<string, number> = {};
        sorted.forEach(period => {
            period.expenses.forEach(exp => {
                categoryTotals[exp.name] = (categoryTotals[exp.name] || 0) + exp.spent;
            });
        });

        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name]) => name);

        topCategories.forEach((catName, index) => {
            const currCat = current.expenses.find(e => e.name === catName);
            const prevCat = previous.expenses.find(e => e.name === catName);

            if (currCat && prevCat) {
                const diff = currCat.spent - prevCat.spent;
                const pct = prevCat.spent > 0 ? (diff / prevCat.spent) * 100 : 0;
                const isSignificant = Math.abs(diff) > 20; 

                if (isSignificant && pct > 10) {
                    generatedInsights.push({
                        type: 'warning',
                        text: `${catName} is up ${Math.round(pct)}% (${formatCurrency(diff, currencySymbol)}) vs last month.`
                    });
                } else if (isSignificant && pct < -10) {
                    generatedInsights.push({
                        type: 'positive',
                        text: `${catName} is down ${Math.abs(Math.round(pct))}% (${formatCurrency(Math.abs(diff), currencySymbol)}) vs last month.`
                    });
                }
            }
        });

    } else {
        generatedInsights.push({
             type: 'neutral',
             text: 'Track more periods to unlock trends.'
        });
    }
    
    const typePriority = { 'warning': 0, 'positive': 1, 'info': 2, 'neutral': 3 };
    generatedInsights.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

    return generatedInsights.slice(0, 5);
  }, [filteredData, currencySymbol]);

  // Summary Stats
  const summaryStats = useMemo(() => {
    const count = filteredData.length || 1;
    const totals = filteredData.reduce((acc, curr) => {
        const t = calculateTotals(curr);
        return {
            leftToSpend: acc.leftToSpend + t.leftToSpend,
            availableToBudget: acc.availableToBudget + t.availableToBudget,
            totalExpenses: acc.totalExpenses + t.totalOut,
            totalMoneyIn: acc.totalMoneyIn + t.totalIncome,
        };
    }, { leftToSpend: 0, availableToBudget: 0, totalExpenses: 0, totalMoneyIn: 0 });

    if (showAverages && count > 0) {
        return {
            leftToSpend: totals.leftToSpend / count,
            availableToBudget: totals.availableToBudget / count,
            totalExpenses: totals.totalExpenses / count,
            totalMoneyIn: totals.totalMoneyIn / count,
        };
    }
    return totals;
  }, [filteredData, showAverages]);

  // Predictions Logic (Updated to use Category-specific trends)
  const predictions = useMemo(() => {
    if (filteredData.length < 2) return null;

    const sortedSeries = [...filteredData].sort((a, b) => a.created - b.created);
    
    // 1. Forecast Left & Available (General)
    const leftToSpendValues = sortedSeries.map(d => calculateTotals(d).leftToSpend);
    const availableValues = sortedSeries.map(d => calculateTotals(d).availableToBudget);

    const calculateHoltForecast = (data: number[]) => {
        if (data.length < 2) return null;
        if (data.length === 2) {
             const slope = data[1] - data[0];
             return { value: data[1] + slope, trend: slope };
        }
        const alpha = 0.5, beta = 0.3;  
        let L = data[0], B = data[1] - data[0];
        
        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const prevL = L, prevB = B;
            L = alpha * current + (1 - alpha) * (prevL + prevB);
            B = beta * (L - prevL) + (1 - beta) * prevB;
        }
        return { value: L + B, trend: B };
    };

    const left = calculateHoltForecast(leftToSpendValues);
    const avail = calculateHoltForecast(availableValues);

    // 2. Forecast Expenses (Category-specific)
    // Identify all categories across the filtered history
    const allCategories = new Set<string>();
    sortedSeries.forEach(d => d.expenses.forEach(e => allCategories.add(e.name)));

    let predictedTotalExpenses = 0;
    let currentTotalExpenses = 0;

    const categoryForecasts: { name: string, value: number, trend: number }[] = [];

    // Sum forecasts for each category
    allCategories.forEach(catName => {
        const history = sortedSeries.map(d => {
            const item = d.expenses.find(e => e.name === catName);
            return item ? item.spent : 0;
        });

        const forecast = calculateHoltForecast(history);
        const lastVal = history[history.length - 1];
        
        currentTotalExpenses += lastVal;

        if (forecast) {
            // Expenses generally shouldn't decrease below 0 in forecast
            const val = Math.max(0, forecast.value);
            predictedTotalExpenses += val;
            categoryForecasts.push({ name: catName, value: val, trend: forecast.trend });
        } else {
            predictedTotalExpenses += lastVal; // Fallback
        }
    });

    // Fallback if no categories exist but there are total expenses recorded (unlikely but safe)
    if (allCategories.size === 0) {
         const totalHistory = sortedSeries.map(d => calculateTotals(d).totalOut);
         const forecast = calculateHoltForecast(totalHistory);
         predictedTotalExpenses = forecast ? forecast.value : 0;
         currentTotalExpenses = totalHistory[totalHistory.length - 1];
    }

    const expenseTrend = predictedTotalExpenses - currentTotalExpenses;
    
    // Sort category forecasts by predicted value to show top spenders
    const topCategories = categoryForecasts.sort((a, b) => b.value - a.value).slice(0, 3);

    return {
        left,
        avail,
        expenses: { value: predictedTotalExpenses, trend: expenseTrend },
        topCategories
    };
  }, [filteredData]);

  // Income Trend Chart Data
  const incomeTrendData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => a.created - b.created);
    const labels = sorted.map(d => d.period === 'monthly' ? MONTH_NAMES[d.month].substring(0, 3) : d.period);
    const data = sorted.map(d => calculateTotals(d).totalIncome);

    return {
        labels,
        datasets: [
            {
                label: 'Income Trend',
                data,
                borderColor: '#10b981', // emerald-500
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
            }
        ]
    };
  }, [filteredData]);

  const lineChartOptions = {
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
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
            grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
            ticks: { display: false } 
        }
    },
    interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
    }
  };

  // Chart Data
  const plannedVsActualData = useMemo(() => {
    const totals = filteredData.reduce((acc, curr) => {
        acc.planned.bills += curr.bills.reduce((s, i) => s + i.amount, 0);
        acc.planned.expenses += curr.expenses.reduce((s, i) => s + i.budgeted, 0);
        acc.planned.savings += curr.savings.reduce((s, i) => s + i.planned, 0);
        acc.actual.bills += curr.bills.reduce((s, i) => s + (i.paid ? i.amount : 0), 0);
        acc.actual.expenses += curr.expenses.reduce((s, i) => s + i.spent, 0);
        acc.actual.savings += curr.savings.reduce((s, i) => s + i.amount, 0);
        return acc;
    }, { planned: { bills: 0, expenses: 0, savings: 0 }, actual: { bills: 0, expenses: 0, savings: 0 } });

    const divisor = showAverages ? (filteredData.length || 1) : 1;
    const process = (val: number) => val / divisor;

    return {
        labels: ['Bills', 'Expenses', 'Savings'],
        datasets: [
            { label: 'Planned', data: [process(totals.planned.bills), process(totals.planned.expenses), process(totals.planned.savings)], backgroundColor: '#6366f1', borderRadius: 4 },
            { label: 'Actual', data: [process(totals.actual.bills), process(totals.actual.expenses), process(totals.actual.savings)], backgroundColor: '#ec4899', borderRadius: 4 }
        ]
    };
  }, [filteredData, showAverages]);

  const expenseData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredData.forEach(d => {
        d.expenses.forEach(e => { categories[e.name] = (categories[e.name] || 0) + e.spent; });
    });
    const divisor = showAverages ? (filteredData.length || 1) : 1;
    return {
        labels: Object.keys(categories),
        datasets: [{ data: Object.values(categories).map(v => v / divisor), backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4'], borderWidth: 0 }]
    };
  }, [filteredData, showAverages]);

  const barOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } };
  const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } };

  return (
    <div className="flex flex-col h-full relative">
       {/* Fixed Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Deep Dive</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Analysis</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1 pb-1">
                    <button 
                        onClick={onToggleNotifications}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {notificationCount > 0 ? (
                            <>
                                <BellRing size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                            </>
                        ) : (
                            <Bell size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                        )}
                    </button>
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">

        {/* Filter Controls Body */}
        <div className="flex justify-end items-center gap-2 mb-2">
             {isFilterActive && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors active:scale-95"
                >
                    <X size={14} /> Clear
                </button>
             )}
             <button 
                onClick={() => setShowFilters(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isFilterActive
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
            >
                <Filter size={14} /> Filter Data
                {isFilterActive && (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                )}
            </button>
        </div>

        {/* Filter Modal */}
        {showFilters && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
                <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[85vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Filters</h3>
                        <div className="flex items-center gap-2">
                            {isFilterActive && (
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 px-2 py-1 rounded transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <button onClick={() => setShowFilters(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                         {/* Time Range */}
                         <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-3">Time Range</label>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {(['3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((r) => (
                                    <button key={r} onClick={() => setRange(r)}
                                    className={`text-xs font-bold py-2.5 rounded-xl transition-all ${range === r ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                    {r}
                                    </button>
                                ))}
                            </div>
                             <button 
                                onClick={() => setRange('CUSTOM')}
                                className={`w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 ${range === 'CUSTOM' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Calendar size={14} /> Custom Range
                            </button>
                             {range === 'CUSTOM' && (
                                <div className="grid grid-cols-2 gap-3 mt-3 animate-in slide-in-from-top-1">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Start Date</label>
                                        <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">End Date</label>
                                        <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            )}
                         </div>

                         {/* Categories */}
                         <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div>
                                <button 
                                    onClick={() => setShowIncomeOptions(!showIncomeOptions)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3"
                                >
                                    <span>Income Sources {selectedIncomeFilters.length > 0 && <span className="text-indigo-500 ml-1">({selectedIncomeFilters.length})</span>}</span>
                                    {showIncomeOptions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                                {showIncomeOptions && (
                                    <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1">
                                        {uniqueIncomeSources.map(source => (
                                            <button
                                                key={source}
                                                onClick={() => toggleIncomeFilter(source)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1.5 ${
                                                    selectedIncomeFilters.includes(source)
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {selectedIncomeFilters.includes(source) && <Check size={10} />}
                                                {source}
                                            </button>
                                        ))}
                                         {uniqueIncomeSources.length === 0 && <span className="text-xs text-slate-400 italic">No income sources found in current range.</span>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button 
                                    onClick={() => setShowExpenseOptions(!showExpenseOptions)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3"
                                >
                                    <span>Expense Categories {selectedExpenseFilters.length > 0 && <span className="text-pink-500 ml-1">({selectedExpenseFilters.length})</span>}</span>
                                    {showExpenseOptions ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                                {showExpenseOptions && (
                                    <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-1">
                                        {uniqueExpenseCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => toggleExpenseFilter(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1.5 ${
                                                    selectedExpenseFilters.includes(cat)
                                                        ? 'bg-pink-500/10 border-pink-500/20 text-pink-600 dark:text-pink-400'
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {selectedExpenseFilters.includes(cat) && <Check size={10} />}
                                                {cat}
                                            </button>
                                        ))}
                                        {uniqueExpenseCategories.length === 0 && <span className="text-xs text-slate-400 italic">No expense categories found in current range.</span>}
                                    </div>
                                )}
                            </div>
                         </div>
                         
                         {/* View Mode */}
                         <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Calculation Mode</span>
                            <button onClick={() => setShowAverages(!showAverages)} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 active:scale-95 transition-transform">
                                {showAverages ? 'Average per Period' : 'Total Aggregates'}
                            </button>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3">
                         <button 
                            onClick={clearFilters}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Trash2 size={16} /> Clear
                        </button>
                        <button 
                            onClick={() => setShowFilters(false)}
                            className="flex-[2] py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            Show Results
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* Performance Comparison (Latest vs History) */}
        {performanceMetrics && (
            <Card className="p-4 border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" /> 
                        Latest Performance
                    </h3>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        {performanceMetrics.periodLabel}
                    </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 divide-x divide-slate-100 dark:divide-white/5">
                    {/* Income */}
                    <div className="px-1">
                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Income</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(performanceMetrics.income.current, currencySymbol)}</p>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${performanceMetrics.income.variance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {performanceMetrics.income.variance >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                            {Math.abs(performanceMetrics.income.variance).toFixed(1)}%
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">vs {formatCurrency(performanceMetrics.income.baseline, currencySymbol)} (Avg)</p>
                    </div>
                    {/* Expenses */}
                    <div className="px-1 pl-4">
                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Expenses</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(performanceMetrics.expenses.current, currencySymbol)}</p>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${performanceMetrics.expenses.variance <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {performanceMetrics.expenses.variance > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                            {Math.abs(performanceMetrics.expenses.variance).toFixed(1)}%
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">vs {formatCurrency(performanceMetrics.expenses.baseline, currencySymbol)} (Avg)</p>
                    </div>
                    {/* Savings Rate */}
                    <div className="px-1 pl-4">
                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Savings Rate</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{performanceMetrics.savingsRate.current.toFixed(1)}%</p>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${performanceMetrics.savingsRate.diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {performanceMetrics.savingsRate.diff >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                            {Math.abs(performanceMetrics.savingsRate.diff).toFixed(1)} pts
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">vs {performanceMetrics.savingsRate.previous.toFixed(1)}% (Prev)</p>
                    </div>
                </div>

                {/* Expense Comparison Chart */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] uppercase text-slate-500 font-bold">Expense Trend</p>
                        <span className={`text-xs font-bold ${performanceMetrics.expenses.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {performanceMetrics.expenses.variance > 0 ? '+' : ''}{performanceMetrics.expenses.variance.toFixed(1)}% vs Avg
                        </span>
                    </div>
                    <div className="h-24">
                        <Bar data={expenseComparisonData} options={expenseComparisonOptions} />
                    </div>
                </div>
            </Card>
        )}

        {filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
                <Filter size={48} className="mx-auto mb-2 opacity-20" />
                <p>No data found for this range.</p>
            </div>
        ) : (
            <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3 border-l-2 border-l-emerald-500 bg-white dark:bg-slate-800/50">
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Avg Income (Selected)</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summaryStats.totalMoneyIn, currencySymbol)}</div>
                    </Card>
                    <Card className="p-3 border-l-2 border-l-pink-500 bg-white dark:bg-slate-800/50">
                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Avg Expense (Selected)</div>
                        <div className="text-lg font-bold text-pink-600 dark:text-pink-400">{formatCurrency(summaryStats.totalExpenses, currencySymbol)}</div>
                    </Card>
                </div>

                {/* Key Insights (Heuristic) */}
                {insights.length > 0 && (
                    <Card className="p-4 border border-slate-200 dark:border-white/5">
                        <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Lightbulb size={16} className="text-yellow-500 dark:text-yellow-400" /> Quick Observations
                        </h3>
                        <div className="space-y-3">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                        insight.type === 'warning' ? 'bg-red-400' : 
                                        insight.type === 'positive' ? 'bg-emerald-400' : 
                                        insight.type === 'info' ? 'bg-blue-400' : 'bg-slate-400'
                                    }`}></div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{insight.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Algorithmic Forecasts */}
                {predictions && predictions.left && predictions.avail && (
                    <div className="space-y-3">
                        {/* Expense Forecast (Full width) */}
                        <Card className="p-3 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t-2 border-t-pink-500">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Forecast: Total Expenses</span>
                                {predictions.expenses.trend > 0 ? <TrendingUp size={12} className="text-red-500"/> : <TrendingDown size={12} className="text-emerald-500"/>}
                            </div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{formatCurrency(predictions.expenses.value, currencySymbol)}</div>
                            <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded ${predictions.expenses.trend > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                {predictions.expenses.trend > 0 ? '+' : ''}{formatCurrency(predictions.expenses.trend, currencySymbol)} trend
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1 italic">Based on category trends</p>
                        </Card>

                        {/* Top Category Forecasts */}
                        {predictions.topCategories && predictions.topCategories.length > 0 && (
                            <div className="grid grid-cols-1 gap-2">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase ml-1">Projected Top Expenses</h4>
                                {predictions.topCategories.map((cat, i) => (
                                    <Card key={i} className="p-2 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(cat.value, currencySymbol)}</div>
                                            <div className={`text-[9px] ${cat.trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {cat.trend > 0 ? '↗' : '↘'} {formatCurrency(Math.abs(cat.trend), currencySymbol)}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-3 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t-2 border-t-indigo-500">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Forecast: Left</span>
                                    {predictions.left.trend > 0 ? <TrendingUp size={12} className="text-emerald-500"/> : <TrendingDown size={12} className="text-red-500"/>}
                                </div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{formatCurrency(predictions.left.value, currencySymbol)}</div>
                                <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded ${predictions.left.trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                    {predictions.left.trend > 0 ? '+' : ''}{formatCurrency(predictions.left.trend, currencySymbol)} trend
                                </div>
                            </Card>
                             <Card className="p-3 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-t-2 border-t-emerald-500">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Forecast: Available</span>
                                    {predictions.avail.trend > 0 ? <TrendingUp size={12} className="text-emerald-500"/> : <TrendingDown size={12} className="text-red-500"/>}
                                </div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">{formatCurrency(predictions.avail.value, currencySymbol)}</div>
                                <div className={`text-[9px] inline-block px-1.5 py-0.5 rounded ${predictions.avail.trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                    {predictions.avail.trend > 0 ? '+' : ''}{formatCurrency(predictions.avail.trend, currencySymbol)} trend
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Income Trend Chart */}
                    <Card className="p-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> Income Trend
                        </h3>
                        <div className="h-48"><Line data={incomeTrendData} options={lineChartOptions} /></div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Spending vs Budget</h3>
                        <div className="h-48"><Bar data={plannedVsActualData} options={barOptions} /></div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Expense Distribution</h3>
                             <span className="text-[9px] text-slate-400 dark:text-slate-500">{showAverages ? 'Avg/Month' : 'Total'}</span>
                        </div>
                        <div className="h-48 relative"><Doughnut data={expenseData} options={doughnutOptions} /></div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            {expenseData.labels.map((l, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: expenseData.datasets[0].backgroundColor[i] as string}}></div>
                                    <span className="text-[10px] text-slate-600 dark:text-slate-300">{l}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </>
        )}
      </div>
    </div>
  );
};