import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { GoalItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface GoalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goal: GoalItem | null;
  currencySymbol: string;
}

export const GoalActionModal: React.FC<GoalActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  goal,
  currencySymbol
}) => {
  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-3">
                <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Record Goal Progress</h3>
            <p className="text-sm text-slate-400 mt-1">
                Marking <span className="text-white font-medium">"{goal.name}"</span> as complete for this period will add the monthly amount to your savings.
            </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Current Balance</span>
                <span className="text-sm font-bold text-white">{formatCurrency(goal.current, currencySymbol)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Target Goal</span>
                <span className="text-sm font-bold text-white">{formatCurrency(goal.target, currencySymbol)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-blue-400 uppercase font-semibold">Monthly Contribution</span>
                <span className="text-sm font-bold text-blue-400">+{formatCurrency(goal.monthly, currencySymbol)}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onClose}
                className="py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm}
                className="py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
                Confirm
            </button>
        </div>
      </div>
    </div>
  );
};