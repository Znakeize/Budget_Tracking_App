import React, { useState, useEffect, useRef } from 'react';
import { BudgetData, InvestmentGoal, GoalItem, ShoppingListData } from '../types';
import { formatCurrency, generateId } from '../utils/calculations';
import { 
  Plus, ChevronLeft, Bell, BellRing, ArrowRight, Wallet, Target, Receipt, 
  CreditCard, PiggyBank, Landmark, TrendingUp 
} from 'lucide-react';
import { GoalActionModal } from '../components/ui/GoalActionModal';
import { AddItemModal } from '../components/ui/AddItemModal';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';
import { IncomeSection } from '../components/budget/IncomeSection';
import { GoalsSection } from '../components/budget/GoalsSection';
import { BillsSection } from '../components/budget/BillsSection';
import { ExpensesSection } from '../components/budget/ExpensesSection';
import { SavingsSection } from '../components/budget/SavingsSection';
import { DebtsSection } from '../components/budget/DebtsSection';
import { InvestmentsSection } from '../components/budget/InvestmentsSection';

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
                    <IncomeSection 
                        data={data.income} 
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('income', idx, field, val)}
                        onDelete={(idx) => deleteItem('income', idx)}
                        t={t}
                    />
                )}

                {activeSection === 'goals' && (
                    <GoalsSection 
                        data={data.goals}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('goals', idx, field, val)}
                        onDelete={(idx) => deleteItem('goals', idx)}
                        onToggleCheck={(idx, checked) => handleGoalChange(idx, checked)}
                        t={t}
                    />
                )}

                {activeSection === 'bills' && (
                    <BillsSection 
                        data={data.bills}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('bills', idx, field, val)}
                        onDelete={(idx) => deleteItem('bills', idx)}
                        t={t}
                    />
                )}

                {activeSection === 'expenses' && (
                    <ExpensesSection 
                        data={data.expenses}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('expenses', idx, field, val)}
                        onDelete={(idx) => deleteItem('expenses', idx)}
                        onEdit={(item, idx) => setEditingItem({ collection: 'expenses', index: idx, data: item })}
                        shoppingLists={shoppingLists}
                        onViewShoppingList={onViewShoppingList}
                        t={t}
                    />
                )}

                {activeSection === 'savings' && (
                    <SavingsSection 
                        data={data.savings}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('savings', idx, field, val)}
                        onDelete={(idx) => deleteItem('savings', idx)}
                        onTogglePaid={toggleSavingsPaid}
                        t={t}
                    />
                )}

                {activeSection === 'debts' && (
                    <DebtsSection 
                        data={data.debts}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('debts', idx, field, val)}
                        onDelete={(idx) => deleteItem('debts', idx)}
                        onTogglePaid={toggleDebtPaid}
                        t={t}
                    />
                )}

                {activeSection === 'investments' && (
                    <InvestmentsSection 
                        data={data.investments}
                        currencySymbol={data.currencySymbol}
                        onUpdate={(idx, field, val) => updateItem('investments', idx, field, val)}
                        onDelete={(idx) => deleteItem('investments', idx)}
                        onToggleContributed={toggleInvestmentContribution}
                        expandedId={expandedInvestmentId}
                        setExpandedId={setExpandedInvestmentId}
                        onAddHistory={addInvestmentHistory}
                        onUpdateHistory={updateInvestmentHistory}
                        onRemoveHistory={removeInvestmentHistory}
                        t={t}
                    />
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