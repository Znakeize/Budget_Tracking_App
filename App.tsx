
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
import { AuthView } from './views/AuthView';
import { MenuView } from './views/MenuView';
import { ToolsView } from './views/ToolsView';
import { SocialView } from './views/SocialView';
import { CollaborativeView } from './views/CollaborativeView';
import { SupportView } from './views/SupportView';
import { LegalView } from './views/LegalView';
import { FeedbackView } from './views/FeedbackView';
import { EventsView, getEventNotifications } from './views/EventsView';
import { LifeSimulatorView } from './views/LifeSimulatorView';
import { PersonalInfoView } from './views/settings/PersonalInfoView';
import { EmailPreferencesView } from './views/settings/EmailPreferencesView';
import { SecurityView } from './views/settings/SecurityView';
import { BudgetData, PeriodType, EventData } from './types';
import { INITIAL_DATA } from './constants';
import { generateId, calculateTotals, getNotifications, NotificationItem } from './utils/calculations';
import { NewPeriodModal } from './components/ui/NewPeriodModal';
import { NotificationPopup } from './components/ui/NotificationPopup';

// Helper to shift a date string to the target month/year while preserving the day
const shiftDate = (dateStr: string, targetMonth: number, targetYear: number) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const newDay = Math.min(day, maxDays);
  const m = (targetMonth + 1).toString().padStart(2, '0');
  const dy = newDay.toString().padStart(2, '0');
  return `${targetYear}-${m}-${dy}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{name: string, email: string, joined: number} | null>(null);
  
  // Budget State
  const [budgetData, setBudgetData] = useState<BudgetData>(INITIAL_DATA);
  const [history, setHistory] = useState<BudgetData[]>([INITIAL_DATA]);
  const [events, setEvents] = useState<EventData[]>([]);
  
  // App State
  const [loaded, setLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [undoStack, setUndoStack] = useState<BudgetData[]>([]);
  const [redoStack, setRedoStack] = useState<BudgetData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useMemo(() => getNotifications(budgetData, history), [budgetData, history]);
  const eventNotifications = useMemo(() => getEventNotifications(events, budgetData.currencySymbol), [events, budgetData.currencySymbol]);

  const [budgetFocusTarget, setBudgetFocusTarget] = useState<{ section: string, itemId: string } | null>(null);
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [calculatedRollover, setCalculatedRollover] = useState(0);
  const [nextPeriodDefaults, setNextPeriodDefaults] = useState({ month: 0, year: 0 });

  useEffect(() => {
    const savedHistory = localStorage.getItem('budgetHistory');
    const savedActiveId = localStorage.getItem('activePeriodId');
    const savedTheme = localStorage.getItem('theme');
    const savedEvents = localStorage.getItem('budgetEvents');
    const savedUser = localStorage.getItem('budget_user_session');

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        const activePeriod = parsedHistory.find((p: BudgetData) => p.id === savedActiveId) || parsedHistory[parsedHistory.length - 1];
        if (activePeriod) setBudgetData(activePeriod);
      } catch (e) { console.error("Failed to parse history", e); }
    }

    if (savedEvents) {
        try { setEvents(JSON.parse(savedEvents)); } catch (e) { console.error("Failed to parse events", e); }
    }

    if (savedUser) {
        try { 
            setUser(JSON.parse(savedUser)); 
            // User logged in, stay on dashboard or whatever default
        } catch (e) { 
            console.error("Failed to parse user", e);
            setActiveTab('auth'); // Error parsing user, force re-auth
        }
    } else {
        // No user session found, redirect to Auth
        setActiveTab('auth');
    }
    
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');

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

  // --- Auth Handlers ---
  const handleLogin = (userData: any) => {
      setUser(userData);
      localStorage.setItem('budget_user_session', JSON.stringify(userData));
      setActiveTab('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('budget_user_session');
      setActiveTab('auth');
  };

  const handleProfileClick = () => {
      if (user) setActiveTab('profile');
      else setActiveTab('auth');
  };

  const handleUpdateUser = (updatedUser: any) => {
      setUser(updatedUser);
      localStorage.setItem('budget_user_session', JSON.stringify(updatedUser));
  };

  // --- Budget Handlers ---
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
        if (!prevHistory.find(h => h.id === newData.id)) updatedHistory.push(newData);
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
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    setNextPeriodDefaults({ month: nextMonth, year: nextYear });
    setIsNewPeriodModalOpen(true);
  };

  const handleCreatePeriod = useCallback((data: { period: PeriodType, month: number, year: number, startDate?: string, endDate?: string, rollover: number }) => {
    setUndoStack([]); setRedoStack([]);
    const newPeriod: BudgetData = {
        ...budgetData, id: generateId(), period: data.period, month: data.month, year: data.year,
        startDate: data.startDate, endDate: data.endDate, created: Date.now(),
        income: budgetData.income.map(i => ({ ...i, actual: 0 })),
        expenses: budgetData.expenses.map(e => ({ ...e, spent: 0 })),
        bills: budgetData.bills.map(b => ({ ...b, paid: false, dueDate: shiftDate(b.dueDate, data.month, data.year) })),
        goals: budgetData.goals.map(g => ({ ...g, checked: false })),
        savings: budgetData.savings.map(s => ({ ...s, paid: false, amount: 0 })),
        debts: budgetData.debts.map(d => ({ ...d, paid: false, payment: d.payment, dueDate: d.dueDate ? shiftDate(d.dueDate, data.month, data.year) : undefined })),
        investments: budgetData.investments.map(i => ({ ...i, contributed: false })),
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
        const newPeriod: BudgetData = { ...periodToDuplicate, id: generateId(), created: Date.now() };
        const newHistory = [...prev, newPeriod];
        localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  }, []);

  const handleDeletePeriod = useCallback((id: string) => {
    if (!window.confirm('Are you sure you want to delete this period?')) return;
    if (history.length <= 1) { alert("Cannot delete the only remaining period."); return; }
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
    if (budgetData.id === id) {
        const sortedRemaining = [...newHistory].sort((a, b) => b.created - a.created);
        const nextActive = sortedRemaining[0];
        if (nextActive) {
            setBudgetData(nextActive); setUndoStack([]); setRedoStack([]);
            localStorage.setItem('activePeriodId', nextActive.id);
        }
    }
  }, [history, budgetData.id]);

  const handleReset = () => {
    localStorage.clear();
    setBudgetData(INITIAL_DATA); setHistory([INITIAL_DATA]); setEvents([]);
    setUndoStack([]); setRedoStack([]); setUser(null);
    window.location.reload();
  };

  const handleNotificationClick = (notif: NotificationItem) => {
      setActiveTab('budget');
      let section = ''; let itemId = '';
      const parts = notif.id.split('-');
      if (notif.category === 'Bill') { section = 'bills'; itemId = notif.id.replace('Bill-', ''); } 
      else if (notif.category === 'Debt') { section = 'debts'; itemId = notif.id.replace('Debt-', ''); } 
      else if (notif.category === 'Budget') {
          section = 'expenses';
          if (notif.id.startsWith('budget-warn-')) itemId = notif.id.replace('budget-warn-', '');
          else if (notif.id.startsWith('budget-over-')) itemId = notif.id.replace('budget-over-', '');
          else itemId = parts[parts.length - 1];
      } else if (notif.category === 'Savings') { section = 'savings'; if (notif.id === 'savings-win') section = 'savings'; }
      if (section) setBudgetFocusTarget({ section, itemId });
      setShowNotifications(false);
  };

  const handleApplyScenario = (changes: Partial<BudgetData>) => {
      const updated = { ...budgetData, ...changes };
      handleUpdateBudget(updated);
      setActiveTab('budget');
  };

  if (!loaded) return <div className="h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;

  const isMenuSubView = ['history', 'tools', 'settings', 'support', 'legal', 'feedback', 'collaborative', 'profile', 'personal-info', 'email-prefs', 'security'].includes(activeTab);

  return (
    <Layout>
      <main className="flex-1 flex flex-col relative z-10 h-full">
        {activeTab === 'auth' && (
            <AuthView onLogin={handleLogin} onBack={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'dashboard' && (
            <DashboardView 
                data={budgetData} 
                setTab={setActiveTab} 
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'budget' && (
            <BudgetView 
                data={budgetData} 
                updateData={handleUpdateBudget} 
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onUndo={handleUndo} onRedo={handleRedo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}
                focusTarget={budgetFocusTarget} clearFocusTarget={() => setBudgetFocusTarget(null)}
                onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'ai' && (
            <AIView 
                history={history} currencySymbol={budgetData.currencySymbol} notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                onViewAnalysis={() => setActiveTab('analysis')} onViewInvestments={() => setActiveTab('investments')}
                onViewSocial={() => setActiveTab('social')} onViewEvents={() => setActiveTab('events')}
                onViewSimulator={() => setActiveTab('simulator')} eventNotificationCount={eventNotifications.length}
                onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'analysis' && (
            <AnalysisView 
                history={history} currencySymbol={budgetData.currencySymbol} notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)} onBack={() => setActiveTab('ai')}
                onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'investments' && (
            <InvestmentAnalysisView 
                history={history} currencySymbol={budgetData.currencySymbol} onBack={() => setActiveTab('ai')}
                onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'social' && (
            <SocialView currencySymbol={budgetData.currencySymbol} onBack={() => setActiveTab('ai')} onProfileClick={handleProfileClick} />
        )}
        {activeTab === 'collaborative' && (
            <CollaborativeView onBack={() => setActiveTab('menu')} onProfileClick={handleProfileClick} />
        )}
        {activeTab === 'events' && (
            <EventsView 
                events={events} onUpdateEvents={handleUpdateEvents} currencySymbol={budgetData.currencySymbol}
                onBack={() => setActiveTab('ai')} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'simulator' && (
            <LifeSimulatorView 
                currentData={budgetData} currencySymbol={budgetData.currencySymbol} onBack={() => setActiveTab('ai')}
                onApplyScenario={handleApplyScenario} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'menu' && (
            <MenuView 
                onNavigate={setActiveTab} notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'profile' && (
            <ProfileView 
                user={user}
                onLogout={handleLogout}
                onBack={() => setActiveTab('menu')}
                onNavigate={setActiveTab}
                notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
            />
        )}
        {activeTab === 'personal-info' && (
            <PersonalInfoView 
                user={user} onUpdateUser={handleUpdateUser} onBack={() => setActiveTab('profile')} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'email-prefs' && (
            <EmailPreferencesView 
                onBack={() => setActiveTab('profile')} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'security' && (
            <SecurityView 
                onBack={() => setActiveTab('profile')} onProfileClick={handleProfileClick}
            />
        )}
        {activeTab === 'support' && <SupportView onBack={() => setActiveTab('menu')} />}
        {activeTab === 'legal' && <LegalView onBack={() => setActiveTab('menu')} />}
        {activeTab === 'feedback' && <FeedbackView onBack={() => setActiveTab('menu')} />}
        {activeTab === 'history' && (
            <HistoryView 
                currentData={budgetData} history={history} 
                onLoadPeriod={(id) => {
                    const selected = history.find(h => h.id === id);
                    if(selected) { setBudgetData(selected); setUndoStack([]); setRedoStack([]); setActiveTab('dashboard'); localStorage.setItem('activePeriodId', selected.id); }
                }}
                onCreateNewPeriod={handleOpenNewPeriodModal} onDeletePeriod={handleDeletePeriod} onDuplicatePeriod={handleDuplicatePeriod}
                notificationCount={notifications.length} onToggleNotifications={() => setShowNotifications(!showNotifications)}
                updateData={handleUpdateBudget} resetData={handleReset} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)}
                onBack={() => setActiveTab('menu')}
            />
        )}
        {(activeTab === 'tools' || activeTab === 'settings') && (
            <ToolsView 
                data={budgetData} updateData={handleUpdateBudget} resetData={handleReset} isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)} notificationCount={notifications.length}
                onToggleNotifications={() => setShowNotifications(!showNotifications)} onBack={() => setActiveTab('menu')}
                initialTab={activeTab === 'settings' ? 'settings' : 'tools'}
            />
        )}
      </main>
      
      {activeTab !== 'auth' && (
          <Navigation 
            activeTab={isMenuSubView || activeTab === 'menu' ? 'menu' : (['analysis', 'investments', 'social', 'events', 'simulator'].includes(activeTab) ? 'ai' : activeTab)} 
            onTabChange={setActiveTab} 
            onAdd={handleOpenNewPeriodModal} 
            badgeTabs={eventNotifications.length > 0 ? ['ai'] : []}
          />
      )}
      
      <NewPeriodModal 
        isOpen={isNewPeriodModalOpen} onClose={() => setIsNewPeriodModalOpen(false)} onConfirm={handleCreatePeriod}
        defaultMonth={nextPeriodDefaults.month} defaultYear={nextPeriodDefaults.year} calculatedRollover={calculatedRollover} currencySymbol={budgetData.currencySymbol}
      />

      {showNotifications && (
        <NotificationPopup 
            notifications={notifications} onClose={() => setShowNotifications(false)} onNotificationClick={handleNotificationClick}
        />
      )}
    </Layout>
  );
};

export default App;
