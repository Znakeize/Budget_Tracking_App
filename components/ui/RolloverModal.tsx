import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface RolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  calculatedRollover: number;
  currencySymbol: string;
}

export const RolloverModal: React.FC<RolloverModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  calculatedRollover,
  currencySymbol
}) => {
  const [amount, setAmount] = useState(calculatedRollover);

  useEffect(() => {
    if (isOpen) {
        setAmount(calculatedRollover);
    }
  }, [calculatedRollover, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-white mb-2">New Period Rollover</h3>
        <p className="text-sm text-slate-400 mb-6">
          Review the amount being carried over to the new period. You can adjust this if needed.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Rollover Amount</label>
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-400">{currencySymbol}</span>
                <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="bg-transparent text-2xl font-bold text-white w-full outline-none placeholder-slate-600"
                    placeholder="0.00"
                    autoFocus
                />
            </div>
            {amount !== calculatedRollover && (
                <p className="text-[10px] text-orange-400 mt-2">
                    Original calculated amount: {currencySymbol}{calculatedRollover.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onClose}
                className="py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => onConfirm(amount)}
                className="py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
                Start Period
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};