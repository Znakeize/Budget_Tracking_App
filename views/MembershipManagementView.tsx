
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, CreditCard, Calendar, FileText, Download, AlertTriangle, CheckCircle, Crown, ChevronRight, Shield, Pause, Play, Zap, X, Loader2, Wallet, Plus, Trash2, Globe, Smartphone, LayoutGrid, Clock, ExternalLink } from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { jsPDF } from 'jspdf';

interface MembershipManagementViewProps {
  user: any;
  onBack: () => void;
  onCancelSubscription: () => void;
  onProfileClick: () => void;
  onUpdateUser?: (user: any) => void;
  onNavigate: (tab: string) => void;
}

interface PaymentMethod {
    id: string;
    type: 'card' | 'paypal' | 'wise' | 'apple' | 'google';
    label: string;
    expiry?: string;
    icon?: any;
    isDefault: boolean;
    brand?: 'visa' | 'mastercard' | 'amex';
}

export const MembershipManagementView: React.FC<MembershipManagementViewProps> = ({ 
  user, 
  onBack, 
  onCancelSubscription,
  onProfileClick,
  onUpdateUser,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'history'>('overview');
  
  // Modal States
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  
  // Data States
  const [isPaused, setIsPaused] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Mock Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
      { id: 'pm_1', type: 'card', label: '•••• 4242', expiry: '12/28', isDefault: true, brand: 'visa' },
      { id: 'pm_2', type: 'paypal', label: 'user@example.com', isDefault: false }
  ]);

  // Mock Billing History
  const billingHistory = [
    { id: 'inv-001', date: 'Jan 1, 2025', amount: '$4.99', status: 'Paid', plan: 'Pro Monthly', method: 'Visa •••• 4242' },
    { id: 'inv-002', date: 'Dec 1, 2024', amount: '$4.99', status: 'Paid', plan: 'Pro Monthly', method: 'Visa •••• 4242' },
    { id: 'inv-003', date: 'Nov 15, 2024', amount: '$9.99', status: 'Paid', plan: 'Event Planner (Lifetime)', method: 'PayPal' },
  ];

  const handleCancel = () => {
    setLoadingAction('cancel');
    setTimeout(() => {
        onCancelSubscription();
        setShowCancelConfirm(false);
        setLoadingAction(null);
    }, 1500);
  };

  const handlePause = () => {
      setLoadingAction('pause');
      setTimeout(() => {
          setIsPaused(!isPaused);
          setShowPauseConfirm(false);
          setLoadingAction(null);
      }, 1500);
  };

  const handleChangePlan = (plan: 'monthly' | 'yearly') => {
      setLoadingAction('plan');
      setTimeout(() => {
          setCurrentPlan(plan);
          setShowPlanModal(false);
          setLoadingAction(null);
      }, 1500);
  };

  const handleAddPaymentMethod = (method: PaymentMethod) => {
      setPaymentMethods([...paymentMethods, method]);
      setShowAddMethodModal(false);
  };

  const handleDeletePaymentMethod = (id: string) => {
      if(confirm('Remove this payment method?')) {
          setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
      }
  };

  const handleSetDefaultPayment = (id: string) => {
      setPaymentMethods(paymentMethods.map(pm => ({
          ...pm,
          isDefault: pm.id === id
      })));
  };

  const handleDownloadInvoice = (invoice: any) => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("INVOICE", 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Invoice ID: ${invoice.id}`, 20, 30);
      doc.text(`Date: ${invoice.date}`, 20, 35);
      doc.text(`Status: ${invoice.status}`, 20, 40);
      
      doc.setFontSize(12);
      doc.text("Bill To:", 20, 55);
      doc.setFontSize(10);
      doc.text(user.name, 20, 60);
      doc.text(user.email, 20, 65);
      
      doc.setLineWidth(0.5);
      doc.line(20, 75, 190, 75);
      
      doc.setFontSize(12);
      doc.text("Description", 20, 85);
      doc.text("Amount", 160, 85);
      
      doc.line(20, 90, 190, 90);
      
      doc.setFontSize(10);
      doc.text(invoice.plan, 20, 100);
      doc.text(invoice.amount, 160, 100);
      
      doc.line(20, 110, 190, 110);
      
      doc.setFontSize(12);
      doc.text(`Total: ${invoice.amount}`, 160, 120);
      doc.text(`Paid via: ${invoice.method}`, 20, 120);
      
      doc.save(`invoice_${invoice.id}.pdf`);
  };

  const handleReactivate = () => {
      if (onUpdateUser) {
          onUpdateUser({...user, isPro: true});
      }
  };

  const handleUnsubscribeFeature = (featureId: string) => {
      if (window.confirm(`Are you sure you want to cancel the ${featureId.replace('-', ' ')} subscription? This will remove it from your owned modules.`)) {
          setLoadingAction(`cancel-${featureId}`);
          setTimeout(() => {
              if (onUpdateUser) {
                  const updatedFeatures = (user.unlockedFeatures || []).filter((f: string) => f !== featureId);
                  onUpdateUser({ ...user, unlockedFeatures: updatedFeatures });
              }
              setLoadingAction(null);
          }, 1000);
      }
  };

  // Map feature ID to app tab ID
  const featureMap: Record<string, string> = {
      'simulator': 'simulator',
      'analysis': 'analysis',
      'investments': 'investments',
      'events': 'events',
      'social': 'social',
      'business': 'calculators'
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Subscription</h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Management</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 pb-0">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                    { id: 'wallet', label: 'Wallet', icon: Wallet },
                    { id: 'history', label: 'History', icon: Clock },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6 pb-28">
           
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                   
                   {/* Active Subscription Card */}
                   <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl transition-colors ${user.isPro ? 'bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                       {user.isPro && (
                           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                       )}
                       
                       <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-2">
                               <Crown className={user.isPro ? "text-amber-400" : "text-slate-400"} size={20} fill={user.isPro ? "currentColor" : "none"} />
                               <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                   !user.isPro 
                                   ? 'bg-slate-300/50 border-slate-400 text-slate-600' 
                                   : isPaused 
                                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                               }`}>
                                   {!user.isPro ? 'FREE PLAN' : isPaused ? 'PAUSED' : 'PRO ACTIVE'}
                               </span>
                           </div>
                           <h2 className={`text-2xl font-bold mb-1 ${user.isPro ? 'text-white' : 'text-slate-700 dark:text-white'}`}>
                               {user.isPro ? (currentPlan === 'monthly' ? 'Pro Monthly' : 'Pro Yearly') : 'Basic Access'}
                           </h2>
                           <p className={`text-sm ${user.isPro ? 'text-slate-400' : 'text-slate-500'}`}>
                               {user.isPro 
                                    ? `${currentPlan === 'monthly' ? '$4.99/month' : '$39.99/year'} • ${isPaused ? 'Paused' : 'Next bill: Feb 1, 2025'}`
                                    : 'Upgrade to unlock AI limits'
                               }
                           </p>

                           <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
                               {user.isPro ? (
                                   <>
                                       <button 
                                            onClick={() => setShowPlanModal(true)}
                                            className="flex-1 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                                       >
                                           Switch Plan
                                       </button>
                                       <button 
                                            onClick={() => setShowPauseConfirm(true)}
                                            className="flex-1 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
                                       >
                                           {isPaused ? 'Resume' : 'Pause'}
                                       </button>
                                   </>
                               ) : (
                                   <button 
                                        onClick={handleReactivate}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                                   >
                                       Upgrade to Pro
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>

                   {/* Unlocked Single Features */}
                   {user.unlockedFeatures && user.unlockedFeatures.length > 0 && (
                       <div>
                           <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Owned Modules</h3>
                           <div className="grid grid-cols-1 gap-3">
                               {user.unlockedFeatures.map((feat: string) => (
                                   <div key={feat} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm group">
                                       <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                                               <CheckCircle size={20} />
                                           </div>
                                           <div>
                                               <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">{feat.replace('-', ' ')}</h4>
                                               <p className="text-[10px] text-slate-500">Active Subscription • Monthly</p>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleUnsubscribeFeature(feat)}
                                                disabled={loadingAction === `cancel-${feat}`}
                                                className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                            >
                                                {loadingAction === `cancel-${feat}` ? <Loader2 size={12} className="animate-spin" /> : 'Unsubscribe'}
                                            </button>
                                            <button 
                                                    onClick={() => onNavigate(featureMap[feat] || 'dashboard')}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Open <ExternalLink size={12} />
                                            </button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* Danger Zone */}
                   {user.isPro && (
                       <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                           <button 
                               onClick={() => setShowCancelConfirm(true)}
                               className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-2"
                           >
                               <AlertTriangle size={14} /> Cancel Subscription
                           </button>
                       </div>
                   )}
               </div>
           )}

           {/* WALLET TAB */}
           {activeTab === 'wallet' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                   <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Methods</h3>
                        <button 
                            onClick={() => setShowAddMethodModal(true)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Add New
                        </button>
                   </div>

                   <div className="space-y-3">
                       {paymentMethods.map((pm) => (
                           <div key={pm.id} className="group relative overflow-hidden rounded-2xl transition-all shadow-sm hover:shadow-md">
                               {/* Card Visual */}
                               <div className={`p-5 ${
                                   pm.type === 'card' 
                                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white' 
                                    : pm.type === 'paypal' 
                                        ? 'bg-[#003087] text-white'
                                        : 'bg-emerald-600 text-white'
                               }`}>
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                   
                                   <div className="flex justify-between items-start mb-4 relative z-10">
                                       {pm.type === 'card' ? (
                                           <div className="w-10 h-6 bg-yellow-500/20 rounded border border-yellow-500/40"></div>
                                       ) : pm.type === 'paypal' ? (
                                           <Wallet size={24} className="opacity-80" />
                                       ) : (
                                           <Globe size={24} className="opacity-80" />
                                       )}
                                       {pm.isDefault && (
                                           <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">DEFAULT</span>
                                       )}
                                   </div>
                                   <div className="flex justify-between items-end relative z-10">
                                       <div>
                                           <p className="text-[10px] opacity-70 uppercase mb-1">{pm.type === 'card' ? 'Card Number' : 'Account'}</p>
                                           <p className="text-lg font-mono font-bold tracking-wider">{pm.label}</p>
                                       </div>
                                       {pm.expiry && (
                                           <div className="text-right">
                                               <p className="text-[10px] opacity-70 uppercase mb-1">Exp</p>
                                               <p className="text-sm font-bold">{pm.expiry}</p>
                                           </div>
                                       )}
                                   </div>
                               </div>

                               {/* Actions Overlay */}
                               <div className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 p-2 flex justify-end gap-2 rounded-b-2xl">
                                   {!pm.isDefault && (
                                       <button 
                                            onClick={() => handleSetDefaultPayment(pm.id)}
                                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                       >
                                           Make Default
                                       </button>
                                   )}
                                   <button 
                                        onClick={() => handleDeletePaymentMethod(pm.id)}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                                   >
                                       <Trash2 size={12} /> Remove
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {/* HISTORY TAB */}
           {activeTab === 'history' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                   <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                       {billingHistory.map((invoice) => (
                           <div key={invoice.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <div className="flex items-center gap-3">
                                   <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                                       <FileText size={18} />
                                   </div>
                                   <div>
                                       <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.plan}</p>
                                       <p className="text-xs text-slate-500">{invoice.date} • {invoice.method}</p>
                                   </div>
                               </div>
                               <div className="text-right flex items-center gap-3">
                                   <span className="text-sm font-bold text-slate-900 dark:text-white">{invoice.amount}</span>
                                   <button 
                                        onClick={() => handleDownloadInvoice(invoice)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                        title="Download Invoice"
                                   >
                                       <Download size={16} />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </Card>
                   <p className="text-center text-xs text-slate-400">Showing last 12 months</p>
               </div>
           )}

       </div>

       {/* MODALS */}

       {/* Add Payment Method Modal */}
       {showAddMethodModal && (
           <AddPaymentMethodModal 
               isOpen={showAddMethodModal} 
               onClose={() => setShowAddMethodModal(false)} 
               onAdd={handleAddPaymentMethod} 
           />
       )}

       {/* Cancel Modal */}
       {showCancelConfirm && (
           <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                   <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       <AlertTriangle size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Cancel Membership?</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                       You will lose access to Pro features at the end of your billing cycle.
                   </p>
                   <div className="space-y-3">
                       <button 
                           onClick={() => setShowCancelConfirm(false)}
                           className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                       >
                           Keep Membership
                       </button>
                       <button 
                           onClick={handleCancel}
                           disabled={loadingAction === 'cancel'}
                           className="w-full py-3 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex justify-center items-center"
                       >
                           {loadingAction === 'cancel' ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Cancellation'}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Pause Modal */}
       {showPauseConfirm && (
           <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                   <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                       {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                       {isPaused ? 'Resume Membership?' : 'Pause Membership?'}
                   </h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                       {isPaused 
                        ? "You will immediately regain access to all Pro features." 
                        : "Your payments will be paused for 1 month. You will lose Pro access during this time."}
                   </p>
                   <div className="space-y-3">
                       <button 
                           onClick={handlePause}
                           disabled={loadingAction === 'pause'}
                           className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center"
                       >
                           {loadingAction === 'pause' ? <Loader2 size={18} className="animate-spin" /> : (isPaused ? 'Resume Now' : 'Pause for 1 Month')}
                       </button>
                       <button 
                           onClick={() => setShowPauseConfirm(false)}
                           className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                       >
                           Cancel
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* Change Plan Modal */}
       {showPlanModal && (
           <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Plan</h3>
                       <button onClick={() => setShowPlanModal(false)}><X size={20} className="text-slate-400" /></button>
                   </div>
                   
                   <div className="space-y-3 mb-6">
                       <button 
                            onClick={() => handleChangePlan('monthly')}
                            disabled={loadingAction === 'plan'}
                            className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${currentPlan === 'monthly' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                       >
                           <div className="text-left">
                               <div className="font-bold text-slate-900 dark:text-white">Monthly</div>
                               <div className="text-xs text-slate-500">$4.99/mo</div>
                           </div>
                           {currentPlan === 'monthly' && <CheckCircle size={20} className="text-indigo-600" />}
                       </button>
                       
                       <button 
                            onClick={() => handleChangePlan('yearly')}
                            disabled={loadingAction === 'plan'}
                            className={`w-full p-4 rounded-xl border-2 flex justify-between items-center transition-all ${currentPlan === 'yearly' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                       >
                           <div className="text-left">
                               <div className="font-bold text-slate-900 dark:text-white">Yearly <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">SAVE 33%</span></div>
                               <div className="text-xs text-slate-500">$39.99/yr</div>
                           </div>
                           {currentPlan === 'yearly' && <CheckCircle size={20} className="text-indigo-600" />}
                       </button>
                   </div>
                   
                   {loadingAction === 'plan' && <div className="text-center text-xs text-indigo-600 mb-2 animate-pulse">Updating plan...</div>}
               </div>
           </div>
       )}

       {/* Add Payment Method Modal */}
       {showAddMethodModal && (
           <AddPaymentMethodModal 
               isOpen={showAddMethodModal} 
               onClose={() => setShowAddMethodModal(false)} 
               onAdd={handleAddPaymentMethod} 
           />
       )}
    </div>
  );
};

// --- Advanced Add Payment Modal ---
const AddPaymentMethodModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (m: PaymentMethod) => void }) => {
    const [type, setType] = useState<'card' | 'paypal' | 'wise' | 'apple' | 'google'>('card');
    const [cardNum, setCardNum] = useState('');
    const [expiry, setExpiry] = useState('');
    const [loading, setLoading] = useState(false);

    if(!isOpen) return null;

    // Auto-format card number
    const handleCardNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        v = v.match(/.{1,4}/g)?.join(' ') || v;
        setCardNum(v);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (type === 'card') {
                onAdd({
                    id: Math.random().toString(36).substr(2,9),
                    type: 'card',
                    label: `•••• ${cardNum.slice(-4) || '0000'}`,
                    expiry: expiry || '12/30',
                    isDefault: false,
                    brand: 'visa'
                });
            } else {
                onAdd({
                    id: Math.random().toString(36).substr(2,9),
                    type,
                    label: type === 'paypal' ? 'connected@paypal.com' : `${type} Pay`,
                    isDefault: false
                });
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Payment Method</h3>
                    <button onClick={onClose} className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 transition-colors"><X size={20}/></button>
                </div>

                {/* Method Selector */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 hide-scrollbar">
                    {[
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'paypal', label: 'PayPal', icon: Wallet },
                        { id: 'wise', label: 'Wise', icon: Globe },
                        { id: 'apple', label: 'Apple', icon: Smartphone },
                        { id: 'google', label: 'Google', icon: Smartphone },
                    ].map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setType(m.id as any)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border min-w-[80px] transition-all ${
                                type === m.id 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                        >
                            <m.icon size={20} />
                            <span className="text-[10px] font-bold">{m.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'card' ? (
                        <div className="space-y-4 animate-in fade-in">
                            {/* Visual Card Preview */}
                            <div className="bg-gradient-to-br from-slate-800 to-black text-white p-5 rounded-2xl shadow-lg mb-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-10 h-6 bg-yellow-500/20 rounded-md border border-yellow-500/50"></div>
                                    <span className="font-bold italic text-lg opacity-80">VISA</span>
                                </div>
                                <div className="font-mono text-xl tracking-widest mb-4">{cardNum || '0000 0000 0000 0000'}</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs opacity-70">
                                        <div className="text-[8px] uppercase mb-0.5">Card Holder</div>
                                        <div>YOUR NAME</div>
                                    </div>
                                    <div className="text-xs opacity-70">
                                        <div className="text-[8px] uppercase mb-0.5">Expires</div>
                                        <div>{expiry || 'MM/YY'}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Card Number</label>
                                <input 
                                    value={cardNum}
                                    onChange={handleCardNumChange}
                                    maxLength={19}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Expiry</label>
                                    <input 
                                        value={expiry}
                                        onChange={e => setExpiry(e.target.value)}
                                        maxLength={5}
                                        placeholder="MM/YY"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono outline-none focus:border-indigo-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">CVC</label>
                                    <input 
                                        maxLength={3}
                                        placeholder="123"
                                        type="password"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-mono outline-none focus:border-indigo-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center animate-in fade-in">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                You will be redirected to {type === 'paypal' ? 'PayPal' : type === 'wise' ? 'Wise' : type === 'apple' ? 'Apple' : 'Google'} to authorize this connection.
                            </p>
                            <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full mx-auto flex items-center justify-center shadow-sm mb-2">
                                <Globe className="text-slate-400" />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : `Link ${type === 'card' ? 'Card' : 'Account'}`}
                    </button>
                </form>
            </div>
        </div>
    );
};
