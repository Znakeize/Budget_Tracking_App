import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Plus, Layers, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { SharedGroup, SharedExpense, SharedMember } from '../../types';
import { AddSharedExpenseModal } from './AddSharedExpenseModal';
import { AddGroupCategoryModal } from './AddGroupCategoryModal';
import { generateId } from '../../utils/calculations';

interface GroupExpensesTabProps {
  group: SharedGroup;
  onUpdate: (g: SharedGroup) => void;
  onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void;
}

export const GroupExpensesTab: React.FC<GroupExpensesTabProps> = ({ group, onUpdate, onCreateShoppingList }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const handleSaveExpense = (expense: SharedExpense) => {
    const isEdit = !!editingExpense;
    
    let updatedExpenses: SharedExpense[];
    let logText = '';

    if (isEdit) {
        updatedExpenses = group.expenses.map(e => e.id === expense.id ? expense : e);
        logText = `edited ${expense.title}`;
    } else {
        updatedExpenses = [expense, ...group.expenses];
        logText = `added ${expense.title}`;
    }

    const newActivity = {
        id: Math.random().toString(36).substr(2,9),
        type: isEdit ? 'edit' : 'expense',
        text: logText,
        date: 'Just now',
        user: 'You',
        amount: expense.amount
    };

    // Note: Type casting for newActivity to bypass strict type check if needed, or update types.ts to match exact structure
    onUpdate({ 
        ...group, 
        expenses: updatedExpenses,
        activityLog: [newActivity as any, ...group.activityLog] 
    });
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
      if (confirm("Are you sure you want to delete this expense?")) {
          onUpdate({
              ...group,
              expenses: group.expenses.filter(e => e.id !== id)
          });
          setExpandedExpenseId(null);
      }
  };

  const handleAddCategory = (name: string) => {
      if (group.categories.includes(name)) return;
      onUpdate({ ...group, categories: [...group.categories, name] });
      setIsAddCategoryOpen(false);
  };

  const openAddModal = () => {
      setEditingExpense(null);
      setIsExpenseModalOpen(true);
  };

  const openEditModal = (expense: SharedExpense) => {
      setEditingExpense(expense);
      setIsExpenseModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex gap-3">
        <button 
            onClick={openAddModal}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
        >
            <Plus size={18} /> Add Expense
        </button>
        <button 
            onClick={() => setIsAddCategoryOpen(true)}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
        >
            <Layers size={18} /> Add Category
        </button>
      </div>

      <div className="space-y-2">
        {group.expenses.map(expense => {
            const payer = group.members.find(m => m.id === expense.paidBy);
            const isExpanded = expandedExpenseId === expense.id;
            const isReminder = expense.type === 'reminder';
            const isSettlement = expense.type === 'settlement';

            return (
              <Card 
                key={expense.id} 
                className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500/20' : 'active:scale-[0.99]'} ${isReminder ? 'border-orange-200 dark:border-orange-500/20' : ''}`}
              >
                {/* Header - Clickable */}
                <div 
                    className="p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${payer?.avatarColor || 'bg-slate-400'} flex items-center justify-center text-white font-bold text-xs`}>
                        {payer?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{expense.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {isReminder ? 'Reminder Sent' : `${payer?.name} paid`} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                        <div className={`font-bold text-sm ${isSettlement ? 'text-emerald-500' : isReminder ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                        {group.currency} {expense.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                            {isSettlement ? 'Settlement' : isReminder ? 'Reminder' : `Shared with ${expense.sharedWith.length}`}
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-3"></div>
                        
                        <div className="space-y-3 text-xs">
                            {/* Meta Row with Actions */}
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-md font-bold ${isReminder ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                        {expense.category}
                                    </span>
                                    {isSettlement && (
                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                                            Payment
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {!isSettlement && !isReminder && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(expense); }}
                                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-bold"
                                        >
                                            <Pencil size={10} /> Edit
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense.id); }}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-bold"
                                    >
                                        <Trash2 size={10} /> Delete
                                    </button>
                                </div>
                            </div>

                            {/* Notes */}
                            {expense.notes && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-slate-500 italic">
                                    "{expense.notes}"
                                </div>
                            )}

                            {/* Split Breakdown */}
                            {!isSettlement && !isReminder && (
                                <div>
                                    <p className="font-bold text-slate-500 uppercase text-[10px] mb-2">Split Details</p>
                                    <div className="space-y-2">
                                        {Object.entries(expense.split).map(([userId, amount]) => {
                                            const member = group.members.find(m => m.id === userId);
                                            return (
                                                <div key={userId} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-5 h-5 rounded-full ${member?.avatarColor || 'bg-slate-300'} flex items-center justify-center text-[8px] text-white font-bold border border-white/10`}>
                                                            {member?.name.charAt(0)}
                                                        </div>
                                                        <span className="text-slate-700 dark:text-slate-300">{member?.name || 'Unknown'}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {group.currency} {amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
              </Card>
            );
        })}
        {group.expenses.length === 0 && <p className="text-center text-xs text-slate-400 py-8">No shared expenses yet.</p>}
      </div>

      <AddSharedExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onConfirm={handleSaveExpense}
        group={group}
        initialData={editingExpense}
        onCreateShoppingList={onCreateShoppingList}
        onDelete={editingExpense ? () => handleDeleteExpense(editingExpense.id) : undefined}
      />

      <AddGroupCategoryModal 
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
};