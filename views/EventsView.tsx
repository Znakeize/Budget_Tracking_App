
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { EventData, EventMember } from '../types';
import { formatCurrency, NotificationItem } from '../utils/calculations';
import { 
  Calendar, MapPin, Plus, ChevronLeft, PieChart, Users, 
  ShoppingBag, Trash2, AlertCircle, Pencil, Wallet, Bell, BellRing, Sparkles
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';
import { EventDashboardTab } from '../components/events/EventDashboardTab';
import { EventBudgetTab } from '../components/events/EventBudgetTab';
import { EventVendorsTab } from '../components/events/EventVendorsTab';
import { EventTeamTab } from '../components/events/EventTeamTab';
import { EventAITab } from '../components/events/EventAITab';
import { CreateEventModal, EditEventModal } from '../components/events/EventModals';

interface EventsViewProps {
  events: EventData[];
  onUpdateEvents: (events: EventData[]) => void;
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
  focusEventId?: string;
  focusTab?: string;
  onCreateShoppingList?: (name: string, budget: number, members: EventMember[], linkedData?: {eventId: string, expenseId: string, expenseName: string}) => void;
}

export const getEventNotifications = (events: EventData[], currencySymbol: string): NotificationItem[] => {
  const notifs: NotificationItem[] = [];
  const today = new Date().toISOString().split('T')[0];

  events.forEach(event => {
    // 1. Date approaching
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysLeft = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 14 && daysLeft >= 0) {
      notifs.push({
        id: `Event-${event.id}-date`,
        category: 'Event',
        message: `${event.name} is coming up in ${daysLeft} days!`,
        type: 'info',
        date: today
      });
    }

    // 2. Budget Overrun
    const totalSpent = event.expenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalSpent > event.totalBudget && event.totalBudget > 0) {
      notifs.push({
         id: `Event-${event.id}-budget-over`,
         category: 'Event',
         message: `${event.name}: Budget exceeded by ${formatCurrency(totalSpent - event.totalBudget, currencySymbol)}`,
         type: 'danger',
         date: today
      });
    } else if (totalSpent > event.totalBudget * 0.9 && event.totalBudget > 0) {
        notifs.push({
            id: `Event-${event.id}-budget-warn`,
            category: 'Event',
            message: `${event.name}: 90% of budget used.`,
            type: 'warning',
            date: today
         });
    }

    // 3. Vendor Payments
    event.vendors.forEach(vendor => {
        if (vendor.status !== 'paid' && vendor.dueDate) {
             if (vendor.dueDate < today) {
                  notifs.push({
                    id: `Event-${event.id}-vendor-overdue-${vendor.id}`,
                    category: 'Event',
                    message: `${event.name}: Payment to ${vendor.name} is overdue`,
                    type: 'danger',
                    date: vendor.dueDate
                  });
             } else if (vendor.dueDate === today) {
                  notifs.push({
                    id: `Event-${event.id}-vendor-due-${vendor.id}`,
                    category: 'Event',
                    message: `${event.name}: Payment to ${vendor.name} is due today`,
                    type: 'warning',
                    date: vendor.dueDate
                  });
             } else {
                 const due = new Date(vendor.dueDate);
                 const diffTime = due.getTime() - now.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if (diffDays <= 7 && diffDays > 0) {
                     notifs.push({
                        id: `Event-${event.id}-vendor-soon-${vendor.id}`,
                        category: 'Event',
                        message: `${event.name}: Payment to ${vendor.name} due in ${diffDays} days`,
                        type: 'info',
                        date: vendor.dueDate
                      });
                 }
             }
        }
    });
  });

  return notifs;
};

