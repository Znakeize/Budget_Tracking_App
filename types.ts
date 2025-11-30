
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

// --- Investment Interfaces ---

export type InvestmentType = 'personal' | 'business';
export type AssetCategory = 'Stocks' | 'Crypto' | 'RealEstate' | 'MutualFunds' | 'Savings' | 'BusinessProject' | 'Equipment' | 'Equity' | 'Other';

export interface InvestmentTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'dividend' | 'expense' | 'income';
  amount: number;
  price?: number;
  quantity?: number;
  note?: string;
}

export interface InvestmentItem extends BaseItem {
  // Common fields
  amount: number; // Current Total Value
  initialValue?: number; // Cost Basis / Capital Invested
  target?: number;
  monthly?: number; // Monthly Contribution
  contributed?: boolean;
  
  // Advanced fields
  type?: InvestmentType;
  category?: AssetCategory;
  quantity?: number; // For stocks/crypto
  symbol?: string; // Ticker
  roi?: number; // Calculated ROI percentage
  monthlyCashFlow?: number; // For business/rental
  transactions?: InvestmentTransaction[];
  history?: {
    date: string;
    amount: number;
  }[];
  documents?: string[]; // Placeholder for file names
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  type: 'value' | 'roi' | 'income';
}

export interface InvestmentAlert {
  id: string;
  assetName: string; // or assetId
  type: 'price_above' | 'price_below' | 'date';
  value: number | string;
  active: boolean;
  assetId?: string;
}

// --- Main Data Structure ---

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
    paidBy?: string;
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

// --- Shopping List Interfaces ---

export interface ShopItem {
  id: string;
  name: string;
  quantity: string;
  notes?: string;
  price?: number; // Estimated Price
  actualPrice?: number; // Actual Price paid
  checked: boolean;
  addedBy: string; // member name
  purchasedBy?: string;
  dueDate?: string; // For reminders
  assignee?: string; // For shared responsibility
}

export interface Shop {
  id: string;
  name: string; // e.g., Keells, Hardware Store
  location?: string;
  items: ShopItem[];
  budget?: number;
  budgetCategory?: string; // Linked Budget Category Name
  eventId?: string; // Linked Event ID
  expenseId?: string; // Linked Event Expense ID
  groupId?: string; // Linked Collaboration Group ID
  groupExpenseId?: string; // Linked Collaboration Expense ID
}

export interface ShopMember {
  id: string;
  name: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  avatarColor: string;
}

export interface ShoppingListData {
  id: string;
  name: string; // e.g., Weekly Groceries
  shops: Shop[];
  members: ShopMember[];
  created: number;
  currencySymbol: string;
  color: string;
  budget?: number;
  lastModified?: number;
}

// --- Collaborative / Shared Budget Interfaces ---

export interface SharedMember {
  id: string;
  name: string;
  email?: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  avatarColor: string;
  contribution?: number;
}

export interface SharedExpense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  sharedWith: string[]; // IDs of members sharing this expense
  category: string;
  date: string;
  notes?: string;
  receipt?: string;
  split: Record<string, number>; // userId -> amount owed
  type: 'expense' | 'settlement' | 'reminder';
}

export interface GroupActivity {
  id: string;
  type: 'expense' | 'settlement' | 'member' | 'edit';
  text: string;
  date: string;
  user: string;
  amount?: number;
}

export interface SharedGroup {
  id: string;
  name: string;
  totalBudget: number;
  currency: string;
  members: SharedMember[];
  expenses: SharedExpense[];
  categories: string[];
  activityLog: GroupActivity[];
  settings: {
      shareAllCategories: boolean;
  };
}