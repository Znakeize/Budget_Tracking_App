
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { 
  Users, Plus, ChevronLeft, Wallet, PieChart, TrendingUp, 
  Sparkles, ArrowRight, CheckCircle, AlertCircle, DollarSign, 
  Share2, Settings, Filter, Send, Loader2, Trophy, Target, 
  Zap, X, ChevronDown, ChevronUp, Split, QrCode, History,
  Activity, BarChart2, MessageCircle, ThumbsUp, CreditCard, 
  Smartphone, Bell, Camera, FileText, Shield, Mail, Percent,
  Calculator, RefreshCw, Award, Map, TrendingDown, Flame,
  Pencil, Trash2, Receipt, ScanLine, Image as ImageIcon, Keyboard
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { GoogleGenAI } from "@google/genai";
import { HeaderProfile } from '../components/ui/HeaderProfile';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

// --- Types ---

interface SharedMember {
  id: string;
  name: string;
  email?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  avatarColor: string;
  contribution?: number;
}

interface SharedExpense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  sharedWith: string[]; // IDs of members sharing this expense
  category: string;
  date: string;
  notes?: string;
  receipt?: string;
  split: Record<string, number>; // userId -> amount owed
  type: 'expense' | 'settlement'; // Distinguish between regular expense and debt settlement
}

interface GroupActivity {
  id: string;
  type: 'expense' | 'settlement' | 'member' | 'edit';
  text: string;
  date: string;
  user: string;
  amount?: number;
}

interface SharedGroup {
  id: string;
  name: string;
  totalBudget: number;
  currency: string;
  members: SharedMember[];
  expenses: SharedExpense[];
  categories: string[];
  activityLog: GroupActivity[];
  settings: {
      shareAllCategories: boolean;
  };
}

interface CollaborativeViewProps {
  onBack: () => void;
  onProfileClick: () => void;
}

// --- Mock Data ---

const MOCK_GROUPS: SharedGroup[] = [
  {
    id: 'g1',
    name: 'Family Budget 2025',
    totalBudget: 150000,
    currency: 'LKR',
    members: [
      { id: 'me', name: 'You', role: 'Owner', avatarColor: 'bg-indigo-500' },
      { id: 'u2', name: 'Devindi', role: 'Editor', avatarColor: 'bg-emerald-500' },
      { id: 'u3', name: 'Dilan', role: 'Viewer', avatarColor: 'bg-pink-500' }
    ],
    categories: ['Food', 'Utilities', 'Travel', 'Rent', 'Groceries'],
    expenses: [
      { id: 'e1', title: 'March Rent', amount: 45000, paidBy: 'me', sharedWith: ['me', 'u2', 'u3'], category: 'Rent', date: '2025-03-01', split: { 'me': 15000, 'u2': 15000, 'u3': 15000 }, type: 'expense' },
      { id: 'e2', title: 'WiFi Bill', amount: 2500, paidBy: 'u2', sharedWith: ['me', 'u2', 'u3'], category: 'Utilities', date: '2025-03-05', split: { 'me': 833, 'u2': 833, 'u3': 833 }, type: 'expense' },
      { id: 'e3', title: 'Groceries at Keells', amount: 4200, paidBy: 'u3', sharedWith: ['me', 'u2', 'u3'], category: 'Groceries', date: '2025-03-10', split: { 'me': 1400, 'u2': 1400, 'u3': 1400 }, type: 'expense' }
    ],
    activityLog: [
      { id: 'a1', type: 'expense', text: 'added Groceries at Keells', date: '2 hrs ago', user: 'Dilan', amount: 4200 },
      { id: 'a2', type: 'expense', text: 'edited Utilities expense', date: '1 day ago', user: 'Devindi' },
      { id: 'a3', type: 'expense', text: 'added March Rent', date: '3 days ago', user: 'You', amount: 45000 },
    ],
    settings: { shareAllCategories: true }
  },
  {
    id: 'g2',
    name: 'Couple Trip',
    totalBudget: 50000,
    currency: 'LKR',
    members: [
      { id: 'me', name: 'You', role: 'Owner', avatarColor: 'bg-indigo-500' },
      { id: 'u4', name: 'Mother', role: 'Editor', avatarColor: 'bg-orange-500' }
    ],
    categories: ['Flights', 'Hotel', 'Food', 'Activities'],
    expenses: [
      { id: 'e4', title: 'Hotel Booking', amount: 12000, paidBy: 'me', sharedWith: ['me', 'u4'], category: 'Hotel', date: '2025-02-15', split: { 'me': 6000, 'u4': 6000 }, type: 'expense' }
    ],
    activityLog: [
        { id: 'a5', type: 'expense', text: 'added Hotel Booking', date: '2 weeks ago', user: 'You', amount: 12000 },
        { id: 'a6', type: 'edit', text: 'created the group', date: '2 weeks ago', user: 'You' },
    ],
    settings: { shareAllCategories: true }
  }
];

