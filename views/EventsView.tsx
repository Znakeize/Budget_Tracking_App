import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { EventData, EventCategory, EventExpense, EventVendor } from '../types';
import { formatCurrency, generateId } from '../utils/calculations';
import { analyzeEventWithAI } from '../utils/aiHelper';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { 
  Calendar, MapPin, Plus, ChevronLeft, Wallet, PieChart, Users, 
  ShoppingBag, CheckCircle, Clock, FileText, Send, Sparkles, 
  Trash2, TrendingUp, AlertCircle, Camera, Download, Share2,
  Pencil, Edit2, X, Bell, BellRing, Briefcase, Layers, Receipt, Bot
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

interface EventsViewProps {
  events: EventData[];
  onUpdateEvents: (events: EventData[]) => void;
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
}

// Internal Notification Type
export interface EventNotification {
  id: string;
  eventId: string;
  eventName: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  date?: string;
  relatedItemId?: string; // ID of the specific item (vendor, expense, etc.)
}

export const getEventNotifications = (events: EventData[], currencySymbol: string): EventNotification[] => {
  const notifs: EventNotification[] = [];
  const today = new Date().toISOString().split('T')[0];

  events.forEach(event => {
    // 1. Date approaching
    const eventDate = new Date(event.date);
    const now = new Date();
    const daysLeft = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 14 && daysLeft >= 0) {
      notifs.push({
        id: `date-${event.id}`,
        eventId: event.id,
        eventName: event.name,
        message: `${event.name} is coming up in ${daysLeft} days!`,
        type: 'info',
        date: today
      });
    }

    // 2. Budget Overrun
    const totalSpent = event.expenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalSpent > event.totalBudget && event.totalBudget > 0) {
      notifs.push({
         id: `budget-${event.id}`,
         eventId: event.id,
         eventName: event.name,
         message: `Budget exceeded by ${formatCurrency(totalSpent - event.totalBudget, currencySymbol)}`,
         type: 'danger',
         date: today
      });
    } else if (totalSpent > event.totalBudget * 0.9 && event.totalBudget > 0) {
        notifs.push({
            id: `budget-warn-${event.id}`,
            eventId: event.id,
            eventName: event.name,
            message: `You have used 90% of your budget.`,
            type: 'warning',
            date: today
         });
    }

    // 3. Vendor Payments
    event.vendors.forEach(vendor => {
        if (vendor.status !== 'paid' && vendor.dueDate) {
             if (vendor.dueDate < today) {
                  notifs.push({
                    id: `vendor-overdue-${vendor.id}`,
                    eventId: event.id,
                    eventName: event.name,
                    message: `Payment to ${vendor.name} is overdue (${vendor.dueDate})`,
                    type: 'danger',
                    date: vendor.dueDate,
                    relatedItemId: vendor.id
                  });
             } else if (vendor.dueDate === today) {
                  notifs.push({
                    id: `vendor-due-${vendor.id}`,
                    eventId: event.id,
                    eventName: event.name,
                    message: `Payment to ${vendor.name} is due today`,
                    type: 'warning',
                    date: vendor.dueDate,
                    relatedItemId: vendor.id
                  });
             } else {
                 const due = new Date(vendor.dueDate);
                 const diffTime = due.getTime() - now.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 if (diffDays <= 7 && diffDays > 0) {
                     notifs.push({
                        id: `vendor-soon-${vendor.id}`,
                        eventId: event.id,
                        eventName: event.name,
                        message: `Payment to ${vendor.name} due in ${diffDays} days`,
                        type: 'info',
                        date: vendor.dueDate,
                        relatedItemId: vendor.id
                      });
                 }
             }
        }
    });
  });

  return notifs;
};

