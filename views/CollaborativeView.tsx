import React from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Users, MessageCircle, Globe, ExternalLink, MessageSquare } from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface CollaborativeViewProps {
  onBack: () => void;
  onProfileClick: () => void;
}

export const CollaborativeView: React.FC<CollaborativeViewProps> = ({ onBack, onProfileClick }) => {
  const channels = [
    { name: 'Facebook Group', icon: Users, description: 'Join 10k+ members sharing tips', color: 'bg-blue-600', link: '#' },
    { name: 'Telegram Channel', icon: MessageCircle, description: 'Daily updates & news', color: 'bg-sky-500', link: '#' },
    { name: 'WhatsApp Community', icon: MessageSquare, description: 'Real-time discussions', color: 'bg-emerald-500', link: '#' },
    { name: 'Official Website', icon: Globe, description: 'Read our latest blog posts', color: 'bg-indigo-600', link: '#' },
  ];

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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Community</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Official Channels</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-28">
           <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-none">
               <h3 className="text-xl font-bold mb-2">Join the Conversation</h3>
               <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                   Connect with other budgeters, share your success stories, and get exclusive tips from our financial experts.
               </p>
               <div className="flex -space-x-2">
                   {[1,2,3,4].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-slate-200"></div>
                   ))}
                   <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-indigo-800 flex items-center justify-center text-[10px] font-bold">
                       +2k
                   </div>
               </div>
           </Card>

           <div className="grid grid-cols-1 gap-3">
               {channels.map((channel, idx) => (
                   <Card key={idx} className="p-4 flex items-center justify-between group cursor-pointer hover:border-indigo-500 transition-colors">
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl ${channel.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                               <channel.icon size={24} />
                           </div>
                           <div>
                               <h4 className="font-bold text-slate-900 dark:text-white">{channel.name}</h4>
                               <p className="text-xs text-slate-500 dark:text-slate-400">{channel.description}</p>
                           </div>
                       </div>
                       <ExternalLink size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                   </Card>
               ))}
           </div>
       </div>
    </div>
  );
};