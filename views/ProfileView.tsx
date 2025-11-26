
import React from 'react';
import { Card } from '../components/ui/Card';
import { User, Mail, LogOut, CheckCircle, Bell, BellRing, ChevronLeft, UserCircle, Settings, Shield, Crown, ChevronRight, Package } from 'lucide-react';
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
  // Format joined date
  const joinedDate = user ? new Date(user.joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Account</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">My Profile</h1>
                    </div>
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
                    <HeaderProfile />
                </div>
            </div>
       </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-24">
      
      {user ? (
        <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
            {/* Profile Header Card */}
            <div className="flex flex-col items-center text-center pt-4 pb-2">
                <div className="relative">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-2xl mb-4 ring-4 ring-white dark:ring-slate-800 text-5xl font-bold ${user.isPro ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.isPro && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 w-9 h-9 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-sm">
                            <Crown size={14} fill="currentColor" />
                        </div>
                    )}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                
                <div className="flex gap-3 mt-4">
                    {user.isPro ? (
                        <div className="px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
                            <Crown size={12} fill="currentColor" /> PRO Active
                        </div>
                    ) : (
                        <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700">
                            Free Plan
                        </div>
                    )}
                    <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700">
                        Joined {joinedDate}
                    </div>
                </div>
            </div>

            {/* Pro Upgrade / Status Banner */}
            {!user.isPro ? (
                <>
                    <button 
                        onClick={() => onNavigate('pro-membership')}
                        className="w-full"
                    >
                        <Card className="p-4 bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-indigo-900 dark:to-purple-900 text-white border-none relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-300 backdrop-blur-sm">
                                        <Crown size={24} fill="currentColor" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-lg">Upgrade to Pro</h3>
                                        <p className="text-xs text-slate-300">Unlock AI Insights & Unlimited History</p>
                                    </div>
                                </div>
                                <div className="bg-white text-indigo-900 p-2 rounded-full group-hover:scale-110 transition-transform">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </Card>
                    </button>

                    {user.unlockedFeatures && user.unlockedFeatures.length > 0 && (
                        <Card className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Features Unlocked</h4>
                                    <p className="text-xs text-slate-500 mt-1">You have {user.unlockedFeatures.length} lifetime modules.</p>
                                </div>
                                <button 
                                    onClick={() => onNavigate('membership-management')}
                                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1"
                                >
                                    Manage
                                </button>
                            </div>
                        </Card>
                    )}
                </>
            ) : (
                <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Membership Active</h4>
                            <p className="text-xs text-slate-500 mt-1">Your Pro plan renews on Feb 1, 2025.</p>
                        </div>
                        <button 
                            onClick={() => onNavigate('membership-management')}
                            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        >
                            Manage
                        </button>
                    </div>
                </Card>
            )}

            {/* Account Settings */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Settings</h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <button onClick={() => onNavigate('personal-info')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <UserCircle size={20} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Personal Information</div>
                            <div className="text-xs text-slate-500">Update name and contact details</div>
                        </div>
                    </button>
                    <button onClick={() => onNavigate('email-prefs')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <Mail size={20} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Email Preferences</div>
                            <div className="text-xs text-slate-500">Manage newsletters and alerts</div>
                        </div>
                    </button>
                    <button onClick={() => onNavigate('security')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <Shield size={20} />
                        </div>
                        <div className="text-left flex-1">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">Security</div>
                            <div className="text-xs text-slate-500">Change password and 2FA</div>
                        </div>
                    </button>
                </div>
            </Card>

            {/* Logout */}
            <button 
                onClick={onLogout}
                className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
            >
                <LogOut size={18} /> Sign Out
            </button>
        </div>
      ) : (
        <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Not Signed In</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please sign in to view your profile and sync data.</p>
            <button 
                onClick={onLogout} // Acts as "Go to Login" since logout redirects to auth
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
                Sign In
            </button>
        </div>
      )}
      
      </div>
    </div>
  );
};
