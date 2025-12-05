
import React from 'react';
import { Card } from '../ui/Card';
import { BellRing, PieChart, Activity, FileText, TrendingDown, RefreshCcw } from 'lucide-react';

interface AnalysisToolsTabProps {
    alertSettings: {
        thresholds: boolean;
        unusual: boolean;
        bills: boolean;
        balance: boolean;
        subs: boolean;
    };
    onToggleAlert: (key: string) => void;
}

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

export const AnalysisToolsTab: React.FC<AnalysisToolsTabProps> = ({ alertSettings, onToggleAlert }) => {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <Card className="p-5 bg-slate-900 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-full ring-1 ring-indigo-500/30">
                      <BellRing size={24} />
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-white">Intelligent Alerts</h3>
                      <p className="text-xs text-slate-400">Configure how AI notifies you about your finances.</p>
                  </div>
              </div>

              <div className="space-y-6">
                  {/* Item 1: Budget Thresholds */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 max-w-[80%]">
                          <PieChart size={18} className="text-slate-400 mt-0.5" />
                          <div>
                              <h4 className="text-sm font-bold text-white">Budget Thresholds</h4>
                              <p className="text-xs text-slate-400 leading-snug">Get notified when you hit 80% and 100% of category limits.</p>
                          </div>
                      </div>
                      <Toggle checked={alertSettings.thresholds} onChange={() => onToggleAlert('thresholds')} />
                  </div>

                  {/* Item 2: Unusual Spending */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 max-w-[80%]">
                          <Activity size={18} className="text-slate-400 mt-0.5" />
                          <div>
                              <h4 className="text-sm font-bold text-white">Unusual Spending</h4>
                              <p className="text-xs text-slate-400 leading-snug">Detect anomalies or double charges instantly.</p>
                          </div>
                      </div>
                      <Toggle checked={alertSettings.unusual} onChange={() => onToggleAlert('unusual')} />
                  </div>

                  {/* Item 3: Bill Reminders */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 max-w-[80%]">
                          <FileText size={18} className="text-slate-400 mt-0.5" />
                          <div>
                              <h4 className="text-sm font-bold text-white">Bill Reminders</h4>
                              <p className="text-xs text-slate-400 leading-snug">Receive alerts 3 days before recurring bills are due.</p>
                          </div>
                      </div>
                      <Toggle checked={alertSettings.bills} onChange={() => onToggleAlert('bills')} />
                  </div>

                  {/* Item 4: Low Balance Forecast */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 max-w-[80%]">
                          <TrendingDown size={18} className="text-slate-400 mt-0.5" />
                          <div>
                              <h4 className="text-sm font-bold text-white">Low Balance Forecast</h4>
                              <p className="text-xs text-slate-400 leading-snug">Predicts potential overdrafts based on spending trends.</p>
                          </div>
                      </div>
                      <Toggle checked={alertSettings.balance} onChange={() => onToggleAlert('balance')} />
                  </div>

                  {/* Item 5: Subscription Monitor */}
                  <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 max-w-[80%]">
                          <RefreshCcw size={18} className="text-slate-400 mt-0.5" />
                          <div>
                              <h4 className="text-sm font-bold text-white">Subscription Monitor</h4>
                              <p className="text-xs text-slate-400 leading-snug">Alert on price hikes for existing subscriptions.</p>
                          </div>
                      </div>
                      <Toggle checked={alertSettings.subs} onChange={() => onToggleAlert('subs')} />
                  </div>
              </div>
          </Card>
      </div>
    );
};
