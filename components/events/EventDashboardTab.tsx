
import React from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/calculations';
import { Doughnut } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import { Download, Share2 } from 'lucide-react';
import { EventData } from '../../types';

interface EventDashboardTabProps {
  event: EventData;
  totalSpent: number;
  remaining: number;
  currencySymbol: string;
}

export const EventDashboardTab: React.FC<EventDashboardTabProps> = ({ event, totalSpent, remaining, currencySymbol }) => {
    const categoryTotals = event.categories.map((c: any) => ({
        name: c.name,
        value: event.expenses.filter((e: any) => e.category === c.name).reduce((sum: number, e: any) => sum + e.amount, 0),
        color: c.color
    })).filter((c: any) => c.value > 0);

    const chartData = {
        labels: categoryTotals.map((c: any) => c.name),
        datasets: [{
            data: categoryTotals.map((c: any) => c.value),
            backgroundColor: categoryTotals.map((c: any) => c.color),
            borderWidth: 0
        }]
    };

    // Vendor stats for dashboard
    const vendorStats = event.vendors.reduce((acc: any, v: any) => ({
        total: acc.total + v.totalAmount,
        paid: acc.paid + v.paidAmount
    }), { total: 0, paid: 0 });
    const vendorProgress = vendorStats.total > 0 ? (vendorStats.paid / vendorStats.total) * 100 : 0;

    const handleShare = async () => {
        const shareData = {
            title: `Event Plan: ${event.name}`,
            text: `Event: ${event.name}\nType: ${event.type}\nDate: ${new Date(event.date).toLocaleDateString()}\nLocation: ${event.location}\nBudget: ${currencySymbol}${event.totalBudget.toLocaleString()}\nRemaining: ${currencySymbol}${remaining.toLocaleString()}\n\nManaged with BudgetFlow.`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.text);
                alert('Event details copied to clipboard!');
            } catch (err) {
                console.error('Copy failed', err);
                alert('Could not share event.');
            }
        }
    };

    const handleExport = () => {
        const doc = new jsPDF();
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const checkPageBreak = (needed: number) => {
            if (y + needed > pageHeight - 15) {
                doc.addPage();
                y = 20;
            }
        };

        // Title
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text(event.name, 20, y);
        y += 8;

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${event.type} • ${new Date(event.date).toLocaleDateString()} • ${event.location}`, 20, y);
        y += 15;

        // --- FINANCIAL SUMMARY BOX ---
        doc.setFillColor(245, 247, 250);
        doc.setDrawColor(230, 230, 230);
        doc.rect(20, y, 170, 25, 'F');
        doc.rect(20, y, 170, 25, 'S');
        
        let boxY = y + 8;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Total Budget", 30, boxY); 
        doc.text("Total Spent", 80, boxY); 
        doc.text("Remaining", 130, boxY);
        
        boxY += 10;
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${currencySymbol}${event.totalBudget.toLocaleString()}`, 30, boxY);
        doc.text(`${currencySymbol}${totalSpent.toLocaleString()}`, 80, boxY);
        
        const remColor = remaining >= 0 ? [16, 185, 129] : [239, 68, 68]; // Green or Red
        doc.setTextColor(remColor[0], remColor[1], remColor[2]);
        doc.text(`${currencySymbol}${remaining.toLocaleString()}`, 130, boxY);
        
        y += 35;

        // --- BUDGET BREAKDOWN TABLE ---
        checkPageBreak(60);
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.text("Budget Breakdown", 20, y);
        y += 8;

        // Table Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text("Category", 25, y);
        doc.text("Allocated", 80, y);
        doc.text("Spent", 120, y);
        doc.text("Status", 160, y);
        y += 10;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        event.categories.forEach((cat: any) => {
            checkPageBreak(10);
            const spent = event.expenses.filter((e: any) => e.category === cat.name).reduce((sum: number, e: any) => sum + e.amount, 0);
            const status = spent > cat.allocated ? 'Over' : `${Math.round((spent/cat.allocated)*100)}%`;
            
            doc.text(cat.name, 25, y);
            doc.text(`${currencySymbol}${cat.allocated.toLocaleString()}`, 80, y);
            doc.text(`${currencySymbol}${spent.toLocaleString()}`, 120, y);
            
            if(status === 'Over') doc.setTextColor(220, 0, 0);
            else doc.setTextColor(0, 150, 0);
            doc.text(status, 160, y);
            doc.setTextColor(0);
            
            y += 8;
        });
        y += 10;

        // --- VENDORS SECTION ---
        checkPageBreak(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Vendors & Payments", 20, y);
        y += 8;

        // Vendor Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text("Vendor", 25, y);
        doc.text("Service", 70, y);
        doc.text("Cost", 110, y);
        doc.text("Paid", 140, y);
        doc.text("Status", 170, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);

        if (event.vendors.length === 0) {
            doc.text("- No vendors recorded -", 25, y);
            y += 10;
        } else {
            event.vendors.forEach((v: any) => {
                checkPageBreak(10);
                doc.text(v.name, 25, y);
                doc.text(v.service, 70, y);
                doc.text(`${currencySymbol}${v.totalAmount.toLocaleString()}`, 110, y);
                doc.text(`${currencySymbol}${v.paidAmount.toLocaleString()}`, 140, y);
                
                doc.setFont('helvetica', 'bold');
                if (v.status === 'paid') doc.setTextColor(0, 150, 0);
                else if (v.status === 'partial') doc.setTextColor(200, 100, 0);
                else doc.setTextColor(100);
                
                doc.text(v.status.toUpperCase(), 170, y);
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
                y += 8;
            });
        }
        y += 10;

        // --- EXPENSE LOG ---
        checkPageBreak(60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Expense Log", 20, y);
        y += 8;

        // Expense Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y-5, 170, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text("Date", 25, y);
        doc.text("Item", 55, y);
        doc.text("Category", 110, y);
        doc.text("Amount", 170, y, {align: 'right'});
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0);

        if (event.expenses.length === 0) {
            doc.text("- No expenses recorded -", 25, y);
            y += 10;
        } else {
            const sortedExpenses = [...event.expenses].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            sortedExpenses.forEach((exp: any) => {
                checkPageBreak(10);
                doc.text(new Date(exp.date).toLocaleDateString(), 25, y);
                doc.text(exp.name.substring(0, 25) + (exp.name.length > 25 ? '...' : ''), 55, y);
                doc.text(exp.category, 110, y);
                doc.text(`${currencySymbol}${exp.amount.toLocaleString()}`, 170, y, {align: 'right'});
                y += 8;
            });
        }
        y += 10;

        // --- TEAM ---
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Event Team", 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const membersStr = event.members.map((m: any) => `${m.name} (${m.role})`).join(', ');
        doc.text(membersStr, 20, y, {maxWidth: 170});

        // --- FOOTER ---
        const pageCount = (doc.internal as any).getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Generated by BudgetFlow • Page ${i} of ${pageCount}`, 105, 290, {align: 'center'});
        }

        doc.save(`${event.name}_Full_Report.pdf`);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                    <div className="text-xs font-bold opacity-80 uppercase mb-1">Remaining</div>
                    <div className="text-2xl font-bold truncate">{formatCurrency(remaining, currencySymbol)}</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white truncate">{formatCurrency(totalSpent, currencySymbol)}</div>
                </Card>
            </div>

            {/* Vendor Overview Card */}
            <Card className="p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Vendor Payments</h3>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(vendorStats.paid, currencySymbol)} <span className="text-slate-400 font-normal">/ {formatCurrency(vendorStats.total, currencySymbol)}</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(vendorProgress, 100)}%` }}
                    ></div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pending</span>
                        <div className="text-sm font-bold text-orange-500">{formatCurrency(vendorStats.total - vendorStats.paid, currencySymbol)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Paid</span>
                        <div className="text-sm font-bold text-emerald-500">{Math.round(vendorProgress)}%</div>
                    </div>
                </div>
            </Card>

            <Card className="p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Category Breakdown</h3>
                <div className="h-40 relative flex items-center justify-center">
                    {categoryTotals.length > 0 ? (
                        <Doughnut data={chartData} options={{plugins: {legend: {display: false}}, cutout: '70%', maintainAspectRatio: false}} />
                    ) : (
                        <div className="text-center text-slate-400 text-xs py-8">No expenses recorded yet</div>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {categoryTotals.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{c.name}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleExport} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Download size={16} /> Export Report
                 </button>
                 <button onClick={handleShare} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <Share2 size={16} /> Share Event
                 </button>
            </div>
        </div>
    );
};
