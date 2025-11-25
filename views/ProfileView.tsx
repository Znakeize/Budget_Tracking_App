


import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { User, Mail, Lock, LogOut, CheckCircle, History, Settings, Bell, BellRing, ChevronRight, UserCircle, Wrench, LifeBuoy, FileText, MessageSquare, Users } from 'lucide-react';

interface ProfileViewProps {
  onNavigate: (tab: string) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  joined: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, notificationCount, onToggleNotifications }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    setTimeout(() => {
        setIsLoading(false);
        if (authMode === 'login') {
            if (formData.email && formData.password) {
                const mockUser = {
                    name: formData.email.split('@')[0], 
                    email: formData.email,
                    joined: Date.now()
                };
                setUser(mockUser);
                localStorage.setItem('budget_user_session', JSON.stringify(mockUser));
                setFormData({ name: '', email: '', password: '' });
            } else {
                setFormError('Please fill in all fields.');
            }
        } else {
            if (formData.name && formData.email && formData.password) {
                 const mockUser = {
                    name: formData.name,
                    email: formData.email,
                    joined: Date.now()
                };
                setUser(mockUser);
                localStorage.setItem('budget_user_session', JSON.stringify(mockUser));
                setFormData({ name: '', email: '', password: '' });
            } else {
                setFormError('Please fill in all fields.');
            }
        }
    }, 1000);
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        const mockUser = {
            name: `${provider} User`,
            email: `user@${provider.toLowerCase().replace(/\s+/g, '')}.com`,
            joined: Date.now()
        };
        setUser(mockUser);
        localStorage.setItem('budget_user_session', JSON.stringify(mockUser));
    }, 1500);
  };

  const handleLogout = () => {
    if(confirm('Are you sure you want to log out?')) {
        setUser(null);
        localStorage.removeItem('budget_user_session');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
       {/* Fixed Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Account</h2>
                    <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Profile</h1>
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
      
      {/* User Card */}
      <Card className="overflow-visible">
        {user ? (
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                            <CheckCircle size={10} /> Pro Member
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                     <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors group">
                        <UserCircle size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Edit Profile</span>
                     </button>
                     <button onClick={handleLogout} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 flex flex-col items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group">
                        <LogOut size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">Sign Out</span>
                     </button>
                </div>
             </div>
        ) : (
            <div>
                <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                    <button 
                        onClick={() => { setAuthMode('login'); setFormError(''); }}
                        className={`flex-1 pb-2 text-sm font-bold transition-colors ${authMode === 'login' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => { setAuthMode('register'); setFormError(''); }}
                        className={`flex-1 pb-2 text-sm font-bold transition-colors ${authMode === 'register' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                    {authMode === 'register' && (
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Full Name"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    )}
                    
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input 
                            type="email" 
                            placeholder="Email Address"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input 
                            type="password" 
                            placeholder="Password"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    {formError && <p className="text-xs text-red-500 text-center">{formError}</p>}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            authMode === 'login' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleSocialLogin('Google')}
                        className="flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800"
                        title="Sign in with Google"
                    >
                         <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('Facebook')}
                        className="flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800"
                        title="Sign in with Facebook"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </button>
                    <button 
                        onClick={() => handleSocialLogin('Apple')}
                        className="flex items-center justify-center p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800"
                        title="Sign in with Apple"
                    >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.65-1.42 1.93.18 3.52 1.41 4.2 2.18-3.51 1.95-3.03 6.67.6 8.35-.45 1.18-1.06 2.25-2.08 3.32-.82 1-1.77 1.68-2.45 1.68zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    </button>
                </div>
            </div>
        )}
      </Card>

       {/* Menu */}
       <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Menu</h3>
            
            <button onClick={() => onNavigate('history')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <History size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Budget History</span>
                        <span className="text-xs text-slate-400">View past periods and reports</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>
            
            <button onClick={() => onNavigate('tools')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Wrench size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Tools</span>
                        <span className="text-xs text-slate-400">Export, Import, Backup</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button onClick={() => onNavigate('collaborative')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Users size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Community</span>
                        <span className="text-xs text-slate-400">Join our social groups</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button onClick={() => onNavigate('settings')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl">
                        <Settings size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Settings</span>
                        <span className="text-xs text-slate-400">Preferences, Appearance</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button onClick={() => onNavigate('support')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                        <LifeBuoy size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Support</span>
                        <span className="text-xs text-slate-400">Get help and FAQs</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button onClick={() => onNavigate('legal')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                        <FileText size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Legal</span>
                        <span className="text-xs text-slate-400">Terms & Privacy</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>

            <button onClick={() => onNavigate('feedback')} className="w-full bg-white dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                        <MessageSquare size={22} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-slate-700 dark:text-white">Share Feedback</span>
                        <span className="text-xs text-slate-400">Help us improve</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
            </button>
       </div>

      <div className="text-center text-xs text-slate-400 dark:text-slate-600 pb-4 mt-6">
        BudgetFlow Mobile v1.0.0
      </div>
      
      </div>
    </div>
  );
};
