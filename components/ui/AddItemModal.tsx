
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BudgetData } from '../../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: any) => void;
  collection: keyof BudgetData | null;
  currencySymbol: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  collection,
  currencySymbol
}) => {
  const [name, setName] = useState('');
  
  // Dynamic fields state
  const [val1, setVal1] = useState(''); // Amount 1 (Planned, Budgeted, Target, etc.)
  const [val2, setVal2] = useState(''); // Amount 2 (Actual, Spent, Current, etc.)
  const [val3, setVal3] = useState(''); // Amount 3 (Monthly Contribution for goals)
  const [dateVal, setDateVal] = useState('');
  const [textVal, setTextVal] = useState(''); // Text input (Timeframe)

  useEffect(() => {
    if (isOpen) {
      setName('');
      setVal1('');
      setVal2('');
      setVal3('');
      setDateVal(new Date().toISOString().split('T')[0]);
      setTextVal('');
    }
  }, [isOpen, collection]);

  if (!isOpen || !collection) return null;

  const getConfig = () => {
    switch (collection) {
      case 'income':
        return {
          title: 'Add Income Source',
          nameLabel: 'Source Name',
          fields: [
             { label: 'Planned Amount', value: val1, set: setVal1, type: 'number' },
             { label: 'Actual Amount', value: val2, set: setVal2, type: 'number' }
          ]
        };
      case 'expenses':
        return {
          title: 'Add Expense Category',
          nameLabel: 'Category Name',
          fields: [
             { label: 'Budgeted Amount', value: val1, set: setVal1, type: 'number' },
             { label: 'Spent Amount', value: val2, set: setVal2, type: 'number' }
          ]
        };
      case 'bills':
        return {
          title: 'Add Bill',
          nameLabel: 'Bill Name',
          fields: [
             { label: 'Amount', value: val1, set: setVal1, type: 'number' },
             { label: 'Due Date', value: dateVal, set: setDateVal, type: 'date' }
          ]
        };
      case 'goals':
         return {
          title: 'Add Money Goal',
          nameLabel: 'Goal Name',
          fields: [
             { label: 'Target Amount', value: val1, set: setVal1, type: 'number' },
             { label: 'Current Saved', value: val2, set: setVal2, type: 'number' },
             { label: 'Monthly Contribution', value: val3, set: setVal3, type: 'number' },
             { label: 'Timeframe (e.g., "1 Year")', value: textVal, set: setTextVal, type: 'text' }
          ]
        };
      case 'savings':
         return {
          title: 'Add Savings Fund',
          nameLabel: 'Fund Name',
          fields: [
             { label: 'Goal Amount', value: val1, set: setVal1, type: 'number' },
             { label: 'Current Amount', value: val2, set: setVal2, type: 'number' }
          ]
        };
      case 'debts':
         return {
          title: 'Add Debt',
          nameLabel: 'Debt Name',
          fields: [
             { label: 'Total Balance', value: val1, set: setVal1, type: 'number' },
             { label: 'Monthly Payment', value: val2, set: setVal2, type: 'number' },
             { label: 'Due Date', value: dateVal, set: setDateVal, type: 'date' }
          ]
        };
      case 'investments':
         return {
          title: 'Add Investment',
          nameLabel: 'Asset Name',
          fields: [
             { label: 'Current Value', value: val1, set: setVal1, type: 'number' },
             { label: 'Target Value', value: val2, set: setVal2, type: 'number' },
             { label: 'Monthly Contribution', value: val3, set: setVal3, type: 'number' },
          ]
        };
      default:
        return { title: 'Add Item', nameLabel: 'Name', fields: [] };
    }
  };

  const config = getConfig();

  const handleSubmit = () => {
    if (!name) return; // Basic validation

    const item: any = { name };
    const num1 = parseFloat(val1) || 0;
    const num2 = parseFloat(val2) || 0;
    const num3 = parseFloat(val3) || 0;

    if (collection === 'income') {
        item.planned = num1;
        item.actual = num2;
    } else if (collection === 'expenses') {
        item.budgeted = num1;
        item.spent = num2;
    } else if (collection === 'bills') {
        item.amount = num1;
        item.dueDate = dateVal;
        item.paid = false;
    } else if (collection === 'goals') {
        item.target = num1;
        item.current = num2;
        item.monthly = num3;
        item.timeframe = textVal;
        item.checked = false;
    } else if (collection === 'savings') {
        item.planned = num1;
        item.amount = num2;
    } else if (collection === 'debts') {
        item.balance = num1;
        item.payment = num2;
        item.dueDate = dateVal;
        item.paid = false;
    } else if (collection === 'investments') {
        item.amount = num1;
        item.target = num2;
        item.monthly = num3;
        item.contributed = false;
    }

    onConfirm(item);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
         
         <h3 className="text-lg font-bold text-white mb-6">{config.title}</h3>

         <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{config.nameLabel}</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Salary, Rent, Groceries"
                    autoFocus
                />
            </div>

            {config.fields.map((field, idx) => (
                <div key={idx}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">{field.label}</label>
                    <div className="relative">
                        {field.type === 'number' && (
                             <span className="absolute left-3 top-3 text-slate-500">{currencySymbol}</span>
                        )}
                        <input 
                            type={field.type} 
                            value={field.value}
                            onChange={(e) => field.set(e.target.value)}
                            className={`w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors ${field.type === 'number' ? 'pl-7' : ''}`}
                            placeholder={field.type === 'number' ? '0.00' : ''}
                            style={field.type === 'date' ? { colorScheme: 'dark' } : {}}
                        />
                    </div>
                </div>
            ))}

            <button 
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-2"
            >
                Add Item
            </button>
         </div>
      </div>
    </div>
  );
};