
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetData } from '../types';
import { calculateTotals, formatCurrency, generateId } from '../utils/calculations';
import { Card } from '../components/ui/Card';
import { Line, Bar } from 'react-chartjs-2';
import { 
  ChevronLeft, Baby, Car, Home, GraduationCap, Briefcase, 
  Plane, TrendingUp, AlertTriangle, CheckCircle, Sliders, 
  ArrowRight, Heart, DollarSign, Calendar, RefreshCcw, ShieldAlert,
  Stethoscope, Globe, UserMinus, ChevronRight, HelpCircle,
  Timer, Wallet, PlayCircle, Sparkles, X, Loader2
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { generateStrategyPlan } from '../utils/aiHelper';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface LifeSimulatorViewProps {
  currentData: BudgetData;
  currencySymbol: string;
  onBack: () => void;
  onApplyScenario: (changes: Partial<BudgetData>) => void;
}

type EventType = 'baby' | 'house' | 'car' | 'marriage' | 'education' | 'business' | 'medical' | 'relocation' | 'retirement';

// --- Configuration Types ---
type QuestionType = 'date' | 'currency' | 'number' | 'select';

interface Question {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: { label: string, value: any }[];
  defaultValue?: any;
}

const EVENT_CONFIGS: Record<string, Question[]> = {
  baby: [
     { id: 'date', text: 'When is the baby due?', type: 'date' },
     { id: 'initialCost', text: 'One-time setup costs?', subtext: 'Nursery, gear, medical bills', type: 'currency', defaultValue: 3000 },
     { id: 'childcare', text: 'Monthly childcare plan?', type: 'select', options: [
         {label: 'None / Family Help ($0)', value: 0}, 
         {label: 'Part-time ($800)', value: 800}, 
         {label: 'Full-time ($1600)', value: 1600}
     ], defaultValue: 0 },
     { id: 'supplies', text: 'Monthly supplies budget?', subtext: 'Diapers, formula, clothing', type: 'currency', defaultValue: 200 },
     { id: 'leaveLoss', text: 'Total income loss during leave?', subtext: 'Unpaid time off total', type: 'currency', defaultValue: 0 }
  ],
  house: [
     { id: 'date', text: 'Target move-in date?', type: 'date' },
     { id: 'price', text: 'Target Home Price?', type: 'currency', defaultValue: 350000 },
     { id: 'downpayment', text: 'Down Payment Available?', subtext: 'Cash on hand', type: 'currency', defaultValue: 50000 },
     { id: 'rate', text: 'Interest Rate (%)', type: 'number', defaultValue: 6.5 },
     { id: 'term', text: 'Loan Term', type: 'select', options: [{label: '30 Years', value: 30}, {label: '15 Years', value: 15}], defaultValue: 30 },
     { id: 'maintenance', text: 'Monthly Maintenance & HOA', type: 'currency', defaultValue: 400 }
  ],
  car: [
      { id: 'date', text: 'When do you plan to buy?', type: 'date' },
      { id: 'price', text: 'Vehicle Price?', type: 'currency', defaultValue: 25000 },
      { id: 'tradein', text: 'Down Payment / Trade-in?', type: 'currency', defaultValue: 5000 },
      { id: 'term', text: 'Loan Term (Months)', type: 'select', options: [{label: '36 Months', value: 36}, {label: '48 Months', value: 48}, {label: '60 Months', value: 60}, {label: '72 Months', value: 72}], defaultValue: 60 },
      { id: 'rate', text: 'Interest Rate (%)', type: 'number', defaultValue: 7.0 },
      { id: 'insurance', text: 'Monthly Insurance Increase', type: 'currency', defaultValue: 50 }
  ],
  education: [
      { id: 'date', text: 'Start Date?', type: 'date' },
      { id: 'tuition', text: 'Total Annual Tuition?', type: 'currency', defaultValue: 15000 },
      { id: 'years', text: 'Duration (Years)?', type: 'number', defaultValue: 4 },
      { id: 'funding', text: 'Funding Source?', type: 'select', options: [{label: 'Pay Monthly (Cash Flow)', value: 'cash'}, {label: 'Student Loans', value: 'loan'}], defaultValue: 'cash' }
  ],
  retirement: [
      { id: 'date', text: 'Target Retirement Date?', type: 'date' },
      { id: 'monthlyNeed', text: 'Desired Monthly Income?', type: 'currency', defaultValue: 4000 },
      { id: 'pension', text: 'Guaranteed Pension/SS?', type: 'currency', defaultValue: 1500 }
  ]
};

// Generic fallback for other events
const GENERIC_QUESTIONS: Question[] = [
    { id: 'date', text: 'Target Date?', type: 'date' },
    { id: 'initialCost', text: 'Upfront Cost?', type: 'currency', defaultValue: 1000 },
    { id: 'monthlyCost', text: 'Ongoing Monthly Cost?', type: 'currency', defaultValue: 100 },
    { id: 'incomeChange', text: 'Monthly Income Change?', subtext: 'Positive for gain, Negative for loss', type: 'currency', defaultValue: 0 }
];

export const LifeSimulatorView: React.FC<LifeSimulatorViewProps> = ({ currentData, currencySymbol, onBack, onApplyScenario }) => {
  const [activeStep, setActiveStep] = useState<'select' | 'wizard' | 'results'>('select');
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Strategy Modal State
  const [selectedStrategy, setSelectedStrategy] = useState<'cut' | 'earn' | 'save' | null>(null);

  // Derived Financials
  const baseTotals = useMemo(() => calculateTotals(currentData), [currentData]);
  const baseSurplus = baseTotals.totalIncome - baseTotals.totalOut;
  const liquidAssets = baseTotals.totalSavings + baseTotals.totalInvestments;

  // --- Helpers ---
  const calculateMortgage = (principal: number, rate: number, years: number) => {
      if (principal <= 0) return 0;
      const r = rate / 100 / 12;
      const n = years * 12;
      return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const calculateLoan = (principal: number, rate: number, months: number) => {
      if (principal <= 0) return 0;
      const r = rate / 100 / 12;
      return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  // --- Handlers ---
  const handleEventSelect = (type: EventType) => {
      setSelectedEvent(type);
      setWizardData({});
      setCurrentQuestionIdx(0);
      
      // Initialize defaults
      const questions = EVENT_CONFIGS[type] || GENERIC_QUESTIONS;
      const defaults: Record<string, any> = {};
      questions.forEach(q => {
          if (q.type === 'date') {
              const d = new Date();
              d.setFullYear(d.getFullYear() + 1);
              defaults[q.id] = d.toISOString().split('T')[0];
          } else {
              defaults[q.id] = q.defaultValue;
          }
      });
      setWizardData(defaults);
      setActiveStep('wizard');
  };

  const handleNextQuestion = () => {
      const questions = EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS;
      if (currentQuestionIdx < questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
      } else {
          runSimulation();
      }
  };

  const runSimulation = () => {
      setIsSimulating(true);
      setTimeout(() => {
          setIsSimulating(false);
          setActiveStep('results');
      }, 1500);
  };

  const handleStrategyConfirm = () => {
      if (!simulationResults || !selectedStrategy) return;

      if (selectedStrategy === 'cut') {
          const newExpenses = [...currentData.expenses];
          // Add the event cost
          newExpenses.push({ id: generateId(), name: `${selectedEvent} Cost`, budgeted: simulationResults.newMonthlyCost, spent: 0 });
          // Simulate cutting other expenses by 20%
          const slashed = newExpenses.map(e => e.id.includes(selectedEvent!) ? e : { ...e, budgeted: e.budgeted * 0.8 });
          onApplyScenario({ expenses: slashed });
      } else if (selectedStrategy === 'earn') {
          const newExpenses = [...currentData.expenses, { id: generateId(), name: `${selectedEvent} Cost`, budgeted: simulationResults.newMonthlyCost, spent: 0 }];
          const newIncome = [...currentData.income, { id: generateId(), name: 'Side Hustle Target', planned: simulationResults.newMonthlyCost, actual: 0 }];
          onApplyScenario({ expenses: newExpenses, income: newIncome });
      } else if (selectedStrategy === 'save') {
          const newSavings = [...currentData.savings, { id: generateId(), name: `${selectedEvent} Fund`, planned: simulationResults.newMonthlyCost, amount: 0 }];
          onApplyScenario({ savings: newSavings });
      }
      
      setSelectedStrategy(null);
      onBack();
  };

  // --- Simulation Engine ---
  const simulationResults = useMemo(() => {
      if (!selectedEvent) return null;
      
      const months = 60; // 5 years
      const labels: string[] = [];
      const baseNetWorth: number[] = [];
      const simNetWorth: number[] = [];
      
      let baseCash = liquidAssets;
      let simCash = liquidAssets;
      const today = new Date();
      
      // Parsed Wizard Data
      const eventDate = new Date(wizardData.date);
      const monthsUntilEvent = Math.max(0, (eventDate.getFullYear() - today.getFullYear()) * 12 + (eventDate.getMonth() - today.getMonth()));
      
      let upfrontCost = 0;
      let newMonthlyCost = 0;
      let newMonthlyIncome = 0;
      let loanPayment = 0;
      let loanDuration = 0;

      // Event Specific Logic
      if (selectedEvent === 'baby') {
          upfrontCost = (wizardData.initialCost || 0) + (wizardData.leaveLoss || 0); // Treating leave loss as lump sum impact for simplicity
          newMonthlyCost = (wizardData.childcare || 0) + (wizardData.supplies || 0);
      } else if (selectedEvent === 'house') {
          upfrontCost = wizardData.downpayment || 0;
          const principal = (wizardData.price || 0) - upfrontCost;
          loanPayment = calculateMortgage(principal, wizardData.rate || 0, wizardData.term || 30);
          newMonthlyCost = loanPayment + (wizardData.maintenance || 0);
          loanDuration = (wizardData.term || 30) * 12;
      } else if (selectedEvent === 'car') {
          upfrontCost = wizardData.tradein || 0;
          const principal = (wizardData.price || 0) - upfrontCost;
          loanPayment = calculateLoan(principal, wizardData.rate || 0, wizardData.term || 60);
          newMonthlyCost = loanPayment + (wizardData.insurance || 0);
          loanDuration = wizardData.term || 60;
      } else if (selectedEvent === 'education') {
          if (wizardData.funding === 'cash') {
              // Annual tuition divided by 12? Or lump sums? Let's smooth it monthly for simulation
              newMonthlyCost = (wizardData.tuition || 0) / 12; 
              loanDuration = (wizardData.years || 4) * 12;
          } else {
              // Loan deferred? Let's assume simple interest accruing but no payment yet? 
              // For simplicity, let's say minimal impact now but huge debt later. 
              // Let's model small payment
              newMonthlyCost = 50; 
          }
      } else if (selectedEvent === 'retirement') {
          // Negative cost = Income need
          newMonthlyCost = (wizardData.monthlyNeed || 0) - (wizardData.pension || 0); 
          // If monthlyNeed > pension, we drain savings. 
          // For visualization, we treat this as a "cost" that reduces the surplus
      } else {
          upfrontCost = wizardData.initialCost || 0;
          newMonthlyCost = wizardData.monthlyCost || 0;
          newMonthlyIncome = wizardData.incomeChange || 0;
      }

      // Projection Loop
      for (let i = 0; i < months; i++) {
          const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
          
          // Base
          baseCash += baseSurplus;
          baseNetWorth.push(baseCash);

          // Sim
          let monthlyImpact = 0;

          // Hit One-time cost
          if (i === monthsUntilEvent) {
              simCash -= upfrontCost;
          }

          // Recurring starts
          if (i >= monthsUntilEvent) {
              // If it's a loan, check if it's paid off
              if (loanDuration > 0) {
                   if (i < monthsUntilEvent + loanDuration) {
                       // Loan active part
                       if (selectedEvent === 'car') monthlyImpact -= loanPayment;
                       if (selectedEvent === 'house') monthlyImpact -= loanPayment; // House usually forever in 5y view
                       if (selectedEvent === 'education') monthlyImpact -= newMonthlyCost;
                   } else {
                       // Loan finished, only residual costs (insurance/maintenance)
                       if (selectedEvent === 'car') monthlyImpact -= (wizardData.insurance || 0);
                       if (selectedEvent === 'house') monthlyImpact -= (wizardData.maintenance || 0);
                   }
              } else {
                  // Perpetual cost
                  monthlyImpact -= newMonthlyCost;
              }
              
              monthlyImpact += newMonthlyIncome;
          }

          simCash += (baseSurplus + monthlyImpact);
          simNetWorth.push(simCash);
      }

      const newSurplus = baseSurplus - newMonthlyCost + newMonthlyIncome;

      return {
          labels,
          baseNetWorth,
          simNetWorth,
          finalBase: baseNetWorth[months-1],
          finalSim: simNetWorth[months-1],
          newMonthlyCost,
          newMonthlyIncome,
          newSurplus,
          upfrontCost
      };
  }, [selectedEvent, wizardData, baseSurplus, liquidAssets]);

  // --- Render Steps ---

  const renderEventButton = (icon: any, label: string, type: EventType, color: string) => (
      <button 
          onClick={() => handleEventSelect(type)}
          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group active:scale-95 h-28 w-full"
      >
          <div className={`w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${color} group-hover:scale-110 transition-transform mb-3`}>
              {React.createElement(icon, { size: 20 })}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">{label}</span>
      </button>
  );

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3">
                <button onClick={activeStep === 'select' ? onBack : () => setActiveStep('select')} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider mb-0.5">AI Advisor</h2>
                    <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                        Life Simulator <RefreshCcw size={18} className="text-fuchsia-500"/>
                    </h1>
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           
           {/* STEP 1: SELECT */}
           {activeStep === 'select' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                   <Card className="p-6 bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white border-none">
                       <div className="flex justify-between items-start">
                           <div>
                                <h2 className="text-xl font-bold mb-1">Simulate Your Future</h2>
                                <p className="text-indigo-100 text-sm mb-4 max-w-[200px]">
                                    See how major life events impact your 5-year wealth projection.
                                </p>
                           </div>
                           <Timer size={48} className="text-white/20" />
                       </div>
                       <div className="flex gap-2">
                            <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Predictive AI</span>
                            <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Risk Analysis</span>
                       </div>
                   </Card>

                   <div>
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">Choose an Event</h3>
                       <div className="grid grid-cols-3 gap-3">
                           {renderEventButton(Baby, "New Baby", 'baby', "text-pink-500")}
                           {renderEventButton(Home, "Buy Home", 'house', "text-emerald-500")}
                           {renderEventButton(Car, "Buy Car", 'car', "text-blue-500")}
                           {renderEventButton(Heart, "Marriage", 'marriage', "text-rose-500")}
                           {renderEventButton(GraduationCap, "Education", 'education', "text-amber-500")}
                           {renderEventButton(Briefcase, "Career", 'business', "text-indigo-500")}
                           {renderEventButton(Stethoscope, "Medical", 'medical', "text-red-500")}
                           {renderEventButton(Globe, "Move", 'relocation', "text-cyan-500")}
                           {renderEventButton(Plane, "Retire", 'retirement', "text-orange-500")}
                       </div>
                   </div>
               </div>
           )}

           {/* STEP 2: WIZARD */}
           {activeStep === 'wizard' && (
               <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
                   {/* Progress Bar */}
                   <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-8">
                       <div 
                            className="h-full bg-fuchsia-500 rounded-full transition-all duration-300"
                            style={{width: `${((currentQuestionIdx + 1) / (EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS).length) * 100}%`}}
                       ></div>
                   </div>

                   <div className="flex-1 flex flex-col justify-center">
                        <div className="text-center mb-8">
                             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 mb-4">
                                 <HelpCircle size={24} />
                             </div>
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                 {(EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS)[currentQuestionIdx].text}
                             </h2>
                             <p className="text-slate-500 dark:text-slate-400">
                                 {(EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS)[currentQuestionIdx].subtext}
                             </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                             {(() => {
                                 const q = (EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS)[currentQuestionIdx];
                                 const val = wizardData[q.id];
                                 
                                 if (q.type === 'select' && q.options) {
                                     return (
                                         <div className="space-y-3">
                                             {q.options.map(opt => (
                                                 <button
                                                    key={opt.value}
                                                    onClick={() => setWizardData({...wizardData, [q.id]: opt.value})}
                                                    className={`w-full p-4 rounded-xl border text-left font-bold transition-all ${val === opt.value ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                                 >
                                                     {opt.label}
                                                 </button>
                                             ))}
                                         </div>
                                     )
                                 }
                                 
                                 return (
                                     <div className="relative">
                                         {q.type === 'currency' && <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">{currencySymbol}</span>}
                                         <input 
                                            type={q.type === 'date' ? 'date' : 'number'}
                                            autoFocus
                                            className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xl font-bold outline-none focus:border-fuchsia-500 transition-colors ${q.type === 'currency' ? 'pl-9' : ''}`}
                                            value={val}
                                            onChange={(e) => setWizardData({...wizardData, [q.id]: q.type === 'date' ? e.target.value : parseFloat(e.target.value) || 0})}
                                         />
                                     </div>
                                 )
                             })()}
                        </div>
                   </div>

                   <div className="mt-8">
                       <button 
                            onClick={handleNextQuestion}
                            className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                           {currentQuestionIdx === (EVENT_CONFIGS[selectedEvent!] || GENERIC_QUESTIONS).length - 1 ? 'Simulate Scenario' : 'Next Question'} 
                           <ArrowRight size={20} />
                       </button>
                   </div>
               </div>
           )}

           {/* LOADING STATE */}
           {isSimulating && (
               <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                   <div className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-6"></div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Running Simulation...</h3>
                   <p className="text-slate-500">Projecting 5-year cash flow...</p>
               </div>
           )}

           {/* STEP 3: RESULTS */}
           {activeStep === 'results' && simulationResults && (
               <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                   {/* Summary Card */}
                   <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-fuchsia-500">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">New Monthly Surplus</span>
                            <div className={`text-xl font-bold mt-1 ${simulationResults.newSurplus >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(simulationResults.newSurplus, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                                Was {formatCurrency(baseSurplus, currencySymbol)}
                            </div>
                        </Card>
                        <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">5-Year Net Worth</span>
                            <div className={`text-xl font-bold mt-1 ${simulationResults.finalSim >= simulationResults.finalBase ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {formatCurrency(simulationResults.finalSim, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                                Diff: {formatCurrency(simulationResults.finalSim - simulationResults.finalBase, currencySymbol)}
                            </div>
                        </Card>
                   </div>

                   {/* Chart */}
                   <Card className="p-4">
                       <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                           <TrendingUp size={14} /> Wealth Projection
                       </h3>
                       <div className="h-48">
                           <Line 
                                data={{
                                    labels: simulationResults.labels.filter((_, i) => i % 6 === 0), // Reduce labels
                                    datasets: [
                                      {
                                        label: 'Current Path',
                                        data: simulationResults.baseNetWorth.filter((_, i) => i % 6 === 0),
                                        borderColor: '#94a3b8',
                                        borderDash: [5, 5],
                                        pointRadius: 0,
                                        tension: 0.4
                                      },
                                      {
                                        label: 'With Event',
                                        data: simulationResults.simNetWorth.filter((_, i) => i % 6 === 0),
                                        borderColor: simulationResults.newSurplus >= 0 ? '#10b981' : '#ec4899',
                                        backgroundColor: simulationResults.newSurplus >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                                        fill: true,
                                        pointRadius: 2,
                                        tension: 0.4
                                      }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: true, position: 'bottom' } },
                                    scales: { x: { display: false }, y: { display: false } }
                                }}
                           />
                       </div>
                   </Card>

                   {/* Strategic Opinions */}
                   <div>
                       <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                           <Sparkles size={18} className="text-yellow-500" /> AI Strategic Options
                       </h3>

                       <div className="space-y-3">
                           {/* Strategy 1: The Fixer (Cost Cutting) */}
                           {simulationResults.newSurplus < 0 && (
                               <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm">
                                   <div className="flex justify-between items-start mb-2">
                                       <h4 className="font-bold text-red-500 text-sm">⚠️ Deficit Alert</h4>
                                       <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">High Priority</span>
                                   </div>
                                   <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                       You'll be losing {formatCurrency(Math.abs(simulationResults.newSurplus), currencySymbol)} every month. We need to cut costs immediately.
                                   </p>
                                   <button 
                                        onClick={() => setSelectedStrategy('cut')}
                                        className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                                   >
                                       View AI "Strict Budget" Plan
                                   </button>
                               </div>
                           )}

                           {/* Strategy 2: The Grower (Income Boost) */}
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-900/30 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">The Hustle Strategy</h4>
                                   <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Growth</span>
                               </div>
                               <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                   Offset the cost by adding a side income stream. Target: {formatCurrency(simulationResults.newMonthlyCost, currencySymbol)}/mo.
                               </p>
                               <button 
                                    onClick={() => setSelectedStrategy('earn')}
                                    className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                               >
                                   View AI "Side Hustle" Plan
                               </button>
                           </div>

                           {/* Strategy 3: The Wait (Delay) */}
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">The Patient Strategy</h4>
                                   <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Low Risk</span>
                               </div>
                               <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                   Add the costs to your budget now to "practice" paying for it before it happens.
                               </p>
                               <button 
                                    onClick={() => setSelectedStrategy('save')}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                               >
                                   View "Practice Saving" Plan
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           )}
       </div>

       {/* AI Strategy Modal */}
       {selectedStrategy && selectedEvent && simulationResults && (
           <StrategyModal 
                isOpen={!!selectedStrategy}
                onClose={() => setSelectedStrategy(null)}
                onConfirm={handleStrategyConfirm}
                strategy={selectedStrategy}
                eventType={selectedEvent}
                monthlyCost={simulationResults.newMonthlyCost}
                currencySymbol={currencySymbol}
                currentExpenses={currentData.expenses.map(e => ({ name: e.name, amount: e.spent }))}
           />
       )}
    </div>
  );
};

interface StrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    strategy: 'cut' | 'earn' | 'save';
    eventType: string;
    monthlyCost: number;
    currencySymbol: string;
    currentExpenses: { name: string; amount: number }[];
}

const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, onConfirm, strategy, eventType, monthlyCost, currencySymbol, currentExpenses }) => {
    const [plan, setPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setPlan(null);
            generateStrategyPlan({
                eventType,
                monthlyCost,
                currentExpenses,
                strategy,
                currencySymbol
            }).then(res => {
                setPlan(res);
                setLoading(false);
            });
        }
    }, [isOpen, strategy]);

    if (!isOpen) return null;

    const titles = {
        cut: 'Strict Budget Plan',
        earn: 'Income Boost Plan',
        save: 'Saving Practice Plan'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-500" /> {titles[strategy]}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
                            <p className="text-xs">AI is generating your custom plan...</p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {plan}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-[2] py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Apply Plan
                    </button>
                </div>
            </div>
        </div>
    );
};
