import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, Mail, Bell, ShieldAlert, FileText, Zap } from 'lucide-react';
import { HeaderProfile } from '../../components/ui/HeaderProfile';

interface EmailPreferencesViewProps {
  onBack: () => void;
  onProfileClick: () => void;
}

export const EmailPreferencesView: React.FC<EmailPreferencesViewProps> = ({ onBack, onProfileClick }) => {
  const [prefs, setPrefs] = useState({
    productUpdates: true,
    securityAlerts: true,
    billReminders: true,
    weeklyDigest: false,
    marketing: false
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Settings</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Email Prefs</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           <Card className="divide-y divide-slate-100 dark:divide-slate-800">
               <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                           <Zap size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">Product Updates</h4>
                           <p className="text-xs text-slate-500">New features and improvements</p>
                       </div>
                   </div>
                   <Toggle checked={prefs.productUpdates} onChange={() => toggle('productUpdates')} />
               </div>

               <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                           <ShieldAlert size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security Alerts</h4>
                           <p className="text-xs text-slate-500">Login attempts and password changes</p>
                       </div>
                   </div>
                   <Toggle checked={prefs.securityAlerts} onChange={() => toggle('securityAlerts')} />
               </div>

               <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                           <Bell size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bill Reminders</h4>
                           <p className="text-xs text-slate-500">Notifications for upcoming due dates</p>
                       </div>
                   </div>
                   <Toggle checked={prefs.billReminders} onChange={() => toggle('billReminders')} />
               </div>

               <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                           <FileText size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Digest</h4>
                           <p className="text-xs text-slate-500">Summary of your weekly spending</p>
                       </div>
                   </div>
                   <Toggle checked={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
               </div>

               <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                           <Mail size={20} />
                       </div>
                       <div>
                           <h4 className="text-sm font-bold text-slate-900 dark:text-white">Marketing</h4>
                           <p className="text-xs text-slate-500">Promotions and partner offers</p>
                       </div>
                   </div>
                   <Toggle checked={prefs.marketing} onChange={() => toggle('marketing')} />
               </div>
           </Card>

           <p className="text-center text-xs text-slate-400 px-4">
               Note: Essential account notifications cannot be disabled.
           </p>
       </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);