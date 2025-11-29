
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetData, InvestmentItem, InvestmentGoal, InvestmentTransaction, GoalItem, InvestmentAlert } from '../types';
import { Card } from '../components/ui/Card';
import { formatCurrency, generateId, NotificationItem } from '../utils/calculations';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
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
    TrendingUp, ChevronLeft, PieChart, Layers, DollarSign, 
    ArrowUpRight, ArrowDownRight, Briefcase, User, Target, 
    BellRing, Plus, Sparkles, Building2, Wallet, FileText, 
    Activity, ArrowRight, LayoutGrid, Zap, CheckCircle, X,
    ArrowRightLeft, Trophy, AlertTriangle, Calendar, Edit2, Trash2, Bell,
    Calculator, Wrench, Download, Table, FileSpreadsheet, List, Percent, Shield,
    Filter, ChevronDown, CheckSquare, Square, Smartphone, Mail, Settings
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';
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

interface InvestmentAnalysisViewProps {
  history: BudgetData[];
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
  onUpdateData: (data: BudgetData) => void;
  investmentGoals: InvestmentGoal[];
  onUpdateGoals: (goals: InvestmentGoal[]) => void;
  onAddBudgetGoal?: (goal: GoalItem) => void;
  alerts: InvestmentAlert[];
  onUpdateAlerts: (alerts: InvestmentAlert[]) => void;
  notifications: NotificationItem[];
}

// Helper for compound interest
const calculateCompoundInterest = (p: number, pmt: number, rate: number, years: number) => {
    const r = rate / 100;
    const n = 12; // Monthly
    const t = years;
    
    // Future Value of Principal: P * (1 + r/n)^(nt)
    const fvPrincipal = p * Math.pow(1 + r/n, n*t);
    
    // Future Value of Contributions: PMT * [ (1 + r/n)^(nt) - 1 ] / (r/n)
    const fvContributions = pmt * (Math.pow(1 + r/n, n*t) - 1) / (r/n);
    
    return fvPrincipal + fvContributions;
};

// Helper for Contribution Planning (Reverse Calc)
const calculateRequiredContribution = (target: number, principal: number, rate: number, years: number) => {
    const r = rate / 100;
    const n = 12;
    const t = years;
    
    // Target = FV(Principal) + FV(Contributions)
    // Target - FV(Principal) = PMT * [ (1 + r/n)^(nt) - 1 ] / (r/n)
    // PMT = (Target - FV(Principal)) / ( [ (1 + r/n)^(nt) - 1 ] / (r/n) )
    
    const fvPrincipal = principal * Math.pow(1 + r/n, n*t);
    const remainingTarget = target - fvPrincipal;
    
    if (remainingTarget <= 0) return 0;
    
    const denominator = (Math.pow(1 + r/n, n*t) - 1) / (r/n);
    return remainingTarget / denominator;
};