export const EventsView: React.FC<EventsViewProps> = ({ 
    events, 
    onUpdateEvents, 
    currencySymbol, 
    onBack, 
    onProfileClick,
    focusEventId,
    focusTab,
    onCreateShoppingList
}) => {
  const [activeEventParams, setActiveEventParams] = useState<{id: string, initialTab?: string, focusItemId?: string} | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const eventNotifications = useMemo(() => {
      const all = getEventNotifications(events, currencySymbol);
      return all.filter(n => !dismissedIds.includes(n.id));
  }, [events, currencySymbol, dismissedIds]);

  // Handle Deep Linking via props
  useEffect(() => {
      if (focusEventId) {
          setActiveEventParams({ 
              id: focusEventId, 
              initialTab: focusTab || 'dashboard' 
          });
      }
  }, [focusEventId, focusTab]);

  // Active Event State
  const activeEvent = useMemo(() => events.find(e => e.id === activeEventParams?.id), [events, activeEventParams]);
  
  const handleCreateEvent = (newEvent: EventData) => {
    onUpdateEvents([...events, newEvent]);
    setIsCreateModalOpen(false);
    setActiveEventParams({ id: newEvent.id });
  };

  const handleUpdateActiveEvent = (updated: EventData) => {
    onUpdateEvents(events.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEvent = (id: string) => {
    if(confirm('Delete this event?')) {
        onUpdateEvents(events.filter(e => e.id !== id));
        setActiveEventParams(null);
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
      const parts = notif.id.split('-');
      // Expected ID format: Event-{eventId}-...
      if (parts.length > 1 && parts[0] === 'Event') {
          const eventId = parts[1];
          setActiveEventParams({ id: eventId });
      }
      setShowNotifications(false);
  };

  const handleDismiss = (id: string) => {
      setDismissedIds(prev => [...prev, id]);
  };

  if (activeEvent) {
    return (
      <EventDetailView 
        event={activeEvent} 
        onUpdate={handleUpdateActiveEvent} 
        onBack={() => setActiveEventParams(null)} 
        currencySymbol={activeEvent.currencySymbol || currencySymbol}
        initialTab={activeEventParams?.initialTab}
        focusItemId={activeEventParams?.focusItemId}
        onProfileClick={onProfileClick}
        onCreateShoppingList={onCreateShoppingList}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Planning</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Events</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 pb-1">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {eventNotifications.length > 0 ? (
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
       </div>

       {/* Local Notification Popup */}
       {showNotifications && (
           <NotificationPopup 
               notifications={eventNotifications} 
               onClose={() => setShowNotifications(false)} 
               onNotificationClick={handleNotificationClick} 
               onDismiss={handleDismiss}
           />
       )}

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {/* Create Event Button */}
           <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-4 mb-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:scale-[0.99]"
           >
               <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                   <Plus size={24} />
               </div>
               Plan New Event
           </button>

           {/* Event List */}
           <div className="space-y-4">
               {events.map(evt => {
                   const totalSpent = evt.expenses.reduce((s, e) => s + e.amount, 0);
                   const progress = evt.totalBudget > 0 ? (totalSpent / evt.totalBudget) * 100 : 0;
                   const daysLeft = Math.ceil((new Date(evt.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                   
                   // Check notifications for this specific event
                   const hasNotifs = eventNotifications.some(n => n.id.startsWith(`Event-${evt.id}`));

                   return (
                       <Card key={evt.id} className="p-0 overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow relative" onClick={() => setActiveEventParams({ id: evt.id })}>
                           <div className={`h-2 w-full ${evt.theme === 'dark' ? 'bg-slate-800' : evt.theme === 'colorful' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-indigo-500'}`}></div>
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-3">
                                   <div className="flex-1 min-w-0 pr-8">
                                       <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{evt.name}</h3>
                                       <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                           <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(evt.date).toLocaleDateString()}</span>
                                           <span className="flex items-center gap-1 truncate"><MapPin size={12}/> {evt.location}</span>
                                       </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-2">
                                       {/* Alert Icon if notifications exist */}
                                       {hasNotifs && (
                                           <div className="relative">
                                               <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-pulse"></div>
                                               <AlertCircle size={18} className="text-red-500 relative z-10" fill="currentColor" strokeWidth={1.5} color="white" />
                                           </div>
                                       )}
                                       <div className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${daysLeft > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                           {daysLeft > 0 ? `${daysLeft} days` : 'Past'}
                                       </div>
                                   </div>
                               </div>
                               
                               <div className="mt-4">
                                   <div className="flex justify-between text-xs font-bold mb-1.5">
                                       <span className="text-slate-500">Budget Used</span>
                                       <span className="text-slate-900 dark:text-white">{formatCurrency(totalSpent, evt.currencySymbol)} <span className="text-slate-400 font-normal">/ {formatCurrency(evt.totalBudget, evt.currencySymbol)}</span></span>
                                   </div>
                                   <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                       <div 
                                            className={`h-full rounded-full transition-all duration-500 ${progress > 100 ? 'bg-red-500' : progress > 85 ? 'bg-orange-500' : 'bg-indigo-500'}`} 
                                            style={{width: `${Math.min(progress, 100)}%`}}
                                       ></div>
                                   </div>
                               </div>

                               <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                   <div className="flex -space-x-2">
                                       {evt.members.slice(0, 3).map((m, i) => (
                                           <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                                               {m.name.charAt(0)}
                                           </div>
                                       ))}
                                       {evt.members.length > 3 && (
                                           <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                               +{evt.members.length - 3}
                                           </div>
                                       )}
                                   </div>
                                   <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               </div>
                           </div>
                       </Card>
                   );
               })}
               {events.length === 0 && (
                   <div className="text-center py-10 text-slate-400 text-xs">
                       <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                       <p>No events found. Start planning today!</p>
                   </div>
               )}
           </div>
       </div>

       <CreateEventModal 
         isOpen={isCreateModalOpen} 
         onClose={() => setIsCreateModalOpen(false)} 
         onConfirm={handleCreateEvent}
         currencySymbol={currencySymbol}
       />
    </div>
  );
};

const EventDetailView: React.FC<{ 
    event: EventData, 
    onUpdate: (e: EventData) => void, 
    onBack: () => void, 
    currencySymbol: string, 
    initialTab?: string, 
    focusItemId?: string,
    onProfileClick: () => void,
    onCreateShoppingList?: (name: string, budget: number, members: EventMember[], linkedData?: {eventId: string, expenseId: string, expenseName: string}) => void
}> = ({ event, onUpdate, onBack, currencySymbol, initialTab, focusItemId, onProfileClick, onCreateShoppingList }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'vendors' | 'team' | 'ai'>((initialTab as any) || 'dashboard');
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const eventNotifications = useMemo(() => {
      const all = getEventNotifications([event], currencySymbol);
      return all.filter(n => !dismissedIds.includes(n.id));
  }, [event, currencySymbol, dismissedIds]);

  useEffect(() => {
      if (initialTab && initialTab !== 'settlement') { 
          setActiveTab(initialTab as any);
      } else if (initialTab === 'settlement') {
          setActiveTab('team');
      }
  }, [initialTab]);

  const handleDismiss = (id: string) => {
      setDismissedIds(prev => [...prev, id]);
  };

  const totalSpent = event.expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = event.totalBudget - totalSpent;
  
  return (
    <div className="flex flex-col h-full relative">
       {/* Detailed Header */}
       <div className={`flex-none pt-6 px-4 pb-0 bg-white dark:bg-slate-900 z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300 shadow-sm`}>
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">{event.name}</h1>
                            <button 
                                onClick={() => setIsEditEventOpen(true)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Pencil size={12} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{event.type}</span>
                            <span>•</span>
                            <span className="truncate">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 pb-1">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {eventNotifications.length > 0 ? (
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

            {/* Scrollable Tabs */}
            <div className="w-full overflow-x-auto hide-scrollbar pb-0 -mx-4 px-4">
                <div className="flex gap-3 min-w-max pb-3">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: PieChart },
                        { id: 'budget', label: 'Budget', icon: Wallet },
                        { id: 'vendors', label: 'Vendors', icon: ShoppingBag },
                        { id: 'team', label: 'Team', icon: Users },
                        { id: 'ai', label: 'AI Planner', icon: Sparkles }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>
       </div>

       {showNotifications && (
           <NotificationPopup 
               notifications={eventNotifications} 
               onClose={() => setShowNotifications(false)} 
               onNotificationClick={() => setShowNotifications(false)} 
               onDismiss={handleDismiss}
           />
       )}

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'dashboard' && <EventDashboardTab event={event} totalSpent={totalSpent} remaining={remaining} currencySymbol={currencySymbol} />}
           {activeTab === 'budget' && <EventBudgetTab event={event} onUpdate={onUpdate} currencySymbol={currencySymbol} focusItemId={focusItemId} onCreateShoppingList={onCreateShoppingList} />}
           {activeTab === 'vendors' && <EventVendorsTab event={event} onUpdate={onUpdate} currencySymbol={currencySymbol} focusItemId={focusItemId} />}
           {activeTab === 'team' && <EventTeamTab event={event} onUpdate={onUpdate} currencySymbol={currencySymbol} />}
           {activeTab === 'ai' && <EventAITab event={event} />}
       </div>

       <EditEventModal 
          isOpen={isEditEventOpen}
          onClose={() => setIsEditEventOpen(false)}
          onConfirm={(updatedFields: any) => {
              onUpdate({ ...event, ...updatedFields });
              setIsEditEventOpen(false);
          }}
          initialData={event}
          currencySymbol={currencySymbol}
       />
    </div>
  );
};
