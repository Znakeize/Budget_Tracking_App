
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, Calculator, TrendingUp, DollarSign, 
  Landmark, PieChart, RefreshCcw, Percent, BarChart3,
  ArrowRight, Download, Table as TableIcon, Activity, Zap, Crown,
  Settings, Info, Globe, ArrowLeftRight, Coins, Receipt, Briefcase,
  Home, Car, CreditCard, Plane, Smile, Coffee, Gem, Calendar, Clock, Lock,
  ShieldCheck, Gauge, TrendingDown
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler, BarElement } from 'chart.js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { TaxPlannerView } from './TaxPlannerView';
import { ForexCalculatorView } from './ForexCalculatorView';
import { SimpleCurrencyConverterView } from './SimpleCurrencyConverterView';
import { BudgetData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler, BarElement);

interface AdvancedCalculatorsViewProps {
  onBack: () => void;
  currencySymbol: string;
  onProfileClick: () => void;
  budgetData?: BudgetData;
  user?: any;
  onNavigate?: (tab: string) => void;
  onViewFeature?: (featureId: string) => void;
}

type ModuleType = 'investment' | 'loan' | 'retirement' | 'tax' | 'business' | 'converter' | 'vat' | 'forex' | 'simple-converter' | null;

export const AdvancedCalculatorsView: React.FC<AdvancedCalculatorsViewProps> = ({ 
  onBack, currencySymbol, onProfileClick, budgetData, user, onNavigate, onViewFeature 
}) => {
  const [activeModule, setActiveModule] = useState<ModuleType>(null); // Null shows the dashboard

  // --- Inputs State ---
  const [invInputs, setInvInputs] = useState({ 
      principal: 5000, 
      contribution: 500, 
      frequency: 'monthly', // weekly, bi-weekly, monthly, annually
      rate: 8, 
      years: 10, 
      inflation: 2.5, 
      stepUp: 0, 
      type: 'sip' // sip or lumpsum
  });
  
  const [loanInputs, setLoanInputs] = useState({ amount: 50000, rate: 5.5, tenure: 5, extraPayment: 0, loanType: 'personal' }); 
  const [retInputs, setRetInputs] = useState({ currentAge: 30, retAge: 65, savings: 20000, monthlySave: 1000, monthlySpend: 3000, inflation: 3, preRetReturn: 8, postRetReturn: 5, lifeExpectancy: 85 });

  // --- Calculations Logic ---

  // Calculate metrics from budgetData if available
  const budgetMetrics = useMemo(() => {
      if (!budgetData) return null;
      const totalValue = budgetData.investments.reduce((sum, i) => sum + i.amount, 0);
      const totalMonthlyContribution = budgetData.investments.reduce((sum, i) => sum + (i.monthly || 0), 0);
      return { totalValue, totalMonthlyContribution };
  }, [budgetData]);

  // Sync calculator defaults with real data
  useEffect(() => {
      if (activeModule === 'investment' && budgetMetrics && invInputs.principal === 5000) { 
          // Only auto-fill if user hasn't modified the default 5000 yet, or first load
          setInvInputs(prev => ({ 
              ...prev, 
              principal: budgetMetrics.totalValue || prev.principal, 
              contribution: budgetMetrics.totalMonthlyContribution || prev.contribution 
          }));
      }
  }, [activeModule, budgetMetrics]);

  // Investment
  const investmentResults = useMemo(() => {
      const dataPoints = [];
      let totalInvested = invInputs.principal;
      let nominalValue = invInputs.principal;
      let currentContribution = invInputs.type === 'sip' ? invInputs.contribution : 0;
      
      const periodsMap: Record<string, number> = { 'weekly': 52, 'bi-weekly': 26, 'monthly': 12, 'annually': 1 };
      const ppy = periodsMap[invInputs.frequency] || 12;
      const totalPeriods = invInputs.years * ppy;
      const ratePerPeriod = invInputs.rate / 100 / ppy;

      for (let i = 1; i <= totalPeriods; i++) {
          // Interest
          nominalValue = nominalValue * (1 + ratePerPeriod);
          
          // Contribution
          if (invInputs.type === 'sip') {
              nominalValue += currentContribution;
              totalInvested += currentContribution;
          }

          // Annual Step Up (Check if we completed a year)
          if (i % ppy === 0 && invInputs.stepUp > 0 && invInputs.type === 'sip') {
              currentContribution = currentContribution * (1 + invInputs.stepUp / 100);
          }
          
          // Record data points (Yearly)
          if (i % ppy === 0) {
              dataPoints.push({ 
                  year: i / ppy, 
                  invested: totalInvested, 
                  value: nominalValue, 
                  gain: nominalValue - totalInvested 
              });
          }
      }
      
      const totalInterest = nominalValue - totalInvested;
      const realValue = nominalValue / Math.pow(1 + invInputs.inflation/100, invInputs.years);
      
      // ROI Calculation
      const totalRoi = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0;
      
      // Cost of Delay (Delay 1 year)
      // Estimate by running a simplified loop for (years - 1)
      let delayVal = invInputs.principal;
      const delayPeriods = (invInputs.years - 1) * ppy;
      let delayInvested = invInputs.principal; // Unused but kept for logic consistency
      let delayContrib = invInputs.type === 'sip' ? invInputs.contribution : 0;
      
      if (invInputs.years > 1) {
          for (let i = 1; i <= delayPeriods; i++) {
              delayVal = delayVal * (1 + ratePerPeriod);
              if (invInputs.type === 'sip') {
                  delayVal += delayContrib;
              }
              if (i % ppy === 0 && invInputs.stepUp > 0 && invInputs.type === 'sip') {
                  delayContrib = delayContrib * (1 + invInputs.stepUp / 100);
              }
          }
      }
      const costOfDelay = nominalValue - delayVal;

      return { totalValue: nominalValue, realValue, totalInvested, totalInterest, dataPoints, costOfDelay, totalRoi };
  }, [invInputs]);

  // Loan
  const loanResults = useMemo(() => {
      const r = loanInputs.rate / 100 / 12;
      const n = loanInputs.tenure * 12; 
      
      // Standard EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const emi = (loanInputs.amount * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      
      let balance = loanInputs.amount;
      let totalInterest = 0;
      let actualMonths = 0;
      const amortization = [];
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;

      // Simulation loop
      while (balance > 0.1 && actualMonths < 600) { // Safety cap
          const interest = balance * r;
          const totalPay = emi + loanInputs.extraPayment;
          const principal = Math.min(balance, totalPay - interest);
          
          balance -= principal;
          totalInterest += interest;
          yearlyInterest += interest;
          yearlyPrincipal += principal;
          actualMonths++;

          // Yearly Snapshots
          if (actualMonths % 12 === 0 || balance <= 0.1) {
              amortization.push({
                  year: Math.ceil(actualMonths / 12),
                  interest: yearlyInterest,
                  principal: yearlyPrincipal,
                  balance: Math.max(0, balance)
              });
              yearlyInterest = 0;
              yearlyPrincipal = 0;
          }
      }

      const totalPayment = loanInputs.amount + totalInterest;
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + actualMonths);

      const interestSaved = ((emi * n) - loanInputs.amount) - totalInterest;
      const timeSaved = n - actualMonths;

      return { 
          emi, totalPayment, totalInterest, actualMonths, 
          interestSaved, timeSaved, payoffDate, amortization 
      };
  }, [loanInputs]);

  // Retirement
  const retResults = useMemo(() => {
      // Phase 1: Accumulation (Now -> Retire)
      const yearsToGrow = retInputs.retAge - retInputs.currentAge;
      const accumulationData = [];
      const realAccumulationData = [];
      
      let currentCorpus = retInputs.savings;
      const monthlyRate = retInputs.preRetReturn / 100 / 12;
      const monthlyInflation = retInputs.inflation / 100 / 12;
      
      for(let i=0; i<=yearsToGrow; i++) {
          const age = retInputs.currentAge + i;
          const totalMonths = i * 12;
          const discountFactor = Math.pow(1 + monthlyInflation, totalMonths);
          
          accumulationData.push({ age, value: currentCorpus });
          realAccumulationData.push({ age, value: currentCorpus / discountFactor });
          
          // Grow for 1 year
          for(let m=0; m<12; m++) {
              currentCorpus = (currentCorpus + retInputs.monthlySave) * (1 + monthlyRate);
          }
      }

      const corpusAtRetirement = currentCorpus;
      // Real value at retirement is discounted back to today
      const realCorpusAtRetirement = corpusAtRetirement / Math.pow(1 + monthlyInflation, yearsToGrow * 12);

      // Phase 2: Distribution (Retire -> Death)
      const yearsInRetirement = retInputs.lifeExpectancy - retInputs.retAge;
      const postMonthlyRate = retInputs.postRetReturn / 100 / 12;
      
      // Calculate required monthly spend at retirement age adjusted for inflation
      let currentMonthlySpend = retInputs.monthlySpend * Math.pow(1 + monthlyInflation, yearsToGrow * 12);
      
      const distributionData = [];
      const realDistributionData = [];
      let distCorpus = corpusAtRetirement;
      
      let hasRunOut = false;
      let runOutAge = null;

      for(let i=0; i<=yearsInRetirement; i++) {
          const age = retInputs.retAge + i;
          const totalMonths = (age - retInputs.currentAge) * 12;
          const discountFactor = Math.pow(1 + monthlyInflation, totalMonths);

          distributionData.push({ age, value: Math.max(0, distCorpus) });
          realDistributionData.push({ age, value: Math.max(0, distCorpus / discountFactor) });
          
          // Withdraw for 1 year
          for(let m=0; m<12; m++) {
              distCorpus = distCorpus * (1 + postMonthlyRate) - currentMonthlySpend;
              currentMonthlySpend = currentMonthlySpend * (1 + monthlyInflation); // Inflation continues in retirement
              if (distCorpus <= 0 && !hasRunOut) {
                  hasRunOut = true;
                  runOutAge = retInputs.retAge + i + (m/12);
              }
          }
      }

      const gap = hasRunOut ? 1 : 0; // Simple indicator for UI state

      return { 
          corpus: corpusAtRetirement, 
          realCorpus: realCorpusAtRetirement,
          monthlySpendAtRetirement: retInputs.monthlySpend * Math.pow(1 + retInputs.inflation/100, yearsToGrow),
          chartData: [...accumulationData, ...distributionData],
          realChartData: [...realAccumulationData, ...realDistributionData],
          runOutAge,
          gap
      };
  }, [retInputs]);

  // Check if user has unlocked business features
  const hasBusinessAccess = user?.isPro || (user?.unlockedFeatures && user.unlockedFeatures.includes('business'));

  const handleModuleClick = (module: ModuleType, isPremium: boolean) => {
      if (isPremium && !hasBusinessAccess) {
          if (onViewFeature) {
              onViewFeature('business');
          } else if (onNavigate) {
              onNavigate('pro-membership');
          }
          return;
      }
      setActiveModule(module);
  };

  // If specialized modules are active, render them
  if (activeModule === 'tax' || activeModule === 'vat' || activeModule === 'business') {
      return (
        <TaxPlannerView 
            onBack={() => setActiveModule(null)} 
            userProfile={{}} 
            defaultMode={activeModule === 'vat' ? 'vat' : activeModule === 'business' ? 'business' : 'income'} 
            budgetData={budgetData}
        />
      );
  }

  if (activeModule === 'forex' || activeModule === 'converter') {
      return <ForexCalculatorView onBack={() => setActiveModule(null)} currencySymbol={currencySymbol} />;
  }

  if (activeModule === 'simple-converter') {
      return <SimpleCurrencyConverterView onBack={() => setActiveModule(null)} currencySymbol={currencySymbol} />;
  }

  // --- Renders ---
  
  const renderDashboard = () => (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
          
          {/* Basic Essentials Section */}
          <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                  <Calculator size={14} /> Basic Essentials
              </h3>
              <div className="grid grid-cols-2 gap-3">
                  
                  {/* Income Tax Card */}
                  <button 
                      onClick={() => setActiveModule('tax')}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group active:scale-95 col-span-2"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Percent size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-lg text-slate-900 dark:text-white">Income Tax</h4>
                              <p className="text-xs text-slate-500 mt-1">Personal Tax Slabs & Deductions</p>
                          </div>
                          <ArrowRight className="ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
                      </div>
                  </button>

                  <button 
                      onClick={() => setActiveModule('loan')}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group active:scale-95"
                  >
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Landmark size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Loan & EMI</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Amortization</p>
                  </button>

                  <button 
                      onClick={() => setActiveModule('investment')}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group active:scale-95"
                  >
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <TrendingUp size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Wealth</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Growth & SIP</p>
                  </button>

                  <button 
                      onClick={() => setActiveModule('retirement')}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left group active:scale-95"
                  >
                      <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <RefreshCcw size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Retirement</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Planning</p>
                  </button>

                  {/* Currency Converter System - Updated */}
                  <button 
                      onClick={() => setActiveModule('simple-converter')}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all text-left group active:scale-95"
                  >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ArrowLeftRight size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Currency</h4>
                      <p className="text-[10px] text-slate-500 mt-1">System & Charts</p>
                  </button>
              </div>
          </div>

          {/* Advanced Section - Premium Gated */}
          <div>
              <div className="flex items-center gap-2 mb-3 ml-1">
                  <Briefcase size={14} className="text-slate-500" /> 
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advanced Section</h3>
                  {!hasBusinessAccess && <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded ml-1">PRO</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <button 
                      onClick={() => handleModuleClick('business', true)}
                      className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all text-left group active:scale-95 relative overflow-hidden ${!hasBusinessAccess ? 'opacity-90' : 'hover:border-indigo-500'}`}
                  >
                      {!hasBusinessAccess && (
                          <div className="absolute top-2 right-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                              <Lock size={14} />
                          </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Briefcase size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Business Tax</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Corporate & P&L</p>
                  </button>

                  <button 
                      onClick={() => handleModuleClick('vat', true)}
                      className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all text-left group active:scale-95 relative overflow-hidden ${!hasBusinessAccess ? 'opacity-90' : 'hover:border-indigo-500'}`}
                  >
                      {!hasBusinessAccess && (
                          <div className="absolute top-2 right-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                              <Lock size={14} />
                          </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Receipt size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">VAT / GST</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Sales Tax</p>
                  </button>

                  <button 
                      onClick={() => handleModuleClick('forex', true)}
                      className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all text-left group active:scale-95 relative overflow-hidden ${!hasBusinessAccess ? 'opacity-90' : 'hover:border-indigo-500'}`}
                  >
                      {!hasBusinessAccess && (
                          <div className="absolute top-2 right-2 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                              <Lock size={14} />
                          </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Globe size={20} />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Forex Suite</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Trading & P&L</p>
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                    <button onClick={activeModule ? () => setActiveModule(null) : onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                            {activeModule ? 'Calculator' : 'Tools'}
                        </h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white capitalize">
                            {activeModule ? activeModule.replace('-', ' ') : 'Calculators'}
                        </h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {!activeModule && renderDashboard()}
           {activeModule === 'investment' && <InvestmentModule results={investmentResults} inputs={invInputs} setInputs={setInvInputs} currencySymbol={currencySymbol} />}
           {activeModule === 'loan' && <LoanModule results={loanResults} inputs={loanInputs} setInputs={setLoanInputs} currencySymbol={currencySymbol} />}
           {activeModule === 'retirement' && <RetirementModule results={retResults} inputs={retInputs} setInputs={setRetInputs} currencySymbol={currencySymbol} />}
       </div>
    </div>
  );
};

const ModuleDescription = ({ title, description }: { title: string, description: string }) => (
    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
            <Info size={16} className="text-indigo-500" /> {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
        </p>
    </div>
);

const InvestmentModule = ({ results, inputs, setInputs, currencySymbol }: any) => {
    const [showRealValue, setShowRealValue] = useState(false);
    const [activeTab, setActiveTab] = useState<'forecast' | 'roi'>('forecast');
    const [roiParams, setRoiParams] = useState({ initial: 10000, final: 18000, years: 5, inflation: 2.5, tax: 15 });

    const roiResults = useMemo(() => {
        const gain = roiParams.final - roiParams.initial;
        const totalRoi = roiParams.initial > 0 ? (gain / roiParams.initial) * 100 : 0;
        const cagr = (roiParams.initial > 0 && roiParams.final > 0 && roiParams.years > 0)
            ? (Math.pow(roiParams.final / roiParams.initial, 1 / roiParams.years) - 1) * 100
            : 0;
            
        // Tax Logic (on Nominal Gain)
        const taxAmount = Math.max(0, gain * ((roiParams.tax || 0) / 100));
        const postTaxFinal = roiParams.final - taxAmount;
        
        // Inflation Logic (Real Value)
        const inflationFactor = Math.pow(1 + (roiParams.inflation || 0) / 100, roiParams.years);
        const realPostTaxFinal = postTaxFinal / inflationFactor;
        
        // Value lost to inflation (Difference between nominal post-tax and real post-tax)
        const inflationLoss = postTaxFinal - realPostTaxFinal;

        // Real CAGR
        const realPostTaxCagr = (roiParams.initial > 0 && realPostTaxFinal > 0 && roiParams.years > 0)
            ? (Math.pow(realPostTaxFinal / roiParams.initial, 1 / roiParams.years) - 1) * 100
            : 0;
            
        // Net Real Gain (Real Final - Initial)
        const realNetGain = realPostTaxFinal - roiParams.initial;

        return { gain, totalRoi, cagr, taxAmount, postTaxFinal, realPostTaxFinal, inflationLoss, realPostTaxCagr, realNetGain };
    }, [roiParams]);

    const breakdownData = {
        labels: ['Principal', 'Returns'],
        datasets: [{
            data: [results.totalInvested, results.totalInterest],
            backgroundColor: ['#cbd5e1', '#8b5cf6'],
            borderWidth: 0,
        }]
    };

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
            <button onClick={() => setActiveTab('forecast')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab==='forecast' ? 'bg-white dark:bg-slate-700 shadow text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>Growth Forecast</button>
            <button onClick={() => setActiveTab('roi')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab==='roi' ? 'bg-white dark:bg-slate-700 shadow text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}>ROI Calculator</button>
        </div>

        {activeTab === 'forecast' ? (
            <>
                <ModuleDescription 
                    title="Investment Planner" 
                    description="Project wealth accumulation through SIP or Lumpsum investments. Adjust for inflation and step-up contributions to see real purchasing power." 
                />

                <Card className="p-5 bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-violet-200 font-bold uppercase mb-1">{showRealValue ? 'Inflation Adjusted Value' : 'Future Value'}</p>
                                <h2 className="text-3xl font-bold">{currencySymbol}{(showRealValue ? results.realValue : results.totalValue).toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg cursor-pointer" onClick={() => setShowRealValue(!showRealValue)}>
                                {showRealValue ? <Percent size={24} /> : <TrendingUp size={24} />}
                            </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <button onClick={() => setShowRealValue(false)} className={`px-2 py-1 rounded ${!showRealValue ? 'bg-white text-violet-700 font-bold' : 'text-violet-200'}`}>Nominal</button>
                            <button onClick={() => setShowRealValue(true)} className={`px-2 py-1 rounded ${showRealValue ? 'bg-white text-violet-700 font-bold' : 'text-violet-200'}`}>Real (Inflation)</button>
                        </div>
                    </div>
                </Card>

                {/* Input Configuration */}
                <Card className="p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Settings size={12}/> Strategy</h4>
                    
                    {/* Type Selector */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                        <button 
                            onClick={() => setInputs({...inputs, type: 'sip'})} 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inputs.type === 'sip' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}
                        >
                            SIP (Recurring)
                        </button>
                        <button 
                            onClick={() => setInputs({...inputs, type: 'lumpsum'})} 
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inputs.type === 'lumpsum' ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}
                        >
                            Lumpsum
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <InputGroup label="Start Amount" value={inputs.principal} onChange={v => setInputs({...inputs, principal: v})} prefix={currencySymbol} />
                        <InputGroup label="Duration (Years)" value={inputs.years} onChange={v => setInputs({...inputs, years: v})} />
                    </div>

                    {inputs.type === 'sip' && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <InputGroup label="Contribution" value={inputs.contribution} onChange={v => setInputs({...inputs, contribution: v})} prefix={currencySymbol} />
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequency</label>
                                <select 
                                    value={inputs.frequency}
                                    onChange={(e) => setInputs({...inputs, frequency: e.target.value})}
                                    className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="annually">Annually</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Return Rate (%)" value={inputs.rate} onChange={v => setInputs({...inputs, rate: v})} />
                        <InputGroup label="Inflation (%)" value={inputs.inflation} onChange={v => setInputs({...inputs, inflation: v})} />
                    </div>
                    
                    {inputs.type === 'sip' && (
                        <div className="mt-3">
                            <InputGroup label="Annual Step-Up (%)" value={inputs.stepUp} onChange={v => setInputs({...inputs, stepUp: v})} />
                        </div>
                    )}
                </Card>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Growth Curve</h3>
                        <div className="h-40">
                            <Line 
                                data={{
                                    labels: results.dataPoints.map((d:any) => `Y${d.year}`), 
                                    datasets: [
                                        {label: 'Value', data: results.dataPoints.map((d:any) => d.value), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, pointRadius: 0},
                                        {label: 'Invested', data: results.dataPoints.map((d:any) => d.invested), borderColor: '#cbd5e1', borderDash: [5,5], fill: false, pointRadius: 0}
                                    ]
                                }} 
                                options={{responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {y: {display: false}, x: {display: false}}}} 
                            />
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center justify-between">
                        <div className="w-1/2 h-32 relative">
                            <Doughnut 
                                data={breakdownData} 
                                options={{maintainAspectRatio: false, cutout: '70%', plugins: {legend: {display: false}}}} 
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                Total
                            </div>
                        </div>
                        <div className="flex-1 pl-4 space-y-2">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Invested</p>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{currencySymbol}{results.totalInvested.toLocaleString(undefined, {notation: 'compact'})}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500"></span> Returns</p>
                                <p className="font-bold text-emerald-500 text-sm">+{currencySymbol}{results.totalInterest.toLocaleString(undefined, {notation: 'compact'})}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-transparent border border-slate-400"></span> Total ROI</p>
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{results.totalRoi.toFixed(1)}%</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Cost of Waiting Insight */}
                {results.costOfDelay > 0 && (
                    <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20">
                        <div className="flex gap-3">
                            <Clock className="text-amber-500 shrink-0" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">Cost of Delay</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    If you wait just 1 year to start, you could lose approximately <strong>{currencySymbol}{results.costOfDelay.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> in potential wealth.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </>
        ) : (
            <>
                <ModuleDescription 
                    title="Advanced ROI Analyzer" 
                    description="Determine the true efficiency of your investment by factoring in taxes and inflation. See if you are truly building wealth or just keeping up." 
                />

                {/* Verdict Banner */}
                <div className={`p-4 rounded-2xl mb-6 flex items-center gap-4 ${roiResults.realPostTaxCagr > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                    <div className={`p-2 rounded-full ${roiResults.realPostTaxCagr > 0 ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-red-200 dark:bg-red-800'}`}>
                        {roiResults.realPostTaxCagr > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{roiResults.realPostTaxCagr > 0 ? 'Wealth Generated' : 'Purchasing Power Lost'}</h3>
                        <p className="text-xs opacity-80">
                            {roiResults.realPostTaxCagr > 0 
                                ? `Your investment is beating inflation and taxes by ${roiResults.realPostTaxCagr.toFixed(2)}% annually.`
                                : `After taxes and inflation, you are effectively losing ${Math.abs(roiResults.realPostTaxCagr).toFixed(2)}% annually.`
                            }
                        </p>
                    </div>
                </div>

                {/* Main Comparison Card */}
                <Card className="p-5 mb-6">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Return Comparison (Annualized)</h4>
                     
                     {/* Bar Chart for CAGR */}
                     <div className="h-32 mb-6">
                         <Bar 
                            data={{
                                labels: ['Nominal', 'Real (Post-Tax)'],
                                datasets: [{
                                    label: 'CAGR %',
                                    data: [roiResults.cagr, roiResults.realPostTaxCagr],
                                    backgroundColor: [roiResults.cagr >= 0 ? '#6366f1' : '#ef4444', roiResults.realPostTaxCagr >= 0 ? '#10b981' : '#f97316'],
                                    borderRadius: 4,
                                    barThickness: 40
                                }]
                            }}
                            options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
                            }}
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                         <div>
                             <p className="text-[10px] text-slate-400 uppercase font-bold">Nominal CAGR</p>
                             <p className="text-xl font-bold text-slate-900 dark:text-white">{roiResults.cagr.toFixed(2)}%</p>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] text-slate-400 uppercase font-bold">Real Post-Tax CAGR</p>
                             <p className={`text-xl font-bold ${roiResults.realPostTaxCagr >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>{roiResults.realPostTaxCagr.toFixed(2)}%</p>
                         </div>
                     </div>
                </Card>

                {/* Detailed Waterfall */}
                <Card className="p-0 overflow-hidden mb-6">
                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                         <h4 className="text-sm font-bold text-slate-700 dark:text-white">Value Breakdown</h4>
                     </div>
                     <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                         <div className="p-3 flex justify-between items-center">
                             <span className="text-slate-500">Initial Investment</span>
                             <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(roiParams.initial, currencySymbol)}</span>
                         </div>
                         <div className="p-3 flex justify-between items-center">
                             <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Nominal Gain</span>
                             <span className="font-bold text-indigo-600">+{formatCurrency(roiResults.gain, currencySymbol)}</span>
                         </div>
                         <div className="p-3 flex justify-between items-center bg-red-50/30 dark:bg-red-900/10">
                             <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Tax Impact ({roiParams.tax}%)</span>
                             <span className="font-bold text-red-500">-{formatCurrency(roiResults.taxAmount, currencySymbol)}</span>
                         </div>
                         <div className="p-3 flex justify-between items-center bg-orange-50/30 dark:bg-orange-900/10">
                             <span className="text-slate-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Inflation Loss</span>
                             <span className="font-bold text-orange-500">-{formatCurrency(roiResults.inflationLoss, currencySymbol)}</span>
                         </div>
                         <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">Real Final Value</span>
                             <span className="font-bold text-xl text-slate-900 dark:text-white">{formatCurrency(roiResults.realPostTaxFinal, currencySymbol)}</span>
                         </div>
                     </div>
                </Card>

                {/* Input Section */}
                <Card className="p-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Settings size={14}/> Configuration</h4>
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup label="Initial Amount" value={roiParams.initial} onChange={v => setRoiParams({...roiParams, initial: v})} prefix={currencySymbol} />
                            <InputGroup label="Final Amount" value={roiParams.final} onChange={v => setRoiParams({...roiParams, final: v})} prefix={currencySymbol} />
                        </div>
                        <InputGroup label="Time Period (Years)" value={roiParams.years} onChange={v => setRoiParams({...roiParams, years: v})} />
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <InputGroup label="Inflation Rate (%)" value={roiParams.inflation} onChange={v => setRoiParams({...roiParams, inflation: v})} />
                            <InputGroup label="Tax on Gains (%)" value={roiParams.tax} onChange={v => setRoiParams({...roiParams, tax: v})} />
                        </div>
                     </div>
                </Card>
            </>
        )}
    </div>
    );
};

const LoanModule = ({ results, inputs, setInputs, currencySymbol }: any) => {
    const [view, setView] = useState<'summary' | 'schedule'>('summary');

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <ModuleDescription 
            title="Loan & EMI Calculator" 
            description="Analyze loan repayment schedules. See how interest rates, tenure, and extra payments impact your total cost and debt-free date." 
        />

        {/* Toggle View */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setView('summary')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${view==='summary' ? 'bg-white dark:bg-slate-700 shadow text-red-600' : 'text-slate-500'}`}>Overview</button>
            <button onClick={() => setView('schedule')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${view==='schedule' ? 'bg-white dark:bg-slate-700 shadow text-red-600' : 'text-slate-500'}`}>Schedule</button>
        </div>

        {view === 'summary' ? (
            <>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-red-500">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Monthly EMI</p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currencySymbol}{results.emi.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                    </Card>
                    <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-orange-500">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Interest</p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currencySymbol}{results.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                    </Card>
                </div>

                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-white">Payoff Analysis</h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">
                            {results.payoffDate.toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
                        </span>
                    </div>
                    
                    <div className="h-48 relative">
                        <Bar 
                            data={{
                                labels: results.amortization.map((d:any) => `Y${d.year}`), 
                                datasets: [
                                    {label: 'Principal', data: results.amortization.map((d:any) => d.principal), backgroundColor: '#10b981', stack: 'Stack 0'},
                                    {label: 'Interest', data: results.amortization.map((d:any) => d.interest), backgroundColor: '#ef4444', stack: 'Stack 0'}
                                ]
                            }} 
                            options={{responsive: true, maintainAspectRatio: false, plugins: {legend: {position: 'bottom'}}, scales: {x: {stacked: true, grid: {display: false}}, y: {stacked: true}}}} 
                        />
                    </div>
                    {results.interestSaved > 0 && (
                        <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-center border border-emerald-100 dark:border-emerald-800">
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">You save {currencySymbol}{results.interestSaved.toLocaleString(undefined, {maximumFractionDigits:0})} in interest!</p>
                        </div>
                    )}
                </Card>

                {/* Inputs */}
                <div className="space-y-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-2">
                        {[
                            {id: 'personal', label: 'Personal', icon: CreditCard}, 
                            {id: 'home', label: 'Home', icon: Home}, 
                            {id: 'car', label: 'Auto', icon: Car}
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setInputs({...inputs, loanType: t.id, rate: t.id === 'home' ? 6.5 : t.id === 'car' ? 8.0 : 12.0, tenure: t.id === 'home' ? 20 : 5})}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-bold rounded-lg transition-all ${inputs.loanType === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                            >
                                <t.icon size={12} /> {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Loan Amount" value={inputs.amount} onChange={v => setInputs({...inputs, amount: v})} prefix={currencySymbol} />
                        <InputGroup label="Interest Rate (%)" value={inputs.rate} onChange={v => setInputs({...inputs, rate: v})} />
                        <InputGroup label="Tenure (Years)" value={inputs.tenure} onChange={v => setInputs({...inputs, tenure: v})} />
                        <InputGroup label="Extra Payment/Mo" value={inputs.extraPayment} onChange={v => setInputs({...inputs, extraPayment: v})} prefix={currencySymbol} />
                    </div>
                </div>
            </>
        ) : (
            <Card className="overflow-hidden p-0">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between text-xs font-bold text-slate-500">
                    <span className="w-12">Year</span>
                    <span className="flex-1 text-right">Interest</span>
                    <span className="flex-1 text-right">Principal</span>
                    <span className="flex-1 text-right">Balance</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
                    {results.amortization.map((row: any) => (
                        <div key={row.year} className="p-3 flex justify-between text-xs text-slate-700 dark:text-slate-300">
                            <span className="w-12 font-bold">{row.year}</span>
                            <span className="flex-1 text-right text-red-500">{formatCurrency(row.interest, currencySymbol)}</span>
                            <span className="flex-1 text-right text-emerald-600">{formatCurrency(row.principal, currencySymbol)}</span>
                            <span className="flex-1 text-right font-mono">{formatCurrency(row.balance, currencySymbol)}</span>
                        </div>
                    ))}
                </div>
            </Card>
        )}
    </div>
    );
};

const RetirementModule = ({ results, inputs, setInputs, currencySymbol }: any) => {
    const [showReal, setShowReal] = useState(false);

    const applyRiskProfile = (type: 'conservative' | 'balanced' | 'aggressive') => {
        if (type === 'conservative') setInputs({ ...inputs, preRetReturn: 6, postRetReturn: 4 });
        else if (type === 'balanced') setInputs({ ...inputs, preRetReturn: 8, postRetReturn: 5 });
        else if (type === 'aggressive') setInputs({ ...inputs, preRetReturn: 10, postRetReturn: 6 });
    };

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
        <ModuleDescription 
            title="Retirement Planner" 
            description="Assess your retirement readiness. Visualize the accumulation phase and drawdown phase to ensure your savings last your lifetime." 
        />

        {/* Status Card */}
        <Card className={`p-5 border-none text-white relative overflow-hidden ${results.runOutAge ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs text-white/80 font-bold uppercase mb-1">Outlook</p>
                        <h2 className="text-3xl font-bold">{results.runOutAge ? `Funds out at age ${Math.floor(results.runOutAge)}` : 'Fully Funded'}</h2>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg"><Activity size={24} /></div>
                </div>
                <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-white/80">Corpus at {inputs.retAge}</span>
                        <span className="font-bold text-white text-lg">
                            {currencySymbol}{(showReal ? results.realCorpus : results.corpus).toLocaleString(undefined, {maximumFractionDigits: 0, notation: 'compact'})}
                        </span>
                    </div>
                </div>
            </div>
        </Card>

        <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white">Lifetime Wealth Curve</h3>
                {/* Real/Nominal Toggle */}
                <button 
                    onClick={() => setShowReal(!showReal)} 
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors border flex items-center gap-1 ${showReal ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                    {showReal ? <ShieldCheck size={12} /> : <BarChart4 size={12} />}
                    {showReal ? 'Real (Inflation Adj.)' : 'Nominal'}
                </button>
            </div>
            
            <div className="h-56">
                <Line 
                    data={{
                        labels: results.chartData.map((d:any) => d.age),
                        datasets: [{
                            label: 'Portfolio Value',
                            data: showReal ? results.realChartData.map((d:any) => d.value) : results.chartData.map((d:any) => d.value),
                            borderColor: results.runOutAge ? '#ef4444' : '#10b981',
                            backgroundColor: results.runOutAge ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            pointRadius: 0
                        }]
                    }}
                    options={{responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {x: {grid: {display: false}}, y: {ticks: {callback: (v) => formatCurrency(v as number, currencySymbol, true)}}}}}
                />
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-slate-400 px-2">
                <span>Age {inputs.currentAge}</span>
                <span>Retire {inputs.retAge}</span>
                <span>Expectancy {inputs.lifeExpectancy}</span>
            </div>
        </Card>

        {/* Inputs Grid */}
        <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Settings size={12} /> Configuration</h4>
            
            {/* Risk Profile Selector */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex mb-2">
                <button onClick={() => applyRiskProfile('conservative')} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">Conservative</button>
                <button onClick={() => applyRiskProfile('balanced')} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">Balanced</button>
                <button onClick={() => applyRiskProfile('aggressive')} className="flex-1 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">Aggressive</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Current Age" value={inputs.currentAge} onChange={v => setInputs({...inputs, currentAge: v})} />
                <InputGroup label="Retire Age" value={inputs.retAge} onChange={v => setInputs({...inputs, retAge: v})} />
                <InputGroup label="Current Savings" value={inputs.savings} onChange={v => setInputs({...inputs, savings: v})} prefix={currencySymbol} />
                <InputGroup label="Monthly Saving" value={inputs.monthlySave} onChange={v => setInputs({...inputs, monthlySave: v})} prefix={currencySymbol} />
                <InputGroup label="Monthly Spend (Today's Value)" value={inputs.monthlySpend} onChange={v => setInputs({...inputs, monthlySpend: v})} prefix={currencySymbol} />
                <InputGroup label="Life Expectancy" value={inputs.lifeExpectancy} onChange={v => setInputs({...inputs, lifeExpectancy: v})} />
                <InputGroup label="Pre-Ret Return (%)" value={inputs.preRetReturn} onChange={v => setInputs({...inputs, preRetReturn: v})} />
                <InputGroup label="Post-Ret Return (%)" value={inputs.postRetReturn} onChange={v => setInputs({...inputs, postRetReturn: v})} />
            </div>
        </div>
    </div>
    );
};

const InputGroup = ({ label, value, onChange, prefix }: { label: string, value: number, onChange: (v: number) => void, prefix?: string }) => (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 transition-colors">
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{prefix}</span>}
            <input 
                type="number" 
                value={value || ''} 
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className={`w-full bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white ${prefix ? 'pl-4' : ''}`}
                onFocus={(e) => e.target.select()}
            />
        </div>
    </div>
);

const formatCurrency = (val: number, symbol: string, compact: boolean = false) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: compact ? 'compact' : 'standard'
    }).format(val).replace('$', symbol);
}

// Additional Icon for Chart Toggle
const BarChart4 = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 3v18h18"/><path d="M13 17V9"/><path d="M18 17V5"/><path d="M8 17v-3"/></svg>
);