export const InvestmentAnalysisView: React.FC<InvestmentAnalysisViewProps> = ({ 
    history, 
    currencySymbol, 
    onBack, 
    onProfileClick,
    onUpdateData,
    investmentGoals,
    onUpdateGoals,
    onAddBudgetGoal,
    alerts,
    onUpdateAlerts,
    notifications
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'personal' | 'business' | 'insights' | 'goals' | 'reports' | 'tools'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentItem | null>(null);
  const [editingAsset, setEditingAsset] = useState<InvestmentItem | null>(null);
  
  // Goal State
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<InvestmentGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);
  
  // Investment Notification System State (Local visibility)
  const [showInvNotifications, setShowInvNotifications] = useState(false);
  const [dismissedInvIds, setDismissedInvIds] = useState<string[]>([]);

  // Reports State
  const [reportType, setReportType] = useState<'summary' | 'allocation' | 'transactions'>('summary');
  const [reportTimeframe, setReportTimeframe] = useState<'1m' | '3m' | '6m' | 'ytd' | '1y'| 'all'>('3m');
  const [reportCategories, setReportCategories] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // Tools State - Calculator
  const [calcMode, setCalcMode] = useState<'growth' | 'contribution'>('growth');
  const [calcPrincipal, setCalcPrincipal] = useState<number>(0);
  const [calcMonthly, setCalcMonthly] = useState<number>(0);
  const [calcTarget, setCalcTarget] = useState<number>(1000000);
  const [calcRate, setCalcRate] = useState<number>(7);
  const [calcYears, setCalcYears] = useState<number>(10);
  const [calcInflation, setCalcInflation] = useState<number>(2.5);
  const [calcTax, setCalcTax] = useState<number>(15); // Capital Gains Tax
  
  const [smartAlerts, setSmartAlerts] = useState({
      volatility: true,
      sentiment: false,
      dividend: true,
      drift: false,
      push: true,
      email: true
  });

  // Get current data
  const currentData = history[history.length - 1];
  const investments = currentData.investments;

  // Initialize report categories
  useEffect(() => {
      const allCats = Array.from(new Set(investments.map(i => i.category || 'Other')));
      if (reportCategories.length === 0 && allCats.length > 0) {
          setReportCategories(allCats);
      }
  }, [investments]);

  const activeInvNotifications = useMemo(() => {
      return notifications.filter(n => !dismissedInvIds.includes(n.id));
  }, [notifications, dismissedInvIds]);

  const handleDismissNotification = (id: string) => {
      setDismissedInvIds(prev => [...prev, id]);
  };

  // --- Derived Metrics ---
  const metrics = useMemo(() => {
      const personalAssets = investments.filter(i => i.type === 'personal');
      const businessAssets = investments.filter(i => i.type === 'business');

      const personalTotal = personalAssets.reduce((sum, i) => sum + i.amount, 0);
      const businessTotal = businessAssets.reduce((sum, i) => sum + i.amount, 0);
      const totalValue = personalTotal + businessTotal;

      const personalInitial = personalAssets.reduce((sum, i) => sum + (i.initialValue || 0), 0);
      const businessInitial = businessAssets.reduce((sum, i) => sum + (i.initialValue || 0), 0);
      const totalInitial = personalInitial + businessInitial;
      
      const totalProfit = totalValue - totalInitial;
      const profitPercent = totalInitial > 0 ? (totalProfit / totalInitial) * 100 : 0;

      const monthlyCashFlow = businessAssets.reduce((sum, i) => sum + (i.monthlyCashFlow || 0), 0);
      const totalMonthlyContribution = investments.reduce((sum, i) => sum + (i.monthly || 0), 0);

      // Top Performers
      const sortedAssets = [...investments].sort((a, b) => {
          const gainA = (a.amount - (a.initialValue || a.amount)) / (a.initialValue || a.amount);
          const gainB = (b.amount - (b.initialValue || b.amount)) / (b.initialValue || b.amount);
          return gainB - gainA;
      });

      return {
          personalTotal, businessTotal, totalValue, totalProfit, profitPercent, monthlyCashFlow,
          personalAssets, businessAssets, totalMonthlyContribution, sortedAssets
      };
  }, [investments]);

  // Sync calculator defaults with real data
  useEffect(() => {
      if (activeTab === 'tools' && calcPrincipal === 0) {
          setCalcPrincipal(metrics.totalValue);
          setCalcMonthly(metrics.totalMonthlyContribution);
      }
  }, [activeTab, metrics]);

  // --- Historical Data for Charts ---
  const historyChartData = useMemo(() => {
      const dataPoints = history.slice(-6).map(h => {
          const total = h.investments.reduce((sum, i) => sum + i.amount, 0);
          return {
              date: new Date(h.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              value: total
          };
      });

      if (dataPoints.length < 2) {
          // Synthetic history for better visualization if no data
          const current = metrics.totalValue;
          const initial = metrics.totalValue - metrics.totalProfit;
          return {
              labels: ['Start', 'Now'],
              datasets: [{
                  label: 'Portfolio Value',
                  data: [initial, current],
                  borderColor: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  fill: true,
                  tension: 0.4
              }]
          };
      }

      return {
          labels: dataPoints.map(d => d.date),
          datasets: [{
              label: 'Portfolio Value',
              data: dataPoints.map(d => d.value),
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
              pointRadius: 3,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#6366f1',
              pointBorderWidth: 2
          }]
      };
  }, [history, metrics]);

  // --- Category Allocation Data ---
  const categoryChartData = useMemo(() => {
      const categories: Record<string, number> = {};
      investments.forEach(inv => {
          const cat = inv.category || 'Other';
          categories[cat] = (categories[cat] || 0) + inv.amount;
      });

      const colors = ['#6366f1', '#f97316', '#10b981', '#3b82f6', '#ec4899', '#64748b', '#8b5cf6', '#94a3b8'];

      return {
          labels: Object.keys(categories),
          datasets: [{
              data: Object.values(categories),
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 4
          }]
      };
  }, [investments]);

  // --- Filtered Report Data ---
  const filteredReportData = useMemo(() => {
      // 1. Determine Start Date
      const now = new Date();
      let startDate = new Date(0); // All time
      if (reportTimeframe === '1m') startDate = new Date(now.setMonth(now.getMonth() - 1));
      else if (reportTimeframe === '3m') startDate = new Date(now.setMonth(now.getMonth() - 3));
      else if (reportTimeframe === '6m') startDate = new Date(now.setMonth(now.getMonth() - 6));
      else if (reportTimeframe === 'ytd') startDate = new Date(now.getFullYear(), 0, 1);
      else if (reportTimeframe === '1y') startDate = new Date(now.setFullYear(now.getFullYear() - 1));

      // 2. Filter Assets by Category
      const activeAssets = investments.filter(i => reportCategories.includes(i.category || 'Other'));

      // 3. Generate Report Data
      if (reportType === 'transactions') {
          const txs = activeAssets.flatMap(asset =>
              (asset.transactions || [])
                  .filter(t => new Date(t.date) >= startDate)
                  .map(t => ({ ...t, assetName: asset.name, assetCategory: asset.category }))
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return txs;
      }

      if (reportType === 'allocation') {
          return activeAssets;
      }

      if (reportType === 'summary') {
          return activeAssets.map(asset => {
              // Estimate start value from history snapshots
              let startValue = asset.initialValue || 0;
              
              // Try to find a snapshot in global history closest to start date
              // Note: History is typically ordered by creation date
              const historicalSnapshot = history.find(h => h.created >= startDate.getTime());
              
              if (historicalSnapshot) {
                  const histAsset = historicalSnapshot.investments.find(i => i.id === asset.id);
                  if (histAsset) startValue = histAsset.amount;
              }

              // Calculate flows
              const relevantTxs = (asset.transactions || []).filter(t => new Date(t.date) >= startDate);
              const netFlow = relevantTxs.reduce((sum, t) => {
                  if (['deposit', 'buy'].includes(t.type)) return sum + t.amount;
                  if (['withdraw', 'sell'].includes(t.type)) return sum - t.amount;
                  return sum;
              }, 0);
              
              const gain = asset.amount - startValue - netFlow;
              
              return {
                  ...asset,
                  startValue,
                  netFlow,
                  gain,
                  roi: startValue > 0 ? (gain / startValue) * 100 : 0
              };
          });
      }
      return [];
  }, [reportTimeframe, reportCategories, reportType, investments, history]);

  // --- Handlers ---
  const handleSaveInvestment = (formData: any) => {
      let updatedInvestments;
      if (editingAsset) {
          updatedInvestments = investments.map(i => i.id === editingAsset.id ? { ...editingAsset, ...formData } : i);
      } else {
          updatedInvestments = [...investments, { 
              ...formData, 
              id: generateId(),
              initialValue: formData.amount, 
              contributed: false,
              history: [], 
              transactions: []
          }];
      }
      onUpdateData({ ...currentData, investments: updatedInvestments });
      setIsAddModalOpen(false);
      setEditingAsset(null);
  };

  const handleEditAsset = (asset: InvestmentItem) => {
      setEditingAsset(asset);
      setIsAddModalOpen(true);
  };

  const handleDeleteAsset = (id: string) => {
      if(confirm('Are you sure you want to delete this asset?')) {
          const updatedInvestments = investments.filter(i => i.id !== id);
          onUpdateData({ ...currentData, investments: updatedInvestments });
      }
  };

  const handleUpdateInvestment = (updatedItem: InvestmentItem) => {
      const updatedInvestments = investments.map(i => i.id === updatedItem.id ? updatedItem : i);
      onUpdateData({ ...currentData, investments: updatedInvestments });
      setSelectedAsset(null);
  };

  const handleAddTransaction = (assetId: string, transaction: InvestmentTransaction) => {
      const asset = investments.find(i => i.id === assetId);
      if (!asset) return;

      let newAmount = asset.amount;
      if (['buy', 'deposit', 'income'].includes(transaction.type)) {
          newAmount += transaction.amount;
      } else if (['sell', 'withdraw', 'expense'].includes(transaction.type)) {
          newAmount -= transaction.amount;
      }

      const updatedAsset = {
          ...asset,
          amount: newAmount,
          transactions: [transaction, ...(asset.transactions || [])]
      };
      
      const updatedInvestments = investments.map(i => i.id === updatedAsset.id ? updatedAsset : i);
      onUpdateData({ ...currentData, investments: updatedInvestments });
  };

  const handleAddAlert = (alert: any) => {
      onUpdateAlerts([...alerts, { ...alert, id: generateId(), active: true }]);
      setIsAlertModalOpen(false);
  };

  // --- Goal Handlers ---
  const handleSaveGoal = (goalData: any) => {
      if (editingGoal) {
          const updatedGoals = investmentGoals.map(g => g.id === editingGoal.id ? { ...editingGoal, ...goalData } : g);
          onUpdateGoals(updatedGoals);
          setEditingGoal(null);
      } else {
          const newId = generateId();
          const newGoal: InvestmentGoal = {
              id: newId,
              name: goalData.name,
              targetAmount: parseFloat(goalData.targetAmount),
              currentAmount: parseFloat(goalData.currentAmount) || 0,
              deadline: goalData.deadline,
              type: goalData.type
          };
          onUpdateGoals([...investmentGoals, newGoal]);

          if (onAddBudgetGoal) {
              const target = parseFloat(goalData.targetAmount);
              const current = parseFloat(goalData.currentAmount) || 0;
              const deadline = new Date(goalData.deadline);
              const now = new Date();
              const months = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
              const safeMonths = Math.max(1, months);
              const monthly = Math.ceil(Math.max(0, target - current) / safeMonths);

              onAddBudgetGoal({
                  id: newId, 
                  name: goalData.name,
                  target: target,
                  current: current,
                  monthly: monthly,
                  timeframe: `by ${goalData.deadline}`,
                  checked: false
              });
          }
      }
      setIsAddGoalModalOpen(false);
  };

  const handleEditGoal = (goal: InvestmentGoal) => {
      setEditingGoal(goal);
      setIsAddGoalModalOpen(true);
  };

  const handleUpdateGoal = (updatedGoal: InvestmentGoal) => {
      onUpdateGoals(investmentGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setSelectedGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
      if (confirm('Delete this goal?')) {
          onUpdateGoals(investmentGoals.filter(g => g.id !== id));
          setSelectedGoal(null);
      }
  };

  // --- Export Helpers ---
  const exportPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Investment Report: ${reportType.toUpperCase()}`, 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(`Timeframe: ${reportTimeframe.toUpperCase()}`, 20, 35);
      
      let y = 50;
      
      if (reportType === 'summary') {
          doc.text("Asset", 20, y); doc.text("Start Value", 70, y); doc.text("Net Flow", 110, y); doc.text("End Value", 150, y);
          y += 5; doc.line(20, y, 190, y); y += 5;
          
          (filteredReportData as any[]).forEach((item) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(item.name, 20, y);
              doc.text(formatCurrency(item.startValue, currencySymbol), 70, y);
              doc.text(formatCurrency(item.netFlow, currencySymbol), 110, y);
              doc.text(formatCurrency(item.amount, currencySymbol), 150, y);
              y += 7;
          });
      } else if (reportType === 'transactions') {
          doc.text("Date", 20, y); doc.text("Asset", 50, y); doc.text("Type", 90, y); doc.text("Amount", 160, y);
          y += 5; doc.line(20, y, 190, y); y += 5;
          
          (filteredReportData as any[]).forEach((item) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(item.date, 20, y);
              doc.text(item.assetName, 50, y);
              doc.text(item.type, 90, y);
              doc.text(formatCurrency(item.amount, currencySymbol), 160, y);
              y += 7;
          });
      } else if (reportType === 'allocation') {
          const cats: Record<string, number> = {};
          (filteredReportData as any[]).forEach(i => cats[i.category||'Other'] = (cats[i.category||'Other']||0) + i.amount);
          
          doc.text("Category", 20, y); doc.text("Value", 150, y);
          y += 5; doc.line(20, y, 190, y); y += 5;
          
          Object.entries(cats).forEach(([cat, val]) => {
              if (y > 270) { doc.addPage(); y = 20; }
              doc.text(cat, 20, y);
              doc.text(formatCurrency(val, currencySymbol), 150, y);
              y += 7;
          });
      }
      
      doc.save(`investment_${reportType}_report.pdf`);
  };

  const exportExcel = () => {
      const wb = XLSX.utils.book_new();
      let data: any[] = [];
      
      if (reportType === 'summary') {
          data = (filteredReportData as any[]).map(i => ({
              Asset: i.name, Category: i.category, Start: i.startValue, NetFlow: i.netFlow, End: i.amount, Gain: i.gain, ROI: i.roi
          }));
      } else if (reportType === 'transactions') {
          data = (filteredReportData as any[]).map(i => ({
              Date: i.date, Asset: i.assetName, Type: i.type, Amount: i.amount
          }));
      } else if (reportType === 'allocation') {
          data = (filteredReportData as any[]).map(i => ({
              Asset: i.name, Category: i.category, Value: i.amount
          }));
      }
      
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `investment_${reportType}.xlsx`);
  };

  // --- Renders ---

  const renderDashboard = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
                  <div className="flex items-center gap-2 opacity-80 mb-1">
                      <DollarSign size={14} />
                      <span className="text-xs font-bold uppercase">Total Portfolio</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue, currencySymbol)}</div>
                  <div className="mt-2 text-xs flex items-center gap-1 bg-white/20 w-fit px-2 py-0.5 rounded-full">
                      {metrics.profitPercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {metrics.profitPercent.toFixed(1)}% All time
                  </div>
              </Card>
              <div className="space-y-3">
                  <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)] border-l-4 border-l-emerald-500">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Profit/Loss</span>
                      <div className={`font-bold ${metrics.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {metrics.totalProfit >= 0 ? '+' : ''}{formatCurrency(metrics.totalProfit, currencySymbol)}
                      </div>
                  </Card>
                  <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)] border-l-4 border-l-amber-500">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Est. Monthly Growth</span>
                      <div className="font-bold text-amber-600">
                          +{formatCurrency(metrics.totalMonthlyContribution, currencySymbol)}/mo
                      </div>
                  </Card>
              </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button onClick={() => { setEditingAsset(null); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform whitespace-nowrap">
                  <Plus size={14} /> Add Asset
              </button>
              <button onClick={() => setIsTransactionModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform whitespace-nowrap">
                  <ArrowRightLeft size={14} /> Record Tx
              </button>
              <button onClick={() => setIsAlertModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform whitespace-nowrap">
                  <BellRing size={14} /> Alert
              </button>
          </div>

          {/* Portfolio History Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Portfolio Growth
              </h3>
              <div className="h-48 relative">
                  <Line 
                      data={historyChartData}
                      options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                          scales: {
                              x: { display: false },
                              y: { display: true, grid: { color: 'rgba(100, 116, 139, 0.1)' }, ticks: { callback: (v) => `${v}`.substring(0,3) + '..' } }
                          }
                      }}
                  />
              </div>
          </Card>

          {/* Asset Allocation & Top Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <PieChart size={16} className="text-indigo-500" /> Allocation
                  </h3>
                  <div className="h-40 relative">
                      <Doughnut 
                          data={categoryChartData}
                          options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } } }, cutout: '70%' }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-0 pr-16 md:pr-24">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Assets</span>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">{investments.length}</span>
                      </div>
                  </div>
              </Card>

              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" /> Top Performers
                  </h3>
                  <div className="space-y-3">
                      {metrics.sortedAssets.slice(0, 3).map((asset, i) => {
                          const gain = asset.amount - (asset.initialValue || 0);
                          const pct = (asset.initialValue || 0) > 0 ? (gain / (asset.initialValue || 0)) * 100 : 0;
                          return (
                              <div key={asset.id} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>#{i+1}</div>
                                      <div className="font-bold text-slate-700 dark:text-slate-300">{asset.name}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className={`font-bold ${pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</div>
                                      <div className="text-[10px] text-slate-400">{formatCurrency(gain, currencySymbol)}</div>
                                  </div>
                              </div>
                          );
                      })}
                      {metrics.sortedAssets.length === 0 && <p className="text-xs text-slate-400 italic">No assets to rank.</p>}
                  </div>
              </Card>
          </div>
      </div>
  );

  const renderAssetList = (type: 'personal' | 'business') => {
      const assets = type === 'personal' ? metrics.personalAssets : metrics.businessAssets;
      return (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
              {assets.map(asset => {
                  const gain = asset.amount - (asset.initialValue || 0);
                  const gainPct = (asset.initialValue || 0) > 0 ? (gain / (asset.initialValue || 0)) * 100 : 0;
                  return (
                      <Card key={asset.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]" onClick={() => setSelectedAsset(asset)}>
                          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${type === 'personal' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                  {type === 'personal' ? <User size={20} /> : <Building2 size={20} />}
                              </div>
                              <div className="min-w-0 overflow-hidden flex-1">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{asset.name}</h4>
                                  <p className="text-[10px] text-slate-500 truncate">{asset.category} {asset.symbol ? `• ${asset.symbol}` : ''}</p>
                              </div>
                          </div>
                          
                          <div className="w-16 h-8 mx-2 shrink-0 opacity-75">
                              <MiniSparkline history={asset.history || []} current={asset.amount} initial={asset.initialValue || asset.amount} />
                          </div>

                          <div className="text-right shrink-0 min-w-[70px]">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(asset.amount, currencySymbol)}</div>
                              <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                              </div>
                          </div>

                          <div className="flex flex-col gap-1 ml-2 pl-2 border-l border-slate-100 dark:border-slate-800">
                              <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset); }} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                                  <Edit2 size={14} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </Card>
                  );
              })}
              {assets.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                      <p>No {type} investments found.</p>
                      <button onClick={() => { setEditingAsset(null); setIsAddModalOpen(true); }} className="mt-2 text-indigo-500 font-bold text-xs">Add First Investment</button>
                  </div>
              )}
          </div>
      );
  };

  const renderInsights = () => {
      const monthlyContribution = metrics.totalMonthlyContribution;
      const annualRate = 0.07;
      const projectionMonths = 60; 
      const projectionData = [];
      const projectionLabels = [];
      let futureValue = metrics.totalValue;

      for (let i = 0; i <= projectionMonths; i++) {
          if (i % 6 === 0) {
              projectionData.push(futureValue);
              projectionLabels.push(i === 0 ? 'Now' : `+${i/12}y`);
          }
          futureValue = (futureValue + monthlyContribution) * (1 + annualRate/12);
      }

      const categories = ['Stocks', 'Crypto', 'RealEstate', 'BusinessProject'];
      const categoryRoi = categories.map(cat => {
          const catAssets = investments.filter(i => i.category === cat);
          if (catAssets.length === 0) return 0;
          const totalInit = catAssets.reduce((s, i) => s + (i.initialValue || i.amount), 0);
          const totalCurr = catAssets.reduce((s, i) => s + i.amount, 0);
          return totalInit > 0 ? ((totalCurr - totalInit) / totalInit) * 100 : 0;
      });

      return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 border border-indigo-500/20">
              <div className="flex gap-3">
                  <Sparkles className="text-indigo-500 shrink-0 mt-1" size={18} />
                  <div>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">AI Portfolio Insight</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                          "Based on your current {formatCurrency(monthlyContribution, currencySymbol)}/mo contribution and a conservative 7% return, you could reach {formatCurrency(futureValue, currencySymbol)} in 5 years."
                      </p>
                  </div>
              </div>
          </Card>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> 5-Year Wealth Projection
              </h3>
              <div className="h-48">
                  <Line 
                      data={{
                          labels: projectionLabels,
                          datasets: [{
                              label: 'Projected Value',
                              data: projectionData,
                              borderColor: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              fill: true,
                              tension: 0.4,
                              pointRadius: 3
                          }]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }, x: { grid: { display: false } } } }}
                  />
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 italic">Assumes {formatCurrency(monthlyContribution, currencySymbol)} monthly contribution & 7% annual growth.</p>
          </Card>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">ROI by Sector</h3>
              <div className="h-48">
                  <Bar 
                      data={{
                          labels: categories,
                          datasets: [{
                              label: 'ROI %',
                              data: categoryRoi,
                              backgroundColor: categoryRoi.map(v => v >= 0 ? '#8b5cf6' : '#ef4444'),
                              borderRadius: 4
                          }]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }}
                  />
              </div>
          </Card>

          <Card className="p-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white">Portfolio Health</h3>
                  <span className="text-xs font-bold text-emerald-500">Good</span>
              </div>
              <div className="space-y-3">
                  <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Diversification</span>
                          <span>75/100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-[75%] rounded-full"></div>
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Cash Drag (Uninvested)</span>
                          <span>10%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[10%] rounded-full"></div>
                      </div>
                  </div>
              </div>
          </Card>
      </div>
  )};

  const renderGoals = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Goals</h3>
              <button 
                onClick={() => { setEditingGoal(null); setIsAddGoalModalOpen(true); }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 active:scale-95 transition-transform bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg"
              >
                  + New Goal
              </button>
          </div>
          
          {investmentGoals.length === 0 ? (
              <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Target size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No investment goals set.</p>
                  <button onClick={() => { setEditingGoal(null); setIsAddGoalModalOpen(true); }} className="mt-2 text-indigo-500 text-xs font-bold">Create your first goal</button>
              </div>
          ) : (
              investmentGoals.map(goal => {
                  const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                  const isCompleted = progress >= 100;
                  
                  return (
                      <Card 
                        key={goal.id} 
                        className={`p-4 group cursor-pointer hover:shadow-md transition-all active:scale-[0.99] border-l-4 ${isCompleted ? 'border-l-emerald-500' : 'border-l-indigo-500'}`}
                        onClick={() => setSelectedGoal(goal)}
                      >
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{goal.name}</h4>
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Calendar size={10} /> Target: {new Date(goal.deadline).toLocaleDateString()}
                                  </p>
                              </div>
                              <div className="flex items-start gap-3">
                                  <div className="text-right">
                                      <div className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}`}>{Math.round(progress)}%</div>
                                      <div className="text-[10px] text-slate-400 font-bold uppercase">{goal.type}</div>
                                  </div>
                                  <div className="flex flex-col gap-1 pl-2 border-l border-slate-100 dark:border-slate-800">
                                      <button onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }} className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 size={14} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                              ></div>
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                              <span>{formatCurrency(goal.currentAmount, currencySymbol)}</span>
                              <span>{formatCurrency(goal.targetAmount, currencySymbol)}</span>
                          </div>
                      </Card>
                  );
              })
          )}

          <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Active Alerts</h3>
              <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.map(alert => (
                      <div key={alert.id} className="p-3 flex items-center gap-3">
                          <BellRing size={16} className="text-orange-500" />
                          <div className="flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{alert.assetName}</div>
                              <div className="text-[10px] text-slate-500">
                                  {alert.type === 'price_above' ? `Notify if price > ${formatCurrency(alert.value as number, currencySymbol)}` : 
                                   alert.type === 'price_below' ? `Notify if price < ${formatCurrency(alert.value as number, currencySymbol)}` : 
                                   `Date Reminder: ${alert.value}`}
                              </div>
                          </div>
                          <div className={`h-4 w-8 rounded-full relative ${alert.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${alert.active ? 'right-0.5' : 'left-0.5'}`}></div>
                          </div>
                      </div>
                  ))}
                  {alerts.length === 0 && <p className="p-4 text-center text-xs text-slate-400">No active alerts.</p>}
              </Card>
          </div>
      </div>
  );

  const renderReports = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
          
          {/* Report Configuration */}
          <Card className="p-4 bg-white dark:bg-slate-800 z-10" overflowHidden={false}>
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <Filter size={16} className="text-indigo-500" /> Filter Data
              </h3>
              
              <div className="space-y-4">
                  {/* Timeframe Selector */}
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Timeframe</label>
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto hide-scrollbar">
                          {['1m', '3m', '6m', 'ytd', '1y', 'all'].map(tf => (
                              <button
                                  key={tf}
                                  onClick={() => setReportTimeframe(tf as any)}
                                  className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${reportTimeframe === tf ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                  {tf.toUpperCase()}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Category Filter */}
                  <div className="relative z-50">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Asset Categories</label>
                      <button 
                          onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                      >
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                              {reportCategories.length === 0 ? 'Select Categories' : reportCategories.length === Array.from(new Set(investments.map(i => i.category || 'Other'))).length ? 'All Categories' : `${reportCategories.length} Selected`}
                          </span>
                          <ChevronDown size={16} className={`transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isCatDropdownOpen && (
                          <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 max-h-60 overflow-y-auto custom-scrollbar">
                              <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                  <button onClick={() => setReportCategories(Array.from(new Set(investments.map(i => i.category || 'Other'))))} className="text-xs font-bold text-indigo-600">Select All</button>
                                  <button onClick={() => setReportCategories([])} className="text-xs font-bold text-slate-400">Clear</button>
                              </div>
                              <div className="space-y-1">
                                  {Array.from(new Set(investments.map(i => i.category || 'Other'))).map(cat => (
                                      <div key={cat} onClick={() => {
                                          if (reportCategories.includes(cat)) setReportCategories(reportCategories.filter(c => c !== cat));
                                          else setReportCategories([...reportCategories, cat]);
                                      }} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
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

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-500" /> Report Type
              </h3>
              <div className="flex gap-2 mb-4">
                  {['summary', 'allocation', 'transactions'].map(type => (
                      <button 
                          key={type}
                          onClick={() => setReportType(type as any)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${reportType === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                          {type}
                      </button>
                  ))}
              </div>
              
              {/* Detailed Preview Table */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[300px] flex flex-col">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                      <h4 className="text-xs font-bold text-slate-500 uppercase">Preview Data</h4>
                      <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {filteredReportData.length} Records
                      </span>
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold sticky top-0 z-10">
                              <tr>
                                  {reportType === 'summary' && (
                                      <>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Asset</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Start</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">End</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Gain</th>
                                      </>
                                  )}
                                  {reportType === 'allocation' && (
                                      <>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Asset</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Category</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Value</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">%</th>
                                      </>
                                  )}
                                  {reportType === 'transactions' && (
                                      <>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Date</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Asset</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700">Type</th>
                                          <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Amount</th>
                                      </>
                                  )}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredReportData.length > 0 ? (
                                  filteredReportData.map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                          {reportType === 'summary' && (
                                              <>
                                                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                                                  <td className="p-3 text-right text-slate-500">{formatCurrency(item.startValue, currencySymbol)}</td>
                                                  <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{formatCurrency(item.amount, currencySymbol)}</td>
                                                  <td className={`p-3 text-right font-bold ${item.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(item.gain, currencySymbol)}</td>
                                              </>
                                          )}
                                          {reportType === 'allocation' && (
                                              <>
                                                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{item.name}</td>
                                                  <td className="p-3 text-slate-500">{item.category}</td>
                                                  <td className="p-3 text-right text-slate-900 dark:text-white font-bold">{formatCurrency(item.amount, currencySymbol)}</td>
                                                  <td className="p-3 text-right text-slate-500">{((item.amount / metrics.totalValue) * 100).toFixed(1)}%</td>
                                              </>
                                          )}
                                          {reportType === 'transactions' && (
                                              <>
                                                  <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{item.assetName}</td>
                                                  <td className="p-3 text-slate-500 capitalize">{item.type}</td>
                                                  <td className={`p-3 text-right font-bold ${['buy', 'deposit', 'income'].includes(item.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                                                      {['buy', 'deposit', 'income'].includes(item.type) ? '+' : '-'}{formatCurrency(item.amount, currencySymbol)}
                                                  </td>
                                              </>
                                          )}
                                      </tr>
                                  ))
                              ) : (
                                  <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">No data matches current filters.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={exportPDF} className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors">
                      <FileText size={16} /> Export PDF
                  </button>
                  <button onClick={exportExcel} className="flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors">
                      <FileSpreadsheet size={16} /> Export Excel
                  </button>
              </div>
          </Card>
      </div>
  );

  const renderTools = () => {
      // Calculate growth
      const futureValue = [calcPrincipal, calcMonthly, calcRate, calcYears].every(v => !isNaN(v)) 
          ? calculateCompoundInterest(calcPrincipal, calcMonthly, calcRate, calcYears) 
          : 0;
      
      const realRate = calcRate - calcInflation;
      const realFutureValue = [calcPrincipal, calcMonthly, realRate, calcYears].every(v => !isNaN(v)) 
          ? calculateCompoundInterest(calcPrincipal, calcMonthly, realRate, calcYears) 
          : 0;

      // Tax Calc: Assuming tax is on Gains only
      const totalContributions = calcPrincipal + (calcMonthly * 12 * calcYears);
      const totalGain = futureValue - totalContributions;
      const taxAmount = Math.max(0, totalGain * (calcTax / 100));
      const postTaxValue = futureValue - taxAmount;

      // Contribution Calc
      const requiredMonthly = [calcTarget, calcPrincipal, calcRate, calcYears].every(v => !isNaN(v))
          ? calculateRequiredContribution(calcTarget, calcPrincipal, calcRate, calcYears)
          : 0;

      const toggleAlert = (key: keyof typeof smartAlerts) => {
          setSmartAlerts(prev => ({ ...prev, [key]: !prev[key] }));
      };

      return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              
              {/* Enhanced Calculator */}
              <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                          <Calculator size={16} className="text-indigo-500" /> Advanced Financial Planner
                      </h3>
                      {/* Mode Toggle */}
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button onClick={() => setCalcMode('growth')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${calcMode === 'growth' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}>Projection</button>
                          <button onClick={() => setCalcMode('contribution')} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${calcMode === 'contribution' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}>Goal Planner</button>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {/* Inputs Grid */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Current Principal</label>
                              <div className="relative">
                                  <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">{currencySymbol}</span>
                                  <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2 pl-6 rounded-lg text-xs font-bold outline-none" value={calcPrincipal} onChange={e => setCalcPrincipal(parseFloat(e.target.value)||0)} />
                              </div>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Time Horizon (Years)</label>
                              <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold outline-none" value={calcYears} onChange={e => setCalcYears(parseFloat(e.target.value)||0)} />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Annual Return (%)</label>
                              <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold outline-none" value={calcRate} onChange={e => setCalcRate(parseFloat(e.target.value)||0)} />
                          </div>
                          
                          {/* Mode Specific Input */}
                          {calcMode === 'growth' ? (
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Monthly Contribution</label>
                                  <div className="relative">
                                      <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">{currencySymbol}</span>
                                      <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2 pl-6 rounded-lg text-xs font-bold outline-none" value={calcMonthly} onChange={e => setCalcMonthly(parseFloat(e.target.value)||0)} />
                                  </div>
                              </div>
                          ) : (
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Goal</label>
                                  <div className="relative">
                                      <span className="absolute left-2 top-2 text-slate-400 text-xs font-bold">{currencySymbol}</span>
                                      <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-2 pl-6 rounded-lg text-xs font-bold outline-none" value={calcTarget} onChange={e => setCalcTarget(parseFloat(e.target.value)||0)} />
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Advanced Settings */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Settings size={10} /> Advanced Factors</div>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 whitespace-nowrap">Inflation (%)</span>
                                  <input type="number" className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-xs font-bold" value={calcInflation} onChange={e => setCalcInflation(parseFloat(e.target.value)||0)} />
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 whitespace-nowrap">Tax Rate (%)</span>
                                  <input type="number" className="w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-xs font-bold" value={calcTax} onChange={e => setCalcTax(parseFloat(e.target.value)||0)} />
                              </div>
                          </div>
                      </div>
                      
                      {/* Results Display */}
                      <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl text-white">
                          {calcMode === 'growth' ? (
                              <>
                                  <p className="text-xs opacity-80 mb-1">Projected Nominal Value</p>
                                  <p className="text-2xl font-bold mb-3">{formatCurrency(futureValue, currencySymbol)}</p>
                                  
                                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                                      <div>
                                          <p className="text-[10px] opacity-70 uppercase">Inflation Adjusted (Real)</p>
                                          <p className="text-sm font-bold">{formatCurrency(realFutureValue, currencySymbol)}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] opacity-70 uppercase">Post-Tax Value</p>
                                          <p className="text-sm font-bold">{formatCurrency(postTaxValue, currencySymbol)}</p>
                                      </div>
                                  </div>
                              </>
                          ) : (
                              <>
                                  <p className="text-xs opacity-80 mb-1">Required Monthly Savings</p>
                                  <p className="text-2xl font-bold mb-3">{formatCurrency(requiredMonthly, currencySymbol)}</p>
                                  <p className="text-[10px] opacity-70 italic">To reach {formatCurrency(calcTarget, currencySymbol)} in {calcYears} years at {calcRate}% return.</p>
                              </>
                          )}
                      </div>
                  </div>
              </Card>

              {/* Smart Notification Management System */}
              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" /> Smart Alert Intelligence
                  </h3>
                  
                  <div className="space-y-4">
                      {/* Alert Toggles */}
                      <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Activity size={16} /></div>
                                  <div>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Volatility Guard</h4>
                                      <p className="text-[10px] text-slate-500">Alert if asset moves &gt;5% in a day</p>
                                  </div>
                              </div>
                              <Toggle checked={smartAlerts.volatility} onChange={() => toggleAlert('volatility')} />
                          </div>

                          <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Briefcase size={16} /></div>
                                  <div>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sentiment Watch</h4>
                                      <p className="text-[10px] text-slate-500">AI news sentiment alerts</p>
                                  </div>
                              </div>
                              <Toggle checked={smartAlerts.sentiment} onChange={() => toggleAlert('sentiment')} />
                          </div>

                          <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><DollarSign size={16} /></div>
                                  <div>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dividend Radar</h4>
                                      <p className="text-[10px] text-slate-500">Upcoming payout notifications</p>
                                  </div>
                              </div>
                              <Toggle checked={smartAlerts.dividend} onChange={() => toggleAlert('dividend')} />
                          </div>

                          <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><ScaleIcon /></div>
                                  <div>
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Drift Detector</h4>
                                      <p className="text-[10px] text-slate-500">Portfolio rebalancing reminders</p>
                                  </div>
                              </div>
                              <Toggle checked={smartAlerts.drift} onChange={() => toggleAlert('drift')} />
                          </div>
                      </div>

                      {/* Channels */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Notification Channels</h4>
                          <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${smartAlerts.push ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                      {smartAlerts.push && <CheckCircle size={10} className="text-white" />}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                      <Smartphone size={12} /> Push
                                  </div>
                                  <input type="checkbox" className="hidden" checked={smartAlerts.push} onChange={() => toggleAlert('push')} />
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${smartAlerts.email ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                      {smartAlerts.email && <CheckCircle size={10} className="text-white" />}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                      <Mail size={12} /> Email Digest
                                  </div>
                                  <input type="checkbox" className="hidden" checked={smartAlerts.email} onChange={() => toggleAlert('email')} />
                              </label>
                          </div>
                      </div>
                  </div>
              </Card>

              <Card className="p-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                      <Shield size={16} className="text-emerald-500" /> Risk Profile Assessment
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      Based on your goals and asset mix, we recommend reviewing your allocation quarterly to maintain a <strong>Balanced</strong> risk profile.
                  </div>
              </Card>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Wealth</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Investments</h1>
                    </div>
                </div>
                <div className="pb-1 flex items-center gap-1">
                    <button 
                        onClick={() => setShowInvNotifications(!showInvNotifications)}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {activeInvNotifications.length > 0 ? (
                            <>
                                <BellRing size={22} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                            </>
                        ) : (
                            <Bell size={22} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                        )}
                    </button>
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0">
                {[
                    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
                    { id: 'personal', label: 'Personal', icon: User },
                    { id: 'business', label: 'Business', icon: Building2 },
                    { id: 'insights', label: 'Insights', icon: Activity },
                    { id: 'goals', label: 'Goals', icon: Target },
                    { id: 'reports', label: 'Reports', icon: List },
                    { id: 'tools', label: 'Tools', icon: Wrench },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold border-b-2 transition-colors ${
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

       {/* Local Notification Popup for Investments */}
       {showInvNotifications && (
           <NotificationPopup 
               notifications={activeInvNotifications} 
               onClose={() => setShowInvNotifications(false)} 
               onNotificationClick={(item) => {
                   // Handle specific click actions if needed, for now just close
                   setShowInvNotifications(false);
               }} 
               onDismiss={handleDismissNotification}
           />
       )}

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'dashboard' && renderDashboard()}
           {activeTab === 'personal' && renderAssetList('personal')}
           {activeTab === 'business' && renderAssetList('business')}
           {activeTab === 'insights' && renderInsights()}
           {activeTab === 'goals' && renderGoals()}
           {activeTab === 'reports' && renderReports()}
           {activeTab === 'tools' && renderTools()}
       </div>

       {/* Modals */}
       {isAddModalOpen && (
           <AddInvestmentModal 
               isOpen={isAddModalOpen} 
               onClose={() => setIsAddModalOpen(false)} 
               onConfirm={handleSaveInvestment}
               currencySymbol={currencySymbol}
               initialData={editingAsset}
           />
       )}

       {selectedAsset && (
           <AssetDetailModal 
               isOpen={!!selectedAsset}
               onClose={() => setSelectedAsset(null)}
               asset={selectedAsset}
               onUpdate={handleUpdateInvestment}
               onAddTransaction={handleAddTransaction}
               currencySymbol={currencySymbol}
           />
       )}

       {isTransactionModalOpen && (
           <QuickTransactionModal 
               isOpen={isTransactionModalOpen}
               onClose={() => setIsTransactionModalOpen(false)}
               investments={investments}
               onConfirm={handleAddTransaction}
               currencySymbol={currencySymbol}
           />
       )}

       {isAlertModalOpen && (
           <SetAlertModal 
               isOpen={isAlertModalOpen}
               onClose={() => setIsAlertModalOpen(false)}
               investments={investments}
               onConfirm={handleAddAlert}
               currencySymbol={currencySymbol}
           />
       )}

       {/* Add/Edit Goal Modal */}
       {isAddGoalModalOpen && (
           <AddGoalModal 
                isOpen={isAddGoalModalOpen}
                onClose={() => setIsAddGoalModalOpen(false)}
                onConfirm={handleSaveGoal}
                currencySymbol={currencySymbol}
                initialData={editingGoal}
           />
       )}

       {/* Goal Detail Modal */}
       {selectedGoal && (
           <GoalDetailModal 
                isOpen={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                goal={selectedGoal}
                onUpdate={handleUpdateGoal}
                onDelete={handleDeleteGoal}
                currencySymbol={currencySymbol}
           />
       )}
    </div>
  );
};

// Toggle Component
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

// Icon for Scale (Drift Detector)
const ScaleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2v2H3z"/><path d="M19 7h2v2h-2z"/></svg>
);

const AddInvestmentModal = ({ isOpen, onClose, onConfirm, currencySymbol, initialData }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [target, setTarget] = useState('');
    const [monthly, setMonthly] = useState('');
    const [type, setType] = useState<'personal' | 'business'>('personal');
    const [category, setCategory] = useState('Stocks');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setAmount(initialData.amount);
                setTarget(initialData.target || '');
                setMonthly(initialData.monthly || '');
                setType(initialData.type || 'personal');
                setCategory(initialData.category || 'Stocks');
            } else {
                setName('');
                setAmount('');
                setTarget('');
                setMonthly('');
                setType('personal');
                setCategory('Stocks');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm({
            name,
            amount: parseFloat(amount) || 0,
            target: parseFloat(target) || 0,
            monthly: parseFloat(monthly) || 0,
            type,
            category
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{initialData ? 'Edit Asset' : 'Add Asset'}</h3>
                <div className="space-y-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setType('personal')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'personal' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}>Personal</button>
                        <button onClick={() => setType('business')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'business' ? 'bg-white dark:bg-slate-700 shadow text-amber-600' : 'text-slate-500'}`}>Business</button>
                    </div>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" placeholder="Asset Name" value={name} onChange={e => setName(e.target.value)} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                            <input className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold text-xs" type="number" placeholder="Current Value" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                            <input className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold text-xs" type="number" placeholder="Target Value" value={target} onChange={e => setTarget(e.target.value)} />
                        </div>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                        <input className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold text-xs" type="number" placeholder="Monthly Contribution" value={monthly} onChange={e => setMonthly(e.target.value)} />
                    </div>

                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                        {type === 'personal' ? (
                            <>
                                <option>Stocks</option><option>Crypto</option><option>RealEstate</option><option>MutualFunds</option><option>Savings</option><option>Other</option>
                            </>
                        ) : (
                            <>
                                <option>BusinessProject</option><option>Equipment</option><option>RealEstate</option><option>Equity</option>
                            </>
                        )}
                    </select>
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">{initialData ? 'Save Changes' : 'Add Asset'}</button>
                </div>
            </div>
        </div>
    );
};

const QuickTransactionModal = ({ isOpen, onClose, investments, onConfirm, currencySymbol }: any) => {
    const [assetId, setAssetId] = useState(investments[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('buy');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!assetId) return;
        onConfirm(assetId, {
            id: generateId(),
            date,
            type,
            amount: parseFloat(amount) || 0
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Transaction</h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Asset</label>
                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={assetId} onChange={e => setAssetId(e.target.value)}>
                            {investments.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={type} onChange={e => setType(e.target.value)}>
                                <option value="buy">Buy / Deposit</option>
                                <option value="sell">Sell / Withdraw</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                                <input className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Date</label>
                        <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Transaction</button>
                </div>
            </div>
        </div>
    );
};

const SetAlertModal = ({ isOpen, onClose, investments, onConfirm, currencySymbol }: any) => {
    const [assetId, setAssetId] = useState(investments[0]?.id || '');
    const [type, setType] = useState('price_below');
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!assetId) return;
        const assetName = investments.find((i:any) => i.id === assetId)?.name || 'Asset';
        onConfirm({
            assetId,
            assetName,
            type,
            value: type === 'date' ? value : (parseFloat(value) || 0)
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Set Alert</h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Asset</label>
                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={assetId} onChange={e => setAssetId(e.target.value)}>
                            {investments.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Condition</label>
                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={type} onChange={e => setType(e.target.value)}>
                            <option value="price_above">Value goes above</option>
                            <option value="price_below">Value drops below</option>
                            <option value="date">Date Reminder</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Value</label>
                        {type === 'date' ? (
                            <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={value} onChange={e => setValue(e.target.value)} />
                        ) : (
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                                <input className="w-full p-3 pl-7 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" type="number" value={value} onChange={e => setValue(e.target.value)} />
                            </div>
                        )}
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create Alert</button>
                </div>
            </div>
        </div>
    );
};

const AddGoalModal = ({ isOpen, onClose, onConfirm, currencySymbol, initialData }: any) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [type, setType] = useState<'value' | 'roi' | 'income'>('value');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setTargetAmount(initialData.targetAmount.toString());
                setCurrentAmount(initialData.currentAmount.toString());
                setDeadline(initialData.deadline);
                setType(initialData.type);
            } else {
                setName('');
                setTargetAmount('');
                setCurrentAmount('');
                setDeadline('');
                setType('value');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm({ name, targetAmount, currentAmount, deadline, type });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Goal' : 'Create Goal'}</h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Goal Name</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" placeholder="e.g. Retire by 45" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                                <input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold text-sm" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Current</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                                <input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold text-sm" type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Date</label>
                        <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={deadline} onChange={e => setDeadline(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Goal Type</label>
                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="value">Portfolio Value</option>
                            <option value="income">Passive Income</option>
                            <option value="roi">ROI Target</option>
                        </select>
                    </div>
                    <button onClick={handleSubmit} disabled={!name || !targetAmount} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2 disabled:opacity-50">{initialData ? 'Save Changes' : 'Create Goal'}</button>
                </div>
            </div>
        </div>
    );
};

const GoalDetailModal = ({ isOpen, onClose, goal, onUpdate, onDelete, currencySymbol }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(goal);

    if (!isOpen || !goal) return null;

    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = goal.targetAmount - goal.currentAmount;
    const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const handleSave = () => {
        onUpdate(editData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Goal' : goal.name}</h3>
                        {!isEditing && <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold uppercase">{goal.type}</span>}
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400"><X size={20} /></button>
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        <input className="w-full p-2 border rounded" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" />
                        <input className="w-full p-2 border rounded" type="number" value={editData.targetAmount} onChange={e => setEditData({...editData, targetAmount: parseFloat(e.target.value)})} placeholder="Target" />
                        <input className="w-full p-2 border rounded" type="number" value={editData.currentAmount} onChange={e => setEditData({...editData, currentAmount: parseFloat(e.target.value)})} placeholder="Current" />
                        <input className="w-full p-2 border rounded" type="date" value={editData.deadline} onChange={e => setEditData({...editData, deadline: e.target.value})} />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-slate-200 rounded font-bold text-sm">Cancel</button>
                            <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold text-sm">Save</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{Math.round(progress)}%</div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Completed</div>
                        </div>

                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${progress}%` }}></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Target</div>
                                <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(goal.targetAmount, currencySymbol)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current</div>
                                <div className="font-bold text-emerald-600">{formatCurrency(goal.currentAmount, currencySymbol)}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-500 font-medium px-1">
                            <span>Remaining: {formatCurrency(remaining, currencySymbol)}</span>
                            <span>{daysLeft} days left</span>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                                <Edit2 size={14} /> Edit
                            </button>
                            <button onClick={() => onDelete(goal.id)} className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetDetailModal = ({ isOpen, onClose, asset, onUpdate, onAddTransaction, currencySymbol }: any) => {
    const [transAmount, setTransAmount] = useState('');
    const [transType, setTransType] = useState('buy');
    const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen || !asset) return null;

    const handleQuickTrans = () => {
        if (!transAmount) return;
        onAddTransaction(asset.id, {
            id: generateId(),
            date: transDate,
            type: transType,
            amount: parseFloat(transAmount) || 0
        });
        setTransAmount('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{asset.name}</h3>
                        <p className="text-xs text-slate-500">{asset.category} • {asset.type}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400"><X size={20}/></button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4 text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Value</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(asset.amount, currencySymbol)}</div>
                    {asset.target > 0 && (
                        <div className="text-xs text-slate-400 mt-1">Target: {formatCurrency(asset.target, currencySymbol)}</div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Quick Action</h4>
                        <div className="flex gap-2 mb-2">
                            <select className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold rounded-lg p-2 outline-none flex-1" value={transType} onChange={e => setTransType(e.target.value)}>
                                <option value="buy">Add Value (+)</option>
                                <option value="sell">Remove Value (-)</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            <input type="date" className="bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold rounded-lg p-2 outline-none w-24" value={transDate} onChange={e => setTransDate(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <input type="number" className="bg-slate-100 dark:bg-slate-800 border-none text-sm font-bold rounded-lg p-2 outline-none flex-1" placeholder="Amount" value={transAmount} onChange={e => setTransAmount(e.target.value)} />
                            <button onClick={handleQuickTrans} className="bg-indigo-600 text-white rounded-lg px-4 font-bold text-xs">Save</button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">History</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {(asset.transactions || []).length > 0 ? (
                                asset.transactions.map((t: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <span className="text-slate-500">{t.date}</span>
                                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{t.type}</span>
                                        <span className={`font-bold ${['buy','deposit','income'].includes(t.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {['buy','deposit','income'].includes(t.type) ? '+' : '-'}{formatCurrency(t.amount, currencySymbol)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center">No transactions recorded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiniSparkline = ({ history, current, initial }: { history: { date: string, amount: number }[], current: number, initial: number }) => {
    // Generate simple SVG path
    let data = history.map(h => h.amount);
    
    // Create synthetic history if none exists to ensure a chart is visible
    if (data.length === 0) {
        data = [initial, current];
    } else {
        data.push(current);
    }
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 30;
    const width = 100;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const isUp = data[data.length - 1] >= data[0];

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
