
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, Briefcase, Building2, TrendingUp, 
  DollarSign, Shield, PieChart, RefreshCcw, FileText, 
  Download, Plus, Trash2, ChevronDown, Check,
  Lightbulb, ArrowRight, Landmark, ArrowLeft,
  Percent, Coins, BarChart3, Wallet, Receipt,
  Factory, LayoutDashboard, Target, RefreshCw, Calendar, Clock,
  List, Calculator, User, Hash, X, Info
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/calculations';
import { BudgetData } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Types ---

interface TaxEntry {
  id: string;
  name: string;
  amount: number;
  category: string;
}

interface TaxBracket {
  limit: number; // Upper limit of the slab
  rate: number;  // Tax rate in %
}

interface CountryRules {
  id: string;
  currency: string;
  symbol: string;
  name: string;
  flag: string;
  fiscalYearStart: string;
  brackets: TaxBracket[];
  standardDeduction: number;
  deductionTypes: string[];
  incomeTypes: string[];
  corporateRate: number;
  corporateDeductions: string[];
  vatRate: number;
  vatName: string;
}

// --- Data Configuration ---

const TAX_RULES: Record<string, CountryRules> = {
  'LKR': {
    id: 'LKR',
    currency: 'LKR',
    symbol: 'Rs.',
    name: 'Sri Lanka',
    flag: '🇱🇰',
    fiscalYearStart: 'April 1',
    brackets: [
      { limit: 1200000, rate: 0 },
      { limit: 1700000, rate: 6 },
      { limit: 2200000, rate: 12 },
      { limit: 2700000, rate: 18 },
      { limit: 3200000, rate: 24 },
      { limit: 3700000, rate: 30 },
      { limit: Infinity, rate: 36 } 
    ],
    standardDeduction: 0,
    deductionTypes: ['EPF Contribution', 'Insurance Premium', 'Donations (Approved)', 'Housing Loan Interest', 'Education Exp.'],
    incomeTypes: ['Employment', 'Business', 'Rental', 'Interest/Dividends', 'Other'],
    corporateRate: 30,
    corporateDeductions: ['Depreciation', 'Salaries', 'Rent', 'Utilities', 'Marketing'],
    vatRate: 18,
    vatName: 'VAT'
  },
  'IND': {
    id: 'IND',
    currency: 'INR',
    symbol: '₹',
    name: 'India',
    flag: '🇮🇳',
    fiscalYearStart: 'April 1',
    brackets: [
      { limit: 300000, rate: 0 },
      { limit: 600000, rate: 5 },
      { limit: 900000, rate: 10 },
      { limit: 1200000, rate: 15 },
      { limit: 1500000, rate: 20 },
      { limit: Infinity, rate: 30 }
    ],
    standardDeduction: 50000,
    deductionTypes: ['80C (LIC/PPF)', '80D (Medical)', 'HRA', 'NPS', 'Home Loan Interest'],
    incomeTypes: ['Salary', 'Business/Profession', 'Capital Gains', 'House Property', 'Other Sources'],
    corporateRate: 25,
    corporateDeductions: ['Business Expenses', 'Depreciation', 'Start-up Costs'],
    vatRate: 18,
    vatName: 'GST'
  },
  'USA': {
    id: 'USA',
    currency: 'USD',
    symbol: '$',
    name: 'United States',
    flag: '🇺🇸',
    fiscalYearStart: 'Jan 1',
    brackets: [
      { limit: 11000, rate: 10 },
      { limit: 44725, rate: 12 },
      { limit: 95375, rate: 22 },
      { limit: 182100, rate: 24 },
      { limit: 231250, rate: 32 },
      { limit: 578125, rate: 35 },
      { limit: Infinity, rate: 37 }
    ],
    standardDeduction: 13850,
    deductionTypes: ['401(k)', 'IRA', 'Mortgage Interest', 'Student Loan Interest', 'Charity', 'State Taxes'],
    incomeTypes: ['Wages (W-2)', 'Business (1099)', 'Investments', 'Retirement', 'Other'],
    corporateRate: 21,
    corporateDeductions: ['Operating Expenses', 'Asset Depreciation', 'Research & Development'],
    vatRate: 8, // Avg Sales Tax
    vatName: 'Sales Tax'
  },
  'UK': {
    id: 'UK',
    currency: 'GBP',
    symbol: '£',
    name: 'United Kingdom',
    flag: '🇬🇧',
    fiscalYearStart: 'April 6',
    brackets: [
      { limit: 12570, rate: 0 },
      { limit: 50270, rate: 20 },
      { limit: 125140, rate: 40 },
      { limit: Infinity, rate: 45 }
    ],
    standardDeduction: 0, 
    deductionTypes: ['Pension Contributions', 'Charitable Giving', 'Work Expenses'],
    incomeTypes: ['Employment', 'Self-Employment', 'Property', 'Dividends', 'Pension'],
    corporateRate: 25,
    corporateDeductions: ['Running Costs', 'Capital Allowances'],
    vatRate: 20,
    vatName: 'VAT'
  },
  'AUS': {
    id: 'AUS',
    currency: 'AUD',
    symbol: '$',
    name: 'Australia',
    flag: '🇦🇺',
    fiscalYearStart: 'July 1',
    brackets: [
      { limit: 18200, rate: 0 },
      { limit: 45000, rate: 16 }, // Approx simplified
      { limit: 135000, rate: 30 },
      { limit: 190000, rate: 37 },
      { limit: Infinity, rate: 45 }
    ],
    standardDeduction: 0,
    deductionTypes: ['Work-related Expenses', 'Self-education', 'Charitable Donations', 'Income Protection Insurance'],
    incomeTypes: ['Salary', 'Business Income', 'Investment Income', 'Capital Gains'],
    corporateRate: 30, // 25% for base rate entities, simplified to 30% standard
    corporateDeductions: ['Operating Expenses', 'Employee Wages', 'Superannuation'],
    vatRate: 10,
    vatName: 'GST'
  },
  'CAN': {
    id: 'CAN',
    currency: 'CAD',
    symbol: '$',
    name: 'Canada',
    flag: '🇨🇦',
    fiscalYearStart: 'Jan 1',
    brackets: [
      { limit: 53359, rate: 15 },
      { limit: 106717, rate: 20.5 },
      { limit: 165430, rate: 26 },
      { limit: 235675, rate: 29 },
      { limit: Infinity, rate: 33 }
    ],
    standardDeduction: 15000, // Basic Personal Amount Approx
    deductionTypes: ['RRSP', 'Union Dues', 'Child Care Expenses', 'Moving Expenses'],
    incomeTypes: ['Employment', 'Self-Employment', 'Interest/Investments', 'Pension'],
    corporateRate: 15, // Federal net approx
    corporateDeductions: ['Business Expenses', 'CCA (Depreciation)', 'Salaries'],
    vatRate: 5, // Federal GST
    vatName: 'GST'
  },
  'NZL': {
    id: 'NZL',
    currency: 'NZD',
    symbol: '$',
    name: 'New Zealand',
    flag: '🇳🇿',
    fiscalYearStart: 'April 1',
    brackets: [
      { limit: 14000, rate: 10.5 },
      { limit: 48000, rate: 17.5 },
      { limit: 70000, rate: 30 },
      { limit: 180000, rate: 33 },
      { limit: Infinity, rate: 39 }
    ],
    standardDeduction: 0,
    deductionTypes: ['Donations (Tax Credit)', 'Income Protection Insurance', 'Accountancy Fees'],
    incomeTypes: ['Salary/Wages', 'Business/Self-Employed', 'Schedular Payments', 'Interest'],
    corporateRate: 28,
    corporateDeductions: ['Operating Costs', 'Depreciation', 'Interest', 'Bad Debts'],
    vatRate: 15,
    vatName: 'GST'
  },
  'CHE': {
    id: 'CHE',
    currency: 'CHF',
    symbol: 'Fr.',
    name: 'Switzerland',
    flag: '🇨🇭',
    fiscalYearStart: 'Jan 1',
    brackets: [
      // Simplified Federal Tax (Cantonal varies greatly)
      { limit: 14500, rate: 0 },
      { limit: 31600, rate: 0.77 },
      { limit: 41400, rate: 0.88 },
      { limit: 55200, rate: 2.64 },
      { limit: 72500, rate: 2.97 },
      { limit: 103600, rate: 5.94 },
      { limit: 134600, rate: 6.6 },
      { limit: 176000, rate: 8.8 },
      { limit: Infinity, rate: 11.5 }
    ],
    standardDeduction: 6500, // Approximate generic deduction
    deductionTypes: ['Social Security (AHV/IV)', 'Pension (Pillar 2/3a)', 'Health Insurance Premiums', 'Professional Expenses'],
    incomeTypes: ['Employment Income', 'Self-Employment', 'Investment Income'],
    corporateRate: 15, // Effective average
    corporateDeductions: ['Business Expenses', 'Depreciation', 'Provisions', 'Taxes Paid'],
    vatRate: 8.1,
    vatName: 'VAT'
  },
  'CHN': {
    id: 'CHN',
    currency: 'CNY',
    symbol: '¥',
    name: 'China',
    flag: '🇨🇳',
    fiscalYearStart: 'Jan 1',
    brackets: [
      { limit: 36000, rate: 3 },
      { limit: 144000, rate: 10 },
      { limit: 300000, rate: 20 },
      { limit: 420000, rate: 25 },
      { limit: 660000, rate: 30 },
      { limit: 960000, rate: 35 },
      { limit: Infinity, rate: 45 }
    ],
    standardDeduction: 60000, // 5000/month
    deductionTypes: ['Social Insurance', 'Housing Fund', 'Children Education', 'Continuing Education', 'Serious Illness', 'Mortgage Interest/Rent', 'Elderly Care'],
    incomeTypes: ['Wages/Salaries', 'Remuneration', 'Author\'s Remuneration', 'Royalties', 'Business Income'],
    corporateRate: 25,
    corporateDeductions: ['Production Costs', 'Losses', 'Depreciation'],
    vatRate: 13,
    vatName: 'VAT'
  },
  'RUS': {
    id: 'RUS',
    currency: 'RUB',
    symbol: '₽',
    name: 'Russia',
    flag: '🇷🇺',
    fiscalYearStart: 'Jan 1',
    brackets: [
      { limit: 2400000, rate: 13 },
      { limit: 5000000, rate: 15 },
      { limit: 20000000, rate: 18 },
      { limit: 50000000, rate: 20 },
      { limit: Infinity, rate: 22 }
    ],
    standardDeduction: 0,
    deductionTypes: ['Standard (Children)', 'Social (Charity/Education/Medical)', 'Property (Housing Purchase)', 'Investment'],
    incomeTypes: ['Employment', 'Dividend', 'Lease/Rental', 'Sale of Property'],
    corporateRate: 20,
    corporateDeductions: ['Documented Expenses', 'Production Costs', 'Labor Costs'],
    vatRate: 20,
    vatName: 'VAT'
  }
};

