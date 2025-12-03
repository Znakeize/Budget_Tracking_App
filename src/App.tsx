
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/ui/Layout';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { BudgetView } from './views/BudgetView';
import { ProFeaturesView } from './views/ProFeaturesView';
import { ToolsView } from './views/ToolsView';
import { HistoryView } from './views/HistoryView';
import { EventsView, getEventNotifications } from './views/EventsView';
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
import { NotificationsView } from './views/settings/NotificationsView';
import { SecurityView } from './views/settings/SecurityView';
import { SettingsView } from './views/SettingsView';
import { AdvancedCalculatorsView } from './views/AdvancedCalculatorsView';
import { CommunityLinksView } from './views/CommunityLinksView';
import { AppDemoView } from './views/AppDemoView';

import { NotificationPopup } from './components/ui/NotificationPopup';
import { NewPeriodModal } from './components/ui/NewPeriodModal';
import { RolloverModal } from './components/ui/RolloverModal';

import { BudgetData, ShoppingListData, EventData, SharedGroup, InvestmentGoal, InvestmentAlert, EventMember, Shop } from './types';
import { INITIAL_DATA, SAMPLE_EVENTS, SAMPLE_SHOPPING_LISTS, MOCK_GROUPS, SAMPLE_INVESTMENT_GOALS } from './constants';
import { getNotifications, calculateTotals, generateId, getCollaborativeNotifications, getInvestmentNotifications } from './utils/calculations';
import { LanguageProvider } from './contexts/LanguageContext';

