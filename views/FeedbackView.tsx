
import React, { useState } from 'react';
import { ChevronLeft, Star, Send, ThumbsUp, MessageSquare, Lightbulb, Bug, AlertTriangle, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface FeedbackViewProps {
  onBack: () => void;
}

type FeedbackType = 'general' | 'idea' | 'bug';

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<FeedbackType>('general');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form States
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Feature');
  const [severity, setSeverity] = useState('Low');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (activeTab === 'general' && rating === 0) return;
    if (activeTab !== 'general' && (!title.trim() || !description.trim())) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
    }, 1500);
  };

  const resetForm = () => {
      setSubmitted(false);
      setRating(0);
      setTitle('');
      setDescription('');
      setCategory('Feature');
      setSeverity('Low');
  };

  const getSuccessContent = () => {
      switch(activeTab) {
          case 'idea':
              return {
                  icon: <Lightbulb size={40} />,
                  color: 'text-amber-500',
                  bg: 'bg-amber-100 dark:bg-amber-900/30',
                  title: 'Idea Received!',
                  msg: 'Thanks for sharing your creativity. We love hearing new ideas.'
              };
          case 'bug':
              return {
                  icon: <Check size={40} />,
                  color: 'text-red-500',
                  bg: 'bg-red-100 dark:bg-red-900/30',
                  title: 'Bug Reported',
                  msg: 'Thanks for the heads up! Our team will look into this issue shortly.'
              };
          default:
              return {
                  icon: <ThumbsUp size={40} />,
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                  title: 'Thank You!',
                  msg: 'We appreciate your feedback. It helps us make BudgetFlow better.'
              };
      }
  };

  const successContent = getSuccessContent();

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Contact Us</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Feedback & Support</h1>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 flex flex-col">
           {!submitted ? (
               <div className="space-y-6 animate-in zoom-in-95 duration-300">
                   
                   {/* Tabs */}
                   <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                       {[
                           { id: 'general', label: 'Feedback', icon: MessageSquare },
                           { id: 'idea', label: 'Share Idea', icon: Lightbulb },
                           { id: 'bug', label: 'Report Bug', icon: Bug }
                       ].map(tab => (
                           <button
                               key={tab.id}
                               onClick={() => setActiveTab(tab.id as FeedbackType)}
                               className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                   activeTab === tab.id 
                                   ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                               }`}
                           >
                               <tab.icon size={14} /> {tab.label}
                           </button>
                       ))}
                   </div>

                   {/* Header Info */}
                   <div className="text-center px-4">
                       {activeTab === 'general' && (
                           <>
                               <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                   <Star size={28} fill="currentColor" className="opacity-80" />
                               </div>
                               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rate Your Experience</h3>
                               <p className="text-xs text-slate-500 dark:text-slate-400">Help us improve by rating the app.</p>
                           </>
                       )}
                       {activeTab === 'idea' && (
                           <>
                               <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                   <Sparkles size={28} />
                               </div>
                               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Have a feature in mind?</h3>
                               <p className="text-xs text-slate-500 dark:text-slate-400">We build what you need. Share your thoughts.</p>
                           </>
                       )}
                       {activeTab === 'bug' && (
                           <>
                               <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                   <AlertTriangle size={28} />
                               </div>
                               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Found a bug?</h3>
                               <p className="text-xs text-slate-500 dark:text-slate-400">Let us know what's broken so we can fix it.</p>
                           </>
                       )}
                   </div>

                   <Card className="p-6">
                       <form onSubmit={handleSubmit} className="space-y-4">
                           
                           {/* General Feedback Form */}
                           {activeTab === 'general' && (
                               <div className="space-y-6">
                                   <div className="flex justify-center gap-3">
                                       {[1, 2, 3, 4, 5].map((star) => (
                                           <button
                                               key={star}
                                               type="button"
                                               onClick={() => setRating(star)}
                                               className={`p-2 transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                           >
                                               <Star size={32} strokeWidth={rating >= star ? 0 : 1.5} />
                                           </button>
                                       ))}
                                   </div>
                                   
                                   <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider h-4">
                                       {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : ''}
                                   </div>

                                   <textarea 
                                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none h-32 placeholder:text-slate-400"
                                       placeholder="Tell us what you love or what we can improve..."
                                       value={description}
                                       onChange={(e) => setDescription(e.target.value)}
                                   ></textarea>
                               </div>
                           )}

                           {/* Idea Form */}
                           {activeTab === 'idea' && (
                               <div className="space-y-4">
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Title</label>
                                       <input 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                           placeholder="e.g., Add Dark Mode schedule"
                                           value={title}
                                           onChange={(e) => setTitle(e.target.value)}
                                       />
                                   </div>

                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Category</label>
                                       <select 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                           value={category}
                                           onChange={(e) => setCategory(e.target.value)}
                                       >
                                           <option>New Feature</option>
                                           <option>Improvement</option>
                                           <option>Design / UX</option>
                                           <option>Other</option>
                                       </select>
                                   </div>

                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Description</label>
                                       <textarea 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none h-32 placeholder:text-slate-400"
                                           placeholder="How should this feature work?"
                                           value={description}
                                           onChange={(e) => setDescription(e.target.value)}
                                       ></textarea>
                                   </div>
                               </div>
                           )}

                           {/* Bug Report Form */}
                           {activeTab === 'bug' && (
                               <div className="space-y-4">
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Issue Title</label>
                                       <input 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 transition-colors"
                                           placeholder="e.g., App crashes on Budget screen"
                                           value={title}
                                           onChange={(e) => setTitle(e.target.value)}
                                       />
                                   </div>

                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Severity</label>
                                       <select 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 transition-colors"
                                           value={severity}
                                           onChange={(e) => setSeverity(e.target.value)}
                                       >
                                           <option>Low - Visual glitch</option>
                                           <option>Medium - Feature not working</option>
                                           <option>High - App crash / Data issue</option>
                                           <option>Critical - Cannot use app</option>
                                       </select>
                                   </div>

                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Steps to Reproduce</label>
                                       <textarea 
                                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 transition-colors resize-none h-32 placeholder:text-slate-400"
                                           placeholder="1. Go to... 2. Click on... 3. See error..."
                                           value={description}
                                           onChange={(e) => setDescription(e.target.value)}
                                       ></textarea>
                                   </div>
                               </div>
                           )}

                           <button 
                               type="submit" 
                               disabled={loading || (activeTab === 'general' && rating === 0) || (activeTab !== 'general' && (!title || !description))}
                               className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${
                                   activeTab === 'bug' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                                   activeTab === 'idea' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                   'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                               }`}
                           >
                               {loading ? (
                                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                               ) : (
                                   <>
                                       <Send size={18} /> 
                                       {activeTab === 'bug' ? 'Report Bug' : activeTab === 'idea' ? 'Submit Idea' : 'Send Feedback'}
                                   </>
                               )}
                           </button>
                       </form>
                   </Card>
               </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500 px-4">
                   <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl ${successContent.bg} ${successContent.color}`}>
                       {successContent.icon}
                   </div>
                   <div className="text-center space-y-2">
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{successContent.title}</h3>
                       <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                           {successContent.msg}
                       </p>
                   </div>
                   <div className="flex gap-3 w-full max-w-xs">
                        <button 
                            onClick={onBack}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Close
                        </button>
                        <button 
                            onClick={resetForm}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            Send Another
                        </button>
                   </div>
               </div>
           )}
       </div>
    </div>
  );
};
