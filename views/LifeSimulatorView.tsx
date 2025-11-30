

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
  Timer, Wallet, PlayCircle, Sparkles, X, Loader2, Rocket
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { generateStrategyPlan } from '../utils/aiHelper';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface LifeSimulatorViewProps {
  currentData: BudgetData;
  currencySymbol: string;
  onBack: () => void;
  onApplyScenario: (changes: Partial<BudgetData>) => void;
  onProfileClick: () => void;
}

type EventType = 'baby' | 'house' | 'car' | 'marriage' | 'education' | 'business' | 'medical' | 'relocation' | 'retirement' | 'startup';

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

export const LifeSimulatorView: React.FC<LifeSimulatorViewProps> = ({ currentData, currencySymbol, onBack, onApplyScenario, onProfileClick }) => {
  const { t } = useLanguage();
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

  const getEventDescription = (type: string) => {
      return t(`simulator.event.${type}.desc`);
  };

  const getEventConfigs = (type: string): Question[] => {
      const configMap: Record<string, Question[]> = {
          baby: [
             { id: 'date', text: t('simulator.q.baby.date'), type: 'date' },
             { id: 'initialCost', text: t('simulator.q.baby.initial'), subtext: t('simulator.sub.initial'), type: 'currency', defaultValue: 3000 },
             { id: 'childcare', text: t('simulator.q.baby.childcare'), type: 'select', options: [
                 {label: `None / Family Help (${currencySymbol}0)`, value: 0}, 
                 {label: `Part-time (${currencySymbol}800)`, value: 800}, 
                 {label: `Full-time (${currencySymbol}1600)`, value: 1600}
             ], defaultValue: 0 },
             { id: 'supplies', text: t('simulator.q.baby.supplies'), subtext: t('simulator.sub.supplies'), type: 'currency', defaultValue: 200 },
             { id: 'leaveLoss', text: t('simulator.q.baby.leave'), subtext: t('simulator.sub.leave'), type: 'currency', defaultValue: 0 }
          ],
          house: [
             { id: 'date', text: t('simulator.q.date'), type: 'date' },
             { id: 'price', text: t('simulator.q.house.price'), type: 'currency', defaultValue: 350000 },
             { id: 'downpayment', text: t('simulator.q.house.down'), subtext: t('simulator.sub.down'), type: 'currency', defaultValue: 50000 },
             { id: 'rate', text: t('simulator.q.rate'), type: 'number', defaultValue: 6.5 },
             { id: 'term', text: t('simulator.q.term'), type: 'select', options: [{label: '30 Years', value: 30}, {label: '15 Years', value: 15}], defaultValue: 30 },
             { id: 'maintenance', text: t('simulator.q.house.maint'), type: 'currency', defaultValue: 400 }
          ],
          car: [
              { id: 'date', text: t('simulator.q.date'), type: 'date' },
              { id: 'price', text: t('simulator.q.price'), type: 'currency', defaultValue: 25000 },
              { id: 'tradein', text: t('simulator.q.car.tradein'), type: 'currency', defaultValue: 5000 },
              { id: 'term', text: t('simulator.q.term'), type: 'select', options: [{label: '36 Months', value: 36}, {label: '48 Months', value: 48}, {label: '60 Months', value: 60}, {label: '72 Months', value: 72}], defaultValue: 60 },
              { id: 'rate', text: t('simulator.q.rate'), type: 'number', defaultValue: 7.0 },
              { id: 'insurance', text: t('simulator.q.car.ins'), type: 'currency', defaultValue: 50 }
          ],
          education: [
              { id: 'date', text: t('simulator.q.date'), type: 'date' },
              { id: 'tuition', text: t('simulator.q.edu.tuition'), type: 'currency', defaultValue: 15000 },
              { id: 'years', text: t('simulator.q.edu.years'), type: 'number', defaultValue: 4 },
              { id: 'funding', text: t('simulator.q.edu.funding'), type: 'select', options: [{label: 'Pay Monthly (Cash Flow)', value: 'cash'}, {label: 'Student Loans', value: 'loan'}], defaultValue: 'cash' }
          ],
          retirement: [
              { id: 'date', text: t('simulator.q.date'), type: 'date' },
              { id: 'monthlyNeed', text: t('simulator.q.ret.monthly'), type: 'currency', defaultValue: 4000 },
              { id: 'pension', text: t('simulator.q.ret.pension'), type: 'currency', defaultValue: 1500 }
          ],
          startup: [
              { id: 'date', text: t('simulator.q.date'), type: 'date' },
              { id: 'initialCost', text: t('simulator.q.startup.initial'), subtext: t('simulator.sub.startup_init'), type: 'currency', defaultValue: 5000 },
              { id: 'monthlyCost', text: t('simulator.q.startup.monthly'), subtext: t('simulator.sub.startup_monthly'), type: 'currency', defaultValue: 500 },
              { id: 'incomeChange', text: t('simulator.q.startup.income'), subtext: t('simulator.sub.startup_income'), type: 'currency', defaultValue: 1000 }
          ]
      };

      const GENERIC_QUESTIONS: Question[] = [
        { id: 'date', text: t('simulator.q.date'), type: 'date' },
        { id: 'initialCost', text: t('simulator.q.initialCost'), type: 'currency', defaultValue: 1000 },
        { id: 'monthlyCost', text: t('simulator.q.monthlyCost'), type: 'currency', defaultValue: 100 },
        { id: 'incomeChange', text: t('simulator.q.incomeChange'), subtext: t('simulator.sub.generic_income'), type: 'currency', defaultValue: 0 }
      ];

      return configMap[type] || GENERIC_QUESTIONS;
  };

  // --- Handlers ---
  const handleEventSelect = (type: EventType) => {
      setSelectedEvent(type);
      setWizardData({});
      setCurrentQuestionIdx(0);
      
      // Initialize defaults
      const questions = getEventConfigs(type);
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
      const questions = getEventConfigs(selectedEvent!);
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
          newExpenses.push({ id: generateId(), name: `${t(`simulator.event.${selectedEvent}`)} Cost`, budgeted: simulationResults.newMonthlyCost, spent: 0 });
          // Simulate cutting other expenses by 20%
          const slashed = newExpenses.map(e => e.id.includes(selectedEvent!) ? e : { ...e, budgeted: e.budgeted * 0.8 });
          onApplyScenario({ expenses: slashed });
      } else if (selectedStrategy === 'earn') {
          const newExpenses = [...currentData.expenses, { id: generateId(), name: `${t(`simulator.event.${selectedEvent}`)} Cost`, budgeted: simulationResults.newMonthlyCost, spent: 0 }];
          const newIncome = [...currentData.income, { id: generateId(), name: 'Side Hustle Target', planned: simulationResults.newMonthlyCost, actual: 0 }];
          onApplyScenario({ expenses: newExpenses, income: newIncome });
      } else if (selectedStrategy === 'save') {
          const newSavings = [...currentData.savings, { id: generateId(), name: `${t(`simulator.event.${selectedEvent}`)} Fund`, planned: simulationResults.newMonthlyCost, amount: 0 }];
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

  // --- New Event Card Component ---
  const EventCard = ({ icon: Icon, labelKey, type, colorClass }: { icon: any, labelKey: string, type: EventType, colorClass: string }) => {
      const bgColorClass = colorClass.replace('text-', 'bg-').replace('500', '100');
      
      return (
        <div className="card-wrapper" onClick={() => handleEventSelect(type)}>
            <div className="card">
                <div className="header">
                    <div className={`image ${bgColorClass} dark:bg-slate-800`}>
                        <Icon size={24} className={colorClass} strokeWidth={2} />
                    </div>
                    <div>
                        <p className="name">{t(labelKey)}</p>
                    </div>
                </div>
                <p className="message">
                    {getEventDescription(type)}
                </p>
            </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Embedded CSS for Card */}
       <style>{`
        .card {
            background-color: rgba(243, 244, 246, 1);
            padding: 1.5rem;
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 20px 30px -20px rgba(5, 5, 5, 0.24);
            cursor: pointer;
            transition: transform 0.2s;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        
        .dark .card {
            background-color: #1e293b;
            box-shadow: 0 20px 30px -20px rgba(0, 0, 0, 0.5);
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .header {
            display: flex;
            align-items: center;
            grid-gap: 1rem;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .header .image {
            height: 3.5rem;
            width: 3.5rem;
            border-radius: 9999px;
            object-fit: cover;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .name {
            font-size: 1.125rem;
            line-height: 1.25rem;
            font-weight: 600;
            color: rgba(55, 65, 81, 1);
        }
        
        .dark .name {
            color: #fff;
        }

        .message {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            color: rgba(107, 114, 128, 1);
            font-size: 0.875rem;
            line-height: 1.4;
        }
        
        .dark .message {
            color: #94a3b8;
        }
       `}</style>

       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={activeStep === 'select' ? onBack : () => setActiveStep('select')} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider mb-0.5">AI Advisor</h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                            {t('simulator.title')} <RefreshCcw size={18} className="text-fuchsia-500"/>
                        </h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
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
                                <h2 className="text-xl font-bold mb-1">{t('simulator.subtitle')}</h2>
                                <p className="text-indigo-100 text-sm mb-4 max-w-[200px]">
                                    {t('simulator.intro')}
                                </p>
                           </div>
                           <Timer size={48} className="text-white/20" />
                       </div>
                       <div className="flex gap-2">
                            <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{t('simulator.tags.predictive')}</span>
                            <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{t('simulator.tags.risk')}</span>
                       </div>
                   </Card>

                   <div>
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 px-1">{t('simulator.choose_event')}</h3>
                       <div className="grid grid-cols-2 gap-3">
                           <EventCard icon={Rocket} labelKey="simulator.event.startup" type="startup" colorClass="text-purple-500" />
                           <EventCard icon={Baby} labelKey="simulator.event.baby" type="baby" colorClass="text-pink-500" />
                           <EventCard icon={Home} labelKey="simulator.event.house" type="house" colorClass="text-emerald-500" />
                           <EventCard icon={Car} labelKey="simulator.event.car" type="car" colorClass="text-blue-500" />
                           <EventCard icon={Heart} labelKey="simulator.event.marriage" type="marriage" colorClass="text-rose-500" />
                           <EventCard icon={GraduationCap} labelKey="simulator.event.education" type="education" colorClass="text-amber-500" />
                           <EventCard icon={Briefcase} labelKey="simulator.event.business" type="business" colorClass="text-indigo-500" />
                           <EventCard icon={Stethoscope} labelKey="simulator.event.medical" type="medical" colorClass="text-red-500" />
                           <EventCard icon={Globe} labelKey="simulator.event.relocation" type="relocation" colorClass="text-cyan-500" />
                           <EventCard icon={Plane} labelKey="simulator.event.retirement" type="retirement" colorClass="text-orange-500" />
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
                            style={{width: `${((currentQuestionIdx + 1) / getEventConfigs(selectedEvent!).length) * 100}%`}}
                       ></div>
                   </div>

                   <div className="flex-1 flex flex-col justify-center">
                        <div className="text-center mb-8">
                             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 mb-4">
                                 <HelpCircle size={24} />
                             </div>
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                 {getEventConfigs(selectedEvent!)[currentQuestionIdx].text}
                             </h2>
                             <p className="text-slate-500 dark:text-slate-400">
                                 {getEventConfigs(selectedEvent!)[currentQuestionIdx].subtext}
                             </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                             {(() => {
                                 const q = getEventConfigs(selectedEvent!)[currentQuestionIdx];
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
                           {currentQuestionIdx === getEventConfigs(selectedEvent!).length - 1 ? t('simulator.wizard.simulate') : t('simulator.wizard.next')} 
                           <ArrowRight size={20} />
                       </button>
                   </div>
               </div>
           )}

           {/* LOADING STATE */}
           {isSimulating && (
               <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                   <div className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-6"></div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('simulator.loading.title')}</h3>
                   <p className="text-slate-500">{t('simulator.loading.desc')}</p>
               </div>
           )}

           {/* STEP 3: RESULTS */}
           {activeStep === 'results' && simulationResults && (
               <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                   {/* Summary Card */}
                   <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-fuchsia-500">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">{t('simulator.result.surplus')}</span>
                            <div className={`text-xl font-bold mt-1 ${simulationResults.newSurplus >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(simulationResults.newSurplus, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                                Was {formatCurrency(baseSurplus, currencySymbol)}
                            </div>
                        </Card>
                        <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">{t('simulator.result.networth')}</span>
                            <div className={`text-xl font-bold mt-1 ${simulationResults.finalSim >= simulationResults.finalBase ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {formatCurrency(simulationResults.finalSim, currencySymbol)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                                {t('simulator.result.diff')}: {formatCurrency(simulationResults.finalSim - simulationResults.finalBase, currencySymbol)}
                            </div>
                        </Card>
                   </div>

                   {/* Chart */}
                   <Card className="p-4">
                       <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                           <TrendingUp size={14} /> {t('simulator.result.chart_title')}
                       </h3>
                       <div className="h-48">
                           <Line 
                                data={{
                                    labels: simulationResults.labels.filter((_, i) => i % 6 === 0), // Reduce labels
                                    datasets: [
                                      {
                                        label: t('simulator.result.chart_current'),
                                        data: simulationResults.baseNetWorth.filter((_, i) => i % 6 === 0),
                                        borderColor: '#94a3b8',
                                        borderDash: [5, 5],
                                        pointRadius: 0,
                                        tension: 0.4
                                      },
                                      {
                                        label: t('simulator.result.chart_event'),
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
                           <Sparkles size={18} className="text-yellow-500" /> {t('simulator.strategies.title')}
                       </h3>

                       <div className="space-y-3">
                           {/* Strategy 1: The Fixer (Cost Cutting) */}
                           {simulationResults.newSurplus < 0 && (
                               <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm">
                                   <div className="flex justify-between items-start mb-2">
                                       <h4 className="font-bold text-red-500 text-sm">⚠️ {t('simulator.strategies.deficit')}</h4>
                                       <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{t('simulator.strategies.high_priority')}</span>
                                   </div>
                                   <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                       {t('simulator.strategies.deficit_desc') || `You'll be losing ${formatCurrency(Math.abs(simulationResults.newSurplus), currencySymbol)} every month. We need to cut costs immediately.`}
                                   </p>
                                   <button 
                                        onClick={() => setSelectedStrategy('cut')}
                                        className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                                   >
                                       {t('simulator.strategies.cut_btn')}
                                   </button>
                               </div>
                           )}

                           {/* Strategy 2: The Grower (Income Boost) */}
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-900/30 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{t('simulator.strategies.hustle')}</h4>
                                   <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{t('simulator.strategies.growth')}</span>
                               </div>
                               <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                   {t('simulator.strategies.hustle_desc') || `Offset the cost by adding a side income stream. Target: ${formatCurrency(simulationResults.newMonthlyCost, currencySymbol)}/mo.`}
                               </p>
                               <button 
                                    onClick={() => setSelectedStrategy('earn')}
                                    className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                               >
                                   {t('simulator.strategies.earn_btn')}
                                </button>
                           </div>

                           {/* Strategy 3: The Wait (Delay) */}
                           <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                               <div className="flex justify-between items-start mb-2">
                                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t('simulator.strategies.patient')}</h4>
                                   <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{t('simulator.strategies.low_risk')}</span>
                               </div>
                               <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                                   {t('simulator.strategies.patient_desc') || "Add the costs to your budget now to \"practice\" paying for it before it happens."}
                               </p>
                               <button 
                                    onClick={() => setSelectedStrategy('save')}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                               >
                                   {t('simulator.strategies.save_btn')}
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
                t={t}
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
    t: (key: string) => string;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, onConfirm, strategy, eventType, monthlyCost, currencySymbol, currentExpenses, t }) => {
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
    }, [isOpen, strategy, eventType, monthlyCost, currencySymbol, currentExpenses]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-fuchsia-500" /> {t('simulator.strategies.title')}
                        </h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-bold">{strategy === 'cut' ? 'Cost Cutting' : strategy === 'earn' ? 'Income Growth' : 'Saving Strategy'}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 size={32} className="text-fuchsia-500 animate-spin mb-3" />
                        <p className="text-xs text-slate-500">{t('simulator.strategies.consulting')}</p>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {plan}
                        </p>
                    </div>
                )}

                <button 
                    onClick={onConfirm}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} /> {t('simulator.strategies.apply')}
                </button>
            </div>
        </div>
    );
};
