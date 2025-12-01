
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Check, Shield, RefreshCcw, TrendingUp, PieChart, CalendarHeart, Users, CheckCircle, Briefcase } from 'lucide-react';
import { PaymentGatewayModal } from '../components/ui/PaymentGatewayModal';

interface FeatureSubscriptionViewProps {
  featureId: string;
  onBack: () => void;
  onSubscribe: (featureId: string) => void;
  onOpenFeature?: (featureId: string) => void;
}

const FEATURE_DATA: Record<string, any> = {
    'simulator': {
        title: 'Life Event Simulator',
        icon: RefreshCcw,
        color: 'text-fuchsia-500',
        bgColor: 'bg-fuchsia-500',
        gradient: 'from-fuchsia-600 to-purple-700',
        description: "Predict your financial future with advanced scenario planning.",
        benefits: [
            "Simulate 10+ Life Events (Baby, House, Startup)",
            "5-Year Wealth Projection Charts",
            "AI-Powered Strategic Adjustments",
            "Unlimited Scenario Saves"
        ]
    },
    'analysis': {
        title: 'Deep Analysis',
        icon: TrendingUp,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500',
        gradient: 'from-emerald-600 to-teal-700',
        description: "Unlock professional-grade financial charts and breakdown.",
        benefits: [
            "Advanced Category Trends",
            "Spending Heatmaps",
            "Year-over-Year Comparison",
            "Export Custom Reports (PDF/Excel)"
        ]
    },
    'investments': {
        title: 'Investment Tracker',
        icon: PieChart,
        color: 'text-violet-500',
        bgColor: 'bg-violet-500',
        gradient: 'from-violet-600 to-indigo-700',
        description: "Track your net worth and asset portfolio growth.",
        benefits: [
            "Real-time Asset Allocation",
            "Net Worth Forecasting",
            "Crypto & Stock Manual Tracking",
            "Dividend & Return Analysis"
        ]
    },
    'events': {
        title: 'Event Planner',
        icon: CalendarHeart,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500',
        gradient: 'from-pink-600 to-rose-700',
        description: "Manage budgets for weddings, trips, and large projects.",
        benefits: [
            "Dedicated Event Budgeting",
            "Vendor Payment Tracking",
            "Guest List & RSVP Tools",
            "Team Collaboration"
        ]
    },
    'social': {
        title: 'Collaboration',
        icon: Users,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500',
        gradient: 'from-amber-600 to-orange-700',
        description: "Share budgets and split expenses with anyone.",
        benefits: [
            "Unlimited Shared Groups",
            "Auto-Expense Splitting",
            "Real-time Sync",
            "Debt Settlement Tracking"
        ]
    },
    'business': {
        title: 'Business Suite',
        icon: Briefcase,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500',
        gradient: 'from-indigo-600 to-blue-700',
        description: "Professional tools for corporate tax, VAT, and forex planning.",
        benefits: [
            "Corporate Tax Calculator",
            "VAT & GST Invoicing Tool",
            "Forex Rate Analyzer",
            "Export Business Reports"
        ]
    }
};

export const FeatureSubscriptionView: React.FC<FeatureSubscriptionViewProps> = ({ featureId, onBack, onSubscribe, onOpenFeature }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const feature = FEATURE_DATA[featureId];

  if (!feature) return <div className="p-8 text-center">Feature not found</div>;

  const Icon = feature.icon;
  const price = billingCycle === 'monthly' ? '$1.99' : '$19.99';
  const planTitle = `${feature.title} (${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'})`;

  const handlePurchase = () => {
      setShowPayment(false);
      setTimeout(() => {
          onSubscribe(featureId);
          setShowSuccess(true);
      }, 1500);
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="flex-none pt-6 px-4 pb-4 bg-transparent z-20 absolute top-0 w-full pt-safe">
            <button onClick={onBack} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                <ChevronLeft size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
            
            {/* Hero */}
            <div className={`relative h-80 bg-gradient-to-br ${feature.gradient} text-white p-8 flex flex-col justify-end pb-12 overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Icon size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2">{feature.title}</h1>
                    <p className="text-white/80 text-sm max-w-xs leading-relaxed">{feature.description}</p>
                </div>
            </div>

            <div className="px-4 -mt-6 relative z-10 space-y-6">
                {/* Benefits */}
                <Card className="p-6 shadow-xl border-none">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">What's Included</h3>
                    <div className="space-y-3">
                        {feature.benefits.map((benefit: string, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`p-1 rounded-full ${feature.bgColor} bg-opacity-10`}>
                                    <Check size={14} className={feature.color} />
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Plans */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">Select Plan</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setBillingCycle('monthly')}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${billingCycle === 'monthly' ? `border-${feature.color.split('-')[1]}-500 bg-white dark:bg-slate-800 shadow-md` : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-70'}`}
                        >
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Monthly</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">$1.99<span className="text-xs font-normal text-slate-400">/mo</span></div>
                        </button>

                        <button 
                            onClick={() => setBillingCycle('yearly')}
                            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${billingCycle === 'yearly' ? `border-${feature.color.split('-')[1]}-500 bg-white dark:bg-slate-800 shadow-md` : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 opacity-70'}`}
                        >
                            <div className={`absolute top-0 right-0 px-2 py-1 ${feature.bgColor} text-white text-[9px] font-bold rounded-bl-lg`}>SAVE 20%</div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Yearly</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">$19.99<span className="text-xs font-normal text-slate-400">/yr</span></div>
                        </button>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] uppercase font-bold">
                    <Shield size={12} /> Secure Payment via SSL
                </div>
            </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe-offset-8 max-w-md mx-auto">
            <button 
                onClick={() => setShowPayment(true)}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all bg-gradient-to-r ${feature.gradient}`}
            >
                Start Subscription • {price}
            </button>
        </div>

        <PaymentGatewayModal 
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            onConfirm={handlePurchase}
            amount={price}
            itemTitle={planTitle}
        />

        {showSuccess && (
           <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-8 text-center relative animate-in zoom-in-95 duration-300">
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${feature.bgColor} bg-opacity-20 text-${feature.color.split('-')[1]}-500`}>
                       <CheckCircle size={40} strokeWidth={3} className={feature.color} />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                       You're all set!
                   </h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                       You have successfully subscribed to {feature.title}.
                   </p>
                   <button 
                        onClick={() => {
                            if (onOpenFeature) onOpenFeature(featureId);
                            setShowSuccess(false);
                        }}
                        className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${feature.bgColor}`}
                   >
                       Open Feature
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};
