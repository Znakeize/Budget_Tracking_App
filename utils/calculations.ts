
import { BudgetData, ShoppingListData, SharedGroup, InvestmentAlert, InvestmentItem } from '../types';

export const calculateTotals = (data: BudgetData) => {
  const totalIncome = data.income.reduce((sum, item) => sum + item.actual, 0);
  
  // Actual Spending (Money that has left the account)
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.spent, 0);
  const totalSavings = data.savings.reduce((sum, item) => sum + item.amount, 0); // Amount accumulated this period
  
  const actualBills = data.bills.reduce((sum, item) => item.paid ? sum + item.amount : sum, 0);
  const actualDebts = data.debts.reduce((sum, item) => item.paid ? sum + item.payment : sum, 0);
  const actualGoals = data.goals.reduce((sum, item) => item.checked ? sum + item.monthly : sum, 0);
  // Use monthly contribution if contributed, otherwise 0. 
  // Note: Investment item.amount is total value, item.monthly is the flow.
  const actualInvestments = data.investments.reduce((sum, item) => item.contributed ? sum + (item.monthly || 0) : sum, 0);

  // Obligations / Planned (For Budgeting "Left to Spend" logic)
  const totalBills = data.bills.reduce((sum, item) => sum + item.amount, 0);
  const totalDebts = data.debts.reduce((sum, item) => sum + item.payment, 0);
  const totalGoals = data.goals.reduce((sum, item) => sum + item.monthly, 0);
  const plannedInvestments = data.investments.reduce((sum, item) => sum + (item.monthly || 0), 0);
  
  // Portfolio Value (Asset Stock)
  const totalPortfolioValue = data.investments.reduce((sum, item) => sum + item.amount, 0);

  // Budgeted (Planned) amounts from Budget View
  const plannedIncome = data.income.reduce((sum, item) => sum + item.planned, 0);
  const budgetedExpenses = data.expenses.reduce((sum, item) => sum + item.budgeted, 0);
  const plannedSavings = data.savings.reduce((sum, item) => sum + item.planned, 0);

  // Total Out for "Left to Spend"
  // Represents Total Expenses (Actual) + Obligations (Bills/Debt/Goals/Inv) + Savings (Actual)
  // We use Obligations even if not paid yet to reserve that money.
  const totalOut = totalExpenses + totalBills + totalDebts + totalSavings + plannedInvestments + totalGoals;
  
  const leftToSpend = (data.rollover || 0) + totalIncome - totalOut;
  const availableToBudget = (data.rollover || 0) + totalIncome - budgetedExpenses - totalBills - totalDebts - totalSavings - plannedInvestments - totalGoals;

  return {
    totalIncome,
    totalExpenses,
    totalBills,
    totalDebts,
    totalSavings,
    totalInvestments: plannedInvestments, // Used for Cash Flow planning
    totalGoals,
    totalOut,
    leftToSpend,
    availableToBudget,
    plannedIncome,
    budgetedExpenses,
    plannedSavings,
    
    // New Actuals for Charts
    actualBills,
    actualDebts,
    actualGoals,
    actualInvestments,
    totalPortfolioValue
  };
};

