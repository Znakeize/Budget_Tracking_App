
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { BudgetView } from './views/BudgetView';
import { AIView } from './views/AIView';
import { ToolsView } from './views/ToolsView';
import { HistoryView } from './views/HistoryView';
import { EventsView } from './views/EventsView';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { ShoppingListView } from './views/ShoppingListView';
import { CollaborativeView } from './views/CollaborativeView';
import { InvestmentAnalysisView } from './views/InvestmentAnalysisView';
import { LifeSimulatorView } from './views/LifeSimulatorView';
import { MenuView } from './views/MenuView';
import { AnalysisView } from './views/AnalysisView';
import { SupportView } from './views/SupportView';
import { LegalView } from './views/LegalView';
import { FeedbackView } from './views/FeedbackView';
import { ProMembershipView } from './views/ProMembershipView';
import { MembershipManagementView } from './views/MembershipManagementView';
import { FeatureSubscriptionView } from './views/FeatureSubscriptionView';
import { PersonalInfoView } from './views/settings/PersonalInfoView';
import { EmailPreferencesView } from './views/settings/EmailPreferencesView';
import { SecurityView } from './views/settings/SecurityView';
import { AdvancedCalculatorsView } from './views/AdvancedCalculatorsView';
import { CommunityLinksView } from './views/CommunityLinksView';
import { AppDemoView } from './views/AppDemoView';

import { NotificationPopup } from './components/ui/NotificationPopup';
import { NewPeriodModal } from './components/ui/NewPeriodModal';
import { RolloverModal } from './components/ui/RolloverModal';

import { BudgetData, ShoppingListData, EventData, SharedGroup, InvestmentGoal, InvestmentAlert, EventMember, Shop } from './types';
import { INITIAL_DATA, SAMPLE_EVENTS, SAMPLE_SHOPPING_LISTS, MOCK_GROUPS, SAMPLE_INVESTMENT_GOALS } from './constants';
import { getNotifications, calculateTotals, generateId } from './utils/calculations';
import { LanguageProvider } from './contexts/LanguageContext';

// Tabs that show the bottom navigation bar
const showNavTabs = [
  'dashboard', 'budget', 'ai', 'menu', 
  'tools', 'settings', 'history', 'events', 
  'profile', 'shopping-list', 'social', 
  'investments', 'simulator', 'analysis', 
  'support', 'legal', 'feedback', 
  'pro-membership', 'membership-management', 
  'personal-info', 'email-prefs', 'security', 
  'calculators', 'community-links', 'app-demo'
];

