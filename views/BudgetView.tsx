
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BudgetData, InvestmentGoal, GoalItem, ShoppingListData } from '../types';
import { formatCurrency, generateId } from '../utils/calculations';
import { 
  Plus, Trash2, ChevronDown, ChevronRight, Calendar, Bell, BellRing, 
  ArrowRight, Wallet, Target, Receipt, 
  CreditCard, PiggyBank, Landmark, TrendingUp, ChevronLeft, ShoppingBag, ShoppingCart, Edit2 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import { GoalActionModal } from '../components/ui/GoalActionModal';
import { AddItemModal } from '../components/ui/AddItemModal';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BudgetViewProps {
  data: BudgetData;
  updateData: (newData: BudgetData) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  focusTarget?: { section: string, itemId: string } | null;
  clearFocusTarget?: () => void;
  onProfileClick: () => void;
  onCreateShoppingList?: (name: string, budget: number) => void;
  onAddInvestmentGoal?: (goal: InvestmentGoal) => void;
  onGoalUpdate?: (goal: GoalItem) => void;
  shoppingLists?: ShoppingListData[];
  onViewShoppingList?: (listId: string, shopId: string) => void;
  onExpenseCategoryChange?: (oldName: string, newName: string, newBudget: number) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ 
  data, 
  updateData, 
  notificationCount, 
  onToggleNotifications,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  focusTarget,
  clearFocusTarget,
  onProfileClick,
  onCreateShoppingList,
  onAddInvestmentGoal,
  onGoalUpdate,
  shoppingLists = [],
  onViewShoppingList,
  onExpenseCategoryChange
}) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null);
  const [goalToConfirm, setGoalToConfirm] = useState<number | null>(null);
  const [addingCollection, setAddingCollection] = useState<keyof BudgetData | null>(null);
  const [editingItem, setEditingItem] = useState<{ collection: keyof BudgetData, index: number, data: any } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when changing sections
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  // Deep Link Handling
  useEffect(() => {
    if (focusTarget) {
      setActiveSection(focusTarget.section);
      // Give time for the section to render
      setTimeout(() => {
        const el = document.getElementById(focusTarget.itemId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect - Using box-shadow and background pulse for better visibility
          el.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/40', 'transition-all', 'duration-500');
          setTimeout(() => {
               el.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/40');
               if (clearFocusTarget) clearFocusTarget();
          }, 2500);
        }
      }, 300);
    }
  }, [focusTarget]);

  const updateItem = (collection: keyof BudgetData, index: number, field: string, value: any) => {
    const newData = { ...data };
    const list = newData[collection] as any[];
    
    // Capture state before update for comparison/params
    const currentItem = { ...list[index] };

    if (collection === 'expenses' && onExpenseCategoryChange) {
        if (field === 'name') {
             if (currentItem.name !== value) {
                 onExpenseCategoryChange(currentItem.name, value, currentItem.budgeted);
             }
        } else if (field === 'budgeted') {
             if (currentItem.budgeted !== value) {
                 // Use current name since only budget changed
                 onExpenseCategoryChange(currentItem.name, currentItem.name, value);
             }
        }
    }

    list[index] = { ...currentItem, [field]: value };
    updateData(newData);
    
    // If updating a goal current amount, trigger sync
    if (collection === 'goals' && field === 'current' && onGoalUpdate) {
        onGoalUpdate(list[index]);
    }
  };

  const deleteItem = (collection: keyof BudgetData, index: number) => {
    const newData = { ...data };
    const list = newData[collection] as any[];
    list.splice(index, 1);
    updateData(newData);
  };

  const handleAddItem = (itemData: any) => {
    if (!addingCollection) return;
    const newData = { ...data };
    const list = newData[addingCollection] as any[];
    
    // Process specific fields based on collection if needed
    if (addingCollection === 'investments') {
        // Ensure default type is 'personal' so it appears in the Personal Investment section
        itemData.type = 'personal';
        itemData.category = 'Other';
        // Set initial value to current amount to avoid massive gain calculation
        itemData.initialValue = itemData.amount;
    }

    // Generate ID once to share if needed
    const newId = generateId();
    list.push({ ...itemData, id: newId });
    updateData(newData);

    // Sync to Investment Goals
    if (addingCollection === 'goals' && onAddInvestmentGoal) {
        const now = new Date();
        let daysToAdd = 365; // Default 1 year
        const tf = (itemData.timeframe || '').toLowerCase();
        
        const match = tf.match(/(\d+)\s*(month|year|week|day)/);
        if (match) {
            const num = parseInt(match[1]);
            const unit = match[2];
            if (unit.startsWith('year')) daysToAdd = num * 365;
            else if (unit.startsWith('month')) daysToAdd = num * 30;
            else if (unit.startsWith('week')) daysToAdd = num * 7;
            else if (unit.startsWith('day')) daysToAdd = num;
        }

        const deadlineDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        onAddInvestmentGoal({
            id: newId, // Use same ID for linking
            name: itemData.name,
            targetAmount: parseFloat(itemData.target) || 0,
            currentAmount: parseFloat(itemData.current) || 0,
            deadline: deadlineDate.toISOString().split('T')[0],
            type: 'value'
        });
    }

    setAddingCollection(null);
  };

  const handleModalConfirm = (itemData: any) => {
    if (editingItem) {
        const newData = { ...data };
        const list = newData[editingItem.collection] as any[];
        
        // Handle expense update sync within modal confirm
        if (editingItem.collection === 'expenses' && onExpenseCategoryChange) {
            const oldItem = list[editingItem.index];
            if (oldItem.name !== itemData.name || oldItem.budgeted !== itemData.budgeted) {
                 onExpenseCategoryChange(oldItem.name, itemData.name, itemData.budgeted);
            }
        }

        // Merge updates (keep ID and other existing fields)
        list[editingItem.index] = { ...list[editingItem.index], ...itemData };
        updateData(newData);
        setEditingItem(null);
    } else if (addingCollection) {
        handleAddItem(itemData);
    }
  };

  const handleGoalChange = (index: number, isChecked: boolean) => {
    if (isChecked) {
        setGoalToConfirm(index);
    } else {
        toggleGoalCheck(index, false);
    }
  };

  const confirmGoalCheck = () => {
    if (goalToConfirm !== null) {
        toggleGoalCheck(goalToConfirm, true);
        setGoalToConfirm(null);
    }
  };

  const toggleGoalCheck = (index: number, isChecked: boolean) => {
    const newData = { ...data };
    const goal = newData.goals[index];
    const monthlyAmount = goal.monthly || 0;
    
    goal.checked = isChecked;
    
    if (isChecked) {
        goal.current = (goal.current || 0) + monthlyAmount;
    } else {
        const newAmount = (goal.current || 0) - monthlyAmount;
        goal.current = newAmount < 0 ? 0 : newAmount;
    }
    
    updateData(newData);
    
    // Sync update to parent/other views
    if (onGoalUpdate) {
        onGoalUpdate(goal);
    }
  };

  const toggleDebtPaid = (index: number, isPaid: boolean) => {
    const newData = { ...data };
    const newDebts = [...newData.debts];
    const debt = { ...newDebts[index] };
    const paymentAmount = debt.payment || 0;
    
    debt.paid = isPaid;
    if (isPaid) {
        const newBalance = (debt.balance || 0) - paymentAmount;
        debt.balance = newBalance < 0 ? 0 : newBalance;
    } else {
        debt.balance = (debt.balance || 0) + paymentAmount;
    }
    
    newDebts[index] = debt;
    newData.debts = newDebts;
    updateData(newData);
  };

  const toggleSavingsPaid = (index: number, isPaid: boolean) => {
    const newData = { ...data };
    const newSavings = [...newData.savings];
    const item = { ...newSavings[index] };
    const contribution = item.planned || 0;

    item.paid = isPaid;
    if (isPaid) {
        item.balance = (item.balance || 0) + contribution;
        item.amount = contribution; // Used for cash flow calc (this period's outflow)
    } else {
        // Revert balance
        const newBalance = (item.balance || 0) - contribution;
        item.balance = newBalance < 0 ? 0 : newBalance;
        item.amount = 0;
    }

    newSavings[index] = item;
    newData.savings = newSavings;
    updateData(newData);
  };

  const toggleInvestmentContribution = (index: number, isContributed: boolean) => {
    const newData = { ...data };
    const newInvestments = [...newData.investments];
    const item = { ...newInvestments[index] };
    const contribution = item.monthly || 0;
    const today = new Date().toISOString().split('T')[0];

    item.contributed = isContributed;
    
    if (isContributed) {
        // Increase Current Value
        item.amount = (item.amount || 0) + contribution;
        // Increase Cost Basis (Initial Value) so Profit % doesn't spike artificially
        item.initialValue = (item.initialValue || 0) + contribution;
        
        // Auto-add to history for chart sync
        if (!item.history) item.history = [];
        item.history.push({ date: today, amount: item.amount });
    } else {
        // Revert Value
        const newAmount = (item.amount || 0) - contribution;
        item.amount = newAmount < 0 ? 0 : newAmount;
        
        // Revert Cost Basis
        const newInitial = (item.initialValue || 0) - contribution;
        item.initialValue = newInitial < 0 ? 0 : newInitial;

        // Remove today's history entry if exists (undo logic)
        if (item.history && item.history.length > 0) {
            const lastEntry = item.history[item.history.length - 1];
            // Simple check: if last entry matches today and approximate amount, remove it
            if (lastEntry.date === today) {
                item.history.pop();
            }
        }
    }

    // Ensure history is sorted
    if (item.history) {
        item.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    newInvestments[index] = item;
    newData.investments = newInvestments;
    updateData(newData);
  };

  const addInvestmentHistory = (index: number) => {
    const newData = { ...data };
    const investment = newData.investments[index];
    if (!investment.history) investment.history = [];
    investment.history.push({
        date: new Date().toISOString().split('T')[0],
        amount: investment.amount
    });
    investment.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    updateData(newData);
  };

  const updateInvestmentHistory = (invIndex: number, histIndex: number, field: 'date' | 'amount', value: any) => {
    const newData = { ...data };
    const investment = newData.investments[invIndex];
    if (investment.history) {
        investment.history[histIndex] = { ...investment.history[histIndex], [field]: value };
        investment.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    updateData(newData);
  };

  const removeInvestmentHistory = (invIndex: number, histIndex: number) => {
    const newData = { ...data };
    const investment = newData.investments[invIndex];
    if (investment.history) {
        investment.history.splice(histIndex, 1);
    }
    updateData(newData);
  };

  const totals = {
    income: data.income.reduce((acc, item) => ({ planned: acc.planned + item.planned, actual: acc.actual + item.actual }), { planned: 0, actual: 0 }),
    expenses: data.expenses.reduce((acc, item) => ({ budgeted: acc.budgeted + item.budgeted, spent: acc.spent + item.spent }), { budgeted: 0, spent: 0 }),
    bills: data.bills.reduce((acc, item) => ({ total: acc.total + item.amount, unpaid: acc.unpaid + (item.paid ? 0 : item.amount) }), { total: 0, unpaid: 0 }),
    savings: data.savings.reduce((acc, item) => ({ planned: acc.planned + item.planned, amount: acc.amount + item.amount }), { planned: 0, amount: 0 }),
    debts: data.debts.reduce((acc, item) => ({ balance: acc.balance + item.balance, payment: acc.payment + item.payment }), { balance: 0, payment: 0 }),
    goals: data.goals.reduce((sum, item) => sum + item.monthly, 0),
    // Only count personal investments in the budget view
    investments: data.investments
      .filter(i => i.type === 'personal' || !i.type)
      .reduce((sum, item) => sum + item.amount, 0)
  };

  // Configuration for the cards with translations
  const sections = [
    {
        id: 'income',
        title: t('budget.section.income'),
        icon: Wallet,
        color: 'emerald',
        summary: `${t('budget.summary.total')}: ${formatCurrency(totals.income.actual, data.currencySymbol)} | ${data.income.length} ${t('budget.summary.sources')}`
    },
    {
        id: 'goals',
        title: t('budget.section.goals'),
        icon: Target,
        color: 'blue',
        summary: `${data.goals.length} ${t('budget.section.goals')} | ${t('budget.summary.monthly')}: ${formatCurrency(totals.goals, data.currencySymbol)}`
    },
    {
        id: 'bills',
        title: t('budget.section.bills'),
        icon: Receipt,
        color: 'indigo',
        summary: `${data.bills.length} ${t('budget.section.bills')} | ${t('budget.summary.unpaid')}: ${formatCurrency(totals.bills.unpaid, data.currencySymbol)}`
    },
    {
        id: 'expenses',
        title: t('budget.section.expenses'),
        icon: CreditCard,
        color: 'pink',
        summary: `${t('budget.summary.spent')}: ${formatCurrency(totals.expenses.spent, data.currencySymbol)} ${t('budget.summary.spent_of')} ${formatCurrency(totals.expenses.budgeted, data.currencySymbol)}`
    },
    {
        id: 'savings',
        title: t('budget.section.savings'),
        icon: PiggyBank,
        color: 'teal',
        summary: `${t('budget.summary.saved')}: ${formatCurrency(totals.savings.amount, data.currencySymbol)}`
    },
    {
        id: 'debts',
        title: t('budget.section.debts'),
        icon: Landmark,
        color: 'orange',
        summary: `${t('budget.summary.balance')}: ${formatCurrency(totals.debts.balance, data.currencySymbol)} | ${data.debts.length} ${t('budget.section.debts')}`
    },
    {
        id: 'investments',
        title: t('budget.section.investments'),
        icon: TrendingUp,
        color: 'violet',
        summary: `${t('budget.summary.value')}: ${formatCurrency(totals.investments, data.currencySymbol)}`
    }
  ];

  return (
    <div className="flex flex-col h-full relative">
      {/* Fixed Header */}
      <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex justify-between items-end">
            <div className="flex items-center gap-3">
                {activeSection && (
                    <button onClick={() => setActiveSection(null)} className="p-2 -ml-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                )}
                <div>
                    <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                        {activeSection ? t('budget.edit_details') : t('budget.manage_plan')}
                    </h2>
                    <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                        {activeSection ? sections.find(s => s.id === activeSection)?.title : t('budget.title')}
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 pb-1">
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

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
        {!activeSection ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-14 gap-x-6 pt-8 pb-10 px-2">
                {sections.map((section) => (
                    <BudgetSectionCard 
                        key={section.id}
                        title={section.title}
                        summary={section.summary}
                        icon={section.icon}
                        color={section.color}
                        onClick={() => setActiveSection(section.id)}
                    />
                ))}
            </div>
        ) : (
            /* Detail View for Active Section */
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {sections.find(s => s.id === activeSection)?.title}
                    </h2>
                    <button 
                        onClick={() => setAddingCollection(activeSection as keyof BudgetData)} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} /> {t('budget.add_new')}
                    </button>
                </div>

                {/* Specific Section Content Renderers */}
                {activeSection === 'income' && (
                    <div className="space-y-3">
                        {data.income.map((item, idx) => (
                            <div key={item.id} id={item.id} className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
                                <input 
                                    className="bg-transparent font-bold text-lg text-slate-900 dark:text-white outline-none w-full mb-3" 
                                    value={item.name} 
                                    onChange={(e) => updateItem('income', idx, 'name', e.target.value)} 
                                    placeholder={t('budget.placeholder.source')}
                                />
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">{t('budget.label.planned')}</span>
                                        <div className="flex items-center">
                                            <span className="text-slate-400 text-sm mr-1">{data.currencySymbol}</span>
                                            <input type="number" className="bg-transparent w-full font-semibold outline-none text-slate-700 dark:text-slate-300 min-w-0" 
                                                value={item.planned || ''} onChange={(e) => updateItem('income', idx, 'planned', parseFloat(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-3 py-2 border border-emerald-100 dark:border-emerald-500/20">
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold block mb-1">{t('budget.label.actual')}</span>
                                        <div className="flex items-center">
                                            <span className="text-emerald-600/70 text-sm mr-1">{data.currencySymbol}</span>
                                            <input type="number" className="bg-transparent w-full font-bold outline-none text-emerald-600 dark:text-emerald-400 min-w-0" 
                                                value={item.actual || ''} onChange={(e) => updateItem('income', idx, 'actual', parseFloat(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <button onClick={() => deleteItem('income', idx)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all self-center"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeSection === 'goals' && (
                    <div className="space-y-3">
                        {data.goals.map((item, idx) => {
                            const progress = item.target > 0 ? (item.current / item.target) * 100 : 0;
                            return (
                                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.checked ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Checkbox 
                                            checked={item.checked} 
                                            onChange={(val) => handleGoalChange(idx, val)} 
                                        />
                                        <input 
                                            className={`bg-transparent font-bold text-lg outline-none flex-1 min-w-0 ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}
                                            value={item.name} 
                                            onChange={(e) => updateItem('goals', idx, 'name', e.target.value)} 
                                            placeholder={t('budget.placeholder.goal')}
                                        />
                                        <button onClick={() => deleteItem('goals', idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t('budget.label.current_saved')}</span>
                                            <div className="flex items-center text-blue-500 dark:text-blue-400">
                                                <span className="text-sm mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full font-bold outline-none min-w-0" 
                                                    value={item.current || ''} onChange={(e) => updateItem('goals', idx, 'current', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{t('budget.label.target')}</span>
                                            <div className="flex items-center text-slate-700 dark:text-slate-300">
                                                <span className="text-sm mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full font-bold outline-none min-w-0" 
                                                    value={item.target || ''} onChange={(e) => updateItem('goals', idx, 'target', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">{t('budget.label.monthly_contribution')}</span>
                                            <div className="flex items-center text-slate-900 dark:text-white w-20">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                                    value={item.monthly || ''} onChange={(e) => updateItem('goals', idx, 'monthly', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                         <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                                            <input type="text" className="bg-transparent w-full text-xs font-medium text-center outline-none text-slate-500" 
                                                value={item.timeframe} placeholder={t('budget.placeholder.timeframe')} onChange={(e) => updateItem('goals', idx, 'timeframe', e.target.value)} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                            <span>{t('budget.label.progress')}</span>
                                            <span>{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSection === 'bills' && (
                    <div className="space-y-3">
                        {data.bills.map((item, idx) => {
                            const today = new Date().toISOString().split('T')[0];
                            const isOverdue = !item.paid && item.dueDate < today;
                            return (
                                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-emerald-500/30 opacity-70' : 'border-slate-200 dark:border-slate-700'} ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Checkbox checked={item.paid} onChange={(val) => updateItem('bills', idx, 'paid', val)} />
                                        <input 
                                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                                            value={item.name} 
                                            onChange={(e) => updateItem('bills', idx, 'name', e.target.value)} 
                                            placeholder={t('budget.placeholder.bill')}
                                        />
                                        <button onClick={() => deleteItem('bills', idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pl-9">
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                            <Calendar size={14} />
                                            <input type="date" className="bg-transparent outline-none w-full text-xs font-bold uppercase" style={{ colorScheme: 'dark' }} value={item.dueDate} onChange={(e) => updateItem('bills', idx, 'dueDate', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                            <span className="text-xs font-bold text-slate-400">{t('budget.label.amt')}</span>
                                            <div className="flex items-center flex-1 text-slate-900 dark:text-white">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" value={item.amount || ''} onChange={(e) => updateItem('bills', idx, 'amount', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    </div>
                                    {isOverdue && <div className="pl-9 mt-2 text-xs font-bold text-red-500 animate-pulse">⚠️ {t('budget.warn.overdue')}</div>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSection === 'expenses' && (
                    <div className="space-y-3">
                        {data.expenses.map((item, idx) => {
                            const linkedShops = shoppingLists.flatMap(l => l.shops.filter(s => s.budgetCategory === item.name).map(s => ({ ...s, listId: l.id })));
                            
                            // Calculate total from linked shops for visualization
                            const shopTotal = linkedShops.reduce((sum, s) => {
                                return sum + s.items.filter(i => i.checked).reduce((acc, i) => acc + (i.actualPrice ?? i.price ?? 0), 0);
                            }, 0);
                            const manualSpent = item.spent - shopTotal;

                            return (
                            <div key={item.id} id={item.id} className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300">
                                <input 
                                    className="bg-transparent font-bold text-lg text-slate-900 dark:text-white outline-none w-full mb-3" 
                                    value={item.name} 
                                    onChange={(e) => updateItem('expenses', idx, 'name', e.target.value)} 
                                    placeholder={t('budget.placeholder.category')}
                                />
                                <div className="flex gap-3 mb-3">
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">{t('budget.label.budget')}</span>
                                        <div className="flex items-center">
                                            <span className="text-slate-400 text-sm mr-1">{data.currencySymbol}</span>
                                            <input type="number" className="bg-transparent w-full font-semibold outline-none text-slate-700 dark:text-slate-300 min-w-0" 
                                                value={item.budgeted || ''} onChange={(e) => updateItem('expenses', idx, 'budgeted', parseFloat(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-pink-50 dark:bg-pink-900/10 rounded-lg px-3 py-2 border border-pink-100 dark:border-pink-500/20">
                                        <span className="text-xs text-pink-500 uppercase font-bold block mb-1">{t('budget.label.spent')}</span>
                                        <div className="flex items-center">
                                            <span className="text-pink-600/70 text-sm mr-1">{data.currencySymbol}</span>
                                            <input type="number" className="bg-transparent w-full font-bold outline-none text-pink-600 dark:text-pink-400 min-w-0" 
                                                value={item.spent || ''} onChange={(e) => updateItem('expenses', idx, 'spent', parseFloat(e.target.value) || 0)} />
                                        </div>
                                        {linkedShops.length > 0 && (
                                            <div className="mt-1 pt-1 border-t border-pink-200/50 dark:border-pink-500/30 flex flex-col gap-0.5">
                                                <div className="flex justify-between items-center text-[9px] text-pink-600/80 dark:text-pink-300">
                                                    <span className="flex items-center gap-1"><ShoppingCart size={8}/> Lists</span>
                                                    <span>{formatCurrency(shopTotal, data.currencySymbol)}</span>
                                                </div>
                                                {Math.abs(manualSpent) > 0.01 && (
                                                    <div className="flex justify-between items-center text-[9px] text-slate-500/80 dark:text-slate-400">
                                                        <span className="flex items-center gap-1"><Wallet size={8}/> Manual</span>
                                                        <span>{formatCurrency(manualSpent, data.currencySymbol)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 self-center">
                                        <button onClick={() => setEditingItem({ collection: 'expenses', index: idx, data: item })} className="text-slate-300 hover:text-indigo-500 p-2 transition-colors"><Edit2 size={20} /></button>
                                        <button onClick={() => deleteItem('expenses', idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.spent > item.budgeted ? 'bg-red-500' : 'bg-pink-500'}`} style={{width: `${Math.min((item.spent/item.budgeted)*100, 100)}%`}}></div>
                                </div>
                                
                                {linkedShops.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {linkedShops.map(shop => (
                                            <button 
                                                key={shop.id}
                                                onClick={() => onViewShoppingList && onViewShoppingList(shop.listId, shop.id)}
                                                className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                            >
                                                <ShoppingBag size={10} /> Linked: {shop.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                )}

                {activeSection === 'savings' && (
                    <div className="space-y-3">
                        {data.savings.map((item, idx) => {
                             return (
                                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-teal-500/30 opacity-80' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Checkbox checked={!!item.paid} onChange={(val) => toggleSavingsPaid(idx, val)} />
                                        <input 
                                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                                            value={item.name} 
                                            onChange={(e) => updateItem('savings', idx, 'name', e.target.value)} 
                                            placeholder={t('budget.placeholder.fund')}
                                        />
                                        <button onClick={() => deleteItem('savings', idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 pl-9">
                                        <div className="bg-teal-50 dark:bg-teal-900/10 rounded-lg px-3 py-2 border border-teal-100 dark:border-teal-500/20">
                                            <span className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold block mb-1">{t('budget.label.total_fund')}</span>
                                            <div className="flex items-center text-teal-700 dark:text-teal-300">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                                    value={item.balance || 0} 
                                                    // Manual update of balance logic could conflict with checkbox logic, but we allow editing total
                                                    onChange={(e) => updateItem('savings', idx, 'balance', parseFloat(e.target.value) || 0)} 
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('budget.label.monthly_plan')}</span>
                                            <div className="flex items-center text-slate-900 dark:text-white">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                                    value={item.planned || ''} onChange={(e) => updateItem('savings', idx, 'planned', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    </div>
                                    {item.paid && (
                                        <div className="pl-9 mt-2 text-[10px] font-bold text-teal-500 flex items-center gap-1">
                                            <Target size={12} /> {formatCurrency(item.amount, data.currencySymbol)} {t('budget.label.saved_this_month')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSection === 'debts' && (
                    <div className="space-y-3">
                        {data.debts.map((item, idx) => {
                            const today = new Date().toISOString().split('T')[0];
                            const isOverdue = !item.paid && item.dueDate && item.dueDate < today;
                            return (
                                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.paid ? 'border-emerald-500/30 opacity-70' : 'border-slate-200 dark:border-slate-700'} ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Checkbox checked={item.paid} onChange={(val) => toggleDebtPaid(idx, val)} />
                                        <input 
                                            className={`flex-1 min-w-0 bg-transparent font-bold text-lg outline-none ${item.paid ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}
                                            value={item.name} 
                                            onChange={(e) => updateItem('debts', idx, 'name', e.target.value)} 
                                            placeholder={t('budget.placeholder.debt')}
                                        />
                                        <button onClick={() => deleteItem('debts', idx)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 pl-9">
                                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-500/20">
                                            <span className="text-[10px] text-orange-600 dark:text-orange-400 uppercase font-bold block mb-1">{t('budget.label.monthly_pay')}</span>
                                            <div className="flex items-center text-orange-700 dark:text-orange-300">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                                    value={item.payment || ''} onChange={(e) => updateItem('debts', idx, 'payment', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <div className={`rounded-lg px-3 py-2 border flex flex-col justify-center ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}`}>
                                            <span className="text-[10px] uppercase font-bold opacity-70 mb-1">{t('budget.section.bills')} {t('budget.warn.overdue')}?</span>
                                            <input type="date" className="bg-transparent outline-none w-full text-xs font-bold uppercase p-0" style={{ colorScheme: 'dark' }} value={item.dueDate || ''} onChange={(e) => updateItem('debts', idx, 'dueDate', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">{t('budget.label.remaining_balance')}</span>
                                            <div className="flex items-center text-slate-900 dark:text-white">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                                    value={item.balance || ''} onChange={(e) => updateItem('debts', idx, 'balance', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeSection === 'investments' && (
                     <div className="space-y-4">
                        <div className="bg-violet-100 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 text-center">
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-300 uppercase tracking-wider block mb-1">{t('budget.summary.value')}</span>
                            {/* Calculate investment total here or accept from props, using local calc for now to match structure */}
                            <span className="text-3xl font-extrabold text-violet-900 dark:text-white">
                                {formatCurrency(data.investments.filter(i => i.type === 'personal' || !i.type).reduce((s, i) => s + i.amount, 0), data.currencySymbol)}
                            </span>
                        </div>

                        {data.investments.map((item, idx) => {
                            if (item.type === 'business') return null; // Don't show business assets in Budget Tracker
                            const progress = item.target && item.target > 0 ? (item.amount / item.target) * 100 : 0;
                            return (
                                <div key={item.id} id={item.id} className={`bg-white dark:bg-slate-800/50 rounded-xl p-4 border shadow-sm transition-all duration-300 ${item.contributed ? 'border-violet-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Checkbox 
                                            checked={!!item.contributed} 
                                            onChange={(val) => toggleInvestmentContribution(idx, val)} 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    className={`bg-transparent font-bold text-lg outline-none flex-1 min-w-0 ${item.contributed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`} 
                                                    value={item.name} 
                                                    onChange={(e) => updateItem('investments', idx, 'name', e.target.value)} 
                                                    placeholder={t('budget.placeholder.asset')}
                                                />
                                                <button 
                                                    onClick={() => setExpandedInvestmentId(expandedInvestmentId === item.id ? null : item.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${expandedInvestmentId === item.id ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                                                >
                                                    {expandedInvestmentId === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteItem('investments', idx)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={20} /></button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3 pl-9">
                                        <div className="bg-violet-50 dark:bg-violet-900/10 rounded-lg px-3 py-2 border border-violet-100 dark:border-violet-500/20">
                                            <span className="text-[10px] text-violet-600 dark:text-violet-400 uppercase font-bold block mb-1">{t('budget.label.current_value')}</span>
                                            <div className="flex items-center text-violet-700 dark:text-violet-300">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                                    value={item.amount || 0} onChange={(e) => updateItem('investments', idx, 'amount', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{t('budget.label.target_value')}</span>
                                            <div className="flex items-center text-slate-900 dark:text-white">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none" 
                                                    value={item.target || ''} onChange={(e) => updateItem('investments', idx, 'target', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pl-9 mb-3">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-xs text-slate-500 font-medium">{t('budget.label.monthly_contribution')}</span>
                                            <div className="flex items-center text-slate-900 dark:text-white w-24">
                                                <span className="text-xs mr-1">{data.currencySymbol}</span>
                                                <input type="number" className="bg-transparent w-full text-sm font-bold outline-none text-right" 
                                                    value={item.monthly || ''} onChange={(e) => updateItem('investments', idx, 'monthly', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        {item.contributed && (
                                            <div className="mt-1 text-[10px] font-bold text-violet-500 flex items-center gap-1 justify-end">
                                                <TrendingUp size={10} /> {t('budget.label.contributed_month')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pl-9">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                            <span>{t('budget.label.progress')}</span>
                                            <span>{progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                            <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                        </div>
                                        
                                        {/* Mini Sparkline always visible */}
                                        <InvestmentSparkline amount={item.amount} history={item.history} />
                                    </div>

                                    {expandedInvestmentId === item.id && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 pl-9">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-[10px] font-bold text-slate-500 uppercase">{t('budget.label.history')}</h4>
                                                <button onClick={() => addInvestmentHistory(idx)} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md hover:bg-slate-50 shadow-sm flex items-center gap-1">
                                                    <Plus size={10} /> {t('budget.label.add_entry')}
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                {(!item.history || item.history.length === 0) && (
                                                    <p className="text-xs text-slate-400 italic text-center py-2">No history records found.</p>
                                                )}
                                                {item.history?.map((hist, hIdx) => (
                                                    <div key={hIdx} className="flex gap-2 items-center">
                                                        <input 
                                                            type="date" 
                                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none w-28"
                                                            value={hist.date}
                                                            onChange={(e) => updateInvestmentHistory(idx, hIdx, 'date', e.target.value)}
                                                        />
                                                        <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5">
                                                            <span className="text-xs text-slate-400 mr-1">$</span>
                                                            <input 
                                                                type="number" 
                                                                className="bg-transparent w-full text-xs font-bold outline-none text-slate-700 dark:text-slate-200"
                                                                value={hist.amount}
                                                                onChange={(e) => updateInvestmentHistory(idx, hIdx, 'amount', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </div>
                                                        <button onClick={() => removeInvestmentHistory(idx, hIdx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                )}
            </div>
        )}
      </div>

      <GoalActionModal 
        isOpen={goalToConfirm !== null} 
        onClose={() => setGoalToConfirm(null)} 
        onConfirm={confirmGoalCheck} 
        goal={goalToConfirm !== null ? data.goals[goalToConfirm] : null} 
        currencySymbol={data.currencySymbol} 
      />

      <AddItemModal 
        isOpen={addingCollection !== null || editingItem !== null}
        onClose={() => { setAddingCollection(null); setEditingItem(null); }}
        onConfirm={handleModalConfirm}
        collection={addingCollection || (editingItem ? editingItem.collection : null)}
        initialData={editingItem ? editingItem.data : null}
        currencySymbol={data.currencySymbol}
        onCreateShoppingList={onCreateShoppingList}
      />
    </div>
  );
};

// Helper Component for the Card Design
const BudgetSectionCard = ({ title, summary, icon: Icon, color, onClick }: any) => {
    // Dynamic color class mapping for Tailwind 
    const colorClasses: any = {
        emerald: "hover:bg-emerald-500 hover:border-emerald-500 text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 group-hover:text-emerald-500",
        blue: "hover:bg-blue-500 hover:border-blue-500 text-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20 group-hover:text-blue-500",
        indigo: "hover:bg-indigo-500 hover:border-indigo-500 text-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 group-hover:text-indigo-500",
        pink: "hover:bg-pink-500 hover:border-pink-500 text-pink-500 border-pink-500 bg-pink-50 dark:bg-pink-900/20 group-hover:text-pink-500",
        teal: "hover:bg-teal-500 hover:border-teal-500 text-teal-500 border-teal-500 bg-teal-50 dark:bg-teal-900/20 group-hover:text-teal-500",
        orange: "hover:bg-orange-500 hover:border-orange-500 text-orange-500 border-orange-500 bg-orange-50 dark:bg-orange-900/20 group-hover:text-orange-500",
        violet: "hover:bg-violet-500 hover:border-violet-500 text-violet-500 border-violet-500 bg-violet-50 dark:bg-violet-900/20 group-hover:text-violet-500",
    };

    const styles = colorClasses[color] || colorClasses.emerald;
    
    // Parts extraction
    const iconBgClass = styles.split(' ').filter((c: string) => c.startsWith('bg-')).join(' ');
    const iconTextClass = styles.split(' ').filter((c: string) => c.startsWith('text-')).join(' ');
    const borderClass = styles.split(' ').filter((c: string) => c.startsWith('border-')).join(' ');
    const groupHoverTextClass = styles.split(' ').filter((c: string) => c.startsWith('group-hover:text-')).join(' ');

    return (
        <div 
            onClick={onClick}
            className={`relative flex flex-col items-center px-8 py-[53px] rounded-[30px] border-2 bg-white dark:bg-slate-900 transition-all duration-500 group cursor-pointer border-slate-100 dark:border-slate-800 hover:shadow-2xl ${styles.split(' ').filter((c: string) => c.startsWith('hover:')).join(' ')}`}
        >
            {/* Icon Circle */}
            <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${iconBgClass} ${iconTextClass} group-hover:bg-white ${groupHoverTextClass} shadow-sm`}>
                <Icon size={28} strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center gap-2 mt-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-white text-center transition-colors duration-300">
                    {title}
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-white/90 text-center transition-colors duration-300 line-clamp-2 leading-relaxed px-2">
                    {summary}
                </p>
            </div>

            {/* Floating Action Button */}
            <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center h-10 px-8 rounded-full border bg-white dark:bg-slate-800 shadow-md transition-all duration-500 transform group-hover:scale-105 ${borderClass} ${iconTextClass} group-hover:border-white ${groupHoverTextClass}`}>
                <ArrowRight size={20} strokeWidth={2} />
            </div>
        </div>
    );
};

const InvestmentSparkline = ({ amount, history }: { amount: number, history?: { date: string, amount: number }[] }) => {
    const chartData = useMemo(() => {
        let points = [];
        let labels = [];

        if (history && history.length > 0) {
            points = history.map(h => h.amount);
            labels = history.map(h => h.date);
            // Ensure the very current amount is represented as the last point if it differs from history
            // or just always append current state for real-time feel
            if (history[history.length - 1].amount !== amount) {
                points.push(amount);
                labels.push('Now');
            }
        } else {
             const steps = 6;
             let current = amount * 0.8;
             if (amount <= 0) {
                 points = Array(steps + 1).fill(0);
             } else {
                for (let i = 0; i < steps; i++) {
                    const noise = (Math.random() - 0.5) * (amount * 0.1); 
                    const trend = (amount - current) / (steps - i);
                    current += trend + noise;
                    points.push(current);
                }
                points.push(amount);
             }
             labels = Array(steps + 1).fill('');
        }

        return {
            labels: labels,
            datasets: [{
                data: points,
                borderColor: '#a78bfa',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: history && history.length > 0 ? 2 : 0,
                fill: false,
            }]
        };
    }, [amount, history]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        scales: {
            x: { display: false },
            y: { display: false, min: Math.min(...chartData.datasets[0].data) * 0.95, max: Math.max(...chartData.datasets[0].data) * 1.05 }
        },
        animation: { duration: 0 } as any
    };

    return (
        <div className="w-full h-10 opacity-70">
            <Line data={chartData} options={options} />
        </div>
    );
};
