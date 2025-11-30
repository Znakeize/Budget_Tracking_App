
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
  Shield, Mail, User, UserPlus, Loader2, RefreshCw, HandCoins, CircleDollarSign
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
      if (initialTab && initialTab !== 'settlement') { // Redirect settlement tab requests to team
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

    const handleShare = async () => {
        const shareData = {
            title: `Event Plan: ${event.name}`,
            text: `Event: ${event.name}\nType: ${event.type}\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\nBudget: ${currencySymbol}${event.totalBudget.toLocaleString()}\nRemaining: ${currencySymbol}${remaining.toLocaleString()}\n\nManaged with BudgetFlow.`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.text);
                alert('Event details copied to clipboard!');
            } catch (err) {
                console.error('Copy failed', err);
                alert('Could not share event.');
            }
        }
    };

    const handleExport = () => {
        const doc = new jsPDF();
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const checkPageBreak = (needed: number) => {
            if (y + needed > pageHeight - 15) {
                doc.addPage();
                y = 20;
            }
        };

        // Title
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text(event.name, 20, y);
        y += 8;

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${event.type} • ${new Date(event.date).toLocaleDateString()} • ${event.location}`, 20, y);
        y += 15;

        // --- FINANCIAL SUMMARY BOX ---
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(230, 230, 230);
        doc.rect(20, y, 170, 25, 'F');
        doc.rect(20, y, 170, 25, 'S');
        
        let boxY = y + 8;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Total Budget", 30, boxY); 
        doc.text("Total Spent", 80, boxY); 
        doc.text("Remaining", 130, boxY);
        
        boxY += 10;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${currencySymbol}${event.totalBudget.toLocaleString()}`, 30, boxY);
        doc.text(`${currencySymbol}${totalSpent.toLocaleString()}`, 80, boxY);
        
        const remColor = remaining >= 0 ? [16, 185, 129] : [239, 68, 68]; // Green or Red
        doc.setTextColor(remColor[0], remColor[1], remColor[2]);
        doc.text(`${currencySymbol}${remaining.toLocaleString()}`, 130, boxY);
        
        y += 35;

        // --- BUDGET BREAKDOWN TABLE ---
        checkPageBreak(60);
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text("Budget Breakdown", 20, y);
        y += 8;

        // Table Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text("Category", 25, y);
        doc.text("Allocated", 80, y);
        doc.text("Spent", 120, y);
        doc.text("Status", 160, y);
        y += 10;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        event.categories.forEach((cat: any) => {
            checkPageBreak(10);
            const spent = event.expenses.filter((e: any) => e.category === cat.name).reduce((sum: number, e: any) => sum + e.amount, 0);
            const status = spent > cat.allocated ? 'Over' : `${Math.round((spent/cat.allocated)*100)}%`;
            
            doc.text(cat.name, 25, y);
            doc.text(`${currencySymbol}${cat.allocated.toLocaleString()}`, 80, y);
            doc.text(`${currencySymbol}${spent.toLocaleString()}`, 120, y);
            
            if(status === 'Over') doc.setTextColor(220, 0, 0);
            else doc.setTextColor(0, 150, 0);
            doc.text(status, 160, y);
            doc.setTextColor(0);
            
            y += 8;
        });
        y += 10;

        // --- VENDORS SECTION ---
        checkPageBreak(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Vendors & Payments", 20, y);
        y += 8;

        // Vendor Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text("Vendor", 25, y);
        doc.text("Service", 70, y);
        doc.text("Cost", 110, y);
        doc.text("Paid", 140, y);
        doc.text("Status", 170, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);

        if (event.vendors.length === 0) {
            doc.text("- No vendors recorded -", 25, y);
            y += 10;
        } else {
            event.vendors.forEach((v: any) => {
                checkPageBreak(10);
                doc.text(v.name, 25, y);
                doc.text(v.service, 70, y);
                doc.text(`${currencySymbol}${v.totalAmount.toLocaleString()}`, 110, y);
                doc.text(`${currencySymbol}${v.paidAmount.toLocaleString()}`, 140, y);
                
                doc.setFont('helvetica', 'bold');
                if (v.status === 'paid') doc.setTextColor(0, 150, 0);
                else if (v.status === 'partial') doc.setTextColor(200, 100, 0);
                else doc.setTextColor(100);
                
                doc.text(v.status.toUpperCase(), 170, y);
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
                y += 8;
            });
        }
        y += 10;

        // --- EXPENSE LOG ---
        checkPageBreak(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Expense Log", 20, y);
        y += 8;

        // Expense Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text("Date", 25, y);
        doc.text("Item", 55, y);
        doc.text("Category", 110, y);
        doc.text("Amount", 170, y, {align: 'right'});
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);

        if (event.expenses.length === 0) {
            doc.text("- No expenses recorded -", 25, y);
            y += 10;
        } else {
            const sortedExpenses = [...event.expenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            sortedExpenses.forEach((exp: any) => {
                checkPageBreak(10);
                doc.text(new Date(exp.date).toLocaleDateString(), 25, y);
                doc.text(exp.name.substring(0, 25) + (exp.name.length > 25 ? '...' : ''), 55, y);
                doc.text(exp.category, 110, y);
                doc.text(`${currencySymbol}${exp.amount.toLocaleString()}`, 170, y, {align: 'right'});
                y += 8;
            });
        }
        y += 10;

        // --- TEAM ---
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Event Team", 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const membersStr = event.members.map((m: any) => `${m.name} (${m.role})`).join(', ');
        doc.text(membersStr, 20, y, {maxWidth: 170});

        // --- FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generated by BudgetFlow • Page ${i} of ${pageCount}`, 105, 290, {align: 'center'});
        }

        doc.save(`${event.name}_Full_Report.pdf`);
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
                 <button onClick={handleShare} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Share2 size={16} /> Share Event
                 </button>
            </div>
        </div>
    );
};

