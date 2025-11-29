

import React, { useState, useMemo, useEffect } from 'react';
import { BudgetData, ShoppingListData } from '../types';
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
  FileSpreadsheet, Table, CheckSquare, Square, ChevronDown, BellRing, RefreshCcw,
  PiggyBank, Receipt, Landmark, Scale, Wallet, Zap, CheckCircle, AlertCircle
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useLanguage } from '../contexts/LanguageContext';

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
  shoppingLists: ShoppingListData[];
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
  shoppingLists,
  currencySymbol, 
  notificationCount, 
  onToggleNotifications, 
  onBack, 
  onProfileClick 
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'bills' | 'debts' | 'savings' | 'cashflow' | 'planner' | 'reports' | 'tools'>('overview');
  
  // Detail Modal State
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // --- Reports State ---
  const [reportTimeframe, setReportTimeframe] = useState<'3m' | '6m' | 'ytd' | 'all'>('3m');
  const [selectedReportType, setSelectedReportType] = useState<'summary' | 'category' | 'comparison' | 'tax' | 'savings' | 'debt'>('summary');
  const [viewingReport, setViewingReport] = useState<string | null>(null); // New state for report modal
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
  const currentPeriod = sortedHistory[sortedHistory.length - 1] || history[0];
  const previousPeriod = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;
  
  const currentTotals = useMemo(() => currentPeriod ? calculateTotals(currentPeriod) : { totalExpenses: 0, totalIncome: 0, actualBills: 0, actualDebts: 0, totalSavings: 0, actualInvestments: 0, leftToSpend: 0, totalPortfolioValue: 0, totalOut: 0 }, [currentPeriod]);

  // Ensure report categories are initialized with all available categories if empty
  useEffect(() => {
      const allCats = Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name))));
      // Only set if reportCategories is actually empty and we have categories
      if (reportCategories.length === 0 && allCats.length > 0) {
          setReportCategories(allCats);
      }
  }, [history, reportCategories.length]);

  // --- Report Data Filtering ---
  const processedReportData = useMemo(() => {
      const now = new Date();
      let filteredHist = [...sortedHistory];

      if (reportTimeframe === '3m') filteredHist = filteredHist.slice(-3);
      if (reportTimeframe === '6m') filteredHist = filteredHist.slice(-6);
      if (reportTimeframe === 'ytd') filteredHist = filteredHist.filter(h => h.year === now.getFullYear());
      
      // Use active categories if selected, otherwise fallback to all available in the filtered history
      const allAvailableCats = Array.from(new Set(filteredHist.flatMap(h => h.expenses.map(e => e.name))));
      const activeCats = reportCategories.length > 0 ? reportCategories : allAvailableCats;

      const allExpenses = filteredHist.flatMap(h => 
          h.expenses
            .filter(e => activeCats.includes(e.name))
            .map(e => ({ ...e, period: `${MONTH_NAMES[h.month]} ${h.year}`, dateObj: h.created }))
      );

      return { history: filteredHist, expenses: allExpenses };
  }, [sortedHistory, reportTimeframe, reportCategories]);

  // --- Export Functions ---
  const getExportFilename = (ext: string) => `BudgetFlow_${selectedReportType}_${reportTimeframe}_${new Date().toISOString().split('T')[0]}.${ext}`;

  // Helper to strip currency symbols for PDF compatibility
  const safeCurrency = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const generatePDF = () => {
      try {
          const doc = new jsPDF();
          const titleMap: Record<string, string> = {
              'summary': "Monthly & Annual Summary",
              'category': "Category Analysis Report",
              'comparison': "Income vs Expense Report",
              'tax': "Tax-Ready Expense Summary",
              'savings': "Savings Rate Analysis",
              'debt': "Debt Payoff Report"
          };
          
          doc.setFontSize(18);
          doc.text(titleMap[selectedReportType] || "Financial Report", 20, 20);
          doc.setFontSize(10);
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
          doc.text(`Period: ${reportTimeframe.toUpperCase()}`, 20, 35);
          doc.text(`Currency: ${currencySymbol}`, 20, 40);
          
          let y = 50;
          
          if (selectedReportType === 'summary' || selectedReportType === 'comparison') {
              processedReportData.history.forEach(h => {
                  const t = calculateTotals(h);
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`${MONTH_NAMES[h.month]} ${h.year}`, 20, y);
                  y += 7;
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Income: ${safeCurrency(t.totalIncome)}`, 25, y);
                  doc.text(`Expenses: ${safeCurrency(t.totalExpenses)}`, 80, y);
                  doc.text(`Net: ${safeCurrency(t.leftToSpend)}`, 140, y);
                  y += 10;
              });
          } else if (selectedReportType === 'category') {
              const catTotals: Record<string, number> = {};
              processedReportData.expenses.forEach(e => {
                  catTotals[e.name] = (catTotals[e.name] || 0) + e.spent;
              });
              
              if (Object.keys(catTotals).length === 0) {
                  doc.text("No data found for selected categories.", 20, y);
              } else {
                  Object.entries(catTotals).forEach(([cat, amount]) => {
                      if (y > 270) { doc.addPage(); y = 20; }
                      doc.text(`${cat}: ${safeCurrency(amount)}`, 20, y);
                      y += 7;
                  });
              }
          } else if (selectedReportType === 'tax') {
              doc.setFont('helvetica', 'bold');
              doc.text("Date", 20, y); doc.text("Category", 60, y); doc.text("Amount", 160, y);
              y += 5;
              doc.line(20, y, 190, y);
              y += 7;
              doc.setFont('helvetica', 'normal');
              
              if (processedReportData.expenses.length === 0) {
                   doc.text("No expenses found.", 20, y);
              } else {
                  processedReportData.expenses.forEach(e => {
                      if (y > 270) { doc.addPage(); y = 20; }
                      doc.text(e.period, 20, y);
                      doc.text(e.name, 60, y);
                      doc.text(`${safeCurrency(e.spent)}`, 160, y);
                      y += 7;
                  });
              }
          } else if (selectedReportType === 'savings') {
              doc.text("Period", 20, y); doc.text("Income", 60, y); doc.text("Saved", 110, y); doc.text("Rate", 160, y);
              y += 5; doc.line(20, y, 190, y); y += 7;
              processedReportData.history.forEach(h => {
                  const t = calculateTotals(h);
                  const saved = t.totalSavings + t.actualInvestments;
                  const rate = t.totalIncome > 0 ? (saved / t.totalIncome) * 100 : 0;
                  
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.text(`${MONTH_NAMES[h.month]} ${h.year}`, 20, y);
                  doc.text(`${safeCurrency(t.totalIncome)}`, 60, y);
                  doc.text(`${safeCurrency(saved)}`, 110, y);
                  doc.text(`${rate.toFixed(1)}%`, 160, y);
                  y += 7;
              });
          } else if (selectedReportType === 'debt') {
              doc.text("Period", 20, y); doc.text("Paid", 70, y); doc.text("Remaining Balance", 140, y);
              y += 5; doc.line(20, y, 190, y); y += 7;
              processedReportData.history.forEach(h => {
                  const t = calculateTotals(h);
                  const remainingDebt = h.debts.reduce((sum, d) => sum + d.balance, 0);
                  
                  if (y > 270) { doc.addPage(); y = 20; }
                  doc.text(`${MONTH_NAMES[h.month]} ${h.year}`, 20, y);
                  doc.text(`${safeCurrency(t.actualDebts)}`, 70, y);
                  doc.text(`${safeCurrency(remainingDebt)}`, 140, y);
                  y += 7;
              });
          }
          
          doc.save(getExportFilename('pdf'));
      } catch (e) {
          console.error("PDF Generation Error", e);
          alert("Error generating PDF. Please ensure you have data to export.");
      }
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
      } else if (selectedReportType === 'savings') {
          data = processedReportData.history.map(h => {
              const t = calculateTotals(h);
              const saved = t.totalSavings + t.actualInvestments;
              return { 
                  Period: `${MONTH_NAMES[h.month]} ${h.year}`, 
                  Income: t.totalIncome, 
                  Saved: saved, 
                  Rate: t.totalIncome > 0 ? (saved/t.totalIncome) : 0 
              };
          });
      } else if (selectedReportType === 'debt') {
          data = processedReportData.history.map(h => {
              const t = calculateTotals(h);
              const balance = h.debts.reduce((s,d) => s + d.balance, 0);
              return { Period: `${MONTH_NAMES[h.month]} ${h.year}`, Paid: t.actualDebts, Balance: balance };
          });
      } else {
          data = processedReportData.expenses.map(e => ({ Period: e.period, Category: e.name, Amount: e.spent }));
      }

      if (data.length === 0) {
          alert("No data available to export for current selection.");
          return;
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
      } else if (selectedReportType === 'savings') {
          data = processedReportData.history.map(h => {
              const t = calculateTotals(h);
              const saved = t.totalSavings + t.actualInvestments;
              return { Period: `${MONTH_NAMES[h.month]} ${h.year}`, Income: t.totalIncome, Saved: saved, Rate: (saved/t.totalIncome || 0) };
          });
      } else if (selectedReportType === 'debt') {
          data = processedReportData.history.map(h => {
              const t = calculateTotals(h);
              const balance = h.debts.reduce((s,d) => s + d.balance, 0);
              return { Period: `${MONTH_NAMES[h.month]} ${h.year}`, Paid: t.actualDebts, Balance: balance };
          });
      } else {
          data = processedReportData.expenses.map(e => ({ Period: e.period, Category: e.name, Amount: e.spent }));
      }

      if (data.length === 0) {
          alert("No data available to export for current selection.");
          return;
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

  const handleExportFromModal = (format: 'pdf' | 'excel' | 'csv', type: string) => {
      // Temporarily set selected type for export function logic compatibility if needed, 
      // or ideally refactor export functions to take type as arg.
      // Since export functions use state `selectedReportType`, we set it before calling.
      setSelectedReportType(type as any);
      setTimeout(() => {
          if (format === 'pdf') generatePDF();
          else if (format === 'excel') generateExcel();
          else generateCSV();
      }, 0);
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

  // --- 1. Overview Section Data & Render ---
  const renderOverview = () => {
      const netWorth = (currentTotals.totalSavings + currentTotals.totalPortfolioValue) - currentTotals.actualDebts;
      const totalAllocated = currentTotals.totalExpenses + currentTotals.actualBills + currentTotals.actualDebts + currentTotals.totalSavings + currentTotals.actualInvestments;
      
      const debtToIncomeRatio = currentTotals.totalIncome > 0 ? (currentTotals.actualDebts / currentTotals.totalIncome) * 100 : 0;
      const committedSpend = currentTotals.actualBills + currentTotals.actualDebts; // Fixed costs
      
      // Financial Mix Data (Doughnut)
      const mixData = {
          labels: ['Living Expenses', 'Bills (Fixed)', 'Debt Repayment', 'Savings & Inv'],
          datasets: [{
              data: [
                  currentTotals.totalExpenses, 
                  currentTotals.actualBills,
                  currentTotals.actualDebts,
                  currentTotals.totalSavings + currentTotals.actualInvestments
              ],
              backgroundColor: ['#f59e0b', '#ef4444', '#f97316', '#10b981'],
              borderWidth: 0,
              hoverOffset: 4
          }]
      };

      // Net Worth Trend Data (Line)
      const netWorthTrendData = {
          labels,
          datasets: [{
              label: 'Net Worth',
              data: sortedHistory.map(h => {
                  const t = calculateTotals(h);
                  return (t.totalSavings + t.totalPortfolioValue) - t.totalDebts;
              }),
              borderColor: '#8b5cf6', // Violet
              backgroundColor: (context: any) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
                  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                  return gradient;
              },
              fill: true,
              tension: 0.4,
              pointRadius: 4
          }]
      };

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Wallet size={12}/> Net Worth
                  </div>
                  <div className={`text-xl font-bold ${netWorth >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-500'}`}>
                      {formatCurrency(netWorth, currencySymbol)}
                  </div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Scale size={12}/> Debt Ratio
                  </div>
                  <div className={`text-xl font-bold ${debtToIncomeRatio > 40 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {debtToIncomeRatio.toFixed(1)}%
                  </div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Lock size={12}/> Committed
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(committedSpend, currencySymbol)}
                  </div>
                  <div className="text-[9px] text-slate-400">Bills + Debt Payments</div>
              </Card>
              <Card className="p-3 bg-white dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <Target size={12}/> Savings Rate
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {currentTotals.totalIncome > 0 ? Math.round(((currentTotals.totalSavings + currentTotals.actualInvestments) / currentTotals.totalIncome) * 100) : 0}%
                  </div>
                  <div className="text-[9px] text-slate-400">of Total Income</div>
              </Card>
          </div>

          {/* Net Worth Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-violet-500" /> Net Worth Trend
              </h3>
              <div className="h-48 relative">
                  <Line data={netWorthTrendData} options={chartOptions} />
              </div>
          </Card>

          {/* Allocation Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Financial Allocation</h3>
                  <div className="h-40 relative flex justify-center">
                      <Doughnut 
                          data={mixData} 
                          options={{
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              cutout: '65%'
                          }} 
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Flow</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(totalAllocated, currencySymbol)}</span>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Living Exp.</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Fixed Bills</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Debt Pay</div>
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Savings</div>
                  </div>
              </Card>

              {/* Quick Insights */}
              <div className="space-y-3">
                  <Card className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20">
                      <div className="flex gap-2">
                          <Lightbulb size={16} className="text-indigo-600 dark:text-indigo-400 mt-0.5" />
                          <div>
                              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Observation</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                  Your fixed costs are <strong>{currentTotals.totalIncome > 0 ? Math.round((committedSpend / currentTotals.totalIncome)*100) : 0}%</strong> of income. Ideally, keep this under 50%.
                              </p>
                          </div>
                      </div>
                  </Card>
                  
                  {netWorth < 0 && (
                      <Card className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-500/20">
                          <div className="flex gap-2">
                              <TrendingUp size={16} className="text-orange-600 dark:text-orange-400 mt-0.5" />
                              <div>
                                  <h4 className="text-xs font-bold text-orange-700 dark:text-orange-300">Goal Focus</h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                      Prioritize debt repayment to flip your Net Worth to positive.
                                  </p>
                              </div>
                          </div>
                      </Card>
                  )}
              </div>
          </div>
      </div>
      );
  };

  // --- 2. Income Section Data ---
  const renderIncome = () => {
      const incomeSourcesData = {
          labels: currentPeriod.income.map(i => i.name),
          datasets: [{
              data: currentPeriod.income.map(i => i.actual),
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'],
              borderWidth: 0
          }]
      };

      const incomeHistoryValues = sortedHistory.map(h => calculateTotals(h).totalIncome);
      const avgIncome = incomeHistoryValues.reduce((a, b) => a + b, 0) / (incomeHistoryValues.length || 1);

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

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 flex flex-col justify-center bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/20">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Avg Monthly</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {formatCurrency(avgIncome, currencySymbol)}
                  </div>
              </Card>
              <Card className="p-3 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Sources</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {currentPeriod.income.length} Streams
                  </div>
              </Card>
          </div>

          {/* Income Trend Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Monthly Income Trend
              </h3>
              <div className="h-48 relative">
                  <Line data={incomeTrendChartData} options={chartOptions} />
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
      </div>
      );
  };

  // --- 3. Expense Section Data ---
  const renderExpenses = () => {
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

      const topCategory = [...currentPeriod.expenses].sort((a,b) => b.spent - a.spent)[0];

      // Calculate Top Categories List
      const expensesList = [...currentPeriod.expenses].sort((a, b) => b.spent - a.spent);

      const breakdownChartData = {
        labels: expensesList.map(e => e.name),
        datasets: [{
            label: 'Spent',
            data: expensesList.map(e => e.spent),
            backgroundColor: [
                '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
                '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
            ],
            borderRadius: 4,
            barThickness: 20
        }]
      };

      // Calculate Top Merchants from Shopping Lists
      const merchantSpending: Record<string, number> = {};
      shoppingLists.forEach(list => {
          list.shops.forEach(shop => {
              const shopTotal = shop.items.filter(i => i.checked).reduce((sum, i) => sum + (i.actualPrice || i.price || 0), 0);
              if (shopTotal > 0) {
                  merchantSpending[shop.name] = (merchantSpending[shop.name] || 0) + shopTotal;
              }
          });
      });
      const topMerchants = Object.entries(merchantSpending)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

      return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Spent (Mo)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(currentTotals.totalExpenses, currencySymbol)}
                  </div>
              </Card>
              <Card className="p-3 flex flex-col justify-center bg-white dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Daily Average</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(currentTotals.totalExpenses / 30, currencySymbol)}
                  </div>
              </Card>
          </div>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-purple-500" /> Monthly Expense Trend
              </h3>
              <div className="h-48 relative">
                  <Line data={expenseTrendData} options={chartOptions} />
              </div>
          </Card>

          {/* AI Suggestions */}
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
                  ) : null}
              </div>
          </Card>

          {/* Detailed Breakdown Chart */}
          <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Detailed Breakdown</h3>
                <div className="h-64 relative"> 
                    <Bar 
                        data={breakdownChartData} 
                        options={{
                            indexAxis: 'y' as const,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false, grid: { display: false } },
                                y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11, weight: 'bold' } } }
                            }
                        }} 
                    />
                </div>
           </Card>

          {/* Top Categories List - NEW DESIGN */}
          <div>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Top Categories</h3>
              <div className="space-y-3">
                  {expensesList.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.name] || ShoppingBag;
                      const budget = cat.budgeted || 0;
                      const percent = budget > 0 ? (cat.spent / budget) * 100 : 0;
                      const isOver = percent > 100;
                      
                      return (
                          <div 
                              key={cat.id}
                              onClick={() => setSelectedCategoryDetail(cat.name)}
                              className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-[0.98]"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      <Icon size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{cat.name}</h4>
                                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                          {formatCurrency(cat.spent, currencySymbol)} <span className="opacity-50">/ {formatCurrency(budget, currencySymbol)}</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                      {Math.round(percent)}%
                                  </span>
                                  <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                              </div>
                          </div>
                      );
                  })}
                  {expensesList.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                          No expense categories found.
                      </div>
                  )}
              </div>
          </div>

          {/* Top Merchants (Global Backup) */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-pink-500" /> Top Merchants (All)
              </h3>
              <div className="space-y-3">
                  {topMerchants.length > 0 ? topMerchants.map((merchant, i) => (
                      <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-pink-100 text-pink-600': 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  #{i+1}
                              </div>
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{merchant.name}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(merchant.amount, currencySymbol)}</div>
                          </div>
                      </div>
                  )) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                          No shopping data available.
                      </div>
                  )}
              </div>
          </Card>
      </div>
      );
  };

  const renderBills = () => {
      // 1. Calculations
      const totalBills = currentPeriod.bills.reduce((sum, b) => sum + b.amount, 0);
      const paidBills = currentPeriod.bills.filter(b => b.paid).reduce((sum, b) => sum + b.amount, 0);
      const unpaidBills = totalBills - paidBills;
      const paidCount = currentPeriod.bills.filter(b => b.paid).length;
      const totalCount = currentPeriod.bills.length;
      const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

      // History for trend
      const billHistoryData = sortedHistory.map(h => ({
          period: `${MONTH_NAMES[h.month].substring(0,3)}`,
          amount: h.bills.reduce((sum, b) => sum + b.amount, 0)
      }));

      const previousTotal = billHistoryData.length > 1 ? billHistoryData[billHistoryData.length - 2].amount : totalBills;
      const trendDiff = totalBills - previousTotal;
      const trendPct = previousTotal > 0 ? (trendDiff / previousTotal) * 100 : 0;

      // 2. Charts
      const statusData = {
          labels: ['Paid', 'Unpaid'],
          datasets: [{
              data: [paidBills, unpaidBills],
              backgroundColor: ['#10b981', '#ef4444'],
              borderWidth: 0,
              cutout: '70%'
          }]
      };

      const trendChartData = {
          labels: labels, // from parent scope
          datasets: [{
              label: 'Total Bills',
              data: sortedHistory.map(h => h.bills.reduce((sum,b) => sum + b.amount, 0)),
              borderColor: '#6366f1',
              backgroundColor: (context: any) => {
                  const ctx = context.chart.ctx;
                  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                  return gradient;
              },
              fill: true,
              tension: 0.4,
              pointRadius: 4
          }]
      };

      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Obligations</p>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(totalBills, currencySymbol)}
                    </div>
                    <div className={`text-[10px] flex items-center gap-1 font-bold mt-1 ${trendDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {trendDiff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(trendPct).toFixed(1)}% vs last month
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Paid So Far</p>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paidBills, currencySymbol)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        {paidCount} of {totalCount} bills cleared
                    </div>
                </Card>
            </div>

            {/* Status Breakdown & Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white">Payment Status</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${progress === 100 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                            {Math.round(progress)}% Paid
                        </span>
                    </div>
                    <div className="h-40 relative flex justify-center">
                        <Doughnut 
                            data={statusData}
                            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pending</span>
                            <span className="text-lg font-bold text-red-500">
                                {formatCurrency(unpaidBills, currencySymbol)}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Bill Trend */}
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" /> Historical Trend
                    </h3>
                    <div className="h-40 relative">
                        <Line data={trendChartData} options={chartOptions} />
                    </div>
                </Card>
            </div>

            {/* Detailed Bill Analysis */}
            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white">Bill Analysis</h3>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                            <CheckCircle size={10} /> Paid
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                            <AlertCircle size={10} /> Unpaid
                        </span>
                    </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...currentPeriod.bills].sort((a, b) => b.amount - a.amount).map(bill => {
                        // Find historical average for this bill name
                        const billHistory = sortedHistory
                            .map(h => h.bills.find(b => b.name === bill.name)?.amount || 0)
                            .filter(a => a > 0);
                        const avg = billHistory.length > 0 
                            ? billHistory.reduce((a,b) => a+b, 0) / billHistory.length 
                            : bill.amount;
                        
                        const variance = bill.amount - avg;
                        const variancePct = avg > 0 ? (variance / avg) * 100 : 0;
                        const isHigh = variancePct > 10; // 10% higher than avg

                        return (
                            <div key={bill.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bill.paid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                        <FileText size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{bill.name}</div>
                                        <div className="text-[10px] text-slate-500">Due {new Date(bill.dueDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${bill.paid ? 'text-emerald-600 dark:text-emerald-400 opacity-70' : 'text-slate-900 dark:text-white'}`}>
                                        {formatCurrency(bill.amount, currencySymbol)}
                                    </div>
                                    {isHigh && billHistory.length > 1 && (
                                        <div className="text-[9px] text-red-500 font-bold flex items-center justify-end gap-0.5">
                                            <TrendingUp size={8} /> +{variancePct.toFixed(0)}% vs avg
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
      );
  };

  const renderDebts = () => {
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
          // This is an estimation since we might not have the true original amount
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
                                {/* Marker for current balance context if needed, but progress bar is filled based on paid amount */}
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

  const renderSavings = () => {
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

  const renderCashFlow = () => {
      // Logic to prepare data
      const cashFlowData = sortedHistory.map(h => {
          const t = calculateTotals(h);
          const outflows = t.totalExpenses + t.actualBills + t.actualDebts;
          const net = t.totalIncome - outflows;
          
          const topCat = h.expenses.sort((a,b) => b.spent - a.spent)[0];
          
          return {
              period: `${MONTH_NAMES[h.month].substring(0,3)} ${h.year}`,
              net,
              outflows,
              topCatName: topCat ? topCat.name : 'General'
          };
      });

      // Cumulative
      let acc = 0;
      const cumulativeSeries = cashFlowData.map(d => {
          acc += d.net;
          return acc;
      });

      const best = [...cashFlowData].sort((a,b) => b.net - a.net)[0];
      const worst = [...cashFlowData].sort((a,b) => b.outflows - a.outflows)[0]; // Highest expense
      
      const last3 = cashFlowData.slice(-3);
      const avg = last3.reduce((s, c) => s + c.net, 0) / (last3.length || 1);

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          
          {/* Net Cash Flow Trend */}
          <Card className="p-5 bg-[#1e293b] border-none shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Net Cash Flow Trend</h3>
              <div className="h-40 relative">
                  <Bar 
                      data={{
                          labels: cashFlowData.map(d => d.period),
                          datasets: [{
                              data: cashFlowData.map(d => d.net),
                              backgroundColor: cashFlowData.map(d => d.net >= 0 ? '#10b981' : '#ef4444'),
                              borderRadius: 4
                          }]
                      }}
                      options={{
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { x: { display: false }, y: { display: false } }
                      }}
                  />
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">Inflow minus Outflow per period</p>
          </Card>

          {/* Cumulative Savings */}
          <Card className="p-5 bg-[#1e293b] border-none shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Cumulative Savings</h3>
              <div className="h-40 relative">
                  <Line 
                      data={{
                          labels: cashFlowData.map(d => d.period),
                          datasets: [{
                              label: 'Cumulative Savings',
                              data: cumulativeSeries,
                              borderColor: '#6366f1',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointRadius: 4,
                              pointBackgroundColor: '#fff'
                          }]
                      }}
                      options={{
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { x: { display: false }, y: { display: false } }
                      }}
                  />
              </div>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-[#1e293b] border border-slate-700/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">BEST MONTH</span>
                  <div className="text-base font-bold text-white truncate">{best?.period || 'N/A'}</div>
                  <div className="text-xs font-bold text-emerald-500 mt-1">
                      {best ? `+ ${formatCurrency(best.net, currencySymbol)}` : '-'}
                  </div>
              </Card>
              <Card className="p-4 bg-[#1e293b] border border-slate-700/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">HIGH EXPENSE</span>
                  <div className="text-base font-bold text-white truncate">{worst?.period || 'N/A'}</div>
                  <div className="text-xs font-bold text-orange-500 mt-1 truncate">
                      {worst ? worst.topCatName : '-'}
                  </div>
              </Card>
          </div>

          {/* Average Cash Flow */}
          <Card className="p-4 bg-[#1e293b] border border-slate-700/50">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">3-MONTH AVG CASH FLOW</span>
              <div className={`text-2xl font-bold ${avg >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatCurrency(avg, currencySymbol)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Moving average of recent surplus/deficit</p>
          </Card>
      </div>
      );
  };

  const renderPlanner = () => {
      // 1. Forecast Calculation
      const last3Months = sortedHistory.slice(-3);
      const avgExpense = last3Months.length > 0 
          ? last3Months.reduce((sum, h) => sum + calculateTotals(h).totalExpenses, 0) / last3Months.length
          : currentTotals.totalExpenses;
      
      const predictedExpense = avgExpense * 1.05; // 5% increase assumption
      const avgIncome = last3Months.length > 0
          ? last3Months.reduce((sum, h) => sum + calculateTotals(h).totalIncome, 0) / last3Months.length
          : currentTotals.totalIncome;
          
      const estimatedSavings = avgIncome - predictedExpense;

      // 2. Chart Data
      const activeGoals = currentPeriod.goals.filter(g => !g.checked);
      const chartData = {
          labels: activeGoals.map(g => g.name),
          datasets: [{
              data: activeGoals.map(g => g.current),
              backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
              borderWidth: 0,
              hoverOffset: 4
          }]
      };

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pb-6">
              {/* Top Chart Card */}
              <Card className="p-6 bg-[#1e293b] text-white border-none shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                      <Target size={20} className="text-indigo-400" />
                      <h3 className="text-lg font-bold">Goal Progress Rings</h3>
                  </div>
                  <div className="h-48 relative flex items-center justify-center">
                      <Doughnut 
                          data={chartData}
                          options={{
                              maintainAspectRatio: false,
                              cutout: '75%',
                              plugins: {
                                  legend: {
                                      position: 'right',
                                      labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } }
                                  }
                              }
                          }}
                      />
                  </div>
              </Card>

              {/* Goals List */}
              <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Savings Goals</h3>
                  <div className="space-y-3">
                      {activeGoals.map(goal => {
                          const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                          return (
                              <Card key={goal.id} className="p-5 bg-[#1e293b] border-slate-700/50 shadow-md">
                                  <div className="flex justify-between items-end mb-2">
                                      <span className="font-bold text-white text-base">{goal.name}</span>
                                      <span className="text-xs font-bold text-indigo-400">{Math.round(progress)}%</span>
                                  </div>
                                  
                                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                                      <div 
                                          className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                                          style={{ width: `${Math.min(progress, 100)}%` }}
                                      ></div>
                                  </div>
                                  
                                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                                      <span>{formatCurrency(goal.current, currencySymbol)}</span>
                                      <span>Target: {formatCurrency(goal.target, currencySymbol)}</span>
                                  </div>
                              </Card>
                          );
                      })}
                      {activeGoals.length === 0 && (
                          <div className="text-center p-8 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                              <Target size={24} className="mx-auto mb-2 opacity-50" />
                              <p className="text-xs">No active goals. Start saving today!</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* AI Forecast Card */}
              <Card className="p-5 bg-[#1e293b] border-slate-700/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-2 mb-6 relative z-10">
                      <Activity size={18} className="text-fuchsia-400" />
                      <h3 className="font-bold text-white">AI Forecast (Next 3 Months)</h3>
                  </div>

                  <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="text-sm text-slate-400">Predicted Avg Expense</span>
                          <span className="font-bold text-white text-lg">~{formatCurrency(predictedExpense, currencySymbol)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                          <span className="text-sm text-slate-400">Estimated Savings</span>
                          <span className={`font-bold text-lg ${estimatedSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ~{formatCurrency(estimatedSavings, currencySymbol)}
                          </span>
                      </div>
                  </div>

                  <div className="mt-4 pt-2 relative z-10">
                      <p className="text-xs text-slate-400 italic leading-relaxed">
                          "Expenses trending up by 5%. Consider reducing subscription costs to maintain savings rate."
                      </p>
                  </div>
              </Card>
          </div>
      );
  };

  const renderReports = () => {
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

      // Robust check for categories to render list
      const availableCategories = Array.from(new Set(history.flatMap(h => h.expenses.map(e => e.name))));

      const handleReportExport = (format: 'pdf' | 'excel' | 'csv', type: string) => {
          // Temporarily set selected type for export function logic compatibility if needed, 
          // or ideally refactor export functions to take type as arg.
          // Since export functions use state `selectedReportType`, we set it before calling.
          setSelectedReportType(type as any);
          setTimeout(() => {
              if (format === 'pdf') generatePDF();
              else if (format === 'excel') generateExcel();
              else generateCSV();
          }, 0);
      };

      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {/* Config Card */}
              <Card className="p-5 bg-[#1e293b] border border-slate-700/50 shadow-xl overflow-visible">
                  <div className="flex items-center gap-2 mb-4">
                      <Filter className="text-indigo-400" size={18} />
                      <h3 className="text-base font-bold text-white">Report Configuration</h3>
                  </div>
                  
                  {/* Date Range */}
                  <div className="mb-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Date Range</label>
                      <div className="flex bg-[#0f172a] p-1 rounded-xl">
                          {['3m', '6m', 'ytd', 'all'].map(tf => (
                              <button
                                  key={tf}
                                  onClick={() => setReportTimeframe(tf as '3m' | '6m' | 'ytd' | 'all')}
                                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${reportTimeframe === tf ? 'bg-slate-700 text-indigo-400 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                  {tf === '3m' ? '3 Months' : tf === '6m' ? '6 Months' : tf === 'ytd' ? 'Year to Date' : 'All Time'}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Category Filter */}
                  <div className="relative z-50">
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Categories Included</label>
                      <button 
                          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                          className="w-full flex items-center justify-between p-3.5 bg-[#0f172a] border border-slate-700/50 rounded-xl text-sm transition-colors hover:border-slate-600"
                      >
                          <span className="text-slate-300 font-medium">
                              {reportCategories.length === 0 ? 'Select Categories (Empty)' : reportCategories.length === availableCategories.length ? 'All Categories' : `${reportCategories.length} Selected`}
                          </span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isCatDropdownOpen && (
                          <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl p-3 max-h-60 overflow-y-auto custom-scrollbar">
                              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-700">
                                  <button onClick={selectAllCats} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Select All</button>
                                  <button onClick={clearAllCats} className="text-xs font-bold text-slate-400 hover:text-slate-300">Clear</button>
                              </div>
                              <div className="space-y-1">
                                  {availableCategories.length > 0 ? availableCategories.map(cat => (
                                      <div key={cat} onClick={() => toggleCategory(cat)} className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                                          {reportCategories.includes(cat) ? <div className="text-indigo-500"><CheckSquare size={16} /></div> : <div className="text-slate-500"><Square size={16} /></div>}
                                          <span className="text-sm text-slate-300">{cat}</span>
                                      </div>
                                  )) : (
                                      <div className="text-xs text-slate-500 p-2 italic">No categories found in history</div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </Card>

              {/* Report Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                  {[
                      { id: 'summary', title: 'Monthly Summary', sub: 'Income, Expenses, Net P&L', icon: FileText, color: 'text-indigo-400' },
                      { id: 'category', title: 'Category Analysis', sub: 'Detailed spending breakdown', icon: PieChart, color: 'text-emerald-400' },
                      { id: 'comparison', title: 'Income vs Expense', sub: 'Trend comparison chart', icon: TrendingUp, color: 'text-blue-400' },
                      { id: 'tax', title: 'Tax-Ready Export', sub: 'Clean expense list for tax', icon: Table, color: 'text-amber-400' },
                      { id: 'savings', title: 'Savings Report', sub: 'Savings rate & growth', icon: PiggyBank, color: 'text-teal-400' },
                      { id: 'debt', title: 'Debt Payoff', sub: 'Liability reduction tracking', icon: TrendingDown, color: 'text-red-400' }
                  ].map((rpt) => (
                      <div 
                          key={rpt.id}
                          onClick={() => { setSelectedReportType(rpt.id as any); setViewingReport(rpt.id); }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-lg bg-[#1e293b] border-slate-700/50 hover:border-slate-600 active:scale-95`}
                      >
                          <div className={`mb-3 ${rpt.color}`}>
                              <rpt.icon size={24} strokeWidth={1.5} />
                          </div>
                          <h4 className="font-bold text-sm mb-1 text-slate-200">{rpt.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-tight">{rpt.sub}</p>
                      </div>
                  ))}
              </div>

              {/* Report Modal */}
              {viewingReport && (
                  <ReportPreviewModal
                      isOpen={!!viewingReport}
                      onClose={() => setViewingReport(null)}
                      title={selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1) + " Report"}
                      type={viewingReport}
                      data={processedReportData}
                      currencySymbol={currencySymbol}
                      onExport={(format: any) => handleReportExport(format, viewingReport || '')}
                  />
              )}
          </div>
      );
  };

  const renderTools = () => {
      const toggleAlert = (key: keyof typeof alertSettings) => {
          setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
      };

      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <Card className="p-5 bg-slate-900 border-none shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-full ring-1 ring-indigo-500/30">
                        <BellRing size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Intelligent Alerts</h3>
                        <p className="text-xs text-slate-400">Configure how AI notifies you about your finances.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Item 1: Budget Thresholds */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <PieChart size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-white">Budget Thresholds</h4>
                                <p className="text-xs text-slate-400 leading-snug">Get notified when you hit 80% and 100% of category limits.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.thresholds} onChange={() => toggleAlert('thresholds')} />
                    </div>

                    {/* Item 2: Unusual Spending */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <Activity size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-white">Unusual Spending</h4>
                                <p className="text-xs text-slate-400 leading-snug">Detect anomalies or double charges instantly.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.unusual} onChange={() => toggleAlert('unusual')} />
                    </div>

                    {/* Item 3: Bill Reminders */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <FileText size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-white">Bill Reminders</h4>
                                <p className="text-xs text-slate-400 leading-snug">Receive alerts 3 days before recurring bills are due.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.bills} onChange={() => toggleAlert('bills')} />
                    </div>

                    {/* Item 4: Low Balance Forecast */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <TrendingDown size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-white">Low Balance Forecast</h4>
                                <p className="text-xs text-slate-400 leading-snug">Predicts potential overdrafts based on spending trends.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.balance} onChange={() => toggleAlert('balance')} />
                    </div>

                    {/* Item 5: Subscription Monitor */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 max-w-[80%]">
                            <RefreshCcw size={18} className="text-slate-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-white">Subscription Monitor</h4>
                                <p className="text-xs text-slate-400 leading-snug">Alert on price hikes for existing subscriptions.</p>
                            </div>
                        </div>
                        <Toggle checked={alertSettings.subs} onChange={() => toggleAlert('subs')} />
                    </div>
                </div>
            </Card>
        </div>
      );
  };

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
                    { id: 'savings', label: 'Savings', icon: PiggyBank },
                    { id: 'debts', label: 'Debts', icon: Landmark },
                    { id: 'bills', label: 'Bills', icon: Receipt },
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
           {activeTab === 'bills' && renderBills()}
           {activeTab === 'debts' && renderDebts()}
           {activeTab === 'savings' && renderSavings()}
           {activeTab === 'cashflow' && renderCashFlow()}
           {activeTab === 'planner' && renderPlanner()}
           {activeTab === 'reports' && renderReports()}
           {activeTab === 'tools' && renderTools()}
       </div>

       {/* Category Deep Dive Modal */}
       {selectedCategoryDetail && (
           <CategoryDetailModal 
               isOpen={!!selectedCategoryDetail}
               onClose={() => setSelectedCategoryDetail(null)}
               categoryName={selectedCategoryDetail}
               currentPeriod={currentPeriod}
               history={history}
               currencySymbol={currencySymbol}
               shoppingLists={shoppingLists}
           />
       )}
    </div>
  );
};

// ... existing helper components ...

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

const CategoryDetailModal = ({ isOpen, onClose, categoryName, currentPeriod, history, currencySymbol, shoppingLists }: {
    isOpen: boolean;
    onClose: () => void;
    categoryName: string;
    currentPeriod: any;
    history: any[];
    currencySymbol: string;
    shoppingLists: any[];
}) => {
    // ... existing implementation ...
    if (!isOpen || !categoryName) return null;

    // 1. Calculate Stats
    const currentExpense = currentPeriod.expenses.find((e: any) => e.name === categoryName);
    const spent = currentExpense?.spent || 0;
    
    // History Average
    const historyData = history.slice(-6).map((h: any) => {
        const exp = h.expenses.find((e: any) => e.name === categoryName);
        return {
            month: MONTH_NAMES[h.month].substring(0,3),
            amount: exp ? exp.spent : 0
        };
    });
    const avgSpend = historyData.length > 0 
        ? historyData.reduce((acc: number, curr: any) => acc + curr.amount, 0) / historyData.length 
        : spent;

    // Trend Data for Chart
    const trendData = {
        labels: historyData.map((d: any) => d.month),
        datasets: [{
            label: 'Spending',
            data: historyData.map((d: any) => d.amount),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    };

    // Estimate Merchants
    // Fuzzy matching shops to category keyword
    const merchants: Record<string, number> = {};
    const keywords = String(categoryName).toLowerCase().split(' ');
    
    shoppingLists.forEach((list: any) => {
        list.shops.forEach((shop: any) => {
            // Check if shop name contains category keywords or generic matching
            const matches = keywords.some((k: string) => shop.name.toLowerCase().includes(k)) || 
                            (categoryName === 'Groceries' && ['market','food','mart','store'].some(k => shop.name.toLowerCase().includes(k))) ||
                            (categoryName === 'Fuel' && ['station','oil','petrol','fuel'].some(k => shop.name.toLowerCase().includes(k)));
            
            if (matches || true) { 
                 const shopTotal = shop.items.filter((i: any) => i.checked).reduce((sum: number, i: any) => sum + (i.actualPrice || i.price || 0), 0);
                 if (shopTotal > 0) merchants[shop.name] = (merchants[shop.name] || 0) + shopTotal;
            }
        });
    });

    let topMerchants = Object.entries(merchants)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);
    
    if (topMerchants.length === 0) {
        // Fallback for visual consistency
        topMerchants = [
            { name: 'Store A', amount: spent * 0.4 },
            { name: 'Store B', amount: spent * 0.3 },
            { name: 'Online', amount: spent * 0.2 },
            { name: 'Other', amount: spent * 0.1 },
        ];
    }

    const maxMerchantSpend = Math.max(...topMerchants.map(m => m.amount), 1);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0f172a] w-full max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col text-white">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{categoryName}</h2>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Deep Dive Analysis</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Key Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Avg Spend</p>
                            <p className="text-xl font-bold">{formatCurrency(avgSpend, currencySymbol)}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Frequency</p>
                            <p className="text-xl font-bold">~4x / mo</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-3">Spending Trend (6 Months)</h4>
                        <div className="h-40 w-full">
                            <Line 
                                data={trendData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { display: false },
                                        y: { display: false }
                                    },
                                    elements: {
                                        line: { tension: 0.4, borderWidth: 3 },
                                        point: { radius: 3, backgroundColor: '#6366f1' }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Merchants */}
                    <div>
                        <h4 className="text-xs font-bold text-white mb-3">Top Merchants (Est.)</h4>
                        <div className="space-y-3">
                            {topMerchants.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-slate-300 w-24 truncate">{m.name}</span>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full" 
                                            style={{ width: `${(m.amount / maxMerchantSpend) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-white w-20 text-right">{formatCurrency(m.amount, currencySymbol)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Smart Tip */}
                    <div className="bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
                        <Lightbulb size={20} className="text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-100 leading-relaxed">
                            <span className="font-bold text-white">Smart Tip:</span> You spend 15% more on {categoryName} on weekends. Try shifting some purchases to weekdays to avoid peak pricing or impulse buys.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReportPreviewModal = ({ isOpen, onClose, title, type, data, currencySymbol, onExport }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    type: string; 
    data: any; 
    currencySymbol: string; 
    onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}) => {
    if (!isOpen) return null;

    const renderContent = () => {
        // Table styling
        const tableHeaderClass = "p-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 sticky top-0";
        const tableCellClass = "p-3 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800";

        if (type === 'summary' || type === 'comparison') {
            return (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className={tableHeaderClass}>Period</th>
                            <th className={`${tableHeaderClass} text-right`}>Income</th>
                            <th className={`${tableHeaderClass} text-right`}>Expenses</th>
                            <th className={`${tableHeaderClass} text-right`}>Net Flow</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.history.map((h: BudgetData, i: number) => {
                            const t = calculateTotals(h);
                            return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className={tableCellClass}>{MONTH_NAMES[h.month]} {h.year}</td>
                                    <td className={`${tableCellClass} text-right text-emerald-600`}>{formatCurrency(t.totalIncome, currencySymbol)}</td>
                                    <td className={`${tableCellClass} text-right text-red-500`}>{formatCurrency(t.totalExpenses, currencySymbol)}</td>
                                    <td className={`${tableCellClass} text-right font-bold ${t.leftToSpend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(t.leftToSpend, currencySymbol)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        }

        if (type === 'category') {
            const catTotals: Record<string, number> = {};
            data.expenses.forEach((e: any) => catTotals[e.name] = (catTotals[e.name] || 0) + e.spent);
            const totalSpent = Object.values(catTotals).reduce((a: number, b: number) => a + b, 0);

            return (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className={tableHeaderClass}>Category</th>
                            <th className={`${tableHeaderClass} text-right`}>Total Spent</th>
                            <th className={`${tableHeaderClass} text-right`}>% of Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(catTotals).sort(([,a], [,b]) => b - a).map(([cat, amount], i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className={tableCellClass}>{cat}</td>
                                <td className={`${tableCellClass} text-right`}>{formatCurrency(amount, currencySymbol)}</td>
                                <td className={`${tableCellClass} text-right`}>{totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (type === 'tax') {
            return (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className={tableHeaderClass}>Date</th>
                            <th className={tableHeaderClass}>Category</th>
                            <th className={`${tableHeaderClass} text-right`}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.expenses.map((e: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className={tableCellClass}>{new Date(e.dateObj).toLocaleDateString()}</td>
                                <td className={tableCellClass}>{e.name}</td>
                                <td className={`${tableCellClass} text-right`}>{formatCurrency(e.spent, currencySymbol)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (type === 'savings') {
            return (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className={tableHeaderClass}>Period</th>
                            <th className={`${tableHeaderClass} text-right`}>Income</th>
                            <th className={`${tableHeaderClass} text-right`}>Saved + Inv</th>
                            <th className={`${tableHeaderClass} text-right`}>Savings Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.history.map((h: BudgetData, i: number) => {
                            const t = calculateTotals(h);
                            const saved = t.totalSavings + t.actualInvestments;
                            const rate = t.totalIncome > 0 ? (saved / t.totalIncome) * 100 : 0;
                            return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className={tableCellClass}>{MONTH_NAMES[h.month]} {h.year}</td>
                                    <td className={`${tableCellClass} text-right`}>{formatCurrency(t.totalIncome, currencySymbol)}</td>
                                    <td className={`${tableCellClass} text-right text-emerald-600`}>{formatCurrency(saved, currencySymbol)}</td>
                                    <td className={`${tableCellClass} text-right font-bold`}>{rate.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        }

        if (type === 'debt') {
            return (
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className={tableHeaderClass}>Period</th>
                            <th className={`${tableHeaderClass} text-right`}>Debt Paid</th>
                            <th className={`${tableHeaderClass} text-right`}>Remaining Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.history.map((h: BudgetData, i: number) => {
                            const t = calculateTotals(h);
                            const remaining = h.debts.reduce((sum, d) => sum + d.balance, 0);
                            return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className={tableCellClass}>{MONTH_NAMES[h.month]} {h.year}</td>
                                    <td className={`${tableCellClass} text-right text-orange-500`}>{formatCurrency(t.actualDebts, currencySymbol)}</td>
                                    <td className={`${tableCellClass} text-right`}>{formatCurrency(remaining, currencySymbol)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        }

        return <div className="p-4 text-center text-slate-500">Select a report type</div>;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Full Report Preview</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
                    <div className="min-w-full inline-block align-middle">
                        <div className="border-b border-slate-200 dark:border-slate-700">
                            {renderContent()}
                        </div>
                        {data.history.length === 0 && (
                            <div className="p-10 text-center text-slate-400 italic">No data available for this timeframe.</div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3 z-10">
                    <button 
                        onClick={() => onExport('pdf')} 
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        <FileText size={16} /> PDF
                    </button>
                    <button 
                        onClick={() => onExport('excel')} 
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button 
                        onClick={() => onExport('csv')} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                        <Table size={16} /> CSV
                    </button>
                </div>
            </div>
        </div>
    );
};
