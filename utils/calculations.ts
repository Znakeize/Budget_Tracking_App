import { BudgetData } from '../types';

export const calculateTotals = (data: BudgetData) => {
  const totalIncome = data.income.reduce((sum, item) => sum + item.actual, 0);
  
  // Expenses that affect "Left to Spend"
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.spent, 0);
  const totalBills = data.bills.reduce((sum, item) => sum + item.amount, 0);
  const totalDebts = data.debts.reduce((sum, item) => sum + item.payment, 0);
  const totalSavings = data.savings.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestments = data.investments.reduce((sum, item) => sum + item.amount, 0);
  const totalGoals = data.goals.reduce((sum, item) => sum + item.monthly, 0);
  
  // Budgeted (Planned) amounts
  const plannedIncome = data.income.reduce((sum, item) => sum + item.planned, 0);
  const budgetedExpenses = data.expenses.reduce((sum, item) => sum + item.budgeted, 0);
  const plannedSavings = data.savings.reduce((sum, item) => sum + item.planned, 0);

  const totalOut = totalExpenses + totalBills + totalDebts + totalSavings + totalInvestments + totalGoals;
  
  const leftToSpend = (data.rollover || 0) + totalIncome - totalOut;
  const availableToBudget = (data.rollover || 0) + totalIncome - budgetedExpenses - totalBills - totalDebts - totalSavings - totalInvestments - totalGoals;

  return {
    totalIncome,
    totalExpenses,
    totalBills,
    totalDebts,
    totalSavings,
    totalInvestments,
    totalGoals,
    totalOut,
    leftToSpend,
    availableToBudget,
    plannedIncome,
    budgetedExpenses,
    plannedSavings
  };
};

export const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export interface NotificationItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  message: string;
  date: string;
  category: 'Bill' | 'Debt' | 'Budget' | 'Savings';
}

export const getNotifications = (data: BudgetData, history: BudgetData[] = []): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  // Use today's date string for comparison to match input values
  const todayStr = new Date().toISOString().split('T')[0]; 
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // 1. Existing Bill/Debt Due Date Logic
  const checkItem = (item: any, type: 'Bill' | 'Debt') => {
      if (item.paid) return;
      if (!item.dueDate) return;
      
      const dueStr = item.dueDate;
      const due = new Date(dueStr);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dueStr < todayStr) {
          notifications.push({
              id: `${type}-${item.id}`,
              type: 'danger',
              message: `Overdue ${type}: ${item.name}`,
              date: item.dueDate,
              category: type
          });
      } else if (dueStr === todayStr) {
           notifications.push({
              id: `${type}-${item.id}`,
              type: 'warning',
              message: `${type} Due Today: ${item.name}`,
              date: item.dueDate,
              category: type
          });
      } else if (diffDays <= 3 && diffDays > 0) {
           notifications.push({
              id: `${type}-${item.id}`,
              type: 'info',
              message: `${type} Due in ${diffDays} days: ${item.name}`,
              date: item.dueDate,
              category: type
          });
      }
  };

  data.bills.forEach(b => checkItem(b, 'Bill'));
  data.debts.forEach(d => checkItem(d, 'Debt'));

  // 2. Budget Threshold Logic (e.g., "80% through food budget")
  data.expenses.forEach(exp => {
      if (exp.budgeted > 0) {
          const ratio = exp.spent / exp.budgeted;
          if (ratio >= 0.8 && ratio < 1.0) {
              notifications.push({
                  id: `budget-warn-${exp.id}`,
                  type: 'warning',
                  message: `You're ${Math.round(ratio * 100)}% through your ${exp.name} budget.`,
                  date: todayStr,
                  category: 'Budget'
              });
          } else if (ratio >= 1.0) {
              notifications.push({
                  id: `budget-over-${exp.id}`,
                  type: 'danger',
                  message: `You've exceeded your ${exp.name} budget by ${formatCurrency(exp.spent - exp.budgeted, data.currencySymbol)}.`,
                  date: todayStr,
                  category: 'Budget'
              });
          }
      }
  });

  // 3. Anomaly Detection (e.g., "Electricity bill unusually high")
  if (history.length > 0) {
      data.bills.forEach(bill => {
          if (bill.amount > 0) {
              // Get last 3 months of this specific bill
              const billHistory = history
                  .sort((a, b) => b.created - a.created)
                  .slice(0, 3)
                  .map(h => h.bills.find(b => b.name === bill.name))
                  .filter(b => b !== undefined && b.amount > 0);

              if (billHistory.length >= 2) {
                  const avgAmount = billHistory.reduce((sum, b) => sum + b!.amount, 0) / billHistory.length;
                  // If current bill is 20% higher than average
                  if (bill.amount > avgAmount * 1.2) {
                      notifications.push({
                          id: `bill-high-${bill.id}`,
                          type: 'warning',
                          message: `Your ${bill.name} bill is unusually high (${formatCurrency(bill.amount, data.currencySymbol)}) compared to average (${formatCurrency(avgAmount, data.currencySymbol)}).`,
                          date: todayStr,
                          category: 'Bill'
                      });
                  }
              }
          }
      });
  }

  // 4. Savings Progress (e.g., "Saved more this period")
  if (history.length > 0) {
      const currentTotals = calculateTotals(data);
      const currentSavings = currentTotals.totalSavings + currentTotals.totalInvestments;
      
      // Compare to previous period
      const sortedHistory = [...history].sort((a, b) => b.created - a.created);
      const prevData = sortedHistory.find(h => h.id !== data.id); // Ensure we don't compare to self if history contains current
      
      if (prevData) {
          const prevTotals = calculateTotals(prevData);
          const prevSavings = prevTotals.totalSavings + prevTotals.totalInvestments;
          
          const diff = currentSavings - prevSavings;
          if (diff > 0 && currentSavings > 0) {
               notifications.push({
                  id: `savings-win`,
                  type: 'success',
                  message: `You've saved ${formatCurrency(diff, data.currencySymbol)} more this period compared to last!`,
                  date: todayStr,
                  category: 'Savings'
              });
          }
      }
  }

  // Sort by priority (Danger > Warning > Success > Info)
  const priority = { danger: 0, warning: 1, success: 2, info: 3 };

  return notifications.sort((a, b) => {
      if (a.type !== b.type) return priority[a.type] - priority[b.type];
      return a.date.localeCompare(b.date);
  });
};