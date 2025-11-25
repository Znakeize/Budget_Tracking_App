import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle, Mail, Phone } from 'lucide-react';

interface SupportViewProps {
  onBack: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I reset my budget data?", a: "Go to the Settings tab (via Profile), scroll down to the 'Danger Zone', and click 'Reset All Data'. This action cannot be undone." },
    { q: "Is my data secure?", a: "Yes, all data is stored locally on your device. We do not transmit your financial data to any external servers unless you use the AI features, which process data anonymously." },
    { q: "Can I export my data?", a: "Yes! Go to the Tools section in the Profile tab. You can export to PDF, Excel, or JSON formats." },
    { q: "How does the AI Advisor work?", a: "The AI Advisor uses your recent transaction history to identify trends and offer suggestions. It requires an active internet connection to communicate with the model." },
    { q: "Can I share a budget with my spouse?", a: "Yes, use the 'Community' section found in the AI or Profile tabs to create Shared Budgets." },
    { q: "How do I add a recurring bill?", a: "In the Budget tab, click 'Add New' -> 'Bills'. You can set the due date. Currently, bills need to be re-added or marked unpaid for the next period manually during rollover, or you can use the 'Duplicate Period' feature in History." }
  ];

  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Help Center</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Support</h1>
                    </div>
                </div>
            </div>
            
            {/* Search */}
            <div className="mt-4 relative">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search for help..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors shadow-sm"
                />
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           {/* Quick Actions */}
           <div className="grid grid-cols-2 gap-3">
               <Card className="p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors">
                   <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                       <MessageCircle size={24} />
                   </div>
                   <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Live Chat</span>
               </Card>
               <Card className="p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors">
                   <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                       <Mail size={24} />
                   </div>
                   <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Email Us</span>
               </Card>
           </div>

           {/* FAQs */}
           <div>
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Frequently Asked Questions</h3>
               <div className="space-y-2">
                   {filteredFaqs.map((faq, idx) => (
                       <Card key={idx} className="overflow-hidden">
                           <button 
                               onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                               className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                           >
                               <span className="text-sm font-bold text-slate-800 dark:text-white pr-4">{faq.q}</span>
                               {openFaq === idx ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                           </button>
                           {openFaq === idx && (
                               <div className="px-4 pb-4 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in slide-in-from-top-1">
                                   {faq.a}
                               </div>
                           )}
                       </Card>
                   ))}
                   {filteredFaqs.length === 0 && (
                       <div className="text-center py-8 text-slate-400">
                           <HelpCircle size={32} className="mx-auto mb-2 opacity-50" />
                           <p className="text-xs">No results found for "{search}"</p>
                       </div>
                   )}
               </div>
           </div>

           {/* Contact Info */}
           <div className="text-center pt-4 border-t border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-400 mb-2">Need more help?</p>
                <a href="mailto:support@budgetflow.app" className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">support@budgetflow.app</a>
           </div>

       </div>
    </div>
  );
};