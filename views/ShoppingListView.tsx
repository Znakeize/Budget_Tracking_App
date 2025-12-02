
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { 
  ChevronLeft, ShoppingCart, Plus, Trash2, Share2, CheckCircle, Circle, 
  Search, MapPin, MoreVertical, BellRing, X, Store, ChevronRight,
  Wallet, ArrowLeft, Edit2, List, Bell, Download, Users, Pencil,
  User, ShoppingBag, Tag, DollarSign, Copy, Calendar, Zap, Settings, BrainCircuit,
  ArrowRight as ArrowRightIcon, AlertTriangle, Sparkles, Clock, UserPlus, Package,
  AlertCircle, ChevronDown, Lock, Link
} from 'lucide-react';
import { ShoppingListData, Shop, ShopItem, ShopMember } from '../types';
import { generateId, formatCurrency, getShoppingNotifications, NotificationItem } from '../utils/calculations';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';

interface ShoppingListViewProps {
  onBack: () => void;
  onProfileClick: () => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  shoppingLists: ShoppingListData[];
  onUpdateLists: (lists: ShoppingListData[]) => void;
  onSyncToBudget: (amount: number, shopName: string) => void;
  focusListId?: string;
  focusShopId?: string;
  clearFocus?: () => void;
  expenseCategories?: string[];
  onItemChange?: (amount: number, total: number, category?: string, eventId?: string, expenseId?: string, groupId?: string, groupExpenseId?: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({ 
  onBack, 
  onProfileClick, 
  notificationCount, 
  onToggleNotifications, 
  shoppingLists = [], 
  onUpdateLists,
  onSyncToBudget,
  focusListId,
  focusShopId,
  clearFocus,
  expenseCategories = [],
  onItemChange
}) => {
  // Navigation State: null = Main View, string = List ID, obj = Shop ID inside List
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  
  // Action States
  const [editingList, setEditingList] = useState<ShoppingListData | null>(null);
  const [sharingList, setSharingList] = useState<ShoppingListData | null>(null);

  // Local Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
      personal: true,
      shared: true,
      smart: true
  });
  // Although the popup doesn't support dismiss natively, we keep the filter logic
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  // Handle Deep Linking from Props
  useEffect(() => {
      if (focusListId) {
          setActiveListId(focusListId);
          if (focusShopId) {
              setActiveShopId(focusShopId);
          } else {
              setActiveShopId(null);
          }
          // Clear the focus prop from parent to prevent re-triggering
          if (clearFocus) setTimeout(clearFocus, 100);
      }
  }, [focusListId, focusShopId]);

  // Derived Active Data
  const activeList = useMemo(() => shoppingLists.find(l => l.id === activeListId), [shoppingLists, activeListId]);
  const activeShop = useMemo(() => activeList?.shops.find(s => s.id === activeShopId), [activeList, activeShopId]);

  // Sample Notifications for Demo
  const DEMO_NOTIFICATIONS: NotificationItem[] = [
      // A. Personal Notifications
      { id: 'demo-1', type: 'warning', category: 'Shopping', message: 'Don’t forget to buy Milk today!', date: 'Today', actionLabel: 'View Item', data: { listId: 'list-sample-1' } },
      { id: 'demo-2', type: 'info', category: 'Shopping', message: '3 items remaining in your Weekly Groceries list.', date: 'Today', actionLabel: 'View List', data: { listId: 'list-sample-1' } },
      { id: 'demo-3', type: 'danger', category: 'Shopping', message: 'You didn’t mark Eggs as purchased yesterday.', date: 'Yesterday', actionLabel: 'Check Item', data: { listId: 'list-sample-1' } },
      
      // B. Shared List Notifications
      { id: 'demo-4', type: 'info', category: 'Shopping', message: 'Sarah added "Ice Cream" to Weekly Groceries.', date: '10 mins ago', actionLabel: 'See List', data: { listId: 'list-sample-1' } },
      { id: 'demo-5', type: 'success', category: 'Shopping', message: 'Mike marked "Chicken" as purchased.', date: '1 hour ago', data: { listId: 'list-sample-1' } },
      { id: 'demo-6', type: 'info', category: 'Shopping', message: 'New shop added in your list: Trader Joe\'s.', date: '2 hours ago', data: { listId: 'list-sample-1' } },
      { id: 'demo-7', type: 'info', category: 'Shopping', message: 'Anna shared "Festival Shopping" with you.', date: 'Today', data: { listId: 'list-sample-1' } },

      // C. Smart Suggestions
      { id: 'demo-8', type: 'success', category: 'Shopping', message: 'You usually buy Rice on Mondays — add it?', date: 'Smart Suggestion', actionLabel: 'Add Item', data: { listId: 'list-sample-1' } },
      { id: 'demo-9', type: 'warning', category: 'Shopping', message: '2 items left to purchase — Mike marked the rest!', date: 'Smart Nudge', actionLabel: 'Finish List', data: { listId: 'list-sample-1' } }
  ];

