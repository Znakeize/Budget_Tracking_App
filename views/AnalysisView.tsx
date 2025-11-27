
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetData } from '../types';
import { Card } from '../components/ui/Card';
import { calculateTotals, formatCurrency } from '../utils/calculations';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
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
import { 
  TrendingUp, TrendingDown, LayoutGrid, DollarSign, CreditCard, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, PieChart, 
  Target, Shield, Download, Bell, ChevronLeft, Search, Filter,
  Lightbulb, AlertTriangle, FileText, Lock, ChevronRight, X,
  Briefcase, Home, Car, Coffee, Gift, ShoppingBag, BarChart, Sparkles, Clock,
  FileSpreadsheet, Table, CheckSquare, Square, ChevronDown, BellRing, RefreshCcw
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

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

const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, any> = {
    'Housing': Home,
    'Rent': Home,
    'Mortgage': Home,
    'Transport': Car,
    'Fuel': Car,
    'Food': Coffee,
    'Dining': Coffee,
    'Groceries': ShoppingBag,
    'Entertainment': Gift,
    'Shopping': ShoppingBag,
    'Utilities': ZapIcon,
    'Bills': FileText,
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ 
  history, 
  currencySymbol, 
  notificationCount, 
  onToggleNotifications, 
  onBack, 
  onProfileClick 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'cashflow' | 'planner' | 'reports' | 'tools'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // --- Reports State ---
  const [reportTimeframe, setReportTimeframe] = useState<'3m' | '6m' | 'ytd' | 'all'>('3m');
  const [selectedReportType, setSelectedReportType] = useState<'summary' | 'category' | 'comparison' | 'tax'>('summary');
  const [reportCategories, setReportCategories] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // --- Tools State ---
  const [alertSettings, setAlertSettings] = useState({
      thresholds: true,
      unusual: true,
      bills: true,
      balance: false,
      subs: false
  });

  // --- Data Processing ---
  const sortedHistory = useMemo(() => [...history].sort((a, b) => a.created - b.created), [history]);
  const currentPeriod = sortedHistory[sortedHistory.length - 1];
  const previousPeriod = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;
  
  const currentTotals = useMemo(() => calculateTotals(currentPeriod), [currentPeriod]);
  const prevTotals = useMemo(() => previousPeriod ? calculateTotals(previousPeriod) : null, [previousPeriod]);

  // Initialize report categories
  useEffect(() => {
      const allCats = Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name))));
      if (reportCategories.length === 0 && allCats.length > 0) {
          setReportCategories(allCats);
      }
  }, [history]);

  // --- Report Data Filtering ---
  const processedReportData = useMemo(() => {
      const now = new Date();
      let filteredHist = [...sortedHistory];

      if (reportTimeframe === '3m') filteredHist = filteredHist.slice(-3);
      if (reportTimeframe === '6m') filteredHist = filteredHist.slice(-6);
      if (reportTimeframe === 'ytd') filteredHist = filteredHist.filter(h => h.year === now.getFullYear());
      
      const allExpenses = filteredHist.flatMap(h => 
          h.expenses
            .filter(e => reportCategories.includes(e.name))
            .map(e => ({ ...e, period: `${MONTH_NAMES[h.month]} ${h.year}`, dateObj: h.created }))
      );

      return { history: filteredHist, expenses: allExpenses };
  }, [sortedHistory, reportTimeframe, reportCategories]);

  // --- Export Functions ---
  const getExportFilename = (ext: string) => `BudgetFlow_${selectedReportType}_${reportTimeframe}_${new Date().toISOString().split('T')[0]}.${ext}`;

  const generatePDF = () => {
      const doc = new jsPDF();
      const title = selectedReportType === 'summary' ? "Monthly & Annual Summary" :
                    selectedReportType === 'category' ? "Category Analysis Report" :
                    selectedReportType === 'comparison' ? "Income vs Expense Report" :
                    "Tax-Ready Expense Summary";
      
      doc.setFontSize(18);
      doc.text(title, 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Period: ${reportTimeframe.toUpperCase()}`, 20, 35);
      
      let y = 50;
      
      if (selectedReportType === 'summary' || selectedReportType === 'comparison') {
          processedReportData.history.forEach(h => {
              const t = calculateTotals(h);
              if (y > 270) { doc.addPage(); y = 20; }
              doc.setFontSize(12);
              doc.text(`${MONTH_NAMES[h.month]} ${h.year}`, 20, y);
              y += 7;
              doc.setFontSize(10);
              doc.text(`Income: ${currencySymbol}${t.totalIncome.toLocaleString()}`, 25, y);
              doc.text(`Expenses: ${currencySymbol}${t.totalExpenses.toLocaleString()}`, 80, y);
              doc.text(`Net: ${currencySymbol}${t.leftToSpend.toLocaleString()}`, 140, y);
              y += 10;
          });
      } else if (selectedReportType === 'category') {
          const catTotals: Record<string, number> = {};
          processedReportData.expenses.forEach(e => {
              catTotals[e.name] = (catTotals[e.name] || 0) + e.spent;
          });
          
          Object.entries(catTotals).forEach(([cat, amount]) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(`${cat}: ${currencySymbol}${amount.toLocaleString()}`, 20, y);
              y += 7;
          });
      } else if (selectedReportType === 'tax') {
          doc.text("Date", 20, y); doc.text("Category", 60, y); doc.text("Amount", 160, y);
          y += 5;
          doc.line(20, y, 190, y);
          y += 5;
          processedReportData.expenses.forEach(e => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(e.period, 20, y);
              doc.text(e.name, 60, y);
              doc.text(`${currencySymbol}${e.spent}`, 160, y);
              y += 7;
          });
      }
      
      doc.save(getExportFilename('pdf'));
  };

  const generateExcel = () => {
      const wb = XLSX.utils.book_new();
      let data: any[] = [];

      if (selectedReportType === 'summary' || selectedReportType === 'comparison') {
          data = processedReportData.history.map(h => {
              const t = calculateTotals(h);
              return { Period: `${MONTH_NAMES[h.month]} ${h.year}`, Income: t.totalIncome, Expenses: t.totalExpenses, Net: t.leftToSpend };
          });
      } else if (selectedReportType === 'category') {
          const catTotals: Record<string, number> = {};
          processedReportData.expenses.forEach(e => catTotals[e.name] = (catTotals[e.name] || 0) + e.spent);
          data = Object.entries(catTotals).map(([Category, Amount]) => ({ Category, Amount }));
      } else {
          data = processedReportData.expenses.map(e => ({ Period: e.period, Category: e.name, Amount: e.spent }));
      }

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, getExportFilename('xlsx'));
  };

  const generateCSV = () => {
      const wb = XLSX.utils.book_new();
      let data: any[] = [];
      if (selectedReportType === 'summary' || selectedReportType === 'comparison') {
          data = processedReportData.history.map(h => { const t = calculateTotals(h); return { Period: `${MONTH_NAMES[h.month]} ${h.year}`, Income: t.totalIncome, Expenses: t.totalExpenses, Net: t.leftToSpend }; });
      } else if (selectedReportType === 'category') {
          const catTotals: Record<string, number> = {};
          processedReportData.expenses.forEach(e => catTotals[e.name] = (catTotals[e.name] || 0) + e.spent);
          data = Object.entries(catTotals).map(([Category, Amount]) => ({ Category, Amount }));
      } else {
          data = processedReportData.expenses.map(e => ({ Period: e.period, Category: e.name, Amount: e.spent }));
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", getExportFilename('csv'));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Helpers for Charts ---
  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
      interaction: { mode: 'index' as const, intersect: false },
  };

  const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

  // --- 1. Overview Section Data ---
  const overviewData = {
      income: currentTotals.totalIncome,
      expenses: currentTotals.totalOut,
      net: currentTotals.leftToSpend,
      savingsRate: currentTotals.totalIncome > 0 ? ((currentTotals.totalSavings + currentTotals.totalInvestments) / currentTotals.totalIncome) * 100 : 0
  };

  const spendingVsIncomeData = {
      labels,
      datasets: [
          {
              label: 'Income',
              data: sortedHistory.map(h => calculateTotals(h).totalIncome),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
          },
          {
              label: 'Expenses',
              data: sortedHistory.map(h => calculateTotals(h).totalOut),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
          }
      ]
  };

  // Data for Overview Charts
  const overviewCategoryData = {
      labels: currentPeriod.expenses.map(e => e.name),
      datasets: [{
          data: currentPeriod.expenses.map(e => e.spent),
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'],
          borderWidth: 0,
      }]
  };

  const overviewCashFlowData = {
      labels: labels.slice(-6),
      datasets: [{
          label: 'Net Flow',
          data: sortedHistory.slice(-6).map(h => {
              const t = calculateTotals(h);
              return t.totalIncome - t.totalOut;
          }),
          backgroundColor: (ctx: any) => {
              const v = ctx.raw;
              return v >= 0 ? '#10b981' : '#ef4444';
          },
          borderRadius: 4
      }]
  };

  // --- 2. Income Section Data ---
  const incomeSourcesData = {
      labels: currentPeriod.income.map(i => i.name),
      datasets: [{
          data: currentPeriod.income.map(i => i.actual),
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
          borderWidth: 0
      }]
  };

  const incomeHistoryValues = useMemo(() => sortedHistory.map(h => calculateTotals(h).totalIncome), [sortedHistory]);

  const avgIncome = useMemo(() => incomeHistoryValues.reduce((a, b) => a + b, 0) / (incomeHistoryValues.length || 1), [incomeHistoryValues]);

  const incomeGrowthRate = useMemo(() => {
      if (incomeHistoryValues.length < 2) return 0;
      let sumPct = 0;
      let count = 0;
      for(let i=1; i<incomeHistoryValues.length; i++) {
          const prev = incomeHistoryValues[i-1];
          if(prev > 0) {
              sumPct += (incomeHistoryValues[i] - prev) / prev;
              count++;
          }
      }
      return count > 0 ? (sumPct / count) * 100 : 0;
  }, [incomeHistoryValues]);

  const incomeStdDev = useMemo(() => {
      if (incomeHistoryValues.length < 2) return 0;
      const mean = avgIncome;
      const variance = incomeHistoryValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / incomeHistoryValues.length;
      return Math.sqrt(variance);
  }, [incomeHistoryValues, avgIncome]);

  const incomeStabilityLabel = useMemo(() => {
      if (avgIncome === 0) return 'N/A';
      const cv = incomeStdDev / avgIncome; // Coefficient of Variation
      if (cv < 0.1) return 'High';
      if (cv < 0.25) return 'Medium';
      return 'Low';
  }, [incomeStdDev, avgIncome]);

  const incomeTrendChartData = {
      labels,
      datasets: [{
          label: 'Total Income',
          data: incomeHistoryValues,
          borderColor: '#10b981',
          backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
              gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
              return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#10b981',
          pointBorderWidth: 2
      }]
  };

  // --- 3. Expense Section Data ---
  const expenseCategoriesData = {
      labels: currentPeriod.expenses.map(e => e.name),
      datasets: [{
          data: currentPeriod.expenses.map(e => e.spent),
          backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'],
          borderWidth: 0,
          borderRadius: 4
      }]
  };

  // Comparison Logic
  const totalSpent = currentTotals.totalExpenses;
  const prevSpent = prevTotals ? prevTotals.totalExpenses : 0;
  const diffSpent = totalSpent - prevSpent;
  const pctChangeSpent = prevSpent > 0 ? (diffSpent / prevSpent) * 100 : 0;
  const dailyAvg = totalSpent / 30; // Approx

  const expenseTrendData = {
      labels,
      datasets: [{
          label: 'Monthly Expenses',
          data: sortedHistory.map(h => calculateTotals(h).totalExpenses),
          borderColor: '#a855f7', // Purple
          backgroundColor: (context: any) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 200);
              gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
              gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
              return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 3
      }]
  };

  // AI Suggestions Logic (Mocked based on data)
  const topCategory = [...currentPeriod.expenses].sort((a,b) => b.spent - a.spent)[0];
  const recurringTotal = currentPeriod.bills.reduce((s, b) => s + b.amount, 0) + 
                         currentPeriod.expenses.filter(e => /sub|netflix|spotify|internet/i.test(e.name)).reduce((s, e) => s + e.spent, 0);
  const recurringPct = currentTotals.totalOut > 0 ? (recurringTotal / currentTotals.totalOut) * 100 : 0;

  // --- 4. Cash Flow Data ---
  const cashFlowData = {
      labels,
      datasets: [{
          label: 'Net Flow',
          data: sortedHistory.map(h => {
              const t = calculateTotals(h);
              return t.totalIncome - t.totalOut;
          }),
          backgroundColor: (ctx: any) => {
              const v = ctx.raw;
              return v >= 0 ? '#10b981' : '#ef4444';
          },
          borderRadius: 4
      }]
  };

  const cumulativeSavingsData = {
      labels,
      datasets: [{
          label: 'Cumulative Savings',
          data: sortedHistory.reduce((acc: number[], h) => {
              const t = calculateTotals(h);
              const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
              acc.push(prev + t.totalSavings + t.totalInvestments);
              return acc;
          }, []),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
      }]
  };

  // --- Render Components ---

  const renderReports = () => {
      // Toggle category selection
      const toggleCategory = (cat: string) => {
          if (reportCategories.includes(cat)) {
              setReportCategories(reportCategories.filter(c => c !== cat));
          } else {
              setReportCategories([...reportCategories, cat]);
          }
      };

      const selectAllCats = () => {
          const allCats = Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name))));
          setReportCategories(allCats);
      };

      const clearAllCats = () => setReportCategories([]);

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {/* Configuration Card */}
              <Card className="p-4 bg-white dark:bg-slate-800" overflowHidden={false}>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                      <Filter size={16} className="text-indigo-500" /> Report Configuration
                  </h3>
                  
                  <div className="space-y-4">
                      {/* Timeframe Selector */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Date Range</label>
                          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                              {['3m', '6m', 'ytd', 'all'].map(tf => (
                                  <button
                                      key={tf}
                                      onClick={() => setReportTimeframe(tf as any)}
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${reportTimeframe === tf ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                  >
                                      {tf === '3m' ? '3 Months' : tf === '6m' ? '6 Months' : tf === 'ytd' ? 'Year to Date' : 'All Time'}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Category Filter */}
                      <div className="relative z-50">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Categories Included</label>
                          <button 
                              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                          >
                              <span className="text-slate-700 dark:text-slate-300">
                                  {reportCategories.length === 0 ? 'No categories selected' : reportCategories.length === Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name)))).length ? 'All Categories Selected' : `${reportCategories.length} Selected`}
                              </span>
                              <ChevronDown size={16} className={`transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isCatDropdownOpen && (
                              <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 max-h-60 overflow-y-auto custom-scrollbar">
                                  <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                      <button onClick={selectAllCats} className="text-xs font-bold text-indigo-600">Select All</button>
                                      <button onClick={clearAllCats} className="text-xs font-bold text-slate-400">Clear</button>
                                  </div>
                                  <div className="space-y-1">
                                      {Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name)))).map(cat => (
                                          <div key={cat} onClick={() => toggleCategory(cat)} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                                              {reportCategories.includes(cat) ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                                              <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </Card>

              {/* Report Types Grid */}
              <div className="grid grid-cols-2 gap-3">
                  {[
                      { id: 'summary', label: 'Monthly Summary', icon: FileText, desc: 'Income, Expenses, Net P&L' },
                      { id: 'category', label: 'Category Analysis', icon: PieChart, desc: 'Detailed spending breakdown' },
                      { id: 'comparison', label: 'Income vs Expense', icon: TrendingUp, desc: 'Trend comparison chart' },
                      { id: 'tax', label: 'Tax-Ready Export', icon: Table, desc: 'Clean expense list for tax' }
                  ].map((rpt) => (
                      <div 
                          key={rpt.id}
                          onClick={() => setSelectedReportType(rpt.id as any)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedReportType === rpt.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'}`}
                      >
                          <rpt.icon size={24} className={`mb-2 ${selectedReportType === rpt.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <h4 className={`text-sm font-bold ${selectedReportType === rpt.id ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{rpt.label}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">{rpt.desc}</p>
                      </div>
                  ))}
              </div>

              {/* Full Detail Preview Area */}
              <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[400px]">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Report Preview</h4>
                      <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {selectedReportType === 'summary' || selectedReportType === 'comparison' 
                              ? `${processedReportData.history.length} Periods` 
                              : `${processedReportData.expenses.length} Records`}
                      </span>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-slate-900">
                      {/* Summary Report Table */}
                      {selectedReportType === 'summary' && (
                          <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-bold sticky top-0 z-10">
                                  <tr>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Period</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Income</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Expenses</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Net</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {processedReportData.history.length > 0 ? processedReportData.history.map(h => {
                                      const t = calculateTotals(h);
                                      return (
                                          <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{h.period === 'monthly' ? MONTH_NAMES[h.month] : h.period} {h.year}</td>
                                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(t.totalIncome, currencySymbol)}</td>
                                              <td className="p-3 text-right text-red-500 dark:text-red-400">{formatCurrency(t.totalExpenses, currencySymbol)}</td>
                                              <td className={`p-3 text-right font-bold ${t.leftToSpend >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                                                  {formatCurrency(t.leftToSpend, currencySymbol)}
                                              </td>
                                          </tr>
                                      );
                                  }) : (
                                      <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">No data found for this range.</td></tr>
                                  )}
                                  {/* Total Row */}
                                  {processedReportData.history.length > 0 && (
                                      <tr className="bg-slate-50 dark:bg-slate-800 font-bold">
                                          <td className="p-3 text-slate-900 dark:text-white">TOTAL</td>
                                          <td className="p-3 text-right text-emerald-700 dark:text-emerald-300">
                                              {formatCurrency(processedReportData.history.reduce((s, h) => s + calculateTotals(h).totalIncome, 0), currencySymbol)}
                                          </td>
                                          <td className="p-3 text-right text-red-700 dark:text-red-300">
                                              {formatCurrency(processedReportData.history.reduce((s, h) => s + calculateTotals(h).totalExpenses, 0), currencySymbol)}
                                          </td>
                                          <td className="p-3 text-right text-indigo-700 dark:text-indigo-300">
                                              {formatCurrency(processedReportData.history.reduce((s, h) => s + calculateTotals(h).leftToSpend, 0), currencySymbol)}
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      )}

                      {/* Category Report Table */}
                      {selectedReportType === 'category' && (
                          <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-bold sticky top-0 z-10">
                                  <tr>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Category</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">Txns</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Total Spent</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">%</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {(() => {
                                      const catTotals: Record<string, {amount: number, count: number}> = {};
                                      let grandTotal = 0;
                                      processedReportData.expenses.forEach(e => {
                                          if (!catTotals[e.name]) catTotals[e.name] = { amount: 0, count: 0 };
                                          catTotals[e.name].amount += e.spent;
                                          catTotals[e.name].count += 1;
                                          grandTotal += e.spent;
                                      });
                                      const sortedCats = Object.entries(catTotals).sort((a, b) => b[1].amount - a[1].amount);

                                      if (sortedCats.length === 0) return <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">No expenses found.</td></tr>;

                                      return sortedCats.map(([cat, data], i) => (
                                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                  {cat}
                                              </td>
                                              <td className="p-3 text-center text-slate-500 dark:text-slate-400">{data.count}</td>
                                              <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(data.amount, currencySymbol)}</td>
                                              <td className="p-3 text-right text-slate-500 dark:text-slate-400">
                                                  {grandTotal > 0 ? ((data.amount / grandTotal) * 100).toFixed(1) : 0}%
                                              </td>
                                          </tr>
                                      ));
                                  })()}
                              </tbody>
                          </table>
                      )}

                      {/* Comparison Report Table */}
                      {selectedReportType === 'comparison' && (
                          <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-bold sticky top-0 z-10">
                                  <tr>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Period</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">In</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Out</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Diff</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {processedReportData.history.map(h => {
                                      const t = calculateTotals(h);
                                      const diff = t.totalIncome - t.totalExpenses;
                                      return (
                                          <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{MONTH_NAMES[h.month].substring(0,3)} '{h.year.toString().slice(-2)}</td>
                                              <td className="p-3 text-right text-slate-500">{formatCurrency(t.totalIncome, currencySymbol)}</td>
                                              <td className="p-3 text-right text-slate-500">{formatCurrency(t.totalExpenses, currencySymbol)}</td>
                                              <td className={`p-3 text-right font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                  {diff >= 0 ? '+' : ''}{formatCurrency(diff, currencySymbol)}
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      )}

                      {/* Tax-Ready Report Table */}
                      {selectedReportType === 'tax' && (
                          <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 font-bold sticky top-0 z-10">
                                  <tr>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Date</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Description</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700">Category</th>
                                      <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Amount</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {processedReportData.expenses.length > 0 ? processedReportData.expenses.map((e, i) => (
                                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                          <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                              {new Date(e.dateObj).toLocaleDateString()}
                                          </td>
                                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                                              {e.name} Expense
                                          </td>
                                          <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                                              {e.name}
                                          </td>
                                          <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                                              {formatCurrency(e.spent, currencySymbol)}
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">No expenses match filter.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      )}
                  </div>
              </Card>

              {/* Action Bar */}
              <div className="fixed bottom-24 left-4 right-4 z-30">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex gap-2">
                      <button onClick={generatePDF} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                          <FileText size={18} /> PDF
                      </button>
                      <button onClick={generateExcel} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                          <FileSpreadsheet size={18} /> Excel
                      </button>
                      <button onClick={generateCSV} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
                          <Table size={18} /> CSV
                      </button>
                  </div>
              </div>
              <div className="h-16"></div> {/* Spacer for fixed bar */}
          </div>
      );
  };

  const renderTools = () => {
      const toggleAlert = (key: keyof typeof alertSettings) => {
          setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
      };

      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                        <BellRing size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Intelligent Alerts</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure how AI notifies you about your finances.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <PieChart size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Budget Thresholds</h4>
                                <p className="text-xs text-slate-500 leading-snug">Get notified when you hit 80% and 100% of category limits.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.thresholds} onChange={() => toggleAlert('thresholds')} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <Activity size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unusual Spending</h4>
                                <p className="text-xs text-slate-500 leading-snug">Detect anomalies or double charges instantly.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.unusual} onChange={() => toggleAlert('unusual')} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <FileText size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bill Reminders</h4>
                                <p className="text-xs text-slate-500 leading-snug">Receive alerts 3 days before recurring bills are due.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.bills} onChange={() => toggleAlert('bills')} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <TrendingDown size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Low Balance Forecast</h4>
                                <p className="text-xs text-slate-500 leading-snug">Predicts potential overdrafts based on spending trends.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.balance} onChange={() => toggleAlert('balance')} />
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <RefreshCcw size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Subscription Monitor</h4>
                                <p className="text-xs text-slate-500 leading-snug">Alert on price hikes for existing subscriptions.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.subs} onChange={() => toggleAlert('subs')} />
                    </div>
                </div>
            </Card>
        </div>
      );
  };

  const renderOverview = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          {/* Top Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
                  <div className="flex items-center gap-2 mb-1 opacity-80">
                      <ArrowUpRight size={14} /> <span className="text-xs font-bold uppercase">Income</span>
                  </div>
                  <div className="text-xl font-bold truncate">{formatCurrency(overviewData.income, currencySymbol)}</div>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-red-500 to-pink-600 text-white border-none">
                  <div className="flex items-center gap-2 mb-1 opacity-80">
                      <ArrowDownRight size={14} /> <span className="text-xs font-bold uppercase">Expenses</span>
                  </div>
                  <div className="text-xl font-bold truncate">{formatCurrency(overviewData.expenses, currencySymbol)}</div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Net Balance</div>
                  <div className={`text-xl font-bold ${overviewData.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(overviewData.net, currencySymbol)}
                  </div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Savings Rate</div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {overviewData.savingsRate.toFixed(1)}%
                  </div>
              </Card>
          </div>

          {/* Main Visual */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Income vs Spending Trend</h3>
              <div className="h-48">
                  <Line data={spendingVsIncomeData} options={chartOptions} />
              </div>
          </Card>

          {/* Charts: Category Breakdown & Recent Cash Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Category Breakdown</h3>
                  <div className="h-48 relative flex justify-center">
                      <Pie 
                          data={overviewCategoryData} 
                          options={{
                              maintainAspectRatio: false,
                              plugins: { 
                                  legend: { 
                                      position: 'right', 
                                      labels: { boxWidth: 10, font: { size: 10 }, color: '#94a3b8' } 
                                  } 
                              }
                          }} 
                      />
                  </div>
              </Card>

              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Cash Flow (Last 6 Mo)</h3>
                  <div className="h-48">
                      <Bar 
                          data={overviewCashFlowData} 
                          options={chartOptions} 
                      />
                  </div>
              </Card>
          </div>

          {/* Insights */}
          <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-500" /> Smart Insights
              </h3>
              {prevTotals && (
                  <>
                      {currentTotals.totalExpenses > prevTotals.totalExpenses ? (
                          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-xs text-red-700 dark:text-red-300">
                              Your total expenses increased by <strong>{Math.round(((currentTotals.totalExpenses - prevTotals.totalExpenses) / prevTotals.totalExpenses) * 100)}%</strong> from last period.
                          </div>
                      ) : (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                              Great job! You spent <strong>{Math.round(((prevTotals.totalExpenses - currentTotals.totalExpenses) / prevTotals.totalExpenses) * 100)}%</strong> less than last period.
                          </div>
                      )}
                      {overviewData.savingsRate > 20 && (
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
                              You saved <strong>{overviewData.savingsRate.toFixed(0)}%</strong> of your income this month — keep it up!
                          </div>
                      )}
                  </>
              )}
          </div>
      </div>
  );

  const renderIncome = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 flex flex-col justify-center bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Avg Monthly</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(avgIncome, currencySymbol)}
                  </div>
              </Card>
              <Card className="p-3 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Growth Rate</span>
                  <div className={`text-sm font-bold mt-1 ${incomeGrowthRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {incomeGrowthRate >= 0 ? '+' : ''}{incomeGrowthRate.toFixed(1)}%
                  </div>
              </Card>
              <Card className="p-3 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Stability</span>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {incomeStabilityLabel}
                  </div>
                  <div className="text-[9px] text-slate-400">
                      ±{formatCurrency(incomeStdDev, currencySymbol)}
                  </div>
              </Card>
          </div>

          {/* Income Trend Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Monthly Income Trend
              </h3>
              <div className="h-48 relative">
                  <Line 
                      data={incomeTrendChartData}
                      options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                              x: { display: false },
                              y: { display: true, ticks: { callback: (v) => `${v}`.substring(0,3)+'..' } }
                          }
                      }}
                  />
              </div>
          </Card>

          {/* Income Sources Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Current Sources</h3>
              <div className="h-48 relative">
                  <Doughnut 
                      data={incomeSourcesData} 
                      options={{ 
                          maintainAspectRatio: false, 
                          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
                          cutout: '70%'
                      }} 
                  />
              </div>
          </Card>

          {/* Details List */}
          <Card className="p-0 overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-500 uppercase">
                  Details
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentPeriod.income.map((inc) => (
                      <div key={inc.id} className="p-3 flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{inc.name}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(inc.actual, currencySymbol)}</span>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
  );

  const renderExpenses = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          
          {/* 1. Comparison Section */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Spent (Mo)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(totalSpent, currencySymbol)}
                  </div>
                  {prevSpent > 0 && (
                      <div className={`text-[10px] font-bold mt-1 ${pctChangeSpent > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {pctChangeSpent > 0 ? '+' : ''}{pctChangeSpent.toFixed(1)}% vs Last Month
                      </div>
                  )}
              </Card>
              <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Daily Average</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(dailyAvg, currencySymbol)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                      Est. {formatCurrency(dailyAvg * 30, currencySymbol)} / mo
                  </div>
              </Card>
          </div>

          {/* 2. Expense Trends Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-purple-500" /> Monthly Expense Trend
              </h3>
              <div className="h-48 relative">
                  <Line 
                      data={expenseTrendData}
                      options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                              x: { display: false },
                              y: { display: true, ticks: { callback: (v) => `${v}`.substring(0,3)+'..' } }
                          }
                      }}
                  />
              </div>
          </Card>

          {/* 3. AI Suggestions */}
          <Card className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-500/20">
              <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">AI Spending Insights</h3>
              </div>
              <div className="space-y-3">
                  {topCategory ? (
                      <div className="flex gap-3 items-start p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          <div className="mt-0.5"><TrendingDown size={14} className="text-emerald-500" /></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              "Reduce <span className="font-bold">{topCategory.name}</span> cost by 8% to reach your monthly savings goal."
                          </p>
                      </div>
                  ) : (
                      <div className="flex gap-3 items-start p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          <div className="mt-0.5"><TrendingDown size={14} className="text-emerald-500" /></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              "Track your expenses to get personalized saving tips."
                          </p>
                      </div>
                  )}
                  
                  {recurringTotal > 0 && (
                      <div className="flex gap-3 items-start p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          <div className="mt-0.5"><Clock size={14} className="text-orange-500" /></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              "Your recurring subscriptions make up <span className="font-bold">{Math.round(recurringPct)}%</span> of total expenses."
                          </p>
                      </div>
                  )}
              </div>
          </Card>

          {/* 4. Category Breakdown (Existing) */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Detailed Breakdown</h3>
              <div className="h-48">
                  <Bar 
                      data={expenseCategoriesData} 
                      options={{
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          indexAxis: 'y' as const,
                          scales: {
                              x: { display: false },
                              y: { ticks: { font: { size: 10 }, color: '#64748b' } }
                          }
                      }}
                  />
              </div>
          </Card>

          <div className="grid grid-cols-1 gap-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase ml-1">Top Categories</h3>
              {currentPeriod.expenses.map((exp) => {
                  const Icon = CATEGORY_ICONS[exp.name] || ShoppingBag;
                  const ratio = exp.budgeted > 0 ? exp.spent / exp.budgeted : 0;
                  const percent = Math.round(ratio * 100);
                  
                  return (
                      <Card 
                          key={exp.id} 
                          className="p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                          onClick={() => setSelectedCategory(exp.name)}
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                  <Icon size={18} />
                              </div>
                              <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">{exp.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                      {formatCurrency(exp.spent, currencySymbol)} / {formatCurrency(exp.budgeted, currencySymbol)}
                                  </div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className={`text-sm font-bold ${percent > 100 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {percent}%
                              </div>
                              <ChevronRight size={14} className="ml-auto text-slate-300" />
                          </div>
                      </Card>
                  );
              })}
          </div>
      </div>
  );

  const renderCashFlow = () => {
      const last3Months = sortedHistory.slice(-3);
      const avgCashFlow3Mo = last3Months.reduce((acc, h) => {
          const t = calculateTotals(h);
          return acc + (t.totalIncome - t.totalOut);
      }, 0) / (last3Months.length || 1);

      const inflowOutflowData = {
          labels,
          datasets: [
              {
                  label: 'Inflow',
                  data: sortedHistory.map(h => calculateTotals(h).totalIncome),
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  fill: false,
                  tension: 0.4,
                  pointRadius: 2
              },
              {
                  label: 'Outflow',
                  data: sortedHistory.map(h => calculateTotals(h).totalOut),
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  fill: false,
                  tension: 0.4,
                  pointRadius: 2
              }
          ]
      };

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Cash Inflow vs Outflow</h3>
              <div className="h-48">
                  <Line data={inflowOutflowData} options={chartOptions} />
              </div>
          </Card>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Net Cash Flow Trend</h3>
              <div className="h-48">
                  <Bar data={cashFlowData} options={chartOptions} />
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">Inflow minus Outflow per period</p>
          </Card>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Cumulative Savings</h3>
              <div className="h-48">
                  <Line data={cumulativeSavingsData} options={chartOptions} />
              </div>
          </Card>

          {/* Insights */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Best Month</span>
                  <div className="font-bold text-slate-900 dark:text-white">Mar 2025</div>
                  <div className="text-[10px] text-emerald-500">+ {formatCurrency(2500, currencySymbol)}</div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800 border-l-4 border-l-orange-500">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">High Expense</span>
                  <div className="font-bold text-slate-900 dark:text-white">Dec 2024</div>
                  <div className="text-[10px] text-orange-500">Holiday Season</div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500 col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">3-Month Avg Cash Flow</span>
                  <div className={`font-bold ${avgCashFlow3Mo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {avgCashFlow3Mo >= 0 ? '+' : ''}{formatCurrency(avgCashFlow3Mo, currencySymbol)}
                  </div>
                  <div className="text-[10px] text-slate-400">Moving average of recent surplus/deficit</div>
              </Card>
          </div>
      </div>
  )};

  const renderPlanner = () => {
      const topGoals = [...currentPeriod.goals]
          .sort((a, b) => b.target - a.target)
          .slice(0, 3);

      const ringsData = {
          labels: ['Saved', 'Remaining'],
          datasets: topGoals.map((goal, index) => ({
              label: goal.name,
              data: [goal.current, Math.max(0, goal.target - goal.current)],
              backgroundColor: [
                  ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'][index],
                  'rgba(148, 163, 184, 0.1)'
              ],
              borderWidth: 0,
              borderRadius: 4,
              cutout: '40%',
          }))
      };

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          
          {/* Progress Rings */}
          {topGoals.length > 0 && (
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Target size={16} className="text-indigo-500" /> Goal Progress Rings
                  </h3>
                  <div className="h-48 relative flex items-center justify-center">
                      <Doughnut 
                          data={ringsData} 
                          options={{
                              maintainAspectRatio: false,
                              cutout: '50%',
                              plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                      callbacks: {
                                          label: function(context: any) {
                                              if (context.dataIndex === 1) return '';
                                              const label = context.dataset.label;
                                              const val = context.raw;
                                              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                                              const pct = Math.round((val / total) * 100);
                                              return `${label}: ${formatCurrency(val, currencySymbol)} (${pct}%)`;
                                          }
                                      },
                                      filter: (item) => item.dataIndex === 0 
                                  }
                              }
                          }} 
                      />
                      {/* Legend Overlay */}
                      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-2 pr-2">
                          {topGoals.map((g, i) => (
                              <div key={g.id} className="flex items-center gap-1.5 text-[10px]">
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#6366f1', '#10b981', '#f59e0b'][i]}}></div>
                                  <span className="text-slate-600 dark:text-slate-300 max-w-[80px] truncate">{g.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </Card>
          )}

          {/* Goal Tracker */}
          <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Savings Goals</h3>
              <div className="space-y-3">
                  {currentPeriod.goals.map(goal => {
                      const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                      return (
                          <Card key={goal.id} className="p-4">
                              <div className="flex justify-between mb-2">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">{goal.name}</span>
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500">
                                  <span>{formatCurrency(goal.current, currencySymbol)}</span>
                                  <span>Target: {formatCurrency(goal.target, currencySymbol)}</span>
                              </div>
                          </Card>
                      );
                  })}
              </div>
          </div>

          {/* Smart Forecast */}
          <Card className="p-4 bg-slate-900 text-white border-none">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-fuchsia-400" /> AI Forecast (Next 3 Months)
              </h3>
              <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                      <span className="opacity-70">Predicted Avg Expense</span>
                      <span className="font-bold text-red-300">~{formatCurrency(currentTotals.totalOut * 1.05, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                      <span className="opacity-70">Estimated Savings</span>
                      <span className="font-bold text-emerald-300">~{formatCurrency(currentTotals.leftToSpend * 0.9, currencySymbol)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 text-[10px] opacity-60 italic">
                      "Expenses trending up by 5%. Consider reducing subscription costs to maintain savings rate."
                  </div>
              </div>
          </Card>
      </div>
  )};

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Intelligence</h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Deep Analysis</h1>
                    </div>
                </div>
                <div className="pb-1 flex items-center gap-1">
                    <button 
                        onClick={onToggleNotifications}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        <Bell size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" />
                        {notificationCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </button>
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0 -mx-4 px-4">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'income', label: 'Income', icon: DollarSign },
                    { id: 'expenses', label: 'Expenses', icon: CreditCard },
                    { id: 'cashflow', label: 'Cash Flow', icon: Activity },
                    { id: 'planner', label: 'Planner', icon: Target },
                    { id: 'reports', label: 'Reports', icon: FileText },
                    { id: 'tools', label: 'Tools', icon: Shield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[70px] py-2 text-[10px] font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'overview' && renderOverview()}
           {activeTab === 'income' && renderIncome()}
           {activeTab === 'expenses' && renderExpenses()}
           {activeTab === 'cashflow' && renderCashFlow()}
           {activeTab === 'planner' && renderPlanner()}
           {activeTab === 'reports' && renderReports()}
           {activeTab === 'tools' && renderTools()}
       </div>

       {/* Category Deep Dive Modal */}
       {selectedCategory && (
           <CategoryDeepDiveModal 
               isOpen={!!selectedCategory}
               onClose={() => setSelectedCategory(null)}
               categoryName={selectedCategory}
               history={history}
               currencySymbol={currencySymbol}
           />
       )}
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

const CategoryDeepDiveModal = ({ isOpen, onClose, categoryName, history, currencySymbol }: any) => {
    if (!isOpen) return null;

    // Process data for this category across history
    const trendData = history.map((h: any) => {
        const item = h.expenses.find((e: any) => e.name === categoryName);
        return item ? item.spent : 0;
    }).reverse(); // Assume history is sorted new -> old, so reverse for chart

    const labels = history.map((h: any) => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0,3) : 'Pd').reverse();

    const avgSpend = trendData.reduce((a: number, b: number) => a + b, 0) / (trendData.length || 1);
    const lastSpend = trendData[trendData.length - 1];
    
    // Simulate merchant breakdown
    const merchants = [
        { name: 'Store A', amount: lastSpend * 0.4 },
        { name: 'Store B', amount: lastSpend * 0.3 },
        { name: 'Online', amount: lastSpend * 0.2 },
        { name: 'Other', amount: lastSpend * 0.1 },
    ];

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 overflow-y-auto flex flex-col">
                <div className="flex items-start justify-between mb-6 shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white break-words leading-tight">{categoryName}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">Deep Dive Analysis</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0">
                        <X size={24}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Spend</span>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(avgSpend, currencySymbol)}</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Frequency</span>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">~4x / mo</div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Spending Trend (6 Months)</h4>
                        <div className="h-40">
                            <Line 
                                data={{
                                    labels,
                                    datasets: [{
                                        label: 'Spend',
                                        data: trendData,
                                        borderColor: '#6366f1',
                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                        fill: true,
                                        tension: 0.4
                                    }]
                                }} 
                                options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} 
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Top Merchants (Est.)</h4>
                        <div className="space-y-2">
                            {merchants.map((m, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">{m.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${(m.amount / (lastSpend || 1)) * 100}%` }}></div>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white w-16 text-right">{formatCurrency(m.amount, currencySymbol)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mt-6 mb-8">
                        <div className="flex gap-3 items-start">
                            <Lightbulb size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                 <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                    <strong>Smart Tip:</strong> You spend 15% more on {categoryName} on weekends. Try shifting some purchases to weekdays to avoid peak pricing or impulse buys.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
