
import React, { useState } from 'react';
import { BudgetData } from '../types';
import { Card } from '../components/ui/Card';
import { analyzeBudgetWithAI } from '../utils/aiHelper';
import { Sparkles, Bot, Loader2, Bell, BellRing, X, PieChart, ChevronRight, TrendingUp, CalendarHeart, Users, Lock, RefreshCcw, Hexagon } from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface AIViewProps {
  history: BudgetData[];
  currencySymbol: string;
  notificationCount: number;
  onToggleNotifications: () => void;
  onViewAnalysis: () => void;
  onViewInvestments: () => void;
  onViewEvents: () => void;
  onViewSimulator: () => void;
  onViewSocial: () => void;
  eventNotificationCount?: number;
  socialNotificationCount?: number;
  investmentNotificationCount?: number;
  onProfileClick: () => void;
  user: any;
  onNavigate: (tab: string) => void;
  onViewFeature?: (featureId: string) => void;
}

export const AIView: React.FC<AIViewProps> = ({ 
  history, 
  currencySymbol, 
  notificationCount, 
  onToggleNotifications,
  onViewAnalysis,
  onViewInvestments,
  onViewEvents,
  onViewSimulator,
  onViewSocial,
  eventNotificationCount = 0,
  socialNotificationCount = 0,
  investmentNotificationCount = 0,
  onProfileClick,
  user,
  onNavigate,
  onViewFeature
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    const result = await analyzeBudgetWithAI(history, currencySymbol);
    setAiAnalysis(result);
    setIsAiLoading(false);
  };

  const hasAccess = (featureId: string) => {
      return user?.isPro || (user?.unlockedFeatures && user.unlockedFeatures.includes(featureId));
  };

  const handleRestrictedClick = (featureId: string, action: () => void) => {
      if (hasAccess(featureId)) {
          action();
      } else {
          // Redirect to store to unlock specific feature
          if (onViewFeature) {
              onViewFeature(featureId);
          } else {
              onNavigate('pro-membership');
          }
      }
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Fixed Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Gemini Powered</h2>
                    <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        AI Advisor <Bot className="text-indigo-600 dark:text-indigo-400 h-6 w-6" />
                    </h1>
                </div>
                <div className="flex items-center gap-1 pb-1">
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
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">
        
        {/* Quick Insights Card with AI */}
        <Card className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Sparkles size={20} className="text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Smart Financial Review</h3>
                        <p className="text-xs text-indigo-100 opacity-90 max-w-[200px]">Get personalized insights, trend predictions, and saving tips powered by Gemini AI.</p>
                    </div>
                </div>
                
                {aiAnalysis ? (
                    <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs font-bold uppercase tracking-wider opacity-80">AI Analysis Result</h4>
                             <button onClick={() => setAiAnalysis(null)} className="text-white/60 hover:text-white"><X size={14} /></button>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                    </div>
                ) : (
                    <button 
                        onClick={handleAiAnalysis}
                        disabled={isAiLoading}
                        className="mt-2 py-2 px-4 bg-white text-indigo-600 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isAiLoading ? 'Analyzing...' : 'Generate Analysis'}
                    </button>
                )}
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
        </Card>

        {/* Life Simulator Entry */}
        <button onClick={() => handleRestrictedClick('simulator', onViewSimulator)} className="w-full text-left group">
            <Card className="p-5 bg-white dark:bg-slate-800 border-2 border-fuchsia-500/20 hover:border-fuchsia-500 transition-all shadow-sm group-hover:shadow-md relative overflow-hidden">
                {!hasAccess('simulator') && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transform group-hover:scale-105 transition-transform">
                            <Lock size={14} /> <span className="text-xs font-bold">Unlock Feature</span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform duration-300">
                        <RefreshCcw size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Life Event Simulator</h3>
                            <span className="px-2 py-0.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 text-[9px] font-bold rounded-full uppercase">New</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Predict the financial impact of having a baby, buying a house, or retirement.</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-fuchsia-500 transition-colors" />
                </div>
            </Card>
        </button>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleRestrictedClick('analysis', onViewAnalysis)} className="text-left group relative">
                <Card className="p-4 h-full border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors relative overflow-hidden">
                    {!hasAccess('analysis') && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <Lock size={16} className="text-slate-900 dark:text-white" />
                        </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Deep Analysis</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Advanced charts & expense breakdown.</p>
                </Card>
            </button>

            <button onClick={() => handleRestrictedClick('investments', onViewInvestments)} className="text-left group relative">
                <Card className="p-4 h-full border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors relative overflow-hidden">
                    {!hasAccess('investments') && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <Lock size={16} className="text-slate-900 dark:text-white" />
                        </div>
                    )}
                    
                    {/* Notification Icon */}
                    {investmentNotificationCount > 0 && (
                        <div className="absolute top-3 right-3 animate-in zoom-in duration-300 z-10">
                            <div className="relative drop-shadow-md">
                                <Hexagon size={22} className="text-red-500" fill="currentColor" strokeWidth={0} />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                    {investmentNotificationCount > 9 ? '!' : investmentNotificationCount}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                        <PieChart size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Investments</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Track portfolio growth & assets.</p>
                </Card>
            </button>

            <button onClick={() => handleRestrictedClick('events', onViewEvents)} className="text-left group relative">
                <Card className="p-4 h-full border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors relative overflow-hidden">
                    {!hasAccess('events') && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <Lock size={16} className="text-slate-900 dark:text-white" />
                        </div>
                    )}
                    
                    {/* Notification Icon */}
                    {eventNotificationCount > 0 && (
                        <div className="absolute top-3 right-3 animate-in zoom-in duration-300 z-10">
                            <div className="relative drop-shadow-md">
                                <Hexagon size={22} className="text-red-500" fill="currentColor" strokeWidth={0} />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                    {eventNotificationCount > 9 ? '!' : eventNotificationCount}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                            <CalendarHeart size={20} />
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Event Planner</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage weddings, trips & parties.</p>
                </Card>
            </button>

            <button onClick={() => handleRestrictedClick('social', onViewSocial)} className="text-left group relative">
                <Card className="p-4 h-full border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors relative overflow-hidden">
                    {!hasAccess('social') && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <Lock size={16} className="text-slate-900 dark:text-white" />
                        </div>
                    )}
                    
                    {/* Notification Icon */}
                    {socialNotificationCount > 0 && (
                        <div className="absolute top-3 right-3 animate-in zoom-in duration-300 z-10">
                            <div className="relative drop-shadow-md">
                                <Hexagon size={22} className="text-red-500" fill="currentColor" strokeWidth={0} />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                    {socialNotificationCount > 9 ? '!' : socialNotificationCount}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Users size={20} />
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Collaboration</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Shared budgets & group splits.</p>
                </Card>
            </button>
        </div>
      </div>
    </div>
  );
};