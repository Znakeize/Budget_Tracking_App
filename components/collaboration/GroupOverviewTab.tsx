import React from 'react';
import { Card } from '../ui/Card';
import { Doughnut } from 'react-chartjs-2';
import { SharedGroup } from '../../types';

interface GroupOverviewTabProps {
  group: SharedGroup;
  remaining: number;
  setTab: (tab: any) => void;
}

export const GroupOverviewTab: React.FC<GroupOverviewTabProps> = ({ group, remaining, setTab }) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Category Spending Chart */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Category Spending</h3>
        <div className="h-40 relative">
          <Doughnut 
            data={{
              labels: group.categories,
              datasets: [{
                data: group.categories.map(cat => group.expenses.filter(e => e.category === cat && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)),
                backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'],
                borderWidth: 0
              }]
            }}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{group.currency} {remaining.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
            {group.categories.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'][i]}}></div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">{cat}</span>
                </div>
            ))}
        </div>
      </Card>

      {/* Recent Transactions Summary */}
      <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white">Recent Shared Activity</h3>
              <button onClick={() => setTab('expenses')} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">View All</button>
          </div>
          <div className="space-y-3">
              {group.expenses.slice(0, 3).map(expense => {
                  const payer = group.members.find(m => m.id === expense.paidBy);
                  const isReminder = expense.type === 'reminder';
                  const isSettlement = expense.type === 'settlement';
                  
                  return (
                      <div key={expense.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${payer?.avatarColor} flex items-center justify-center text-white font-bold text-[10px]`}>
                                  {payer?.name.charAt(0)}
                              </div>
                              <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white">{expense.title}</div>
                                  <div className="text-[10px] text-slate-500">
                                      {isReminder ? `${payer?.name} sent reminder` : isSettlement ? `${payer?.name} settled` : `${payer?.name} paid`} • {expense.category}
                                  </div>
                              </div>
                          </div>
                          <div className={`text-sm font-bold ${isSettlement ? 'text-emerald-500' : isReminder ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                              {group.currency} {expense.amount.toLocaleString()}
                          </div>
                      </div>
                  );
              })}
          </div>
      </Card>
    </div>
  );
};