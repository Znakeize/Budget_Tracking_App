
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CNY';
export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'paycheck';

export interface BaseItem {
  id: string;
  name: string;
}

export interface IncomeItem extends BaseItem {
  planned: number;
  actual: number;
}

export interface ExpenseItem extends BaseItem {
  budgeted: number;
  spent: number;
}

export interface BillItem extends BaseItem {
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface GoalItem extends BaseItem {
  target: number;
  current: number;
  monthly: number;
  timeframe: string;
  checked: boolean;
}

export interface SavingsItem extends BaseItem {
  planned: number;
  amount: number; // Treated as 'spent' or 'saved' this period
  balance?: number; // Total fund balance
  paid?: boolean;
}

export interface DebtItem extends BaseItem {
  balance: number;
  payment: number;
  paid: boolean;
  dueDate?: string;
}

export interface InvestmentItem extends BaseItem {
  amount: number;
  target?: number;
  monthly?: number;
  contributed?: boolean;
  history?: {
    date: string;
    amount: number;
  }[];
}

export interface BudgetData {
  id: string;
  period: PeriodType;
  month: number;
  year: number;
  startDate?: string;
  endDate?: string;
  currency: CurrencyCode;
  currencySymbol: string;
  income: IncomeItem[];
  expenses: ExpenseItem[];
  bills: BillItem[];
  goals: GoalItem[];
  savings: SavingsItem[];
  debts: DebtItem[];
  investments: InvestmentItem[];
  rollover: number;
  created: number;
}

export interface SavedFile {
  id: string;
  fileName: string;
  savedDate: string;
  periodName: string;
  data: BudgetData;
}

// --- Event Management Interfaces ---

export interface EventVendor {
  id: string;
  name: string;
  service: string;
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  rating?: number;
  contact?: string;
  advance?: number;
  paymentHistory?: {
    id: string;
    date: string;
    name: string;
    amount: number;
  }[];
}

export interface EventExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  vendorId?: string;
  paidBy?: string;
  receipt?: string; // URL or placeholder
}

export interface EventCategory {
  id: string;
  name: string;
  allocated: number;
  color: string;
}

export interface EventMember {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

export interface EventData {
  id: string;
  name: string;
  type: string; // Wedding, Birthday, Trip, etc.
  date: string;
  location: string;
  totalBudget: number;
  currencySymbol: string;
  categories: EventCategory[];
  expenses: EventExpense[];
  vendors: EventVendor[];
  members: EventMember[];
  notes: string;
  created: number;
  theme?: string; // 'pastel', 'dark', 'colorful'
}