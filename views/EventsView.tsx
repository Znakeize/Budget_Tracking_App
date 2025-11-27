
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
  ArrowRight, DollarSign, CalendarHeart, Bell, BellRing, ChevronDown
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

  const eventNotifications = useMemo(() => getEventNotifications(events, currencySymbol), [events, currencySymbol]);

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

// --- Sub-View: Event Detail ---

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

  const eventNotifications = useMemo(() => getEventNotifications([event], currencySymbol), [event, currencySymbol]);

  useEffect(() => {
      if (initialTab) {
          setActiveTab(initialTab as any);
      }
  }, [initialTab]);

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
            {/* Big Stats */}
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

            {/* Spending Chart */}
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

            {/* Quick Actions */}
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

    // Deep Link Handling
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
                            
                            {/* Recent Expenses for this category */}
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

    // Deep Link Logic
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

    const handleAddVendor = (vendor: any) => {
        const adv = vendor.advance || 0;
        const vendorId = generateId();
        const paymentId = generateId();

        const newVendor: EventVendor = {
            id: vendorId,
            ...vendor,
            paidAmount: adv, 
            status: adv > 0 ? (adv >= vendor.totalAmount ? 'paid' : 'partial') : 'pending',
            paymentHistory: adv > 0 ? [{
                id: paymentId,
                date: new Date().toISOString().split('T')[0],
                name: "Advance Payment",
                amount: adv,
                paidBy: 'me'
            }] : []
        };

        let newExpenses = [...event.expenses];
        if (adv > 0) {
            const newExpense: EventExpense = {
                id: paymentId,
                name: `Advance to ${vendor.name}`,
                amount: adv,
                category: vendor.service,
                date: new Date().toISOString(),
                vendorId: vendorId,
                paidBy: 'me'
            };
            newExpenses.push(newExpense);
        }

        onUpdate({ ...event, vendors: [...event.vendors, newVendor], expenses: newExpenses });
        setIsAddVendorOpen(false);
    };

    const handleUpdateVendor = (updatedVendor: EventVendor) => {
        const updatedWithStatus = {
            ...updatedVendor,
            status: updatedVendor.paidAmount >= updatedVendor.totalAmount ? 'paid' : updatedVendor.paidAmount > 0 ? 'partial' : 'pending'
        } as EventVendor;

        const updatedVendors = event.vendors.map((v: any) => v.id === updatedVendor.id ? updatedWithStatus : v);
        onUpdate({ ...event, vendors: updatedVendors });
        setEditingVendor(null);
    };

    const handleDeleteVendor = (id: string) => {
        if(confirm('Delete this vendor? This will also remove associated expenses.')) {
            const updatedVendors = event.vendors.filter((v: any) => v.id !== id);
            const updatedExpenses = event.expenses.filter((e: any) => e.vendorId !== id);
            onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
            setEditingVendor(null);
        }
    };

    const handleUpdatePayment = (id: string, amount: number, note: string = "Payment") => {
        const paymentId = generateId();
        let newExpense: EventExpense | null = null;

        const updatedVendors = event.vendors.map((v: EventVendor) => {
            if (v.id === id) {
                const newPaid = Math.min(v.paidAmount + amount, v.totalAmount);
                const historyItem = {
                    id: paymentId,
                    date: new Date().toISOString().split('T')[0],
                    name: note,
                    amount: amount,
                    paidBy: 'me'
                };
                
                // Create corresponding expense
                newExpense = {
                    id: paymentId,
                    name: `${note} to ${v.name}`,
                    amount: amount,
                    category: v.service,
                    date: new Date().toISOString(),
                    vendorId: v.id,
                    paidBy: 'me'
                };

                return { 
                    ...v, 
                    paidAmount: newPaid,
                    status: newPaid >= v.totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'pending',
                    paymentHistory: [...(v.paymentHistory || []), historyItem]
                };
            }
            return v;
        });

        let newExpenses = [...event.expenses];
        if (newExpense) {
            newExpenses.push(newExpense);
        }

        onUpdate({ ...event, vendors: updatedVendors, expenses: newExpenses });
    };

    const handleRemovePayment = (vendorId: string, paymentId: string, amount: number, isAdvance: boolean) => {
        if(!confirm(isAdvance ? 'Remove advance payment? This will reset the advance record.' : 'Remove this payment record?')) return;

        const updatedVendors = event.vendors.map((v: EventVendor) => {
            if (v.id === vendorId) {
                const newPaid = Math.max(0, v.paidAmount - amount);
                
                let newStatus = 'pending';
                if (newPaid >= v.totalAmount) newStatus = 'paid';
                else if (newPaid > 0) newStatus = 'partial';

                return { 
                    ...v, 
                    paidAmount: newPaid,
                    advance: isAdvance ? 0 : v.advance, 
                    status: newStatus as 'pending' | 'partial' | 'paid',
                    paymentHistory: (v.paymentHistory || []).filter((h: any) => h.id !== paymentId)
                };
            }
            return v;
        });

        // Remove corresponding expense
        const updatedExpenses = event.expenses.filter((e: any) => e.id !== paymentId);

        onUpdate({ ...event, vendors: updatedVendors, expenses: updatedExpenses });
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
             <button 
                onClick={() => setIsAddVendorOpen(true)}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
                <Plus size={18} /> Add Vendor
            </button>

            <div className="space-y-3">
                {event.vendors.map((vendor: EventVendor) => {
                    const remaining = vendor.totalAmount - vendor.paidAmount;
                    const customAmount = customAmounts[vendor.id] || '';

                    return (
                    <div id={vendor.id} key={vendor.id}>
                        <Card className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{vendor.name}</h4>
                                        <button onClick={() => setEditingVendor(vendor)} className="text-slate-300 hover:text-indigo-500 transition-colors p-1">
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{vendor.service}</span>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    vendor.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                                    vendor.status === 'partial' ? 'bg-orange-100 text-orange-600' :
                                    'bg-red-100 text-red-600'
                                }`}>
                                    {vendor.status}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-slate-500">Total: {formatCurrency(vendor.totalAmount, currencySymbol)}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Paid: {formatCurrency(vendor.paidAmount, currencySymbol)}</span>
                            </div>

                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{width: `${vendor.totalAmount > 0 ? (vendor.paidAmount / vendor.totalAmount) * 100 : 0}%`}}
                                ></div>
                            </div>

                            {vendor.status !== 'paid' && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Make a Payment</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                                            <input 
                                                type="number" 
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-7 pr-2 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="Amount"
                                                value={customAmount}
                                                onChange={(e) => setCustomAmounts({...customAmounts, [vendor.id]: e.target.value})}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const amt = parseFloat(customAmount);
                                                if(amt > 0) {
                                                    handleUpdatePayment(vendor.id, amt, "Payment");
                                                    setCustomAmounts({...customAmounts, [vendor.id]: ''});
                                                }
                                            }}
                                            disabled={!customAmount || parseFloat(customAmount) <= 0}
                                            className="px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
                                        >
                                            Pay
                                        </button>
                                    </div>
                                    <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar">
                                        <button onClick={() => setCustomAmounts({...customAmounts, [vendor.id]: remaining.toFixed(2)})} className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Full Balance</button>
                                        <button onClick={() => setCustomAmounts({...customAmounts, [vendor.id]: (remaining/2).toFixed(2)})} className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">50%</button>
                                        <button onClick={() => setCustomAmounts({...customAmounts, [vendor.id]: (remaining*0.25).toFixed(2)})} className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">25%</button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Payment History Section */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase hover:text-indigo-500 transition-colors mb-2 w-full"
                                >
                                    <Clock size={12} /> Payment History
                                </button>
                                {vendor.paymentHistory && vendor.paymentHistory.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {vendor.paymentHistory.map((h: any) => {
                                            const isAdvance = h.name === "Advance Payment";
                                            // Determine payer name
                                            let payerName = 'You';
                                            if (h.paidBy && h.paidBy !== 'me') {
                                                const member = event.members.find((m: any) => m.id === h.paidBy);
                                                if (member) payerName = member.name;
                                            } else if (!h.paidBy) {
                                                // Fallback for legacy data
                                                const exp = event.expenses.find((e: any) => e.id === h.id);
                                                if (exp && exp.paidBy && exp.paidBy !== 'me') {
                                                    const member = event.members.find((m: any) => m.id === exp.paidBy);
                                                    if (member) payerName = member.name;
                                                }
                                            }

                                            return (
                                            <div key={h.id} className="flex justify-between items-center text-xs group hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2 border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                    <div className={`p-1.5 rounded-full ${isAdvance ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                        {isAdvance ? <Receipt size={10} /> : <CheckCircle size={10} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold">{h.name}</span>
                                                            {isAdvance && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 rounded-full font-bold">ADVANCE</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                                            <span>{h.date}</span>
                                                            <span>•</span>
                                                            <span>Paid by {payerName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold ${isAdvance ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(h.amount, currencySymbol)}</span>
                                                    <button 
                                                        onClick={() => handleRemovePayment(vendor.id, h.id, h.amount, isAdvance)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                                        title="Remove Payment"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic pl-3">No payments recorded.</p>
                                )}
                            </div>
                            
                            {vendor.dueDate && (
                                <div className="mt-2 text-[10px] text-orange-500 font-bold flex items-center gap-1">
                                    <AlertCircle size={10} /> Due: {vendor.dueDate}
                                </div>
                            )}
                        </Card>
                    </div>
                    );
                })}
                {event.vendors.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No vendors added</p>
                    </div>
                )}
            </div>
            
            <AddVendorModal 
                isOpen={isAddVendorOpen}
                onClose={() => setIsAddVendorOpen(false)}
                onConfirm={handleAddVendor}
                currencySymbol={currencySymbol}
                categories={event.categories}
            />

            <EditVendorModal 
                isOpen={!!editingVendor}
                onClose={() => setEditingVendor(null)}
                onConfirm={handleUpdateVendor}
                onDelete={handleDeleteVendor}
                vendor={editingVendor}
                currencySymbol={currencySymbol}
                categories={event.categories}
            />
        </div>
    );
};

