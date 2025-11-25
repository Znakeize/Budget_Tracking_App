import React, { useState } from 'react';
import { ChevronLeft, Shield, FileText, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface LegalViewProps {
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Information</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Legal</h1>
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4">
                <button 
                    onClick={() => setTab('terms')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'terms' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <FileText size={14} /> Terms of Service
                </button>
                <button 
                    onClick={() => setTab('privacy')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'privacy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <Shield size={14} /> Privacy Policy
                </button>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           <Card className="p-6 min-h-full">
               {tab === 'terms' && (
                   <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h3>
                       <p className="text-xs text-slate-400 mb-4">Last Updated: January 1, 2025</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">1. Acceptance of Terms</h4>
                       <p>By accessing and using BudgetFlow Mobile, you accept and agree to be bound by the terms and provision of this agreement.</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">2. Use License</h4>
                       <p>Permission is granted to temporarily download one copy of the materials (information or software) on BudgetFlow's website for personal, non-commercial transitory viewing only.</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">3. Disclaimer</h4>
                       <p>The materials on BudgetFlow's website are provided on an 'as is' basis. BudgetFlow makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">4. Limitations</h4>
                       <p>In no event shall BudgetFlow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BudgetFlow's website.</p>
                   </div>
               )}

               {tab === 'privacy' && (
                   <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h3>
                       <p className="text-xs text-slate-400 mb-4">Last Updated: January 1, 2025</p>
                       
                       <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl flex gap-3 mb-4">
                           <Lock className="text-emerald-500 flex-shrink-0" size={20} />
                           <div>
                               <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase mb-1">Data Security First</h4>
                               <p className="text-xs text-emerald-600 dark:text-emerald-300">Your financial data is stored locally on your device. We do not sell your personal information.</p>
                           </div>
                       </div>

                       <h4 className="font-bold text-slate-800 dark:text-slate-200">1. Information Collection</h4>
                       <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This includes budget data which is primarily stored locally.</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">2. Use of Information</h4>
                       <p>We use the information we collect to operate, maintain, and provide the features and functionality of the Service, and to communicate with you.</p>
                       
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">3. AI Features</h4>
                       <p>When you use AI features, anonymized data snippets are sent to our AI provider (Google Gemini) solely for the purpose of generating the requested analysis. This data is not used to train models.</p>
                   </div>
               )}
           </Card>
       </div>
    </div>
  );
};