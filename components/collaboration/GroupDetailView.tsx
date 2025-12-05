import React, { useState } from 'react';
import { Pencil, PieChart, Wallet, Users, BarChart2 } from 'lucide-react';
import { SharedGroup, SharedMember } from '../../types';
import { CreateGroupModal } from './CreateGroupModal';
import { GroupOverviewTab } from './GroupOverviewTab';
import { GroupExpensesTab } from './GroupExpensesTab';
import { GroupMembersTab } from './GroupMembersTab';
import { GroupReportsTab } from './GroupReportsTab';

interface GroupDetailViewProps {
  group: SharedGroup;
  onUpdate: (g: SharedGroup) => void;
  onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void;
}

export const GroupDetailView: React.FC<GroupDetailViewProps> = ({ group, onUpdate, onCreateShoppingList }) => {
  const [tab, setTab] = useState<'overview' | 'expenses' | 'members' | 'reports'>('overview');
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);

  const totalSpent = group.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const remaining = group.totalBudget - totalSpent;
  const progress = group.totalBudget > 0 ? (totalSpent / group.totalBudget) * 100 : 0;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
      
      {/* Group Header & Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{group.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                          {group.members.map((m, i) => (
                              <div key={i} className={`w-7 h-7 rounded-full ${m.avatarColor} border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-bold`}>
                                  {m.name.charAt(0)}
                              </div>
                          ))}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{group.members.length} members</span>
                  </div>
              </div>
              <div className="relative flex gap-1">
                  <button 
                      onClick={() => setIsEditGroupOpen(true)}
                      className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none text-slate-400 hover:text-indigo-500"
                  >
                      <Pencil size={20} />
                  </button>
              </div>
          </div>

          <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Budget Used: {Math.round(progress)}%</span>
                  <span className="text-slate-900 dark:text-white">{group.currency} {totalSpent.toLocaleString()} <span className="text-slate-400 font-normal">/ {group.totalBudget.toLocaleString()}</span></span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                      className={`h-full rounded-full transition-all duration-500 ${progress > 100 ? 'bg-red-500' : progress > 85 ? 'bg-orange-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
              </div>
          </div>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'expenses', label: 'Expenses', icon: Wallet },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
              tab === t.id 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <GroupOverviewTab group={group} remaining={remaining} setTab={setTab} />}
      {tab === 'expenses' && <GroupExpensesTab group={group} onUpdate={onUpdate} onCreateShoppingList={onCreateShoppingList} />}
      {tab === 'members' && <GroupMembersTab group={group} onUpdate={onUpdate} />}
      {tab === 'reports' && <GroupReportsTab group={group} totalSpent={totalSpent} />}

      <CreateGroupModal 
        isOpen={isEditGroupOpen}
        onClose={() => setIsEditGroupOpen(false)}
        onConfirm={(updatedGroup: SharedGroup) => {
            onUpdate(updatedGroup);
            setIsEditGroupOpen(false);
        }}
        initialData={group}
      />
    </div>
  );
};