interface TaxPlannerViewProps {
  onBack: () => void;
  userProfile?: any;
  defaultMode?: 'income' | 'vat' | 'business';
  budgetData?: BudgetData;
}

export const TaxPlannerView: React.FC<TaxPlannerViewProps> = ({ onBack, userProfile, defaultMode = 'income', budgetData }) => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'scenarios'>('input');
  const [selectedCountry, setSelectedCountry] = useState<string>('LKR');
  const [fiscalYear, setFiscalYear] = useState('2024-2025');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [inputFrequency, setInputFrequency] = useState<'monthly' | 'yearly'>('yearly');
  
  // Income Tax Input Data
  const [incomeSources, setIncomeSources] = useState<TaxEntry[]>([
    { id: '1', name: 'Primary Salary', amount: 1800000, category: 'Employment' }
  ]);
  const [deductions, setDeductions] = useState<TaxEntry[]>([]);
  
  // Income Tax Scenario Data
  const [scenarioIncomeAdj, setScenarioIncomeAdj] = useState(0); // % change
  const [scenarioInvestAdj, setScenarioInvestAdj] = useState(0); // Absolute amount

  // VAT Calculator State
  const [vatTab, setVatTab] = useState<'quick' | 'invoice'>('quick');
  const [vatAmount, setVatAmount] = useState<number>(1000);
  const [vatRate, setVatRate] = useState<number>(18);
  const [vatInclusive, setVatInclusive] = useState<boolean>(false);
  const [vatItems, setVatItems] = useState<{id: string, name: string, amount: number, quantity: number, rate: number, inclusive: boolean}[]>([
      { id: '1', name: 'Service Fee', amount: 5000, quantity: 1, rate: 18, inclusive: false }
  ]);
  const [invoiceMeta, setInvoiceMeta] = useState({
      from: '',
      to: '',
      number: `INV-${new Date().getFullYear()}-001`,
      date: new Date().toISOString().split('T')[0]
  });

  // Business Tax State
  const [bizRevenue, setBizRevenue] = useState<number>(5000000);
  const [bizCOGS, setBizCOGS] = useState<number>(2000000);
  const [bizExpenses, setBizExpenses] = useState<TaxEntry[]>([
      { id: 'b1', name: 'Rent', amount: 600000, category: 'Rent' },
      { id: 'b2', name: 'Salaries', amount: 1200000, category: 'Salaries' }
  ]);
  const [bizDepreciation, setBizDepreciation] = useState<number>(100000);
  const [bizOtherIncome, setBizOtherIncome] = useState<number>(0);
  const [bizScenarioRevAdj, setBizScenarioRevAdj] = useState(0); // % Change in revenue
  const [bizScenarioExpAdj, setBizScenarioExpAdj] = useState(0); // % Change in expenses

  const rules = TAX_RULES[selectedCountry];

  // Set default VAT rate when country changes
  useEffect(() => {
      if (defaultMode === 'vat') {
          setVatRate(rules.vatRate);
          setVatItems(prev => prev.map(i => ({...i, rate: rules.vatRate})));
      }
  }, [selectedCountry, defaultMode]);

  // --- VAT Calculation ---
  const vatResults = useMemo(() => {
      // Quick Calc
      let quickNet = 0, quickTax = 0, quickGross = 0;
      if (vatInclusive) {
          quickGross = vatAmount;
          quickNet = quickGross / (1 + vatRate/100);
          quickTax = quickGross - quickNet;
      } else {
          quickNet = vatAmount;
          quickTax = quickNet * (vatRate/100);
          quickGross = quickNet + quickTax;
      }

      // Invoice Calc
      let invNet = 0, invTax = 0, invGross = 0;
      const items = vatItems.map(item => {
          let iNet = 0, iTax = 0, iGross = 0;
          const total = item.amount * item.quantity;
          if (item.inclusive) {
              iGross = total;
              iNet = iGross / (1 + item.rate/100);
              iTax = iGross - iNet;
          } else {
              iNet = total;
              iTax = iNet * (item.rate/100);
              iGross = iNet + iTax;
          }
          invNet += iNet;
          invTax += iTax;
          invGross += iGross;
          return { ...item, net: iNet, tax: iTax, gross: iGross };
      });
      
      return { 
          quick: { net: quickNet, tax: quickTax, gross: quickGross },
          invoice: { net: invNet, tax: invTax, gross: invGross, items }
      };
  }, [vatAmount, vatRate, vatInclusive, vatItems]);

  // --- Income Tax Calculation Engine ---
  const calculation = useMemo(() => {
    // 1. Total Income
    const rawTotalIncome = incomeSources.reduce((sum, item) => sum + item.amount, 0);
    const annualizedIncome = inputFrequency === 'monthly' ? rawTotalIncome * 12 : rawTotalIncome;
    const projectedIncome = annualizedIncome * (1 + scenarioIncomeAdj / 100);

    // 2. Total Deductions
    const rawUserDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const annualizedUserDeductions = inputFrequency === 'monthly' ? rawUserDeductions * 12 : rawUserDeductions;
    const totalDeductions = annualizedUserDeductions + rules.standardDeduction + scenarioInvestAdj;

    // 3. Taxable Income
    const taxableIncome = Math.max(0, projectedIncome - totalDeductions);

    // 4. Bracket Calculation
    let taxPayable = 0;
    let previousLimit = 0;
    const slabBreakdown: { range: string, rate: number, tax: number, incomeInSlab: number }[] = [];

    for (const bracket of rules.brackets) {
      if (taxableIncome > previousLimit) {
        const upperLimit = bracket.limit === Infinity ? taxableIncome : bracket.limit;
        const taxableAmountInBracket = Math.min(taxableIncome, upperLimit) - previousLimit;
        
        if (taxableAmountInBracket > 0) {
            const taxInBracket = taxableAmountInBracket * (bracket.rate / 100);
            taxPayable += taxInBracket;
            
            slabBreakdown.push({
              range: `${formatCurrency(previousLimit + 1, rules.symbol)} - ${bracket.limit === Infinity ? 'Above' : formatCurrency(bracket.limit, rules.symbol)}`,
              rate: bracket.rate,
              tax: taxInBracket,
              incomeInSlab: taxableAmountInBracket
            });
        }
        previousLimit = bracket.limit;
      } else {
        break;
      }
    }

    // 5. Effective Rate
    const effectiveRate = projectedIncome > 0 ? (taxPayable / projectedIncome) * 100 : 0;
    const netIncome = projectedIncome - taxPayable;

    // 6. Monthly Breakdown
    const monthlyIncome = projectedIncome / 12;
    const monthlyTax = taxPayable / 12;
    const monthlyNet = netIncome / 12;

    return {
      totalIncome: annualizedIncome,
      projectedIncome,
      totalDeductions,
      taxableIncome,
      taxPayable,
      effectiveRate,
      netIncome,
      slabBreakdown,
      monthlyIncome,
      monthlyTax,
      monthlyNet
    };
  }, [incomeSources, deductions, selectedCountry, scenarioIncomeAdj, scenarioInvestAdj, rules, inputFrequency]);

  // --- Business Tax Calculation ---
  const businessCalculation = useMemo(() => {
      const projectedRevenue = bizRevenue * (1 + bizScenarioRevAdj / 100);
      const grossProfit = projectedRevenue - bizCOGS;
      const totalOpExpenses = bizExpenses.reduce((sum, e) => sum + e.amount, 0) * (1 + bizScenarioExpAdj / 100);
      
      const ebitda = grossProfit - totalOpExpenses;
      const ebit = ebitda - bizDepreciation;
      const ebt = ebit + bizOtherIncome; // Taxable Income
      
      const taxAmount = Math.max(0, ebt * (rules.corporateRate / 100));
      const netProfit = ebt - taxAmount;
      const netMargin = projectedRevenue > 0 ? (netProfit / projectedRevenue) * 100 : 0;

      return {
          projectedRevenue,
          grossProfit,
          totalOpExpenses,
          ebitda,
          ebit,
          ebt,
          taxAmount,
          netProfit,
          netMargin
      };
  }, [bizRevenue, bizCOGS, bizExpenses, bizDepreciation, bizOtherIncome, bizScenarioRevAdj, bizScenarioExpAdj, rules]);

  // --- Handlers ---
  
  const toggleFrequency = (newFreq: 'monthly' | 'yearly') => {
      if (newFreq === inputFrequency) return;
      const multiplier = newFreq === 'yearly' ? 12 : 1/12;
      setIncomeSources(prev => prev.map(i => ({ ...i, amount: Math.round(i.amount * multiplier) })));
      setDeductions(prev => prev.map(d => ({ ...d, amount: Math.round(d.amount * multiplier) })));
      setInputFrequency(newFreq);
  };

  const addIncome = () => {
    const type = rules.incomeTypes[0];
    setIncomeSources([...incomeSources, { id: Date.now().toString(), name: type, amount: 0, category: type }]);
  };

  const addDeduction = () => {
    const type = rules.deductionTypes[0];
    setDeductions([...deductions, { id: Date.now().toString(), name: type, amount: 0, category: type }]);
  };

  const addBizExpense = () => {
      setBizExpenses([...bizExpenses, { id: Date.now().toString(), name: 'New Expense', amount: 0, category: 'Operating' }]);
  };

  const addVatItem = () => {
      setVatItems([...vatItems, { id: Date.now().toString(), name: 'New Item', amount: 0, quantity: 1, rate: rules.vatRate, inclusive: false }]);
  };

  const updateVatItem = (id: string, field: string, value: any) => {
      setVatItems(vatItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeVatItem = (id: string) => {
      setVatItems(vatItems.filter(i => i.id !== id));
  };

  const updateEntry = (list: TaxEntry[], setList: any, id: string, field: string, value: any) => {
    setList(list.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeEntry = (list: TaxEntry[], setList: any, id: string) => {
    setList(list.filter(i => i.id !== id));
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const activeData = vatTab === 'quick' ? vatResults.quick : vatResults.invoice;
    
    if (defaultMode === 'vat') {
        if (vatTab === 'invoice') {
            // Generate Invoice PDF with Metadata
            doc.setFontSize(24);
            doc.setTextColor(33, 33, 33);
            doc.text("INVOICE", 150, 25);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(invoiceMeta.from || "Your Business Name", 20, 25);
            
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);
            
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(11);
            doc.text("Bill To:", 20, 50);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(invoiceMeta.to || "Client Name", 20, 56);
            
            doc.text("Invoice #:", 140, 50);
            doc.text(invoiceMeta.number, 170, 50, { align: 'right' });
            doc.text("Date:", 140, 56);
            doc.text(invoiceMeta.date, 170, 56, { align: 'right' });
            
            let y = 75;
            // Headers
            doc.setFillColor(245, 247, 250);
            doc.rect(20, y-5, 170, 8, 'F');
            doc.setFontSize(9);
            doc.setTextColor(33, 33, 33);
            doc.setFont('helvetica', 'bold');
            doc.text("Description", 25, y); 
            doc.text("Net", 100, y, { align: 'right' }); 
            doc.text("Tax", 130, y, { align: 'right' }); 
            doc.text("Gross", 180, y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            
            y += 10;
            
            vatResults.invoice.items.forEach(item => {
                doc.text(item.name, 25, y);
                doc.text(formatCurrency(item.net, rules.symbol), 100, y, { align: 'right' });
                doc.text(formatCurrency(item.tax, rules.symbol), 130, y, { align: 'right' });
                doc.text(formatCurrency(item.gross, rules.symbol), 180, y, { align: 'right' });
                y += 8;
            });
            
            y += 5;
            doc.line(20, y, 190, y);
            y += 10;
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total: ${formatCurrency(activeData.gross, rules.symbol)}`, 180, y, { align: 'right' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`(Includes ${formatCurrency(activeData.tax, rules.symbol)} Tax)`, 180, y + 6, { align: 'right' });
            
            doc.save(`Invoice_${invoiceMeta.number}.pdf`);
        } else {
            // Quick Report
            doc.setFontSize(20);
            doc.text(`${rules.vatName} Calculation`, 20, 20);
            doc.setFontSize(14);
            doc.text(`Total Net: ${formatCurrency(activeData.net, rules.symbol)}`, 20, 40);
            doc.text(`Total Tax: ${formatCurrency(activeData.tax, rules.symbol)}`, 20, 50);
            doc.text(`Total Gross: ${formatCurrency(activeData.gross, rules.symbol)}`, 20, 60);
            doc.save(`Tax_Quick_Calc.pdf`);
        }
    } else if (defaultMode === 'business') {
        doc.setFontSize(20);
        doc.text("Business Tax Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Company Financials | ${fiscalYear}`, 20, 30);
        let y = 45;
        doc.text(`Gross Revenue: ${formatCurrency(businessCalculation.projectedRevenue, rules.symbol)}`, 20, y); y+=10;
        doc.text(`Cost of Goods: (${formatCurrency(bizCOGS, rules.symbol)})`, 20, y); y+=10;
        doc.text(`Operating Exp: (${formatCurrency(businessCalculation.totalOpExpenses, rules.symbol)})`, 20, y); y+=10;
        doc.text(`Taxable Income: ${formatCurrency(businessCalculation.ebt, rules.symbol)}`, 20, y); y+=10;
        doc.text(`Corporate Tax (${rules.corporateRate}%): ${formatCurrency(businessCalculation.taxAmount, rules.symbol)}`, 20, y); y+=10;
        doc.setFontSize(14);
        doc.text(`Net Profit: ${formatCurrency(businessCalculation.netProfit, rules.symbol)}`, 20, y+10);
        doc.save(`Business_Tax_Report_${fiscalYear}.pdf`);
    } else {
        doc.setFontSize(20);
        doc.text("Personal Income Tax Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Country: ${rules.name} | Year: ${fiscalYear}`, 20, 30);
        
        let y = 45;
        doc.text(`Total Income: ${rules.symbol}${calculation.projectedIncome.toLocaleString()}`, 30, y); y+=10;
        doc.text(`Taxable Income: ${rules.symbol}${calculation.taxableIncome.toLocaleString()}`, 30, y); y+=10;
        doc.text(`Tax Payable: ${rules.symbol}${calculation.taxPayable.toLocaleString()}`, 30, y); y+=10;
        doc.text(`Effective Rate: ${calculation.effectiveRate.toFixed(2)}%`, 30, y);
        doc.save(`Income_Tax_Report_${fiscalYear}.pdf`);
    }
  };

  // --- DESCRIPTION HELPER ---
  const getDescription = () => {
      if (defaultMode === 'income') {
          return "Estimate your annual tax liability based on income sources, deductions, and tax brackets for your selected country. Plan scenarios to optimize tax savings.";
      } else if (defaultMode === 'business') {
          return "Corporate tax estimation tool. Input revenue, COGS, and operating expenses to determine taxable income and net profit.";
      } else if (defaultMode === 'vat') {
          return "Quickly calculate Value Added Tax or Goods and Services Tax for invoices. Toggle between inclusive/exclusive rates and generate itemized breakdowns.";
      }
      return "";
  };

  // --- View Mode: VAT ---
  if (defaultMode === 'vat') {
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none pt-6 px-4 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-0.5">
                                {rules.vatName} Calculator
                            </h2>
                            <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                                Sales Tax & VAT
                            </h1>
                        </div>
                    </div>
                    {/* Country Selector */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
                        >
                            <span className="text-lg">{rules.flag}</span> {rules.id} <ChevronDown size={14} />
                        </button>
                        {isCountryDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-40 z-50 animate-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {Object.values(TAX_RULES).map(c => (
                                        <button 
                                            key={c.id}
                                            onClick={() => { setSelectedCountry(c.id); setIsCountryDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                                        >
                                            <span className="text-lg">{c.flag}</span> {c.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* VAT Mode Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setVatTab('quick')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vatTab === 'quick' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500'}`}
                    >
                        <Calculator size={14} /> Quick Calc
                    </button>
                    <button 
                        onClick={() => setVatTab('invoice')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${vatTab === 'invoice' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500'}`}
                    >
                        <List size={14} /> Itemized Invoice
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28 space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {/* Description Block */}
                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
                        <Info size={14} className="text-orange-500" /> Tool Info
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {getDescription()}
                    </p>
                </div>

                {/* Result Summary Card (Adaptive) */}
                <Card className="p-5 bg-gradient-to-br from-orange-500 to-red-600 text-white border-none shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs text-orange-100 font-bold uppercase mb-1">Total Gross</p>
                            <h2 className="text-4xl font-bold">{formatCurrency(vatTab === 'quick' ? vatResults.quick.gross : vatResults.invoice.gross, rules.symbol)}</h2>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg"><Receipt size={24} /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-[10px] text-orange-100 font-bold uppercase">Net Amount</p>
                            <p className="font-bold text-lg">{formatCurrency(vatTab === 'quick' ? vatResults.quick.net : vatResults.invoice.net, rules.symbol)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-orange-100 font-bold uppercase">Total Tax</p>
                            <p className="font-bold text-lg text-white">{formatCurrency(vatTab === 'quick' ? vatResults.quick.tax : vatResults.invoice.tax, rules.symbol)}</p>
                        </div>
                    </div>
                </Card>

                {vatTab === 'quick' ? (
                    <Card className="p-4 bg-white dark:bg-slate-800">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Base Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{rules.symbol}</span>
                                    <input 
                                        type="number" 
                                        value={vatAmount} 
                                        onChange={(e) => setVatAmount(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 text-lg font-bold outline-none focus:border-orange-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">{rules.vatName} Rate (%)</label>
                                <div className="flex gap-2 mb-2 overflow-x-auto hide-scrollbar">
                                    {[rules.vatRate, 5, 8, 10, 12, 15, 18, 20].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b).map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setVatRate(r)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vatRate === r ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {r}%
                                        </button>
                                    ))}
                                </div>
                                <input 
                                    type="number" 
                                    value={vatRate} 
                                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Amount is Tax Inclusive?</span>
                                <button 
                                    onClick={() => setVatInclusive(!vatInclusive)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${vatInclusive ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${vatInclusive ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    /* INVOICE MODE */
                    <div className="space-y-4">
                        <Card className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><User size={12}/> Invoice Header</h4>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">From (Your Business)</label>
                                        <input className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={invoiceMeta.from} onChange={e => setInvoiceMeta({...invoiceMeta, from: e.target.value})} placeholder="My Company Ltd" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">To (Client)</label>
                                        <input className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={invoiceMeta.to} onChange={e => setInvoiceMeta({...invoiceMeta, to: e.target.value})} placeholder="Client Name" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Invoice #</label>
                                        <div className="relative">
                                            <Hash size={10} className="absolute left-2 top-2.5 text-slate-400" />
                                            <input className="w-full bg-slate-50 dark:bg-slate-900 p-2 pl-6 rounded-lg text-xs font-bold outline-none" value={invoiceMeta.number} onChange={e => setInvoiceMeta({...invoiceMeta, number: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Date</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={invoiceMeta.date} onChange={e => setInvoiceMeta({...invoiceMeta, date: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-3">
                            <button onClick={addVatItem} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs">
                                <Plus size={14} /> Add Item
                            </button>
                            {vatItems.length > 0 && (
                                <button onClick={() => setVatItems([])} className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-500 font-bold rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs">
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {vatResults.invoice.items.map((item) => (
                                <Card key={item.id} className="p-3 border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <input 
                                            className="font-bold text-sm bg-transparent outline-none text-slate-900 dark:text-white flex-1"
                                            value={item.name}
                                            onChange={(e) => updateVatItem(item.id, 'name', e.target.value)}
                                            placeholder="Item Name"
                                        />
                                        <button onClick={() => removeVatItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Price</label>
                                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={item.amount||''} onChange={e => updateVatItem(item.id, 'amount', parseFloat(e.target.value)||0)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Qty</label>
                                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={item.quantity||''} onChange={e => updateVatItem(item.id, 'quantity', parseFloat(e.target.value)||0)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Tax %</label>
                                            <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-bold outline-none" value={item.rate} onChange={e => updateVatItem(item.id, 'rate', parseFloat(e.target.value)||0)} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={() => updateVatItem(item.id, 'inclusive', !item.inclusive)} className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.inclusive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.inclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                                        </button>
                                        <div className="text-xs text-right">
                                            <span className="text-slate-400">Tax: {formatCurrency(item.tax, rules.symbol)}</span>
                                            <span className="font-bold ml-2 text-slate-900 dark:text-white">{formatCurrency(item.gross, rules.symbol)}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={handleExport} className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                    <Download size={18} /> Export {vatTab === 'invoice' ? 'Invoice PDF' : 'Receipt'}
                </button>
            </div>
        </div>
      );
  }

  // --- View Mode: Business & Income ---
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none pt-6 px-4 pb-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-20 border-b border-slate-200 dark:border-white/5">
        <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                        {defaultMode === 'business' ? 'Business' : 'Personal'} Tax
                    </h2>
                    <h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white flex items-center gap-2">
                        {defaultMode === 'business' ? 'Corporate' : 'Income'} Calculator
                    </h1>
                </div>
            </div>
            
            {/* Country Selector */}
            <div className="relative">
                <button 
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
                >
                    <span className="text-lg">{rules.flag}</span> {rules.id} <ChevronDown size={14} />
                </button>
                {isCountryDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCountryDropdownOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 w-40 z-50 animate-in slide-in-from-top-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {Object.values(TAX_RULES).map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => { setSelectedCountry(c.id); setIsCountryDropdownOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                                >
                                    <span className="text-lg">{c.flag}</span> {c.name}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0">
            {[
                { id: 'input', label: 'Inputs', icon: FileText },
                { id: 'results', label: 'Results', icon: PieChart },
                { id: 'scenarios', label: 'Planning', icon: RefreshCcw },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-3 text-xs font-bold border-b-2 transition-colors ${
                        activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-28">
        
        {/* Description Block */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
                <Info size={14} className="text-indigo-500" /> Tool Info
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {getDescription()}
            </p>
        </div>

        {/* === INPUT TAB === */}
        {activeTab === 'input' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {/* Configuration */}
                <Card className="p-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Globe size={18} /></div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Tax Profile</h3>
                            <p className="text-xs text-slate-500">Rules loaded for {rules.name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fiscal Year</label>
                            <select 
                                value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold outline-none"
                            >
                                <option>2023-2024</option>
                                <option>2024-2025</option>
                                <option>2025-2026</option>
                            </select>
                        </div>
                        {defaultMode === 'income' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Input Mode</label>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                    <button 
                                        onClick={() => toggleFrequency('monthly')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors ${inputFrequency === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        onClick={() => toggleFrequency('yearly')}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors ${inputFrequency === 'yearly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                        )}
                        {defaultMode !== 'income' && (
                            <div className="flex items-end">
                                <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-2.5 rounded-lg w-full text-center border border-slate-200 dark:border-slate-700">
                                    Starts {rules.fiscalYearStart}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {defaultMode === 'business' ? (
                    /* BUSINESS INPUTS */
                    <>
                        <Card className="p-4 border-l-4 border-l-indigo-500">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 mb-4">
                                <Factory size={16} className="text-indigo-500" /> Revenue & Costs
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Gross Revenue</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">{rules.symbol}</span>
                                        <input 
                                            type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-8 text-sm font-bold outline-none"
                                            value={bizRevenue || ''} onChange={e => setBizRevenue(parseFloat(e.target.value)||0)} placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cost of Goods Sold (COGS)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">{rules.symbol}</span>
                                        <input 
                                            type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-8 text-sm font-bold outline-none"
                                            value={bizCOGS || ''} onChange={e => setBizCOGS(parseFloat(e.target.value)||0)} placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 border-l-4 border-l-orange-500">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                    <LayoutDashboard size={16} className="text-orange-500" /> Operating Expenses
                                </h3>
                                <button onClick={addBizExpense} className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-orange-100">
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {bizExpenses.map(exp => (
                                    <div key={exp.id} className="flex gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <input className="flex-1 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none" value={exp.name} onChange={e => updateEntry(bizExpenses, setBizExpenses, exp.id, 'name', e.target.value)} placeholder="Expense Name" />
                                        <div className="relative w-28">
                                            <span className="absolute left-2 top-2 text-xs text-slate-400 font-bold">{rules.symbol}</span>
                                            <input type="number" className="w-full bg-white dark:bg-slate-800 border rounded-lg p-2 pl-6 text-xs font-bold outline-none" value={exp.amount||''} onChange={e => updateEntry(bizExpenses, setBizExpenses, exp.id, 'amount', parseFloat(e.target.value)||0)} placeholder="0" />
                                        </div>
                                        <button onClick={() => removeEntry(bizExpenses, setBizExpenses, exp.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-4 border-l-4 border-l-blue-500">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 mb-4">
                                <Shield size={16} className="text-blue-500" /> Depreciation & Other
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Depreciation</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold outline-none" value={bizDepreciation||''} onChange={e => setBizDepreciation(parseFloat(e.target.value)||0)} placeholder="0" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Other Income</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold outline-none" value={bizOtherIncome||''} onChange={e => setBizOtherIncome(parseFloat(e.target.value)||0)} placeholder="0" />
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    /* PERSONAL INPUTS */
                    <>
                        <Card className="p-4 border-l-4 border-l-emerald-500">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                    <Briefcase size={16} className="text-emerald-500" /> {inputFrequency === 'monthly' ? 'Monthly Income' : 'Annual Income'}
                                </h3>
                                <button onClick={addIncome} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {incomeSources.map((inc) => (
                                    <div key={inc.id} className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex gap-2 items-center">
                                            <select 
                                                className="w-1/3 bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                                                value={inc.category}
                                                onChange={e => updateEntry(incomeSources, setIncomeSources, inc.id, 'category', e.target.value)}
                                            >
                                                {rules.incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-2 text-xs text-slate-400 font-bold">{rules.symbol}</span>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-6 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                                                    value={inc.amount || ''}
                                                    onChange={e => updateEntry(incomeSources, setIncomeSources, inc.id, 'amount', parseFloat(e.target.value)||0)}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <button onClick={() => removeEntry(incomeSources, setIncomeSources, inc.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <input 
                                            className="w-full bg-transparent text-[10px] text-slate-500 outline-none px-1"
                                            value={inc.name}
                                            onChange={e => updateEntry(incomeSources, setIncomeSources, inc.id, 'name', e.target.value)}
                                            placeholder="Description (Optional)"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-500">Total {inputFrequency === 'monthly' ? 'Monthly' : 'Annual'}</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(incomeSources.reduce((s, i) => s + i.amount, 0), rules.symbol)}</span>
                            </div>
                        </Card>

                        <Card className="p-4 border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                    <Shield size={16} className="text-blue-500" /> {inputFrequency === 'monthly' ? 'Monthly Deductions' : 'Annual Deductions'}
                                </h3>
                                <button onClick={addDeduction} className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                    <Plus size={12} /> Add
                                </button>
                            </div>

                            <div className="space-y-2">
                                {rules.standardDeduction > 0 && (
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                            <Check size={12} /> Standard Deduction (Annual)
                                        </span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(rules.standardDeduction, rules.symbol)}</span>
                                    </div>
                                )}

                                {deductions.map(ded => (
                                    <div key={ded.id} className="flex gap-2 items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <select 
                                            className="flex-1 bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 outline-none"
                                            value={ded.category}
                                            onChange={e => updateEntry(deductions, setDeductions, ded.id, 'category', e.target.value)}
                                        >
                                            {rules.deductionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <div className="relative w-28">
                                            <span className="absolute left-2 top-2 text-xs text-slate-400 font-bold">{rules.symbol}</span>
                                            <input 
                                                type="number"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-6 text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                                                value={ded.amount || ''}
                                                onChange={e => updateEntry(deductions, setDeductions, ded.id, 'amount', parseFloat(e.target.value)||0)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <button onClick={() => removeEntry(deductions, setDeductions, ded.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}
                
                <div className="flex justify-center pt-2">
                    <button 
                        onClick={() => setActiveTab('results')}
                        className="w-full bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Calculate Tax <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* === RESULTS TAB === */}
        {activeTab === 'results' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                
                {defaultMode === 'business' ? (
                    /* BUSINESS RESULTS */
                    <>
                        <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-none shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Estimated Corporate Tax</p>
                                        <h2 className="text-3xl font-bold">{formatCurrency(businessCalculation.taxAmount, rules.symbol)}</h2>
                                        <p className="text-xs text-indigo-300 mt-1">@ {rules.corporateRate}% Rate</p>
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-lg"><Building2 size={24} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Net Profit</p>
                                        <p className="font-bold text-lg text-emerald-400">{formatCurrency(businessCalculation.netProfit, rules.symbol)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Net Margin</p>
                                        <p className="font-bold text-lg">{businessCalculation.netMargin.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Profit & Loss Waterfall</h3>
                            <div className="h-48 relative">
                                <Bar 
                                    data={{
                                        labels: ['Revenue', 'COGS', 'Op. Exp', 'EBITDA', 'Depr.', 'Tax', 'Net Profit'],
                                        datasets: [{
                                            label: 'Amount',
                                            data: [
                                                businessCalculation.projectedRevenue, 
                                                -bizCOGS, 
                                                -businessCalculation.totalOpExpenses,
                                                businessCalculation.ebitda,
                                                -bizDepreciation,
                                                -businessCalculation.taxAmount,
                                                businessCalculation.netProfit
                                            ],
                                            backgroundColor: (ctx) => {
                                                const v = ctx.raw as number;
                                                return v >= 0 ? '#10b981' : '#ef4444';
                                            },
                                            borderRadius: 4
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </Card>
                    </>
                ) : (
                    /* PERSONAL RESULTS */
                    <>
                        <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                                            {inputFrequency === 'monthly' ? 'Monthly Tax Liability' : 'Annual Tax Liability'}
                                        </p>
                                        <h2 className="text-3xl font-bold">
                                            {formatCurrency(inputFrequency === 'monthly' ? calculation.monthlyTax : calculation.taxPayable, rules.symbol)}
                                        </h2>
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-lg"><Landmark size={24} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Effective Rate</p>
                                        <p className="font-bold text-lg">{calculation.effectiveRate.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Net Income</p>
                                        <p className="font-bold text-lg text-emerald-400">
                                            {formatCurrency(inputFrequency === 'monthly' ? calculation.monthlyNet : calculation.netIncome, rules.symbol)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Monthly Breakdown Card */}
                        <Card className="p-4 mt-4 bg-white dark:bg-slate-800 border-l-4 border-l-teal-500">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                    <Calendar size={16} className="text-teal-500" /> Monthly Breakdown
                                </h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-100 dark:divide-slate-700">
                                <div className="px-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Gross</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(calculation.monthlyIncome, rules.symbol)}</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tax</p>
                                    <p className="font-bold text-red-500 text-sm">-{formatCurrency(calculation.monthlyTax, rules.symbol)}</p>
                                </div>
                                <div className="px-2">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Net Hand</p>
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(calculation.monthlyNet, rules.symbol)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Tax Slabs Breakdown</h3>
                            <div className="space-y-3">
                                {calculation.slabBreakdown.length > 0 ? calculation.slabBreakdown.map((slab, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{slab.range}</span>
                                            <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span> {slab.rate}% Rate</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(slab.tax, rules.symbol)}</div>
                                            <div className="text-[10px] text-slate-400">on {formatCurrency(slab.incomeInSlab, rules.symbol)}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-slate-400 text-center">No tax liability (Income below threshold)</p>
                                )}
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-4">Income Distribution</h3>
                            <div className="h-48 flex justify-center">
                                <Doughnut 
                                    data={{
                                        labels: ['Net Income', 'Tax', 'Deductions'],
                                        datasets: [{
                                            data: [calculation.netIncome, calculation.taxPayable, calculation.totalDeductions],
                                            backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }, cutout: '65%' }}
                                />
                            </div>
                        </Card>
                    </>
                )}

                <button onClick={handleExport} className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                    <Download size={18} /> Export Report (PDF)
                </button>
            </div>
        )}

        {/* === SCENARIOS TAB === */}
        {activeTab === 'scenarios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {defaultMode === 'business' ? (
                    <>
                        <Card className="p-5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target size={20} className="text-indigo-500" /> Profitability Simulator
                            </h3>
                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Revenue Growth</label>
                                        <span className="text-sm font-bold text-emerald-600">{bizScenarioRevAdj > 0 ? '+' : ''}{bizScenarioRevAdj}%</span>
                                    </div>
                                    <input type="range" min="-50" max="50" step="5" value={bizScenarioRevAdj} onChange={e => setBizScenarioRevAdj(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Expense Change</label>
                                        <span className="text-sm font-bold text-red-600">{bizScenarioExpAdj > 0 ? '+' : ''}{bizScenarioExpAdj}%</span>
                                    </div>
                                    <input type="range" min="-20" max="50" step="5" value={bizScenarioExpAdj} onChange={e => setBizScenarioExpAdj(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                            </div>
                        </Card>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4 bg-slate-100 dark:bg-slate-800">
                                <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">New Net Profit</span>
                                <div className={`text-xl font-bold ${businessCalculation.netProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                                    {formatCurrency(businessCalculation.netProfit, rules.symbol)}
                                </div>
                            </Card>
                            <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20">
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Tax Liability</span>
                                <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                                    {formatCurrency(businessCalculation.taxAmount, rules.symbol)}
                                </div>
                            </Card>
                        </div>
                    </>
                ) : (
                    <>
                        <Card className="p-5 border-l-4 border-l-fuchsia-500 bg-white dark:bg-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 rounded-lg"><RefreshCcw size={20} /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tax Simulator</h3>
                                    <p className="text-xs text-slate-500">Test changes to optimize your liability</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Income Change</label>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{scenarioIncomeAdj > 0 ? '+' : ''}{scenarioIncomeAdj}%</span>
                                    </div>
                                    <input 
                                        type="range" min="-20" max="50" step="5"
                                        value={scenarioIncomeAdj} onChange={e => setScenarioIncomeAdj(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Extra Deductions</label>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(scenarioInvestAdj, rules.symbol)}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1000000" step="50000"
                                        value={scenarioInvestAdj} onChange={e => setScenarioInvestAdj(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2">Invest in tax-saving instruments</p>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4 bg-slate-100 dark:bg-slate-800">
                                <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Projected Tax</span>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(calculation.taxPayable, rules.symbol)}
                                </div>
                            </Card>
                            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Effective Rate</span>
                                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                    {calculation.effectiveRate.toFixed(2)}%
                                </div>
                            </Card>
                        </div>
                    </>
                )}

                <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20">
                    <div className="flex gap-3">
                        <Lightbulb className="text-amber-500 shrink-0 mt-1" size={18} />
                        <div>
                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">AI Tax Tips</h4>
                            <ul className="space-y-2">
                                <li className="text-xs text-slate-700 dark:text-slate-300 leading-snug">• Consider strategic investments to maximize your deductions under local laws.</li>
                                {defaultMode === 'business' ? (
                                    <li className="text-xs text-slate-700 dark:text-slate-300 leading-snug">• Review depreciation schedules for fixed assets to lower taxable income legally.</li>
                                ) : (
                                    <li className="text-xs text-slate-700 dark:text-slate-300 leading-snug">• If your effective rate is high (>20%), look into retirement fund contributions.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
};
