import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, ChevronLeft, CheckCircle, History, QrCode, Bell, BellRing
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';
import { NotificationItem, getCollaborativeNotifications } from '../utils/calculations';
import { SharedGroup, SharedMember } from '../types';

// Import new sub-components
import { GroupsListSection } from '../components/collaboration/GroupsListSection';
import { SettlementsSection } from '../components/collaboration/SettlementsSection';
import { HistorySection } from '../components/collaboration/HistorySection';
import { GroupDetailView } from '../components/collaboration/GroupDetailView';
import { CreateGroupModal } from '../components/collaboration/CreateGroupModal';
import { QRScannerModal } from '../components/collaboration/QRScannerModal';

interface CollaborativeViewProps {
  onBack: () => void;
  onProfileClick: () => void;
  groups: SharedGroup[];
  onUpdateGroups: (groups: SharedGroup[]) => void;
  onCreateShoppingList?: (groupName: string, expenseName: string, amount: number, members: SharedMember[], linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => void;
}

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
              <GroupsListSection 
                groups={groups} 
                setActiveGroupId={setActiveGroupId} 
                setIsCreateModalOpen={setIsCreateModalOpen} 
                onUpdateGroups={onUpdateGroups}
                notifications={notifications}
              />
            )}

            {activeTab === 'settle' && <SettlementsSection groups={groups} onUpdateGroup={handleUpdateGroup} />}
            
            {activeTab === 'history' && <HistorySection groups={groups} />}
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