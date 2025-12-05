import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { History, Search, X, Wallet, CheckCircle, User, Activity } from 'lucide-react';
import { SharedGroup } from '../../types';

interface HistorySectionProps {
  groups: SharedGroup[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ groups }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'settlement' | 'member'>('all');

  // Aggregate and Filter
  const filteredHistory = useMemo(() => {
      let list: any[] = [];
      groups.forEach(group => {
          group.activityLog.forEach(log => {
              list.push({ ...log, groupName: group.name, currency: group.currency, groupId: group.id });
          });
      });
      
      // Filter by Type
      if (filterType !== 'all') {
          list = list.filter(item => item.type === filterType);
      }

      // Filter by Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          list = list.filter(item => 
              item.text.toLowerCase().includes(q) || 
              item.user.toLowerCase().includes(q) ||
              item.groupName.toLowerCase().includes(q)
          );
      }

      return list;
  }, [groups, filterType, searchQuery]);

  return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          {/* Header Card */}
          <Card className="p-5 bg-gradient-to-br from-slate-800 to-black text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                      <History size={22} className="text-slate-300" /> History Log
                  </h3>
                  <p className="text-xs text-slate-400 opacity-80">Track every shared expense and settlement.</p>
              </div>
          </Card>

          {/* Controls */}
          <div className="flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                      type="text" 
                      placeholder="Search history..." 
                      className="w-full bg-white dark:bg-slate-800 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-500 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                      <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                          <X size={16} />
                      </button>
                  )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {[
                      { id: 'all', label: 'All' },
                      { id: 'expense', label: 'Expenses' },
                      { id: 'settlement', label: 'Settlements' },
                      { id: 'member', label: 'Updates' }
                  ].map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setFilterType(tab.id as any)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                              filterType === tab.id 
                              ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent' 
                              : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-0 pl-2">
              {filteredHistory.length === 0 ? (
                   <div className="text-center py-12 text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <History size={32} className="opacity-50" />
                      </div>
                      <p className="text-sm font-bold">No records found</p>
                      <p className="text-xs opacity-70 mt-1">Try adjusting filters</p>
                  </div>
              ) : (
                  filteredHistory.map((activity, idx) => {
                      const isLast = idx === filteredHistory.length - 1;
                      return (
                          <div key={`${activity.id}-${idx}`} className="flex gap-3 relative">
                              {/* Timeline Line */}
                              {!isLast && (
                                  <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-slate-100 dark:bg-slate-800"></div>
                              )}
                              
                              {/* Icon Node */}
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-900 ${
                                  activity.type === 'expense' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' :
                                  activity.type === 'settlement' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' :
                                  activity.type === 'member' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' :
                                  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                  {activity.type === 'expense' ? <Wallet size={14} /> :
                                   activity.type === 'settlement' ? <CheckCircle size={14} /> :
                                   activity.type === 'member' ? <User size={14} /> :
                                   <Activity size={14} />}
                              </div>

                              {/* Card Content */}
                              <div className="flex-1 pb-4">
                                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-shadow">
                                      <div className="flex justify-between items-start mb-1">
                                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                                              {activity.user === 'You' ? 'You' : activity.user}
                                          </div>
                                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{activity.date}</span>
                                      </div>
                                      
                                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug mb-2">
                                          {activity.text}
                                      </p>

                                      <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-md">
                                              {activity.groupName}
                                          </span>
                                          {activity.amount && (
                                              <span className={`text-xs font-bold ${
                                                  activity.type === 'settlement' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                              }`}>
                                                  {activity.currency} {activity.amount.toLocaleString()}
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </div>
  );
};