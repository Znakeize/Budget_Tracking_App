
import React, { useState, useEffect } from 'react';
import { X, Delete, Divide, Plus, Minus, Equal } from 'lucide-react';

interface SimpleCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleCalculator: React.FC<SimpleCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleNumber = (num: string) => {
    if (display === '0' || isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    try {
      // Safe evaluation of basic math
      const fullEquation = equation + display;
      // Replace visual operators with JS operators if needed, though usually they match (+, -, *, /)
      // We use a simple function to avoid eval's risks, though for a calc strictly controlled by buttons eval is often acceptable
      // For safety, let's use a basic parser logic or Function constructor which is safer than eval but still flexible
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + fullEquation.replace(/×/g, '*').replace(/÷/g, '/'))();
      
      // Format result to avoid long decimals
      const formattedResult = String(Math.round(result * 100) / 100);
      
      setDisplay(formattedResult);
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setIsNewNumber(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header / Display */}
        <div className="bg-slate-100 dark:bg-slate-800 p-4 pb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calculator</h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="text-right">
            <div className="h-6 text-xs text-slate-400 font-medium mb-1">{equation}</div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {display}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-4 gap-3">
          <CalcButton label="C" onClick={handleClear} variant="secondary" />
          <CalcButton label="÷" onClick={() => handleOperator('/')} variant="operator" icon={<span className="text-xl">÷</span>} />
          <CalcButton label="×" onClick={() => handleOperator('*')} variant="operator" icon={<span className="text-xl">×</span>} />
          <CalcButton label={<Delete size={20} />} onClick={handleDelete} variant="secondary" />

          <CalcButton label="7" onClick={() => handleNumber('7')} />
          <CalcButton label="8" onClick={() => handleNumber('8')} />
          <CalcButton label="9" onClick={() => handleNumber('9')} />
          <CalcButton label="-" onClick={() => handleOperator('-')} variant="operator" icon={<Minus size={20} />} />

          <CalcButton label="4" onClick={() => handleNumber('4')} />
          <CalcButton label="5" onClick={() => handleNumber('5')} />
          <CalcButton label="6" onClick={() => handleNumber('6')} />
          <CalcButton label="+" onClick={() => handleOperator('+')} variant="operator" icon={<Plus size={20} />} />

          <CalcButton label="1" onClick={() => handleNumber('1')} />
          <CalcButton label="2" onClick={() => handleNumber('2')} />
          <CalcButton label="3" onClick={() => handleNumber('3')} />
          <CalcButton label="=" onClick={handleEqual} variant="primary" className="row-span-2 h-full" icon={<Equal size={24} />} />

          <CalcButton label="0" onClick={() => handleNumber('0')} className="col-span-2" />
          <CalcButton label="." onClick={handleDecimal} />
        </div>
      </div>
    </div>
  );
};

interface CalcButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'operator' | 'primary';
  className?: string;
  icon?: React.ReactNode;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, onClick, variant = 'default', className = '', icon }) => {
  const baseStyles = "h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all active:scale-95 shadow-sm";
  
  const variants = {
    default: "bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600",
    secondary: "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500",
    operator: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30 shadow-lg"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {icon || label}
    </button>
  );
};
