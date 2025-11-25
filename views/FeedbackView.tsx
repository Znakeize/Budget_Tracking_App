import React, { useState } from 'react';
import { ChevronLeft, Star, Send, ThumbsUp, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface FeedbackViewProps {
  onBack: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onBack }) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
    }, 1500);
  };

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Improve Us</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Share Feedback</h1>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 flex flex-col justify-center">
           {!submitted ? (
               <div className="space-y-6 animate-in zoom-in-95 duration-300">
                   <div className="text-center">
                       <div className="w-16 h-16 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-fuchsia-500/20">
                           <MessageSquare size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">How are we doing?</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                           Your feedback helps us build a better budgeting experience for everyone.
                       </p>
                   </div>

                   <Card className="p-6">
                       <form onSubmit={handleSubmit} className="space-y-6">
                           <div className="flex justify-center gap-2">
                               {[1, 2, 3, 4, 5].map((star) => (
                                   <button
                                       key={star}
                                       type="button"
                                       onClick={() => setRating(star)}
                                       className={`p-2 transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                   >
                                       <Star size={32} strokeWidth={rating >= star ? 0 : 1.5} fill={rating >= star ? "currentColor" : "none"} />
                                   </button>
                               ))}
                           </div>
                           
                           <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                               {rating === 0 ? 'Tap to Rate' : rating === 5 ? 'Excellent!' : rating >= 4 ? 'Great' : rating === 3 ? 'Good' : 'Needs Work'}
                           </div>

                           <textarea 
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none h-32"
                               placeholder="Tell us what you love or what we can improve..."
                               value={text}
                               onChange={(e) => setText(e.target.value)}
                           ></textarea>

                           <button 
                               type="submit" 
                               disabled={rating === 0 || loading}
                               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                           >
                               {loading ? (
                                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                               ) : (
                                   <>
                                       <Send size={18} /> Submit Feedback
                                   </>
                               )}
                           </button>
                       </form>
                   </Card>
               </div>
           ) : (
               <div className="text-center space-y-4 animate-in zoom-in-95 duration-500">
                   <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                       <ThumbsUp size={40} />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Thank You!</h3>
                   <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                       We appreciate your feedback. It helps us make BudgetFlow better for you.
                   </p>
                   <button 
                       onClick={onBack}
                       className="mt-6 px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                   >
                       Return to Profile
                   </button>
               </div>
           )}
       </div>
    </div>
  );
};