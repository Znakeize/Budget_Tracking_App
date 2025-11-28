
import React, { useState } from 'react';
import { 
  ChevronLeft, PlayCircle, Wallet, BrainCircuit, Users, 
  TrendingUp, ArrowRight, Zap, PieChart, Shield,
  MessageSquare, CalendarHeart, Sparkles, Layers,
  Calculator, ShoppingCart, History, RefreshCcw, BarChart2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { HeaderProfile } from '../components/ui/HeaderProfile';

interface AppDemoViewProps {
  onBack: () => void;
  onNavigate: (tab: string) => void;
  onProfileClick: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type Category = 'calculators' | 'shopping' | 'history' | 'simulator' | 'analysis' | 'investments' | 'events' | 'collaboration';

export const AppDemoView: React.FC<AppDemoViewProps> = ({ onBack, onNavigate, onProfileClick, activeTab, onTabChange }) => {
  const [localActiveCategory, setLocalActiveCategory] = useState<Category>('calculators');

  // Use props if available, otherwise local state
  const activeCategory = (activeTab as Category) || localActiveCategory;
  const setActiveCategory = (cat: Category) => {
      if (onTabChange) {
          onTabChange(cat);
      } else {
          setLocalActiveCategory(cat);
      }
  };

  const categories: { id: Category; label: string; icon: any }[] = [
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'history', label: 'History', icon: History },
    { id: 'simulator', label: 'Simulator', icon: RefreshCcw },
    { id: 'analysis', label: 'Analysis', icon: BarChart2 },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: CalendarHeart },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
  ];

  const features: Record<Category, any[]> = {
    calculators: [
      {
        id: 'tax',
        title: 'Tax Planner',
        desc: 'Estimate income tax, corporate tax, and VAT liabilities.',
        icon: Shield,
        color: 'text-amber-500',
        bg: 'bg-amber-500',
        cta: 'Open Planner',
        link: 'calculators',
      },
      {
        id: 'loan',
        title: 'Loan & EMI',
        desc: 'Calculate monthly payments and amortization schedules.',
        icon: Calculator,
        color: 'text-blue-500',
        bg: 'bg-blue-500',
        cta: 'Calculate Loan',
        link: 'calculators',
      }
    ],
    shopping: [
      {
        id: 'lists',
        title: 'Smart Lists',
        desc: 'Create categorized shopping lists with budget limits.',
        icon: ShoppingCart,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500',
        cta: 'Go to Shopping',
        link: 'shopping-list',
      },
      {
        id: 'sync',
        title: 'Budget Sync',
        desc: 'Automatically sync purchased items to your main budget.',
        icon: Zap,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500',
        cta: 'View Lists',
        link: 'shopping-list',
      }
    ],
    history: [
      {
        id: 'timeline',
        title: 'Financial Timeline',
        desc: 'Review past budgets and spending patterns over time.',
        icon: History,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500',
        cta: 'View History',
        link: 'history',
      },
      {
        id: 'export',
        title: 'Data Export',
        desc: 'Download your financial history as PDF, Excel, or JSON.',
        icon: ArrowRight,
        color: 'text-slate-500',
        bg: 'bg-slate-500',
        cta: 'Export Data',
        link: 'tools',
      }
    ],
    simulator: [
      {
        id: 'projection',
        title: 'Wealth Projection',
        desc: 'Forecast net worth 5 years into the future.',
        icon: TrendingUp,
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500',
        cta: 'Simulate',
        link: 'simulator',
      },
      {
        id: 'scenarios',
        title: 'Life Events',
        desc: 'Simulate impacts of buying a house, baby, or startup.',
        icon: Layers,
        color: 'text-purple-500',
        bg: 'bg-purple-500',
        cta: 'Try Scenarios',
        link: 'simulator',
      }
    ],
    analysis: [
      {
        id: 'deep',
        title: 'Deep Analysis',
        desc: 'Advanced charts, spending heatmaps, and trends.',
        icon: PieChart,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500',
        cta: 'Analyze',
        link: 'analysis',
      },
      {
        id: 'advisor',
        title: 'AI Insights',
        desc: 'Get automated cost-cutting tips from Gemini AI.',
        icon: BrainCircuit,
        color: 'text-teal-500',
        bg: 'bg-teal-500',
        cta: 'Ask AI',
        link: 'ai',
      }
    ],
    investments: [
      {
        id: 'portfolio',
        title: 'Portfolio Tracker',
        desc: 'Track stocks, crypto, and real estate in one place.',
        icon: Wallet,
        color: 'text-violet-500',
        bg: 'bg-violet-500',
        cta: 'Track Assets',
        link: 'investments',
      },
      {
        id: 'goals',
        title: 'Investment Goals',
        desc: 'Set targets for ROI and total portfolio value.',
        icon: TrendingUp,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500',
        cta: 'Set Goals',
        link: 'investments',
      }
    ],
    events: [
      {
        id: 'planner',
        title: 'Event Planner',
        desc: 'Budget for weddings, trips, and large projects.',
        icon: CalendarHeart,
        color: 'text-pink-500',
        bg: 'bg-pink-500',
        cta: 'Plan Event',
        link: 'events',
      },
      {
        id: 'vendors',
        title: 'Vendor Mgmt',
        desc: 'Track payments and due dates for multiple vendors.',
        icon: Users,
        color: 'text-rose-500',
        bg: 'bg-rose-500',
        cta: 'Manage Vendors',
        link: 'events',
      }
    ],
    collaboration: [
      {
        id: 'split',
        title: 'Group Splitting',
        desc: 'Split bills and expenses with friends effortlessly.',
        icon: Users,
        color: 'text-orange-500',
        bg: 'bg-orange-500',
        cta: 'Start Group',
        link: 'social',
      },
      {
        id: 'community',
        title: 'Community',
        desc: 'Compare spending trends anonymously with others.',
        icon: MessageSquare,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500',
        cta: 'Join Hub',
        link: 'social',
      }
    ]
  };

  const renderMock = () => {
      switch(activeCategory) {
          case 'calculators': return <MockWealthInterface />;
          case 'shopping': return <MockBudgetInterface />;
          case 'history': return <MockBudgetInterface />;
          case 'simulator': return <MockWealthInterface />;
          case 'analysis': return <MockAIInterface />;
          case 'investments': return <MockWealthInterface />;
          case 'events': return <MockSocialInterface />;
          case 'collaboration': return <MockSocialInterface />;
          default: return <MockBudgetInterface />;
      }
  };

  const getHeroTitle = () => {
      switch(activeCategory) {
          case 'calculators': return "Precise Financial Tools";
          case 'shopping': return "Smart Shopping Lists";
          case 'history': return "Your Financial Timeline";
          case 'simulator': return "Predict Your Future";
          case 'analysis': return "Deep Data Insights";
          case 'investments': return "Grow Your Net Worth";
          case 'events': return "Plan Perfect Events";
          case 'collaboration': return "Share & Split Costs";
      }
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Discovery</h2>
              <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                App Tour <PlayCircle size={20} className="text-slate-400" />
              </h1>
            </div>
          </div>
          <div className="pb-1">
            <HeaderProfile onClick={onProfileClick} />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <cat.icon size={14} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
        
        {/* Main Hero Window */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="text-center mb-4">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                   {getHeroTitle()}
               </h2>
               <p className="text-xs text-slate-500 dark:text-slate-400">Interactive Preview</p>
           </div>

           <WindowFrame className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
               {renderMock()}
           </WindowFrame>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Key Features</h3>
            
            {features[activeCategory].map((feature, idx) => (
                <Card 
                    key={feature.id} 
                    className="overflow-hidden group hover:shadow-lg transition-all border-none bg-white dark:bg-slate-800 animate-in slide-in-from-bottom-8"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className="flex">
                        {/* Mini Visual Preview */}
                        <div className="w-24 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700/50 relative overflow-hidden flex items-center justify-center">
                            <div className={`absolute inset-0 opacity-10 ${feature.bg}`}></div>
                            <feature.icon size={24} className={`${feature.color} opacity-80 group-hover:scale-110 transition-transform duration-500`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${feature.bg} bg-opacity-10`}>
                                        <feature.icon size={14} className={feature.color} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{feature.title}</h4>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                {feature.desc}
                            </p>

                            <button 
                                onClick={() => onNavigate(feature.link)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all flex items-center gap-1 group-hover:translate-x-1`}
                            >
                                {feature.cta} <ArrowRight size={10} />
                            </button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
                <Zap className="mx-auto mb-2 text-yellow-300" size={24} fill="currentColor" />
                <h3 className="font-bold text-lg mb-1">Ready to start?</h3>
                <p className="text-xs text-indigo-100 mb-4">Experience the full power of BudgetFlow.</p>
                <button onClick={() => onNavigate('dashboard')} className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-transform">
                    Go to Dashboard
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---

const WindowFrame = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden ${className}`}>
        <div className="h-6 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-3 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
        </div>
        {children}
    </div>
);

// --- CSS Animations for Mocks ---
const MockBudgetInterface = () => (
    <div className="w-full h-full p-4 flex gap-3 items-end justify-center">
        {[40, 70, 50, 90, 60].map((h, i) => (
            <div key={i} className="w-8 bg-slate-300 dark:bg-slate-700 rounded-t-lg relative group overflow-hidden" style={{ height: `${h}%` }}>
                <div className={`absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-1000 ease-out`} style={{ height: '0%', animation: `fillUp 1s ease-out ${i*0.1}s forwards`, '--target-height': `${h}%` } as any}></div>
            </div>
        ))}
        <style>{`
            @keyframes fillUp { to { height: var(--target-height); } }
        `}</style>
    </div>
);

const MockAIInterface = () => (
    <div className="w-full h-full p-4 flex flex-col justify-end gap-2">
        <div className="self-end bg-indigo-500 text-white p-2 rounded-2xl rounded-tr-none text-[10px] max-w-[70%] animate-in fade-in slide-in-from-right-4 duration-500">
            How can I save more?
        </div>
        <div className="self-start bg-white dark:bg-slate-700 p-2 rounded-2xl rounded-tl-none text-[10px] max-w-[80%] shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-300 text-slate-600 dark:text-slate-200 flex items-center gap-2">
            <Sparkles size={12} className="text-yellow-500 shrink-0" />
            <span>Based on your spending, cutting dining out by 10% saves $150/mo.</span>
        </div>
    </div>
);

const MockWealthInterface = () => (
    <div className="w-full h-full p-4 flex items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-slate-200 dark:border-slate-700"></div>
        </div>
        <svg className="w-32 h-32 transform -rotate-90">
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-violet-500" strokeDasharray="377" strokeDashoffset="377" style={{ animation: 'dash 1.5s ease-out forwards' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Net Worth</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white animate-in zoom-in duration-500 delay-500">$42k</span>
        </div>
        <style>{`
            @keyframes dash { to { stroke-dashoffset: 94; } }
        `}</style>
    </div>
);

const MockSocialInterface = () => (
    <div className="w-full h-full p-4 flex items-center justify-center gap-4">
        {[1,2,3].map((i) => (
            <div key={i} className="relative group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-in zoom-in duration-500 delay-${i*100} ${i===1 ? 'bg-orange-500 scale-110 z-10' : 'bg-slate-400 scale-90 opacity-70'}`}>
                    {i===1 ? 'You' : `U${i}`}
                </div>
                {i===1 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-[8px] font-bold shadow-sm text-emerald-500 whitespace-nowrap animate-bounce">
                        +$25.00
                    </div>
                )}
            </div>
        ))}
    </div>
);