// Tabs that show the bottom navigation bar
const showNavTabs = [
  'dashboard', 'budget', 'ai', 'menu', 
  'tools', 'settings', 'history', 'events', 
  'profile', 'shopping-list', 'social', 
  'investments', 'simulator', 'analysis', 
  'support', 'legal', 'feedback', 
  'pro-membership', 'membership-management', 
  'personal-info', 'notifications', 'security', 
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
  
  const [isGuestMode, setIsGuestMode] = useState(false);

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

  // Sync expense category updates (name or budget) to linked shopping lists
  const handleExpenseCategoryChange = (oldName: string, newName: string, newBudget: number) => {
      setShoppingLists(prevLists => prevLists.map(list => {
          let changed = false;
          let updatedList = { ...list };

          // Update List-level link
          if (updatedList.budgetCategory === oldName) {
              updatedList.budgetCategory = newName;
              updatedList.budget = newBudget;
              changed = true;
          }

          // Update Shop-level links
          const updatedShops = updatedList.shops.map(shop => {
              if (shop.budgetCategory === oldName) {
                  changed = true;
                  return { ...shop, budgetCategory: newName, budget: newBudget };
              }
              return shop;
          });

          if (changed) {
              return { ...updatedList, shops: updatedShops, lastModified: Date.now() };
          }
          return list;
      }));
  };

  const handleUpdateGroups = (newGroups: SharedGroup[]) => {
      setGroups(newGroups);

      // Auto-update linked Shopping Lists
      setShoppingLists(prevLists => {
          let changed = false;
          const updatedLists = prevLists.map(list => {
              if (list.groupId && list.groupExpenseId) {
                  const group = newGroups.find(g => g.id === list.groupId);
                  if (group) {
                      const expense = group.expenses.find(e => e.id === list.groupExpenseId);
                      if (expense) {
                          const expectedName = `${group.name} - ${expense.title}`;
                          if (list.budget !== expense.amount || list.name !== expectedName) {
                              changed = true;
                              return { 
                                  ...list, 
                                  budget: expense.amount, 
                                  name: expectedName,
                                  lastModified: Date.now()
                              };
                          }
                      }
                  }
              }
              return list;
          });
          return changed ? updatedLists : prevLists;
      });
  };

  const handleUpdateEvents = (newEvents: EventData[]) => {
      setEvents(newEvents);

      // Auto-update linked Shopping Lists
      setShoppingLists(prevLists => {
          let changed = false;
          const updatedLists = prevLists.map(list => {
              // Check if list is linked to an event expense
              if (list.eventId && list.expenseId) {
                  const event = newEvents.find(e => e.id === list.eventId);
                  if (event) {
                      const expense = event.expenses.find(e => e.id === list.expenseId);
                      if (expense) {
                          // Construct expected name based on convention
                          const expectedName = `${event.name} - ${expense.name}`;
                          
                          // Check if budget or name is out of sync
                          if (list.budget !== expense.amount || list.name !== expectedName) {
                              changed = true;
                              return { 
                                  ...list, 
                                  budget: expense.amount, 
                                  name: expectedName,
                                  lastModified: Date.now()
                              };
                          }
                      }
                  }
              }
              return list;
          });
          return changed ? updatedLists : prevLists;
      });
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
      setIsGuestMode(false);
      localStorage.setItem('budget_user_session', JSON.stringify(userData));
      handleTabSwitch('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      setIsGuestMode(false);
      localStorage.removeItem('budget_user_session');
      handleTabSwitch('dashboard');
  };
  
  const handleGuestLogin = () => {
      setIsGuestMode(true);
      handleTabSwitch('dashboard');
  };

  const notifications = useMemo(() => {
      const core = getNotifications(budgetData, history);
      const eventsNotif = getEventNotifications(events, budgetData.currencySymbol);
      const socialNotif = getCollaborativeNotifications(groups);
      const investmentsNotif = getInvestmentNotifications(budgetData.investments, investmentAlerts, budgetData.currencySymbol);
      
      const all = [...core, ...eventsNotif, ...socialNotif, ...investmentsNotif];
      return all.filter(n => !dismissedNotifIds.includes(n.id));
  }, [budgetData, history, events, groups, investmentAlerts, dismissedNotifIds]);

  // Determine active badges for navigation
  const activeBadges = useMemo(() => {
    const tabs = [];
    if (notifications.length > 0) tabs.push('menu');

    // PRO features notifications
    const proCategories = ['Event', 'Collaboration', 'Investment'];
    if (notifications.some(n => proCategories.includes(n.category))) {
        tabs.push('ai');
    }
    return tabs;
  }, [notifications]);

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
  const handleShoppingItemChange = (amount: number, total: number, categoryName?: string, eventId?: string, expenseId?: string, groupId?: string, groupExpenseId?: string) => {
      // 1. Budget Category Sync
      if (categoryName) {
          const categoryIndex = budgetData.expenses.findIndex(e => e.name === categoryName);
          if (categoryIndex >= 0) {
              const updatedExpenses = [...budgetData.expenses];
              // It seems to be adding `amount` (diff) to `spent`.
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
                  // Use total for absolute sync
                  updatedExpenses[expenseIndex] = {
                      ...updatedExpenses[expenseIndex],
                      amount: total
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
                  // Use total for absolute sync
                  updatedExpenses[expenseIndex] = {
                      ...updatedExpenses[expenseIndex],
                      amount: total
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

  const handleCreateShoppingList = (name: string, budget: number, members: EventMember[] = [], redirect: boolean = true, linkedData?: {eventId?: string, expenseId?: string, expenseName: string, groupId?: string, groupExpenseId?: string, budgetCategory?: string}) => {
      const newList: ShoppingListData = {
          id: generateId(),
          name: name,
          shops: [], // Modified: Always create empty list
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
          lastModified: Date.now(),
          // Store link data on list level for inheritance to future shops
          eventId: linkedData?.eventId,
          expenseId: linkedData?.expenseId,
          groupId: linkedData?.groupId,
          groupExpenseId: linkedData?.groupExpenseId,
          budgetCategory: linkedData?.budgetCategory
      };
      setShoppingLists([...shoppingLists, newList]);
      
      if (redirect) {
          navigate('shopping-list');
          setShoppingFocus({ listId: newList.id });
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

  const handleFullReset = () => {
      const emptyBudget: BudgetData = {
          id: generateId(),
          period: 'monthly',
          month: new Date().getMonth(),
          year: new Date().getFullYear(),
          currency: 'USD',
          currencySymbol: '$',
          income: [],
          expenses: [],
          bills: [],
          goals: [],
          savings: [],
          debts: [],
          investments: [],
          rollover: 0,
          created: Date.now()
      };

      setBudgetData(emptyBudget);
      setHistory([]);
      setShoppingLists([]);
      setEvents([]);
      setGroups([]);
      setInvestmentGoals([]);
      setInvestmentAlerts([]);
      
      // Clear persistent storage but keep user session
      const keysToRemove = [
          'budget_current', 
          'budget_history', 
          'budget_shopping', 
          'budget_events', 
          'budget_groups', 
          'budget_invest_goals', 
          'budget_invest_alerts'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  // Render Logic
  const renderContent = () => {
      // Full screen views (no nav bar)
      if (!user && !isGuestMode && activeTab !== 'auth') {
          return <AuthView onLogin={handleLogin} onBack={handleGuestLogin} />;
      }
      
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
                  onCreateShoppingList={(name, budget) => handleCreateShoppingList(name, budget, [], false, { expenseName: name, budgetCategory: name })}
                  onAddInvestmentGoal={(goal) => setInvestmentGoals([...investmentGoals, goal])}
                  onGoalUpdate={(goal) => {
                      setBudgetData(prev => ({
                          ...prev,
                          goals: prev.goals.map(g => g.id === goal.id ? goal : g)
                      }));
                  }}
                  shoppingLists={shoppingLists}
                  onViewShoppingList={(listId, shopId) => {
                      setShoppingFocus({ listId, shopId });
                      navigate('shopping-list');
                  }}
                  onExpenseCategoryChange={handleExpenseCategoryChange}
              />;
          case 'add':
              // Handled by useEffect redirect
              return null;
          case 'ai':
              return <ProFeaturesView 
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
                  eventNotificationCount={notifications.filter(n => n.category === 'Event').length}
                  socialNotificationCount={notifications.filter(n => n.category === 'Collaboration').length}
                  investmentNotificationCount={notifications.filter(n => n.category === 'Investment').length}
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
                  history={history}
                  events={events}
                  groups={groups}
                  shoppingLists={shoppingLists}
                  updateData={handleUpdateData} 
                  resetData={handleFullReset} 
                  isDarkMode={isDarkMode} 
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  notificationCount={notifications.length}
                  onToggleNotifications={() => setShowNotifications(true)}
                  onBack={() => goBack('menu')}
              />;
          case 'settings':
              return <SettingsView 
                  budgetData={budgetData}
                  onUpdateBudget={handleUpdateData}
                  isDarkMode={isDarkMode}
                  toggleTheme={() => setIsDarkMode(!isDarkMode)}
                  onBack={() => goBack('menu')}
                  onProfileClick={handleProfileClick}
                  onNavigate={navigate}
                  onResetData={handleFullReset}
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
                  onUpdateEvents={handleUpdateEvents} // Updated to use the new handler
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
                  onUpdateGroups={handleUpdateGroups} // Changed from setGroups
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
          case 'notifications':
              return <NotificationsView 
                  onBack={() => goBack('profile')}
                  onProfileClick={handleProfileClick}
              />;
          case 'email-prefs': // Fallback / Legacy support
              return <NotificationsView 
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
      {(user || isGuestMode) && showNavTabs.includes(activeTab) && !featureViewId && (
          <Navigation 
              activeTab={getNavTab(activeTab)} 
              onTabChange={handleTabSwitch} 
              onAdd={() => {
                  const totals = calculateTotals(budgetData);
                  setCalculatedRollover(totals.leftToSpend);
                  setShowNewPeriodModal(true);
              }}
              badgeTabs={activeBadges}
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
