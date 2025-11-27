
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Calculator, TrendingUp, DollarSign, 
  Landmark, PieChart, RefreshCcw, Percent, BarChart3,
  ArrowRight, Download, Table as TableIcon, Activity, Zap, Crown
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

interface AdvancedCalculatorsViewProps {
  onBack: () => void;
  currencySymbol: string;
  onProfileClick: () => void;
}

type ModuleType = 'investment' | 'loan' | 'retirement' | 'tax';

export const AdvancedCalculatorsView: React.FC<AdvancedCalculatorsViewProps> = ({ onBack, currencySymbol, onProfileClick }) => {
  const [activeModule, setActiveModule] = useState<ModuleType>('investment');
  const [showTable, setShowTable] = useState(false);

  // --- Inputs State ---
  const [invInputs, setInvInputs] = useState({ principal: 5000, monthly: 500, rate: 8, years: 10, inflation: 2 });
  const [loanInputs, setLoanInputs] = useState({ amount: 50000, rate: 5.5, tenure: 5 }); // Tenure in years
  const [retInputs, setRetInputs] = useState({ currentAge: 30, retAge: 65, savings: 20000, monthlySave: 1000, monthlySpend: 3000, inflation: 3 });
  const [taxInputs, setTaxInputs] = useState({ income: 60000, deductions: 12000, rate: 20 });

  // --- Scenarios (Advanced Feature) ---
  const [scenarioAdj, setScenarioAdj] = useState(0); // Generic adjustment slider (-50% to +50%)

  // --- Calculations ---

  // 1. Investment Calc
  const investmentResults = useMemo(() => {
      const dataPoints = [];
      const labels = [];
      let totalInvested = invInputs.principal;
      let totalValue = invInputs.principal;
      
      // Scenario adjustment applies to monthly contribution
      const adjustedMonthly = invInputs.monthly * (1 + scenarioAdj/100);

      for(let y = 0; y <= invInputs.years; y++) {
          labels.push(`Year ${y}`);
          if (y > 0) {
              for(let m=0; m<12; m++) {
                  totalValue = (totalValue + adjustedMonthly) * (1 + invInputs.rate/100/12);
                  totalInvested += adjustedMonthly;
              }
          }
          dataPoints.push({ year: y, invested: totalInvested, value: totalValue });
      }
      return { 
          totalValue, 
          totalInvested, 
          profit: totalValue - totalInvested, 
          dataPoints 
      };
  }, [invInputs, scenarioAdj]);

  // 2. Loan Calc
  const loanResults = useMemo(() => {
      const r = loanInputs.rate / 100 / 12;
      const n = loanInputs.tenure * 12;
      // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
      const emi = (loanInputs.amount * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      const totalPayment = emi * n;
      const totalInterest = totalPayment - loanInputs.amount;
      
      // Amortization for Chart
      const amortization = [];
      let balance = loanInputs.amount;
      for(let y=0; y<=loanInputs.tenure; y++) {
          amortization.push(balance);
          balance -= (loanInputs.amount / loanInputs.tenure); // Simplified linear drop for chart visualization
          if(balance < 0) balance = 0;
      }

      return { emi, totalPayment, totalInterest, amortization };
  }, [loanInputs]);

  // 3. Retirement Calc
  const retResults = useMemo(() => {
      const yearsToGrow = retInputs.retAge - retInputs.currentAge;
      const r = 0.07; // Assumed 7% return
      const monthlyr = r / 12;
      const months = yearsToGrow * 12;
      
      // FV of current savings
      const fvPrincipal = retInputs.savings * Math.pow(1 + monthlyr, months);
      // FV of contributions
      const fvContrib = retInputs.monthlySave * (Math.pow(1 + monthlyr, months) - 1) / monthlyr;
      const corpus = fvPrincipal + fvContrib;
      
      // Required Corpus (25x rule adjusted for inflation)
      const inflationFactor = Math.pow(1 + retInputs.inflation/100, yearsToGrow);
      const futureMonthlySpend = retInputs.monthlySpend * inflationFactor;
      const requiredCorpus = futureMonthlySpend * 12 * 25;

      return { corpus, requiredCorpus, gap: requiredCorpus - corpus, futureMonthlySpend };
  }, [retInputs]);

  // --- Export ---
  const handleExportPDF = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Financial Calculation Report", 20, 20);
      doc.setFontSize(12);
      
      if (activeModule === 'investment') {
          doc.text(`Investment Projection (${invInputs.years} Years)`, 20, 40);
          doc.text(`Future Value: ${currencySymbol}${investmentResults.totalValue.toFixed(2)}`, 20, 50);
          doc.text(`Total Invested: ${currencySymbol}${investmentResults.totalInvested.toFixed(2)}`, 20, 60);
          doc.text(`Total Profit: ${currencySymbol}${investmentResults.profit.toFixed(2)}`, 20, 70);
      } else if (activeModule === 'loan') {
          doc.text(`Loan EMI Schedule`, 20, 40);
          doc.text(`Monthly EMI: ${currencySymbol}${loanResults.emi.toFixed(2)}`, 20, 50);
          doc.text(`Total Interest: ${currencySymbol}${loanResults.totalInterest.toFixed(2)}`, 20, 60);
      }
      // ... Add other modules as needed
      
      doc.save("financial_report.pdf");
  };

  const handleExportExcel = () => {
      const wb = XLSX.utils.book_new();
      let data: any[] = [];
      
      if (activeModule === 'investment') {
          data = investmentResults.dataPoints.map(d => ({
              Year: d.year,
              Invested: d.invested,
              Value: d.value
          }));
      }
      // Add other logic
      
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Calculation");
      XLSX.writeFile(wb, "financial_calc.xlsx");
  };

  // --- Renders ---

  const renderInvestment = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <Card className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-xs text-indigo-200 font-bold uppercase mb-1">Projected Future Value</p>
                      <h2 className="text-3xl font-bold">{currencySymbol}{investmentResults.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp size={24} />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                      <p className="text-[10px] text-indigo-200 font-bold uppercase">Total Invested</p>
                      <p className="font-bold">{currencySymbol}{investmentResults.totalInvested.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] text-indigo-200 font-bold uppercase">Total Profit</p>
                      <p className="font-bold text-emerald-300">+{currencySymbol}{investmentResults.profit.toLocaleString()}</p>
                  </div>
              </div>
          </Card>

          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Growth Visualization</h3>
              <div className="h-56">
                  <Line 
                      data={{
                          labels: investmentResults.dataPoints.map(d => d.year),
                          datasets: [
                              {
                                  label: 'Total Value',
                                  data: investmentResults.dataPoints.map(d => d.value),
                                  borderColor: '#8b5cf6',
                                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                  fill: true,
                                  tension: 0.4
                              },
                              {
                                  label: 'Invested Amount',
                                  data: investmentResults.dataPoints.map(d => d.invested),
                                  borderColor: '#94a3b8',
                                  borderDash: [5, 5],
                                  tension: 0.4,
                                  pointRadius: 0
                              }
                          ]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }}
                  />
              </div>
          </Card>

          {/* Configuration Inputs */}
          <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Principal Amount" value={invInputs.principal} onChange={v => setInvInputs({...invInputs, principal: v})} prefix={currencySymbol} />
              <InputGroup label="Monthly Contribution" value={invInputs.monthly} onChange={v => setInvInputs({...invInputs, monthly: v})} prefix={currencySymbol} />
              <InputGroup label="Annual Return (%)" value={invInputs.rate} onChange={v => setInvInputs({...invInputs, rate: v})} />
              <InputGroup label="Time Period (Years)" value={invInputs.years} onChange={v => setInvInputs({...invInputs, years: v})} />
          </div>

          {/* Advanced Scenario */}
          <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" /> Scenario Simulation
                  </h4>
                  <span className="text-xs font-bold text-amber-600">{scenarioAdj > 0 ? '+' : ''}{scenarioAdj}% Contribution</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Adjust your monthly investment to see impact.</p>
              <input 
                  type="range" min="-50" max="50" step="5" 
                  value={scenarioAdj} onChange={e => setScenarioAdj(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
          </Card>
      </div>
  );

  const renderLoan = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-red-500">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Monthly EMI</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currencySymbol}{loanResults.emi.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
              </Card>
              <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-l-orange-500">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Interest</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currencySymbol}{loanResults.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
              </Card>
          </div>

          <Card className="p-4 flex items-center gap-6">
              <div className="w-32 h-32 relative">
                  <Doughnut 
                      data={{
                          labels: ['Principal', 'Interest'],
                          datasets: [{
                              data: [loanInputs.amount, loanResults.totalInterest],
                              backgroundColor: ['#10b981', '#ef4444'],
                              borderWidth: 0
                          }]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '70%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-slate-400">Total</div>
              </div>
              <div className="flex-1 space-y-3">
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700 dark:text-slate-300">Principal</span> <span className="text-emerald-600">{((loanInputs.amount / (loanInputs.amount+loanResults.totalInterest))*100).toFixed(0)}%</span></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${(loanInputs.amount / (loanInputs.amount+loanResults.totalInterest))*100}%`}}></div></div>
                  </div>
                  <div>
                      <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-700 dark:text-slate-300">Interest</span> <span className="text-red-500">{((loanResults.totalInterest / (loanInputs.amount+loanResults.totalInterest))*100).toFixed(0)}%</span></div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${(loanResults.totalInterest / (loanInputs.amount+loanResults.totalInterest))*100}%`}}></div></div>
                  </div>
              </div>
          </Card>

          <div className="space-y-3">
              <InputGroup label="Loan Amount" value={loanInputs.amount} onChange={v => setLoanInputs({...loanInputs, amount: v})} prefix={currencySymbol} />
              <InputGroup label="Interest Rate (%)" value={loanInputs.rate} onChange={v => setLoanInputs({...loanInputs, rate: v})} />
              <InputGroup label="Tenure (Years)" value={loanInputs.tenure} onChange={v => setLoanInputs({...loanInputs, tenure: v})} />
          </div>
      </div>
  );

  const renderRetirement = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <Card className={`p-5 border-none text-white ${retResults.gap > 0 ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <p className="text-xs text-white/80 font-bold uppercase mb-1">Projected Corpus</p>
                      <h2 className="text-3xl font-bold">{currencySymbol}{retResults.corpus.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg"><Activity size={24} /></div>
              </div>
              <div className="pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-white/80">Goal Gap</span>
                      <span className="font-bold text-white text-lg">{retResults.gap > 0 ? `Short by ${currencySymbol}${retResults.gap.toLocaleString(undefined, {maximumFractionDigits:0})}` : 'Goal Met!'}</span>
                  </div>
              </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Current Age" value={retInputs.currentAge} onChange={v => setRetInputs({...retInputs, currentAge: v})} />
              <InputGroup label="Retirement Age" value={retInputs.retAge} onChange={v => setRetInputs({...retInputs, retAge: v})} />
              <InputGroup label="Current Savings" value={retInputs.savings} onChange={v => setRetInputs({...retInputs, savings: v})} prefix={currencySymbol} />
              <InputGroup label="Monthly Savings" value={retInputs.monthlySave} onChange={v => setRetInputs({...retInputs, monthlySave: v})} prefix={currencySymbol} />
          </div>

          <Card className="p-4 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-2">Future Expense Projection</h3>
              <p className="text-xs text-slate-500 mb-3">
                  To maintain your current lifestyle, you will need <strong>{currencySymbol}{retResults.futureMonthlySpend.toLocaleString(undefined, {maximumFractionDigits:0})} / month</strong> in retirement due to inflation.
              </p>
              <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Inflation:</span>
                  <input 
                      type="range" min="0" max="10" step="0.5" 
                      value={retInputs.inflation} onChange={e => setRetInputs({...retInputs, inflation: parseFloat(e.target.value)})}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-600">{retInputs.inflation}%</span>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-0.5">Tools</h2>
                        <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Calculators</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Module Navigation */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0 -mx-4 px-4">
                {[
                    { id: 'investment', label: 'Invest', icon: TrendingUp },
                    { id: 'loan', label: 'Loan', icon: Landmark },
                    { id: 'retirement', label: 'Retire', icon: RefreshCcw },
                    { id: 'tax', label: 'Tax', icon: Percent },
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setActiveModule(m.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[70px] py-2 text-[10px] font-bold border-b-2 transition-colors ${
                            activeModule === m.id 
                            ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <m.icon size={18} /> {m.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeModule === 'investment' && renderInvestment()}
           {activeModule === 'loan' && renderLoan()}
           {activeModule === 'retirement' && renderRetirement()}
           {activeModule === 'tax' && (
               <div className="text-center py-20 text-slate-400">
                   <Percent size={48} className="mx-auto mb-4 opacity-50" />
                   <p className="text-sm">Tax Calculator Coming Soon</p>
               </div>
           )}

           {/* Export Actions */}
           <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 z-30 pb-safe-bottom">
               <button onClick={handleExportPDF} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                   <Download size={18} /> PDF Report
               </button>
               <button onClick={handleExportExcel} className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                   <TableIcon size={18} /> Export Excel
               </button>
           </div>
           <div className="h-20"></div> {/* Spacer */}
       </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, prefix }: { label: string, value: number, onChange: (v: number) => void, prefix?: string }) => (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{prefix}</span>}
            <input 
                type="number" 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className={`w-full bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white ${prefix ? 'pl-4' : ''}`}
            />
        </div>
    </div>
);
