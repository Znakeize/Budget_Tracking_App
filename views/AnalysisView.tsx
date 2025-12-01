
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
  Briefcase, Home, Car, Coffee, Gift, ShoppingBag, BarChart2, Sparkles, Clock,
  FileSpreadsheet, Table, CheckSquare, Square, ChevronDown, BellRing, RefreshCcw,
  PiggyBank, Receipt, Landmark, Scale, Wallet, Zap, CheckCircle, AlertCircle, ArrowUpDown, Sliders, Check
} from 'lucide-react';
import { MONTH_NAMES } from '../constants';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisReportDashboard } from './AnalysisReportDashboard';
import { IncomeAnalysisSection } from './IncomeAnalysisSection';
import { CashFlowAnalysisSection } from './CashFlowAnalysisSection';
import { AnalysisPlanner } from './AnalysisPlanner';
import { AnalysisOverview } from './AnalysisOverview';

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

  // --- Helpers for Charts ---
  const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
      interaction: { mode: 'index' as const, intersect: false },
  };

  const labels = sortedHistory.map(h => h.period === 'monthly' ? MONTH_NAMES[h.month].substring(0, 3) : 'Pd');

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
           {activeTab === 'overview' && <AnalysisOverview history={history} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'income' && <IncomeAnalysisSection history={history} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'expenses' && renderExpenses()}
           {activeTab === 'bills' && renderBills()}
           {activeTab === 'debts' && renderDebts()}
           {activeTab === 'savings' && renderSavings()}
           {activeTab === 'cashflow' && <CashFlowAnalysisSection history={history} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'planner' && <AnalysisPlanner history={history} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'reports' && (
               <AnalysisReportDashboard 
                   history={history} 
                   currencySymbol={currencySymbol} 
               />
           )}
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

    // Enhanced Merchant Matching Logic
    const merchants: Record<string, number> = {};
    
    // Keywords mapping for smart categorization
    const smartKeywords: Record<string, string[]> = {
         'groceries': ['market','mart','super','fresh','food','grocer', 'trader', 'whole', 'costco', 'walmart', 'kroger', 'safeway', 'aldi'],
         'food': ['market','mart','super','fresh','grocer', 'cafe', 'restaurant', 'pizza', 'burger', 'grill', 'bistro', 'diner', 'eats', 'starbucks', 'mcdonalds'],
         'eating out': ['cafe', 'restaurant', 'bistro', 'bar', 'grill', 'pizza', 'burger', 'coffee', 'diner', 'eats', 'uber eats', 'doordash'],
         'dining': ['cafe', 'restaurant', 'bistro', 'bar', 'grill', 'pizza', 'burger', 'coffee', 'diner'],
         'fuel': ['station','oil','petrol','gas','pump', 'shell', 'bp', 'mobil', 'energy', 'chevron', 'exxon'],
         'transport': ['station','oil','petrol','gas','pump', 'uber', 'taxi', 'rail', 'bus', 'train', 'metro', 'lyft'],
         'shopping': ['mall', 'store', 'shop', 'fashion', 'retail', 'outlet', 'center', 'plaza', 'amazon', 'target', 'ebay'],
         'gifts': ['gift', 'store', 'shop', 'mall', 'amazon'],
         'health': ['pharmacy', 'drug', 'med', 'clinic', 'gym', 'fitness', 'salon', 'barber', 'dental', 'doctor', 'walgreens', 'cvs'],
         'personal care': ['pharmacy', 'drug', 'salon', 'barber', 'hair', 'cosmetic', 'spa', 'ulta', 'sephora'],
         'home': ['depot', 'hardware', 'furniture', 'decor', 'ikea', 'homeware', 'repair', 'lowes'],
         'household': ['depot', 'hardware', 'furniture', 'decor', 'ikea'],
         'entertainment': ['cinema', 'movie', 'theater', 'game', 'bowling', 'fun', 'park', 'netflix', 'spotify', 'hulu', 'disney']
    };

    const catLower = categoryName.toLowerCase();
    
    // Find matching keywords for this category
    // Either exact key match or partial key match in smartKeywords
    let categoryKeywords: string[] = [];
    Object.keys(smartKeywords).forEach(key => {
        if (catLower.includes(key) || key.includes(catLower)) {
            categoryKeywords = [...categoryKeywords, ...smartKeywords[key]];
        }
    });
    // Add the category name itself as a keyword
    categoryKeywords.push(catLower);
    // Split category name into words and add those too if significant length
    categoryName.split(' ').forEach(word => {
        if (word.length > 3) categoryKeywords.push(word.toLowerCase());
    });

    shoppingLists.forEach((list: any) => {
        list.shops.forEach((shop: any) => {
            let isMatch = false;
            
            // 1. Explicit Link
            if (shop.budgetCategory && shop.budgetCategory === categoryName) {
                isMatch = true;
            }
            // 2. Smart Keyword Matching (If not linked elsewhere)
            else if (!shop.budgetCategory) {
                const nameLower = shop.name.toLowerCase();
                if (categoryKeywords.some(keyword => nameLower.includes(keyword))) {
                    isMatch = true;
                }
            }
            
            if (isMatch) { 
                 const shopTotal = shop.items.filter((i: any) => i.checked).reduce((sum: number, i: any) => sum + (i.actualPrice || i.price || 0), 0);
                 if (shopTotal > 0) merchants[shop.name] = (merchants[shop.name] || 0) + shopTotal;
            }
        });
    });

    let topMerchants = Object.entries(merchants)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
    
    // Smart Fallback: "Manual / Other"
    const trackedSum = topMerchants.reduce((sum, m) => sum + m.amount, 0);
    const untracked = Math.max(0, spent - trackedSum);

    if (untracked > 0) {
        topMerchants.push({ name: 'Manual / Other', amount: untracked });
    }
    
    // Sort again
    topMerchants.sort((a, b) => b.amount - a.amount);
    
    const displayMerchants = topMerchants.slice(0, 6); // Show top 6
    const maxMerchantSpend = Math.max(...displayMerchants.map(m => m.amount), 1);

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
                        <h4 className="text-xs font-bold text-white mb-3">Top Merchants (Matched)</h4>
                        <div className="space-y-3">
                            {displayMerchants.map((m, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-slate-300 w-28 truncate">{m.name}</span>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${m.name === 'Manual / Other' ? 'bg-slate-500' : 'bg-indigo-500'}`} 
                                            style={{ width: `${(m.amount / maxMerchantSpend) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-white w-20 text-right">{formatCurrency(m.amount, currencySymbol)}</span>
                                </div>
                            ))}
                            {displayMerchants.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center">No spend data or merchant matches found.</p>
                            )}
                        </div>
                    </div>

                    {/* Smart Tip */}
                    <div className="bg-indigo-500/20 border border-indigo-500/30 p-4 rounded-xl flex gap-3">
                        <Lightbulb size={20} className="text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-100 leading-relaxed">
                            <span className="font-bold text-white">Smart Tip:</span> 
                            {untracked > (spent * 0.5) 
                                ? "A large portion of this category is manual/untracked. Try linking more shops to this category for better insights."
                                : "You spend 15% more on this category on weekends. Try shifting some purchases to weekdays to avoid peak pricing or impulse buys."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
