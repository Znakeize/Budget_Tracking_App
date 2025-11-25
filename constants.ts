
import { BudgetData, EventData } from './types';

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
    { id: '1', name: 'Emergency Fund', planned: 300, amount: 300, balance: 5000, paid: true },
    { id: '2', name: 'House Repair', planned: 150, amount: 0, balance: 1200, paid: false },
    { id: '3', name: 'Vacation', planned: 250, amount: 200, balance: 800, paid: true },
    { id: '4', name: 'Christmas Fund', planned: 100, amount: 0, balance: 300, paid: false }
  ],
  debts: [
    { id: '1', name: 'Credit Card 1', balance: 500, payment: 150, paid: true, dueDate: '2025-01-05' },
    { id: '2', name: 'Credit Card 2', balance: 1200, payment: 100, paid: false, dueDate: '2025-01-15' },
    { id: '3', name: 'Car Loan', balance: 8000, payment: 350, paid: true, dueDate: '2025-01-20' },
    { id: '4', name: 'Personal Loan', balance: 2500, payment: 200, paid: false, dueDate: '2025-01-25' }
  ],
  investments: [
    { id: '1', name: '401(k) Contribution', amount: 500, target: 20000, monthly: 500, contributed: true },
    { id: '2', name: 'Roth IRA', amount: 500, target: 6500, monthly: 500, contributed: false },
    { id: '3', name: 'Stock Portfolio', amount: 300, target: 10000, monthly: 150, contributed: false },
    { id: '4', name: 'Index Funds', amount: 200, target: 5000, monthly: 100, contributed: true },
    { id: '5', name: 'Crypto', amount: 100, target: 1000, monthly: 50, contributed: false }
  ],
  rollover: 0,
  created: Date.now()
};

export const SAMPLE_EVENTS: EventData[] = [
    {
        id: 'evt-wedding',
        name: "Dream Wedding 2025",
        type: "Wedding",
        date: "2025-08-15",
        location: "Crystal Lake Resort",
        totalBudget: 45000,
        currencySymbol: "$",
        categories: [
            { id: 'cat-venue', name: "Venue & Food", allocated: 20000, color: "#ec4899" },
            { id: 'cat-attire', name: "Attire", allocated: 5000, color: "#8b5cf6" },
            { id: 'cat-photo', name: "Photography", allocated: 3500, color: "#f59e0b" },
            { id: 'cat-music', name: "Music", allocated: 2000, color: "#10b981" },
            { id: 'cat-decor', name: "Decor", allocated: 4000, color: "#06b6d4" },
            { id: 'cat-officiant', name: "Officiant", allocated: 500, color: "#6366f1" }
        ],
        expenses: [
            { id: 'exp-venue-dep', name: "Venue Deposit", amount: 5000, category: "Venue & Food", date: new Date(Date.now() - 86400000 * 30).toISOString() },
            { id: 'exp-dress-dep', name: "Wedding Dress Deposit", amount: 1500, category: "Attire", date: new Date(Date.now() - 86400000 * 15).toISOString() },
            { id: 'exp-std', name: "Save the Dates", amount: 300, category: "Decor", date: new Date(Date.now() - 86400000 * 45).toISOString() }
        ],
        vendors: [
            { id: 'ven-crystal', name: "Crystal Lake Events", service: "Venue", totalAmount: 20000, paidAmount: 5000, status: 'partial', dueDate: "2025-07-01", contact: "events@crystallake.com", paymentHistory: [{id: 'pay-1', date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], name: 'Advance Payment', amount: 5000}], advance: 5000 },
            { id: 'ven-photo', name: "Captured Moments", service: "Photography", totalAmount: 3500, paidAmount: 0, status: 'pending', dueDate: "2025-06-15", contact: "mike@captured.com", paymentHistory: [] },
            { id: 'ven-boutique', name: "Bridal Boutique", service: "Attire", totalAmount: 3000, paidAmount: 1500, status: 'partial', dueDate: "2025-05-01", paymentHistory: [{id: 'pay-2', date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0], name: 'Advance Payment', amount: 1500}], advance: 1500 },
            { id: 'ven-dj', name: "DJ Spin", service: "Music", totalAmount: 1800, paidAmount: 0, status: 'pending', dueDate: "2025-07-15", paymentHistory: [] }
        ],
        members: [
            { id: "me", name: "You", role: "admin" },
            { id: "partner", name: "Jamie", role: "editor" }
        ],
        notes: "Guest list finalized at 120. Need to choose cake flavor by next month.",
        created: Date.now(),
        theme: "pastel"
    },
    {
        id: 'evt-birthday',
        name: "Mom's 60th Birthday",
        type: "Birthday",
        date: "2025-10-20",
        location: "Backyard Garden",
        totalBudget: 5000,
        currencySymbol: "$",
        categories: [
            { id: 'cat-food', name: "Food & Drinks", allocated: 2000, color: "#f59e0b" },
            { id: 'cat-dec', name: "Decorations", allocated: 1000, color: "#ec4899" },
            { id: 'cat-gift', name: "Gifts", allocated: 500, color: "#8b5cf6" },
            { id: 'cat-ent', name: "Entertainment", allocated: 1000, color: "#10b981" },
            { id: 'cat-cake', name: "Cake", allocated: 500, color: "#6366f1" }
        ],
        expenses: [],
        vendors: [],
        members: [{ id: 'me', name: 'You', role: 'admin' }],
        notes: "Surprise party!",
        created: Date.now(),
        theme: "colorful"
    },
    {
        id: 'evt-trip',
        name: "Japan Trip 2026",
        type: "Trip",
        date: "2026-04-01",
        location: "Tokyo, Kyoto, Osaka",
        totalBudget: 8000,
        currencySymbol: "$",
        categories: [
            { id: 'cat-fly', name: "Flights", allocated: 2000, color: "#3b82f6" },
            { id: 'cat-stay', name: "Accommodation", allocated: 2500, color: "#8b5cf6" },
            { id: 'cat-eat', name: "Food", allocated: 1500, color: "#f59e0b" },
            { id: 'cat-act', name: "Activities", allocated: 1000, color: "#10b981" },
            { id: 'cat-mv', name: "Transport", allocated: 1000, color: "#64748b" }
        ],
        expenses: [],
        vendors: [],
        members: [{ id: 'me', name: 'You', role: 'admin' }],
        notes: "Cherry blossom season.",
        created: Date.now(),
        theme: "dark"
    },
    {
        id: 'evt-corp',
        name: "Q4 Strategy Retreat",
        type: "Corporate",
        date: "2025-12-10",
        location: "Grand Hotel Conference Center",
        totalBudget: 15000,
        currencySymbol: "$",
        categories: [
            { id: 'cat-ven', name: "Venue", allocated: 5000, color: "#6366f1" },
            { id: 'cat-cat', name: "Catering", allocated: 4000, color: "#f59e0b" },
            { id: 'cat-spk', name: "Speakers", allocated: 3000, color: "#10b981" },
            { id: 'cat-swg', name: "Swag", allocated: 2000, color: "#ec4899" },
            { id: 'cat-av', name: "AV Equipment", allocated: 1000, color: "#64748b" }
        ],
        expenses: [],
        vendors: [],
        members: [{ id: 'me', name: 'You', role: 'admin' }],
        notes: "Focus on next year's roadmap.",
        created: Date.now(),
        theme: "dark"
    }
];
