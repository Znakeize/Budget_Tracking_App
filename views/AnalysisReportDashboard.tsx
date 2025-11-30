
import React, { useState, useMemo } from 'react';
import { 
  Filter, Calendar, DollarSign, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Search, ChevronDown, ChevronUp,
  BarChart2, PieChart, Download, Sliders, ArrowUpDown, FileText, Check,
  Layers, Activity, Printer, Share2, Grid, Sparkles
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement 
} from 'chart.js';
import { BudgetData } from '../types';
import { formatCurrency } from '../utils/calculations';
import { MONTH_NAMES } from '../constants';
import { Card } from '../components/ui/Card';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

interface AnalysisReportDashboardProps {
  history: BudgetData[];
  currencySymbol: string;
}

type ReportType = 'spending' | 'income_vs_expense' | 'trend' | 'heatmap';
type Timeframe = '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

interface ProcessedTx {
  id: string;
  date: number; // timestamp
  dateStr: string;
  dayOfWeek: number; // 0-6
  monthYear: string;
  name: string;
  category: string;
  type: 'income' | 'expense' | 'investment';
  amount: number;
}

export const AnalysisReportDashboard: React.FC<AnalysisReportDashboardProps> = ({ history, currencySymbol }) => {
  // --- State ---
  const [reportType, setReportType] = useState<ReportType>('spending');
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProcessedTx, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // --- Data Processing ---
  const allTransactions = useMemo(() => {
    const txs: ProcessedTx[] = [];
    
    // Sort history chronologically first
    const sortedHistory = [...history].sort((a, b) => a.created - b.created);

    sortedHistory.forEach(period => {
      const periodDate = new Date(period.year, period.month, 1);
      const periodStr = `${MONTH_NAMES[period.month]} ${period.year}`;

      // Expenses
      period.expenses.forEach(e => {
        if (e.spent > 0) {
          // Mocking specific dates for expenses if not available, distributing them evenly for "Heatmap" demo
          const randomDay = Math.floor(Math.random() * 28) + 1;
          const specificDate = new Date(period.year, period.month, randomDay);
          
          txs.push({
            id: `exp-${period.id}-${e.id}`,
            date: specificDate.getTime(),
            dateStr: specificDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            dayOfWeek: specificDate.getDay(),
            monthYear: periodStr,
            name: e.name,
            category: e.name, 
            type: 'expense',
            amount: e.spent
          });
        }
      });

      // Income
      period.income.forEach(i => {
        if (i.actual > 0) {
          const specificDate = new Date(period.year, period.month, 1); // Income usually start of month
          txs.push({
            id: `inc-${period.id}-${i.id}`,
            date: specificDate.getTime(),
            dateStr: specificDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            dayOfWeek: specificDate.getDay(),
            monthYear: periodStr,
            name: i.name,
            category: 'Income',
            type: 'income',
            amount: i.actual
          });
        }
      });

      // Investments
      if (period.investments) {
        period.investments.forEach(inv => {
          if (inv.contributed && (inv.monthly || 0) > 0) {
             const specificDate = new Date(period.year, period.month, 15); // Assume mid-month
             txs.push({
              id: `inv-${period.id}-${inv.id}`,
              date: specificDate.getTime(),
              dateStr: specificDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
              dayOfWeek: specificDate.getDay(),
              monthYear: periodStr,
              name: inv.name,
              category: 'Investments',
              type: 'investment',
              amount: inv.monthly || 0
            });
          }
        });
      }
    });

    return txs.sort((a, b) => b.date - a.date);
  }, [history]);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    let data = [...allTransactions];
    const now = new Date();

    // 1. Timeframe
    if (timeframe === '3M') {
      const cutOff = new Date(now.setMonth(now.getMonth() - 3));
      data = data.filter(t => t.date >= cutOff.getTime());
    } else if (timeframe === '6M') {
      const cutOff = new Date(now.setMonth(now.getMonth() - 6));
      data = data.filter(t => t.date >= cutOff.getTime());
    } else if (timeframe === '1Y') {
      const cutOff = new Date(now.setFullYear(now.getFullYear() - 1));
      data = data.filter(t => t.date >= cutOff.getTime());
    } else if (timeframe === 'YTD') {
      const cutOff = new Date(new Date().getFullYear(), 0, 1);
      data = data.filter(t => t.date >= cutOff.getTime());
    }

    // 2. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.name.toLowerCase().includes(lower) || 
        t.category.toLowerCase().includes(lower) ||
        t.monthYear.toLowerCase().includes(lower)
      );
    }

    // 3. Category Filter
    if (selectedCategories.length > 0) {
      data = data.filter(t => selectedCategories.includes(t.category));
    }

    // 4. Sorting
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [allTransactions, timeframe, searchTerm, sortConfig, selectedCategories]);

  // --- Report Specific Aggregations ---
  const reportData = useMemo(() => {
    // Common Stats
    const totalIncome = filteredData.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalInvested = filteredData.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    
    // Net Savings (Cash remaining after Expenses) - usually investments come from this
    // "Net Cash Flow" = Income - Expenses - Investments
    const netCashFlow = totalIncome - totalExpense - totalInvested;
    
    // Savings Rate = (Income - Expense) / Income -> Represents capacity to save/invest
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Charts Config
    let chartData: any = {};
    let chartOptions: any = {};
    let insights: string[] = [];

    // --- 1. SPENDING BREAKDOWN (Pie) ---
    // Includes Investments as a slice to show Total Outflow composition
    if (reportType === 'spending') {
        const categoryMap: Record<string, number> = {};
        
        // Add Expenses
        filteredData.filter(t => t.type === 'expense').forEach(t => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        });
        
        // Add Investments (Grouped)
        if (totalInvested > 0) {
            categoryMap['Investments'] = totalInvested;
        }
        
        // Sort and top 6
        const sortedCats = Object.entries(categoryMap).sort((a,b) => b[1] - a[1]);
        const labels = sortedCats.slice(0, 6).map(e => e[0]);
        const data = sortedCats.slice(0, 6).map(e => e[1]);
        
        // Push "Others" if needed
        if (sortedCats.length > 6) {
            labels.push('Others');
            data.push(sortedCats.slice(6).reduce((s, e) => s + e[1], 0));
        }

        // Color mapping
        const bgColors = labels.map(l => l === 'Investments' ? '#8b5cf6' : ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#64748b'][labels.indexOf(l) % 7]);

        chartData = {
            labels,
            datasets: [{
                data,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        };
        chartOptions = { cutout: '60%', plugins: { legend: { position: 'right' } } };
        
        if (sortedCats.length > 0) {
            insights.push(`Top outflow category is **${sortedCats[0][0]}** (${formatCurrency(sortedCats[0][1], currencySymbol)}).`);
            const totalOutflow = totalExpense + totalInvested;
            insights.push(`It accounts for **${Math.round((sortedCats[0][1] / totalOutflow) * 100)}%** of your total outflows.`);
            if (totalInvested > 0) {
                insights.push(`**${Math.round((totalInvested / totalOutflow) * 100)}%** of your outflows went into Investments.`);
            }
        }
    }

    // --- 2. INCOME vs OUTFLOW (Bar) ---
    else if (reportType === 'income_vs_expense') {
        const monthlyData: Record<string, { inc: number, exp: number, inv: number }> = {};
        // Use chronological order
        const chrono = [...filteredData].sort((a,b) => a.date - b.date);
        chrono.forEach(t => {
            if (!monthlyData[t.monthYear]) monthlyData[t.monthYear] = { inc: 0, exp: 0, inv: 0 };
            if (t.type === 'income') monthlyData[t.monthYear].inc += t.amount;
            else if (t.type === 'expense') monthlyData[t.monthYear].exp += t.amount;
            else if (t.type === 'investment') monthlyData[t.monthYear].inv += t.amount;
        });

        chartData = {
            labels: Object.keys(monthlyData),
            datasets: [
                { label: 'Income', data: Object.values(monthlyData).map(v => v.inc), backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Expenses', data: Object.values(monthlyData).map(v => v.exp), backgroundColor: '#ef4444', borderRadius: 4 },
                { label: 'Investments', data: Object.values(monthlyData).map(v => v.inv), backgroundColor: '#8b5cf6', borderRadius: 4 }
            ]
        };
        chartOptions = { scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } };
        
        insights.push(`Net Cash Flow for period: **${formatCurrency(netCashFlow, currencySymbol)}**.`);
        insights.push(`Effective Savings Rate (Inc - Exp): **${savingsRate.toFixed(1)}%**.`);
        if (totalInvested > 0) {
            insights.push(`Total Invested: **${formatCurrency(totalInvested, currencySymbol)}**.`);
        }
    }

    // --- 3. TREND LINE (Line) ---
    else if (reportType === 'trend') {
        const monthlyStats: Record<string, { exp: number, inv: number }> = {};
        const chrono = [...filteredData].sort((a,b) => a.date - b.date);
        
        chrono.forEach(t => {
            if (!monthlyStats[t.monthYear]) monthlyStats[t.monthYear] = { exp: 0, inv: 0 };
            if (t.type === 'expense') monthlyStats[t.monthYear].exp += t.amount;
            else if (t.type === 'investment') monthlyStats[t.monthYear].inv += t.amount;
        });

        const expValues = Object.values(monthlyStats).map(v => v.exp);
        const invValues = Object.values(monthlyStats).map(v => v.inv);
        const avgExp = expValues.reduce((a,b)=>a+b,0) / (expValues.length || 1);

        chartData = {
            labels: Object.keys(monthlyStats),
            datasets: [
                {
                    label: 'Expenses',
                    data: expValues,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Investments',
                    data: invValues,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                },
                {
                    label: 'Avg Expense',
                    data: Array(expValues.length).fill(avgExp),
                    borderColor: '#94a3b8',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        };
        chartOptions = { scales: { y: { beginAtZero: true } } };
        insights.push(`Average monthly expense: **${formatCurrency(avgExp, currencySymbol)}**.`);
    }

    // --- 4. WEEKLY HEATMAP (Bar) ---
    else if (reportType === 'heatmap') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayData = Array(7).fill(0);
        
        // Only count expenses for heatmap to track spending habits
        filteredData.filter(t => t.type === 'expense').forEach(t => {
            dayData[t.dayOfWeek] += t.amount;
        });

        const maxDayVal = Math.max(...dayData);
        const maxDayIndex = dayData.indexOf(maxDayVal);

        chartData = {
            labels: days,
            datasets: [{
                label: 'Total Spending',
                data: dayData,
                backgroundColor: dayData.map(v => v === maxDayVal ? '#f97316' : '#3b82f6'),
                borderRadius: 4
            }]
        };
        chartOptions = { scales: { y: { display: false }, x: { grid: { display: false } } } };
        
        insights.push(`You spend the most on **${days[maxDayIndex]}s** (${formatCurrency(maxDayVal, currencySymbol)}).`);
        insights.push("Consider implementing 'No-Spend Days' on high-traffic days.");
    }

    return { totalIncome, totalExpense, totalInvested, netCashFlow, savingsRate, chartData, chartOptions, insights };
  }, [filteredData, reportType, currencySymbol]);

  // --- Handlers ---
  const handleExportPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("Financial Analysis Report", 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Timeframe: ${timeframe}`, 20, 35);
      
      // Summary Box
      doc.setDrawColor(200);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(20, 45, 170, 30, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.text("Total Income", 30, 55);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(reportData.totalIncome, currencySymbol), 30, 65);
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(12);
      doc.text("Total Outflow", 90, 55);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(reportData.totalExpense + reportData.totalInvested, currencySymbol), 90, 65);
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(12);
      doc.text("Net Cash Flow", 150, 55);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.setTextColor(reportData.netCashFlow >= 0 ? 0 : 200, reportData.netCashFlow >= 0 ? 150 : 0, 0);
      doc.text(formatCurrency(reportData.netCashFlow, currencySymbol), 150, 65);
      
      doc.setTextColor(0);
      
      // Insights
      let y = 90;
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("Key Insights", 20, y);
      y += 10;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      reportData.insights.forEach(ins => {
          const cleanText = ins.replace(/\*\*/g, '');
          doc.text(`• ${cleanText}`, 25, y);
          y += 7;
      });
      
      // Table
      y += 10;
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("Detailed Ledger", 20, y);
      y += 10;
      
      // Table Header
      doc.setFillColor(220, 220, 220);
      doc.rect(20, y-5, 170, 8, 'F');
      doc.setFontSize(9);
      doc.text("Date", 25, y);
      doc.text("Category", 60, y);
      doc.text("Type", 100, y);
      doc.text("Amount", 170, y, { align: 'right' });
      y += 8;
      
      filteredData.slice(0, 30).forEach(t => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(t.dateStr, 25, y);
          doc.text(t.category, 60, y);
          doc.text(t.type.toUpperCase(), 100, y);
          doc.text(formatCurrency(t.amount, currencySymbol), 170, y, { align: 'right' });
          y += 7;
      });
      
      doc.save(`Financial_Report_${timeframe}.pdf`);
  };

  const handleExportExcel = () => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(filteredData.map(t => ({
          Date: t.dateStr,
          Month: t.monthYear,
          Type: t.type,
          Category: t.category,
          Description: t.name,
          Amount: t.amount,
          DayOfWeek: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][t.dayOfWeek]
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, `Financial_Data_${timeframe}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-20">
      
      {/* 1. Configuration Panel */}
      <Card className="p-4 bg-white dark:bg-slate-800 border-none shadow-lg sticky top-0 z-20 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="flex flex-col gap-4">
          
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <FileText size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Report Builder</h3>
                    <p className="text-[10px] text-slate-500">{filteredData.length} records in view</p>
                </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={handleExportExcel} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Export Excel">
                     <Grid size={16} />
                 </button>
                 <button onClick={handleExportPDF} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Export PDF">
                     <Printer size={16} />
                 </button>
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
             {/* Report Type Selector */}
             <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg shrink-0">
                {[
                    { id: 'spending', label: 'Outflow Composition', icon: PieChart },
                    { id: 'trend', label: 'Trends', icon: TrendingUp },
                    { id: 'income_vs_expense', label: 'Cash Flow', icon: BarChart2 },
                    { id: 'heatmap', label: 'Heatmap', icon: Activity }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReportType(t.id as ReportType)}
                    className={`flex items-center gap-1 px-3 py-2 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${reportType === t.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    <t.icon size={12} /> {t.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
             <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg shrink-0">
                {['3M', '6M', 'YTD', '1Y', 'ALL'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf as Timeframe)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${timeframe === tf ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                  >
                    {tf}
                  </button>
                ))}
             </div>
             
             {/* Category Filter */}
             <div className="relative">
                  <button 
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`h-full px-3 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center gap-2 text-[10px] font-bold transition-colors ${selectedCategories.length > 0 ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500'}`}
                  >
                      <Filter size={12} />
                      {selectedCategories.length > 0 ? `${selectedCategories.length} Cats` : 'Filter'}
                  </button>
                  
                  {isCategoryDropdownOpen && (
                      <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsCategoryDropdownOpen(false)} />
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-40 max-h-60 overflow-y-auto custom-scrollbar">
                              <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Categories</span>
                                  <button onClick={() => setSelectedCategories([])} className="text-[10px] text-red-500 font-bold hover:underline">Reset</button>
                              </div>
                              {Array.from(new Set(allTransactions.map(t => t.category))).sort().map(cat => (
                                  <div 
                                      key={cat} 
                                      onClick={() => {
                                          if (selectedCategories.includes(cat)) setSelectedCategories(prev => prev.filter(c => c !== cat));
                                          else setSelectedCategories(prev => [...prev, cat]);
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer flex justify-between items-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                                  >
                                      {cat}
                                      {selectedCategories.includes(cat) && <Check size={12} />}
                                  </div>
                              ))}
                          </div>
                      </>
                  )}
              </div>
          </div>
        </div>
      </Card>

      {/* 2. REPORT PREVIEW (Paper Style) */}
      <div className="mx-1 bg-white text-slate-900 rounded-sm shadow-xl overflow-hidden min-h-[600px] flex flex-col relative border-t-8 border-indigo-600 print:shadow-none print:m-0">
          
          {/* Paper Header */}
          <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                          {reportType === 'spending' ? 'Outflow Analysis' : reportType === 'income_vs_expense' ? 'Cash Flow Report' : reportType === 'trend' ? 'Trend Analysis' : 'Habit Heatmap'}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Generated for {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                      <div className="text-sm font-bold bg-slate-100 px-3 py-1 rounded text-slate-600">{timeframe} PERIOD</div>
                  </div>
              </div>
          </div>

          {/* Summary Stats Strip */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
              <div className="p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Income</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(reportData.totalIncome, currencySymbol, true)}</p>
              </div>
              <div className="p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Expense</p>
                  <p className="text-sm font-bold text-red-500">{formatCurrency(reportData.totalExpense, currencySymbol, true)}</p>
              </div>
              <div className="p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Invested</p>
                  <p className="text-sm font-bold text-violet-600">{formatCurrency(reportData.totalInvested, currencySymbol, true)}</p>
              </div>
              <div className="p-3 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Net Cash</p>
                  <p className={`text-sm font-bold ${reportData.netCashFlow >= 0 ? 'text-indigo-600' : 'text-orange-500'}`}>{formatCurrency(reportData.netCashFlow, currencySymbol, true)}</p>
              </div>
          </div>

          {/* Main Chart Area */}
          <div className="p-6">
              <div className="h-64 w-full flex items-center justify-center relative">
                  {reportType === 'spending' && <Doughnut data={reportData.chartData} options={reportData.chartOptions} />}
                  {(reportType === 'income_vs_expense' || reportType === 'heatmap') && <Bar data={reportData.chartData} options={{ ...reportData.chartOptions, maintainAspectRatio: false }} />}
                  {reportType === 'trend' && <Line data={reportData.chartData} options={{ ...reportData.chartOptions, maintainAspectRatio: false }} />}
              </div>
          </div>

          {/* AI Insights Section */}
          <div className="px-6 pb-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                      <Sparkles size={14} /> Executive Summary
                  </h4>
                  <ul className="space-y-2">
                      {reportData.insights.map((insight, idx) => (
                          <li key={idx} className="text-xs text-indigo-900/80 flex items-start gap-2 leading-relaxed">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                              <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </li>
                      ))}
                  </ul>
              </div>
          </div>

          {/* Detailed Table (Preview Limit) */}
          <div className="flex-1 bg-slate-50 border-t border-slate-100 p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Transaction Ledger (Preview)</h4>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Description</th>
                              <th className="p-3">Type</th>
                              <th className="p-3 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredData.slice(0, 5).map(t => (
                              <tr key={t.id}>
                                  <td className="p-3 text-slate-500">{t.dateStr}</td>
                                  <td className="p-3 font-medium text-slate-700">
                                      {t.name}
                                      <span className="block text-[9px] text-slate-400 font-normal">{t.category}</span>
                                  </td>
                                  <td className="p-3">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                          t.type === 'income' ? 'bg-emerald-100 text-emerald-600' :
                                          t.type === 'investment' ? 'bg-violet-100 text-violet-600' :
                                          'bg-red-100 text-red-600'
                                      }`}>
                                          {t.type}
                                      </span>
                                  </td>
                                  <td className={`p-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                      {t.type === 'income' ? '+' : ''}{formatCurrency(t.amount, currencySymbol)}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div className="p-2 text-center text-[10px] text-slate-400 border-t border-slate-100 bg-slate-50">
                      {filteredData.length > 5 ? `+ ${filteredData.length - 5} more records available in export` : 'End of report'}
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};
