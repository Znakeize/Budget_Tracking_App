import React from 'react';
import { Home, Wallet, Plus, Crown, Menu } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAdd: () => void;
  badgeTabs?: string[];
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onAdd, badgeTabs = [] }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'budget', icon: Wallet, label: 'Budget' },
    { id: 'add', icon: Plus, label: '', isAction: true },
    { id: 'ai', icon: Crown, label: 'AI' },
    { id: 'menu', icon: Menu, label: 'Menu' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto pb-0">
        <div className="relative h-[50px] w-full filter drop-shadow-[0_-5px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_-5px_10px_rgba(0,0,0,0.2)]">
            
            {/* Background Construction: Left Panel | Center Curve | Right Panel */}
            <div className="absolute inset-0 flex items-end">
                {/* Left Panel */}
                <div className="flex-1 h-full bg-white dark:bg-slate-900 rounded-tl-2xl"></div>
                
                {/* Center Curve */}
                <div className="w-[120px] h-full bg-transparent relative -ml-[0.5px] -mr-[0.5px]">
                    <svg className="w-full h-full fill-white dark:fill-slate-900 block" viewBox="0 0 120 50" preserveAspectRatio="none">
                         <path d="M0,0 L30,0 C45,0 45,35 60,35 C75,35 75,0 90,0 L120,0 V50 H0 Z" />
                    </svg>
                </div>
                
                {/* Right Panel */}
                <div className="flex-1 h-full bg-white dark:bg-slate-900 rounded-tr-2xl"></div>
            </div>

            {/* Floating Action Button */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                <button
                    onClick={onAdd}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/40 flex items-center justify-center transform transition-transform hover:scale-105 active:scale-95 border-4 border-white dark:border-slate-900"
                    aria-label="Add Item"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>

            {/* Tabs */}
            <div className="absolute inset-0 flex justify-between items-center px-2 z-10">
                {tabs.map((tab) => {
                    if (tab.isAction) {
                        return <div key={tab.id} className="w-[20%]" />;
                    }
                    
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const showBadge = badgeTabs.includes(tab.id);

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-[20%] h-full flex flex-col items-center justify-center gap-0.5 group relative ${
                                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''} relative`}>
                                <Icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"></span>
                                )}
                            </div>
                            <span className={`text-[9px] font-medium transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} absolute bottom-1`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};