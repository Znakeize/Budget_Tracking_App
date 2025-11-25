import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, Lock, Shield, Smartphone, Fingerprint, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { HeaderProfile } from '../../components/ui/HeaderProfile';

interface SecurityViewProps {
  onBack: () => void;
  onProfileClick: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onBack, onProfileClick }) => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordData.new !== passwordData.confirm) {
          alert("New passwords do not match.");
          return;
      }
      setShowSuccess(true);
      setTimeout(() => {
          setShowSuccess(false);
          setPasswordData({ current: '', new: '', confirm: '' });
      }, 3000);
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
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Security</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           {/* Two Factor Section */}
           <Card className="p-4 border-l-4 border-l-emerald-500">
               <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                           <Shield size={24} />
                       </div>
                       <div>
                           <h3 className="font-bold text-slate-900 dark:text-white">Two-Factor Auth</h3>
                           <p className="text-xs text-slate-500">Recommended for higher security</p>
                       </div>
                   </div>
                   <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
               </div>
               <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                   {twoFactor 
                    ? "2FA is currently ENABLED. You will be asked for a verification code when logging in from a new device." 
                    : "2FA is currently DISABLED. We strongly recommend enabling it to protect your financial data."}
               </p>
           </Card>

           {/* Biometric Section */}
           <Card className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Fingerprint size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Biometric Login</h3>
                        <p className="text-xs text-slate-500">Use FaceID or Fingerprint</p>
                    </div>
                </div>
                <Toggle checked={biometric} onChange={() => setBiometric(!biometric)} />
           </Card>

           {/* Change Password Section */}
           <Card className="p-5">
               <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                       <Key size={20} />
                   </div>
                   <h3 className="font-bold text-slate-900 dark:text-white">Change Password</h3>
               </div>

               <form onSubmit={handleChangePassword} className="space-y-3">
                   <div>
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Current Password</label>
                       <input 
                            type="password" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                            value={passwordData.current}
                            onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">New Password</label>
                       <input 
                            type="password" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                            value={passwordData.new}
                            onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                       />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Confirm New Password</label>
                       <input 
                            type="password" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                            value={passwordData.confirm}
                            onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                       />
                   </div>

                   <button 
                        type="submit"
                        disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                        className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl mt-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       Update Password
                   </button>
               </form>

               {showSuccess && (
                   <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-bottom-1">
                       <CheckCircle size={18} /> Password updated successfully!
                   </div>
               )}
           </Card>

           <Card className="p-4 bg-red-50 dark:bg-red-900/10 border-none flex gap-3">
               <AlertCircle className="text-red-500 shrink-0" size={20} />
               <div>
                   <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Active Sessions</h4>
                   <p className="text-xs text-red-500 dark:text-red-400/80 mt-1">
                       You are currently logged in on <strong>iPhone 13 Pro</strong> (This Device).
                   </p>
                   <button className="text-xs font-bold text-red-700 dark:text-red-300 underline mt-2">Sign out of all other devices</button>
               </div>
           </Card>
       </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);