const EventTeamTab = ({ event, onUpdate, currencySymbol }: any) => {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);

    const handleInvite = (memberData: { name: string, role: string }) => {
        const newMember: EventMember = {
            id: generateId(),
            name: memberData.name,
            role: memberData.role as any,
        };
        onUpdate({ ...event, members: [...event.members, newMember] });
        setIsInviteOpen(false);
    };

    const handleRemoveMember = (id: string) => {
        if(confirm('Remove this member?')) {
            onUpdate({ ...event, members: event.members.filter((m: any) => m.id !== id) });
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
                <h3 className="font-bold flex items-center gap-2 mb-2"><Users size={18} /> Team Collaboration</h3>
                <p className="text-xs opacity-90 mb-4">Invite others to help plan this event. You can split expenses and assign tasks.</p>
                <button 
                    onClick={() => setIsInviteOpen(true)}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={16} /> Invite Member
                </button>
            </Card>

            <div className="space-y-3">
                {event.members.map((member: any) => (
                    <Card key={member.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</h4>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{member.role}</span>
                            </div>
                        </div>
                        {member.role !== 'admin' && (
                             <button onClick={() => handleRemoveMember(member.id)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                        )}
                    </Card>
                ))}
            </div>
            
            <Card className="p-4 mt-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">Expense Splitter</h3>
                <p className="text-xs text-slate-500 mb-4">Automatically calculate who owes what based on expenses paid by team members.</p>
                <button 
                    onClick={() => setIsSplitOpen(true)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Calculate Splits
                </button>
            </Card>

            <EventInviteModal 
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onConfirm={handleInvite}
            />

            <EventSplitModal 
                isOpen={isSplitOpen}
                onClose={() => setIsSplitOpen(false)}
                event={event}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

const EventAITab = ({ event }: any) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAskAI = async () => {
        if(!query) return;
        setLoading(true);
        const res = await analyzeEventWithAI(event, query);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 h-full flex flex-col">
            <Card className="p-4 bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white border-none shrink-0">
                <div className="flex items-start gap-3">
                    <Sparkles className="shrink-0 mt-1 text-yellow-300" />
                    <div>
                        <h3 className="font-bold text-lg">AI Event Planner</h3>
                        <p className="text-xs opacity-90">Ask me about budget allocation, vendor suggestions, or cost cutting tips.</p>
                    </div>
                </div>
            </Card>

            <div className="flex-1 overflow-y-auto min-h-[150px] space-y-4">
                 {response && (
                     <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                             <Sparkles size={16} className="text-indigo-600" />
                         </div>
                         <Card className="p-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 rounded-tl-none">
                             <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{response}</p>
                         </Card>
                     </div>
                 )}
                 {!response && !loading && (
                     <div className="text-center py-10 text-slate-400 text-xs">
                         <p>Try asking:</p>
                         <p className="mt-2">"Create a budget breakdown for a {event.totalBudget} {event.type}"</p>
                         <p className="mt-1">"What vendors do I need?"</p>
                     </div>
                 )}
                 {loading && (
                     <div className="flex gap-2 justify-center py-8">
                         <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                         <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                         <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                     </div>
                 )}
            </div>

            <div className="shrink-0 mt-auto pt-2">
                <div className="relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask your AI planner..."
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm outline-none focus:border-indigo-500 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    />
                    <button 
                        onClick={handleAskAI}
                        disabled={loading || !query}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateEventModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('General');
    const [budget, setBudget] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');

    if(!isOpen) return null;

    const handleSubmit = () => {
        const totalBudget = parseFloat(budget) || 0;
        
        let categories: EventCategory[] = [];
        if (type === 'Wedding') {
            categories = [
                { id: generateId(), name: 'Venue', allocated: totalBudget * 0.4, color: '#ec4899' },
                { id: generateId(), name: 'Catering', allocated: totalBudget * 0.3, color: '#f59e0b' },
                { id: generateId(), name: 'Attire', allocated: totalBudget * 0.1, color: '#8b5cf6' },
                { id: generateId(), name: 'Misc', allocated: totalBudget * 0.2, color: '#64748b' },
            ];
        } else {
             categories = [
                { id: generateId(), name: 'General', allocated: totalBudget, color: '#6366f1' },
            ];
        }

        const newEvent: EventData = {
            id: generateId(),
            name, type, date, location, 
            totalBudget, currencySymbol,
            categories,
            expenses: [], vendors: [], 
            members: [{ id: 'me', name: 'You', role: 'admin' }],
            notes: '', created: Date.now(),
            theme: type === 'Wedding' ? 'pastel' : 'colorful'
        };
        onConfirm(newEvent);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Plan New Event</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} />
                    <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={type} onChange={e => setType(e.target.value)}>
                        <option>General</option>
                        <option>Wedding</option>
                        <option>Birthday</option>
                        <option>Trip</option>
                        <option>Corporate</option>
                    </select>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Budget" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
                    
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Start Planning</button>
                </div>
            </div>
        </div>
    );
};

const EditEventModal = ({ isOpen, onClose, onConfirm, initialData, currencySymbol }: any) => {
    const [name, setName] = useState(initialData.name);
    const [type, setType] = useState(initialData.type);
    const [budget, setBudget] = useState(initialData.totalBudget.toString());
    const [date, setDate] = useState(initialData.date);
    const [location, setLocation] = useState(initialData.location);

    useEffect(() => {
        if (isOpen) {
            setName(initialData.name);
            setType(initialData.type);
            setBudget(initialData.totalBudget.toString());
            setDate(initialData.date);
            setLocation(initialData.location);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm({
            name, type, 
            totalBudget: parseFloat(budget) || 0,
            date, location
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Event Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} />
                    <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={type} onChange={e => setType(e.target.value)}>
                        <option>General</option>
                        <option>Wedding</option>
                        <option>Birthday</option>
                        <option>Trip</option>
                        <option>Corporate</option>
                    </select>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Budget" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
                    
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const AddEventExpenseModal = ({ isOpen, onClose, onConfirm, categories, currencySymbol, event, onCreateShoppingList }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');

    useEffect(() => {
        if(isOpen) {
            setName('');
            setAmount('');
            setCategory(categories[0]?.name || '');
        }
    }, [isOpen, categories]);

    if(!isOpen) return null;

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
                    
                    <button 
                        onClick={() => {
                            if (onCreateShoppingList && event) {
                                const listName = `${event.name} - ${name || 'Expense'}`;
                                onCreateShoppingList(listName, parseFloat(amount) || 0, event.members);
                                onClose();
                            }
                        }}
                        className="w-full py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        <ShoppingBag size={18} /> Create Shopping List & Link
                    </button>

                    <button onClick={() => onConfirm({ name, amount: parseFloat(amount), category })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save</button>
                </div>
            </div>
        </div>
    );
};

const AddCategoryModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [allocated, setAllocated] = useState('');

    useEffect(() => {
        if(isOpen) { setName(''); setAllocated(''); }
    }, [isOpen]);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Category</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Category Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Allocated Amount" value={allocated} onChange={e => setAllocated(e.target.value)} />
                    </div>
                    <button onClick={() => onConfirm({ name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create Category</button>
                </div>
            </div>
        </div>
    );
};

const EditExpenseModal = ({ isOpen, onClose, onConfirm, onDelete, expense, categories, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (isOpen && expense) {
            setName(expense.name);
            setAmount(expense.amount.toString());
            setCategory(expense.category);
        }
    }, [isOpen, expense]);

    if (!isOpen || !expense) return null;

    const handleSubmit = () => {
        onConfirm({ ...expense, name, amount: parseFloat(amount) || 0, category });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Expense</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Description" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={category} onChange={e => setCategory(e.target.value)}>
                        {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => onDelete(expense.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button>
                        <button onClick={handleSubmit} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditCategoryModal = ({ isOpen, onClose, onConfirm, category, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [allocated, setAllocated] = useState('');

    useEffect(() => {
        if (isOpen && category) {
            setName(category.name);
            setAllocated(category.allocated.toString());
        }
    }, [isOpen, category]);

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Category</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Category Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                         <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Allocated Amount" value={allocated} onChange={e => setAllocated(e.target.value)} />
                    </div>
                    <button onClick={() => onConfirm({ ...category, name, allocated: parseFloat(allocated) || 0 })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Update Category</button>
                </div>
            </div>
        </div>
    );
};

const AddVendorModal = ({ isOpen, onClose, onConfirm, currencySymbol, categories }: any) => {
    const [name, setName] = useState('');
    const [service, setService] = useState('');
    const [total, setTotal] = useState('');
    const [advance, setAdvance] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if(isOpen) {
            setName('');
            setService(categories && categories.length > 0 ? categories[0].name : '');
            setTotal(''); setAdvance(''); setDueDate('');
        }
    }, [isOpen, categories]);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Vendor</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Vendor Name" value={name} onChange={e => setName(e.target.value)} />
                    
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none appearance-none text-slate-900 dark:text-white" 
                            value={service} 
                            onChange={e => setService(e.target.value)}
                        >
                            {categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Cost" value={total} onChange={e => setTotal(e.target.value)} />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Advance Payment" value={advance} onChange={e => setAdvance(e.target.value)} />
                    </div>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    <button onClick={() => onConfirm({ name, service, totalAmount: parseFloat(total), advance: parseFloat(advance), dueDate })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add Vendor</button>
                </div>
            </div>
        </div>
    );
};

const EditVendorModal = ({ isOpen, onClose, onConfirm, onDelete, vendor, currencySymbol, categories }: any) => {
    const [name, setName] = useState('');
    const [service, setService] = useState('');
    const [total, setTotal] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (isOpen && vendor) {
            setName(vendor.name);
            setService(vendor.service);
            setTotal(vendor.totalAmount.toString());
            setDueDate(vendor.dueDate || '');
        }
    }, [isOpen, vendor]);

    if (!isOpen || !vendor) return null;

    const handleSubmit = () => {
        onConfirm({ ...vendor, name, service, totalAmount: parseFloat(total) || 0, dueDate });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Vendor</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Vendor Name" value={name} onChange={e => setName(e.target.value)} />
                    
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none appearance-none text-slate-900 dark:text-white" 
                            value={service} 
                            onChange={e => setService(e.target.value)}
                        >
                            {categories?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                            <option value="Other">Other</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Total Cost" value={total} onChange={e => setTotal(e.target.value)} />
                    </div>
                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => onDelete(vendor.id)} className="flex-1 py-3 bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20"><Trash2 size={16}/> Delete</button>
                        <button onClick={handleSubmit} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Update</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventInviteModal = ({ isOpen, onClose, onConfirm }: any) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('Viewer');

    useEffect(() => {
        if (isOpen) {
            setName('');
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
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Role</label>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <button onClick={() => onConfirm({ name, role })} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Send Invite</button>
                </div>
            </div>
        </div>
    );
};

const EventSplitModal = ({ isOpen, onClose, event, currencySymbol }: any) => {
    if (!isOpen) return null;

    const totalExpenses = event.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const perPerson = event.members.length > 0 ? totalExpenses / event.members.length : 0;

    const balances = event.members.map((m: EventMember) => {
        // Sum expenses paid by this member. If member ID is 'me', assume they paid expenses marked 'paidBy'='me' or missing paidBy
        const paid = event.expenses
            .filter((e: any) => e.paidBy === m.id || (m.id === 'me' && (!e.paidBy || e.paidBy === 'me')))
            .reduce((sum: number, e: any) => sum + e.amount, 0);
        
        return {
            ...m,
            paid,
            balance: paid - perPerson
        };
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expense Split</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpenses, currencySymbol)}</p>
                    <p className="text-xs text-slate-500 mt-1">~ {formatCurrency(perPerson, currencySymbol)} per person</p>
                </div>

                <div className="space-y-3">
                    {balances.map((b: any) => (
                        <div key={b.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {b.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</div>
                                    <div className="text-[10px] text-slate-500">Paid: {formatCurrency(b.paid, currencySymbol)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold text-sm ${b.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {b.balance >= 0 ? '+' : ''}{formatCurrency(b.balance, currencySymbol)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {b.balance > 0 ? 'Gets back' : 'Owes'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 text-center text-[10px] text-slate-400">
                    * Simplified split. Assumes equal sharing among all members.
                </div>
            </div>
        </div>
    );
};
