
import React, { useState, useMemo } from 'react';
import { BudgetData, ShoppingListData } from '../types';
import { calculateTotals } from '../utils/calculations';
import { 
  LayoutGrid, DollarSign, CreditCard, 
  Activity, PieChart, 
  Target, Shield, Bell, ChevronLeft, Filter,
  FileText, 
  Receipt, Landmark, PiggyBank
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';
import { AnalysisReportDashboard } from './AnalysisReportDashboard';
import { IncomeAnalysisSection } from './IncomeAnalysisSection';
import { CashFlowAnalysisSection } from './CashFlowAnalysisSection';
import { AnalysisPlanner } from './AnalysisPlanner';
import { AnalysisOverview } from './AnalysisOverview';
import { AnalysisExpensesTab } from '../components/analysis/AnalysisExpensesTab';
import { AnalysisBillsTab } from '../components/analysis/AnalysisBillsTab';
import { AnalysisDebtsTab } from '../components/analysis/AnalysisDebtsTab';
import { AnalysisSavingsTab } from '../components/analysis/AnalysisSavingsTab';
import { AnalysisToolsTab } from '../components/analysis/AnalysisToolsTab';
import { CategoryDetailModal } from '../components/analysis/CategoryDetailModal';
import { FilterModal } from '../components/analysis/FilterModal';

interface AnalysisViewProps {
  history: BudgetData[];
  shoppingLists: ShoppingListData[];
  currencySymbol: string;
  notificationCount: number;
  onToggleNotifications: () => void;
  onBack: () => void;
  onProfileClick: () => void;
}

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

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterConfig, setFilterConfig] = useState({
      timeMode: 'preset', // 'preset', 'month', 'range'
      timeframe: 'ALL', // 3M, 6M, 1Y, ALL
      specificMonth: { month: new Date().getMonth(), year: new Date().getFullYear() },
      dateRange: { start: '', end: '' },
      categories: [] as string[],
      minAmount: '',
      maxAmount: ''
  });

  // --- Tools State ---
  const [alertSettings, setAlertSettings] = useState({
      thresholds: true,
      unusual: true,
      bills: true,
      balance: false,
      subs: false
  });

  // --- Data Processing & Filtration ---
  
  // 1. Get all unique categories for filter dropdown
  const allCategories = useMemo(() => {
      const cats = new Set<string>();
      history.forEach(h => h.expenses.forEach(e => cats.add(e.name)));
      return Array.from(cats).sort();
  }, [history]);

  // 2. Filter History & Current Period
  const { sortedHistory, currentPeriod, isFilterActive } = useMemo(() => {
      let data = [...history].sort((a, b) => a.created - b.created);
      
      const isCatActive = filterConfig.categories.length > 0;
      const isAmtActive = !!filterConfig.minAmount || !!filterConfig.maxAmount;
      let isTimeActive = false;

      // Timeframe Filter Logic
      if (filterConfig.timeMode === 'preset') {
          if (filterConfig.timeframe !== 'ALL') {
              const months = filterConfig.timeframe === '3M' ? 3 : filterConfig.timeframe === '6M' ? 6 : 12;
              data = data.slice(-months);
              isTimeActive = true;
          }
      } else if (filterConfig.timeMode === 'month') {
          data = data.filter(h => h.month === filterConfig.specificMonth.month && h.year === filterConfig.specificMonth.year);
          isTimeActive = true;
      } else if (filterConfig.timeMode === 'range') {
          if (filterConfig.dateRange.start && filterConfig.dateRange.end) {
              const start = new Date(filterConfig.dateRange.start).getTime();
              const end = new Date(filterConfig.dateRange.end).getTime();
              // Filter based on the period's "created" date or construct date from month/year
              data = data.filter(h => {
                  const periodDate = new Date(h.year, h.month, 1).getTime();
                  return periodDate >= start && periodDate <= end;
              });
              isTimeActive = true;
          }
      }

      // Content Filter
      const processed = data.map(period => ({
          ...period,
          expenses: period.expenses.filter(e => {
              const catMatch = !isCatActive || filterConfig.categories.includes(e.name);
              const minMatch = !filterConfig.minAmount || e.spent >= parseFloat(filterConfig.minAmount);
              const maxMatch = !filterConfig.maxAmount || e.spent <= parseFloat(filterConfig.maxAmount);
              return catMatch && minMatch && maxMatch;
          }),
          income: period.income.filter(i => {
              // Apply amount filter to income as well
              const minMatch = !filterConfig.minAmount || i.actual >= parseFloat(filterConfig.minAmount);
              const maxMatch = !filterConfig.maxAmount || i.actual <= parseFloat(filterConfig.maxAmount);
              return minMatch && maxMatch;
          })
      }));

      // Fallback if filtration removes everything, though structure remains
      const current = processed.length > 0 ? processed[processed.length - 1] : { ...history[history.length - 1], expenses: [], income: [] };
      
      return { 
          sortedHistory: processed, 
          currentPeriod: current,
          isFilterActive: isTimeActive || isCatActive || isAmtActive
      };
  }, [history, filterConfig]);
  
  const currentTotals = useMemo(() => currentPeriod ? calculateTotals(currentPeriod) : { totalExpenses: 0, totalIncome: 0, actualBills: 0, actualDebts: 0, totalSavings: 0, actualInvestments: 0, leftToSpend: 0, totalPortfolioValue: 0, totalOut: 0 }, [currentPeriod]);

  const handleToggleAlert = (key: string) => {
      setAlertSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof alertSettings] }));
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
                    {!['reports', 'tools'].includes(activeTab) && (
                        <button 
                            onClick={() => setIsFilterOpen(true)}
                            className={`relative p-1.5 focus:outline-none active:scale-95 transition-transform ${isFilterActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-full' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                        >
                            <Filter size={20} />
                            {isFilterActive && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-slate-900"></span>}
                        </button>
                    )}
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
           {activeTab === 'overview' && <AnalysisOverview history={sortedHistory} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'income' && <IncomeAnalysisSection history={sortedHistory} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'expenses' && <AnalysisExpensesTab sortedHistory={sortedHistory} currentPeriod={currentPeriod} currentTotals={currentTotals} currencySymbol={currencySymbol} shoppingLists={shoppingLists} onCategoryClick={setSelectedCategoryDetail} />}
           {activeTab === 'bills' && <AnalysisBillsTab sortedHistory={sortedHistory} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'debts' && <AnalysisDebtsTab sortedHistory={sortedHistory} currentPeriod={currentPeriod} currentTotals={currentTotals} currencySymbol={currencySymbol} />}
           {activeTab === 'savings' && <AnalysisSavingsTab sortedHistory={sortedHistory} currentPeriod={currentPeriod} currentTotals={currentTotals} currencySymbol={currencySymbol} />}
           {activeTab === 'cashflow' && <CashFlowAnalysisSection history={sortedHistory} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'planner' && <AnalysisPlanner history={sortedHistory} currentPeriod={currentPeriod} currencySymbol={currencySymbol} />}
           {activeTab === 'reports' && (
               <AnalysisReportDashboard 
                   history={history} 
                   currencySymbol={currencySymbol} 
               />
           )}
           {activeTab === 'tools' && <AnalysisToolsTab alertSettings={alertSettings} onToggleAlert={handleToggleAlert} />}
       </div>

       {/* Category Deep Dive Modal */}
       {selectedCategoryDetail && (
           <CategoryDetailModal 
               isOpen={!!selectedCategoryDetail}
               onClose={() => setSelectedCategoryDetail(null)}
               categoryName={selectedCategoryDetail}
               currentPeriod={currentPeriod}
               history={sortedHistory}
               currencySymbol={currencySymbol}
               shoppingLists={shoppingLists}
           />
       )}

       {/* Filter Modal */}
       <FilterModal 
           isOpen={isFilterOpen}
           onClose={() => setIsFilterOpen(false)}
           config={filterConfig}
           onUpdate={setFilterConfig}
           allCategories={allCategories}
           currencySymbol={currencySymbol}
           years={Array.from(new Set(history.map(h => h.year))).sort((a: number, b: number) => b - a)}
       />
    </div>
  );
};