export const EventsView: React.FC<EventsViewProps> = ({ events, onUpdateEvents, currencySymbol, onBack, onProfileClick }) => {
  const [activeEventParams, setActiveEventParams] = useState<{id: string, initialTab?: string, focusItemId?: string} | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Active Event State
  const activeEvent = useMemo(() => events.find(e => e.id === activeEventParams?.id), [events, activeEventParams]);
  
  const notifications = useMemo(() => getEventNotifications(events, currencySymbol), [events, currencySymbol]);

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

  const handleNotificationSelect = (notif: EventNotification) => {
      let initialTab = 'dashboard';
      if (notif.id.startsWith('vendor-')) {
          initialTab = 'vendors';
      } else if (notif.id.startsWith('budget-')) {
          initialTab = 'budget';
      }
      
      setActiveEventParams({ id: notif.eventId, initialTab, focusItemId: notif.relatedItemId });
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
                    {/* Event Specific Notification Bell */}
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95"
                    >
                        {notifications.length > 0 ? (
                            <>
                                <BellRing size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                            </>
                        ) : (
                            <Bell size={20} className="text-slate-400 dark:text-slate-500" />
                        )}
                    </button>
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

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
                   // Check if this event has active notifications
                   const hasAlerts = notifications.some(n => n.eventId === evt.id);

                   return (
                       <Card key={evt.id} className="p-0 overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow relative" onClick={() => setActiveEventParams({ id: evt.id })}>
                           {hasAlerts && (
                               <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10 animate-pulse"></div>
                           )}
                           <div className={`h-2 w-full ${evt.theme === 'dark' ? 'bg-slate-800' : evt.theme === 'colorful' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' : 'bg-indigo-500'}`}></div>
                           <div className="p-4">
                               <div className="flex justify-between items-start mb-3">
                                   <div className="flex-1 min-w-0 pr-2">
                                       <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{evt.name}</h3>
                                       <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                           <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(evt.date).toLocaleDateString()}</span>
                                           <span className="flex items-center gap-1 truncate"><MapPin size={12}/> {evt.location}</span>
                                       </div>
                                   </div>
                                   <div className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${daysLeft > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                       {daysLeft > 0 ? `${daysLeft} days` : 'Past'}
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

       {showNotifications && (
           <EventNotificationPopup 
                notifications={notifications} 
                onClose={() => setShowNotifications(false)} 
                onSelectNotification={handleNotificationSelect}
           />
       )}

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

const EventDetailView: React.FC<{ event: EventData, onUpdate: (e: EventData) => void, onBack: () => void, currencySymbol: string, initialTab?: string, focusItemId?: string, onProfileClick: () => void }> = ({ event, onUpdate, onBack, currencySymbol, initialTab, focusItemId, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'vendors' | 'team' | 'ai'>((initialTab as any) || 'dashboard');
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

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
            <div className="flex items-start justify-between mb-3">
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
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Budget</div>
                        <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(event.totalBudget, currencySymbol)}</div>
                    </div>
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

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'dashboard' && <EventDashboardTab event={event} totalSpent={totalSpent} remaining={remaining} currencySymbol={currencySymbol} />}
           {activeTab === 'budget' && <EventBudgetTab event={event} onUpdate={onUpdate} currencySymbol={currencySymbol} focusItemId={focusItemId} />}
           {activeTab === 'vendors' && <EventVendorsTab event={event} onUpdate={onUpdate} currencySymbol={currencySymbol} focusItemId={focusItemId} />}
           {activeTab === 'team' && <EventTeamTab event={event} onUpdate={onUpdate} />}
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

// --- Tabs Components ---

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

const EventBudgetTab = ({ event, onUpdate, currencySymbol, focusItemId }: any) => {
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
                                    className={`h-full rounded-full ${percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
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
        const newVendor: EventVendor = {
            id: generateId(),
            ...vendor,
            paidAmount: adv, // Initialize paid amount with advance
            status: adv > 0 ? (adv >= vendor.totalAmount ? 'paid' : 'partial') : 'pending',
            paymentHistory: adv > 0 ? [{
                id: generateId(),
                date: new Date().toISOString().split('T')[0],
                name: "Advance Payment",
                amount: adv
            }] : []
        };
        onUpdate({ ...event, vendors: [...event.vendors, newVendor] });
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
        if(confirm('Delete this vendor?')) {
            const updatedVendors = event.vendors.filter((v: any) => v.id !== id);
            onUpdate({ ...event, vendors: updatedVendors });
            setEditingVendor(null);
        }
    };

    const handleUpdatePayment = (id: string, amount: number, note: string = "Payment") => {
        const updatedVendors = event.vendors.map((v: EventVendor) => {
            if (v.id === id) {
                const newPaid = Math.min(v.paidAmount + amount, v.totalAmount);
                const historyItem = {
                    id: generateId(),
                    date: new Date().toISOString().split('T')[0],
                    name: note,
                    amount: amount
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
        onUpdate({ ...event, vendors: updatedVendors });
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
                    advance: isAdvance ? 0 : v.advance, // Reset advance if we delete the advance payment
                    status: newStatus as 'pending' | 'partial' | 'paid',
                    paymentHistory: (v.paymentHistory || []).filter((h: any) => h.id !== paymentId)
                };
            }
            return v;
        });
        onUpdate({ ...event, vendors: updatedVendors });
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
                                        <h4 className="font-bold text-slate-900 dark:text-white">{vendor.name}</h4>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${vendor.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : vendor.status === 'partial' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {vendor.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{vendor.service}</p>
                                </div>
                                <button onClick={() => setEditingVendor(vendor)} className="p-1 text-slate-300 hover:text-indigo-500 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span>Paid: {formatCurrency(vendor.paidAmount, currencySymbol)}</span>
                                    <span>Total: {formatCurrency(vendor.totalAmount, currencySymbol)}</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${vendor.status === 'paid' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{width: `${Math.min((vendor.paidAmount/vendor.totalAmount)*100, 100)}%`}}
                                    ></div>
                                </div>
                            </div>

                            {/* Payment History & Actions */}
                            {remaining > 0 && (
                                <div className="flex gap-2 items-center mb-3">
                                    <input 
                                        type="number" 
                                        placeholder="Amount" 
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs w-24 outline-none"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmounts({...customAmounts, [vendor.id]: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => {
                                            const val = parseFloat(customAmount);
                                            if(val > 0) {
                                                handleUpdatePayment(vendor.id, val);
                                                setCustomAmounts({...customAmounts, [vendor.id]: ''});
                                            }
                                        }}
                                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                                    >
                                        Pay
                                    </button>
                                </div>
                            )}

                            {vendor.paymentHistory && vendor.paymentHistory.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">History</div>
                                    <div className="space-y-1">
                                        {vendor.paymentHistory.map((ph: any) => (
                                            <div key={ph.id} className="flex justify-between text-xs">
                                                <span className="text-slate-600 dark:text-slate-300">{ph.date} - {ph.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(ph.amount, currencySymbol)}</span>
                                                    <button onClick={() => handleRemovePayment(vendor.id, ph.id, ph.amount, ph.name === "Advance Payment")} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                    );
                })}
            </div>

            <AddVendorModal
                isOpen={isAddVendorOpen}
                onClose={() => setIsAddVendorOpen(false)}
                onConfirm={handleAddVendor}
                currencySymbol={currencySymbol}
            />
            <EditVendorModal
                isOpen={!!editingVendor}
                onClose={() => setEditingVendor(null)}
                onConfirm={handleUpdateVendor}
                onDelete={handleDeleteVendor}
                vendor={editingVendor}
                currencySymbol={currencySymbol}
            />
        </div>
    );
};

const EventTeamTab = ({ event, onUpdate }: any) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">Collaborators</h3>
                    <button className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded font-bold">Invite</button>
                </div>
                <div className="space-y-3">
                    {event.members.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                                    <div className="text-xs text-slate-500 capitalize">{member.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const EventAITab = ({ event }: any) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAskAI = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const res = await analyzeEventWithAI(event, query);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Bot className="text-indigo-500" size={18} /> Event Assistant
                </h3>
                <p className="text-xs text-slate-500 mb-4">Ask for vendor suggestions, budget breakdowns, or timeline advice.</p>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none"
                        placeholder="e.g. Suggest a timeline for the day..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    />
                    <button 
                        onClick={handleAskAI}
                        disabled={loading}
                        className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={18} />}
                    </button>
                </div>

                {response && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in">
                        {response}
                    </div>
                )}
            </Card>
        </div>
    );
};

// --- Modals ---

const CreateEventModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [data, setData] = useState({ name: '', type: 'Wedding', date: '', location: '', totalBudget: '' });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!data.name || !data.date) return;
        onConfirm({
            id: generateId(),
            ...data,
            totalBudget: parseFloat(data.totalBudget) || 0,
            currencySymbol,
            categories: [],
            expenses: [],
            vendors: [],
            members: [{ id: 'me', name: 'You', role: 'admin' }],
            created: Date.now(),
            theme: 'colorful'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">New Event</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Event Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <select className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" value={data.type} onChange={e => setData({...data, type: e.target.value})}>
                        <option value="Wedding">Wedding</option>
                        <option value="Birthday">Birthday</option>
                        <option value="Trip">Trip</option>
                        <option value="Party">Party</option>
                        <option value="Corporate">Corporate</option>
                    </select>
                    <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" value={data.date} onChange={e => setData({...data, date: e.target.value})} style={{colorScheme: 'dark'}} />
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Location" value={data.location} onChange={e => setData({...data, location: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Total Budget" value={data.totalBudget} onChange={e => setData({...data, totalBudget: e.target.value})} />
                    </div>
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create Plan</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const EditEventModal = ({ isOpen, onClose, onConfirm, initialData, currencySymbol }: any) => {
    const [data, setData] = useState(initialData);
    
    useEffect(() => { setData(initialData); }, [initialData, isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">Edit Event Details</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Event Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <input type="date" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" value={data.date} onChange={e => setData({...data, date: e.target.value})} style={{colorScheme: 'dark'}} />
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Location" value={data.location} onChange={e => setData({...data, location: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Total Budget" value={data.totalBudget} onChange={e => setData({...data, totalBudget: parseFloat(e.target.value) || 0})} />
                    </div>
                    <button onClick={() => onConfirm(data)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Changes</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const AddEventExpenseModal = ({ isOpen, onClose, onConfirm, categories, currencySymbol }: any) => {
    const [data, setData] = useState({ name: '', amount: '', category: categories[0]?.name || '' });

    useEffect(() => {
        if(isOpen) setData({ name: '', amount: '', category: categories[0]?.name || '' });
    }, [isOpen, categories]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">Add Expense</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Expense Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Amount" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
                    </div>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                        {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => onConfirm({...data, amount: parseFloat(data.amount) || 0})} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add Expense</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const AddCategoryModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [data, setData] = useState({ name: '', allocated: '' });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">New Category</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Category Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Allocated Budget" value={data.allocated} onChange={e => setData({...data, allocated: e.target.value})} />
                    </div>
                    <button onClick={() => onConfirm({...data, allocated: parseFloat(data.allocated) || 0})} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Create Category</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const EditCategoryModal = ({ isOpen, onClose, onConfirm, category, currencySymbol }: any) => {
    const [data, setData] = useState(category);
    useEffect(() => { setData(category); }, [category, isOpen]);
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">Edit Category</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Category Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Allocated Budget" value={data.allocated} onChange={e => setData({...data, allocated: parseFloat(e.target.value) || 0})} />
                    </div>
                    <button onClick={() => onConfirm(data)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Save Changes</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const EditExpenseModal = ({ isOpen, onClose, onConfirm, onDelete, expense, categories, currencySymbol }: any) => {
    const [data, setData] = useState(expense);
    useEffect(() => { setData(expense); }, [expense, isOpen]);
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Edit Expense</h3>
                    <button onClick={() => onDelete(expense.id)} className="text-red-500 hover:text-red-400"><Trash2 size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Amount" value={data.amount} onChange={e => setData({...data, amount: parseFloat(e.target.value) || 0})} />
                    </div>
                    <select className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" value={data.category} onChange={e => setData({...data, category: e.target.value})}>
                        {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => onConfirm(data)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Update</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const AddVendorModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [data, setData] = useState({ name: '', service: '', totalAmount: '', advance: '' });

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-white mb-4">Add Vendor</h3>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Vendor Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Service (e.g. Catering)" value={data.service} onChange={e => setData({...data, service: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Total Cost" value={data.totalAmount} onChange={e => setData({...data, totalAmount: e.target.value})} />
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Advance Paid (Optional)" value={data.advance} onChange={e => setData({...data, advance: e.target.value})} />
                    </div>
                    <button onClick={() => onConfirm({...data, totalAmount: parseFloat(data.totalAmount)||0, advance: parseFloat(data.advance)||0})} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add Vendor</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const EditVendorModal = ({ isOpen, onClose, onConfirm, onDelete, vendor, currencySymbol }: any) => {
    const [data, setData] = useState(vendor);
    useEffect(() => { setData(vendor); }, [vendor, isOpen]);
    if(!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Edit Vendor</h3>
                    <button onClick={() => onDelete(vendor.id)} className="text-red-500 hover:text-red-400"><Trash2 size={20}/></button>
                </div>
                <div className="space-y-3">
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Vendor Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                    <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none" placeholder="Service" value={data.service} onChange={e => setData({...data, service: e.target.value})} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        <input type="number" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 pl-8 text-white outline-none" placeholder="Total Cost" value={data.totalAmount} onChange={e => setData({...data, totalAmount: parseFloat(e.target.value)||0})} />
                    </div>
                    <button onClick={() => onConfirm(data)} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Update Vendor</button>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
            </div>
        </div>
    );
};

const EventNotificationPopup = ({ notifications, onClose, onSelectNotification }: any) => {
    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={onClose}></div>
            <div className="absolute top-[4.5rem] right-4 z-50 w-72 animate-in zoom-in-95 slide-in-from-top-2 duration-200">
                <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl p-0 overflow-hidden ring-1 ring-black/5">
                    <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <AlertCircle size={14} className="text-indigo-500" /> Event Alerts
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={14}/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {notifications.length > 0 ? notifications.map((n: any) => (
                            <button key={n.id} onClick={() => onSelectNotification(n)} className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{n.eventName}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                            </button>
                        )) : (
                            <div className="py-8 text-center text-xs text-slate-400">No active alerts</div>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
};
