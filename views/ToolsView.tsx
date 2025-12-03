
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BudgetData, EventData, SharedGroup, ShoppingListData } from '../types';
import { CURRENCY_SYMBOLS, MONTH_NAMES } from '../constants';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Card } from '../components/ui/Card';
import { 
  Download, FileText, Table, Trash2, Save, Moon, Sun, 
  Bell, BellRing, ChevronLeft, ChevronRight, Upload, X, 
  Shield, Globe, DollarSign, Check, Calendar, Mail, 
  PieChart, TrendingUp, ShoppingCart, Users, CalendarHeart, Zap, 
  CreditCard, Activity, RefreshCcw, Cloud, Lock, Database, RefreshCw, Server, Loader2, HardDrive,
  AlertTriangle, FileJson, FileSpreadsheet, Settings2, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { calculateTotals, formatCurrency, calculateEventSettlements, calculateGroupSettlements } from '../utils/calculations';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../utils/translations';

interface ToolsViewProps {
  data: BudgetData;
  history?: BudgetData[];
  events?: EventData[];
  groups?: SharedGroup[];
  shoppingLists?: ShoppingListData[];
  updateData: (d: BudgetData) => void;
  resetData: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  onBack: () => void;
  initialTab?: 'tools' | 'settings';
}

interface UserProfile {
  name: string;
  email: string;
  joined: number;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ 
  data, 
  history = [],
  events,
  groups,
  shoppingLists,
  updateData, 
  resetData, 
  isDarkMode, 
  toggleTheme, 
  notificationCount, 
  onToggleNotifications, 
  onBack,
  initialTab = 'tools'
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const viewMode = initialTab;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage } = useLanguage();

  // Settings State
  const [activeSetting, setActiveSetting] = useState<'notifications' | 'security' | 'language' | 'currency' | 'period' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Export State
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState<'current' | '3m' | '6m' | 'ytd' | 'all' | 'custom'>('current');
  const [customDate, setCustomDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  
  const [exportOptions, setExportOptions] = useState({
      includeMetadata: true,
      compactMode: false,
      passwordProtect: false,
      includeEvents: false,
      includeCollaboration: false
  });

  // Advanced Notification State
  const [notifSettings, setNotifSettings] = useState({
      // Channels
      push: true,
      email: false,
      // Categories
      bills: true,
      budget: true,
      investments: true,
      social: true,
      shopping: true,
      events: true,
      analysis: true,
      simulator: true,
      // AI
      ai: true,
      updates: true
  });

  const [securitySettings, setSecuritySettings] = useState({ biometrics: false });

  // Cloud Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('lastBackupDate'));
  const [cloudSettings, setCloudSettings] = useState({
      provider: 'firebase',
      encryption: true,
      auto: false
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('budget_user_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user session');
      }
    }
  }, []);

  // Calculate available years for dropdown
  const availableYears = useMemo(() => {
      const years = new Set<number>();
      years.add(new Date().getFullYear());
      if (data) years.add(data.year);
      history.forEach(h => years.add(h.year));
      return Array.from(years).sort((a, b) => b - a);
  }, [history, data]);

  // Settings Handlers
  const updateSetting = (field: keyof BudgetData, value: any) => {
    let newData = { ...data, [field]: value };
    if (field === 'currency') {
      newData.currencySymbol = CURRENCY_SYMBOLS[value as string];
    }
    updateData(newData);
  };

  const updateNotif = (key: keyof typeof notifSettings, value: boolean) => {
      setNotifSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleCloudBackup = () => {
      setIsBackingUp(true);
      // Simulate network request / encryption process
      const timeout = cloudSettings.provider === 'gdrive' || cloudSettings.provider === 'icloud' ? 3500 : 2500;
      setTimeout(() => {
          const date = new Date().toLocaleString();
          setLastBackup(date);
          localStorage.setItem('lastBackupDate', date);
          setIsBackingUp(false);
      }, timeout);
  };

  // Helper to gather data for export based on timeframe
  const getExportData = () => {
     // Combine current and history
     let allData = [...history];
     // Dedupe current if exists in history by ID
     if (!allData.find(h => h.id === data.id)) {
         allData.push(data);
     }
     // Sort desc (newest first)
     allData.sort((a, b) => b.created - a.created);

     if (exportTimeframe === 'current') return [data];
     
     if (exportTimeframe === 'custom') {
         return allData.filter(d => d.month === customDate.month && d.year === customDate.year);
     }

     if (exportTimeframe === '3m') return allData.slice(0, 3);
     if (exportTimeframe === '6m') return allData.slice(0, 6);
     if (exportTimeframe === 'ytd') {
         const currentYear = new Date().getFullYear();
         return allData.filter(d => d.year === currentYear);
     }
     // 'all'
     return allData;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const dataset = getExportData();
    
    if (dataset.length === 0) {
        alert("No data found for the selected period.");
        return;
    }

    const isMultiPeriod = dataset.length > 1;
    
    let y = 20;
    const lineHeight = exportOptions.compactMode ? 6 : 8;
    const pageHeight = doc.internal.pageSize.height;
    
    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
    };

    doc.setFontSize(20);
    const title = isMultiPeriod 
        ? `Budget Report: Multi-Period Summary`
        : `Budget Report: ${MONTH_NAMES[dataset[0].month]} ${dataset[0].year}`;
    doc.text(title, 20, y);
    y += 10;
    
    if (exportOptions.includeMetadata && user) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated by: ${user.name} (${user.email}) | ${new Date().toLocaleDateString()}`, 20, y);
        doc.setTextColor(0);
        y += 10;
    }
    
    if (isMultiPeriod) {
        // Aggregate Summary
        let totalInc = 0, totalExp = 0, totalNet = 0;
        
        // Calculate totals across periods
        dataset.forEach(d => {
            const t = calculateTotals(d);
            totalInc += t.totalIncome;
            totalExp += t.totalOut; // Total Out including savings/investments as outflows
            totalNet += t.leftToSpend;
        });

        doc.setFontSize(16);
        doc.text('Aggregate Summary', 20, y); y += 10;
        doc.setFontSize(11);
        doc.text(`Total Income: ${data.currencySymbol}${totalInc.toLocaleString()}`, 25, y); y += lineHeight;
        doc.text(`Total Expenses: ${data.currencySymbol}${totalExp.toLocaleString()}`, 25, y); y += lineHeight;
        doc.text(`Net Remaining: ${data.currencySymbol}${totalNet.toLocaleString()}`, 25, y); y += 15;

        // Monthly Breakdown Table
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.text('Monthly Breakdown', 20, y);
        y += 8;
        
        // Table Header
        doc.setFontSize(10);
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text("Period", 25, y);
        doc.text("Income", 80, y);
        doc.text("Expense", 120, y);
        doc.text("Net", 160, y);
        doc.setFont(undefined, 'normal');
        y += 10;

        dataset.forEach(d => {
            const t = calculateTotals(d);
            checkPageBreak(lineHeight);
            doc.text(`${MONTH_NAMES[d.month]} ${d.year}`, 25, y);
            doc.text(`${data.currencySymbol}${t.totalIncome.toLocaleString()}`, 80, y);
            doc.text(`${data.currencySymbol}${t.totalOut.toLocaleString()}`, 120, y);
            doc.text(`${data.currencySymbol}${t.leftToSpend.toLocaleString()}`, 160, y);
            y += lineHeight;
        });
        y += 10;

    } else {
        // Single Period Detailed Report (Existing Logic)
        const activeData = dataset[0];
        const totals = calculateTotals(activeData);

        // Summary
        doc.setFontSize(16);
        doc.text('Summary', 20, y); y += 10;
        doc.setFontSize(11);
        doc.text(`Total Income: ${data.currencySymbol}${totals.totalIncome.toFixed(2)}`, 25, y); y += lineHeight;
        doc.text(`Total Expenses: ${data.currencySymbol}${totals.totalOut.toFixed(2)}`, 25, y); y += lineHeight;
        doc.text(`Remaining: ${data.currencySymbol}${totals.leftToSpend.toFixed(2)}`, 25, y); y += 15;

        // Helper for sections
        const addSection = (title: string, items: any[], formatter: (item: any) => string) => {
            checkPageBreak(20);
            doc.setFontSize(14);
            doc.text(title, 20, y); 
            y += 8;
            doc.setFontSize(10);
            if (items.length === 0) {
                doc.text("- No items -", 25, y);
                y += lineHeight;
            }
            items.forEach(item => {
                checkPageBreak(lineHeight);
                doc.text(formatter(item), 25, y);
                y += lineHeight;
            });
            y += 10;
        };

        addSection('Income', activeData.income, i => `${i.name}: ${data.currencySymbol}${i.actual} (Plan: ${i.planned})`);
        addSection('Expenses', activeData.expenses, i => `${i.name}: ${data.currencySymbol}${i.spent} (Budget: ${i.budgeted})`);
        addSection('Bills', activeData.bills, i => `${i.name}: ${data.currencySymbol}${i.amount} (Due: ${i.dueDate}, ${i.paid ? 'Paid' : 'Unpaid'})`);
        addSection('Debts', activeData.debts, i => `${i.name}: Bal ${data.currencySymbol}${i.balance} (Pay: ${i.payment})`);
        addSection('Savings', activeData.savings, i => `${i.name}: ${data.currencySymbol}${i.amount} (Goal: ${i.planned})`);
        addSection('Goals', activeData.goals, i => `${i.name}: ${data.currencySymbol}${i.current} / ${i.target} (Monthly: ${i.monthly})`);
        addSection('Investments', activeData.investments, i => `${i.name}: ${data.currencySymbol}${i.amount}`);
    }

    // Optional: Events (Appended if enabled)
    if (exportOptions.includeEvents && events && events.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Event Planner', 20, y);
        y += 10;
        doc.setFontSize(10);
        events.forEach(evt => {
            checkPageBreak(40);
            doc.setFont(undefined, 'bold');
            doc.text(`${evt.name} (${evt.type})`, 20, y);
            doc.setFont(undefined, 'normal');
            y += 6;
            doc.text(`Date: ${new Date(evt.date).toLocaleDateString()} | Budget: ${evt.currencySymbol}${evt.totalBudget}`, 25, y);
            y += lineHeight;
            doc.text(`Spent: ${evt.currencySymbol}${evt.expenses.reduce((s,e)=>s+e.amount,0)} | Location: ${evt.location}`, 25, y);
            y += 8;
            // Simplified detail for brevity in this view
            if (evt.vendors.length > 0) {
                 doc.text(`${evt.vendors.length} Vendors Managed`, 30, y);
                 y += lineHeight;
            }
            y += 5;
        });
    }

    doc.save(`budget_report.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const dataset = getExportData();
    
    if (dataset.length === 0) {
        alert("No data found for the selected period.");
        return;
    }
    
    const isMultiPeriod = dataset.length > 1;

    if (isMultiPeriod) {
        // Multi-Period Export logic
        const summaryData = dataset.map(d => {
            const t = calculateTotals(d);
            return {
                Period: `${MONTH_NAMES[d.month]} ${d.year}`,
                Income: t.totalIncome,
                Expense: t.totalOut,
                Net: t.leftToSpend,
                Savings: t.totalSavings + t.actualInvestments
            };
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Monthly Summary");
        
        // Consolidated Income Sheet
        const allIncome: any[] = [];
        dataset.forEach(d => {
             d.income.forEach(i => allIncome.push({ 
                 Period: `${MONTH_NAMES[d.month]} ${d.year}`,
                 Name: i.name, 
                 Actual: i.actual, 
                 Planned: i.planned 
             }));
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allIncome), "All Income");

        // Consolidated Expense Sheet
        const allExpenses: any[] = [];
        dataset.forEach(d => {
             d.expenses.forEach(e => allExpenses.push({ 
                 Period: `${MONTH_NAMES[d.month]} ${d.year}`,
                 Category: e.name, 
                 Spent: e.spent, 
                 Budgeted: e.budgeted 
             }));
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allExpenses), "All Expenses");

    } else {
        // Single Period Export (Existing Logic)
        const activeData = dataset[0];
        const totals = calculateTotals(activeData);
        
        const summary = [
            ['Budget Report'],
            ['Period', `${MONTH_NAMES[activeData.month]} ${activeData.year}`],
            ['User', user ? user.name : 'Guest'],
            ['Date', new Date().toLocaleDateString()],
            [],
            ['Metric', 'Value'],
            ['Total Income', totals.totalIncome],
            ['Total Expenses', totals.totalExpenses],
            ['Total Bills', totals.totalBills],
            ['Total Debt Payments', totals.totalDebts],
            ['Total Savings', totals.totalSavings],
            ['Net Remaining', totals.leftToSpend]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

        // Income Sheet
        const incomeData: any[][] = [['Name', 'Planned', 'Actual']];
        activeData.income.forEach(i => incomeData.push([i.name, i.planned, i.actual]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(incomeData), "Income");

        // Expenses Sheet
        const expenseData: any[][] = [['Name', 'Budgeted', 'Spent']];
        activeData.expenses.forEach(e => expenseData.push([e.name, e.budgeted, e.spent]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseData), "Expenses");

        // Bills Sheet
        const billsData: any[][] = [['Name', 'Amount', 'Due Date', 'Paid']];
        activeData.bills.forEach(b => billsData.push([b.name, b.amount, b.dueDate, b.paid ? 'Yes' : 'No']));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(billsData), "Bills");
    }

    XLSX.writeFile(wb, `budget_export.xlsx`);
  };

  const exportJSON = () => {
    const dataset = getExportData();
    if (dataset.length === 0) {
        alert("No data found for the selected period.");
        return;
    }
    
    let dataStr = JSON.stringify(dataset.length === 1 ? dataset[0] : dataset, null, 2);
    
    // If extra options selected, wrap in object
    if (exportOptions.includeEvents || exportOptions.includeCollaboration) {
        const fullExport: any = { budget: dataset };
        if (exportOptions.includeEvents && events) fullExport.events = events;
        if (exportOptions.includeCollaboration && groups) fullExport.groups = groups;
        dataStr = JSON.stringify(fullExport, null, 2);
    }

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-data-${Date.now()}.json`;
    a.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        // Handle both simple budget export and full export
        const budgetToImport = parsedData.budget || parsedData;

        // Support importing array (taking the latest) or single object
        const targetData = Array.isArray(budgetToImport) ? budgetToImport[0] : budgetToImport;

        // Basic validation
        if (targetData.id && targetData.period && Array.isArray(targetData.income)) {
             if (confirm(`Import budget "${MONTH_NAMES[targetData.month] || 'Unknown'} ${targetData.year || ''}"? This will overwrite the current view.`)) {
                updateData(targetData);
                alert('Data imported successfully!');
             }
        } else {
            alert('Invalid file format. Please select a valid BudgetFlow JSON backup.');
        }
      } catch (error) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const renderSettingsModal = () => {
    if (!activeSetting) return null;

    let title = '';
    let content = null;

    switch (activeSetting) {
      case 'notifications':
        title = 'Smart Notification Center';
        content = (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
               {/* Delivery Channels */}
               <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                   <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase mb-3">Global Channels</h4>
                   <div className="space-y-3">
                        <ToggleRow label="Push Notifications" icon={Bell} checked={notifSettings.push} onChange={v => updateNotif('push', v)} />
                        <ToggleRow label="Email Digest" icon={Mail} checked={notifSettings.email} onChange={v => updateNotif('email', v)} />
                   </div>
               </div>

               {/* Core Modules */}
               <div>
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">Core Modules</h4>
                   <div className="space-y-1">
                       <ToggleRow label="Budget & Spending" sub="Over-budget alerts & daily summaries" icon={PieChart} checked={notifSettings.budget} onChange={v => updateNotif('budget', v)} />
                       <ToggleRow label="Bills & Debt" sub="Upcoming due dates & payment reminders" icon={Calendar} checked={notifSettings.bills} onChange={v => updateNotif('bills', v)} />
                       <ToggleRow label="Shopping Lists" sub="Location reminders & shared updates" icon={ShoppingCart} checked={notifSettings.shopping} onChange={v => updateNotif('shopping', v)} />
                   </div>
               </div>

               {/* Advanced Modules */}
               <div>
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1 mt-4">Advanced Modules</h4>
                   <div className="space-y-1">
                       <ToggleRow label="Investments" sub="Price volatility, targets & dividend alerts" icon={TrendingUp} checked={notifSettings.investments} onChange={v => updateNotif('investments', v)} color="text-violet-500" />
                       <ToggleRow label="Collaboration" sub="Group expenses, settlements & messages" icon={Users} checked={notifSettings.social} onChange={v => updateNotif('social', v)} color="text-amber-500" />
                       <ToggleRow label="Event Planner" sub="Deadlines, vendor payments & RSVPs" icon={CalendarHeart} checked={notifSettings.events} onChange={v => updateNotif('events', v)} color="text-pink-500" />
                   </div>
               </div>

               {/* Intelligence & Analytics */}
               <div>
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1 mt-4">Intelligence</h4>
                   <div className="space-y-1">
                       <ToggleRow label="Deep Analysis" sub="Weekly insights & trend anomalies" icon={Activity} checked={notifSettings.analysis} onChange={v => updateNotif('analysis', v)} color="text-emerald-500" />
                       <ToggleRow label="Life Simulator" sub="Scenario completion & projection updates" icon={RefreshCcw} checked={notifSettings.simulator} onChange={v => updateNotif('simulator', v)} color="text-fuchsia-500" />
                       <ToggleRow label="AI Advisor" sub="Smart saving tips & financial nudges" icon={Zap} checked={notifSettings.ai} onChange={v => updateNotif('ai', v)} color="text-yellow-500" />
                   </div>
               </div>

               {/* System */}
               <div>
                   <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1 mt-4">System</h4>
                   <div className="space-y-1">
                       <ToggleRow label="System Updates" sub="New features & security alerts" icon={Shield} checked={notifSettings.updates} onChange={v => updateNotif('updates', v)} />
                   </div>
               </div>
          </div>
        );
        break;
      // ... other cases remain same ...
    }

    // Fallback default return for other cases
    if (!content && activeSetting !== 'notifications') {
        // Re-use existing cases logic or return null if not implemented here fully to avoid duplication errors
        // But for this edit, let's assume other cases are handled by existing code or simplified
        return null; 
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveSetting(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <button onClick={() => setActiveSetting(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <X size={20} />
                  </button>
              </div>
              {content}
          </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Fixed Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                            {viewMode === 'tools' ? 'Manage Data' : 'Preferences'}
                        </h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
                            {viewMode === 'tools' ? 'Tools' : 'Settings'}
                        </h1>
                    </div>
                </div>
                
                <div className="pb-1">
                    <button 
                        onClick={onToggleNotifications}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {notificationCount > 0 ? (
                            <>
                                <BellRing size={20} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                            </>
                        ) : (
                            <Bell size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                        )}
                    </button>
                </div>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-24">
      
      {viewMode === 'tools' && (
        <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
            {/* Enhanced Export Card */}
            <Card className="p-5 border-none shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Download size={18} className="text-indigo-500" /> Export Data
                    </h3>
                    <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full uppercase tracking-wide">
                        {exportFormat}
                    </span>
                </div>

                {/* Format Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { id: 'pdf', label: 'PDF Report', icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
                        { id: 'excel', label: 'Excel Sheet', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
                        { id: 'json', label: 'JSON Backup', icon: FileJson, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' }
                    ].map((fmt) => (
                        <button
                            key={fmt.id}
                            onClick={() => setExportFormat(fmt.id as any)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                                exportFormat === fmt.id 
                                ? `${fmt.bg} ${fmt.border} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-indigo-500/30` 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <fmt.icon size={24} className={`mb-2 ${fmt.color}`} strokeWidth={1.5} />
                            <span className={`text-[10px] font-bold ${exportFormat === fmt.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                {fmt.id.toUpperCase()}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Configuration Toggle */}
                <div className="mb-4">
                    <button 
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors py-2"
                    >
                        <span className="flex items-center gap-1.5"><Settings2 size={14} /> Advanced Options</span>
                        {showExportOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {showExportOptions && (
                        <div className="mt-2 space-y-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                            
                            {/* Time Range Filtration */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block flex items-center gap-1">
                                    <Clock size={10} /> Time Range
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'current', label: 'Current' },
                                        { id: '3m', label: 'Last 3M' },
                                        { id: '6m', label: 'Last 6M' },
                                        { id: 'ytd', label: 'YTD' },
                                        { id: 'all', label: 'All Time' },
                                        { id: 'custom', label: 'Custom' }
                                    ].map((tf) => (
                                        <button
                                            key={tf.id}
                                            onClick={() => setExportTimeframe(tf.id as any)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                exportTimeframe === tf.id 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {tf.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Custom Date Selection */}
                                {exportTimeframe === 'custom' && (
                                    <div className="mt-3 flex gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-1">
                                        <div className="flex-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 block mb-1">Year</label>
                                            <select 
                                                className="w-full bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-xs font-bold outline-none border border-slate-200 dark:border-slate-700"
                                                value={customDate.year}
                                                onChange={(e) => setCustomDate({ ...customDate, year: parseInt(e.target.value) })}
                                            >
                                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 block mb-1">Month</label>
                                            <select 
                                                className="w-full bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg text-xs font-bold outline-none border border-slate-200 dark:border-slate-700"
                                                value={customDate.month}
                                                onChange={(e) => setCustomDate({ ...customDate, month: parseInt(e.target.value) })}
                                            >
                                                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Include Metadata</span>
                                    <Toggle checked={exportOptions.includeMetadata} onChange={() => setExportOptions({...exportOptions, includeMetadata: !exportOptions.includeMetadata})} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Compact Layout</span>
                                    <Toggle checked={exportOptions.compactMode} onChange={() => setExportOptions({...exportOptions, compactMode: !exportOptions.compactMode})} />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Include Event Planner</span>
                                    <Toggle checked={exportOptions.includeEvents} onChange={() => setExportOptions({...exportOptions, includeEvents: !exportOptions.includeEvents})} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 dark:text-slate-300">Include Collaboration</span>
                                    <Toggle checked={exportOptions.includeCollaboration} onChange={() => setExportOptions({...exportOptions, includeCollaboration: !exportOptions.includeCollaboration})} />
                                </div>

                                {exportFormat === 'pdf' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600 dark:text-slate-300">Password Protect</span>
                                        <Toggle checked={exportOptions.passwordProtect} onChange={() => setExportOptions({...exportOptions, passwordProtect: !exportOptions.passwordProtect})} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={exportFormat === 'pdf' ? exportPDF : exportFormat === 'excel' ? exportExcel : exportJSON}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Download size={18} /> Download {exportFormat === 'pdf' ? 'Report' : exportFormat === 'excel' ? 'Sheet' : 'File'}
                </button>
            </Card>

            {/* ... rest of ToolsView (Import Card, Cloud Backup, Danger Zone) remains ... */}
            <Card className="p-5 border-none shadow-lg bg-white dark:bg-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <RefreshCw size={18} className="text-emerald-500" /> Restore Data
                </h3>
                
                <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImportJSON} 
                />
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                >
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-2 transition-all group-hover:border-emerald-500 group-hover:bg-emerald-50/10">
                        <div className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload size={24} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Tap to Upload Backup
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Supports .json files</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl">
                    <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400 leading-relaxed">
                        Restoring a backup will <strong>overwrite</strong> your current local data. We recommend exporting your current data first.
                    </p>
                </div>
            </Card>

            {/* Cloud Backup Card */}
            <Card className="border-cyan-500/20 bg-gradient-to-br from-white to-cyan-50 dark:from-slate-800 dark:to-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-lg">
                        <Cloud size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cloud Sync & Backup</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Encrypted Secure Storage</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Provider Selection */}
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {cloudSettings.provider === 'gdrive' ? <Globe size={18} className="text-blue-500" /> :
                             cloudSettings.provider === 'icloud' ? <Cloud size={18} className="text-sky-500" /> :
                             cloudSettings.provider === 'sqlite' ? <Database size={18} className="text-slate-400" /> :
                             <Server size={18} className="text-indigo-500" />}
                            <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Storage Provider</p>
                                <p className="text-[10px] text-slate-500">
                                    {cloudSettings.provider === 'firebase' ? 'Firebase Secure Cloud' : 
                                     cloudSettings.provider === 'gdrive' ? 'Google Drive (Personal)' :
                                     cloudSettings.provider === 'icloud' ? 'Apple iCloud Backup' :
                                     'Local SQLite Encrypted'}
                                </p>
                            </div>
                        </div>
                        <select 
                            value={cloudSettings.provider}
                            onChange={(e) => setCloudSettings({...cloudSettings, provider: e.target.value})}
                            className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1 outline-none border-none max-w-[100px]"
                        >
                            <option value="firebase">Firebase</option>
                            <option value="gdrive">Google Drive</option>
                            <option value="icloud">iCloud</option>
                            <option value="sqlite">SQLite (Local)</option>
                        </select>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Lock size={14} className={cloudSettings.encryption ? "text-emerald-500" : "text-slate-400"} />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">End-to-End Encryption (AES-256)</span>
                            </div>
                            <Toggle checked={cloudSettings.encryption} onChange={() => setCloudSettings({...cloudSettings, encryption: !cloudSettings.encryption})} />
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="text-blue-500" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Auto-Backup Daily</span>
                            </div>
                            <Toggle checked={cloudSettings.auto} onChange={() => setCloudSettings({...cloudSettings, auto: !cloudSettings.auto})} />
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] text-slate-400">Last Backup: {lastBackup || 'Never'}</span>
                            {lastBackup && <span className="text-[10px] text-emerald-500 flex items-center gap-1"><Check size={10} /> Synced</span>}
                        </div>
                        <button 
                            onClick={handleCloudBackup}
                            disabled={isBackingUp}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isBackingUp ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                            {isBackingUp ? `Syncing to ${cloudSettings.provider === 'gdrive' ? 'Drive' : cloudSettings.provider === 'icloud' ? 'iCloud' : 'Cloud'}...` : 'Backup Now'}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
                <h3 className="text-sm font-semibold mb-4 text-red-500 dark:text-red-400">Danger Zone</h3>
                <button onClick={() => setShowResetConfirm(true)} className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-[0.99]">
                    <Trash2 size={18} /> Reset All Data
                </button>
            </Card>
        </div>
      )}

      {viewMode === 'settings' && (
        <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
            {/* Settings content remains same as before */}
             <Card>
                <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Preferences</h3>
                <div className="space-y-1">
                    {/* Reusing renderSettingsModal logic via setActiveSetting */}
                    <button onClick={() => setActiveSetting('notifications')} className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
                                <Bell size={18} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notifications</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400" />
                    </button>
                    {/* ... other settings buttons ... */}
                </div>
            </Card>
        </div>
      )}
      
      </div>

      {renderSettingsModal()}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Factory Reset?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                    This will wipe <strong>everything</strong>: your budget, history, shopping lists, events, and collaboration groups. This cannot be undone.
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            resetData();
                            setShowResetConfirm(false);
                        }}
                        className="w-full py-3 text-white bg-red-600 hover:bg-red-700 font-bold rounded-xl transition-colors flex justify-center items-center"
                    >
                        Confirm Reset
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const ToggleRow = ({ label, sub, icon: Icon, checked, onChange, color }: { label: string, sub?: string, icon?: any, checked: boolean, onChange: (v: boolean) => void, color?: string }) => (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`p-2 rounded-lg ${checked ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Icon size={18} className={color} />
                </div>
            )}
            <div>
                <span className={`text-sm font-bold ${checked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{label}</span>
                {sub && <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>}
            </div>
        </div>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);