const EventSettlementTab = ({ event, currencySymbol, onUpdate }: { event: EventData, currencySymbol: string, onUpdate: (e: EventData) => void }) => {
    
    // State for Partial Settlement
    const [partialMode, setPartialMode] = useState<string | null>(null); // Stores ID of the settlement being partially paid
    const [partialAmount, setPartialAmount] = useState('');

    // Logic to calculate settlements
    const calculateSettlements = () => {
        const members = event.members;
        const expenses = event.expenses;
        
        // 1. Calculate Net Balances
        const balances: Record<string, number> = {};
        members.forEach(m => balances[m.id] = 0);
        
        let totalExpense = 0;

        expenses.forEach(e => {
            if (e.category === 'Settlement') {
                // If it's a settlement, it's a transfer.
                // It increases the payer's contribution (balance) without increasing the total shared cost of the event.
                // We assume 'paidBy' is the person sending the money.
                const payerId = e.paidBy || 'me';
                if (balances[payerId] !== undefined) {
                    balances[payerId] += e.amount;
                }
                
                // NEW: Handle receiver logic via vendorId convention or direct calculation
                // For proper settlement logic, we need to debit the receiver.
                // We assume the settlement expense `vendorId` field stores the receiver's member ID.
                // This is a convention we will use in handleSettle.
                const receiverId = e.vendorId;
                if (receiverId && balances[receiverId] !== undefined) {
                    balances[receiverId] -= e.amount;
                }
            } else if (e.category !== 'Reminder') {
                const amount = e.amount;
                totalExpense += amount;
                // Default to 'me' if paidBy is undefined, assuming the current user paid
                const payerId = e.paidBy || 'me';
                
                // Payer gets credit
                if (balances[payerId] !== undefined) {
                    balances[payerId] += amount;
                } else {
                    // If payer isn't in member list (edge case), default to 'me' bucket or ignore
                    if (balances['me'] !== undefined) balances['me'] += amount;
                }
            }
        });

        // Simple equal split logic for events
        const splitAmount = members.length > 0 ? totalExpense / members.length : 0;

        // Subtract fair share from everyone
        members.forEach(m => {
            balances[m.id] -= splitAmount;
        });

        // 2. Resolve Debts
        const debtors = members.filter(m => balances[m.id] < -0.01).map(m => ({ ...m, balance: balances[m.id] })).sort((a,b) => a.balance - b.balance);
        const creditors = members.filter(m => balances[m.id] > 0.01).map(m => ({ ...m, balance: balances[m.id] })).sort((a,b) => b.balance - a.balance);

        const settlements = [];
        let i = 0; 
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
            
            settlements.push({
                id: `settle-${debtor.id}-${creditor.id}`, // Generate a key for UI
                from: debtor,
                to: creditor,
                amount: amount
            });

            debtor.balance += amount;
            creditor.balance -= amount;

            if (Math.abs(debtor.balance) < 0.01) i++;
            if (creditor.balance < 0.01) j++;
        }

        return { settlements, totalExpense, splitAmount };
    };

    const { settlements, totalExpense, splitAmount } = calculateSettlements();

    const handleSettle = (settlement: any, amount: number) => {
        const newExpense: EventExpense = {
            id: generateId(),
            name: `Settlement to ${settlement.to.name}`,
            amount: amount,
            category: 'Settlement',
            date: new Date().toISOString(),
            paidBy: settlement.from.id,
            vendorId: settlement.to.id // Use vendorId to store receiver ID for internal logic
        };
        
        onUpdate({ ...event, expenses: [...event.expenses, newExpense] });
        setPartialMode(null);
        setPartialAmount('');
    };

    const handleRemind = (settlement: any) => {
        const newExpense: EventExpense = {
            id: generateId(),
            name: `Reminder: ${settlement.from.name} owes ${currencySymbol}${settlement.amount.toLocaleString()}`,
            amount: 0, // No financial impact
            category: 'Reminder',
            date: new Date().toISOString(),
            paidBy: 'me',
            vendorId: settlement.from.id // Target of reminder
        };
        
        onUpdate({ ...event, expenses: [...event.expenses, newExpense] });
        
        // Visual feedback
        alert(`Reminder sent to ${settlement.from.name}`);
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                <div className="grid grid-cols-2 gap-4 divide-x divide-white/20">
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-100">Total Event Cost</p>
                        <p className="text-xl font-bold">{formatCurrency(totalExpense, currencySymbol)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-emerald-100">Cost Per Person</p>
                        <p className="text-xl font-bold">{formatCurrency(splitAmount, currencySymbol)}</p>
                    </div>
                </div>
            </Card>

            <h3 className="text-sm font-bold text-slate-700 dark:text-white mt-2">Settlement Plan</h3>
            
            {settlements.length > 0 ? (
                <div className="space-y-3">
                    {settlements.map((s, i) => {
                        const isPartialMode = partialMode === s.id;

                        return (
                        <Card key={s.id} className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-slate-400`}>
                                            {s.from.name.charAt(0)}
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300" />
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500`}>
                                            {s.to.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {s.from.id === 'me' ? 'You' : s.from.name} pays {s.to.id === 'me' ? 'You' : s.to.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500">to settle share</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(s.amount, currencySymbol)}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Row */}
                            {isPartialMode ? (
                                <div className="flex gap-2 items-center animate-in slide-in-from-top-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-2.5 text-xs text-slate-400">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-100 dark:bg-slate-900 rounded-xl py-2 pl-7 pr-3 text-sm font-bold outline-none border border-slate-200 dark:border-slate-700" 
                                            placeholder="Amount"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSettle(s, parseFloat(partialAmount) || 0)}
                                        className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => { setPartialMode(null); setPartialAmount(''); }}
                                        className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleSettle(s, s.amount)}
                                        className="flex-1 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-200 transition-colors"
                                    >
                                        <CheckCircle size={12} /> Full Settle
                                    </button>
                                    <button 
                                        onClick={() => setPartialMode(s.id)}
                                        className="flex-1 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors"
                                    >
                                        <CircleDollarSign size={12} /> Partial
                                    </button>
                                    <button 
                                        onClick={() => handleRemind(s)}
                                        className="flex-1 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-200 transition-colors"
                                    >
                                        <Bell size={12} /> Remind
                                    </button>
                                </div>
                            )}
                        </Card>
                    )})}
                </div>
            ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Settled Up!</p>
                    <p className="text-xs text-slate-500">Everyone has paid their fair share.</p>
                </div>
            )}
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
        // If exp.id is passed (from linked shopping list creation), use it. Else generate new.
        const newExpense: EventExpense = {
            id: exp.id || generateId(),
            ...exp,
            date: new Date().toISOString(),
            paidBy: exp.paidBy || 'me' // Default to 'me' if not specified
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

const EventTeamTab = ({ event, onUpdate, currencySymbol }: any) => {
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [editingMember, setEditingMember] = useState<EventMember | null>(null);
    
    const handleAddMember = () => {
        if (!newMemberEmail) return;
        const newMember: EventMember = {
            id: generateId(),
            name: newMemberEmail.split('@')[0],
            role: 'viewer',
            avatar: undefined // Using default logic in avatar rendering
        };
        onUpdate({ ...event, members: [...event.members, newMember] });
        setNewMemberEmail('');
    };

    const handleRemoveMember = (id: string) => {
        if (confirm('Remove this member?')) {
            onUpdate({ ...event, members: event.members.filter((m: any) => m.id !== id) });
        }
    };

    const handleUpdateMemberRole = (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
        const updatedMembers = event.members.map((m: any) => 
            m.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdate({ ...event, members: updatedMembers });
        setEditingMember(null);
    };

    const getMemberContribution = (memberId: string) => {
        return event.expenses
            .filter((e: any) => (e.paidBy === memberId) || (memberId === 'me' && !e.paidBy)) // Handle default 'me'
            .reduce((sum: number, e: any) => sum + e.amount, 0);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Team Members</h3>
                <div className="space-y-3">
                    {event.members.map((member: any) => {
                        const paidAmount = getMemberContribution(member.id);
                        
                        return (
                            <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 capitalize">{member.role}</span>
                                            {paidAmount > 0 && (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                                    Paid: {formatCurrency(paidAmount, currencySymbol)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setEditingMember(member)}
                                        className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    {member.id !== 'me' && (
                                        <button 
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none"
                            placeholder="Email address"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                        <button onClick={handleAddMember} disabled={!newMemberEmail} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
                            Invite
                        </button>
                    </div>
                </div>
            </Card>

            <EditEventMemberModal 
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                onConfirm={handleUpdateMemberRole}
                member={editingMember}
            />

            {/* Added Settlement Section within Team Tab */}
            <div className="my-6 border-t border-slate-200 dark:border-slate-700"></div>
            
            <EventSettlementTab event={event} currencySymbol={currencySymbol} onUpdate={onUpdate} />
        </div>
    );
};

const EventAITab = ({ event }: any) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAskAI = async () => {
        if (!query) return;
        setLoading(true);
        const res = await analyzeEventWithAI(event, query);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            <Card className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={20} className="text-yellow-300" />
                    <h3 className="font-bold">Event AI Planner</h3>
                </div>
                <p className="text-xs text-indigo-100 opacity-90">
                    Ask for budget advice, vendor suggestions, or schedule planning.
                </p>
            </Card>

            <Card className="p-4">
                <div className="space-y-3">
                    <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none resize-none h-24"
                        placeholder="e.g. How can I reduce catering costs?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                        onClick={handleAskAI} 
                        disabled={loading || !query}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Ask AI
                    </button>
                </div>
            </Card>

            {response && (
                <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20">
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">AI Suggestion</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{response}</p>
                </Card>
            )}
        </div>
    );
};

// --- UPDATED ADD EXPENSE MODAL ---
const AddEventExpenseModal = ({ isOpen, onClose, onConfirm, categories, currencySymbol, event, onCreateShoppingList }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories[0]?.name || '');
    const [paidBy, setPaidBy] = useState('me');
    const [shouldCreateList, setShouldCreateList] = useState(false); // New state for checkbox

    useEffect(() => {
        if(isOpen) {
            setName('');
            setAmount('');
            setCategory(categories[0]?.name || '');
            setPaidBy('me');
            setShouldCreateList(false); // Reset checkbox
        }
    }, [isOpen, categories]);

    if(!isOpen) return null;

    const handleSave = () => {
        const newExpenseId = generateId(); // Generate ID here to link
        
        if (shouldCreateList && onCreateShoppingList && event) {
             const listName = `${event.name} - ${name || 'Expense'}`;
             // Pass linked data including the future expense ID
             onCreateShoppingList(listName, parseFloat(amount) || 0, event.members, {
                 eventId: event.id,
                 expenseId: newExpenseId,
                 expenseName: name || 'Expense'
             });
        }
        
        onConfirm({ id: newExpenseId, name, amount: parseFloat(amount), category, paidBy });
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
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs" value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                            <option value="me">Paid by Me</option>
                            {event.members.filter((m:any) => m.id !== 'me').map((m: any) => (
                                <option key={m.id} value={m.id}>Paid by {m.name}</option>
                            ))}
                        </select>
                    </div>
                    
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

// ... other modals ...
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

const EditEventMemberModal = ({ isOpen, onClose, onConfirm, member }: any) => {
    const [role, setRole] = useState(member?.role || 'viewer');
    
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
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
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
