

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { 
  Users, Plus, ChevronLeft, Wallet, PieChart, TrendingUp, 
  Sparkles, ArrowRight, CheckCircle, AlertCircle, DollarSign, 
  Share2, Settings, Filter, Send, Loader2, Trophy, Target, 
  Zap, X, ChevronDown, ChevronUp, Split, QrCode, History,
  Activity, BarChart2, MessageCircle, ThumbsUp, CreditCard, 
  Smartphone, Bell, Camera, FileText, Shield, Mail, Percent,
  Calculator, RefreshCw, Award, Map, TrendingDown, Flame,
  Pencil, Trash2, Receipt, ScanLine, Image as ImageIcon, Keyboard,
  BellRing, ShoppingBag, Check, User, Layers, Search
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { GoogleGenAI } from "@google/genai";
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';
import { NotificationItem, getCollaborativeNotifications, generateId } from '../utils/calculations';
import { SharedGroup, SharedMember, SharedExpense, GroupActivity } from '../types';
import { Checkbox } from '../components/ui/Checkbox';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

interface CollaborativeViewProps {
  onBack: () => void;
  onProfileClick: () => void;
  groups: SharedGroup[];
  onUpdateGroups: (groups: SharedGroup[]) => void;
  onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void;
}

// --- Main View Component ---

export const CollaborativeView: React.FC<CollaborativeViewProps> = ({ onBack, onProfileClick, groups, onUpdateGroups, onCreateShoppingList }) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'settle' | 'history'>('groups');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const notifications = useMemo(() => {
      const all = getCollaborativeNotifications(groups);
      return all.filter(n => !dismissedIds.includes(n.id));
  }, [groups, dismissedIds]);

  // Helper to get active group
  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);

  const handleCreateGroup = (newGroup: SharedGroup) => {
    onUpdateGroups([...groups, newGroup]);
    setIsCreateModalOpen(false);
    setActiveGroupId(newGroup.id);
  };

  const handleUpdateGroup = (updatedGroup: SharedGroup) => {
    onUpdateGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleJoinViaQR = () => {
      // Simulate finding a group
      const newGroup: SharedGroup = {
          id: 'g-qr-' + Date.now(),
          name: 'Office Lunch Buddies',
          totalBudget: 25000,
          currency: 'LKR',
          members: [
              { id: 'u-host', name: 'Manager', role: 'Owner', avatarColor: 'bg-blue-500' },
              { id: 'me', name: 'You', role: 'Viewer', avatarColor: 'bg-indigo-500' }
          ],
          categories: ['Food', 'Drinks'],
          expenses: [],
          activityLog: [{ id: 'log-1', type: 'member', text: 'joined via QR code', date: 'Just now', user: 'You' }],
          settings: { shareAllCategories: true }
      };
      onUpdateGroups([...groups, newGroup]);
      setIsQRScannerOpen(false);
      setActiveGroupId(newGroup.id);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
      if (notif.data?.groupId) {
          setActiveGroupId(notif.data.groupId);
      }
      setShowNotifications(false);
  };

  const handleDismiss = (id: string) => {
      setDismissedIds(prev => [...prev, id]);
  };

  // View Controller
  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-3">
            <button onClick={activeGroupId ? () => setActiveGroupId(null) : onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                {activeGroupId ? 'Shared Budget' : 'Collaboration'}
              </h2>
              <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                {activeGroupId ? activeGroup?.name : 'Community Hub'}
              </h1>
            </div>
          </div>
          <div className="pb-1 flex items-center gap-1">
            {!activeGroupId && (
                <button 
                    onClick={() => setIsQRScannerOpen(true)}
                    className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors mr-1"
                >
                    <QrCode size={20} />
                </button>
            )}
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
            >
                {notifications.length > 0 ? (
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

        {/* Navigation Tabs (Only on Hub) */}
        {!activeGroupId && (
          <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'settle', label: 'Settlements', icon: CheckCircle },
              { id: 'history', label: 'History', icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Local Notification Popup */}
      {showNotifications && (
           <NotificationPopup 
               notifications={notifications} 
               onClose={() => setShowNotifications(false)} 
               onNotificationClick={handleNotificationClick} 
               onDismiss={handleDismiss}
           />
       )}

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
        {activeGroupId && activeGroup ? (
          <GroupDetailView group={activeGroup} onUpdate={handleUpdateGroup} onCreateShoppingList={onCreateShoppingList} />
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {activeTab === 'groups' && (
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
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'settle' && <SettlementsView groups={groups} onUpdateGroup={(g) => handleUpdateGroup(g)} />}
            
            {activeTab === 'history' && <CollaborativeHistoryView groups={groups} />}
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onConfirm={handleCreateGroup} 
      />

      <QRScannerModal 
        isOpen={isQRScannerOpen} 
        onClose={() => setIsQRScannerOpen(false)} 
        onScanSuccess={handleJoinViaQR}
      />
    </div>
  );
};

const CollaborativeHistoryView = ({ groups }: { groups: SharedGroup[] }) => {
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

const GroupDetailView: React.FC<{ group: SharedGroup, onUpdate: (g: SharedGroup) => void, onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void }> = ({ group, onUpdate, onCreateShoppingList }) => {
  const [tab, setTab] = useState<'overview' | 'expenses' | 'members' | 'reports'>('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const totalSpent = group.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const remaining = group.totalBudget - totalSpent;
  const progress = group.totalBudget > 0 ? (totalSpent / group.totalBudget) * 100 : 0;

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

    const newActivity: GroupActivity = {
        id: Math.random().toString(36).substr(2,9),
        type: isEdit ? 'edit' : 'expense',
        text: logText,
        date: 'Just now',
        user: 'You',
        amount: expense.amount
    };

    onUpdate({ 
        ...group, 
        expenses: updatedExpenses,
        activityLog: [newActivity, ...group.activityLog] 
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

      {tab === 'overview' && (
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
      )}

      {tab === 'expenses' && (
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
        </div>
      )}

      {tab === 'members' && (
          <GroupMembersTab group={group} onUpdate={onUpdate} />
      )}

      {tab === 'reports' && (
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
      )}

      <AddSharedExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onConfirm={handleSaveExpense}
        group={group}
        initialData={editingExpense}
        onCreateShoppingList={onCreateShoppingList}
        onDelete={editingExpense ? () => handleDeleteExpense(editingExpense.id) : undefined}
      />

      <CreateGroupModal 
        isOpen={isEditGroupOpen}
        onClose={() => setIsEditGroupOpen(false)}
        onConfirm={(updatedGroup: SharedGroup) => {
            onUpdate(updatedGroup);
            setIsEditGroupOpen(false);
        }}
        initialData={group}
      />

      <AddGroupCategoryModal 
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onConfirm={handleAddCategory}
      />
    </div>
  );
};

const GroupMembersTab = ({ group, onUpdate }: any) => {
    const [email, setEmail] = useState('');
    const [editingMember, setEditingMember] = useState<any>(null);

    const handleInvite = () => {
        if (!email) return;
        const newMember = { id: generateId(), name: email.split('@')[0], email, role: 'Viewer', avatarColor: 'bg-slate-500' };
        onUpdate({ ...group, members: [...group.members, newMember] });
        setEmail('');
    };

    const handleRemoveMember = (id: string) => {
        if(confirm('Are you sure you want to remove this member?')) {
            onUpdate({ ...group, members: group.members.filter((m: any) => m.id !== id) });
        }
    };

    const handleUpdateMemberRole = (memberId: string, newRole: string) => {
        const updatedMembers = group.members.map((m: any) => 
            m.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdate({ ...group, members: updatedMembers });
        setEditingMember(null);
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
                {group.members.map((m: any) => (
                    <Card key={m.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${m.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>{m.name.charAt(0)}</div>
                            <div>
                                <div className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</div>
                                <div className="text-[10px] text-slate-500">{m.role}</div>
                            </div>
                        </div>
                        {m.id !== 'me' && (
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setEditingMember(m)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleRemoveMember(m.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
            <div className="flex gap-2">
                <input className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="Email to invite" value={email} onChange={e => setEmail(e.target.value)} />
                <button onClick={handleInvite} className="px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm">Invite</button>
            </div>

            <EditMemberModal 
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                member={editingMember}
                onConfirm={handleUpdateMemberRole}
            />
        </div>
    );
};

const EditMemberModal = ({ isOpen, onClose, onConfirm, member }: any) => {
    const [role, setRole] = useState(member?.role || 'Viewer');
    
    useEffect(() => {
        if (member) setRole(member.role);
    }, [member]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Member</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label>
                        <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
                            {member.name}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold"
                        >
                            <option value="Owner">Owner</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">Cancel</button>
                        <button onClick={() => onConfirm(member.id, role)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddSharedExpenseModal = ({ isOpen, onClose, onConfirm, group, initialData, onCreateShoppingList, onDelete }: any) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('me');
    const [category, setCategory] = useState('General');
    
    // Split States
    const [splitMode, setSplitMode] = useState<'equal' | 'unequal' | 'percent'>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [manualSplits, setManualSplits] = useState<Record<string, string>>({}); // Stores input strings for unequal/percent
    const [createList, setCreateList] = useState(false);
    
    // Ref to track previous amount to enable auto-scaling in 'unequal' mode
    const prevAmountRef = useRef(0);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setAmount(initialData.amount.toString());
                setPaidBy(initialData.paidBy);
                setCategory(initialData.category);
                
                const memberIds = Object.keys(initialData.split);
                setSelectedMembers(memberIds);
                prevAmountRef.current = initialData.amount;

                // Initialize split mode based on saved data
                if (initialData.splitMethod) {
                    setSplitMode(initialData.splitMethod);
                    if (initialData.splitMethod === 'percent') {
                        const total = initialData.amount;
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                            const val = (initialData.split[id] as number) || 0;
                            const pct = total > 0 ? (val / total) * 100 : 0;
                            newManuals[id] = pct.toFixed(2);
                        });
                        setManualSplits(newManuals);
                    } else if (initialData.splitMethod === 'unequal') {
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                            newManuals[id] = ((initialData.split[id] as number) || 0).toFixed(2);
                        });
                        setManualSplits(newManuals);
                    }
                } else {
                    // Fallback logic: Check if splits are roughly equal
                    const values = Object.values(initialData.split) as number[];
                    const avg = initialData.amount / values.length;
                    const allEqual = values.length > 0 && values.every(v => Math.abs(v - avg) < 0.1);
                    
                    if (allEqual) {
                        setSplitMode('equal');
                    } else {
                        setSplitMode('unequal');
                        const newManuals: Record<string, string> = {};
                        memberIds.forEach(id => {
                           newManuals[id] = ((initialData.split[id] as number) || 0).toFixed(2);
                        });
                        setManualSplits(newManuals);
                    }
                }
            } else {
                // Default New Expense State
                setTitle('');
                setAmount('');
                setPaidBy('me');
                setCategory(group.categories[0] || 'General');
                setCreateList(false);
                setSplitMode('equal');
                setSelectedMembers(group.members.map((m: any) => m.id)); // Default all members
                setManualSplits({});
                prevAmountRef.current = 0;
            }
        }
    }, [isOpen, initialData, group]);

    // Effect to handle amount updates and auto-recalculation
    useEffect(() => {
        const total = parseFloat(amount) || 0;
        const oldTotal = prevAmountRef.current;
        
        // Only trigger if amount has substantively changed to avoid unnecessary updates
        if (Math.abs(total - oldTotal) > 0.001) {
            if (splitMode === 'equal') {
                if (selectedMembers.length > 0) {
                    const share = total / selectedMembers.length;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => {
                        newSplits[id] = share.toFixed(2);
                    });
                    setManualSplits(newSplits);
                }
            } else if (splitMode === 'unequal') {
                // Auto-scale proportional splits if in unequal mode
                const currentSum = selectedMembers.reduce((sum, id) => sum + (parseFloat(manualSplits[id]) || 0), 0);
                
                if (currentSum > 0) {
                    const ratio = total / currentSum;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => {
                        const val = parseFloat(manualSplits[id]) || 0;
                        newSplits[id] = (val * ratio).toFixed(2);
                    });
                    setManualSplits(newSplits);
                } else if (currentSum === 0 && total > 0 && selectedMembers.length > 0) {
                    // Initialize from 0 -> Distribute equally as starting point
                    const share = total / selectedMembers.length;
                    const newSplits: Record<string, string> = {};
                    selectedMembers.forEach(id => newSplits[id] = share.toFixed(2));
                    setManualSplits(newSplits);
                }
            }
            prevAmountRef.current = total;
        } else {
            // Handle case where amount is unchanged but members/mode changed
             if (splitMode === 'equal') {
                const share = total / (selectedMembers.length || 1);
                 // We only update if state actually differs to avoid loops, though direct set is safe
                 const newSplits: Record<string, string> = {};
                 selectedMembers.forEach(id => newSplits[id] = share.toFixed(2));
                 // Check diff before set? React handles it.
                 setManualSplits(newSplits);
            }
        }
    }, [amount, selectedMembers, splitMode]); // Intentionally omitting manualSplits to avoid loops

    // Calculate dynamic amount per member based on mode for DISPLAY and SAVE
    const getMemberShare = (memberId: string) => {
        if (!selectedMembers.includes(memberId)) return 0;
        
        const totalAmount = parseFloat(amount) || 0;
        
        if (splitMode === 'equal') {
            return totalAmount / selectedMembers.length;
        } else if (splitMode === 'unequal') {
            return parseFloat(manualSplits[memberId]) || 0;
        } else if (splitMode === 'percent') {
            const pct = parseFloat(manualSplits[memberId]) || 0;
            return totalAmount * (pct / 100);
        }
        return 0;
    };

    // Calculate Sum of Splits
    const getCurrentTotalSplit = () => {
         return selectedMembers.reduce((sum, id) => sum + getMemberShare(id), 0);
    };

    const toggleMemberSelection = (memberId: string) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleManualInputChange = (memberId: string, value: string) => {
        setManualSplits({ ...manualSplits, [memberId]: value });
    };

    const handleSetSplitMode = (newMode: 'equal' | 'unequal' | 'percent') => {
        const total = parseFloat(amount) || 0;
        const newSplits: Record<string, string> = {};

        if (newMode === 'equal') {
            // logic handled by useEffect
        } else if (newMode === 'percent') {
             if (splitMode === 'unequal') {
                // Convert current amounts to %
                selectedMembers.forEach(id => {
                    const val = parseFloat(manualSplits[id]) || 0;
                    newSplits[id] = total > 0 ? ((val / total) * 100).toFixed(2) : '0';
                });
             } else {
                // From Equal
                const pct = (100 / selectedMembers.length).toFixed(2);
                selectedMembers.forEach(id => newSplits[id] = pct);
             }
        } else if (newMode === 'unequal') {
             if (splitMode === 'percent') {
                 // Convert % to amounts
                 selectedMembers.forEach(id => {
                     const pct = parseFloat(manualSplits[id]) || 0;
                     newSplits[id] = (total * (pct / 100)).toFixed(2);
                 });
             } else {
                 // From Equal
                 const share = (total / selectedMembers.length).toFixed(2);
                 selectedMembers.forEach(id => newSplits[id] = share);
             }
        }
        
        setManualSplits(newSplits);
        setSplitMode(newMode);
    };

    const redistributeUnequal = () => {
        // Helper to redistribute difference proportionally in Unequal mode manually
        const currentTotal = parseFloat(amount) || 0;
        const currentSplitSum = selectedMembers.reduce((sum, id) => sum + (parseFloat(manualSplits[id]) || 0), 0);
        
        if (currentSplitSum > 0 && currentTotal > 0) {
            const ratio = currentTotal / currentSplitSum;
            const newSplits: Record<string, string> = {};
            selectedMembers.forEach(id => {
                const oldVal = parseFloat(manualSplits[id]) || 0;
                newSplits[id] = (oldVal * ratio).toFixed(2);
            });
            setManualSplits(newSplits);
        }
    };

    if (!isOpen) return null;

    const handleSave = () => {
        const amt = parseFloat(amount) || 0;
        const split: Record<string, number> = {};
        
        // Validate total
        let computedTotal = 0;
        selectedMembers.forEach(mId => {
            const share = getMemberShare(mId);
            split[mId] = share;
            computedTotal += share;
        });

        // Basic validation tolerance for float math
        if (Math.abs(computedTotal - amt) > 1) {
            alert(`Split amounts (${computedTotal.toFixed(2)}) do not match total amount (${amt.toFixed(2)}). Please check your splits.`);
            return;
        }

        const newExpenseId = initialData?.id || generateId();

        if (createList && onCreateShoppingList) {
            onCreateShoppingList(group.name, title || 'Shared Expense', amt, group.members, {
                groupId: group.id,
                groupExpenseId: newExpenseId,
                expenseName: title || 'Shared Expense'
            });
        }

        onConfirm({
            id: newExpenseId,
            title,
            amount: amt,
            paidBy,
            sharedWith: selectedMembers,
            category,
            date: new Date().toISOString().split('T')[0],
            split,
            type: 'expense',
            splitMethod: splitMode // Persist split method
        });
    };

    const currentSplitSum = getCurrentTotalSplit();
    const amtFloat = parseFloat(amount) || 0;
    const isSplitMismatch = Math.abs(currentSplitSum - amtFloat) > 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar text-white">
                
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-white">{initialData ? 'Edit Expense' : 'Add Expense'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                        <input 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                            placeholder="Title (e.g. Groceries)" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">{group.currency}</span>
                        <input 
                            type="number" 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 pl-10 text-lg font-bold text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                            placeholder="0.00" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                        />
                    </div>

                    {/* Category Select */}
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500"
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                        >
                            {group.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    {/* Linked Shopping List Toggle */}
                    {!initialData && (
                        <div 
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${createList ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}
                            onClick={() => setCreateList(!createList)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${createList ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    <ShoppingBag size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">Create Linked Shopping List</div>
                                    <div className="text-[10px] text-slate-400">Add budget & members to Shopping</div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${createList ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                                {createList && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                        </div>
                    )}

                    {/* Paid By Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Paid By</label>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {group.members.map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaidBy(m.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                                        paidBy === m.id 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full ${m.avatarColor} border border-white/20`}></div>
                                    {m.id === 'me' ? 'You' : m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Split Type Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Split Expense</label>
                        <div className="flex bg-slate-800 p-1 rounded-xl">
                            {[
                                { id: 'equal', label: 'Equally' },
                                { id: 'unequal', label: 'Unequally' },
                                { id: 'percent', label: 'By %' }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleSetSplitMode(mode.id as any)}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                        splitMode === mode.id 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Member List & Amounts */}
                    <div className="space-y-1.5 bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                        {group.members.map((m: any) => {
                            const isSelected = selectedMembers.includes(m.id);
                            const amountVal = getMemberShare(m.id);
                            
                            return (
                                <div key={m.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Checkbox checked={isSelected} onChange={() => toggleMemberSelection(m.id)} />
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full ${m.avatarColor} flex items-center justify-center text-[8px] text-white font-bold border border-white/10`}>
                                                {m.name.charAt(0)}
                                            </div>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                                {m.id === 'me' ? 'You' : m.name}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="w-24">
                                            {splitMode === 'equal' ? (
                                                <div className="text-right text-xs font-bold text-slate-300">
                                                    {group.currency} {amountVal.toFixed(2)}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className="relative w-full">
                                                        {splitMode === 'unequal' && <span className="absolute left-2 top-1.5 text-slate-500 text-[9px]">{group.currency}</span>}
                                                        {splitMode === 'percent' && <span className="absolute right-2 top-1.5 text-slate-500 text-[9px]">%</span>}
                                                        <input 
                                                            type="number"
                                                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-[10px] font-bold text-white outline-none focus:border-indigo-500 text-right ${splitMode === 'unequal' ? 'pl-6 pr-2' : 'pr-5 pl-2'}`}
                                                            placeholder="0"
                                                            value={manualSplits[m.id] || ''}
                                                            onChange={(e) => handleManualInputChange(m.id, e.target.value)}
                                                        />
                                                    </div>
                                                    {splitMode === 'percent' && (
                                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                                            {group.currency} {amountVal.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Validation & Action */}
                    {isSplitMismatch && splitMode === 'unequal' && (
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex justify-between items-center">
                             <span className="text-[10px] text-red-400 font-bold">Total Mismatch: {group.currency} {(amtFloat - currentSplitSum).toFixed(2)} left</span>
                             <button onClick={redistributeUnequal} className="text-[9px] font-bold bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30 transition-colors">
                                 Distribute
                             </button>
                        </div>
                    )}

                    <div className="flex gap-2 mt-2">
                        {initialData && onDelete && (
                            <button onClick={() => onDelete(initialData.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 size={20} /></button>
                        )}
                        <button 
                            onClick={handleSave} 
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all text-sm tracking-wide"
                        >
                            Confirm Split
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddGroupCategoryModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (name: string) => void }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Category</h3>
                <div className="space-y-3">
                    <input 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-900 dark:text-white" 
                        placeholder="Category Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        autoFocus 
                    />
                    <button 
                        onClick={() => { if(name) onConfirm(name); setName(''); }} 
                        disabled={!name}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2 disabled:opacity-50"
                    >
                        Add Category
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettlementsView: React.FC<{ groups: SharedGroup[], onUpdateGroup: (g: SharedGroup) => void }> = ({ groups, onUpdateGroup }) => {
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [expandedSettlementId, setExpandedSettlementId] = useState<string | null>(null);

  // Efficient Debt Simplification Algorithm (Netting)
  const balances = useMemo(() => {
    let allDebts: { 
        id: string,
        from: string, 
        to: string, 
        fromId: string,
        toId: string,
        fromAvatar: string,
        toAvatar: string,
        fromName: string,
        toName: string,
        amount: number, 
        group: string, 
        groupId: string, 
        currency: string
    }[] = [];
    
    groups.forEach(g => {
        if (filterGroupId !== 'all' && g.id !== filterGroupId) return;

        const netBalances: Record<string, number> = {};
        g.members.forEach(m => netBalances[m.id] = 0);

        g.expenses.forEach(e => {
            if (e.type === 'settlement') {
                const receiverId = e.sharedWith[0]; 
                if (receiverId) {
                    netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount;
                    netBalances[receiverId] = (netBalances[receiverId] || 0) - e.amount;
                }
            } else if (e.type === 'expense') {
                netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount; 
                if (e.split) {
                    Object.entries(e.split).forEach(([userId, share]) => {
                        netBalances[userId] = (netBalances[userId] || 0) - (share as number); 
                    });
                }
            }
            // Ignore reminders for balance calculation
        });

        const debtors: {id: string, amount: number}[] = [];
        const creditors: {id: string, amount: number}[] = [];

        Object.entries(netBalances).forEach(([id, amount]) => {
            if (amount < -0.01) debtors.push({ id, amount });
            else if (amount > 0.01) creditors.push({ id, amount });
        });

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let i = 0; 
        let j = 0; 

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
            
            const fromMember = g.members.find(m => m.id === debtor.id);
            const toMember = g.members.find(m => m.id === creditor.id);

            if (fromMember && toMember) {
                allDebts.push({
                    id: `settle-${g.id}-${debtor.id}-${creditor.id}`,
                    from: debtor.id === 'me' ? 'You' : fromMember.name,
                    to: creditor.id === 'me' ? 'You' : toMember.name,
                    fromId: debtor.id,
                    toId: creditor.id,
                    fromName: fromMember.name,
                    toName: toMember.name,
                    fromAvatar: fromMember.avatarColor,
                    toAvatar: toMember.avatarColor,
                    amount: amount,
                    group: g.name,
                    groupId: g.id,
                    currency: g.currency
                });
            }

            debtor.amount += amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }
    });

    return allDebts;
  }, [groups, filterGroupId]);

  const handleSettleClick = (e: React.MouseEvent, settlement: any) => {
      e.stopPropagation();
      setSelectedSettlement(settlement);
      setSettleModalOpen(true);
  };

  const handleConfirmSettle = () => {
      if (!selectedSettlement) return;
      
      const group = groups.find(g => g.id === selectedSettlement.groupId);
      if (group) {
          if (selectedSettlement.from === 'You') {
              // I am the payer -> Record Payment (Settlement)
              const payerId = group.members.find(m => m.id === 'me')?.id;
              const receiverId = group.members.find(m => m.name === selectedSettlement.to)?.id;

              if (payerId && receiverId) {
                  const settlementExpense: SharedExpense = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: 'Settlement Payment',
                      amount: selectedSettlement.amount,
                      paidBy: payerId,
                      sharedWith: [receiverId],
                      category: 'Settlement',
                      date: new Date().toISOString().split('T')[0],
                      split: { [receiverId]: selectedSettlement.amount },
                      type: 'settlement',
                  };
                  
                  onUpdateGroup({
                      ...group,
                      expenses: [settlementExpense, ...group.expenses],
                      activityLog: [{
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'settlement',
                          text: `settled ${group.currency} ${selectedSettlement.amount.toLocaleString()} with ${selectedSettlement.to}`,
                          date: 'Just now',
                          user: 'You'
                      }, ...group.activityLog]
                  });
              }
          } else {
              // I am the receiver -> Send Reminder (Create Reminder Expense)
              // Debt remains, just logs it as a reminder expense type
              const debtorName = selectedSettlement.from;
              const debtorId = selectedSettlement.fromId;

              const reminderExpense: SharedExpense = {
                  id: Math.random().toString(36).substr(2, 9),
                  title: `Reminder to ${debtorName}`,
                  amount: selectedSettlement.amount,
                  paidBy: 'me',
                  sharedWith: [debtorId],
                  category: 'Reminder',
                  date: new Date().toISOString().split('T')[0],
                  split: {}, // No split impact
                  type: 'reminder',
              };

              onUpdateGroup({
                  ...group,
                  expenses: [reminderExpense, ...group.expenses],
                  activityLog: [{
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'edit',
                      text: `sent a reminder to ${debtorName}`,
                      date: 'Just now',
                      user: 'You'
                  }, ...group.activityLog]
              });
          }
      }

      setSettleModalOpen(false);
  };

  const getTransactionHistory = (settlement: any) => {
      const group = groups.find(g => g.id === settlement.groupId);
      if (!group) return [];

      return group.expenses.filter(e => {
          if (e.type === 'settlement' || e.type === 'reminder') return false; 
          
          const payerId = e.paidBy;
          const involvedIds = [settlement.fromId, settlement.toId];
          
          if (!involvedIds.includes(payerId)) return false;

          const otherId = payerId === settlement.fromId ? settlement.toId : settlement.fromId;
          return e.sharedWith.includes(otherId) && (e.split[otherId] || 0) > 0;
      }).map(e => {
          const isDebit = e.paidBy === settlement.toId;
          const amountOwed = e.split[isDebit ? settlement.fromId : settlement.toId] || 0;
          
          return {
              ...e,
              displayAmount: amountOwed,
              isDebit
          };
      }).slice(0, 5); 
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-center relative flex items-center justify-between">
            <div className="text-left">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Settle Balances</h3>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                {balances.length} <span className="text-sm font-normal text-slate-500">Pending</span>
                </div>
            </div>
            
            <div className="relative">
                <select 
                    value={filterGroupId} 
                    onChange={(e) => setFilterGroupId(e.target.value)}
                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold px-3 py-2 rounded-lg outline-none shadow-sm appearance-none pr-8"
                >
                    <option value="all">All Groups</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>

        <div className="space-y-3">
        {balances.length > 0 ? (
            balances.map((b) => {
                const isExpanded = expandedSettlementId === b.id;
                const transactions = isExpanded ? getTransactionHistory(b) : [];
                
                // Check if there is a reminder for this settlement pair
                // We look for a reminder expense in the group targeting the 'from' user
                const group = groups.find(g => g.id === b.groupId);
                const reminderSent = group?.expenses.some(e => 
                    e.type === 'reminder' && 
                    e.sharedWith.includes(b.fromId) && 
                    e.paidBy === b.toId // Sent by the creditor
                );
                // If reminder sent, find the date
                const reminderDate = reminderSent ? group?.expenses.find(e => e.type === 'reminder' && e.sharedWith.includes(b.fromId))?.date : null;

                return (
                <Card 
                    key={b.id} 
                    className={`transition-all duration-300 overflow-hidden border-l-4 ${b.from === 'You' ? 'border-l-orange-500' : 'border-l-emerald-500'} ${isExpanded ? 'ring-1 ring-indigo-500/20 shadow-md' : 'hover:shadow-sm'}`}
                >
                    <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedSettlementId(isExpanded ? null : b.id)}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full ${b.fromAvatar} flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-800`}>
                                        {b.fromName.charAt(0)}
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300" />
                                    <div className={`w-8 h-8 rounded-full ${b.toAvatar} flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white dark:ring-slate-800`}>
                                        {b.toName.charAt(0)}
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                        {b.from === 'You' ? (
                                            <>You owe <span className="text-indigo-600 dark:text-indigo-400">{b.to}</span></>
                                        ) : (
                                            <><span className="text-indigo-600 dark:text-indigo-400">{b.from}</span> owes You</>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{b.group}</div>
                                    {/* Reminder Badge */}
                                    {reminderSent && reminderDate && (
                                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-[9px] font-bold text-orange-600 dark:text-orange-400">
                                            <BellRing size={10} /> Reminded {new Date(reminderDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right pl-2">
                                <div className={`font-bold text-lg ${b.from === 'You' ? 'text-orange-500' : 'text-emerald-500'}`}>
                                    {b.currency} {b.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
                                    Details {isExpanded ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                                </div>
                            </div>
                        </div>
                        
                        {isExpanded && (
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Mutual Activity</h4>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    {transactions.map(t => (
                                        <div key={t.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-slate-700 dark:text-slate-200">{t.title}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-900 dark:text-white">{b.currency} {t.displayAmount.toLocaleString()}</div>
                                                <div className={`text-[9px] ${t.paidBy === b.toId ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                    {t.paidBy === 'me' ? 'You paid' : `${groups.find(g=>g.id===b.groupId)?.members.find(m=>m.id===t.paidBy)?.name} paid`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && <p className="text-xs text-slate-400 italic">No recent shared expenses found.</p>}
                                </div>

                                <button 
                                    onClick={(e) => handleSettleClick(e, b)}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    {b.from === 'You' ? <CheckCircle size={14} /> : <Send size={14} />}
                                    {b.from === 'You' ? 'Record Payment' : 'Send Reminder'}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            )})
        ) : (
            <div className="text-center py-12 text-slate-400">
                <CheckCircle size={48} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                <p className="text-sm font-bold text-slate-500">All Settled Up!</p>
                <p className="text-xs">No pending debts found.</p>
            </div>
        )}
        </div>
        
        {settleModalOpen && selectedSettlement && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettleModalOpen(false)} />
                <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        {selectedSettlement.from === 'You' ? 'Record Payment' : 'Send Reminder'}
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 text-center">
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedSettlement.currency} {selectedSettlement.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-2">
                            {selectedSettlement.from === 'You' ? `Paying to ${selectedSettlement.to}` : `Reminding ${selectedSettlement.from}`}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSettleModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                        <button onClick={handleConfirmSettle} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Confirm</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const CreateGroupModal = ({ isOpen, onClose, onConfirm, initialData }: any) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setBudget(initialData.totalBudget.toString());
            setCurrency(initialData.currency);
        } else if (isOpen) {
            setName('');
            setBudget('');
            setCurrency('USD');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{initialData ? 'Edit Group' : 'Create Group'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="flex gap-2">
                        <select className="w-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold" value={currency} onChange={e => setCurrency(e.target.value)}>
                            {['USD', 'EUR', 'GBP', 'LKR', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Total Budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <button 
                        onClick={() => onConfirm(initialData ? { ...initialData, name, totalBudget: parseFloat(budget) || 0, currency } : { id: generateId(), name, totalBudget: parseFloat(budget) || 0, currency, members: [{id:'me', name:'You', role:'Owner', avatarColor:'bg-indigo-500'}], expenses: [], activityLog: [], categories: ['General'], settings: {shareAllCategories: true} })}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2"
                    >
                        {initialData ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }: any) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onScanSuccess();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <div className="w-64 h-64 border-4 border-emerald-500 rounded-3xl relative flex items-center justify-center mb-8">
                <div className="w-full h-1 bg-emerald-500 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                <ScanLine size={48} className="text-emerald-500/50" />
            </div>
            <p className="text-white font-bold text-lg mb-8">Scanning...</p>
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold">Cancel</button>
            <style>{`@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }`}</style>
        </div>
    );
};

const GroupAIView = ({ group }: any) => (
    <Card className="p-4 bg-slate-900 text-white border-none">
        <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-yellow-400" />
            <h3 className="font-bold">Smart Analysis</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
            "Based on recent activity, <strong>{group.name}</strong> is spending mostly on <strong>Food</strong>. 
            User <strong>Devindi</strong> has paid the most this month. Consider settling balances soon to avoid large debts."
        </p>
    </Card>
);
