
import React, { useState, useMemo } from 'react';
import { BudgetData, InvestmentItem, InvestmentGoal, InvestmentTransaction } from '../types';
import { Card } from '../components/ui/Card';
import { formatCurrency, generateId } from '../utils/calculations';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  BarElement
} from 'chart.js';
import { 
    TrendingUp, ChevronLeft, PieChart, Layers, DollarSign, 
    ArrowUpRight, ArrowDownRight, Briefcase, User, Target, 
    BellRing, Plus, Sparkles, Building2, Wallet, FileText, 
    Activity, ArrowRight, LayoutGrid, Zap, CheckCircle, X
} from 'lucide-react';
import { HeaderProfile } from '../components/ui/HeaderProfile';
import { GoogleGenAI } from "@google/genai";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface InvestmentAnalysisViewProps {
  history: BudgetData[];
  currencySymbol: string;
  onBack: () => void;
  onProfileClick: () => void;
  onUpdateData: (data: BudgetData) => void;
  investmentGoals: InvestmentGoal[];
  onUpdateGoals: (goals: InvestmentGoal[]) => void;
}

export const InvestmentAnalysisView: React.FC<InvestmentAnalysisViewProps> = ({ 
    history, 
    currencySymbol, 
    onBack, 
    onProfileClick,
    onUpdateData,
    investmentGoals,
    onUpdateGoals
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'personal' | 'business' | 'insights' | 'goals'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentItem | null>(null);

  // Get current data
  const currentData = history[history.length - 1];
  const investments = currentData.investments;

  // --- Derived Metrics ---
  const metrics = useMemo(() => {
      const personalAssets = investments.filter(i => i.type === 'personal');
      const businessAssets = investments.filter(i => i.type === 'business');

      const personalTotal = personalAssets.reduce((sum, i) => sum + i.amount, 0);
      const businessTotal = businessAssets.reduce((sum, i) => sum + i.amount, 0);
      const totalValue = personalTotal + businessTotal;

      const personalInitial = personalAssets.reduce((sum, i) => sum + (i.initialValue || 0), 0);
      const businessInitial = businessAssets.reduce((sum, i) => sum + (i.initialValue || 0), 0);
      const totalProfit = totalValue - (personalInitial + businessInitial);
      const profitPercent = (personalInitial + businessInitial) > 0 ? (totalProfit / (personalInitial + businessInitial)) * 100 : 0;

      const monthlyCashFlow = businessAssets.reduce((sum, i) => sum + (i.monthlyCashFlow || 0), 0);

      return {
          personalTotal, businessTotal, totalValue, totalProfit, profitPercent, monthlyCashFlow,
          personalAssets, businessAssets
      };
  }, [investments]);

  // --- Handlers ---
  const handleAddInvestment = (newItem: InvestmentItem) => {
      const updatedInvestments = [...investments, { ...newItem, id: generateId() }];
      onUpdateData({ ...currentData, investments: updatedInvestments });
      setIsAddModalOpen(false);
  };

  const handleUpdateInvestment = (updatedItem: InvestmentItem) => {
      const updatedInvestments = investments.map(i => i.id === updatedItem.id ? updatedItem : i);
      onUpdateData({ ...currentData, investments: updatedInvestments });
      setSelectedAsset(null);
  };

  const handleAddTransaction = (assetId: string, transaction: InvestmentTransaction) => {
      const asset = investments.find(i => i.id === assetId);
      if (!asset) return;

      let newAmount = asset.amount;
      // Simple logic: buy/deposit increases value, sell/withdraw decreases
      // In real app, this would be more complex based on price * qty for stocks
      if (['buy', 'deposit', 'income'].includes(transaction.type)) {
          newAmount += transaction.amount;
      } else if (['sell', 'withdraw', 'expense'].includes(transaction.type)) {
          newAmount -= transaction.amount;
      }

      const updatedAsset = {
          ...asset,
          amount: newAmount,
          transactions: [transaction, ...(asset.transactions || [])]
      };
      handleUpdateInvestment(updatedAsset);
  };

  // --- Render Tabs ---

  const renderDashboard = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none">
                  <div className="flex items-center gap-2 opacity-80 mb-1">
                      <DollarSign size={14} />
                      <span className="text-xs font-bold uppercase">Total Portfolio</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue, currencySymbol)}</div>
                  <div className="mt-2 text-xs flex items-center gap-1 bg-white/20 w-fit px-2 py-0.5 rounded-full">
                      {metrics.profitPercent >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {metrics.profitPercent.toFixed(1)}% All time
                  </div>
              </Card>
              <div className="space-y-3">
                  <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)] border-l-4 border-l-emerald-500">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Profit/Loss</span>
                      <div className={`font-bold ${metrics.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {metrics.totalProfit >= 0 ? '+' : ''}{formatCurrency(metrics.totalProfit, currencySymbol)}
                      </div>
                  </Card>
                  <Card className="p-3 flex flex-col justify-center h-[calc(50%-6px)] border-l-4 border-l-amber-500">
                      <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Monthly Cash Flow</span>
                      <div className="font-bold text-amber-600">
                          +{formatCurrency(metrics.monthlyCashFlow, currencySymbol)}/mo
                      </div>
                  </Card>
              </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform whitespace-nowrap">
                  <Plus size={14} /> Add Investment
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform whitespace-nowrap">
                  <ArrowRight size={14} /> Record Transaction
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform whitespace-nowrap">
                  <BellRing size={14} /> Set Alert
              </button>
          </div>

          {/* Allocation Chart */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                  <PieChart size={16} className="text-indigo-500" /> Asset Allocation
              </h3>
              <div className="h-48 relative">
                  <Doughnut 
                      data={{
                          labels: ['Personal', 'Business'],
                          datasets: [{
                              data: [metrics.personalTotal, metrics.businessTotal],
                              backgroundColor: ['#8b5cf6', '#f59e0b'],
                              borderWidth: 0
                          }]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }, cutout: '70%' }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Mix</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{Math.round((metrics.personalTotal / metrics.totalValue)*100)}% / {Math.round((metrics.businessTotal / metrics.totalValue)*100)}%</span>
                  </div>
              </div>
          </Card>
      </div>
  );

  const renderAssetList = (type: 'personal' | 'business') => {
      const assets = type === 'personal' ? metrics.personalAssets : metrics.businessAssets;
      return (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2">
              {assets.map(asset => {
                  const gain = asset.amount - (asset.initialValue || 0);
                  const gainPct = (asset.initialValue || 0) > 0 ? (gain / (asset.initialValue || 0)) * 100 : 0;
                  return (
                      <Card key={asset.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]" onClick={() => setSelectedAsset(asset)}>
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'personal' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                  {type === 'personal' ? <User size={20} /> : <Building2 size={20} />}
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{asset.name}</h4>
                                  <p className="text-[10px] text-slate-500">{asset.category} {asset.symbol ? `• ${asset.symbol}` : ''}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(asset.amount, currencySymbol)}</div>
                              <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}% ({formatCurrency(gain, currencySymbol)})
                              </div>
                          </div>
                      </Card>
                  );
              })}
              {assets.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                      <p>No {type} investments found.</p>
                      <button onClick={() => setIsAddModalOpen(true)} className="mt-2 text-indigo-500 font-bold text-xs">Add First Investment</button>
                  </div>
              )}
          </div>
      );
  };

  const renderInsights = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          {/* AI Insight Card */}
          <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 border border-indigo-500/20">
              <div className="flex gap-3">
                  <Sparkles className="text-indigo-500 shrink-0 mt-1" size={18} />
                  <div>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">AI Portfolio Insight</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                          "Your Personal portfolio has outperformed Business assets by 12% this quarter due to the crypto surge. Consider rebalancing into stable real estate to lock in gains."
                      </p>
                  </div>
              </div>
          </Card>

          {/* Performance Comparison */}
          <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Performance Comparison</h3>
              <div className="h-48">
                  <Bar 
                      data={{
                          labels: ['Total Value', 'Net Profit', 'ROI %'],
                          datasets: [
                              {
                                  label: 'Personal',
                                  data: [metrics.personalTotal, metrics.personalTotal - metrics.personalAssets.reduce((s,i)=>s+(i.initialValue||0),0), metrics.personalAssets.length > 0 ? 15 : 0], // Mock ROI for chart
                                  backgroundColor: '#8b5cf6',
                                  borderRadius: 4
                              },
                              {
                                  label: 'Business',
                                  data: [metrics.businessTotal, metrics.businessTotal - metrics.businessAssets.reduce((s,i)=>s+(i.initialValue||0),0), metrics.businessAssets.length > 0 ? 12 : 0], // Mock ROI
                                  backgroundColor: '#f59e0b',
                                  borderRadius: 4
                              }
                          ]
                      }}
                      options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { display: false }, x: { grid: { display: false } } } }}
                  />
              </div>
          </Card>
      </div>
  );

  const renderGoals = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
          <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Goals</h3>
              <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400">+ New Goal</button>
          </div>
          {investmentGoals.map(goal => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                  <Card key={goal.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">{goal.name}</h4>
                              <p className="text-xs text-slate-500">Target: {new Date(goal.deadline).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</div>
                          </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>{formatCurrency(goal.currentAmount, currencySymbol)}</span>
                          <span>{formatCurrency(goal.targetAmount, currencySymbol)}</span>
                      </div>
                  </Card>
              );
          })}

          <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Active Alerts</h3>
              <Card className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-3 flex items-center gap-3">
                      <BellRing size={16} className="text-orange-500" />
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">TSLA Price Alert</div>
                          <div className="text-[10px] text-slate-500">Notify if price drops below $180</div>
                      </div>
                      <div className="h-4 w-8 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                  </div>
                  <div className="p-3 flex items-center gap-3">
                      <BellRing size={16} className="text-blue-500" />
                      <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Dividend Reminder</div>
                          <div className="text-[10px] text-slate-500">Monthly payout notification</div>
                      </div>
                      <div className="h-4 w-8 bg-emerald-500 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div></div>
                  </div>
              </Card>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full relative">
       {/* Header */}
       <div className="flex-none pt-6 px-4 pb-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Wealth</h2>
                        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Investments</h1>
                    </div>
                </div>
                <div className="pb-1">
                    <HeaderProfile onClick={onProfileClick} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0">
                {[
                    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
                    { id: 'personal', label: 'Personal', icon: User },
                    { id: 'business', label: 'Business', icon: Building2 },
                    { id: 'insights', label: 'Insights', icon: Activity },
                    { id: 'goals', label: 'Goals', icon: Target },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold border-b-2 transition-colors ${
                            activeTab === tab.id 
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>
       </div>

       <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
           {activeTab === 'dashboard' && renderDashboard()}
           {activeTab === 'personal' && renderAssetList('personal')}
           {activeTab === 'business' && renderAssetList('business')}
           {activeTab === 'insights' && renderInsights()}
           {activeTab === 'goals' && renderGoals()}
       </div>

       {/* Add Investment Modal */}
       {isAddModalOpen && (
           <AddInvestmentModal 
               isOpen={isAddModalOpen} 
               onClose={() => setIsAddModalOpen(false)} 
               onConfirm={handleAddInvestment}
               currencySymbol={currencySymbol}
           />
       )}

       {/* Asset Detail Modal */}
       {selectedAsset && (
           <AssetDetailModal 
               isOpen={!!selectedAsset}
               onClose={() => setSelectedAsset(null)}
               asset={selectedAsset}
               onUpdate={handleUpdateInvestment}
               onAddTransaction={handleAddTransaction}
               currencySymbol={currencySymbol}
           />
       )}
    </div>
  );
};

// --- Modals ---

const AddInvestmentModal = ({ isOpen, onClose, onConfirm, currencySymbol }: any) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'personal' | 'business'>('personal');
    const [category, setCategory] = useState('Stocks');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm({
            name,
            amount: parseFloat(amount) || 0,
            initialValue: parseFloat(amount) || 0, // Assume new
            type,
            category
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Asset</h3>
                <div className="space-y-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setType('personal')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'personal' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}>Personal</button>
                        <button onClick={() => setType('business')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${type === 'business' ? 'bg-white dark:bg-slate-700 shadow text-amber-600' : 'text-slate-500'}`}>Business</button>
                    </div>
                    <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" placeholder="Asset Name" value={name} onChange={e => setName(e.target.value)} />
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-500 font-bold">{currencySymbol}</span>
                        <input className="w-full p-3 pl-8 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none font-bold" type="number" placeholder="Current Value" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                        {type === 'personal' ? (
                            <>
                                <option>Stocks</option><option>Crypto</option><option>RealEstate</option><option>Savings</option><option>Other</option>
                            </>
                        ) : (
                            <>
                                <option>BusinessProject</option><option>Equipment</option><option>RealEstate</option><option>Equity</option>
                            </>
                        )}
                    </select>
                    <button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl mt-2">Add Asset</button>
                </div>
            </div>
        </div>
    );
};

