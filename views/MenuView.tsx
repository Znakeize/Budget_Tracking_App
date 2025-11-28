
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { 
  History, Wrench, CalendarHeart, Settings, 
  LifeBuoy, FileText, MessageSquare, ChevronRight, 
  Bell, BellRing, UserCircle, Users, Crown, ShoppingCart, Calculator, PlayCircle 
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';

interface MenuViewProps {
  onNavigate: (tab: string) => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  onProfileClick: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  isPro?: boolean;
}

export const MenuView: React.FC<MenuViewProps> = ({ onNavigate, notificationCount, onToggleNotifications, onProfileClick }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const { t } = useLanguage();

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

  const menuItems = [
    { id: 'calculators', label: t('menu.calculators'), icon: Calculator, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', desc: t('menu.calculators_desc') },
    { id: 'shopping-list', label: t('menu.shopping'), icon: ShoppingCart, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', desc: t('menu.shopping_desc') },
    { id: 'history', label: t('menu.history'), icon: History, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', desc: t('menu.history_desc') },
    { id: 'tools', label: t('menu.tools'), icon: Wrench, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', desc: t('menu.tools_desc') },
    { id: 'community-links', label: t('menu.connect'), icon: Users, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400', desc: t('menu.connect_desc') },
  ];

  const listItems = [
    { id: 'app-demo', label: t('menu.app_demo'), icon: PlayCircle },
    { id: 'settings', label: t('menu.settings'), icon: Settings },
    { id: 'support', label: t('menu.support'), icon: LifeBuoy },
    { id: 'legal', label: t('menu.legal'), icon: FileText },
    { id: 'feedback', label: t('menu.feedback'), icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-full relative">
       {/* Fixed Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">{t('menu.overview')}</h2>
                    <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">{t('nav.menu')}</h1>
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

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
      
        {/* Profile Teaser */}
        <button 
            onClick={() => onNavigate('profile')}
            className="w-full text-left"
        >
            <Card className={`p-4 bg-white dark:bg-slate-800 border-l-4 ${user?.isPro ? 'border-l-amber-500' : 'border-l-indigo-500'} hover:shadow-md transition-all active:scale-[0.99]`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${user?.isPro ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        {user ? user.name.charAt(0).toUpperCase() : <UserCircle size={24} />}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                            {user ? user.name : t('menu.guest_user')}
                            {user?.isPro && <Crown size={14} className="text-amber-500" fill="currentColor" />}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user ? user.email : t('menu.sign_in_sync')}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </div>
            </Card>
        </button>

        {/* Main Features Grid */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">{t('menu.features')}</h3>
            <div className="grid grid-cols-2 gap-3">
                {/* Pro Membership Link (High Visibility) */}
                {!user?.isPro && (
                    <button 
                        onClick={() => onNavigate('pro-membership')}
                        className="p-4 bg-gradient-to-br from-slate-900 to-indigo-900 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg shadow-indigo-900/20 border border-indigo-500/30 hover:border-indigo-500 transition-all active:scale-95 text-left group col-span-2 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-yellow-400">
                                <Crown size={20} fill="currentColor" />
                            </div>
                            <div>
                                <div className="font-bold text-white">{t('menu.go_pro')}</div>
                                <div className="text-[10px] text-indigo-200">{t('menu.unlock_ai')}</div>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-white/50 group-hover:text-white transition-colors" />
                    </button>
                )}

                {menuItems.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all active:scale-95 text-left group"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color} group-hover:scale-110 transition-transform`}>
                            <item.icon size={20} />
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </button>
                ))}
            </div>
        </div>

        {/* App Options List */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">{t('menu.app')}</h3>
            <div className="space-y-2">
                {listItems.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-slate-400 dark:text-slate-500">
                                <item.icon size={20} />
                            </div>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                    </button>
                ))}
            </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-4">
            Budget Tracker Mobile v1.0.0
        </div>
      
      </div>
    </div>
  );
};
