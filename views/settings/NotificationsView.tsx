
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { 
  ChevronLeft, Bell, Calendar, Users, TrendingUp, 
  Shield, Zap, Mail, Smartphone, CheckCircle, AlertCircle,
  Moon, Clock, Volume2, VolumeX, ArrowRight
} from 'lucide-react';
import { HeaderProfile } from '../../components/ui/HeaderProfile';

interface NotificationsViewProps {
  onBack: () => void;
  onProfileClick: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, onProfileClick }) => {
  // Global Channels
  const [channels, setChannels] = useState({
    push: true,
    email: true
  });

  // Quiet Mode
  const [quietMode, setQuietMode] = useState({
    enabled: false,
    start: '22:00',
    end: '07:00'
  });

  // Categories
  const [general, setGeneral] = useState({
    bills: true,
    budget: true,
    weeklyDigest: false,
    tips: true
  });

  const [events, setEvents] = useState({
    deadlines: true,
    vendorPayments: true,
    budgetOverrun: true,
  });

  const [collab, setCollab] = useState({
    newExpense: true,
    settlements: true,
    activity: false,
  });

  const [investment, setInvestment] = useState({
    priceAlerts: true,
    targetHit: true,
    news: false,
  });

  const [system, setSystem] = useState({
    security: true,
    updates: true,
  });

  // Helpers
  const toggleChannel = (key: keyof typeof channels) => setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleQuietMode = () => setQuietMode(prev => ({ ...prev, enabled: !prev.enabled }));
  const toggleGeneral = (key: keyof typeof general) => setGeneral(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleEvents = (key: keyof typeof events) => setEvents(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleCollab = (key: keyof typeof collab) => setCollab(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleInvest = (key: keyof typeof investment) => setInvestment(prev => ({ ...prev, [key]: !prev[key] }));
  
  // System toggles are largely visual/locked but we keep state for consistency
  const toggleSystem = (key: keyof typeof system) => { /* Locked */ };

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Settings</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Notifications</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           {/* 1. Global Delivery Channels */}
           <section>
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Delivery Channels</h3>
               <div className="flex gap-3">
                   <button 
                      onClick={() => toggleChannel('push')}
                      className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${channels.push ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}
                   >
                       <div className={`p-2 rounded-full ${channels.push ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                           <Smartphone size={24} />
                       </div>
                       <span className="text-xs font-bold">Push Notifications</span>
                       {channels.push && <div className="absolute top-2 right-2 text-indigo-500"><CheckCircle size={16} /></div>}
                   </button>

                   <button 
                      onClick={() => toggleChannel('email')}
                      className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${channels.email ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}
                   >
                       <div className={`p-2 rounded-full ${channels.email ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                           <Mail size={24} />
                       </div>
                       <span className="text-xs font-bold">Email Digest</span>
                       {channels.email && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle size={16} /></div>}
                   </button>
               </div>
           </section>

           {/* 2. Quiet Mode */}
           <Card className={`p-4 border-2 transition-colors ${quietMode.enabled ? 'border-slate-800 dark:border-slate-600 bg-slate-900 dark:bg-slate-800 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${quietMode.enabled ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                           <Moon size={20} />
                       </div>
                       <div>
                           <h3 className={`text-sm font-bold ${quietMode.enabled ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Quiet Mode</h3>
                           <p className={`text-xs ${quietMode.enabled ? 'text-slate-400' : 'text-slate-500'}`}>Pause non-urgent notifications</p>
                       </div>
                   </div>
                   <Toggle checked={quietMode.enabled} onChange={toggleQuietMode} color="bg-white" />
               </div>

               {quietMode.enabled && (
                   <div className="flex items-center gap-3 pt-4 border-t border-slate-700 animate-in slide-in-from-top-2">
                       <div className="flex-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Time</label>
                           <div className="flex items-center bg-slate-800 rounded-lg px-3 py-2 border border-slate-600">
                               <Clock size={14} className="text-slate-400 mr-2" />
                               <input 
                                   type="time" 
                                   value={quietMode.start}
                                   onChange={(e) => setQuietMode({...quietMode, start: e.target.value})}
                                   className="bg-transparent text-sm font-bold outline-none text-white w-full"
                                   style={{colorScheme: 'dark'}}
                               />
                           </div>
                       </div>
                       <div className="text-slate-500 pt-4"><ArrowRight size={16} /></div>
                       <div className="flex-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Time</label>
                           <div className="flex items-center bg-slate-800 rounded-lg px-3 py-2 border border-slate-600">
                               <Clock size={14} className="text-slate-400 mr-2" />
                               <input 
                                   type="time" 
                                   value={quietMode.end}
                                   onChange={(e) => setQuietMode({...quietMode, end: e.target.value})}
                                   className="bg-transparent text-sm font-bold outline-none text-white w-full"
                                   style={{colorScheme: 'dark'}}
                               />
                           </div>
                       </div>
                   </div>
               )}
           </Card>

           {/* 3. Granular Controls */}
           <section className="space-y-4">
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Notification Types</h3>

               {/* General System */}
               <Card className="overflow-hidden">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                       <Zap size={16} className="text-indigo-500" />
                       <h3 className="font-bold text-slate-900 dark:text-white text-sm">Budget & Core</h3>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       <ToggleRow label="Bill Reminders" desc="Upcoming due dates & subscriptions" checked={general.bills} onChange={() => toggleGeneral('bills')} />
                       <ToggleRow label="Budget Thresholds" desc="Alerts when 80% or 100% is used" checked={general.budget} onChange={() => toggleGeneral('budget')} />
                       <ToggleRow label="Smart Tips" desc="AI savings recommendations" checked={general.tips} onChange={() => toggleGeneral('tips')} />
                       <ToggleRow label="Weekly Digest" desc="Summary of your spending habits" checked={general.weeklyDigest} onChange={() => toggleGeneral('weeklyDigest')} />
                   </div>
               </Card>

               {/* Event System */}
               <Card className="overflow-hidden border-pink-200 dark:border-pink-500/20">
                   <div className="p-4 border-b border-pink-100 dark:border-pink-500/20 flex items-center gap-2 bg-pink-50 dark:bg-pink-900/10">
                       <Calendar size={16} className="text-pink-500" />
                       <h3 className="font-bold text-pink-900 dark:text-pink-200 text-sm">Event Planning</h3>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       <ToggleRow label="Approaching Deadlines" desc="14-day and 3-day event countdowns" checked={events.deadlines} onChange={() => toggleEvents('deadlines')} activeColor="bg-pink-500" />
                       <ToggleRow label="Vendor Payments" desc="Overdue and upcoming payment alerts" checked={events.vendorPayments} onChange={() => toggleEvents('vendorPayments')} activeColor="bg-pink-500" />
                       <ToggleRow label="Budget Overrun" desc="Immediate alert if event exceeds total budget" checked={events.budgetOverrun} onChange={() => toggleEvents('budgetOverrun')} activeColor="bg-pink-500" />
                   </div>
               </Card>

               {/* Collaboration System */}
               <Card className="overflow-hidden border-amber-200 dark:border-amber-500/20">
                   <div className="p-4 border-b border-amber-100 dark:border-amber-500/20 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10">
                       <Users size={16} className="text-amber-500" />
                       <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">Collaboration</h3>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       <ToggleRow label="New Expense Added" desc="When a member adds a shared cost" checked={collab.newExpense} onChange={() => toggleCollab('newExpense')} activeColor="bg-amber-500" />
                       <ToggleRow label="Settlement Requests" desc="Requests to settle balances" checked={collab.settlements} onChange={() => toggleCollab('settlements')} activeColor="bg-amber-500" />
                       <ToggleRow label="Activity Log" desc="Member joins, leaves, or edits" checked={collab.activity} onChange={() => toggleCollab('activity')} activeColor="bg-amber-500" />
                   </div>
               </Card>

               {/* Investment System */}
               <Card className="overflow-hidden border-violet-200 dark:border-violet-500/20">
                   <div className="p-4 border-b border-violet-100 dark:border-violet-500/20 flex items-center gap-2 bg-violet-50 dark:bg-violet-900/10">
                       <TrendingUp size={16} className="text-violet-500" />
                       <h3 className="font-bold text-violet-900 dark:text-violet-200 text-sm">Investments</h3>
                   </div>
                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                       <ToggleRow label="Price Alerts" desc="Significant asset price movements" checked={investment.priceAlerts} onChange={() => toggleInvest('priceAlerts')} activeColor="bg-violet-500" />
                       <ToggleRow label="Goal Milestones" desc="When you reach saving targets" checked={investment.targetHit} onChange={() => toggleInvest('targetHit')} activeColor="bg-violet-500" />
                       <ToggleRow label="Market News" desc="AI-curated financial news summaries" checked={investment.news} onChange={() => toggleInvest('news')} activeColor="bg-violet-500" />
                   </div>
               </Card>

               {/* System - Locked */}
               <Card className="overflow-hidden bg-slate-100 dark:bg-slate-800/50 border-none opacity-90">
                   <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                       <Shield size={16} className="text-slate-500" />
                       <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">System (Required)</h3>
                   </div>
                   <div className="divide-y divide-slate-200 dark:divide-slate-700">
                       <ToggleRow label="Security Alerts" desc="New logins and password changes" checked={system.security} onChange={() => {}} locked />
                       <ToggleRow label="App Updates" desc="Critical features and improvements" checked={system.updates} onChange={() => {}} locked />
                   </div>
               </Card>
           </section>

       </div>
    </div>
  );
};

const ToggleRow = ({ label, desc, checked, onChange, locked, activeColor = 'bg-indigo-600' }: { label: string, desc: string, checked: boolean, onChange: () => void, locked?: boolean, activeColor?: string }) => (
    <div className={`p-4 flex justify-between items-center ${locked ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors`} onClick={locked ? undefined : onChange}>
        <div className="flex-1 pr-4">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {label}
                {locked && <span className="text-[8px] font-extrabold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wide">Required</span>}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{desc}</div>
        </div>
        <Toggle checked={checked} onChange={onChange} locked={locked} activeColor={activeColor} />
    </div>
);

const Toggle = ({ checked, onChange, locked, activeColor = 'bg-indigo-600', color }: { checked: boolean, onChange: () => void, locked?: boolean, activeColor?: string, color?: string }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); if (!locked) onChange(); }}
        className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${checked ? (color || activeColor) : 'bg-slate-300 dark:bg-slate-600'} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);
