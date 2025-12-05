import React from 'react';
import { Card } from '../ui/Card';
import { BarChart2, Sparkles } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { SharedGroup } from '../../types';

interface GroupReportsTabProps {
  group: SharedGroup;
  totalSpent: number;
}

const GroupAIView = ({ group }: { group: SharedGroup }) => (
    <Card className="p-4 bg-slate-900 text-white border-none">
        <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-yellow-400" />
            <h3 className="font-bold">Smart Analysis</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
            "Based on recent activity, <strong>{group.name}</strong> is spending mostly on <strong>Food</strong>. 
            User <strong>{group.members[1]?.name || 'User 2'}</strong> has paid the most this month. Consider settling balances soon to avoid large debts."
        </p>
    </Card>
);

export const GroupReportsTab: React.FC<GroupReportsTabProps> = ({ group, totalSpent }) => {
  return (
      <div className="space-y-4 animate-in fade-in">
          {/* Group Financial Summary */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                  <BarChart2 size={16} className="text-indigo-500" /> Group Financial Summary
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total Exp.</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{group.currency} {(totalSpent/1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Pending</p>
                      <p className="text-sm font-bold text-orange-500">{group.currency} 12.5k</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Settled</p>
                      <p className="text-sm font-bold text-emerald-500">{group.currency} 5.0k</p>
                  </div>
              </div>
          </div>

          {/* AI Tip Section */}
          <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="flex gap-3">
                  <Sparkles className="text-indigo-500 shrink-0 mt-1" size={18} />
                  <div>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">AI Savings Tip</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                          "Your group could save 12% by reducing outside dining. Try cooking together next weekend!"
                      </p>
                  </div>
              </div>
          </Card>

          <GroupAIView group={group} />
          
          {/* Contribution Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Contributions by Member</h3>
              <div className="h-48">
                  <Bar 
                    data={{
                        labels: group.members.map(m => m.name),
                        datasets: [{
                            label: 'Paid',
                            data: group.members.map(m => group.expenses.filter(e => e.paidBy === m.id && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)),
                            backgroundColor: ['#6366f1', '#10b981', '#ec4899', '#f59e0b'],
                            borderRadius: 4
                        }]
                    }}
                    options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { grid: { display: false } }, y: { display: false } }
                    }}
                  />
              </div>
          </Card>
      </div>
  );
};