export const formatCurrency = (amount: number, symbol: string, compact: boolean = false) => {
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount).replace('$', symbol);
  }
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export interface NotificationItem {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  message: string;
  date: string;
  category: 'Bill' | 'Debt' | 'Budget' | 'Savings' | 'System' | 'Event' | 'Shopping' | 'Collaboration' | 'Investment';
  actionLabel?: string;
  data?: any; // Stores context like listId, shopId for navigation
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
      const currentSavings = currentTotals.totalSavings + currentTotals.actualInvestments;
      
      // Compare to previous period
      const sortedHistory = [...history].sort((a, b) => b.created - a.created);
      const prevData = sortedHistory.find(h => h.id !== data.id); // Ensure we don't compare to self if history contains current
      
      if (prevData) {
          const prevTotals = calculateTotals(prevData);
          const prevSavings = prevTotals.totalSavings + prevTotals.actualInvestments;
          
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

export const getShoppingNotifications = (lists: ShoppingListData[]): NotificationItem[] => {
    const notifs: NotificationItem[] = [];
    const todayObj = new Date();
    const todayStr = todayObj.toISOString().split('T')[0];
    const dayOfWeek = todayObj.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

    lists.forEach(list => {
        // 1. Personal Reminders / Due Dates
        let overdueCount = 0;
        let dueTodayCount = 0;

        list.shops.forEach(shop => {
            shop.items.forEach(item => {
                if (!item.checked && item.dueDate) {
                    if (item.dueDate < todayStr) {
                        overdueCount++;
                    } else if (item.dueDate === todayStr) {
                        dueTodayCount++;
                        // Specific Item Reminder
                        notifs.push({
                            id: `shop-due-${item.id}`,
                            type: 'warning',
                            message: `Buy ${item.name} today! (${shop.name})`,
                            date: todayStr,
                            category: 'Shopping',
                            actionLabel: 'View Item',
                            data: { listId: list.id, shopId: shop.id }
                        });
                    }
                }
            });
        });

        if (overdueCount > 0) {
            notifs.push({
                id: `shop-overdue-${list.id}`,
                type: 'danger',
                message: `You have ${overdueCount} overdue items in ${list.name}`,
                date: todayStr,
                category: 'Shopping',
                actionLabel: 'Check List',
                data: { listId: list.id }
            });
        }

        // 2. Shared List Updates (Mock Logic)
        if (list.members.length > 1) {
             const isRecentlyModified = list.lastModified && (Date.now() - list.lastModified) < 86400000; // 24h
             if (isRecentlyModified) {
                 notifs.push({
                     id: `shop-shared-${list.id}-${list.lastModified}`,
                     type: 'info',
                     message: `Recent updates in shared list: ${list.name}`,
                     date: todayStr,
                     category: 'Shopping',
                     actionLabel: 'See Changes',
                     data: { listId: list.id }
                 });
             }
        }

        // 3. Stale List Warning
        // If list has unchecked items but hasn't been modified in 7 days
        const hasUnchecked = list.shops.some(s => s.items.some(i => !i.checked));
        const isStale = list.lastModified && (Date.now() - list.lastModified) > (7 * 24 * 60 * 60 * 1000);
        if (hasUnchecked && isStale) {
            notifs.push({
                id: `shop-stale-${list.id}`,
                type: 'warning',
                message: `You haven't updated ${list.name} in a while. Time to review?`,
                date: todayStr,
                category: 'Shopping',
                actionLabel: 'Review',
                data: { listId: list.id }
            });
        }

        // 4. Weekend Shopping Nudge (Friday, Saturday, Sunday)
        // Triggers if list name contains 'Grocery' or 'Food' and has unchecked items
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
        const isGroceryList = /grocer|food|market|shop/i.test(list.name);
        if (isWeekend && isGroceryList && hasUnchecked) {
             // Only push if not already stale to avoid double spam
             if (!isStale) {
                 notifs.push({
                     id: `shop-weekend-${list.id}`,
                     type: 'success',
                     message: `Weekend is here! Ready to tackle your ${list.name} run?`,
                     date: todayStr,
                     category: 'Shopping',
                     actionLabel: 'Start Shopping',
                     data: { listId: list.id }
                 });
             }
        }

        // 5. Smart Suggestion (Almost Complete)
        let totalItems = 0;
        let checkedItems = 0;
        list.shops.forEach(s => {
            totalItems += s.items.length;
            checkedItems += s.items.filter(i => i.checked).length;
        });
        
        if (totalItems > 5 && (checkedItems / totalItems) > 0.9 && checkedItems < totalItems) {
             notifs.push({
                 id: `shop-nudge-${list.id}`,
                 type: 'success',
                 message: `Almost done with ${list.name}! Just ${totalItems - checkedItems} items left.`,
                 date: todayStr,
                 category: 'Shopping',
                 actionLabel: 'Finish Now',
                 data: { listId: list.id }
             });
        }
    });

    return notifs;
};

export const getCollaborativeNotifications = (groups: SharedGroup[]): NotificationItem[] => {
    const notifs: NotificationItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    groups.forEach(group => {
        const totalSpent = group.expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const progress = group.totalBudget > 0 ? (totalSpent / group.totalBudget) * 100 : 0;

        if (progress >= 100) {
            notifs.push({
                id: `Group-${group.id}-over`,
                category: 'Collaboration', // Ensure category is correct
                message: `${group.name}: Budget limit exceeded!`,
                type: 'danger',
                date: today,
                data: { groupId: group.id }
            });
        } else if (progress >= 85) {
            notifs.push({
                id: `Group-${group.id}-warn`,
                category: 'Collaboration', // Ensure category is correct
                message: `${group.name}: ${Math.round(progress)}% of budget used.`,
                type: 'warning',
                date: today,
                data: { groupId: group.id }
            });
        }
    });
    return notifs;
};

export const getInvestmentNotifications = (investments: InvestmentItem[], alerts: InvestmentAlert[], currencySymbol: string): NotificationItem[] => {
    const generated: NotificationItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Process User Alerts
    alerts.forEach(alert => {
        if(!alert.active) return;
        const asset = investments.find(i => i.id === alert.assetId || i.name === alert.assetName);
        
        if (alert.type === 'date') {
            if (alert.value === 'Monthly' || alert.value === today) {
                 generated.push({
                     id: `alert-${alert.id}`,
                     type: 'info',
                     message: `${alert.assetName}: ${alert.value} Reminder`,
                     date: today,
                     category: 'Investment'
                 });
            }
        } else if (asset) {
            const val = alert.value as number;
            if (alert.type === 'price_above' && asset.amount >= val) {
                generated.push({
                     id: `alert-${alert.id}`,
                     type: 'success',
                     message: `${asset.name} value is above ${formatCurrency(val, currencySymbol)}`,
                     date: today,
                     category: 'Investment'
                 });
            } else if (alert.type === 'price_below' && asset.amount <= val) {
                generated.push({
                     id: `alert-${alert.id}`,
                     type: 'warning',
                     message: `${asset.name} dropped below ${formatCurrency(val, currencySymbol)}`,
                     date: today,
                     category: 'Investment'
                 });
            }
        }
    });

    // 2. Auto-generated Insights
    const topMover = [...investments].sort((a,b) => {
        const gainA = (a.amount - (a.initialValue || a.amount));
        const gainB = (b.amount - (b.initialValue || b.amount));
        return Math.abs(gainB) - Math.abs(gainA);
    })[0];

    if (topMover) {
        const gain = topMover.amount - (topMover.initialValue || topMover.amount);
        if (Math.abs(gain) > 100) {
             generated.push({
                 id: 'auto-mover',
                 type: gain > 0 ? 'success' : 'danger',
                 message: `${topMover.name} has moved ${formatCurrency(gain, currencySymbol)} all time.`,
                 date: today,
                 category: 'Investment'
             });
        }
    }

    return generated;
};
