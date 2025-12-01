import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen h-dvh bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-300">
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 dark:bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/10 dark:bg-pink-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
            <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[80px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full max-w-md mx-auto bg-slate-50/50 dark:bg-slate-900/50 shadow-2xl md:border-x border-slate-200 dark:border-white/10 transition-colors duration-300">
            {children}
        </div>
    </div>
  );
};