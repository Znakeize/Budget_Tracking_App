
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Moon, Sun, Globe, DollarSign, Bell, Shield, User, ChevronRight, Trash2, LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';
import { CURRENCY_SYMBOLS } from '../constants';
import { BudgetData } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onProfileClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  budgetData: BudgetData;
  onUpdateBudget: (data: BudgetData) => void;
  onNavigate: (tab: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onProfileClick,
  isDarkMode,
  toggleTheme,
  budgetData,
  onUpdateBudget,
  onNavigate,
  onResetData
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const languages = [
    { code: 'English', label: 'English', flag: '🇺🇸' },
    { code: 'Spanish', label: 'Español', flag: '🇪🇸' },
    { code: 'French', label: 'Français', flag: '🇫🇷' },
    { code: 'German', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'Chinese', label: '中文', flag: '🇨🇳' },
    { code: 'Japanese', label: '日本語', flag: '🇯🇵' },
    { code: 'Sinhala', label: 'සිංහල', flag: '🇱🇰' },
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'LKR', 'INR', 'AUD', 'CAD', 'CNY', 'JPY'];

  const handleCurrencyChange = (code: string) => {
    const symbol = CURRENCY_SYMBOLS[code] || '$';
    onUpdateBudget({ ...budgetData, currency: code as any, currencySymbol: symbol });
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Preferences</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Settings</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           {/* Appearance & Localization */}
           <section>
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">General</h3>
               <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                   {/* Theme Toggle */}
                   <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                               {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                           </div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appearance</h4>
                               <p className="text-xs text-slate-500">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                           </div>
                       </div>
                       <button 
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
                       </button>
                   </div>

                   {/* Language Selector */}
                   <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                               <Globe size={20} />
                           </div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Language</h4>
                               <p className="text-xs text-slate-500">{language}</p>
                           </div>
                       </div>
                       <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-2 rounded-lg outline-none"
                       >
                           {languages.map(l => (
                               <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                           ))}
                       </select>
                   </div>

                   {/* Currency Selector */}
                   <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                               <DollarSign size={20} />
                           </div>
                           <div>
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Currency</h4>
                               <p className="text-xs text-slate-500">{budgetData.currency} ({budgetData.currencySymbol})</p>
                           </div>
                       </div>
                       <select 
                            value={budgetData.currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-2 rounded-lg outline-none"
                       >
                           {currencies.map(c => (
                               <option key={c} value={c}>{c}</option>
                           ))}
                       </select>
                   </div>
               </Card>
           </section>

           {/* Account & Security */}
           <section>
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Account</h3>
               <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                   <button onClick={() => onNavigate('personal-info')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                               <User size={20} />
                           </div>
                           <div className="text-left">
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Personal Info</h4>
                               <p className="text-xs text-slate-500">Name, Phone & Address</p>
                           </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-400" />
                   </button>

                   <button onClick={() => onNavigate('security')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                               <Shield size={20} />
                           </div>
                           <div className="text-left">
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security</h4>
                               <p className="text-xs text-slate-500">Password & 2FA</p>
                           </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-400" />
                   </button>

                   <button onClick={() => onNavigate('notifications')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                               <Bell size={20} />
                           </div>
                           <div className="text-left">
                               <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                               <p className="text-xs text-slate-500">System, Events & Alerts</p>
                           </div>
                       </div>
                       <ChevronRight size={16} className="text-slate-400" />
                   </button>
               </Card>
           </section>

           {/* Danger Zone */}
           <section>
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 ml-1">Danger Zone</h3>
                <Card className="p-4 border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="text-sm font-bold text-red-700 dark:text-red-400">Reset Application</h4>
                            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1 leading-relaxed">
                                This will permanently delete all your local data, including budgets, history, and settings. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                    >
                        <Trash2 size={14} /> Reset All Data
                    </button>
                </Card>
           </section>
       </div>

       {/* Reset Confirmation Modal */}
       {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Confirm Factory Reset?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                    All your data will be wiped immediately. You will be returned to the initial setup state.
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
                            onResetData();
                            setShowResetConfirm(false);
                        }}
                        className="w-full py-3 text-white bg-red-600 hover:bg-red-700 font-bold rounded-xl transition-colors"
                    >
                        Yes, Delete Everything
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