// --- Main View Component ---

export const CollaborativeView: React.FC<CollaborativeViewProps> = ({ onBack, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'settle' | 'community'>('groups');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<SharedGroup[]>(MOCK_GROUPS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Helper to get active group
  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);

  const handleCreateGroup = (newGroup: SharedGroup) => {
    setGroups([...groups, newGroup]);
    setIsCreateModalOpen(false);
    setActiveGroupId(newGroup.id);
  };

  const handleUpdateGroup = (updatedGroup: SharedGroup) => {
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
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
      setGroups([...groups, newGroup]);
      setIsQRScannerOpen(false);
      setActiveGroupId(newGroup.id);
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
          <div className="pb-1 flex items-center gap-2">
            {!activeGroupId && (
                <button 
                    onClick={() => setIsQRScannerOpen(true)}
                    className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                >
                    <QrCode size={20} />
                </button>
            )}
            <HeaderProfile onClick={onProfileClick} />
          </div>
        </div>

        {/* Navigation Tabs (Only on Hub) */}
        {!activeGroupId && (
          <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'settle', label: 'Settlements', icon: CheckCircle },
              { id: 'community', label: 'Community', icon: Trophy },
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

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
        {activeGroupId && activeGroup ? (
          <GroupDetailView group={activeGroup} onUpdate={handleUpdateGroup} />
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
                    
                    return (
                      <Card 
                        key={group.id} 
                        onClick={() => setActiveGroupId(group.id)}
                        className="p-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{group.name}</h3>
                            <div className="flex -space-x-2 mt-2">
                              {group.members.map((m, i) => (
                                <div key={i} className={`w-6 h-6 rounded-full ${m.avatarColor} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold`}>
                                  {m.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-500">Spent</span>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {group.currency} {totalSpent.toLocaleString()}
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
            
            {activeTab === 'community' && <CommunityInsightsView />}
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

// ... [SettlementsView, CommunityInsightsView, GroupAIView stay same as before] ...
// Re-including them briefly for context if needed, but focusing on GroupDetailView edits below

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

        // 1. Calculate Net Balance per User
        const netBalances: Record<string, number> = {};
        g.members.forEach(m => netBalances[m.id] = 0);

        g.expenses.forEach(e => {
            if (e.type === 'settlement') {
                const receiverId = e.sharedWith[0]; 
                if (receiverId) {
                    netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount;
                    netBalances[receiverId] = (netBalances[receiverId] || 0) - e.amount;
                }
            } else {
                // Regular Expense
                netBalances[e.paidBy] = (netBalances[e.paidBy] || 0) + e.amount; // Payer gets positive credit
                if (e.split) {
                    Object.entries(e.split).forEach(([userId, share]) => {
                        netBalances[userId] = (netBalances[userId] || 0) - (share as number); // Consumer gets negative debt
                    });
                }
            }
        });

        // 2. Separate into Debtors and Creditors
        const debtors: {id: string, amount: number}[] = [];
        const creditors: {id: string, amount: number}[] = [];

        Object.entries(netBalances).forEach(([id, amount]) => {
            if (amount < -0.01) debtors.push({ id, amount }); // Negative balance = owes money
            else if (amount > 0.01) creditors.push({ id, amount }); // Positive balance = owed money
        });

        // Sort by magnitude to minimize transactions
        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        // 3. Match Debts
        let i = 0; // debtor index
        let j = 0; // creditor index

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
            
            // Add debt record
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

            // Adjust remaining balances
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
      
      // Find the group
      const group = groups.find(g => g.id === selectedSettlement.groupId);
      if (group) {
          const payerId = group.members.find(m => (selectedSettlement.from === 'You' ? m.id === 'me' : m.name === selectedSettlement.from))?.id;
          const receiverId = group.members.find(m => (selectedSettlement.to === 'You' ? m.id === 'me' : m.name === selectedSettlement.to))?.id;

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
              
              // Update Group
              onUpdateGroup({
                  ...group,
                  expenses: [settlementExpense, ...group.expenses],
                  activityLog: [{
                      id: Math.random().toString(36).substr(2, 9),
                      type: 'settlement',
                      text: `settled ${group.currency} ${selectedSettlement.amount.toLocaleString()} with ${selectedSettlement.to}`,
                      date: 'Just now',
                      user: selectedSettlement.from
                  }, ...group.activityLog]
              });
          }
      }

      setSettleModalOpen(false);
  };

  const getTransactionHistory = (settlement: any) => {
      const group = groups.find(g => g.id === settlement.groupId);
      if (!group) return [];

      // Filter expenses that involve ONLY these two users essentially, or where one paid and other owes
      return group.expenses.filter(e => {
          if (e.type === 'settlement') return false; // Hide previous settlements for clarity in 'causing' debt? Or show? Let's skip for now.
          
          const payerId = e.paidBy;
          const involvedIds = [settlement.fromId, settlement.toId];
          
          // Case A: One of them paid
          if (!involvedIds.includes(payerId)) return false;

          // Case B: The other person is in the shared list
          const otherId = payerId === settlement.fromId ? settlement.toId : settlement.fromId;
          return e.sharedWith.includes(otherId) && (e.split[otherId] || 0) > 0;
      }).map(e => {
          const isDebit = e.paidBy === settlement.toId; // Did the creditor pay? Then debtor owes.
          const amountOwed = e.split[isDebit ? settlement.fromId : settlement.toId] || 0;
          
          return {
              ...e,
              displayAmount: amountOwed,
              isDebit // True if this transaction ADDS to the debt shown in the card
          };
      }).slice(0, 5); // Show top 5 recent
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        {/* Header Stats */}
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
                                {/* Avatars Flow */}
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
                        
                        {/* Expanded Details */}
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
                <p className="text-xs">No pending debts in selected groups.</p>
            </div>
        )}
        </div>

        <SettleUpModal 
            isOpen={settleModalOpen}
            onClose={() => setSettleModalOpen(false)}
            onConfirm={handleConfirmSettle}
            data={selectedSettlement}
        />
    </div>
  );
};

const CommunityInsightsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'insights' | 'challenges' | 'trends' | 'leaderboard'>('insights');
  const [challenges, setChallenges] = useState([
      { id: 'c1', title: 'No Takeout Week', target: 100, current: 60, joined: false, days: 3, count: 1240, icon: '🥦' },
      { id: 'c2', title: 'Save LKR 10,000', target: 10000, current: 3500, joined: true, days: 12, count: 5400, icon: '💪' },
      { id: 'c3', title: 'Cut Utility Bill 5%', target: 5, current: 0, joined: false, days: 20, count: 890, icon: '🎯' }
  ]);
  const [activePollOption, setActivePollOption] = useState<string | null>(null);

  const handleJoin = (id: string) => {
      setChallenges(challenges.map(c => c.id === id ? { ...c, joined: !c.joined } : c));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Sub-Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {[
                { id: 'insights', label: 'My Insights', icon: Sparkles },
                { id: 'challenges', label: 'Challenges', icon: Target },
                { id: 'trends', label: 'Trends', icon: TrendingUp },
                { id: 'leaderboard', label: 'Rankings', icon: Trophy },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                        activeTab === tab.id 
                        ? 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/20' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        {/* 1. MY INSIGHTS */}
        {activeTab === 'insights' && (
            <div className="space-y-4">
                {/* Benchmark Cards */}
                <Card className="p-5 bg-slate-900 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Trophy size={18} className="text-yellow-400" /> You vs. Average</h3>
                        <p className="text-slate-300 text-xs mb-4">You spend 18% less on dining than the national average.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-slate-400">
                                    <span>Your Savings Rate</span>
                                    <span className="text-emerald-400">Top 15%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[85%]"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-white/10 p-2 rounded-lg text-center">
                                    <div className="text-[10px] text-slate-400 uppercase">Dining</div>
                                    <div className="text-emerald-400 font-bold">-18%</div>
                                </div>
                                <div className="bg-white/10 p-2 rounded-lg text-center">
                                    <div className="text-[10px] text-slate-400 uppercase">Transport</div>
                                    <div className="text-red-400 font-bold">+5%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Poll */}
                <Card className="p-5">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageCircle size={18} className="text-indigo-500" /> Poll of the Week
                        </h3>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">2.4k votes</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">What's your biggest spending weakness?</p>
                    <div className="space-y-2">
                        {[
                            { id: 'opt1', text: 'Dining Out', percent: 45 },
                            { id: 'opt2', text: 'Online Shopping', percent: 30 },
                            { id: 'opt3', text: 'Subscriptions', percent: 25 },
                        ].map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => setActivePollOption(opt.id)}
                                className="relative w-full h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group"
                            >
                                <div 
                                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${activePollOption ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-transparent'}`}
                                    style={{ width: activePollOption ? `${opt.percent}%` : '0%' }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{opt.text}</span>
                                    {activePollOption && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{opt.percent}%</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        )}

        {/* 2. CHALLENGES */}
        {activeTab === 'challenges' && (
            <div className="space-y-4">
                {challenges.map(c => (
                    <Card key={c.id} className="p-4 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                                    {c.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{c.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1"><Users size={10}/> {c.count}</span>
                                        <span>•</span>
                                        <span>{c.days} days left</span>
                                    </div>
                                </div>
                            </div>
                            {c.joined ? (
                                <button onClick={() => handleJoin(c.id)} className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> Joined
                                </button>
                            ) : (
                                <button onClick={() => handleJoin(c.id)} className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-full active:scale-95 transition-transform">
                                    Join
                                </button>
                            )}
                        </div>
                        
                        {c.joined && (
                            <div className="mt-3 relative z-10">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((c.current / c.target) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{width: `${(c.current / c.target) * 100}%`}}></div>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        )}

        {/* 3. TRENDS */}
        {activeTab === 'trends' && (
            <div className="space-y-4">
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Community Category Trends</h3>
                    <div className="h-48">
                        <Bar 
                            data={{
                                labels: ['Food', 'Travel', 'Shop', 'Util', 'Ent'],
                                datasets: [
                                    {
                                        label: 'Trend',
                                        data: [12, 5, -3, 2, 8],
                                        backgroundColor: (ctx) => {
                                            const v = ctx.raw as number;
                                            return v >= 0 ? '#10b981' : '#ef4444';
                                        },
                                        borderRadius: 4
                                    }
                                ]
                            }}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { grid: { display: false } }, y: { display: false } }
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-2">% Change vs Last Month</p>
                </Card>

                {/* Top Growing */}
                <Card className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Flame size={16} className="text-orange-500" /> Top Growing Categories
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Coffee & Cafes', growth: 15, region: 'Colombo' },
                            { name: 'Fitness', growth: 12, region: 'Kandy' },
                            { name: 'Fuel', growth: 8, region: 'National' }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="font-bold text-slate-500 text-xs">#{i+1}</div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</div>
                                        <div className="text-[10px] text-slate-400">{item.region}</div>
                                    </div>
                                </div>
                                <div className="text-emerald-500 text-xs font-bold">+{item.growth}%</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        )}

        {/* 4. LEADERBOARD */}
        {activeTab === 'leaderboard' && (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-amber-100 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">You</div>
                        <div>
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Your Rank</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">#42</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Points</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-white">850</div>
                    </div>
                </div>

                <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                        { rank: 1, name: 'SaverSam', points: 1250, color: 'bg-yellow-400' },
                        { rank: 2, name: 'BudgetQueen', points: 1100, color: 'bg-slate-300' },
                        { rank: 3, name: 'FrugalFox', points: 980, color: 'bg-orange-400' },
                        { rank: 4, name: 'User_882', points: 950, color: 'bg-slate-100 dark:bg-slate-800' },
                        { rank: 5, name: 'CashFlow', points: 920, color: 'bg-slate-100 dark:bg-slate-800' },
                    ].map((user, i) => (
                        <div key={i} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${user.rank <= 3 ? 'text-white' : 'text-slate-500'} ${user.rank === 1 ? 'bg-yellow-400' : user.rank === 2 ? 'bg-slate-400' : user.rank === 3 ? 'bg-orange-400' : 'bg-slate-100'}`}>
                                    {user.rank}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user.points} pts</div>
                        </div>
                    ))}
                </Card>
            </div>
        )}
    </div>
  );
};

const GroupAIView: React.FC<{ group: SharedGroup }> = ({ group }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerateInsights = async () => {
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Summarize group data for the prompt
            const context = `
                Group Name: ${group.name}
                Budget: ${group.totalBudget} ${group.currency}
                Total Spent: ${group.expenses.reduce((s, e) => s + e.amount, 0)}
                Members: ${group.members.map(m => m.name).join(', ')}
                Recent Expenses: ${group.expenses.slice(0, 5).map(e => `${e.title} (${e.amount}) by ${e.paidBy}`).join(', ')}
            `;

            const prompt = `
                You are a collaborative finance assistant. Analyze this group budget.
                Context: ${context}
                
                Provide a JSON-like response with:
                1. Spending Analysis (e.g., "Dining expenses grew 12%").
                2. Recommendations (e.g., "Split groceries differently").
                3. Future Forecast (e.g., "Projected spending: 82,000").
                
                Format clearly as text.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAnalysis(response.text || "Could not generate insights.");
        } catch (e) {
            setAnalysis("AI service unavailable.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div>
                {analysis ? (
                    <Card className="p-4 bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-500/20 animate-in fade-in">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-violet-600 dark:text-violet-400 text-sm uppercase tracking-wider">AI Report</h4>
                            <button onClick={() => setAnalysis(null)} className="text-slate-400"><X size={14}/></button>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {analysis}
                        </div>
                    </Card>
                ) : (
                    <div className="text-center py-6">
                        <button 
                            onClick={handleGenerateInsights}
                            disabled={loading}
                            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-yellow-500" />}
                            Generate AI Insights
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-View: Group Detail ---

const GroupDetailView: React.FC<{ group: SharedGroup, onUpdate: (g: SharedGroup) => void }> = ({ group, onUpdate }) => {
  const [tab, setTab] = useState<'overview' | 'expenses' | 'members' | 'reports'>('overview');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<SharedExpense | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const totalSpent = group.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const remaining = group.totalBudget - totalSpent;
  const progress = group.totalBudget > 0 ? (totalSpent / group.totalBudget) * 100 : 0;

  // Generate Notifications List
  const notifications = useMemo(() => {
    const list = [];
    
    // 1. Budget Alerts
    if (progress >= 100) {
        list.push({
            id: 'alert-100',
            text: `Budget limit exceeded! (${Math.round(progress)}% used)`,
            time: 'Now',
            type: 'danger'
        });
    } else if (progress >= 85) {
        list.push({
            id: 'alert-85',
            text: `Your shared budget is ${Math.round(progress)}% used.`,
            time: 'Today',
            type: 'warning'
        });
    }

    // 2. Activity Log (Limit to 10)
    group.activityLog.slice(0, 10).forEach(log => {
        list.push({
            id: log.id,
            text: `${log.user} ${log.text}`,
            time: log.date,
            type: log.type === 'settlement' ? 'success' : (log.type === 'edit' ? 'warning' : 'info')
        });
    });

    return list;
  }, [group, progress]);

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
                  <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                  >
                      <Bell size={24} className={`transition-colors ${showNotifications ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-500'}`} />
                      {notifications.length > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                      )}
                  </button>

                  {/* Notification Popup */}
                  {showNotifications && (
                      <>
                          <div 
                              className="fixed inset-0 z-30" 
                              onClick={() => setShowNotifications(false)}
                          ></div>
                          <div className="absolute right-0 top-12 z-40 w-72 animate-in zoom-in-95 duration-200 origin-top-right">
                               <Card className="shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                                  {/* Header */}
                                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/80">
                                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                          <Bell size={12} /> Notifications
                                      </h4>
                                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-indigo-500">
                                          <X size={14} />
                                      </button>
                                  </div>
                                  {/* List */}
                                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                      {notifications.length > 0 ? notifications.map(n => (
                                          <div key={n.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex gap-3 items-start transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50">
                                               <div className={`mt-1 w-2 h-2 rounded-full shrink-0 shadow-sm ${n.type === 'danger' ? 'bg-red-500' : n.type === 'warning' ? 'bg-orange-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                               <div>
                                                   <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug font-medium">{n.text}</p>
                                                   <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><History size={10}/> {n.time}</p>
                                               </div>
                                          </div>
                                      )) : (
                                          <div className="text-center py-6 text-slate-400">
                                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                                  <Bell size={14} className="opacity-50" />
                                              </div>
                                              <p className="text-xs">No new updates</p>
                                          </div>
                                      )}
                                  </div>
                               </Card>
                          </div>
                      </>
                  )}
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
                      return (
                          <div key={expense.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ${payer?.avatarColor} flex items-center justify-center text-white font-bold text-[10px]`}>
                                      {payer?.name.charAt(0)}
                                  </div>
                                  <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white">{expense.title}</div>
                                      <div className="text-[10px] text-slate-500">{payer?.name} {expense.type === 'settlement' ? 'settled' : 'paid'} • {expense.category}</div>
                                  </div>
                              </div>
                              <div className={`text-sm font-bold ${expense.type === 'settlement' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
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
          <button 
            onClick={openAddModal}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={18} /> Add Expense
          </button>

          <div className="space-y-2">
            {group.expenses.map(expense => {
                const payer = group.members.find(m => m.id === expense.paidBy);
                const isExpanded = expandedExpenseId === expense.id;

                return (
                  <Card 
                    key={expense.id} 
                    className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500/20' : 'active:scale-[0.99]'}`}
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
                              {payer?.name} paid • {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                            <div className={`font-bold text-sm ${expense.type === 'settlement' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                            {group.currency} {expense.amount.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                                {expense.type === 'settlement' ? 'Settlement' : `Shared with ${expense.sharedWith.length}`}
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
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-600 dark:text-slate-300">
                                            {expense.category}
                                        </span>
                                        {expense.type === 'settlement' && (
                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                                                Payment
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {expense.type !== 'settlement' && (
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
                                {expense.type !== 'settlement' && (
                                    <div>
                                        <p className="font-bold text-slate-500 uppercase text-[10px] mb-2">Split Details</p>
                                        <div className="space-y-2">
                                            {Object.entries(expense.split).map(([userId, amount]) => {
                                                const member = group.members.find(m => m.id === userId);
                                                return (
                                                    <div key={userId} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-5 h-5 rounded-full ${member?.avatarColor || 'bg-slate-300'} flex items-center justify-center text-[8px] text-white font-bold`}>
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
    </div>
  );
};

const GroupMembersTab: React.FC<{ group: SharedGroup, onUpdate: (g: SharedGroup) => void }> = ({ group, onUpdate }) => {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const handleRoleChange = (memberId: string, newRole: 'Owner' | 'Editor' | 'Viewer') => {
        const updatedMembers = group.members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
        onUpdate({ ...group, members: updatedMembers });
    };

    const handleRemoveMember = (memberId: string) => {
        if(confirm('Remove this member from the group?')) {
            const updatedMembers = group.members.filter(m => m.id !== memberId);
            onUpdate({ ...group, members: updatedMembers });
        }
    };

    const handleInviteMember = (memberData: any) => {
        const newMember: SharedMember = {
            id: Math.random().toString(36).substr(2, 9),
            name: memberData.name,
            email: memberData.email,
            role: memberData.role,
            avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
        };
        onUpdate({ ...group, members: [...group.members, newMember] });
        setIsInviteModalOpen(false);
    };

    const handleToggleSetting = () => {
        onUpdate({ 
            ...group, 
            settings: { ...group.settings, shareAllCategories: !group.settings.shareAllCategories } 
        });
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group Members</h3>
                    <p className="text-[10px] text-slate-400">Manage roles and access</p>
                </div>
                {group.members.map(member => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${member.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</div>
                                <div className="text-[10px] text-slate-500">{member.email || 'No email'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select 
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold px-2 py-1 outline-none"
                                disabled={member.id === 'me'} // Self cannot change own role easily here
                            >
                                <option value="Owner">Owner</option>
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                            {member.id !== 'me' && (
                                <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div className="p-4">
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Invite New Member
                    </button>
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Group Settings</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Share All Categories</div>
                        <div className="text-[10px] text-slate-500">If off, share specific only</div>
                    </div>
                    <button 
                        onClick={handleToggleSetting}
                        className={`w-10 h-6 rounded-full relative transition-colors ${group.settings.shareAllCategories ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${group.settings.shareAllCategories ? 'left-5' : 'left-1'}`}></div>
                    </button>
                </div>
            </Card>

            <InviteMemberModal 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onConfirm={handleInviteMember}
            />
        </div>
    );
};

// --- Modals ---

const SettleUpModal = ({ isOpen, onClose, onConfirm, data }: any) => {
    const [method, setMethod] = useState('cash');

    if (!isOpen || !data) return null;

    const isPay = data.from === 'You';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{isPay ? 'Settle Debt' : 'Send Reminder'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="text-center mb-6">
                    <div className="text-sm text-slate-500 uppercase font-bold mb-1">{isPay ? 'You Owe' : 'Owed By'}</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">LKR {data.amount.toLocaleString()}</div>
                    <div className="text-sm text-slate-500 mt-1">to {isPay ? data.to : data.from}</div>
                </div>

                {isPay && (
                    <div className="space-y-3 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase">Select Method</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setMethod('cash')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'cash' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                <DollarSign size={20} /> <span className="text-[10px] font-bold">Cash</span>
                            </button>
                            <button onClick={() => setMethod('bank')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'bank' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                <CreditCard size={20} /> <span className="text-[10px] font-bold">Transfer</span>
                            </button>
                            <button onClick={() => setMethod('qr')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'qr' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                <QrCode size={20} /> <span className="text-[10px] font-bold">QR</span>
                            </button>
                        </div>
                    </div>
                )}

                <button 
                    onClick={onConfirm}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isPay ? <CheckCircle size={18} /> : <Send size={18} />}
                    {isPay ? 'Mark as Paid' : 'Send Reminder'}
                </button>
            </div>
        </div>
    );
};

const CreateGroupModal = ({ isOpen, onClose, onConfirm, initialData }: any) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [categories, setCategories] = useState('Food, Utilities, Travel');
    const [invites, setInvites] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setBudget(initialData.totalBudget.toString());
                setCurrency(initialData.currency);
                setCategories(initialData.categories.join(', '));
                setInvites(''); 
            } else {
                setName('');
                setBudget('');
                setCurrency('USD');
                setCategories('Food, Utilities, Travel');
                setInvites('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const baseMembers = initialData ? initialData.members : [{ id: 'me', name: 'You', role: 'Owner', avatarColor: 'bg-indigo-500' }];
        
        const newInvites = invites.split(',').map((e: string) => e.trim()).filter((e: string) => e);
        const addedMembers = newInvites.map((email: string) => ({
             id: Math.random().toString(36).substr(2, 9),
             name: email.split('@')[0], 
             email: email,
             role: 'Viewer',
             avatarColor: 'bg-gray-500'
        }));

        const finalMembers = [...baseMembers, ...addedMembers];

        onConfirm({
            id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
            name,
            totalBudget: parseFloat(budget) || 0,
            currency,
            members: finalMembers,
            expenses: initialData ? initialData.expenses : [],
            categories: categories.split(',').map((c: string) => c.trim()).filter((c: string) => c),
            activityLog: initialData ? initialData.activityLog : [],
            settings: initialData ? initialData.settings : { shareAllCategories: true }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Shared Budget' : 'Create Shared Budget'}</h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Budget Name</label>
                        <input 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g., Family Budget 2025"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Total Limit</label>
                            <input 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Amount"
                                type="number"
                                value={budget} onChange={e => setBudget(e.target.value)}
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Currency</label>
                            <select 
                                value={currency} onChange={e => setCurrency(e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            >
                                <option>USD</option>
                                <option>EUR</option>
                                <option>AUD</option>
                                <option>GBP</option>
                                <option>LKR</option>
                                <option>CAD</option>
                                <option>JPY</option>
                                <option>INR</option>
                                <option>CPY</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Categories (comma separated)</label>
                        <input 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            value={categories} onChange={e => setCategories(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Invite Members (Emails)</label>
                        <textarea 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none h-20"
                            placeholder="Enter emails separated by comma..."
                            value={invites} onChange={e => setInvites(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleSubmit}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl mt-2 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        {initialData ? 'Save Changes' : 'Create Shared Budget'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const InviteMemberModal = ({ isOpen, onClose, onConfirm }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Viewer');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setRole('Viewer');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Member</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Name</label>
                        <input 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Member Name"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Email (Optional)</label>
                        <input 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            placeholder="email@example.com"
                            value={email} onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Role</label>
                        <select 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                            value={role} onChange={e => setRole(e.target.value)}
                        >
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Owner">Owner</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => onConfirm({ name, email, role })}
                        disabled={!name}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                        Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddSharedExpenseModal = ({ isOpen, onClose, onConfirm, group, initialData }: any) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('me');
    const [category, setCategory] = useState('General');
    const [notes, setNotes] = useState('');
    const [splitType, setSplitType] = useState<'equal' | 'amount' | 'percent'>('equal');
    
    // Selected members for splitting
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    
    // Custom splits state
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
    const [customPercents, setCustomPercents] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && group) {
            if (initialData) {
                // Editing mode
                setTitle(initialData.title);
                setAmount(initialData.amount.toString());
                setPaidBy(initialData.paidBy);
                setCategory(initialData.category);
                setNotes(initialData.notes || '');
                
                // Populate splits
                setSelectedMembers(initialData.sharedWith);
                
                // For exactness in editing, we use 'amount' mode and populate custom amounts
                setSplitType('amount');
                const loadedAmounts: Record<string, string> = {};
                const allIds = group.members.map((m: any) => m.id);
                
                allIds.forEach((id: string) => {
                    if (initialData.split[id]) {
                        loadedAmounts[id] = initialData.split[id].toString();
                    } else {
                        loadedAmounts[id] = '';
                    }
                });
                setCustomAmounts(loadedAmounts);
                
                // Reset percents map
                const initPercents: Record<string, string> = {};
                allIds.forEach((id: string) => initPercents[id] = '');
                setCustomPercents(initPercents);

            } else {
                // Creating new
                setTitle(''); setAmount(''); setPaidBy('me'); setNotes('');
                setCategory(group.categories[0] || 'General');
                setSplitType('equal');
                
                const allIds = group.members.map((m: any) => m.id);
                setSelectedMembers(allIds);
                
                // Init custom fields
                const initMap: Record<string, string> = {};
                allIds.forEach((id: string) => initMap[id] = '');
                setCustomAmounts(initMap);
                setCustomPercents(initMap);
            }
        }
    }, [isOpen, group, initialData]);

    // Calculate current splits based on mode
    const calculateCurrentSplits = () => {
        const total = parseFloat(amount) || 0;
        const finalSplits: Record<string, number> = {};
        
        if (splitType === 'equal') {
            const count = selectedMembers.length;
            if (count > 0 && total > 0) {
                const share = total / count;
                selectedMembers.forEach(id => finalSplits[id] = share);
            }
        } else if (splitType === 'amount') {
            selectedMembers.forEach(id => {
                finalSplits[id] = parseFloat(customAmounts[id]) || 0;
            });
        } else if (splitType === 'percent') {
            selectedMembers.forEach(id => {
                const pct = parseFloat(customPercents[id]) || 0;
                finalSplits[id] = (total * pct) / 100;
            });
        }
        
        return finalSplits;
    };

    const totalAssigned = useMemo(() => {
        const splits = calculateCurrentSplits();
        return Object.values(splits).reduce((a, b) => a + b, 0);
    }, [amount, splitType, selectedMembers, customAmounts, customPercents]);

    const toggleMember = (id: string) => {
        if (selectedMembers.includes(id)) {
            if (selectedMembers.length > 1) setSelectedMembers(selectedMembers.filter(m => m !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    if (!isOpen || !group) return null;

    const handleSubmit = () => {
        const total = parseFloat(amount) || 0;
        if (Math.abs(totalAssigned - total) > 1.0 && splitType !== 'equal') {
            alert(`Split amounts don't match total. Difference: ${Math.abs(totalAssigned - total).toFixed(2)}`);
            return;
        }

        onConfirm({
            id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
            title,
            amount: total,
            paidBy,
            category,
            date: initialData ? initialData.date : new Date().toISOString().split('T')[0],
            sharedWith: selectedMembers,
            split: calculateCurrentSplits(),
            notes,
            type: 'expense'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Expense' : 'Add Expense'}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
                </div>

                <div className="space-y-4">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors" placeholder="Title (e.g. Groceries)" value={title} onChange={e => setTitle(e.target.value)} />
                    
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500 font-bold">{group.currency}</span>
                        <input className="w-full p-3 pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold focus:border-indigo-500 transition-colors" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>

                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 transition-colors" value={category} onChange={e => setCategory(e.target.value)}>
                        {group.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Paid By</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                            {group.members.map((m: SharedMember) => (
                                <button 
                                    key={m.id}
                                    onClick={() => setPaidBy(m.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${paidBy === m.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Split Expense</label>
                        
                        {/* Split Type Tabs */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-3">
                            <button onClick={() => setSplitType('equal')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${splitType === 'equal' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Equally</button>
                            <button onClick={() => setSplitType('amount')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${splitType === 'amount' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Unequally</button>
                            <button onClick={() => setSplitType('percent')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${splitType === 'percent' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>By %</button>
                        </div>

                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            {group.members.map((m: SharedMember) => {
                                const isSelected = selectedMembers.includes(m.id);
                                return (
                                <div key={m.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleMember(m.id)}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {isSelected && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{m.name}</span>
                                    </div>
                                    
                                    {isSelected ? (
                                        splitType === 'equal' ? (
                                            <span className="text-xs font-bold text-slate-500">
                                                {group.currency} {((parseFloat(amount) || 0) / selectedMembers.length).toFixed(0)}
                                            </span>
                                        ) : splitType === 'amount' ? (
                                            <div className="flex items-center gap-1 w-24">
                                                <span className="text-[10px] text-slate-400">{group.currency}</span>
                                                <input 
                                                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs outline-none"
                                                    placeholder="0"
                                                    type="number"
                                                    value={customAmounts[m.id]}
                                                    onChange={(e) => setCustomAmounts({...customAmounts, [m.id]: e.target.value})}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 w-20">
                                                <input 
                                                    className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs outline-none"
                                                    placeholder="0"
                                                    type="number"
                                                    value={customPercents[m.id]}
                                                    onChange={(e) => setCustomPercents({...customPercents, [m.id]: e.target.value})}
                                                />
                                                <span className="text-[10px] text-slate-400">%</span>
                                            </div>
                                        )
                                    ) : (
                                        <span className="text-xs text-slate-300">-</span>
                                    )}
                                </div>
                            )})}
                        </div>
                        
                        {splitType !== 'equal' && (
                            <div className={`text-right text-xs mt-2 font-bold ${Math.abs(totalAssigned - (parseFloat(amount)||0)) < 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {Math.abs(totalAssigned - (parseFloat(amount)||0)) < 1 ? 'Matches Total' : `Diff: ${group.currency} ${(totalAssigned - (parseFloat(amount)||0)).toFixed(2)}`}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">
                        {initialData ? 'Save Changes' : 'Confirm Split'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }: any) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black text-white">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10">
                <h3 className="font-bold text-lg">Scan QR Code</h3>
                <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20">
                    <X size={20} />
                </button>
            </div>

            {/* Viewfinder Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Simulated Camera Feed Background */}
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {/* Placeholder for camera feed */}
                    <div className="text-slate-600 text-sm animate-pulse">Camera Active</div>
                </div>

                {/* Overlay Mask */}
                <div className="absolute inset-0 border-[50px] border-black/50 pointer-events-none"></div>

                {/* Scanning Frame */}
                <div className="relative w-64 h-64 border-2 border-white/50 rounded-lg z-10">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-500 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-500 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-500 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-500 -mb-1 -mr-1"></div>

                    {/* Scan Line Animation */}
                    <div className="absolute left-0 right-0 h-0.5 bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-scan-line top-0"></div>
                </div>

                <p className="absolute bottom-32 text-sm font-medium text-white/80 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                    Point camera at a Group QR Code
                </p>
            </div>

            {/* Controls */}
            <div className="bg-black p-6 pb-10 flex justify-around items-center">
                <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <ImageIcon size={20} />
                    </div>
                    <span className="text-[10px]">Gallery</span>
                </button>

                {/* Simulate Button (For Prototype) */}
                <button 
                    onClick={onScanSuccess}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-white/30 flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform">
                        <ScanLine size={24} />
                    </div>
                </button>

                <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Keyboard size={20} />
                    </div>
                    <span className="text-[10px]">Enter Code</span>
                </button>
            </div>
            
            <style>{`
                @keyframes scan-line {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

function formatCurrency(amount: number, symbol: string = '$') {
    return `${symbol} ${amount.toLocaleString()}`;
}
