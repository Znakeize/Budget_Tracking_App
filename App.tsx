
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { BudgetView } from './views/BudgetView';
import { HistoryView } from './views/HistoryView';
import { AnalysisView } from './views/AnalysisView';
import { InvestmentAnalysisView } from './views/InvestmentAnalysisView';
import { AIView } from './views/AIView';
import { ProfileView } from './views/ProfileView';
import { ToolsView } from './views/ToolsView';
import { SocialView } from './views/SocialView';
import { CollaborativeView } from './views/CollaborativeView';
import { SupportView } from './views/SupportView';
import { LegalView } from './views/LegalView';
import { FeedbackView } from './views/FeedbackView';
import { EventsView, getEventNotifications } from './views/EventsView';
import { LifeSimulatorView } from './views/LifeSimulatorView';
import { BudgetData, PeriodType, EventData } from './types';
import { INITIAL_DATA } from './constants';
import { generateId, calculateTotals, getNotifications, NotificationItem } from './utils/calculations';
import { NewPeriodModal } from './components/ui/NewPeriodModal';
import { NotificationPopup } from './components/ui/NotificationPopup';

// Helper to shift a date string to the target month/year while preserving the day
const shiftDate = (dateStr: string, targetMonth: number, targetYear: number) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // Use UTC to avoid timezone issues for YYYY-MM-DD
  const day = d.getUTCDate();
  
  // Calculate max days in target month
  // Month is 0-indexed in JS Date constructor for 'days in month' trick (day=0 of next month)
  // targetMonth + 1 is the next month
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const newDay = Math.min(day, maxDays);
  
  const m = (targetMonth + 1).toString().padStart(2, '0');
  const dy = newDay.toString().padStart(2, '0');
  return `${targetYear}-${m}-${dy}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetData, setBudgetData] = useState<BudgetData>(INITIAL_DATA);
  const [history, setHistory] = useState<BudgetData[]>([INITIAL_DATA]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [undoStack, setUndoStack] = useState<BudgetData[]>([]);
  const [redoStack, setRedoStack] = useState<BudgetData[]>([]);

  const [showNotifications, setShowNotifications] = useState(false);
  // Pass history to getNotifications for smart alerts
  const notifications = useMemo(() => getNotifications(budgetData, history), [budgetData, history]);
  const eventNotifications = useMemo(() => getEventNotifications(events, budgetData.currencySymbol), [events, budgetData.currencySymbol]);

  // Navigation Target for Deep Linking
  const [budgetFocusTarget, setBudgetFocusTarget] = useState<{ section: string, itemId: string } | null>(null);

  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [calculatedRollover, setCalculatedRollover] = useState(0);
  const [nextPeriodDefaults, setNextPeriodDefaults] = useState({ month: 0, year: 0 });

  useEffect(() => {
    const savedHistory = localStorage.getItem('budgetHistory');
    const savedActiveId = localStorage.getItem('activePeriodId');
    const savedTheme = localStorage.getItem('theme');
    const savedEvents = localStorage.getItem('budgetEvents');

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        
        const activePeriod = parsedHistory.find((p: BudgetData) => p.id === savedActiveId) || parsedHistory[parsedHistory.length - 1];
        if (activePeriod) {
            setBudgetData(activePeriod);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    if (savedEvents) {
        try {
            const parsedEvents = JSON.parse(savedEvents);
            setEvents(parsedEvents);
        } catch (e) {
            console.error("Failed to parse events", e);
        }
    } else {
        // Sample Event Initialization if none exists
        const sampleEvent: EventData = {
                id: generateId(),
                name: "Dream Wedding 2025",
                type: "Wedding",
                date: "2025-08-15",
                location: "Crystal Lake Resort",
                totalBudget: 45000,
                currencySymbol: "$",
                categories: [
                    { id: generateId(), name: "Venue & Food", allocated: 20000, color: "#ec4899" },
                    { id: generateId(), name: "Attire", allocated: 5000, color: "#8b5cf6" },
                    { id: generateId(), name: "Photography", allocated: 3500, color: "#f59e0b" },
                    { id: generateId(), name: "Music", allocated: 2000, color: "#10b981" },
                    { id: generateId(), name: "Decor", allocated: 4000, color: "#06b6d4" },
                    { id: generateId(), name: "Officiant", allocated: 500, color: "#6366f1" }
                ],
                expenses: [
                     { id: generateId(), name: "Venue Deposit", amount: 5000, category: "Venue & Food", date: new Date(Date.now() - 86400000 * 30).toISOString() },
                     { id: generateId(), name: "Wedding Dress Deposit", amount: 1500, category: "Attire", date: new Date(Date.now() - 86400000 * 15).toISOString() },
                     { id: generateId(), name: "Save the Dates", amount: 300, category: "Decor", date: new Date(Date.now() - 86400000 * 45).toISOString() }
                ],
                vendors: [
                    { id: generateId(), name: "Crystal Lake Events", service: "Venue", totalAmount: 20000, paidAmount: 5000, status: 'partial', dueDate: "2025-07-01", contact: "events@crystallake.com" },
                    { id: generateId(), name: "Captured Moments", service: "Photography", totalAmount: 3500, paidAmount: 0, status: 'pending', dueDate: "2025-06-15", contact: "mike@captured.com" },
                    { id: generateId(), name: "Bridal Boutique", service: "Attire", totalAmount: 3000, paidAmount: 1500, status: 'partial', dueDate: "2025-05-01" },
                    { id: generateId(), name: "DJ Spin", service: "Music", totalAmount: 1800, paidAmount: 0, status: 'pending', dueDate: "2025-07-15" }
                ],
                members: [
                    { id: "me", name: "You", role: "admin", avatar: "" },
                    { id: "partner", name: "Jamie", role: "editor", avatar: "" }
                ],
                notes: "Guest list finalized at 120. Need to choose cake flavor by next month.",
                created: Date.now(),
                theme: "pastel"
            };
        setEvents([sampleEvent]);
    }
    
    if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleUpdateBudget = useCallback((newData: BudgetData) => {
    setUndoStack(prev => {
        const newStack = [...prev, budgetData];
        if (newStack.length > 50) newStack.shift();
        return newStack;
    });
    setRedoStack([]);

    setBudgetData(newData);
    
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(h => h.id === newData.id ? newData : h);
        if (!prevHistory.find(h => h.id === newData.id)) {
            updatedHistory.push(newData);
        }
        localStorage.setItem('budgetHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
    });
  }, [budgetData]);

  const handleUpdateEvents = useCallback((newEvents: EventData[]) => {
      setEvents(newEvents);
      localStorage.setItem('budgetEvents', JSON.stringify(newEvents));
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack(prev => [...prev, budgetData]);
    setUndoStack(newUndoStack);
    setBudgetData(previousState);

    setHistory(prev => {
        const updated = prev.map(h => h.id === previousState.id ? previousState : h);
        localStorage.setItem('budgetHistory', JSON.stringify(updated));
        return updated;
    });
  }, [undoStack, budgetData]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack(prev => [...prev, budgetData]);
    setRedoStack(newRedoStack);
    setBudgetData(nextState);

    setHistory(prev => {
        const updated = prev.map(h => h.id === nextState.id ? nextState : h);
        localStorage.setItem('budgetHistory', JSON.stringify(updated));
        return updated;
    });
  }, [redoStack, budgetData]);

  const handleOpenNewPeriodModal = () => {
    const totals = calculateTotals(budgetData);
    setCalculatedRollover(totals.leftToSpend);
    
    let nextMonth = budgetData.month + 1;
    let nextYear = budgetData.year;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
    }
    setNextPeriodDefaults({ month: nextMonth, year: nextYear });
    
    setIsNewPeriodModalOpen(true);
  };

  const handleCreatePeriod = useCallback((data: { period: PeriodType, month: number, year: number, startDate?: string, endDate?: string, rollover: number }) => {
    setUndoStack([]);
    setRedoStack([]);

    const newPeriod: BudgetData = {
        ...budgetData,
        id: generateId(),
        period: data.period,
        month: data.month,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        created: Date.now(),
        income: budgetData.income.map(i => ({ ...i, actual: 0 })),
        expenses: budgetData.expenses.map(e => ({ ...e, spent: 0 })),
        bills: budgetData.bills.map(b => ({ 
            ...b, 
            paid: false,
            dueDate: shiftDate(b.dueDate, data.month, data.year)
        })),
        savings: budgetData.savings, 
        debts: budgetData.debts.map(d => ({ 
            ...d, 
            payment: 0,
            dueDate: d.dueDate ? shiftDate(d.dueDate, data.month, data.year) : undefined
        })),
        investments: budgetData.investments, 
        rollover: data.rollover
    };

    setBudgetData(newPeriod);
    setHistory(prev => {
        const newHistory = [...prev, newPeriod];
        localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
        return newHistory;
    });
    localStorage.setItem('activePeriodId', newPeriod.id);
    setActiveTab('dashboard');
    setIsNewPeriodModalOpen(false);
  }, [budgetData]);

  const handleDuplicatePeriod = useCallback((id: string) => {
    setHistory(prev => {
        const periodToDuplicate = prev.find(h => h.id === id);
        if (!periodToDuplicate) return prev;

        const newPeriod: BudgetData = {
          ...periodToDuplicate,
          id: generateId(),
          created: Date.now(),
        };

        const newHistory = [...prev, newPeriod];
        localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  }, []);

  const handleDeletePeriod = useCallback((id: string) => {
    if (!window.confirm('Are you sure you want to delete this period? This action cannot be undone.')) return;
    
    if (history.length <= 1) {
        alert("Cannot delete the only remaining period.");
        return;
    }

    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
    
    if (budgetData.id === id) {
        const sortedRemaining = [...newHistory].sort((a, b) => b.created - a.created);
        const nextActive = sortedRemaining[0];
        
        if (nextActive) {
            setBudgetData(nextActive);
            setUndoStack([]);
            setRedoStack([]);
            localStorage.setItem('activePeriodId', nextActive.id);
        }
    }
  }, [history, budgetData.id]);

  const handleReset = () => {
    localStorage.clear();
    setBudgetData(INITIAL_DATA);
    setHistory([INITIAL_DATA]);
    setEvents([]);
    setUndoStack([]);
    setRedoStack([]);
    window.location.reload();
  };

  const handleNotificationClick = (notif: NotificationItem) => {
      setActiveTab('budget');
      
      let section = '';
      let itemId = '';

      const parts = notif.id.split('-');
      
      if (notif.category === 'Bill') {
          section = 'bills';
          itemId = notif.id.replace('Bill-', '');
      } else if (notif.category === 'Debt') {
          section = 'debts';
          itemId = notif.id.replace('Debt-', '');
      } else if (notif.category === 'Budget') {
          section = 'expenses';
          if (notif.id.startsWith('budget-warn-')) itemId = notif.id.replace('budget-warn-', '');
          else if (notif.id.startsWith('budget-over-')) itemId = notif.id.replace('budget-over-', '');
          else itemId = parts[parts.length - 1];
      } else if (notif.category === 'Savings') {
          section = 'savings';
          if (notif.id === 'savings-win') section = 'savings';
      }

      if (section) {
          setBudgetFocusTarget({ section, itemId });
      }
      setShowNotifications(false);
  };

  const handleApplyScenario = (changes: Partial<BudgetData>) => {
      const updated = { ...budgetData, ...changes };
      handleUpdateBudget(updated);
      setActiveTab('budget');
  };

  if (!loaded) return <div className="h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <Layout>
      <main className="flex-1 flex flex-col relative z-10 h-full">
        {activeTab === 'dashboard' && (
            <DashboardView 
                data={budgetData} 
                setTab={setActiveTab} 
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
            />
        )}
        {activeTab === 'budget' && (
            <BudgetView 
                data={budgetData} 
                updateData={handleUpdateBudget} 
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                focusTarget={budgetFocusTarget}
                clearFocusTarget={() => setBudgetFocusTarget(null)}
            />
        )}
        {activeTab === 'ai' && (
            <AIView 
                history={history} 
                currencySymbol={budgetData.currencySymbol}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onViewAnalysis={() => setActiveTab('analysis')}
                onViewInvestments={() => setActiveTab('investments')}
                onViewSocial={() => setActiveTab('social')}
                onViewEvents={() => setActiveTab('events')}
                onViewSimulator={() => setActiveTab('simulator')}
                eventNotificationCount={eventNotifications.length}
            />
        )}
        {activeTab === 'analysis' && (
            <AnalysisView 
                history={history} 
                currencySymbol={budgetData.currencySymbol}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)} 
                onBack={() => setActiveTab('ai')}
            />
        )}
        {activeTab === 'investments' && (
            <InvestmentAnalysisView 
                history={history} 
                currencySymbol={budgetData.currencySymbol}
                onBack={() => setActiveTab('ai')}
            />
        )}
        {activeTab === 'social' && (
            <SocialView 
                currencySymbol={budgetData.currencySymbol}
                onBack={() => setActiveTab('ai')}
            />
        )}
        {activeTab === 'collaborative' && (
            <CollaborativeView 
                onBack={() => setActiveTab('profile')}
            />
        )}
        {activeTab === 'events' && (
            <EventsView 
                events={events}
                onUpdateEvents={handleUpdateEvents}
                currencySymbol={budgetData.currencySymbol}
                onBack={() => setActiveTab('ai')}
            />
        )}
        {activeTab === 'simulator' && (
            <LifeSimulatorView 
                currentData={budgetData}
                currencySymbol={budgetData.currencySymbol}
                onBack={() => setActiveTab('ai')}
                onApplyScenario={handleApplyScenario}
            />
        )}
        {activeTab === 'profile' && (
            <ProfileView 
                onNavigate={setActiveTab}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
            />
        )}
        {activeTab === 'support' && (
            <SupportView onBack={() => setActiveTab('profile')} />
        )}
        {activeTab === 'legal' && (
            <LegalView onBack={() => setActiveTab('profile')} />
        )}
        {activeTab === 'feedback' && (
            <FeedbackView onBack={() => setActiveTab('profile')} />
        )}
        {activeTab === 'history' && (
            <HistoryView 
                currentData={budgetData} 
                history={history} 
                onLoadPeriod={(id) => {
                    const selected = history.find(h => h.id === id);
                    if(selected) { 
                        setBudgetData(selected); 
                        setUndoStack([]);
                        setRedoStack([]);
                        setActiveTab('dashboard'); 
                        localStorage.setItem('activePeriodId', selected.id);
                    }
                }}
                onCreateNewPeriod={handleOpenNewPeriodModal}
                onDeletePeriod={handleDeletePeriod}
                onDuplicatePeriod={handleDuplicatePeriod}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                updateData={handleUpdateBudget}
                resetData={handleReset}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                onBack={() => setActiveTab('profile')}
            />
        )}
        {(activeTab === 'tools' || activeTab === 'settings') && (
            <ToolsView 
                data={budgetData}
                updateData={handleUpdateBudget}
                resetData={handleReset}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onBack={() => setActiveTab('profile')}
                initialTab={activeTab === 'settings' ? 'settings' : 'tools'}
            />
        )}
      </main>
      
      <Navigation 
        activeTab={['history', 'tools', 'settings', 'profile', 'support', 'legal', 'feedback', 'collaborative'].includes(activeTab) ? 'profile' : (['analysis', 'investments', 'social', 'events', 'simulator'].includes(activeTab) ? 'ai' : activeTab)} 
        onTabChange={setActiveTab} 
        onAdd={handleOpenNewPeriodModal} 
        badgeTabs={eventNotifications.length > 0 ? ['ai'] : []}
      />
      
      <NewPeriodModal 
        isOpen={isNewPeriodModalOpen}
        onClose={() => setIsNewPeriodModalOpen(false)}
        onConfirm={handleCreatePeriod}
        defaultMonth={nextPeriodDefaults.month}
        defaultYear={nextPeriodDefaults.year}
        calculatedRollover={calculatedRollover}
        currencySymbol={budgetData.currencySymbol}
      />

      {showNotifications && (
        <NotificationPopup 
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onNotificationClick={handleNotificationClick}
        />
      )}
    </Layout>
  );
};

export default App;
