
import React from 'react';
import { ChevronLeft, Sun, Moon, Smartphone } from 'lucide-react';

interface AppearanceViewProps {
  onBack: () => void;
  themeMode: 'light' | 'dark' | 'system';
  onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({ 
    onBack, 
    themeMode, 
    onSetThemeMode
}) => {
  
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
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Appearance</h1>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8 pb-28">
           
           {/* Theme Selection Section */}
           <section>
               <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 ml-1">Theme Preference</h3>
               <div className="grid grid-cols-3 gap-4 mb-6">
                   {/* Light Theme Card */}
                   <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onSetThemeMode('light')}>
                        <div className={`w-full aspect-[9/16] rounded-2xl border-4 bg-white relative overflow-hidden shadow-sm transition-all ${themeMode === 'light' ? 'border-indigo-600 scale-105 shadow-xl' : 'border-slate-200 dark:border-slate-700 group-hover:border-slate-300'}`}>
                            {/* Mock UI Elements */}
                            <div className="absolute top-3 left-2 right-2 h-2 bg-slate-100 rounded-full"></div>
                            <div className="absolute top-7 left-2 w-1/2 h-3 bg-slate-200 rounded-full"></div>
                            <div className="absolute top-12 left-2 right-2 h-16 bg-slate-50 rounded-xl border border-slate-100"></div>
                            <div className="absolute top-32 left-2 right-2 bottom-2 bg-slate-50 rounded-t-xl border-t border-x border-slate-100"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sun className="text-slate-400" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Light</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${themeMode === 'light' ? 'border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                {themeMode === 'light' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                            </div>
                        </div>
                   </div>

                   {/* Dark Theme Card */}
                   <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onSetThemeMode('dark')}>
                        <div className={`w-full aspect-[9/16] rounded-2xl border-4 bg-slate-900 relative overflow-hidden shadow-sm transition-all ${themeMode === 'dark' ? 'border-indigo-600 scale-105 shadow-xl' : 'border-slate-200 dark:border-slate-700 group-hover:border-slate-500'}`}>
                            {/* Mock UI Elements */}
                            <div className="absolute top-3 left-2 right-2 h-2 bg-slate-800 rounded-full"></div>
                            <div className="absolute top-7 left-2 w-1/2 h-3 bg-slate-700 rounded-full"></div>
                            <div className="absolute top-12 left-2 right-2 h-16 bg-slate-800 rounded-xl border border-slate-700"></div>
                            <div className="absolute top-32 left-2 right-2 bottom-2 bg-slate-800 rounded-t-xl border-t border-x border-slate-700"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Moon className="text-slate-600" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${themeMode === 'dark' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Dark</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${themeMode === 'dark' ? 'border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                {themeMode === 'dark' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                            </div>
                        </div>
                   </div>

                   {/* System Theme Card */}
                   <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onSetThemeMode('system')}>
                        <div className={`w-full aspect-[9/16] rounded-2xl border-4 relative overflow-hidden shadow-sm transition-all ${themeMode === 'system' ? 'border-indigo-600 scale-105 shadow-xl' : 'border-slate-200 dark:border-slate-700 group-hover:border-slate-400'}`}>
                             {/* Diagonal Split Background */}
                             <div className="absolute inset-0 bg-white"></div>
                             <div className="absolute inset-0 bg-slate-900" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                             
                             {/* Mock UI - Light Side (Top Left) */}
                             <div className="absolute top-3 left-2 w-8 h-2 bg-slate-100 rounded-full z-10"></div>
                             
                             {/* Mock UI - Dark Side (Bottom Right) */}
                             <div className="absolute bottom-3 right-2 w-8 h-2 bg-slate-800 rounded-full z-10"></div>
                             
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <Smartphone className="text-slate-400 bg-white/20 rounded-full p-1 backdrop-blur-sm" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-bold ${themeMode === 'system' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>System</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${themeMode === 'system' ? 'border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                {themeMode === 'system' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                            </div>
                        </div>
                   </div>
               </div>

               <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center px-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                   {themeMode === 'system' 
                    ? "BudgetFlow will automatically adjust its appearance to match your device's system settings."
                    : `You've selected ${themeMode} mode. The app will stay in this mode regardless of your system settings.`}
               </p>
           </section>

       </div>
    </div>
  );
};