const getNavTab = (tab: string) => {
  if (['dashboard'].includes(tab)) return 'dashboard';
  if (['budget'].includes(tab)) return 'budget';
  if (['ai', 'analysis', 'investments', 'events', 'simulator', 'social'].includes(tab)) return 'ai';
  return 'menu';
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navHistory, setNavHistory] = useState<string[]>([]); // Stack-based navigation history
  const [appDemoTab, setAppDemoTab] = useState('calculators'); // Persist App Demo Tab state

  // Initialize state from Local Storage or fallback to defaults
  const [budgetData, setBudgetData] = useState<BudgetData>(() => {
    const saved = localStorage.getItem('budget_current');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [history, setHistory] = useState<BudgetData[]>(() => {
    const saved = localStorage.getItem('budget_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [shoppingLists, setShoppingLists] = useState<ShoppingListData[]>(() => {
    const saved = localStorage.getItem('budget_shopping');
    return saved ? JSON.parse(saved) : SAMPLE_SHOPPING_LISTS;
  });

  const [events, setEvents] = useState<EventData[]>(() => {
    const saved = localStorage.getItem('budget_events');
    return saved ? JSON.parse(saved) : SAMPLE_EVENTS;
  });

  const [groups, setGroups] = useState<SharedGroup[]>(() => {
    const saved = localStorage.getItem('budget_groups');
    return saved ? JSON.parse(saved) : MOCK_GROUPS;
  });

  const [investmentGoals, setInvestmentGoals] = useState<InvestmentGoal[]>(() => {
    const saved = localStorage.getItem('budget_invest_goals');
    return saved ? JSON.parse(saved) : SAMPLE_INVESTMENT_GOALS;
  });

  const [investmentAlerts, setInvestmentAlerts] = useState<InvestmentAlert[]>(() => {
    const saved = localStorage.getItem('budget_invest_alerts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  
  // Feature focus states
  const [shoppingFocus, setShoppingFocus] = useState<{listId: string, shopId?: string} | null>(null);
  const [eventFocus, setEventFocus] = useState<string | undefined>(undefined);
  const [budgetFocus, setBudgetFocus] = useState<{section: string, itemId: string} | null>(null);
  const [featureViewId, setFeatureViewId] = useState<string | null>(null);

  // Modals
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [calculatedRollover, setCalculatedRollover] = useState(0);

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<BudgetData[]>([]);
  const [redoStack, setRedoStack] = useState<BudgetData[]>([]);

  // Init
  useEffect(() => {
    // Load user session
    const savedUser = localStorage.getItem('budget_user_session');
    if (savedUser) setUser(JSON.parse(savedUser));

    // Load theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
      if (isDarkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('budget_current', JSON.stringify(budgetData));
  }, [budgetData]);

  useEffect(() => {
    localStorage.setItem('budget_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('budget_shopping', JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  useEffect(() => {
    localStorage.setItem('budget_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('budget_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('budget_invest_goals', JSON.stringify(investmentGoals));
  }, [investmentGoals]);

  useEffect(() => {
    localStorage.setItem('budget_invest_alerts', JSON.stringify(investmentAlerts));
  }, [investmentAlerts]);

  // --- Navigation Logic ---

  // Standard navigation (drill-down) - pushes to history
  const navigate = (tab: string) => {
      if (tab === activeTab) return;
      setNavHistory(prev => [...prev, activeTab]);
      setActiveTab(tab);
  };

  // Back button - pops from history
  const goBack = (defaultTab: string = 'dashboard') => {
      if (navHistory.length > 0) {
          const newHistory = [...navHistory];
          const prevTab = newHistory.pop();
          setNavHistory(newHistory);
          setActiveTab(prevTab || defaultTab);
      } else {
          setActiveTab(defaultTab);
      }
  };

  // Root tab switch (bottom nav) - clears history
  const handleTabSwitch = (tab: string) => {
      setNavHistory([]);
      setActiveTab(tab);
  };

  // Handle redirect for 'add' tab (prevents render side-effect)
  useEffect(() => {
    if (activeTab === 'add') {
      handleTabSwitch('budget');
    }
  }, [activeTab]);

  const handleUpdateData = (newData: BudgetData, addToHistory = true) => {
      if (addToHistory) {
          setUndoStack(prev => [...prev, budgetData]);
          setRedoStack([]);
      }
      setBudgetData(newData);
  };

  const handleUndo = () => {
      if (undoStack.length === 0) return;
      const previous = undoStack[undoStack.length - 1];
      const newUndo = undoStack.slice(0, -1);
      setRedoStack(prev => [budgetData, ...prev]);
      setBudgetData(previous);
      setUndoStack(newUndo);
  };

  const handleRedo = () => {
      if (redoStack.length === 0) return;
      const next = redoStack[0];
      const newRedo = redoStack.slice(1);
      setUndoStack(prev => [...prev, budgetData]);
      setBudgetData(next);
      setRedoStack(newRedo);
  };

  const handleProfileClick = () => {
      navigate('profile');
  };

  const handleLogin = (userData: any) => {
      setUser(userData);
      localStorage.setItem('budget_user_session', JSON.stringify(userData));
      handleTabSwitch('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('budget_user_session');
      handleTabSwitch('dashboard');
  };

  const notifications = useMemo(() => {
      const all = getNotifications(budgetData, history);
      return all.filter(n => !dismissedNotifIds.includes(n.id));
  }, [budgetData, history, dismissedNotifIds]);

  const handleDismissNotification = (id: string) => {
      setDismissedNotifIds(prev => [...prev, id]);
  };

  const handleNotificationClick = (item: any) => {
      setShowNotifications(false);
      if (item.category === 'Budget' || item.category === 'Bill' || item.category === 'Debt') {
          handleTabSwitch('budget');
          if (item.id) {
              const [type, id] = item.id.split('-');
              if (type && id) setBudgetFocus({ section: type.toLowerCase() + 's', itemId: item.id });
          }
      } else if (item.category === 'Shopping') {
          navigate('shopping-list');
          if (item.data) setShoppingFocus(item.data);
      } else if (item.category === 'Event') {
          navigate('events');
      } else if (item.category === 'Investment') {
          navigate('investments');
      } else if (item.category === 'Collaboration') {
          navigate('social');
      }
  };

  // Feature Handlers
  const handleSyncShoppingToBudget = (amount: number, shopName: string) => {
      // Add as expense
      const newExpense = {
          id: generateId(),
          name: shopName,
          budgeted: amount,
          spent: amount
      };
      handleUpdateData({
          ...budgetData,
          expenses: [...budgetData.expenses, newExpense]
      });
      alert(`Synced ${budgetData.currencySymbol}${amount} to Budget as "${shopName}"`);
  };

  // New Handler for Granular Shopping Item Sync (Budget + Events + Groups)
  const handleShoppingItemChange = (amount: number, categoryName?: string, eventId?: string, expenseId?: string, groupId?: string, groupExpenseId?: string) => {
      // 1. Budget Category Sync
      if (categoryName) {
          const categoryIndex = budgetData.expenses.findIndex(e => e.name === categoryName);
          if (categoryIndex >= 0) {
              const updatedExpenses = [...budgetData.expenses];
              const newSpent = Math.max(0, updatedExpenses[categoryIndex].spent + amount);
              updatedExpenses[categoryIndex] = {
                  ...updatedExpenses[categoryIndex],
                  spent: newSpent
              };
              handleUpdateData({ ...budgetData, expenses: updatedExpenses }, false); // False to avoid heavy history stack for rapid toggles
          }
      }

      // 2. Event Expense Sync
      if (eventId && expenseId) {
          const eventIndex = events.findIndex(e => e.id === eventId);
          if (eventIndex >= 0) {
              const event = events[eventIndex];
              const expenseIndex = event.expenses.findIndex(e => e.id === expenseId);
              if (expenseIndex >= 0) {
                  const updatedExpenses = [...event.expenses];
                  const newAmount = Math.max(0, updatedExpenses[expenseIndex].amount + amount);
                  updatedExpenses[expenseIndex] = {
                      ...updatedExpenses[expenseIndex],
                      amount: newAmount
                  };
                  
                  const updatedEvents = [...events];
                  updatedEvents[eventIndex] = {
                      ...event,
                      expenses: updatedExpenses
                  };
                  setEvents(updatedEvents);
              }
          }
      }

      // 3. Collaboration Group Expense Sync
      if (groupId && groupExpenseId) {
          const groupIndex = groups.findIndex(g => g.id === groupId);
          if (groupIndex >= 0) {
              const group = groups[groupIndex];
              const expenseIndex = group.expenses.findIndex(e => e.id === groupExpenseId);
              if (expenseIndex >= 0) {
                  const updatedExpenses = [...group.expenses];
                  const newAmount = Math.max(0, updatedExpenses[expenseIndex].amount + amount);
                  updatedExpenses[expenseIndex] = {
                      ...updatedExpenses[expenseIndex],
                      amount: newAmount
                  };

                  const updatedGroups = [...groups];
                  updatedGroups[groupIndex] = {
                      ...group,
                      expenses: updatedExpenses
                  };
                  setGroups(updatedGroups);
              }
          }
      }
  };

  const handleCreateShoppingList = (name: string, budget: number, members: EventMember[] = [], redirect: boolean = true, linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string}) => {
      const shopName = linkedData ? linkedData.expenseName : 'General Items';
      
      const defaultShop: Shop = {
          id: generateId(),
          name: shopName,
          items: [],
          budget: budget,
          budgetCategory: undefined,
          eventId: linkedData?.eventId,
          expenseId: linkedData?.expenseId,
          groupId: linkedData?.groupId,
          groupExpenseId: linkedData?.groupExpenseId
      };

      const newList: ShoppingListData = {
          id: generateId(),
          name: name,
          shops: [defaultShop],
          members: [
              { id: 'me', name: 'You', role: 'owner', avatarColor: 'bg-indigo-500' },
              ...members.map(m => ({
                  id: m.id,
                  name: m.name,
                  role: 'editor' as const, // explicitly typing as const or cast to specific type
                  avatarColor: m.avatar || 'bg-slate-500'
              }))
          ],
          created: Date.now(),
          currencySymbol: budgetData.currencySymbol,
          color: 'bg-emerald-500',
          budget: budget,
          lastModified: Date.now()
      };
      setShoppingLists([...shoppingLists, newList]);
      
      if (redirect) {
          navigate('shopping-list');
          setShoppingFocus({ listId: newList.id, shopId: defaultShop.id });
      } else {
          // Provide visual feedback if not redirecting
          setTimeout(() => alert(`Shopping List "${name}" created! Check the Shopping tab.`), 100);
      }
  };

  // Rollover Logic
  const handleCreateNewPeriod = () => {
      const totals = calculateTotals(budgetData);
      setCalculatedRollover(totals.leftToSpend);
      setShowRolloverModal(true);
  };

  const confirmRollover = (amount: number) => {
      setShowRolloverModal(false);
      setCalculatedRollover(amount);
      setShowNewPeriodModal(true);
  };

  const finalizeNewPeriod = (data: any) => {
      // Archive current
      setHistory([...history, budgetData]);
      
      // Create new
      const newPeriod: BudgetData = {
          ...INITIAL_DATA, // Start fresh structure
          id: generateId(),
          period: data.period,
          month: data.month,
          year: data.year,
          startDate: data.startDate,
          endDate: data.endDate,
          rollover: data.rollover,
          currency: budgetData.currency,
          currencySymbol: budgetData.currencySymbol,
          // Copy over recurring items usually, but for now we reset or copy selected
          bills: budgetData.bills.map(b => ({ ...b, paid: false })), // Reset paid status
          goals: budgetData.goals.map(g => ({ ...g, checked: false })), // Keep goals but uncheck them
          debts: budgetData.debts.map(d => ({ ...d, paid: false })),
          income: budgetData.income.map(i => ({ ...i, actual: 0 })), // Keep planned income, reset actuals
          expenses: budgetData.expenses.map(e => ({ ...e, spent: 0 })), // Reset spent
          investments: budgetData.investments.map(i => ({ ...i, contributed: false })),
          savings: budgetData.savings.map(s => ({ ...s, amount: 0, paid: false })),
          created: Date.now()
      };
      
      setBudgetData(newPeriod);
      setShowNewPeriodModal(false);
      handleTabSwitch('dashboard');
  };

  const handleViewFeature = (featureId: string) => {
      setFeatureViewId(featureId);
  };

  // Render Logic
  const renderContent = () => {
      // Full screen views (no nav bar)
      if (!user && activeTab !== 'auth') return <AuthView onLogin={handleLogin} onBack={() => {}} />;
      
      if (featureViewId) {
          return <FeatureSubscriptionView 
              featureId={featureViewId} 
              onBack={() => setFeatureViewId(null)} 
              onSubscribe={(fid) => {
                  // Mock unlock
                  const updatedUser = { ...user, unlockedFeatures: [...(user.unlockedFeatures || []), fid] };
                  setUser(updatedUser);
                  localStorage.setItem('budget_user_session', JSON.stringify(updatedUser));
              }} 
              onOpenFeature={(fid) => {
                  setFeatureViewId(null);
                  if (fid === 'simulator') navigate('simulator');
                  else if (fid === 'analysis') navigate('analysis');
                  else if (fid === 'investments') navigate('investments');
                  else if (fid === 'events') navigate('events');
                  else if (fid === 'social') navigate('social');
                  else if (fid === 'business') navigate('calculators'); // Leads to advanced calc view with business tab active logic needed
              }}
          />;
      }

      switch (activeTab) {
          case 'dashboard':
              return <DashboardView 
                  data={budgetData} 
                  setTab={navigate} 
                  notificationCount={notifications.length} 
                  onToggleNotifications={() => setShowNotifications(true)}
                  onProfileClick={handleProfileClick}
              />;
          case 'budget':
              return <BudgetView 
                  data={budgetData} 
                  updateData={handleUpdateData} 
                  notificationCount={notifications.length} 
                  onToggleNotifications={() => setShowNotifications(true)}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  focusTarget={budgetFocus}
                  clearFocusTarget={() => setBudgetFocus(null)}
                  onProfileClick={handleProfileClick}
                  onCreateShoppingList={(name, budget) => handleCreateShoppingList(name, budget, [], false)}
                  onAddInvestmentGoal={(goal) => setInvestmentGoals([...investmentGoals, goal])}
                  onGoalUpdate={(goal) => {
                      setBudgetData(prev => ({
                          ...prev,
                          goals: prev.goals.map(g => g.id === goal.id ? goal : g)
                      }));
                  }}
              />;
          case 'add':
              // Handled by useEffect redirect
              return null;
          case 'ai':
              return <AIView 
                  history={[...history, budgetData]} 
                  currencySymbol={budgetData.currencySymbol}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  onViewAnalysis={() => navigate('analysis')}
                  onViewInvestments={() => navigate('investments')}
                  onViewEvents={() => navigate('events')}
                  onViewSimulator={() => navigate('simulator')}
                  onViewSocial={() => navigate('social')}
                  onProfileClick={handleProfileClick}
                  user={user}
                  onNavigate={navigate}
                  onViewFeature={setFeatureViewId}
              />;
          case 'menu':
              return <MenuView 
                  onNavigate={navigate} 
                  notificationCount={notifications.length} 
                  onToggleNotifications={() => setShowNotifications(true)}
                  onProfileClick={handleProfileClick}
              />;
          case 'tools':
              return <ToolsView 
                  data={budgetData} 
                  updateData={handleUpdateData} 
                  resetData={() => setBudgetData(INITIAL_DATA)} 
                  isDarkMode={isDarkMode} 
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  onBack={() => goBack('menu')}
              />;
          case 'settings':
              return <ToolsView 
                  data={budgetData} 
                  updateData={handleUpdateData} 
                  resetData={() => setBudgetData(INITIAL_DATA)} 
                  isDarkMode={isDarkMode} 
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  onBack={() => goBack('menu')}
                  initialTab="settings"
              />;
          case 'history':
              return <HistoryView 
                  currentData={budgetData} 
                  history={history} 
                  onLoadPeriod={(id) => {
                      const period = history.find(h => h.id === id);
                      if (period) setBudgetData(period);
                      handleTabSwitch('dashboard');
                  }}
                  onCreateNewPeriod={handleCreateNewPeriod}
                  onDeletePeriod={(id) => setHistory(history.filter(h => h.id !== id))}
                  onDuplicatePeriod={(id) => {
                      const period = history.find(h => h.id === id);
                      if (period) {
                          const dup = { ...period, id: generateId(), created: Date.now() };
                          setHistory([...history, dup]);
                      }
                  }}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  updateData={handleUpdateData}
                  resetData={() => setBudgetData(INITIAL_DATA)}
                  isDarkMode={isDarkMode}
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  onBack={() => goBack('menu')}
              />;
          case 'events':
              return <EventsView 
                  events={events}
                  onUpdateEvents={setEvents}
                  currencySymbol={budgetData.currencySymbol}
                  onBack={() => goBack('menu')}
                  onProfileClick={handleProfileClick}
                  focusEventId={eventFocus}
                  onCreateShoppingList={(name, budget, members, linkedData) => handleCreateShoppingList(name, budget, members, false, linkedData)}
              />;
          case 'profile':
              return <ProfileView 
                  user={user} 
                  onLogout={handleLogout} 
                  onBack={() => goBack('dashboard')}
                  onNavigate={navigate}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
              />;
          case 'shopping-list':
              return <ShoppingListView 
                  onBack={() => goBack('menu')} 
                  onProfileClick={handleProfileClick} 
                  notificationCount={notifications.length} 
                  onToggleNotifications={() => setShowNotifications(true)} 
                  shoppingLists={shoppingLists} 
                  onUpdateLists={setShoppingLists} 
                  onSyncToBudget={handleSyncShoppingToBudget} 
                  focusListId={shoppingFocus?.listId} 
                  focusShopId={shoppingFocus?.shopId} 
                  clearFocus={() => setShoppingFocus(null)} 
                  expenseCategories={budgetData.expenses.map(e => e.name)}
                  onItemChange={handleShoppingItemChange}
              />;
          case 'social':
              return <CollaborativeView 
                  onBack={() => goBack('menu')}
                  onProfileClick={handleProfileClick}
                  groups={groups}
                  onUpdateGroups={setGroups}
                  onCreateShoppingList={(gName, eName, amt, members, linkedData) => {
                      const eventMembers: EventMember[] = members.map(m => ({
                          id: m.id,
                          name: m.name,
                          role: m.role === 'Owner' ? 'admin' : m.role === 'Editor' ? 'editor' : 'viewer',
                          avatar: m.avatarColor
                      }));
                      handleCreateShoppingList(`${gName} - ${eName}`, amt, eventMembers, false, linkedData);
                  }}
              />;
          case 'investments':
              return <InvestmentAnalysisView 
                  history={[...history, budgetData]} 
                  currencySymbol={budgetData.currencySymbol}
                  onBack={() => goBack('menu')}
                  onProfileClick={handleProfileClick}
                  onUpdateData={handleUpdateData}
                  investmentGoals={investmentGoals}
                  onUpdateGoals={setInvestmentGoals}
                  alerts={investmentAlerts}
                  onUpdateAlerts={setInvestmentAlerts}
                  onAddBudgetGoal={(goal) => handleUpdateData({...budgetData, goals: [...budgetData.goals, goal]})}
                  notifications={notifications.filter(n => n.category === 'Investment')}
              />;
          case 'simulator':
              return <LifeSimulatorView 
                  currentData={budgetData}
                  currencySymbol={budgetData.currencySymbol}
                  onBack={() => goBack('ai')}
                  onApplyScenario={(changes) => handleUpdateData({...budgetData, ...changes})}
                  onProfileClick={handleProfileClick}
              />;
          case 'analysis':
              return <AnalysisView 
                  history={[...history, budgetData]}
                  currencySymbol={budgetData.currencySymbol}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  onBack={() => goBack('ai')}
                  onProfileClick={handleProfileClick}
                  shoppingLists={shoppingLists}
              />;
          case 'support':
              return <SupportView onBack={() => goBack('menu')} />;
          case 'legal':
              return <LegalView onBack={() => goBack('menu')} />;
          case 'feedback':
              return <FeedbackView onBack={() => goBack('menu')} />;
          case 'pro-membership':
              return <ProMembershipView 
                  onBack={() => goBack('profile')} 
                  onUpgrade={() => {
                      const updatedUser = { ...user, isPro: true };
                      setUser(updatedUser);
                      localStorage.setItem('budget_user_session', JSON.stringify(updatedUser));
                  }}
                  onUnlockFeature={(fid) => {
                      const updatedUser = { ...user, unlockedFeatures: [...(user.unlockedFeatures || []), fid] };
                      setUser(updatedUser);
                      localStorage.setItem('budget_user_session', JSON.stringify(updatedUser));
                  }}
                  onProfileClick={handleProfileClick}
                  user={user}
                  onViewFeature={setFeatureViewId}
              />;
          case 'membership-management':
              return <MembershipManagementView 
                  user={user}
                  onBack={() => goBack('profile')}
                  onCancelSubscription={() => {
                      const updatedUser = { ...user, isPro: false };
                      setUser(updatedUser);
                      localStorage.setItem('budget_user_session', JSON.stringify(updatedUser));
                  }}
                  onProfileClick={handleProfileClick}
                  onUpdateUser={(updated) => {
                      setUser(updated);
                      localStorage.setItem('budget_user_session', JSON.stringify(updated));
                  }}
                  onNavigate={navigate}
              />;
          case 'personal-info':
              return <PersonalInfoView 
                  user={user}
                  onUpdateUser={(updated) => {
                      setUser(updated);
                      localStorage.setItem('budget_user_session', JSON.stringify(updated));
                  }}
                  onBack={() => goBack('profile')}
                  onProfileClick={handleProfileClick}
              />;
          case 'email-prefs':
              return <EmailPreferencesView 
                  onBack={() => goBack('profile')}
                  onProfileClick={handleProfileClick}
              />;
          case 'security':
              return <SecurityView 
                  onBack={() => goBack('profile')}
                  onProfileClick={handleProfileClick}
              />;
          case 'calculators':
              return <AdvancedCalculatorsView 
                  onBack={() => goBack('menu')}
                  currencySymbol={budgetData.currencySymbol}
                  onProfileClick={handleProfileClick}
                  budgetData={budgetData}
                  user={user}
                  onNavigate={navigate}
                  onViewFeature={setFeatureViewId}
              />;
          case 'community-links':
              return <CommunityLinksView onBack={() => goBack('menu')} />;
          case 'app-demo':
              return <AppDemoView 
                  onBack={() => goBack('menu')} 
                  onNavigate={(tab) => navigate(tab)}
                  onProfileClick={handleProfileClick}
                  activeTab={appDemoTab}
                  onTabChange={setAppDemoTab}
              />;
          default:
              return <DashboardView 
                  data={budgetData} 
                  setTab={navigate} 
                  notificationCount={notifications.length} 
                  onToggleNotifications={() => setShowNotifications(true)}
                  onProfileClick={handleProfileClick}
              />;
      }
  };

  const getNavTab = (tab: string) => {
    if (['dashboard'].includes(tab)) return 'dashboard';
    if (['budget'].includes(tab)) return 'budget';
    if (['ai', 'analysis', 'investments', 'events', 'simulator', 'social'].includes(tab)) return 'ai';
    return 'menu';
  };

  return (
    <Layout>
      {renderContent()}
      
      {/* Navigation Bar (Conditional) - Hide if featureView is active (Full screen) */}
      {user && showNavTabs.includes(activeTab) && !featureViewId && (
          <Navigation 
              activeTab={getNavTab(activeTab)} 
              onTabChange={handleTabSwitch} 
              onAdd={() => {
                  const totals = calculateTotals(budgetData);
                  setCalculatedRollover(totals.leftToSpend);
                  setShowNewPeriodModal(true);
              }}
              badgeTabs={notifications.length > 0 ? ['menu'] : []}
          />
      )}

      {/* Global Notification Popup */}
      {showNotifications && (
          <NotificationPopup 
              notifications={notifications} 
              onClose={() => setShowNotifications(false)} 
              onNotificationClick={handleNotificationClick} 
              onDismiss={handleDismissNotification}
          />
      )}

      {/* Global Modals */}
      <RolloverModal 
          isOpen={showRolloverModal}
          onClose={() => setShowRolloverModal(false)}
          onConfirm={confirmRollover}
          calculatedRollover={calculatedRollover}
          currencySymbol={budgetData.currencySymbol}
      />

      <NewPeriodModal 
          isOpen={showNewPeriodModal}
          onClose={() => setShowNewPeriodModal(false)}
          onConfirm={finalizeNewPeriod}
          defaultMonth={budgetData.month + 1 > 11 ? 0 : budgetData.month + 1}
          defaultYear={budgetData.month + 1 > 11 ? budgetData.year + 1 : budgetData.year}
          calculatedRollover={calculatedRollover}
          currencySymbol={budgetData.currencySymbol}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;