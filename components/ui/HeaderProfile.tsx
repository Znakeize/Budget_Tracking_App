import React, { useState, useEffect } from 'react';

interface HeaderProfileProps {
  onClick?: () => void;
}

export const HeaderProfile: React.FC<HeaderProfileProps> = ({ onClick }) => {
  const [user, setUser] = useState<{name: string} | null>(null);

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

  return (
    <button 
      onClick={onClick}
      className={`ml-2 flex-shrink-0 rounded-full focus:outline-none transition-transform active:scale-95 ${onClick ? 'cursor-pointer' : ''}`}
      aria-label="Go to Profile"
    >
      {user ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm border-2 border-white dark:border-slate-700 ring-1 ring-black/5">
          {user.name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-white dark:border-slate-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      )}
    </button>
  );
};