  // Generate and Filter Notifications
  const activeNotifications = useMemo(() => {
      const realNotifications = getShoppingNotifications(shoppingLists);
      // Combine Real + Demo, filtering out dismissed
      const all = [...realNotifications, ...DEMO_NOTIFICATIONS];
      
      return all.filter(n => {
          if (dismissedNotifIds.includes(n.id)) return false;
          if (n.type === 'warning' || n.type === 'danger') return notifSettings.personal;
          if (n.message.includes('shared') || n.message.includes('added') || n.message.includes('marked')) return notifSettings.shared;
          if (n.type === 'success') return notifSettings.smart;
          return true;
      });
  }, [shoppingLists, notifSettings, dismissedNotifIds]);

  // --- Handlers ---

  const handleCreateList = (listData: any) => {
    const newList: ShoppingListData = {
        id: generateId(),
        name: listData.name,
        shops: [],
        members: listData.members,
        created: Date.now(),
        currencySymbol: '$',
        color: 'bg-emerald-500',
        budget: listData.budget,
        lastModified: Date.now()
    };
    onUpdateLists([...shoppingLists, newList]);
    setIsCreateListModalOpen(false);
  };

  const handleUpdateList = (updatedList: ShoppingListData) => {
    const stampedList = { ...updatedList, lastModified: Date.now() };
    onUpdateLists(shoppingLists.map(l => l.id === stampedList.id ? stampedList : l));
  };

  const handleEditListConfirm = (name: string, budget: number) => {
      if (editingList) {
          handleUpdateList({ ...editingList, name, budget });
          setEditingList(null);
      }
  };

  const handleInviteMember = (email: string) => {
      if (sharingList) {
        const newMember: ShopMember = {
            id: generateId(),
            name: email.split('@')[0],
            email,
            role: 'viewer',
            avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'][Math.floor(Math.random() * 4)]
        };
        // Update the sharingList reference directly to reflect in UI immediately if modal stays open (though we close it)
        // But crucially, call updateList to persist
        handleUpdateList({ ...sharingList, members: [...sharingList.members, newMember] });
        setSharingList(null);
      }
  };

  const handleRemoveMemberFromList = (memberId: string) => {
      if (sharingList) {
          const updatedMembers = sharingList.members.filter(m => m.id !== memberId);
          const updatedList = { ...sharingList, members: updatedMembers };
          handleUpdateList(updatedList);
          setSharingList(updatedList); // Update local state for modal
      }
  };

  const handleUpdateMemberRole = (memberId: string, newRole: 'editor' | 'viewer') => {
      if (sharingList) {
          const updatedMembers = sharingList.members.map(m => 
              m.id === memberId ? { ...m, role: newRole } : m
          );
          const updatedList = { ...sharingList, members: updatedMembers };
          handleUpdateList(updatedList);
          setSharingList(updatedList); // Update local state for modal
      }
  };

  const handleDeleteList = (id: string) => {
    if(confirm('Delete this shopping list and all contents?')) {
        onUpdateLists(shoppingLists.filter(l => l.id !== id));
        if (activeListId === id) setActiveListId(null);
    }
  };

  const handleDuplicateList = (e: React.MouseEvent, listToDuplicate: ShoppingListData) => {
    e.stopPropagation();
    const newList: ShoppingListData = {
        ...listToDuplicate,
        id: generateId(),
        name: `${listToDuplicate.name} (Copy)`,
        created: Date.now(),
        lastModified: Date.now(),
        shops: listToDuplicate.shops.map(shop => ({
            ...shop,
            id: generateId(),
            items: shop.items.map(item => ({
                ...item,
                id: generateId(),
                checked: false,
                purchasedBy: undefined,
                actualPrice: undefined
            }))
        }))
    };
    onUpdateLists([...shoppingLists, newList]);
  };

