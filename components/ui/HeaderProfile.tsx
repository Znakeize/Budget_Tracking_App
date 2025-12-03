
import React, { useState, useEffect } from 'react';

interface HeaderProfileProps {
  onClick?: () => void;
  user?: { name: string; isPro?: boolean; unlockedFeatures?: string[] };
}

export const HeaderProfile: React.FC<HeaderProfileProps> = ({ onClick, user: propUser }) => {
  const [localUser, setLocalUser] = useState<{name: string; isPro?: boolean; unlockedFeatures?: string[]} | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('budget_user_session');
      if (savedUser) {
        try {
          setLocalUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user session');
        }
      }
    };
    
    loadUser();
  }, []);

  const currentUser = propUser || localUser;

  const isPro = currentUser?.isPro;
  const isMember = !isPro && currentUser?.unlockedFeatures && currentUser.unlockedFeatures.length > 0;

  return (
    <button 
      onClick={onClick}
      className={`ml-2 flex-shrink-0 rounded-full focus:outline-none transition-transform active:scale-95 relative group ${onClick ? 'cursor-pointer' : ''}`}
      aria-label="Go to Profile"
    >
      {/* Animated Outline for All Logged In Users */}
      {currentUser && (
        <div className={`absolute -inset-[3px] rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-500 ${
          isPro 
            ? 'bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-300 animate-[spin_3s_linear_infinite]' 
            : isMember
                ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-emerald-400 animate-[spin_4s_linear_infinite]'
                : 'bg-gradient-to-tr from-indigo-400 via-blue-500 to-indigo-400 animate-[spin_4s_linear_infinite]'
        }`}></div>
      )}

      {currentUser ? (
        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border-2 z-10 ${
             isPro 
             ? 'bg-slate-900 text-amber-400 border-slate-800'
             : isMember
                ? 'bg-slate-900 text-emerald-400 border-slate-800'
                : 'bg-slate-900 text-indigo-400 border-slate-800'
        }`}>
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="relative w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-white dark:border-slate-600 z-10">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      )}
    </button>
  );
};