const AssetDetailModal = ({ isOpen, onClose, asset, onUpdate, onAddTransaction, currencySymbol }: any) => {
    const [tab, setTab] = useState<'overview' | 'history' | 'docs'>('overview');
    const [txAmount, setTxAmount] = useState('');
    const [txType, setTxType] = useState('buy');

    if (!isOpen || !asset) return null;

    const handleTransaction = () => {
        onAddTransaction(asset.id, {
            id: generateId(),
            date: new Date().toISOString().split('T')[0],
            type: txType,
            amount: parseFloat(txAmount) || 0
        });
        setTxAmount('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{asset.name}</h3>
                        <p className="text-xs text-slate-500">{asset.category}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400"><X size={20}/></button>
                </div>

                <div className="flex gap-2 mb-4">
                    {['overview', 'history', 'docs'].map(t => (
                        <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-1.5 text-xs font-bold border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Current Value</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(asset.amount, currencySymbol)}</p>
                            <p className={`text-xs font-bold mt-1 ${asset.amount >= (asset.initialValue || 0) ? 'text-emerald-500' : 'text-red-500'}`}>
                                {asset.amount >= (asset.initialValue || 0) ? '+' : ''}{formatCurrency(asset.amount - (asset.initialValue || 0), currencySymbol)} Gain
                            </p>
                        </div>
                        {asset.type === 'business' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 border rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">ROI</p>
                                    <p className="text-lg font-bold text-emerald-600">{asset.roi || 0}%</p>
                                </div>
                                <div className="p-3 border rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Cash Flow</p>
                                    <p className="text-lg font-bold text-amber-600">{formatCurrency(asset.monthlyCashFlow || 0, currencySymbol)}/mo</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Quick Transaction</h4>
                            <div className="flex gap-2 mb-2">
                                <select className="bg-slate-100 dark:bg-slate-800 text-xs font-bold p-2 rounded-lg outline-none" value={txType} onChange={e => setTxType(e.target.value)}>
                                    <option value="buy">Buy / Deposit</option>
                                    <option value="sell">Sell / Withdraw</option>
                                    {asset.type === 'business' && <option value="income">Income</option>}
                                    {asset.type === 'business' && <option value="expense">Expense</option>}
                                </select>
                                <input type="number" placeholder="Amount" className="flex-1 bg-slate-100 dark:bg-slate-800 text-xs p-2 rounded-lg outline-none" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                            </div>
                            <button onClick={handleTransaction} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg">Confirm</button>
                        </div>
                    </div>
                )}

                {tab === 'history' && (
                    <div className="space-y-2">
                        {asset.transactions?.map((tx: any) => (
                            <div key={tx.id} className="flex justify-between items-center p-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                                <div>
                                    <div className="font-bold capitalize text-slate-700 dark:text-slate-300">{tx.type}</div>
                                    <div className="text-slate-400 text-[10px]">{tx.date}</div>
                                </div>
                                <div className={`font-bold ${['buy', 'deposit', 'income'].includes(tx.type) ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {['buy', 'deposit', 'income'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount, currencySymbol)}
                                </div>
                            </div>
                        ))}
                        {(!asset.transactions || asset.transactions.length === 0) && <p className="text-center text-slate-400 text-xs py-4">No transactions yet.</p>}
                    </div>
                )}

                {tab === 'docs' && (
                    <div className="text-center py-8">
                        <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">No documents attached.</p>
                        <button className="mt-2 text-indigo-500 font-bold text-xs">+ Upload File</button>
                    </div>
                )}
            </div>
        </div>
    );
};
