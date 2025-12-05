import React from 'react';
import { Card } from '../ui/Card';
import { Plus, AlertCircle, Trash2 } from 'lucide-react';
import { SharedGroup } from '../../types';
import { NotificationItem } from '../../utils/calculations';

interface GroupsListSectionProps {
  groups: SharedGroup[];
  setActiveGroupId: (id: string) => void;
  setIsCreateModalOpen: (val: boolean) => void;
  onUpdateGroups: (groups: SharedGroup[]) => void;
  notifications: NotificationItem[];
}

export const GroupsListSection: React.FC<GroupsListSectionProps> = ({ groups, setActiveGroupId, setIsCreateModalOpen, onUpdateGroups, notifications }) => {
  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this shared budget? This cannot be undone.')) {
      onUpdateGroups(groups.filter(g => g.id !== id));
    }
  };

  return (
      <>
        {/* Create Group CTA */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Plus size={24} />
          </div>
          Create Shared Budget
        </button>

        {/* Group List */}
        <div className="space-y-3">
          {groups.map(group => {
            const totalSpent = group.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
            const progress = group.totalBudget > 0 ? (totalSpent / group.totalBudget) * 100 : 0;
            
            // Check notifications for this specific group
            const hasNotifs = notifications.some(n => n.data?.groupId === group.id);

            return (
              <Card 
                key={group.id} 
                onClick={() => setActiveGroupId(group.id)}
                className="p-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{group.name}</h3>
                    <div className="flex -space-x-2 mt-2">
                      {group.members.map((m, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${m.avatarColor} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold`}>
                          {m.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                     {/* Alert Icon if notifications exist */}
                     {hasNotifs && (
                        <div className="relative mb-1">
                            <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-pulse"></div>
                            <AlertCircle size={18} className="text-red-500 relative z-10" fill="currentColor" strokeWidth={1.5} color="white" />
                        </div>
                     )}
                     
                     <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 block">Spent</span>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {group.currency} {totalSpent.toLocaleString()}
                        </div>
                     </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>{Math.round(progress)}% Used</span>
                    <span>Limit: {group.currency} {group.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progress > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">
                        Last active: {group.activityLog[0]?.date || 'Never'}
                    </span>
                    <button 
                        onClick={(e) => handleDeleteGroup(e, group.id)}
                        className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Group"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </Card>
            );
          })}
        </div>
      </>
  );
};