import { BudgetData } from './types';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': '$',
  'AUD': '$', 'JPY': '¥', 'INR': '₹', 'CNY': '¥'
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const INITIAL_DATA: BudgetData = {
  id: 'init',
  period: 'monthly',
  month: 0, // January
  year: 2025,
  currency: 'USD',
  currencySymbol: '$',
  income: [
    { id: '1', name: 'Paycheck 1', planned: 2000, actual: 2000 },
    { id: '2', name: 'Paycheck 2', planned: 2000, actual: 2000 },
    { id: '3', name: 'Side Hustle', planned: 300, actual: 280 },
    { id: '4', name: 'Other Income', planned: 100, actual: 120 }
  ],
  expenses: [
    { id: '1', name: 'Groceries', budgeted: 500, spent: 480 },
    { id: '2', name: 'Eating Out', budgeted: 200, spent: 215 },
    { id: '3', name: 'Fuel', budgeted: 150, spent: 145 },
    { id: '4', name: 'Shopping', budgeted: 150, spent: 160 },
    { id: '5', name: 'Gifts', budgeted: 100, spent: 80 },
    { id: '6', name: 'Personal Care', budgeted: 80, spent: 75 },
    { id: '7', name: 'Miscellaneous', budgeted: 100, spent: 95 }
  ],
  bills: [
    { id: '1', name: 'Mortgage/Rent', amount: 1200, dueDate: '2025-01-01', paid: true },
    { id: '2', name: 'Daycare', amount: 400, dueDate: '2025-01-05', paid: true },
    { id: '3', name: 'Electric', amount: 120, dueDate: '2025-01-10', paid: false },
    { id: '4', name: 'Water/Sewer', amount: 60, dueDate: '2025-01-12', paid: false },
    { id: '5', name: 'Internet', amount: 70, dueDate: '2025-01-15', paid: false },
    { id: '6', name: 'Phone', amount: 85, dueDate: '2025-01-18', paid: false },
    { id: '7', name: 'Subscriptions', amount: 45, dueDate: '2025-01-20', paid: false }
  ],
  goals: [
    { id: '1', name: 'Pay off credit cards', target: 3000, current: 1500, monthly: 250, timeframe: '6 months', checked: false },
    { id: '2', name: 'Build emergency fund', target: 10000, current: 5000, monthly: 417, timeframe: '1 year', checked: false },
    { id: '3', name: 'Save for vacation', target: 2000, current: 800, monthly: 400, timeframe: '3 months', checked: false }
  ],
  savings: [
    { id: '1', name: 'Emergency Fund', planned: 300, amount: 300 },
    { id: '2', name: 'House Repair', planned: 150, amount: 150 },
    { id: '3', name: 'Vacation', planned: 250, amount: 200 },
    { id: '4', name: 'Christmas Fund', planned: 100, amount: 150 }
  ],
  debts: [
    { id: '1', name: 'Credit Card 1', balance: 500, payment: 150, paid: true, dueDate: '2025-01-05' },
    { id: '2', name: 'Credit Card 2', balance: 1200, payment: 100, paid: false, dueDate: '2025-01-15' },
    { id: '3', name: 'Car Loan', balance: 8000, payment: 350, paid: true, dueDate: '2025-01-20' },
    { id: '4', name: 'Personal Loan', balance: 2500, payment: 200, paid: false, dueDate: '2025-01-25' }
  ],
  investments: [
    { id: '1', name: '401(k) Contribution', amount: 500 },
    { id: '2', name: 'Roth IRA', amount: 500 },
    { id: '3', name: 'Stock Portfolio', amount: 300 },
    { id: '4', name: 'Index Funds', amount: 200 },
    { id: '5', name: 'Crypto', amount: 100 }
  ],
  rollover: 0,
  created: Date.now()
};