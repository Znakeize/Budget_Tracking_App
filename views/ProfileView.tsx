
import React from 'react';
import { Card } from '../components/ui/Card';
import { 
  User, Mail, LogOut, Bell, BellRing, ChevronLeft, 
  UserCircle, Settings, Shield, Crown, ChevronRight, Sparkles, 
  Calendar, CreditCard, HelpCircle, FileText, Edit3, Share2,
  Award, Zap, LayoutGrid, ExternalLink, CheckCircle2, Star
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface ProfileViewProps {
  user: { name: string, email: string, joined: number, isPro?: boolean, unlockedFeatures?: string[] } | null;
  onLogout: () => void;
  onBack: () => void;
  onNavigate: (tab: string) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout, onBack, onNavigate, notificationCount, onToggleNotifications }) => {
  
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  
  const getMemberDuration = (timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days < 30) return `${days} Days`;
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} Months`;
      return `${Math.floor(months / 12)} Years`;
  };

  const isMember = user && !user.isPro && user.unlockedFeatures && user.unlockedFeatures.length > 0;

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Account</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">My Profile</h1>
                    </div>
                </div>
                <div className="pb-1 flex items-center gap-1">
                    <button 
                        onClick={onToggleNotifications}
                        className="relative p-1.5 focus:outline-none active:scale-95 transition-transform"
                    >
                        {notificationCount > 0 ? (
                            <>
                                <BellRing size={22} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-900"></span>
                            </>
                        ) : (
                            <Bell size={22} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                        )}
                    </button>
                </div>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 space-y-6">
      
      {user ? (
        <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
            
            {/* Hero Identity Card */}
            <div className={`relative overflow-hidden rounded-[32px] p-6 text-white shadow-xl ${
                user.isPro 
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-black' 
                    : isMember
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                        : 'bg-gradient-to-br from-indigo-600 to-violet-700'
            }`}>
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform -translate-x-5 translate-y-5"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                             <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-2xl font-bold shadow-lg">
                                    {getInitials(user.name)}
                                </div>
                                {user.isPro ? (
                                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-900 w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md">
                                        <Crown size={12} fill="currentColor" />
                                    </div>
                                ) : isMember ? (
                                     <div className="absolute -bottom-1 -right-1 bg-white text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center border-2 border-emerald-600 shadow-md">
                                        <Star size={12} fill="currentColor" />
                                    </div>
                                ) : null}
                             </div>
                             <div>
                                 <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                     {user.name}
                                     {user.isPro && <CheckCircle2 size={16} className="text-blue-400" fill="currentColor" stroke="black" />}
                                 </h2>
                                 <p className="text-white/70 text-xs font-medium">{user.email}</p>
                                 <div className="mt-2 flex gap-2">
                                     <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                         user.isPro 
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                            : isMember 
                                                ? 'bg-white/20 text-white border border-white/30'
                                                : 'bg-white/20 text-white'
                                     }`}>
                                         {user.isPro ? 'Pro Member' : isMember ? 'Member' : 'Basic Plan'}
                                     </span>
                                 </div>
                             </div>
                        </div>
                        <button onClick={() => onNavigate('personal-info')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                            <Edit3 size={18} />
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                        <div className="text-center">
                            <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Member Since</p>
                            <p className="font-bold text-sm">{new Date(user.joined).getFullYear()}</p>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Features</p>
                            <p className="font-bold text-sm">{user.unlockedFeatures ? user.unlockedFeatures.length : 0}</p>
                        </div>
                        <div className="text-center border-l border-white/10">
                            <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Status</p>
                            <p className="font-bold text-sm text-emerald-400">Verified</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Membership Status / Upsell */}
            {!user.isPro && (
                <button onClick={() => onNavigate('pro-membership')} className="w-full text-left group">
                    <div className="p-[2px] rounded-2xl bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 shadow-lg group-hover:shadow-xl transition-all active:scale-[0.98]">
                        <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Crown size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Upgrade to Pro</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Unlock AI Insights & Cloud Sync</p>
                                </div>
                            </div>
                            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                                Go Pro
                            </div>
                        </div>
                    </div>
                </button>
            )}

            {/* Manage Subscription - Show if Pro OR has unlocked features */}
            {(user.isPro || (user.unlockedFeatures && user.unlockedFeatures.length > 0)) && (
                 <button onClick={() => onNavigate('membership-management')} className="w-full text-left group">
                    <div className="p-[2px] rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 shadow-md group-hover:shadow-lg transition-all active:scale-[0.98]">
                        <div className="bg-white dark:bg-slate-900 rounded-[14px] p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Manage Subscription</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {user.isPro ? 'Active • Renews Monthly' : `${user.unlockedFeatures?.length} Active Module${(user.unlockedFeatures?.length || 0) !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                </button>
            )}

            {/* Menu Grid for Account */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Account Settings</h3>
                <div className="grid grid-cols-1 gap-2">
                     <MenuButton 
                        icon={UserCircle} 
                        title="Personal Info" 
                        onClick={() => onNavigate('personal-info')}
                    />
                     <MenuButton 
                        icon={Shield} 
                        title="Login & Security" 
                        onClick={() => onNavigate('security')}
                    />
                </div>
            </div>

            {/* Menu Grid for App */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">App Settings</h3>
                <div className="grid grid-cols-1 gap-2">
                    <MenuButton 
                        icon={Settings} 
                        title="General Preferences" 
                        onClick={() => onNavigate('settings')}
                    />
                    <MenuButton 
                        icon={Bell} 
                        title="Notifications" 
                        onClick={() => onNavigate('notifications')}
                    />
                </div>
            </div>

             {/* Menu Grid for Support */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Support</h3>
                <div className="grid grid-cols-1 gap-2">
                    <MenuButton 
                        icon={HelpCircle} 
                        title="Help & FAQ" 
                        onClick={() => onNavigate('support')}
                    />
                    <MenuButton 
                        icon={FileText} 
                        title="Legal & Privacy" 
                        onClick={() => onNavigate('legal')}
                    />
                </div>
            </div>

            {/* Logout */}
            <button 
                onClick={onLogout}
                className="w-full p-4 rounded-2xl border-2 border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-800 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 shadow-sm mt-4"
            >
                <LogOut size={18} /> Sign Out
            </button>

            <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 pb-6 pt-2">
                Version 1.2.0 • Build 2025.01
            </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                <User size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Guest User</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-xs mx-auto">
                    Sign in to sync your budget across devices and unlock your full profile potential.
                </p>
            </div>
            <button 
                onClick={onLogout} 
                className="w-full max-w-xs px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
                Sign In / Register
            </button>
        </div>
      )}
      
      </div>
    </div>
  );
};

const MenuButton = ({ icon: Icon, title, onClick }: { icon: any, title: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-[0.99] group shadow-sm"
    >
        <div className="flex items-center gap-3">
            <div className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                <Icon size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {title}
            </span>
        </div>
        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
    </button>
);
