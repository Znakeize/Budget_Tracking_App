import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, User, Mail, Phone, MapPin, Save, Camera, Loader2 } from 'lucide-react';
import { HeaderProfile } from '../../components/ui/HeaderProfile';

interface PersonalInfoViewProps {
  user: { name: string, email: string } | null;
  onUpdateUser: (updatedUser: any) => void;
  onBack: () => void;
  onProfileClick: () => void;
}

export const PersonalInfoView: React.FC<PersonalInfoViewProps> = ({ user, onUpdateUser, onBack, onProfileClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: '+1 (555) 000-0000', // Mock data
        location: 'New York, USA' // Mock data
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
        onUpdateUser({ ...user, name: formData.name });
        setLoading(false);
        onBack();
    }, 1000);
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
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Settings</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Personal Info</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           <div className="flex flex-col items-center mb-6">
               <div className="relative">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                       {formData.name.charAt(0).toUpperCase()}
                   </div>
                   <button className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full border-2 border-white dark:border-slate-800 shadow-sm active:scale-95 transition-transform">
                       <Camera size={14} />
                   </button>
               </div>
               <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Tap to change photo</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
               <Card className="p-4 space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Full Name</label>
                       <div className="relative">
                           <User size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                           <input 
                               type="text" 
                               value={formData.name}
                               onChange={e => setFormData({...formData, name: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Email Address</label>
                       <div className="relative">
                           <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                           <input 
                               type="email" 
                               value={formData.email}
                               readOnly
                               className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none text-slate-500 dark:text-slate-400 cursor-not-allowed"
                           />
                           <span className="absolute right-3 top-3.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">Verified</span>
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Phone Number</label>
                       <div className="relative">
                           <Phone size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                           <input 
                               type="tel" 
                               value={formData.phone}
                               onChange={e => setFormData({...formData, phone: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                           />
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Location</label>
                       <div className="relative">
                           <MapPin size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                           <input 
                               type="text" 
                               value={formData.location}
                               onChange={e => setFormData({...formData, location: e.target.value})}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-all"
                           />
                       </div>
                   </div>
               </Card>

               <button 
                   type="submit"
                   disabled={loading}
                   className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                   Save Changes
               </button>
           </form>
       </div>
    </div>
  );
};