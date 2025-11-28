
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Check, Star, Zap, Shield, Crown, CheckCircle2, X, Lock, RefreshCcw, TrendingUp, PieChart, CalendarHeart, Users, ArrowRight, Loader2, FileText, Server, DownloadCloud, Calculator, Briefcase } from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { PaymentGatewayModal } from '../components/ui/PaymentGatewayModal';

interface ProMembershipViewProps {
  onBack: () => void;
  onUpgrade: () => void;
  onUnlockFeature?: (featureId: string) => void;
  onProfileClick: () => void;
  user: any;
  onViewFeature?: (featureId: string) => void;
}

export const ProMembershipView: React.FC<ProMembershipViewProps> = ({ onBack, onUpgrade, onUnlockFeature, onProfileClick, user, onViewFeature }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [processing, setProcessing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'pro' | 'feature'>('pro');
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentContext, setPaymentContext] = useState<{ id: string, title: string, price: string, type: 'pro' | 'feature' } | null>(null);

  // Info/Legal Modal State
  const [activeInfoModal, setActiveInfoModal] = useState<'terms' | 'privacy' | 'restore' | null>(null);

  const features = [
    { icon: Zap, text: "Unlimited AI Financial Analysis", desc: "Get personalized insights powered by Gemini 2.5" },
    { icon: Crown, text: "Advanced Life Simulator", desc: "Unlock all scenario modules (Startup, Retirement, etc.)" },
    { icon: Calculator, text: "Advanced Business Tools", desc: "Corporate Tax, VAT & Forex Calculators" },
    { icon: Shield, text: "Cloud Backup & Sync", desc: "Securely sync data across multiple devices" },
    { icon: Star, text: "Unlimited History", desc: "Access your entire financial timeline forever" },
    { icon: CheckCircle2, text: "Priority Support", desc: "Get your questions answered first" },
  ];

  const individualFeatures = [
      { id: 'simulator', title: 'Life Event Simulator', price: '1.99', icon: RefreshCcw, color: 'text-fuchsia-500', desc: "Simulate major life events and see 5-year projections." },
      { id: 'analysis', title: 'Deep Analysis', price: '1.99', icon: TrendingUp, color: 'text-emerald-500', desc: "Advanced charts, trends, and category breakdowns." },
      { id: 'investments', title: 'Investments', price: '1.99', icon: PieChart, color: 'text-violet-500', desc: "Track portfolio growth, asset allocation, and net worth." },
      { id: 'events', title: 'Event Planner', price: '1.99', icon: CalendarHeart, color: 'text-pink-500', desc: "Dedicated tools for weddings, trips, and large projects." },
      { id: 'social', title: 'Collaboration', price: '1.99', icon: Users, color: 'text-amber-500', desc: "Share budgets, split expenses, and track group spending." },
      { id: 'business', title: 'Business Suite', price: '1.99', icon: Briefcase, color: 'text-indigo-500', desc: "Corporate Tax, VAT & Forex tools for professionals." },
  ];

  const plans = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$4.99',
      period: '/mo',
      desc: 'Flexible, cancel anytime',
      popular: false
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$39.99',
      period: '/yr',
      desc: 'Save 33% ($3.33/mo)',
      popular: true,
      save: 'SAVE 33%'
    },
    {
      id: 'lifetime',
      title: 'Lifetime',
      price: '$99.99',
      period: 'once',
      desc: 'Pay once, own it forever',
      popular: false,
      save: 'BEST VALUE'
    }
  ];

  // Step 1: Trigger Payment Modal
  const initiatePurchase = (id: string, title: string, price: string, type: 'pro' | 'feature') => {
      setPaymentContext({ id, title, price, type });
      setShowPaymentModal(true);
  };

  // Step 2: Process Payment (Simulated Callback from Modal)
  const handlePaymentConfirmed = () => {
      setShowPaymentModal(false);
      if (!paymentContext) return;

      setProcessing(paymentContext.id);
      
      // Simulate Network processing
      setTimeout(() => {
          setProcessing(null);
          setSuccessType(paymentContext.type);
          if (paymentContext.type === 'feature' && onUnlockFeature) {
              onUnlockFeature(paymentContext.id);
          }
          setShowSuccess(true);
      }, 2000);
  };

  const handleSuccessClose = () => {
      if (successType === 'pro') onUpgrade(); 
      setShowSuccess(false);
      if (successType === 'pro') onBack();
  };

  const hasFeature = (id: string) => {
      return user?.isPro || (user?.unlockedFeatures && user.unlockedFeatures.includes(id));
  };

  // Derived success details for the modal
  const successDetails = useMemo(() => {
      if (successType === 'pro') {
          return {
              title: 'Pro Membership',
              color: 'text-amber-500',
              bgColor: 'bg-amber-500',
              icon: Crown
          };
      }
      
      const feat = individualFeatures.find(f => f.id === paymentContext?.id);
      if (feat) {
          const colorName = feat.color.split('-')[1]; // e.g. fuchsia from text-fuchsia-500
          return {
              title: feat.title,
              color: feat.color,
              bgColor: `bg-${colorName}-500`,
              icon: feat.icon
          };
      }
      
      return {
          title: 'Premium Feature',
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500',
          icon: CheckCircle2
      };
  }, [successType, paymentContext]);

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">Premium Access</h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Store</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar pb-28">
           
           {/* Hero Section */}
           <div className="relative bg-slate-900 text-white p-8 pb-16 overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
               
               <div className="relative z-10 text-center">
                   <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 transform rotate-6">
                       <Crown size={32} className="text-white" fill="currentColor" />
                   </div>
                   <h2 className="text-3xl font-extrabold mb-2">Unlock Full Potential</h2>
                   <p className="text-slate-300 text-sm max-w-xs mx-auto">
                       Get the all-in-one Pro Bundle or unlock individual features as you need them.
                   </p>
               </div>
           </div>

           <div className="px-4 -mt-8 relative z-10 space-y-8">
               
               {/* PRO BUNDLE SECTION */}
               <div>
                   <div className="flex items-center gap-2 mb-3 ml-1">
                       <Star className="text-amber-500" size={16} fill="currentColor" />
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Pro Bundle (Best Value)</h3>
                   </div>
                   
                   <Card className="p-5 shadow-xl border-none mb-4">
                       <div className="space-y-4">
                           {features.map((feat, i) => (
                               <div key={i} className="flex gap-3">
                                   <div className="mt-0.5 p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full h-fit">
                                       <feat.icon size={16} />
                                   </div>
                                   <div>
                                       <h4 className="text-sm font-bold text-slate-900 dark:text-white">{feat.text}</h4>
                                       <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{feat.desc}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </Card>

                   {/* Billing Toggle */}
                   <div className="flex justify-center mb-4">
                       <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex relative">
                           <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all z-10 ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                           >
                               Monthly
                           </button>
                           <button 
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 text-xs font-bold rounded-lg transition-all z-10 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                           >
                               Yearly <span className="text-[9px] text-emerald-500 ml-1">-33%</span>
                           </button>
                           <div className={`absolute top-1 bottom-1 w-[50%] bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-transform duration-300 ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full'}`}></div>
                       </div>
                   </div>

                   {/* Pricing Cards */}
                   <div className="space-y-3">
                       {plans.filter(p => p.id !== 'lifetime' || billingCycle === 'yearly').map((plan) => {
                           if (plan.id === 'lifetime') return null;
                           const isSelected = plan.id === billingCycle;
                           if (!isSelected) return null; 

                           return (
                               <div key={plan.id} className="relative">
                                   <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 border-2 border-transparent transform transition-all hover:scale-[1.02]">
                                       {plan.save && (
                                           <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                               {plan.save}
                                           </div>
                                       )}
                                       <div className="flex justify-between items-end mb-2">
                                           <div>
                                               <h3 className="text-lg font-bold opacity-90">{plan.title} Plan</h3>
                                               <p className="text-xs text-indigo-100 opacity-80">{plan.desc}</p>
                                           </div>
                                           <div className="text-right">
                                               <span className="text-3xl font-bold">{plan.price}</span>
                                               <span className="text-sm opacity-80">{plan.period}</span>
                                           </div>
                                       </div>
                                       <button 
                                            onClick={() => initiatePurchase(plan.id, `${plan.title} Plan`, plan.price, 'pro')}
                                            disabled={!!processing || user?.isPro}
                                            className="w-full mt-4 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                       >
                                           {user?.isPro ? 'Current Plan' : processing === plan.id ? 'Processing...' : 'Start 7-Day Free Trial'}
                                       </button>
                                       {!user?.isPro && <p className="text-[10px] text-center mt-3 opacity-60">Then {plan.price}{plan.period}. Cancel anytime.</p>}
                                   </div>
                               </div>
                           );
                       })}

                        {/* Lifetime Option */}
                       <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Lifetime Access</h3>
                                <p className="text-xs text-slate-500">One-time payment. No subscriptions.</p>
                            </div>
                            <button 
                                onClick={() => initiatePurchase('lifetime', 'Lifetime Access', '$99.99', 'pro')}
                                disabled={!!processing || user?.isPro}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                            >
                                {user?.isPro ? 'Purchased' : processing === 'lifetime' ? '...' : '$99.99'}
                            </button>
                       </div>
                   </div>
               </div>

               {/* INDIVIDUAL FEATURES SECTION */}
               <div>
                   <div className="flex items-center gap-2 mb-3 ml-1 mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                       <Lock className="text-slate-400" size={16} />
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Individual Feature Unlocks</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-3">
                       {individualFeatures.map(item => {
                           const owned = hasFeature(item.id);
                           return (
                               <Card key={item.id} className={`p-4 border transition-colors ${owned ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                   <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                                           <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 ${item.color}`}>
                                               <item.icon size={20} />
                                           </div>
                                           <div className="min-w-0">
                                               <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 truncate">
                                                   {item.title}
                                                   {owned && <CheckCircle2 size={14} className="text-emerald-500" />}
                                               </h4>
                                               <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">{item.desc}</p>
                                           </div>
                                       </div>
                                       <div className="shrink-0">
                                           <button 
                                                onClick={() => !owned && onViewFeature ? onViewFeature(item.id) : null}
                                                disabled={owned}
                                                className={`h-7 px-3 flex items-center justify-center text-[10px] font-extrabold rounded-md transition-colors uppercase tracking-wide whitespace-nowrap ${
                                                    owned 
                                                    ? 'bg-transparent text-emerald-600 cursor-default' 
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm'
                                                }`}
                                           >
                                               {owned ? 'Unlocked' : 'View Plans'}
                                           </button>
                                       </div>
                                   </div>
                               </Card>
                           )
                       })}
                   </div>
               </div>

               <div className="text-center text-[10px] text-slate-400 space-y-2 pb-4 pt-4">
                   <div className="flex justify-center gap-4">
                       <button onClick={() => setActiveInfoModal('terms')} className="hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</button>
                       <button onClick={() => setActiveInfoModal('privacy')} className="hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</button>
                       <button onClick={() => setActiveInfoModal('restore')} className="hover:text-slate-600 dark:hover:text-slate-300">Restore Purchase</button>
                   </div>
               </div>
           </div>
       </div>

        {/* Payment Gateway Modal */}
       <PaymentGatewayModal 
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handlePaymentConfirmed}
            amount={paymentContext?.price || ''}
            itemTitle={paymentContext?.title || ''}
       />

       {/* Success Modal Overlay */}
       {showSuccess && (
           <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center relative animate-in zoom-in-95 duration-300">
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${successDetails.bgColor} bg-opacity-20`}>
                       <successDetails.icon size={40} strokeWidth={3} className={successDetails.color} />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                       You're all set!
                   </h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                       You have successfully subscribed to {successDetails.title}.
                   </p>
                   <button 
                        onClick={handleSuccessClose}
                        className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${successDetails.bgColor}`}
                   >
                       Continue
                   </button>
               </div>
           </div>
       )}

       {/* INFO MODALS */}
       {activeInfoModal === 'restore' && (
           <RestoreModal onClose={() => setActiveInfoModal(null)} onRestoreSuccess={() => { 
               onUpgrade(); // Mock implementation: just upgrades user for demo
               setActiveInfoModal(null); 
           }} />
       )}

       {activeInfoModal === 'terms' && (
           <InfoModal 
                title="Terms of Service" 
                onClose={() => setActiveInfoModal(null)} 
                content={TOS_CONTENT} 
           />
       )}

       {activeInfoModal === 'privacy' && (
           <InfoModal 
                title="Privacy Policy" 
                onClose={() => setActiveInfoModal(null)} 
                content={PRIVACY_CONTENT} 
           />
       )}
    </div>
  );
};