  const handleExportList = (e: React.MouseEvent, list: ShoppingListData) => {
    e.stopPropagation();
    const text = `Shopping List: ${list.name}\nBudget: ${list.currencySymbol}${list.budget || 0}\n\n` + 
        list.shops.map(s => 
        `Shop: ${s.name}\n` + 
        s.items.map(i => `- [${i.checked ? 'x' : ' '}] ${i.name} ${i.quantity ? `(${i.quantity})` : ''} ${i.price ? `- Est. ${list.currencySymbol}${i.price}` : ''} ${i.actualPrice ? `- Act. ${list.currencySymbol}${i.actualPrice}` : ''}`).join('\n')
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  const handleNotificationClick = (notif: NotificationItem) => {
      if (notif.data?.listId) {
          setActiveListId(notif.data.listId);
          if (notif.data.shopId) {
              setActiveShopId(notif.data.shopId);
          } else {
              setActiveShopId(null);
          }
      }
      setShowNotifications(false);
  };

  const handleDismissNotification = (id: string) => {
      setDismissedNotifIds(prev => [...prev, id]);
  };

  // Render Logic based on depth
  if (activeListId && activeList && activeShopId && activeShop) {
      return (
          <ShopItemsView 
            list={activeList}
            shop={activeShop}
            onUpdateList={handleUpdateList}
            onBack={() => setActiveShopId(null)}
            notificationCount={activeNotifications.length}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
            onProfileClick={onProfileClick}
            onItemChange={onItemChange}
          />
      );
  }

  if (activeListId && activeList) {
      return (
          <ListDetailView 
            list={activeList}
            onUpdateList={handleUpdateList}
            onBack={() => setActiveListId(null)}
            onSelectShop={(shopId) => setActiveShopId(shopId)}
            onDeleteList={() => handleDeleteList(activeList.id)}
            onEditList={() => setEditingList(activeList)}
            notificationCount={activeNotifications.length}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
            onProfileClick={onProfileClick}
            expenseCategories={expenseCategories}
          />
      );
  }

  // Default: Main Lists View
  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Shopping</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">My Lists</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1 pb-1">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {activeNotifications.length > 0 ? (
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

       {/* Local Notification Popup */}
       {showNotifications && (
           <NotificationPopup 
               notifications={activeNotifications} 
               onClose={() => setShowNotifications(false)} 
               onNotificationClick={handleNotificationClick} 
               onDismiss={handleDismissNotification}
           />
       )}

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           
           <button 
                onClick={() => setIsCreateListModalOpen(true)}
                className="w-full py-4 mb-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99]"
           >
               <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                   <Plus size={24} />
               </div>
               Create New Shopping List
           </button>

           <div className="space-y-4">
                {shoppingLists.map(list => {
                    // Calculate stats
                    let totalItems = 0;
                    let totalChecked = 0;
                    let totalCost = 0;
                    
                    list.shops.forEach(s => {
                        totalItems += s.items.length;
                        totalChecked += s.items.filter(i => i.checked).length;
                        // Use actual price if available, otherwise use estimated price
                        totalCost += s.items.reduce((sum, i) => sum + (i.actualPrice !== undefined ? i.actualPrice : (i.price || 0)), 0);
                    });
                    
                    const itemProgress = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;
                    const budget = list.budget || 0;
                    const budgetProgress = budget > 0 ? (totalCost / budget) * 100 : 0;

                    // Check notifications for this specific list
                    const hasNotifs = activeNotifications.some(n => n.data?.listId === list.id);

                    return (
                        <Card 
                            key={list.id} 
                            onClick={() => setActiveListId(list.id)}
                            className="p-0 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${list.color}`}></div>
                            
                            <div className="p-4 pb-2 pl-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {list.name}
                                            {list.members.length > 1 && <Share2 size={14} className="text-slate-400" />}
                                        </h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <Store size={12} /> {list.shops.length} Shops • {totalItems} Items
                                        </p>
                                        {(list.eventId || list.groupId || list.budgetCategory) && (
                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                {list.budgetCategory && (
                                                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Link size={10} /> Linked: {list.budgetCategory}
                                                    </span>
                                                )}
                                                {list.eventId && (
                                                    <span className="text-[9px] font-bold text-pink-500 bg-pink-50 dark:bg-pink-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        Event Linked
                                                    </span>
                                                )}
                                                {list.groupId && (
                                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        Group Linked
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Right Side: Budget + Notification Icon */}
                                    <div className="flex flex-col items-end gap-2">
                                        {hasNotifs && (
                                           <div className="relative">
                                               <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-pulse"></div>
                                               <AlertCircle size={18} className="text-red-500 relative z-10" fill="currentColor" strokeWidth={1.5} color="white" />
                                           </div>
                                        )}
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(totalCost, list.currencySymbol)}</div>
                                            {budget > 0 && <div className="text-[10px] text-slate-500">of {formatCurrency(budget, list.currencySymbol)}</div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Completion Progress */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        <span>SHOPPING PROGRESS</span>
                                        <span className="text-blue-600 dark:text-blue-400">{Math.round(itemProgress)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${itemProgress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Budget Progress */}
                                {budget > 0 && (
                                    <div className="mb-2">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            <span>BUDGET USED</span>
                                            <span className={`${budgetProgress > 100 ? 'text-red-500' : ''}`}>{Math.round(budgetProgress)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex justify-between items-center pl-5">
                                <div className="flex -space-x-2">
                                    {list.members.slice(0, 3).map((m, i) => (
                                        <div key={i} className={`w-6 h-6 rounded-full ${m.avatarColor} border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white font-bold`}>
                                            {m.name.charAt(0)}
                                        </div>
                                    ))}
                                    {list.members.length > 3 && <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-slate-500 font-bold">+{list.members.length-3}</div>}
                                </div>
                                
                                <div className="flex gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingList(list); }}
                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Edit List"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDuplicateList(e, list)}
                                        className="p-2 text-slate-400 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Duplicate"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSharingList(list); }}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Add People"
                                    >
                                        <Users size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleExportList(e, list)}
                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Export"
                                    >
                                        <Download size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {shoppingLists.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                        <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No shopping lists yet. Create one to get started!</p>
                    </div>
                )}
           </div>
       </div>

       <CreateListModal 
            isOpen={isCreateListModalOpen}
            onClose={() => setIsCreateListModalOpen(false)}
            onConfirm={handleCreateList}
       />

       <EditListModal 
            isOpen={!!editingList}
            onClose={() => setEditingList(null)}
            onConfirm={handleEditListConfirm}
            initialData={editingList}
       />

       <ShareListModal 
            isOpen={!!sharingList}
            onClose={() => setSharingList(null)}
            onConfirm={handleInviteMember}
            members={sharingList?.members || []}
            onRemoveMember={handleRemoveMemberFromList}
            onUpdateRole={handleUpdateMemberRole}
       />

       <NotificationSettingsModal 
            isOpen={isNotificationSettingsOpen}
            onClose={() => setIsNotificationSettingsOpen(false)}
            settings={notifSettings}
            onUpdate={setNotifSettings}
       />
    </div>
  );
};

const ListDetailView: React.FC<{ 
    list: ShoppingListData, 
    onUpdateList: (l: ShoppingListData) => void, 
    onBack: () => void,
    onSelectShop: (shopId: string) => void,
    onDeleteList: () => void,
    onEditList: () => void,
    notificationCount: number,
    onToggleNotifications: () => void,
    onProfileClick: () => void,
    expenseCategories: string[]
}> = ({ list, onUpdateList, onBack, onSelectShop, onDeleteList, onEditList, notificationCount, onToggleNotifications, onProfileClick, expenseCategories }) => {
    const [isAddShopOpen, setIsAddShopOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const handleAddShop = (shop: Shop) => {
        // Inherit links from list if they exist (for "Linked Shopping Lists" created from Event/Group)
        const newShop = { 
            ...shop,
            eventId: list.eventId || shop.eventId,
            expenseId: list.expenseId || shop.expenseId,
            groupId: list.groupId || shop.groupId,
            groupExpenseId: list.groupExpenseId || shop.groupExpenseId,
            budgetCategory: list.budgetCategory || shop.budgetCategory
        };
        const updatedList = { ...list, shops: [...list.shops, newShop] };
        onUpdateList(updatedList);
        setIsAddShopOpen(false);
    };

    const handleEditShop = (shopData: any) => {
        if (editingShop) {
            const updatedShops = list.shops.map(s => s.id === editingShop.id ? { ...s, ...shopData } : s);
            onUpdateList({ ...list, shops: updatedShops });
            setEditingShop(null);
            setIsAddShopOpen(false);
        }
    };

    const handleDeleteShop = (shopId: string) => {
        if(confirm('Delete this shop from the list?')) {
            const updatedList = { ...list, shops: list.shops.filter(s => s.id !== shopId) };
            onUpdateList(updatedList);
        }
    };

    const handleInviteMember = (email: string) => {
        const newMember: ShopMember = {
            id: generateId(),
            name: email.split('@')[0],
            email,
            role: 'viewer',
            avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'][Math.floor(Math.random() * 4)]
        };
        onUpdateList({ ...list, members: [...list.members, newMember] });
        setIsShareOpen(false);
    };

    const handleRemoveMemberFromList = (memberId: string) => {
        const updatedMembers = list.members.filter(m => m.id !== memberId);
        onUpdateList({ ...list, members: updatedMembers });
    };

    const handleUpdateMemberRole = (memberId: string, newRole: 'editor' | 'viewer') => {
        const updatedMembers = list.members.map(m => 
            m.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdateList({ ...list, members: updatedMembers });
    };

    const totalSpent = list.shops.reduce((acc, shop) => {
        return acc + shop.items.reduce((s, i) => s + (i.actualPrice !== undefined ? i.actualPrice : (i.price || 0)), 0);
    }, 0);
    const listBudget = list.budget || 0;
    const listBudgetProgress = listBudget > 0 ? (totalSpent / listBudget) * 100 : 0;

    return (
        <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none pt-6 px-4 pb-2 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">{list.name}</h1>
                                <button onClick={onEditList} className="p-1 text-slate-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{list.shops.length} Shops</span>
                                {list.budget && <span className="font-bold text-emerald-600 dark:text-emerald-400">Budget: {list.currencySymbol}{list.budget}</span>}
                                {list.budgetCategory && <span className="font-bold text-indigo-500">{list.budgetCategory}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsShareOpen(true)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button onClick={onDeleteList} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* List Global Budget Bar */}
                {listBudget > 0 && (
                    <div className="mt-3 mb-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>TOTAL BUDGET USED</span>
                            <span>{Math.round(listBudgetProgress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${listBudgetProgress > 100 ? 'bg-red-500' : listBudgetProgress > 85 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(listBudgetProgress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 space-y-4">
                <button 
                    onClick={() => { setEditingShop(null); setIsAddShopOpen(true); }}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                    <Plus size={18} /> Add Shop
                </button>

                {list.shops.map(shop => {
                    const itemCount = shop.items.length;
                    const checkedCount = shop.items.filter(i => i.checked).length;
                    
                    const shopCost = shop.items.reduce((sum, i) => sum + (i.actualPrice !== undefined ? i.actualPrice : (i.price || 0)), 0);
                    const shopBudget = shop.budget || 0;
                    
                    const budgetProgress = shopBudget > 0 ? (shopCost / shopBudget) * 100 : 0;
                    const completionProgress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;

                    return (
                        <div key={shop.id} className="group relative bg-white dark:bg-slate-900/50 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700/60 p-5 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => onSelectShop(shop.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/10">
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{shop.name}</h4>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{checkedCount}/{itemCount} Items • {formatCurrency(shopCost, list.currencySymbol)}</p>
                                        {shop.budgetCategory && <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Linked: {shop.budgetCategory}</p>}
                                        {shop.eventId && <p className="text-[10px] text-pink-500 font-bold mt-0.5">Event Linked</p>}
                                        {shop.groupId && <p className="text-[10px] text-amber-500 font-bold mt-0.5">Group Linked</p>}
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300 mt-1 group-hover:text-slate-500 dark:group-hover:text-slate-200 transition-colors" />
                            </div>

                            {/* Budget Bar */}
                            {shopBudget > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-end mb-1.5">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">BUDGET ({Math.round(budgetProgress)}%)</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(shopCost, list.currencySymbol)} <span className="text-slate-400 text-[10px] font-normal">/ {formatCurrency(shopBudget, list.currencySymbol)}</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${budgetProgress > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Completion Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">COMPLETION</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{Math.round(completionProgress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                                    <div 
                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${completionProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                <button onClick={(e) => { e.stopPropagation(); setEditingShop(shop); setIsAddShopOpen(true); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteShop(shop.id); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <AddShopModal 
                isOpen={isAddShopOpen}
                onClose={() => setIsAddShopOpen(false)}
                onConfirm={editingShop ? handleEditShop : handleAddShop}
                initialData={editingShop}
                currencySymbol={list.currencySymbol}
                categories={expenseCategories}
                isListLinked={!!list.eventId || !!list.groupId || !!list.budgetCategory}
                fixedCategory={list.budgetCategory}
            />

            <ShareListModal 
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                onConfirm={handleInviteMember}
                members={list.members}
                onRemoveMember={handleRemoveMemberFromList}
                onUpdateRole={handleUpdateMemberRole}
            />
        </div>
    );
};

const ShopItemsView: React.FC<{ 
    list: ShoppingListData,
    shop: Shop, 
    onUpdateList: (l: ShoppingListData) => void, 
    onBack: () => void,
    notificationCount: number,
    onToggleNotifications: () => void,
    onProfileClick: () => void,
    onItemChange?: (amount: number, total: number, category?: string, eventId?: string, expenseId?: string, groupId?: string, groupExpenseId?: string) => void
}> = ({ list, shop, onUpdateList, onBack, notificationCount, onToggleNotifications, onProfileClick, onItemChange }) => {
    const [search, setSearch] = useState('');
    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

    const handleUpdateShop = (updatedShop: Shop) => {
        const updatedShops = list.shops.map(s => s.id === updatedShop.id ? updatedShop : s);
        onUpdateList({ ...list, shops: updatedShops });
    };

    const syncShopTotal = (currentItems: ShopItem[], diff: number) => {
        if (!onItemChange) return;
        
        // Calculate Total Checked for 1:1 sync (Events/Groups)
        // This recalculates the total spent from scratch based on the new items state
        const totalChecked = currentItems
            .filter(i => i.checked)
            .reduce((sum, i) => sum + (i.actualPrice !== undefined ? i.actualPrice : (i.price || 0)), 0);
            
        // Check if any link exists to optimize
        if (shop.budgetCategory || (shop.eventId && shop.expenseId) || (shop.groupId && shop.groupExpenseId)) {
             onItemChange(
                diff, 
                totalChecked, 
                shop.budgetCategory, 
                shop.eventId, 
                shop.expenseId, 
                shop.groupId, 
                shop.groupExpenseId
            );
        }
    };

    const handleAddItem = (itemData: any) => {
        const newItem: ShopItem = {
            id: generateId(),
            name: itemData.name,
            quantity: itemData.quantity,
            notes: itemData.notes,
            price: itemData.price || 0,
            actualPrice: 0,
            checked: false,
            addedBy: 'You',
            dueDate: itemData.dueDate // Capture due date
        };
        const updatedItems = [...shop.items, newItem];
        handleUpdateShop({ ...shop, items: updatedItems });
        setIsAddItemOpen(false);
        // No sync needed for add as it is unchecked by default
    };

    const handleEditItem = (itemData: any) => {
        if (!editingItem) return;
        const oldItem = editingItem;
        
        const updatedItems = shop.items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i);
        handleUpdateShop({ ...shop, items: updatedItems });
        
        // Calculate diff if checked status or price changed while checked
        let diff = 0;
        if (oldItem.checked) {
             const oldContribution = oldItem.actualPrice !== undefined ? oldItem.actualPrice : (oldItem.price || 0);
             const newActual = itemData.actualPrice !== undefined ? itemData.actualPrice : oldItem.actualPrice;
             const newEst = itemData.price !== undefined ? itemData.price : oldItem.price;
             const newContribution = newActual !== undefined ? newActual : (newEst || 0);
             
             diff = newContribution - oldContribution;
        }

        syncShopTotal(updatedItems, diff);

        setEditingItem(null);
        setIsAddItemOpen(false);
    };

    const handleDeleteItem = (itemId: string) => {
        const item = shop.items.find(i => i.id === itemId);
        let diff = 0;
        if (item && item.checked) {
             diff = -(item.actualPrice !== undefined ? item.actualPrice : (item.price || 0));
        }
        
        const updatedItems = shop.items.filter(i => i.id !== itemId);
        handleUpdateShop({ ...shop, items: updatedItems });
        
        syncShopTotal(updatedItems, diff);
        setEditingItem(null);
        setIsAddItemOpen(false);
    };

    const handleToggleCheck = (itemId: string) => {
        let diff = 0;
        const updatedItems = shop.items.map(i => {
            if (i.id === itemId) {
                const newChecked = !i.checked;
                
                // Auto-fill actual price from estimated price if checking and actual is empty
                let newActualPrice = i.actualPrice;
                if (newChecked && !i.actualPrice && i.price) {
                    newActualPrice = i.price;
                }

                const priceToUse = newActualPrice !== undefined ? newActualPrice : (i.price || 0);
                
                diff = newChecked ? priceToUse : -priceToUse;

                return { 
                    ...i, 
                    checked: newChecked,
                    purchasedBy: newChecked ? 'You' : undefined,
                    actualPrice: newActualPrice
                };
            }
            return i;
        });
        handleUpdateShop({ ...shop, items: updatedItems });
        syncShopTotal(updatedItems, diff);
    };

    const handlePriceChange = (itemId: string, newPrice: number) => {
        const oldItem = shop.items.find(i => i.id === itemId);
        if (!oldItem) return;
        
        const updatedItems = shop.items.map(i =>
            i.id === itemId ? { ...i, actualPrice: newPrice } : i
        );
        handleUpdateShop({ ...shop, items: updatedItems });

        let diff = 0;
        if (oldItem.checked) {
             const oldVal = oldItem.actualPrice !== undefined ? oldItem.actualPrice : (oldItem.price || 0);
             diff = newPrice - oldVal;
        }
        
        syncShopTotal(updatedItems, diff);
    };

    const filteredItems = shop.items
        .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (a.checked === b.checked) return 0;
            return a.checked ? 1 : -1;
        });

    const shopSpent = shop.items.reduce((sum, i) => sum + (i.actualPrice !== undefined ? i.actualPrice : (i.price || 0)), 0);
    const shopBudget = shop.budget || 0;
    const shopBudgetProgress = shopBudget > 0 ? (shopSpent / shopBudget) * 100 : 0;

    return (
        <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none pt-6 px-4 pb-2 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">{shop.name}</h1>
                            <p className="text-xs text-slate-500 truncate">in {list.name} {shop.budgetCategory ? `• ${shop.budgetCategory}` : ''} {shop.eventId ? `• Event Linked` : ''} {shop.groupId ? `• Group Linked` : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Shop Budget Bar */}
                {shopBudget > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span className="uppercase tracking-wider">BUDGET ({Math.round(shopBudgetProgress)}%)</span>
                            <span>{formatCurrency(shopSpent, list.currencySymbol)} / {formatCurrency(shopBudget, list.currencySymbol)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${shopBudgetProgress > 100 ? 'bg-red-500' : shopBudgetProgress > 85 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(shopBudgetProgress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input 
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 space-y-3">
                {filteredItems.map(item => {
                    // Check due date status
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isOverdue = item.dueDate && item.dueDate < todayStr && !item.checked;
                    const isDueToday = item.dueDate === todayStr && !item.checked;

                    return (
                    <div 
                        key={item.id} 
                        className={`group relative p-4 rounded-2xl border transition-all duration-300 ${item.checked ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'} ${isOverdue ? 'border-red-500/30 ring-1 ring-red-500/10' : ''}`}
                    >
                        <div className="flex gap-3">
                            {/* Checkbox */}
                            <div className="check-container flex-shrink-0 mt-0.5">
                                <input 
                                    type="checkbox" 
                                    id={`cbx-${item.id}`} 
                                    className="cbx" 
                                    checked={item.checked} 
                                    onChange={() => handleToggleCheck(item.id)} 
                                />
                                <label htmlFor={`cbx-${item.id}`} className="check">
                                    <svg width="18px" height="18px" viewBox="0 0 18 18">
                                        <path d="M 1 9 L 1 9 c 0 -5 3 -8 8 -8 L 9 1 C 14 1 17 5 17 9 L 17 9 c 0 4 -4 8 -8 8 L 9 17 C 5 17 1 14 1 9 L 1 9 Z" />
                                        <polyline points="1 9 7 14 15 4" />
                                    </svg>
                                </label>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold leading-snug ${item.checked ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                        {item.name}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsAddItemOpen(true); }} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-500">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Info Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {item.quantity && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            Qty: {item.quantity}
                                        </span>
                                    )}
                                    {item.dueDate && !item.checked && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-100 text-red-600' : isDueToday ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <Calendar size={10} /> {item.dueDate}
                                        </span>
                                    )}
                                    {item.checked && item.purchasedBy && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                            <User size={8} /> Bought by {item.purchasedBy}
                                        </span>
                                    )}
                                </div>

                                {/* Pricing Section */}
                                <div className="flex items-stretch rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 text-xs">
                                    <div className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center border-r border-slate-100 dark:border-slate-700">
                                        <span className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Est. Price</span>
                                        <span className={`font-bold ${item.price ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300'}`}>
                                            {item.price ? formatCurrency(item.price, list.currencySymbol) : '--'}
                                        </span>
                                    </div>
                                    <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 flex flex-col justify-center relative group/input">
                                        <span className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Actual</span>
                                        <div className="flex items-center">
                                             <span className={`text-xs font-bold mr-0.5 ${item.actualPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300'}`}>
                                                {list.currencySymbol}
                                            </span>
                                            <input
                                                type="number"
                                                className={`w-full bg-transparent font-bold outline-none p-0 text-xs ${item.actualPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                                placeholder="0.00"
                                                value={item.actualPrice || ''}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {item.notes && (
                                    <div className="mt-2 text-xs text-slate-500 italic pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                        "{item.notes}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )})}

                {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                        <p>{search ? 'No items match search' : 'Add items to buy'}</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-24 right-6 z-30">
                <button 
                    onClick={() => { setEditingItem(null); setIsAddItemOpen(true); }}
                    className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/40 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus size={28} />
                </button>
            </div>

            <AddItemModal 
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
                onConfirm={editingItem ? handleEditItem : handleAddItem}
                onDelete={editingItem ? () => handleDeleteItem(editingItem.id) : undefined}
                initialData={editingItem}
                currencySymbol={list.currencySymbol}
            />
        </div>
    );
};

// ... AddItemModal, NotificationSettingsModal, CreateListModal, EditListModal, AddShopModal, ShareListModal components ...
const AddItemModal = ({ isOpen, onClose, onConfirm, onDelete, initialData, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [price, setPrice] = useState(''); // Estimated
    const [actualPrice, setActualPrice] = useState(''); // Actual
    const [dueDate, setDueDate] = useState(''); // Reminder date

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setQuantity(initialData?.quantity || '');
            setNotes(initialData?.notes || '');
            setPrice(initialData?.price ? initialData.price.toString() : '');
            setActualPrice(initialData?.actualPrice ? initialData.actualPrice.toString() : '');
            setDueDate(initialData?.dueDate || '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{initialData ? 'Edit Item' : 'Add Item'}</h3>
                
                <div className="space-y-4">
                    {/* Row 1: Name */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">Item Name (e.g. Milk)</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-900 dark:text-white focus:border-emerald-500 transition-colors" placeholder="e.g. Milk" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    
                    {/* Row 2: Qty & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">Qty (e.g. 2L)</label>
                            <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-900 dark:text-white focus:border-emerald-500 transition-colors" placeholder="e.g. 2L" value={quantity} onChange={e => setQuantity(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">Est. Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">{currencySymbol}</span>
                                <input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-900 dark:text-white focus:border-emerald-500 transition-colors" placeholder="0.00" type="number" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Due Date & Actual Price (if editing) */}
                    <div className={`grid ${initialData ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                        <div>
                             <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">Due Date (Optional)</label>
                             <div className="relative">
                                 <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                                 <input className="w-full p-3 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-600 dark:text-slate-300 focus:border-emerald-500 transition-colors" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                             </div>
                        </div>
                        {initialData && (
                            <div>
                                <label className="text-[10px] font-bold text-emerald-500 uppercase mb-1.5 block ml-1">Actual Price Paid</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-emerald-500 text-xs font-bold">{currencySymbol}</span>
                                    <input className="w-full p-3 pl-8 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl outline-none text-sm font-bold text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 transition-colors" placeholder="0.00" type="number" value={actualPrice} onChange={e => setActualPrice(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Row 4: Notes */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">Notes (Optional)</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium text-slate-900 dark:text-white focus:border-emerald-500 transition-colors" placeholder="Brand, details, etc." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    
                    <div className="flex gap-2 mt-2 pt-2">
                        {initialData && (
                            <button onClick={onDelete} className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl hover:bg-red-200 transition-colors"><Trash2 size={20} /></button>
                        )}
                        <button 
                            onClick={() => onConfirm({ 
                                name, 
                                quantity, 
                                notes, 
                                price: parseFloat(price) || 0, 
                                actualPrice: parseFloat(actualPrice) || 0,
                                dueDate
                            })} 
                            disabled={!name} 
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            {initialData ? 'Save Changes' : 'Add to List'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationSettingsModal = ({ isOpen, onClose, settings, onUpdate }: any) => {
    if (!isOpen) return null;
    const toggle = (key: string) => onUpdate({ ...settings, [key]: !settings[key] });
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><Calendar size={18}/></div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">Personal Reminders</div></div>
                        <button onClick={() => toggle('personal')} className={`w-10 h-6 rounded-full relative transition-colors ${settings.personal ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.personal ? 'left-5' : 'left-1'}`}></div></button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Users size={18}/></div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">Shared Updates</div></div>
                        <button onClick={() => toggle('shared')} className={`w-10 h-6 rounded-full relative transition-colors ${settings.shared ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.shared ? 'left-5' : 'left-1'}`}></div></button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-3"><div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg"><Zap size={18}/></div><div className="text-sm font-bold text-slate-700 dark:text-slate-200">Smart Suggestions</div></div>
                        <button onClick={() => toggle('smart')} className={`w-10 h-6 rounded-full relative transition-colors ${settings.smart ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.smart ? 'left-5' : 'left-1'}`}></div></button>
                    </div>
                </div>
                <button onClick={onClose} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl mt-6">Done</button>
            </div>
        </div>
    );
};

const CreateListModal = ({ isOpen, onClose, onConfirm }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [budget, setBudget] = useState('');
    if (!isOpen) return null;
    const handleSubmit = () => {
        const members: ShopMember[] = [{ id: 'me', name: 'You', role: 'owner', avatarColor: 'bg-indigo-500' }];
        if (email) members.push({ id: generateId(), name: email.split('@')[0], email, role: 'editor', avatarColor: 'bg-pink-500' });
        onConfirm({ name, members, budget: parseFloat(budget) || 0 });
        setName(''); setEmail(''); setBudget('');
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Shopping List</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="List Name" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    <div className="relative"><span className="absolute left-3 top-3 text-slate-500 font-bold">$</span><input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Budget Limit (Optional)" type="number" value={budget} onChange={e => setBudget(e.target.value)} /></div>
                    <div className="pt-2"><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Share with (Optional)</label><input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <button onClick={handleSubmit} disabled={!name} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2 disabled:opacity-50">Create List</button>
                </div>
            </div>
        </div>
    );
};

const EditListModal = ({ isOpen, onClose, onConfirm, initialData }: any) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setBudget(initialData.budget ? initialData.budget.toString() : '');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit List</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="List Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative"><span className="absolute left-3 top-3 text-slate-500 font-bold">$</span><input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Budget Limit" type="number" value={budget} onChange={e => setBudget(e.target.value)} /></div>
                    <button onClick={() => onConfirm(name, parseFloat(budget) || 0)} disabled={!name} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2 disabled:opacity-50">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const AddShopModal = ({ isOpen, onClose, onConfirm, initialData, currencySymbol, categories, isListLinked, fixedCategory }: any) => {
    const [name, setName] = useState('');
    const [budget, setBudget] = useState('');
    const [budgetCategory, setBudgetCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setBudget(initialData.budget ? initialData.budget.toString() : '');
                setBudgetCategory(initialData.budgetCategory || '');
            } else {
                setName('');
                setBudget('');
                setBudgetCategory(fixedCategory || '');
            }
        }
    }, [isOpen, initialData, fixedCategory]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (initialData) {
            onConfirm({ name, budget: parseFloat(budget) || 0, budgetCategory });
        } else {
            onConfirm({
                id: generateId(),
                name,
                budget: parseFloat(budget) || 0,
                items: [],
                budgetCategory
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{initialData ? 'Edit Shop' : 'Add Shop'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Shop Name (e.g. Target)" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500 font-bold">{currencySymbol}</span>
                        <input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" placeholder="Shop Budget (Optional)" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Link to Budget Category</label>
                        <select 
                            className={`w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-700 dark:text-slate-300 ${isListLinked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            value={budgetCategory}
                            onChange={(e) => setBudgetCategory(e.target.value)}
                            disabled={isListLinked}
                        >
                            <option value="">Select Category (Optional)</option>
                            {categories && categories.map((cat: string) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {isListLinked ? (
                            <p className="text-[10px] text-amber-500 mt-1 ml-1 flex items-center gap-1">
                                <Lock size={10} /> List linked to external budget (Event/Group/Category)
                            </p>
                        ) : (
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">Purchases will automatically update this budget category.</p>
                        )}
                    </div>

                    <button onClick={handleSubmit} disabled={!name} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2 disabled:opacity-50">{initialData ? 'Update' : 'Add Shop'}</button>
                </div>
            </div>
        </div>
    );
};

const ShareListModal = ({ isOpen, onClose, onConfirm, members, onRemoveMember, onUpdateRole }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: (email: string) => void, 
    members: ShopMember[],
    onRemoveMember: (id: string) => void,
    onUpdateRole: (id: string, role: 'editor' | 'viewer') => void
}) => {
    const [email, setEmail] = useState('');
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share List</h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Current Members</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {members.map((m: any) => (
                                <div key={m.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group">
                                    <div className={`w-8 h-8 rounded-full ${m.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>{m.name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{m.email || 'Owner'}</div>
                                    </div>
                                    
                                    {/* Role Management */}
                                    {m.role === 'owner' ? (
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">Owner</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={m.role}
                                                onChange={(e) => onUpdateRole(m.id, e.target.value as 'editor' | 'viewer')}
                                                className="bg-transparent text-[10px] font-bold text-slate-500 uppercase outline-none cursor-pointer hover:text-indigo-500 transition-colors"
                                            >
                                                <option value="editor">Editor</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                            
                                            <button 
                                                onClick={() => onRemoveMember(m.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                title="Remove Member"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Invite Person</label>
                        <div className="flex gap-2">
                            <input className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
                            <button onClick={() => { if(email) onConfirm(email); setEmail(''); }} disabled={!email} className="px-4 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">Invite</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
