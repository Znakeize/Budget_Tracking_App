
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { EventData, EventCategory, EventExpense, EventVendor, EventMember } from '../types';
import { formatCurrency, generateId, NotificationItem } from '../utils/calculations';
import { analyzeEventWithAI } from '../utils/aiHelper';
import { 
  Calendar, MapPin, Plus, ChevronLeft, Wallet, PieChart, Users, 
  ShoppingBag, CheckCircle, Clock, FileText, Send, Sparkles, 
  Trash2, TrendingUp, AlertCircle, Camera, Download, Share2,
  Pencil, Edit2, X, Briefcase, Layers, Receipt,
  ArrowRight, DollarSign, CalendarHeart, Bell, BellRing, ChevronDown, Check,
  Shield, Mail, User, UserPlus
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { NotificationPopup } from '../components/ui/NotificationPopup';

interface EventsViewProps {
  events: EventData[];
  onUpdateEvents: (events: EventData[]) => void;
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
  focusEventId?: string;
  focusTab?: string;
  onCreateShoppingList?: (name: string, budget: number, members: EventMember[]) => void;
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
                       <Briefcase size={32} className="mx-auto mb-2 opacity-50" />
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
    onCreateShoppingList?: (name: string, budget: number, members: EventMember[]) => void
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
      if (initialTab) {
          setActiveTab(initialTab as any);
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

const EventDashboardTab = ({ event, totalSpent, remaining, currencySymbol }: any) => {
    const categoryTotals = event.categories.map((c: any) => ({
        name: c.name,
        value: event.expenses.filter((e: any) => e.category === c.name).reduce((sum: number, e: any) => sum + e.amount, 0),
        color: c.color
    })).filter((c: any) => c.value > 0);

    const chartData = {
        labels: categoryTotals.map((c: any) => c.name),
        datasets: [{
            data: categoryTotals.map((c: any) => c.value),
            backgroundColor: categoryTotals.map((c: any) => c.color),
            borderWidth: 0
        }]
    };

    // Vendor stats for dashboard
    const vendorStats = event.vendors.reduce((acc: any, v: any) => ({
        total: acc.total + v.totalAmount,
        paid: acc.paid + v.paidAmount
    }), { total: 0, paid: 0 });
    const vendorProgress = vendorStats.total > 0 ? (vendorStats.paid / vendorStats.total) * 100 : 0;

    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Event Report: ${event.name}`, 20, 20);
        doc.setFontSize(12);
        doc.text(`Total Budget: ${currencySymbol}${event.totalBudget}`, 20, 40);
        doc.text(`Total Spent: ${currencySymbol}${totalSpent}`, 20, 50);
        doc.save(`${event.name}_report.pdf`);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                    <div className="text-xs font-bold opacity-80 uppercase mb-1">Remaining</div>
                    <div className="text-2xl font-bold truncate">{formatCurrency(remaining, currencySymbol)}</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white truncate">{formatCurrency(totalSpent, currencySymbol)}</div>
                </Card>
            </div>

            {/* Vendor Overview Card */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Vendor Payments</h3>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(vendorStats.paid, currencySymbol)} <span className="text-slate-400 font-normal">/ {formatCurrency(vendorStats.total, currencySymbol)}</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(vendorProgress, 100)}%` }}
                    ></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pending</span>
                        <div className="text-sm font-bold text-orange-500">{formatCurrency(vendorStats.total - vendorStats.paid, currencySymbol)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Paid</span>
                        <div className="text-sm font-bold text-emerald-500">{Math.round(vendorProgress)}%</div>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Category Breakdown</h3>
                <div className="h-40 relative flex items-center justify-center">
                    {categoryTotals.length > 0 ? (
                        <Doughnut data={chartData} options={{plugins: {legend: {display: false}}, cutout: '70%', maintainAspectRatio: false}} />
                    ) : (
                        <div className="text-center text-slate-400 text-xs py-8">No expenses recorded yet</div>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {categoryTotals.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{c.name}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleExport} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Download size={16} /> Export Report
                 </button>
                 <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Share2 size={16} /> Share Event
                 </button>
            </div>
        </div>
    );
};

const EventBudgetTab = ({ event, onUpdate, currencySymbol, focusItemId, onCreateShoppingList }: any) => {
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
    const [editingExpense, setEditingExpense] = useState<EventExpense | null>(null);

    useEffect(() => {
        if (focusItemId) {
            setTimeout(() => {
                const el = document.getElementById(focusItemId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/40', 'transition-all', 'duration-500');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/40');
                    }, 2500);
                }
            }, 300);
        }
    }, [focusItemId]);

    const handleAddExpense = (exp: any) => {
        const newExpense: EventExpense = {
            id: generateId(),
            ...exp,
            date: new Date().toISOString()
        };
        const updatedEvent = {
            ...event,
            expenses: [...event.expenses, newExpense]
        };
        onUpdate(updatedEvent);
        setIsAddExpenseOpen(false);
    };

    const handleAddCategory = (catData: { name: string, allocated: number }) => {
        const newCategory: EventCategory = {
            id: generateId(),
            name: catData.name,
            allocated: catData.allocated,
            color: ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'][Math.floor(Math.random() * 6)]
        };
        onUpdate({ ...event, categories: [...event.categories, newCategory] });
        setIsAddCategoryOpen(false);
    };

    const handleUpdateCategory = (updatedCat: EventCategory) => {
        const updatedCategories = event.categories.map((c: any) => c.id === updatedCat.id ? updatedCat : c);
        onUpdate({ ...event, categories: updatedCategories });
        setEditingCategory(null);
    };

    const handleUpdateExpense = (updatedExp: EventExpense) => {
        const updatedExpenses = event.expenses.map((e: any) => e.id === updatedExp.id ? updatedExp : e);
        onUpdate({ ...event, expenses: updatedExpenses });
        setEditingExpense(null);
    };

    const handleDeleteExpense = (id: string) => {
        if(confirm('Delete this expense?')) {
            const updatedExpenses = event.expenses.filter((e: any) => e.id !== id);
            onUpdate({ ...event, expenses: updatedExpenses });
            setEditingExpense(null); 
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <div className="flex gap-3">
                <button 
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
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
            
            <div className="space-y-4">
                {event.categories.map((cat: EventCategory) => {
                    const spent = event.expenses.filter((e: any) => e.category === cat.name).reduce((s: number, e: any) => s + e.amount, 0);
                    const percent = cat.allocated > 0 ? (spent / cat.allocated) * 100 : 0;
                    
                    return (
                        <Card key={cat.id} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{cat.name}</h4>
                                    <button onClick={() => setEditingCategory(cat)} className="text-slate-300 hover:text-indigo-500 transition-colors p-1">
                                        <Pencil size={12} />
                                    </button>
                                </div>
                                <div className="text-xs font-bold text-right">
                                    <div>{formatCurrency(spent, currencySymbol)}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">/ {formatCurrency(cat.allocated, currencySymbol)}</div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                    style={{width: `${Math.min(percent, 100)}%`}}
                                ></div>
                            </div>
                            
                            <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                {event.expenses.filter((e: any) => e.category === cat.name).map((e: any) => (
                                    <div key={e.id} id={e.id} className="flex justify-between items-center text-xs group py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{e.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(e.amount, currencySymbol)}</span>
                                            <button onClick={() => setEditingExpense(e)} className="text-slate-300 hover:text-indigo-500 transition-colors p-1 opacity-100 sm:opacity-0 group-hover:opacity-100">
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {event.expenses.filter((e: any) => e.category === cat.name).length === 0 && (
                                    <span className="text-[10px] text-slate-400 italic">No expenses yet</span>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <AddEventExpenseModal 
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                onConfirm={handleAddExpense}
                categories={event.categories}
                currencySymbol={currencySymbol}
                event={event}
                onCreateShoppingList={onCreateShoppingList}
            />

            <AddCategoryModal 
                isOpen={isAddCategoryOpen}
                onClose={() => setIsAddCategoryOpen(false)}
                onConfirm={handleAddCategory}
                currencySymbol={currencySymbol}
            />

            <EditCategoryModal 
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                onConfirm={handleUpdateCategory}
                category={editingCategory}
                currencySymbol={currencySymbol}
            />

            <EditExpenseModal 
                isOpen={!!editingExpense}
                onClose={() => setEditingExpense(null)}
                onConfirm={handleUpdateExpense}
                onDelete={handleDeleteExpense}
                expense={editingExpense}
                categories={event.categories}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

const EventVendorsTab = ({ event, onUpdate, currencySymbol, focusItemId }: any) => {
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<EventVendor | null>(null);
    const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (focusItemId) {
            setTimeout(() => {
                const el = document.getElementById(focusItemId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [focusItemId]);

    // Intelligent mapping helper
    const getMatchingCategory = (serviceName: string) => {
        if (!event.categories || event.categories.length === 0) return 'General';
        
        // 1. Exact match
        const exact = event.categories.find((c: EventCategory) => c.name.toLowerCase() === serviceName.toLowerCase());
        if (exact) return exact.name;

        // 2. Partial match (e.g. "Venue" service -> "Venue & Food" category)
        const partial = event.categories.find((c: EventCategory) => c.name.toLowerCase().includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(c.name.toLowerCase()));
        if (partial) return partial.name;

        // 3. Fallback
        return event.categories[0].name;
    };

    const handleAddVendor = (vendor: any) => {
        const adv = vendor.advance || 0;
        const vendorId = generateId();
        const paymentId = generateId();
        const newVendor: EventVendor = {
            id: vendorId, ...vendor, paidAmount: adv, 
            status: adv > 0 ? (adv >= vendor.totalAmount ? 'paid' : 'partial') : 'pending',
            paymentHistory: adv > 0 ? [{ id: paymentId, date: new Date().toISOString().split('T')[0], name: "Advance Payment", amount: adv, paidBy: 'me' }] : []
        };
        
        let newExpenses = [...event.expenses];
        if (adv > 0) {
            // Use matched category to ensure it shows in Budget Tab
            const cat = getMatchingCategory(vendor.service);
            newExpenses.push({ id: paymentId, name: vendor.name, amount: adv, category: cat, date: new Date().toISOString(), vendorId: vendorId, paidBy: 'me' });
        }
        
        onUpdate({ ...event, vendors: [...event.vendors, newVendor], expenses: newExpenses });
        setIsAddVendorOpen(false);
    };

    const handleUpdateVendor = (updatedVendor: EventVendor) => {
        onUpdate({ ...event, vendors: event.vendors.map((v: any) => v.id === updatedVendor.id ? { ...updatedVendor, status: updatedVendor.paidAmount >= updatedVendor.totalAmount ? 'paid' : updatedVendor.paidAmount > 0 ? 'partial' : 'pending' } : v) });
        setEditingVendor(null);
    };

    const handleDeleteVendor = (id: string) => {
        if(confirm('Delete vendor?')) onUpdate({ ...event, vendors: event.vendors.filter((v: any) => v.id !== id), expenses: event.expenses.filter((e: any) => e.vendorId !== id) });
        setEditingVendor(null);
    };

    const handleUpdatePayment = (id: string, amount: number) => {
        const paymentId = generateId();
        let newExpense: EventExpense | null = null;
        const updatedVendors = event.vendors.map((v: EventVendor) => {
            if (v.id === id) {
                const newPaid = v.paidAmount + amount;
                return { 
                    ...v, 
                    paidAmount: newPaid, 
                    status: newPaid >= v.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'pending', 
                    paymentHistory: [
                        ...(v.paymentHistory || []), 
                        { 
                            id: paymentId, 
                            date: new Date().toISOString().split('T')[0], 
                            name: "Payment", 
                            amount, 
                            paidBy: 'me' 
                        }
                    ] 
                };
            }
            return v;
        });
        
        // Update Expenses Logic
        let updatedExpenses = [...event.expenses];
        const existingExpenseIndex = updatedExpenses.findIndex((e: EventExpense) => e.vendorId === id);

        if (existingExpenseIndex >= 0) {
            // Update existing expense
            updatedExpenses[existingExpenseIndex] = {
                ...updatedExpenses[existingExpenseIndex],
                amount: updatedExpenses[existingExpenseIndex].amount + amount
            };
        } else {
            // Create new aggregate expense
            // Need to find the vendor to get details
            const vendor = event.vendors.find((v: EventVendor) => v.id === id);
            if (vendor) {
                const matchedCategory = getMatchingCategory(vendor.service);
                const newExpense: EventExpense = {
                    id: paymentId, // Use payment ID for the creation
                    name: vendor.name,
                    amount: amount,
                    category: matchedCategory,
                    date: new Date().toISOString(),
                    vendorId: id,
                    paidBy: 'me'
                };
                updatedExpenses.push(newExpense);
            }
        }
        
        onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
    };

    const handleDeletePayment = (vendorId: string, paymentId: string) => {
        if (!confirm('Delete this payment record? This will also remove the entry from your budget.')) return;
        
        let amountRemoved = 0;

        const updatedVendors = event.vendors.map((v: any) => {
            if (v.id === vendorId) {
                const paymentToRemove = v.paymentHistory?.find((p: any) => p.id === paymentId);
                if (!paymentToRemove) return v;
                
                amountRemoved = paymentToRemove.amount; // Capture amount
                const newPaid = Math.max(0, v.paidAmount - amountRemoved);
                const newHistory = v.paymentHistory.filter((p: any) => p.id !== paymentId);
                
                return {
                    ...v,
                    paidAmount: newPaid,
                    status: newPaid >= v.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'pending',
                    paymentHistory: newHistory
                };
            }
            return v;
        });
        
        let updatedExpenses = [...event.expenses];
        const expenseIndex = updatedExpenses.findIndex((e: any) => e.vendorId === vendorId);
        
        if (expenseIndex >= 0 && amountRemoved > 0) {
            const currentAmount = updatedExpenses[expenseIndex].amount;
            if (currentAmount <= amountRemoved) {
                // Remove if 0 or less
                updatedExpenses.splice(expenseIndex, 1);
            } else {
                // Decrement
                updatedExpenses[expenseIndex] = {
                    ...updatedExpenses[expenseIndex],
                    amount: currentAmount - amountRemoved
                };
            }
        }
        
        onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
             <button onClick={() => setIsAddVendorOpen(true)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus size={18} /> Add Vendor</button>
            <div className="space-y-4">
                {event.vendors.map((vendor: EventVendor) => {
                    const percent = vendor.totalAmount > 0 ? (vendor.paidAmount / vendor.totalAmount) * 100 : 0;
                    return (
                    <div key={vendor.id} className="bg-[#1e293b] rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/50">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">{vendor.name}</h3>
                                <button onClick={() => setEditingVendor(vendor)} className="text-slate-500 hover:text-white transition-colors">
                                    <Pencil size={14} />
                                </button>
                            </div>
                            <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                vendor.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 
                                vendor.status === 'partial' ? 'bg-[#ffedd5] text-[#9a3412]' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {vendor.status}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">{vendor.service}</p>

                        {/* Financials */}
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-sm text-slate-500">Total: {formatCurrency(vendor.totalAmount, currencySymbol)}</div>
                            <div className="text-base font-bold text-emerald-400">Paid: {formatCurrency(vendor.paidAmount, currencySymbol)}</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
                            <div 
                                className="h-full rounded-full transition-all duration-500 bg-[#10b981]"
                                style={{width: `${Math.min(percent, 100)}%`}}
                            ></div>
                        </div>

                        {/* Make Payment */}
                        {vendor.status !== 'paid' && (
                            <div className="mb-5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">MAKE A PAYMENT</p>
                                <div className="flex gap-3 mb-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white outline-none focus:border-indigo-500 placeholder:text-slate-600" 
                                            placeholder="Amount" 
                                            value={customAmounts[vendor.id] || ''} 
                                            onChange={(e) => setCustomAmounts({...customAmounts, [vendor.id]: e.target.value})} 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => { const amt = parseFloat(customAmounts[vendor.id]); if(amt > 0) { handleUpdatePayment(vendor.id, amt); setCustomAmounts({...customAmounts, [vendor.id]: ''}); } }} 
                                        disabled={!customAmounts[vendor.id]} 
                                        className="px-6 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20"
                                    >
                                        Pay
                                    </button>
                                </div>
                                
                                <div className="flex gap-2">
                                    {[
                                        { label: 'Full Balance', val: vendor.totalAmount - vendor.paidAmount },
                                        { label: '50%', val: (vendor.totalAmount - vendor.paidAmount) * 0.5 },
                                        { label: '25%', val: (vendor.totalAmount - vendor.paidAmount) * 0.25 }
                                    ].map((preset, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setCustomAmounts({...customAmounts, [vendor.id]: preset.val.toFixed(2)})}
                                            className="flex-1 py-2 bg-[#0f172a] hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 transition-colors"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment History */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={12} /> PAYMENT HISTORY
                            </p>
                            <div className="space-y-3">
                                {vendor.paymentHistory && vendor.paymentHistory.length > 0 ? vendor.paymentHistory.map(hist => {
                                    const isAdvance = hist.name.toLowerCase().includes('advance');
                                    // Payer lookup logic
                                    const payerName = hist.paidBy === 'me' ? 'You' : (event.members.find((m: any) => m.id === hist.paidBy)?.name || hist.paidBy);
                                    
                                    return (
                                        <div key={hist.id} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center text-slate-400">
                                                    {isAdvance ? <DollarSign size={14} /> : <CheckCircle size={14} className="text-emerald-500"/>}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-bold text-slate-200">{hist.name}</span>
                                                        {isAdvance && (
                                                            <span className="px-1.5 py-[2px] rounded bg-indigo-500/20 text-[8px] font-bold text-indigo-300 uppercase tracking-wide">ADVANCE</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500">{hist.date}</div>
                                                    {hist.paidBy && (
                                                        <div className="text-[9px] text-indigo-400/80 mt-0.5 font-medium">Paid by {payerName}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-[#6366f1]">{formatCurrency(hist.amount, currencySymbol)}</span>
                                                <button 
                                                    onClick={() => handleDeletePayment(vendor.id, hist.id)}
                                                    className="text-slate-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-[10px] text-slate-600 italic pl-1">No payments recorded</p>
                                )}
                            </div>
                        </div>

                        {/* Due Date Footer */}
                        {vendor.dueDate && vendor.status !== 'paid' && (
                            <div className="flex items-center gap-2 text-xs text-orange-500 font-bold mt-4 pt-4 border-t border-slate-700/50">
                                <AlertCircle size={14} /> Due: {vendor.dueDate}
                            </div>
                        )}
                    </div>
                )})}
            </div>
            <AddVendorModal isOpen={isAddVendorOpen} onClose={() => setIsAddVendorOpen(false)} onConfirm={handleAddVendor} currencySymbol={currencySymbol} categories={event.categories} />
            <EditVendorModal isOpen={!!editingVendor} onClose={() => setEditingVendor(null)} onConfirm={handleUpdateVendor} onDelete={handleDeleteVendor} vendor={editingVendor} currencySymbol={currencySymbol} categories={event.categories} />
        </div>
    );
};

// --- UPDATED EVENT TEAM TAB ---
const EventTeamTab = ({ event, onUpdate, currencySymbol }: { event: EventData, onUpdate: (e: EventData) => void, currencySymbol: string }) => {
    const [view, setView] = useState<'members' | 'settle'>('members');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSettleOpen, setIsSettleOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<EventMember | null>(null);

    // Calculate Financials per Member
    const memberStats = useMemo(() => {
        const totalExpense = event.expenses.reduce((s, e) => s + e.amount, 0);
        const perPerson = event.members.length > 0 ? totalExpense / event.members.length : 0;

        return event.members.map(m => {
            const paid = event.expenses
                .filter(e => e.paidBy === m.id || (m.id === 'me' && (!e.paidBy || e.paidBy === 'me')))
                .reduce((s, e) => s + e.amount, 0);
            
            return {
                ...m,
                paid,
                fairShare: perPerson,
                balance: paid - perPerson // Positive = Owed money, Negative = Owes money
            };
        });
    }, [event]);

    const handleInvite = (data: any) => {
        const newMember: EventMember = {
            id: generateId(),
            name: data.name,
            role: data.role,
            avatar: `bg-${['blue','green','yellow','purple','pink'][Math.floor(Math.random()*5)]}-500`
        };
        onUpdate({ ...event, members: [...event.members, newMember] });
        setIsInviteOpen(false);
    };

    const handleUpdateMember = (updated: EventMember) => {
        onUpdate({ ...event, members: event.members.map(m => m.id === updated.id ? updated : m) });
        setEditingMember(null);
    };

    const handleRemoveMember = (id: string) => {
        if(confirm('Remove this member?')) {
            onUpdate({ ...event, members: event.members.filter(m => m.id !== id) });
            setEditingMember(null);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                <button 
                    onClick={() => setView('members')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${view === 'members' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                >
                    Member List
                </button>
                <button 
                    onClick={() => setView('settle')} 
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${view === 'settle' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                >
                    Settlement Plan
                </button>
            </div>

            {view === 'members' ? (
                <>
                    <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold flex items-center gap-2 mb-1"><Users size={18} /> Team Overview</h3>
                                <p className="text-xs text-blue-100">{event.members.length} members involved</p>
                            </div>
                            <button 
                                onClick={() => setIsInviteOpen(true)} 
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/30"
                            >
                                <Plus size={14} /> Invite
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                            <div>
                                <p className="text-[10px] text-blue-200 uppercase font-bold">Total Spent</p>
                                <p className="text-xl font-bold">{formatCurrency(memberStats.reduce((s, m) => s + m.paid, 0), currencySymbol)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-blue-200 uppercase font-bold">Per Person</p>
                                <p className="text-xl font-bold">{formatCurrency(memberStats[0]?.fairShare || 0, currencySymbol)}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-3">
                        {memberStats.map((m) => (
                            <Card key={m.id} className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${m.avatar || 'bg-slate-500'} flex items-center justify-center font-bold text-white shadow-sm`}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                {m.name}
                                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wide border border-slate-200 dark:border-slate-700">{m.role}</span>
                                            </h4>
                                            <p className="text-[10px] text-slate-500">Paid: {formatCurrency(m.paid, currencySymbol)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingMember(m)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                                
                                {/* Balance Indicator */}
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Balance</div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${m.balance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                        {m.balance >= 0 ? 'Gets back ' : 'Owes '}{formatCurrency(Math.abs(m.balance), currencySymbol)}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                /* SETTLEMENT VIEW */
                <div className="space-y-4">
                    <Card className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Debt Settlement</h3>
                            <p className="text-xs text-slate-500">Efficient transfers to square up.</p>
                        </div>
                        <button 
                            onClick={() => setIsSettleOpen(true)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                        >
                            Generate Settlement Plan
                        </button>
                    </Card>
                </div>
            )}

            <EventInviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} onConfirm={handleInvite} />
            
            <EventSettlementModal 
                isOpen={isSettleOpen} 
                onClose={() => setIsSettleOpen(false)} 
                members={memberStats} 
                currencySymbol={currencySymbol} 
                onSettle={(transfers) => {
                    // In a real app, this would create expense records
                    alert("Settlement recorded!");
                    setIsSettleOpen(false);
                }}
            />

            <EditMemberModal 
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                member={editingMember}
                onConfirm={handleUpdateMember}
                onDelete={handleRemoveMember}
            />
        </div>
    );
};

// --- UPDATED Event Invite Modal ---
const EventInviteModal = ({ isOpen, onClose, onConfirm }: any) => {
    const [name, setName] = useState(''); 
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    
    useEffect(() => { if(isOpen) { setName(''); setEmail(''); setRole('viewer'); } }, [isOpen]);
    if(!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-indigo-500" /> Invite Member
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-sm focus:border-indigo-500 transition-colors" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email (Optional)</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-sm focus:border-indigo-500 transition-colors" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['admin', 'editor', 'viewer'].map(r => (
                                <button 
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${role === r ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => onConfirm({ name, email, role })} disabled={!name} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50">
                        Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NEW Event Settlement Modal (Replaces Split Modal) ---
const EventSettlementModal = ({ isOpen, onClose, members, currencySymbol, onSettle }: any) => {
    if(!isOpen) return null;

    // Debt Simplification Logic
    const debts: {from: string, to: string, amount: number}[] = [];
    const debtors = members.filter((m: any) => m.balance < -0.01).sort((a: any, b: any) => a.balance - b.balance);
    const creditors = members.filter((m: any) => m.balance > 0.01).sort((a: any, b: any) => b.balance - a.balance);

    let i = 0; let j = 0;
    while(i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
        
        debts.push({ from: debtor.name, to: creditor.name, amount });
        
        debtor.balance += amount;
        creditor.balance -= amount;
        
        if(Math.abs(debtor.balance) < 0.01) i++;
        if(creditor.balance < 0.01) j++;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle size={20} className="text-emerald-500" /> Settlement Plan
                    </h3>
                    <button onClick={onClose} className="text-slate-400"><X size={20}/></button>
                </div>

                {debts.length > 0 ? (
                    <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {debts.map((d, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="font-bold">{d.from}</span>
                                    <ArrowRight size={14} className="text-slate-400" />
                                    <span className="font-bold">{d.to}</span>
                                </div>
                                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(d.amount, currencySymbol)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">All settled up! No debts found.</p>
                    </div>
                )}

                {debts.length > 0 && (
                    <button 
                        onClick={() => onSettle(debts)}
                        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                        Mark All as Settled
                    </button>
                )}
            </div>
        </div>
    );
};

// --- NEW Edit Member Modal ---
const EditMemberModal = ({ isOpen, onClose, member, onConfirm, onDelete }: any) => {
    const [role, setRole] = useState(member?.role || 'viewer');
    
    useEffect(() => { if (isOpen && member) setRole(member.role); }, [isOpen, member]);
    
    if (!isOpen || !member) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Manage Member</h3>
                
                <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div className={`w-10 h-10 rounded-full ${member.avatar || 'bg-slate-500'} flex items-center justify-center font-bold text-white`}>
                        {member.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.id === 'me' ? 'You' : 'Member'}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Change Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['admin', 'editor', 'viewer'].map(r => (
                                <button 
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${role === r ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {member.id !== 'me' && (
                            <button 
                                onClick={() => onDelete(member.id)}
                                className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={16} /> Remove
                            </button>
                        )}
                        <button 
                            onClick={() => onConfirm({ ...member, role })}
                            className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventAITab = ({ event }: any) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const handleAskAI = async () => { if(!query) return; setLoading(true); const res = await analyzeEventWithAI(event, query); setResponse(res); setLoading(false); };
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 h-full flex flex-col">
            <Card className="p-4 bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white border-none shrink-0"><div className="flex items-start gap-3"><Sparkles className="shrink-0 mt-1 text-yellow-300" /><div><h3 className="font-bold text-lg">AI Event Planner</h3><p className="text-xs opacity-90">Ask me about budget allocation, vendor suggestions, or cost cutting tips.</p></div></div></Card>
            <div className="flex-1 overflow-y-auto min-h-[150px] space-y-4">{response && (<div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><Sparkles size={16} className="text-indigo-600" /></div><Card className="p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-tl-none"><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{response}</p></Card></div>)}</div>
            <div className="shrink-0 mt-auto pt-2"><div className="relative"><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask your AI planner..." className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleAskAI()} /><button onClick={handleAskAI} disabled={loading || !query} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"><Send size={16} /></button></div></div>
        </div>
    );
};

const CreateEventModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [type, setType] = useState('General'); const [budget, setBudget] = useState(''); const [date, setDate] = useState(''); const [location, setLocation] = useState('');
    if(!isOpen) return null;
    const handleSubmit = () => { onConfirm({ id: generateId(), name, type, date, location, totalBudget: parseFloat(budget) || 0, currencySymbol, categories: [{ id: generateId(), name: 'General', allocated: parseFloat(budget)||0, color: '#6366f1' }], expenses: [], vendors: [], members: [{ id: 'me', name: 'You', role: 'admin' }], notes: '', created: Date.now(), theme: 'colorful' }); };
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Plan New Event</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Budget" value={budget} onChange={e => setBudget(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} /><button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Start Planning</button></div></div></div>);
};

const EditEventModal = ({ isOpen, onClose, onConfirm, initialData, currencySymbol }: any) => {
    const [name, setName] = useState(initialData.name); const [budget, setBudget] = useState(initialData.totalBudget.toString()); const [date, setDate] = useState(initialData.date);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Event</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={budget} onChange={e => setBudget(e.target.value)} /><button onClick={() => onConfirm({ name, totalBudget: parseFloat(budget) || 0, date })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Changes</button></div></div></div>);
};

// --- UPDATED ADD EXPENSE MODAL ---
const AddEventExpenseModal = ({ isOpen, onClose, onConfirm, categories, currencySymbol, event, onCreateShoppingList }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [shouldCreateList, setShouldCreateList] = useState(false); // New state for checkbox

    useEffect(() => {
        if(isOpen) {
            setName('');
            setAmount('');
            setCategory(categories[0]?.name || '');
            setShouldCreateList(false); // Reset checkbox
        }
    }, [isOpen, categories]);

    if(!isOpen) return null;

    const handleSave = () => {
        if (shouldCreateList && onCreateShoppingList && event) {
             const listName = `${event.name} - ${name || 'Expense'}`;
             // Create list logic triggered alongside confirm
             onCreateShoppingList(listName, parseFloat(amount) || 0, event.members);
        }
        onConfirm({ name, amount: parseFloat(amount), category });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Expense</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <button className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 text-xs font-bold flex items-center justify-center gap-2 mb-2">
                        <Camera size={16} /> Scan Receipt (Simulated)
                    </button>
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Description" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                        {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    
                    {/* Updated Checkbox Row for Shopping List Link */}
                    <div 
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${shouldCreateList ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                        onClick={() => setShouldCreateList(!shouldCreateList)}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${shouldCreateList ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                            {shouldCreateList && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1">
                            <div className={`text-xs font-bold ${shouldCreateList ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>Create Linked Shopping List</div>
                            <div className="text-[10px] text-slate-400">Add budget & members to Shopping</div>
                        </div>
                        <ShoppingBag size={18} className={shouldCreateList ? 'text-emerald-500' : 'text-slate-400'} />
                    </div>

                    <button onClick={handleSave} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save</button>
                </div>
            </div>
        </div>
    );
};

const AddCategoryModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [allocated, setAllocated] = useState('');
    if(!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Category</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Amount" value={allocated} onChange={e => setAllocated(e.target.value)} /><button onClick={() => onConfirm({ name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create</button></div></div></div>);
};

const EditCategoryModal = ({ isOpen, onClose, onConfirm, category, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [allocated, setAllocated] = useState('');
    useEffect(() => { if (isOpen && category) { setName(category.name); setAllocated(category.allocated.toString()); } }, [isOpen, category]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Category</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={allocated} onChange={e => setAllocated(e.target.value)} /><button onClick={() => onConfirm({ ...category, name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Update</button></div></div></div>);
};

const EditExpenseModal = ({ isOpen, onClose, onConfirm, onDelete, expense, categories, currencySymbol }: any) => {
    const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState('');
    useEffect(() => { if (isOpen && expense) { setName(expense.name); setAmount(expense.amount.toString()); setCategory(expense.category); } }, [isOpen, expense]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Expense</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={amount} onChange={e => setAmount(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={category} onChange={e => setCategory(e.target.value)}>{categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><div className="flex gap-2 mt-2"><button onClick={() => onDelete(expense.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button><button onClick={() => onConfirm({ ...expense, name, amount: parseFloat(amount) || 0, category })} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button></div></div></div></div>);
};

const AddVendorModal = ({ isOpen, onClose, onConfirm, currencySymbol, categories }: any) => {
    const [name, setName] = useState(''); const [service, setService] = useState(''); const [total, setTotal] = useState(''); const [advance, setAdvance] = useState(''); const [dueDate, setDueDate] = useState('');
    useEffect(() => { if(isOpen) { setName(''); setService(categories[0]?.name||''); setTotal(''); setAdvance(''); setDueDate(''); } }, [isOpen, categories]);
    if(!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Vendor</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Vendor Name" value={name} onChange={e => setName(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={service} onChange={e => setService(e.target.value)}>{categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Cost" value={total} onChange={e => setTotal(e.target.value)} /><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Advance" value={advance} onChange={e => setAdvance(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} /><button onClick={() => onConfirm({ name, service, totalAmount: parseFloat(total), advance: parseFloat(advance), dueDate })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add</button></div></div></div>);
};

const EditVendorModal = ({ isOpen, onClose, onConfirm, onDelete, vendor, currencySymbol, categories }: any) => {
    const [name, setName] = useState(''); const [service, setService] = useState(''); const [total, setTotal] = useState(''); const [dueDate, setDueDate] = useState('');
    useEffect(() => { if (isOpen && vendor) { setName(vendor.name); setService(vendor.service); setTotal(vendor.totalAmount.toString()); setDueDate(vendor.dueDate || ''); } }, [isOpen, vendor]);
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /><div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Vendor</h3><div className="space-y-3"><input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={name} onChange={e => setName(e.target.value)} /><select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={service} onChange={e => setService(e.target.value)}>{categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={total} onChange={e => setTotal(e.target.value)} /><input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} /><div className="flex gap-2 mt-2"><button onClick={() => onDelete(vendor.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button><button onClick={() => onConfirm({ ...vendor, name, service, totalAmount: parseFloat(total) || 0, dueDate })} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button></div></div></div></div>);
};