// --- HELPER MODALS ---

const InfoModal = ({ title, content, onClose }: { title: string, content: React.ReactNode, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-slate-400" /> {title}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                        {content}
                    </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button onClick={onClose} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl">Close</button>
                </div>
            </div>
        </div>
    );
};

const RestoreModal = ({ onClose, onRestoreSuccess }: { onClose: () => void, onRestoreSuccess: () => void }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'empty'>('loading');

    useEffect(() => {
        // Simulate network request to App Store / Play Store
        const timer = setTimeout(() => {
            // Randomly succeed for demo purposes
            setStatus('success');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
                {status === 'loading' && (
                    <div className="py-4">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <Server size={24} className="absolute inset-0 m-auto text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connecting to Store...</h3>
                        <p className="text-xs text-slate-500 mt-2">Checking for past purchases associated with your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DownloadCloud size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Purchases Restored</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6">We found your previous Pro subscription and have reactivated it.</p>
                        <button onClick={onRestoreSuccess} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">Continue</button>
                    </div>
                )}

                {status === 'empty' && (
                    <div className="py-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Purchases Found</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6">We couldn't find any active subscriptions or purchases for this account ID.</p>
                        <button onClick={onClose} className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors">Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MOCK CONTENT ---

const TOS_CONTENT = (
    <>
        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">1. Acceptance of Terms</h4>
        <p className="mb-4">By accessing or using the BudgetFlow mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        
        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">2. Subscriptions & Payments</h4>
        <p className="mb-4">BudgetFlow offers both free and paid "Pro" features. Subscriptions are billed on a monthly or yearly basis. Payment will be charged to your Apple ID or Google Play account at confirmation of purchase.</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.</li>
            <li>Account will be charged for renewal within 24-hours prior to the end of the current period.</li>
            <li>You can manage and cancel your subscriptions by going to your account settings on the App Store or Google Play after purchase.</li>
        </ul>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">3. Lifetime Access</h4>
        <p className="mb-4">"Lifetime Access" refers to the lifetime of the product. If the product is discontinued, we will provide reasonable notice and access will continue until the termination date.</p>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">4. User Conduct</h4>
        <p className="mb-4">You agree not to use the App for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</p>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">5. Disclaimer of Warranties</h4>
        <p className="mb-4">The service is provided on an "as is" and "as available" basis. BudgetFlow makes no representations or warranties of any kind, express or implied, regarding the operation of the service.</p>
    </>
);

const PRIVACY_CONTENT = (
    <>
        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">1. Data Collection</h4>
        <p className="mb-4">BudgetFlow prioritizes your privacy. We collect minimal data necessary to provide our services. Your financial transaction data is primarily stored locally on your device.</p>
        
        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">2. AI Processing</h4>
        <p className="mb-4">When you use AI features (e.g., "AI Advisor"), anonymized snippets of your budget data are sent to our AI provider (Google Gemini) solely for the purpose of generating the response. This data is not used to train the AI models and is not stored by the provider.</p>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">3. Third-Party Services</h4>
        <p className="mb-4">We may use third-party services for payment processing (e.g., Apple Pay, Google Pay, Stripe). We do not store your full credit card information on our servers.</p>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">4. Data Security</h4>
        <p className="mb-4">We implement industry-standard security measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure.</p>

        <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">5. Deletion of Data</h4>
        <p className="mb-4">You have the right to request the deletion of your personal data. You can reset your local data via the Settings menu or contact support for account deletion.</p>
    </>
);
