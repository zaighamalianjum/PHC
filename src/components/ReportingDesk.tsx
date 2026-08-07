import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  DollarSign,
  Users,
  Building2,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info
} from 'lucide-react';

import {
  ErpVendor,
  ErpPurchaseOrder,
  ErpGrn,
  ErpTransaction,
  ErpEmployee,
  ErpPayroll,
  ErpExpense,
  ErpAsset,
  User
} from '../types';

export type ReportType =
  | 'pending_payments'
  | 'payroll_disbursement'
  | 'expense_analysis'
  | 'purchase_orders'
  | 'current_stock'
  | 'minimum_stock'
  | 'required_stock'
  | 'pnl_summary';

interface ReportingDeskProps {
  vendors: ErpVendor[];
  purchaseOrders: ErpPurchaseOrder[];
  grns: ErpGrn[];
  transactions: ErpTransaction[];
  employees: ErpEmployee[];
  payrolls: ErpPayroll[];
  expenses: ErpExpense[];
  assets: ErpAsset[];
  inventoryItems: any[];
  appointments: any[];
  patientVisits: any[];
  posSales: any[];
  currentUser: User | null;
}

export default function ReportingDesk({
  vendors = [],
  purchaseOrders = [],
  grns = [],
  transactions = [],
  employees = [],
  payrolls = [],
  expenses = [],
  assets = [],
  inventoryItems = [],
  appointments = [],
  patientVisits = [],
  posSales = [],
  currentUser
}: ReportingDeskProps) {
  // Active Report Type Selection
  const [activeReport, setActiveReport] = useState<ReportType>('pending_payments');

  // Date Range Filters
  const [datePreset, setDatePreset] = useState<'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year' | 'custom' | 'all'>('this_month');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle Preset Changes
  const handlePresetChange = (preset: typeof datePreset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now.setDate(diffToMon));
      setStartDate(mon.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last_30_days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      setStartDate(new Date(now.getFullYear(), qMonth, 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_year') {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  // Helper check date range
  const isWithinDateRange = (dateStr?: string) => {
    if (!dateStr) return true;
    if (datePreset === 'all') return true;
    const cleanDate = dateStr.slice(0, 10);
    return cleanDate >= startDate && cleanDate <= endDate;
  };

  // Report 1: Pending Vendor Payments
  const pendingPaymentsData = useMemo(() => {
    return vendors
      .map(v => {
        // Calculate GRNs for this vendor
        const vGrns = grns.filter(g => g.VendorID === v.VendorID || g.VendorName === v.VendorName);
        const totalGrnBills = vGrns.reduce((sum, g) => sum + (Number(g.TotalAmount) || 0), 0);

        // Payments made to vendor
        const vPayments = transactions.filter(
          t => (t.VendorID === v.VendorID || t.VendorName === v.VendorName) && t.Type === 'VendorPayment'
        );
        const totalPaid = vPayments.reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);

        const currentBalance = v.Balance !== undefined ? Number(v.Balance) : Math.max(0, totalGrnBills - totalPaid);

        return {
          ...v,
          totalGrnBills,
          totalPaid,
          pendingBalance: currentBalance,
          lastGrnDate: vGrns.length > 0 ? vGrns[0].ReceivedDate : 'N/A'
        };
      })
      .filter(v => {
        const matchesSearch = v.VendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.ContactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.Phone.includes(searchQuery);
        return matchesSearch;
      });
  }, [vendors, grns, transactions, searchQuery]);

  const pendingPaymentsSummary = useMemo(() => {
    const totalOwed = pendingPaymentsData.reduce((sum, v) => sum + (v.pendingBalance > 0 ? v.pendingBalance : 0), 0);
    const vendorsWithDues = pendingPaymentsData.filter(v => v.pendingBalance > 0).length;
    return { totalOwed, vendorsWithDues, totalVendors: pendingPaymentsData.length };
  }, [pendingPaymentsData]);

  // Report 2: Salary Disbursement
  const payrollData = useMemo(() => {
    return payrolls
      .filter(p => {
        const pDate = p.PaymentDate || `${p.MonthYear}-01`;
        return isWithinDateRange(pDate);
      })
      .filter(p => {
        const matchesSearch = p.EmployeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.MonthYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.PayrollID.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
  }, [payrolls, startDate, endDate, datePreset, searchQuery]);

  const payrollSummary = useMemo(() => {
    const totalDisbursed = payrollData.reduce((sum, p) => sum + (Number(p.NetSalary) || 0), 0);
    const totalBasic = payrollData.reduce((sum, p) => sum + (Number(p.BasicSalary) || 0), 0);
    const totalAllowances = payrollData.reduce((sum, p) => sum + (Number(p.Allowances) || 0), 0);
    const totalDeductions = payrollData.reduce((sum, p) => sum + (Number(p.Deductions) || 0), 0);
    return { totalDisbursed, totalBasic, totalAllowances, totalDeductions, recordCount: payrollData.length };
  }, [payrollData]);

  // Report 3: Expense Analysis
  const expenseData = useMemo(() => {
    return expenses
      .filter(e => isWithinDateRange(e.ExpenseDate))
      .filter(e => {
        const matchesSearch = e.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.Category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.ExpenseID.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'all' || e.Category === selectedCategory;
        return matchesSearch && matchesCat;
      });
  }, [expenses, startDate, endDate, datePreset, searchQuery, selectedCategory]);

  const expenseSummary = useMemo(() => {
    const totalExpense = expenseData.reduce((sum, e) => sum + (Number(e.Amount) || 0), 0);
    const byCategory: Record<string, number> = {};
    expenseData.forEach(e => {
      byCategory[e.Category] = (byCategory[e.Category] || 0) + (Number(e.Amount) || 0);
    });
    return { totalExpense, byCategory, count: expenseData.length };
  }, [expenseData]);

  // Report 4: Purchase Orders & GRN Details
  const poData = useMemo(() => {
    return purchaseOrders
      .filter(p => isWithinDateRange(p.OrderDate))
      .filter(p => {
        const matchesSearch = p.POID.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.VendorName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .map(p => {
        const linkedGrn = grns.find(g => g.POID === p.POID);
        return {
          ...p,
          linkedGrn
        };
      });
  }, [purchaseOrders, grns, startDate, endDate, datePreset, searchQuery]);

  const poSummary = useMemo(() => {
    const totalPoAmount = poData.reduce((sum, p) => sum + (Number(p.TotalAmount) || 0), 0);
    const receivedCount = poData.filter(p => p.linkedGrn || p.Status === 'Received').length;
    const pendingCount = poData.length - receivedCount;
    return { totalPoAmount, receivedCount, pendingCount, totalPos: poData.length };
  }, [poData]);

  // Report 5: Current Stock & Inventory Valuation
  const currentStockData = useMemo(() => {
    return inventoryItems.filter(item => {
      const name = item.ItemName || item.name || '';
      const cat = item.Category || item.category || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || cat === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventoryItems, searchQuery, selectedCategory]);

  const currentStockSummary = useMemo(() => {
    let totalItems = currentStockData.length;
    let totalStockUnits = 0;
    let totalPurchaseValuation = 0;
    let totalRetailValuation = 0;

    currentStockData.forEach(i => {
      const cStock = Number(i.CStock) || 0;
      const pPrice = Number(i.PurchasePrice) || Number(i.Price) || 0;
      const rPrice = Number(i.Price) || 0;

      totalStockUnits += cStock;
      totalPurchaseValuation += cStock * pPrice;
      totalRetailValuation += cStock * rPrice;
    });

    return { totalItems, totalStockUnits, totalPurchaseValuation, totalRetailValuation };
  }, [currentStockData]);

  // Report 6: Minimum Stock / Low Stock Alert
  const minimumStockData = useMemo(() => {
    return inventoryItems
      .filter(item => {
        const cStock = Number(item.CStock) || 0;
        const minStock = Number(item.MinStock) || 10;
        return cStock <= minStock;
      })
      .filter(item => {
        const name = item.ItemName || item.name || '';
        const cat = item.Category || item.category || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [inventoryItems, searchQuery]);

  const minimumStockSummary = useMemo(() => {
    const totalOut = minimumStockData.filter(i => (Number(i.CStock) || 0) === 0).length;
    const totalLow = minimumStockData.length - totalOut;
    return { totalLowStock: minimumStockData.length, totalOut, totalLow };
  }, [minimumStockData]);

  // Report 7: Required Stock Quantity Requisition
  const requiredStockData = useMemo(() => {
    return inventoryItems
      .map(item => {
        const cStock = Number(item.CStock) || 0;
        const minStock = Number(item.MinStock) || 10;
        const reorderTarget = Number(item.ReorderQty) || (minStock * 2);
        const requiredQty = Math.max(0, reorderTarget - cStock);
        const unitCost = Number(item.PurchasePrice) || Number(item.Price) || 0;
        const estCost = requiredQty * unitCost;

        return {
          ...item,
          cStock,
          minStock,
          reorderTarget,
          requiredQty,
          unitCost,
          estCost
        };
      })
      .filter(item => item.requiredQty > 0)
      .filter(item => {
        const name = item.ItemName || item.name || '';
        const cat = item.Category || item.category || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [inventoryItems, searchQuery]);

  const requiredStockSummary = useMemo(() => {
    const totalItemsToOrder = requiredStockData.length;
    const totalUnitsRequired = requiredStockData.reduce((sum, i) => sum + i.requiredQty, 0);
    const totalEstCapitalNeeded = requiredStockData.reduce((sum, i) => sum + i.estCost, 0);
    return { totalItemsToOrder, totalUnitsRequired, totalEstCapitalNeeded };
  }, [requiredStockData]);

  // Report 8: P&L Summary Statement
  const pnlSummaryData = useMemo(() => {
    // Inflows
    const apptFees = appointments
      .filter(a => isWithinDateRange(a.AppointmentDate) && a.Status !== 3)
      .reduce((sum, a) => sum + (Number(a.FeeCharged) || 0), 0);

    const posIncome = posSales
      .filter(s => isWithinDateRange(s.InvoiceDate || s.date))
      .reduce((sum, s) => sum + (Number(s.NetPayable || s.GrandTotal || s.totalAmount) || 0), 0);

    const otherIncome = transactions
      .filter(t => isWithinDateRange(t.Date) && t.Type === 'Income')
      .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);

    const totalIncome = apptFees + posIncome + otherIncome;

    // Outflows
    const vendorOutflows = transactions
      .filter(t => isWithinDateRange(t.Date) && t.Type === 'VendorPayment')
      .reduce((sum, t) => sum + (Number(t.Amount) || 0), 0);

    const salaryOutflows = payrolls
      .filter(p => isWithinDateRange(p.PaymentDate || `${p.MonthYear}-01`))
      .reduce((sum, p) => sum + (Number(p.NetSalary) || 0), 0);

    const expenseOutflows = expenses
      .filter(e => isWithinDateRange(e.ExpenseDate))
      .reduce((sum, e) => sum + (Number(e.Amount) || 0), 0);

    const totalExpenses = vendorOutflows + salaryOutflows + expenseOutflows;
    const netProfit = totalIncome - totalExpenses;

    return {
      apptFees,
      posIncome,
      otherIncome,
      totalIncome,
      vendorOutflows,
      salaryOutflows,
      expenseOutflows,
      totalExpenses,
      netProfit
    };
  }, [appointments, posSales, transactions, payrolls, expenses, startDate, endDate, datePreset]);

  // Available Item Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach(i => {
      if (i.Category) set.add(i.Category);
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventoryItems]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let filename = `ERP_Report_${activeReport}_${startDate}_to_${endDate}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReport === 'pending_payments') {
      headers = ['Vendor ID', 'Vendor Name', 'Contact Person', 'Phone', 'Total Bills', 'Total Paid', 'Pending Balance (Rs.)'];
      rows = pendingPaymentsData.map(v => [
        v.VendorID, v.VendorName, v.ContactPerson, v.Phone, v.totalGrnBills, v.totalPaid, v.pendingBalance
      ]);
    } else if (activeReport === 'payroll_disbursement') {
      headers = ['Payroll ID', 'Employee Name', 'Month / Year', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Payment Date', 'Payment Method'];
      rows = payrollData.map(p => [
        p.PayrollID, p.EmployeeName, p.MonthYear, p.BasicSalary, p.Allowances, p.Deductions, p.NetSalary, p.PaymentDate || 'N/A', p.PaymentMethod || 'Cash'
      ]);
    } else if (activeReport === 'expense_analysis') {
      headers = ['Expense ID', 'Category', 'Description', 'Amount (Rs.)', 'Expense Date', 'Payment Method', 'Receipt Ref'];
      rows = expenseData.map(e => [
        e.ExpenseID, e.Category, e.Description, e.Amount, e.ExpenseDate, e.PaymentMethod, e.ReceiptRef || 'N/A'
      ]);
    } else if (activeReport === 'purchase_orders') {
      headers = ['PO ID', 'Vendor Name', 'Order Date', 'Delivery Date', 'Total Amount', 'Status', 'GRN ID'];
      rows = poData.map(p => [
        p.POID, p.VendorName, p.OrderDate, p.ExpectedDeliveryDate, p.TotalAmount, p.Status, p.linkedGrn?.GRNID || 'Pending GRN'
      ]);
    } else if (activeReport === 'current_stock') {
      headers = ['Item ID', 'Medicine / Item Name', 'Category', 'Current Stock', 'Purchase Price', 'Retail Price', 'Total Stock Valuation (Rs.)'];
      rows = currentStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        i.Category || i.category || 'General',
        i.CStock || 0,
        i.PurchasePrice || i.Price || 0,
        i.Price || 0,
        (Number(i.CStock) || 0) * (Number(i.PurchasePrice) || Number(i.Price) || 0)
      ]);
    } else if (activeReport === 'minimum_stock') {
      headers = ['Item ID', 'Medicine Name', 'Category', 'Current Stock', 'Min Threshold', 'Deficit'];
      rows = minimumStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        i.Category || i.category || 'General',
        i.CStock || 0,
        i.MinStock || 10,
        Math.max(0, (i.MinStock || 10) - (i.CStock || 0))
      ]);
    } else if (activeReport === 'required_stock') {
      headers = ['Item ID', 'Medicine Name', 'Category', 'Current Stock', 'Min Stock', 'Target Reorder Qty', 'Required Qty to Order', 'Unit Cost (Rs.)', 'Est Total Cost (Rs.)'];
      rows = requiredStockData.map(i => [
        i.ItemID || i._id,
        i.ItemName || i.name,
        i.Category || i.category || 'General',
        i.cStock,
        i.minStock,
        i.reorderTarget,
        i.requiredQty,
        i.unitCost,
        i.estCost
      ]);
    } else if (activeReport === 'pnl_summary') {
      headers = ['Metric Category', 'Amount (Rs.)'];
      rows = [
        ['OPD Token Income', pnlSummaryData.apptFees],
        ['POS Pharmacy Sales', pnlSummaryData.posIncome],
        ['Other Direct Inflows', pnlSummaryData.otherIncome],
        ['TOTAL GROSS INFLOWS', pnlSummaryData.totalIncome],
        ['Vendor & Supplier Outflows', pnlSummaryData.vendorOutflows],
        ['Salary & Payroll Disbursements', pnlSummaryData.salaryOutflows],
        ['Operational Expenses', pnlSummaryData.expenseOutflows],
        ['TOTAL OUTFLOWS', pnlSummaryData.totalExpenses],
        ['NET OPERATING PROFIT / (LOSS)', pnlSummaryData.netProfit]
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrintReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return alert('Pop-up blocked! Please allow popups to print reports.');

    const reportTitles: Record<ReportType, string> = {
      pending_payments: 'Pending Vendor Payments & Payable Balance Report',
      payroll_disbursement: 'Salary & Payroll Disbursement Audit Report',
      expense_analysis: 'Operational Expenses Analysis & Categorization Report',
      purchase_orders: 'Purchase Orders & Inventory Procurement Audit',
      current_stock: 'Current Stock Inventory & Stock Valuation Audit',
      minimum_stock: 'Low Stock & Minimum Inventory Threshold Alert Report',
      required_stock: 'Required Stock Requisition & Procurement Calculation Report',
      pnl_summary: 'Executive Profit & Loss Financial Summary Statement'
    };

    let tableHtml = '';

    if (activeReport === 'pending_payments') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Vendor Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th style="text-align: right">Total Bills</th>
              <th style="text-align: right">Total Paid</th>
              <th style="text-align: right">Pending Payable Balance</th>
            </tr>
          </thead>
          <tbody>
            ${pendingPaymentsData.map(v => `
              <tr>
                <td><b>${v.VendorID}</b></td>
                <td><b>${v.VendorName}</b></td>
                <td>${v.ContactPerson}</td>
                <td>${v.Phone}</td>
                <td style="text-align: right">Rs. ${v.totalGrnBills.toLocaleString()}</td>
                <td style="text-align: right; color: #047857;">Rs. ${v.totalPaid.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: ${v.pendingBalance > 0 ? '#b91c1c' : '#15803d'};">
                  Rs. ${v.pendingBalance.toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="text-align: right">TOTAL OUTSTANDING PAYABLE BALANCE:</td>
              <td style="text-align: right; color: #b91c1c; font-size: 14px;">Rs. ${pendingPaymentsSummary.totalOwed.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'payroll_disbursement') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Payroll ID</th>
              <th>Employee Name</th>
              <th>Period</th>
              <th style="text-align: right">Basic</th>
              <th style="text-align: right">Allowances</th>
              <th style="text-align: right">Deductions</th>
              <th style="text-align: right">Net Salary</th>
              <th style="text-align: center">Method</th>
              <th style="text-align: center">Payment Date</th>
            </tr>
          </thead>
          <tbody>
            ${payrollData.map(p => `
              <tr>
                <td><b>${p.PayrollID}</b></td>
                <td><b>${p.EmployeeName}</b></td>
                <td>${p.MonthYear}</td>
                <td style="text-align: right">Rs. ${p.BasicSalary.toLocaleString()}</td>
                <td style="text-align: right; color: #047857;">+ Rs. ${p.Allowances.toLocaleString()}</td>
                <td style="text-align: right; color: #b91c1c;">- Rs. ${p.Deductions.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: #0f172a;">Rs. ${p.NetSalary.toLocaleString()}</td>
                <td style="text-align: center">${p.PaymentMethod || 'Cash'}</td>
                <td style="text-align: center">${p.PaymentDate || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="text-align: right">TOTAL SALARIES DISBURSED:</td>
              <td style="text-align: right; color: #4338ca; font-size: 14px;">Rs. ${payrollSummary.totalDisbursed.toLocaleString()}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'expense_analysis') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: center">Date</th>
              <th style="text-align: center">Payment Method</th>
              <th style="text-align: right">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${expenseData.map(e => `
              <tr>
                <td><b>${e.ExpenseID}</b></td>
                <td><span class="badge">${e.Category}</span></td>
                <td>${e.Description}</td>
                <td style="text-align: center">${e.ExpenseDate}</td>
                <td style="text-align: center">${e.PaymentMethod}</td>
                <td style="text-align: right; font-weight: 800; color: #b91c1c;">Rs. ${e.Amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="5" style="text-align: right">TOTAL OPERATIONAL EXPENSES:</td>
              <td style="text-align: right; color: #b91c1c; font-size: 14px;">Rs. ${expenseSummary.totalExpense.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'current_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine / Item Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: right">Purchase Unit Price</th>
              <th style="text-align: right">Retail Price</th>
              <th style="text-align: right">Stock Valuation (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${currentStockData.map(i => {
              const cStock = Number(i.CStock) || 0;
              const pPrice = Number(i.PurchasePrice) || Number(i.Price) || 0;
              const val = cStock * pPrice;
              return `
                <tr>
                  <td><b>${i.ItemID || i._id}</b></td>
                  <td><b>${i.ItemName || i.name}</b></td>
                  <td>${i.Category || i.category || 'General'}</td>
                  <td style="text-align: center; font-weight: 800;">${cStock} ${i.Unit || 'Units'}</td>
                  <td style="text-align: right">Rs. ${pPrice.toLocaleString()}</td>
                  <td style="text-align: right">Rs. ${(Number(i.Price) || 0).toLocaleString()}</td>
                  <td style="text-align: right; font-weight: 800; color: #0369a1;">Rs. ${val.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="3" style="text-align: right">TOTAL INVENTORY SUMMARY:</td>
              <td style="text-align: center; font-size: 13px;">${currentStockSummary.totalStockUnits.toLocaleString()} Units</td>
              <td colspan="2" style="text-align: right">TOTAL PURCHASE VALUATION:</td>
              <td style="text-align: right; color: #0369a1; font-size: 14px;">Rs. ${currentStockSummary.totalPurchaseValuation.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'minimum_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: center">Min Threshold</th>
              <th style="text-align: center">Deficit Units</th>
              <th style="text-align: center">Stock Status</th>
            </tr>
          </thead>
          <tbody>
            ${minimumStockData.map(i => {
              const cStock = Number(i.CStock) || 0;
              const minStock = Number(i.MinStock) || 10;
              const deficit = Math.max(0, minStock - cStock);
              const isOut = cStock === 0;
              return `
                <tr>
                  <td><b>${i.ItemID || i._id}</b></td>
                  <td><b>${i.ItemName || i.name}</b></td>
                  <td>${i.Category || i.category || 'General'}</td>
                  <td style="text-align: center; font-weight: 800; color: ${isOut ? '#b91c1c' : '#d97706'};">${cStock}</td>
                  <td style="text-align: center">${minStock}</td>
                  <td style="text-align: center; font-weight: 800; color: #b91c1c;">+ ${deficit}</td>
                  <td style="text-align: center">
                    <span class="badge ${isOut ? 'badge-red' : 'badge-amber'}">
                      ${isOut ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (activeReport === 'required_stock') {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th style="text-align: center">Current Stock</th>
              <th style="text-align: center">Target Stock</th>
              <th style="text-align: center">Required Requisition Qty</th>
              <th style="text-align: right">Est Unit Cost</th>
              <th style="text-align: right">Total Est Capital (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${requiredStockData.map(i => `
              <tr>
                <td><b>${i.ItemID || i._id}</b></td>
                <td><b>${i.ItemName || i.name}</b></td>
                <td>${i.Category || i.category || 'General'}</td>
                <td style="text-align: center">${i.cStock}</td>
                <td style="text-align: center">${i.reorderTarget}</td>
                <td style="text-align: center; font-weight: 900; color: #4338ca; font-size: 13px;">${i.requiredQty}</td>
                <td style="text-align: right">Rs. ${i.unitCost.toLocaleString()}</td>
                <td style="text-align: right; font-weight: 800; color: #4338ca;">Rs. ${i.estCost.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="5" style="text-align: right">TOTAL REQUISITION CAPITAL NEEDED:</td>
              <td style="text-align: center; font-size: 13px; color: #4338ca;">${requiredStockSummary.totalUnitsRequired.toLocaleString()} Units</td>
              <td></td>
              <td style="text-align: right; color: #4338ca; font-size: 14px;">Rs. ${requiredStockSummary.totalEstCapitalNeeded.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else if (activeReport === 'pnl_summary') {
      tableHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
          <div>
            <h3 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 5px; margin-bottom: 10px;">REVENUE & INFLOWS</h3>
            <table class="report-table">
              <tr><td>OPD Consultation Token Fees</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.apptFees.toLocaleString()}</td></tr>
              <tr><td>POS Pharmacy Counter Sales</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.posIncome.toLocaleString()}</td></tr>
              <tr><td>Other Direct Inflows</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.otherIncome.toLocaleString()}</td></tr>
              <tr style="background: #f0fdf4; font-weight: 900;">
                <td style="color: #15803d;">TOTAL GROSS INFLOWS</td>
                <td style="text-align: right; color: #15803d; font-size: 14px;">Rs. ${pnlSummaryData.totalIncome.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <div>
            <h3 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 5px; margin-bottom: 10px;">EXPENSES & OUTFLOWS</h3>
            <table class="report-table">
              <tr><td>Vendor Payments & Stock Purchases</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.vendorOutflows.toLocaleString()}</td></tr>
              <tr><td>Staff Salaries & Payroll</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.salaryOutflows.toLocaleString()}</td></tr>
              <tr><td>Operational Expenses</td><td style="text-align: right; font-weight: bold;">Rs. ${pnlSummaryData.expenseOutflows.toLocaleString()}</td></tr>
              <tr style="background: #fef2f2; font-weight: 900;">
                <td style="color: #b91c1c;">TOTAL GROSS OUTFLOWS</td>
                <td style="text-align: right; color: #b91c1c; font-size: 14px;">Rs. ${pnlSummaryData.totalExpenses.toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>
        <div style="margin-top: 20px; background: #f8fafc; border: 2px dashed #64748b; padding: 15px; text-align: center; border-radius: 8px;">
          <div style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">NET OPERATING FINANCIAL RESULT FOR PERIOD</div>
          <div style="font-size: 24px; font-weight: 900; color: ${pnlSummaryData.netProfit >= 0 ? '#15803d' : '#b91c1c'}; margin-top: 5px;">
            ${pnlSummaryData.netProfit >= 0 ? 'PROFIT: Rs. ' + pnlSummaryData.netProfit.toLocaleString() : 'LOSS: - Rs. ' + Math.abs(pnlSummaryData.netProfit).toLocaleString()}
          </div>
        </div>
      `;
    } else {
      tableHtml = `
        <table class="report-table">
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Vendor Name</th>
              <th>Order Date</th>
              <th style="text-align: right">Total PO Amount</th>
              <th style="text-align: center">Status</th>
              <th>GRN Status</th>
            </tr>
          </thead>
          <tbody>
            ${poData.map(p => `
              <tr>
                <td><b>${p.POID}</b></td>
                <td><b>${p.VendorName}</b></td>
                <td>${p.OrderDate}</td>
                <td style="text-align: right">Rs. ${p.TotalAmount.toLocaleString()}</td>
                <td style="text-align: center">${p.Status}</td>
                <td>${p.linkedGrn ? 'APPROVED (GRN #' + p.linkedGrn.GRNID + ')' : 'Pending GRN Receipt'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitles[activeReport]} - Punjab Homeopathic Clinic ERP</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; }
            .header { border-bottom: 2px solid #4338ca; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
            .clinic-title { font-size: 20px; font-weight: 900; color: #3730a3; margin: 0; }
            .clinic-sub { font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; }
            .report-name { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 8px; }
            .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 15px; display: flex; justify-content: space-between; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th { background: #1e293b; color: #ffffff; font-weight: 700; text-align: left; padding: 8px; font-size: 11px; }
            .report-table td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #e2e8f0; }
            .badge-red { background: #fecdd3; color: #9f1239; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; pt: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="clinic-title">PUNJAB HOMEOPATHIC CLINIC & PHARMACY</h1>
              <div class="clinic-sub">Clinic ERP Management & Analytical Reporting Desk</div>
              <div class="report-name">${reportTitles[activeReport]}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <div>Generated On: ${new Date().toLocaleString()}</div>
              <div>Generated By: ${currentUser?.FullName || 'Admin'}</div>
            </div>
          </div>

          <div class="meta-box">
            <div><b>Report Period:</b> ${startDate} to ${endDate} (${datePreset.toUpperCase()})</div>
            <div><b>Total Filtered Records:</b> ${
              activeReport === 'pending_payments' ? pendingPaymentsData.length :
              activeReport === 'payroll_disbursement' ? payrollData.length :
              activeReport === 'expense_analysis' ? expenseData.length :
              activeReport === 'current_stock' ? currentStockData.length :
              activeReport === 'minimum_stock' ? minimumStockData.length :
              activeReport === 'required_stock' ? requiredStockData.length :
              activeReport === 'pnl_summary' ? 'Financial Summary' : poData.length
            }</div>
          </div>

          ${tableHtml}

          <div class="footer">
            <div>Punjab Homeopathic Clinic ERP System — Verified Official Report</div>
            <div>Page 1 of 1</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <PieChart className="w-4 h-4" />
              <span>Executive Business Intelligence & ERP Analytics</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Comprehensive Reporting Desk</h2>
            <p className="text-slate-300 text-xs mt-1">
              Filter custom date periods, evaluate liabilities, disburse records, current stock valuation & reorder requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* REPORT TYPE SELECTOR BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-6 pt-5 border-t border-slate-800">
          {[
            { id: 'pending_payments', label: 'Pending Vendor Payments', icon: Building2, badge: pendingPaymentsSummary.vendorsWithDues },
            { id: 'payroll_disbursement', label: 'Salary Disbursement', icon: Users, badge: payrollSummary.recordCount },
            { id: 'expense_analysis', label: 'Expense Analysis', icon: DollarSign, badge: expenseSummary.count },
            { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart, badge: poSummary.totalPos },
            { id: 'current_stock', label: 'Current Stock', icon: Boxes, badge: currentStockSummary.totalItems },
            { id: 'minimum_stock', label: 'Minimum Stock Alert', icon: AlertTriangle, badge: minimumStockSummary.totalLowStock, isAlert: true },
            { id: 'required_stock', label: 'Required Requisition', icon: PackagePlus, badge: requiredStockSummary.totalItemsToOrder },
            { id: 'pnl_summary', label: 'Executive P&L', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={`p-3 rounded-xl transition flex flex-col items-center text-center space-y-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md font-bold'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.isAlert ? 'text-amber-400' : 'text-indigo-400'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`absolute -top-2 -right-3 px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                      tab.isAlert ? 'bg-rose-500 text-white' : 'bg-slate-900 text-indigo-300 border border-slate-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight line-clamp-2">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & DATE CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-slate-500 flex items-center space-x-1 pr-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom Date' },
              { id: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer border ${
                  datePreset === p.id
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
              />
            </div>
            <span className="text-slate-400 font-bold text-xs">-</span>
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Search & Category Sub-Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${activeReport.replace('_', ' ')}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {(activeReport === 'expense_analysis' || activeReport === 'current_stock' || activeReport === 'minimum_stock' || activeReport === 'required_stock') && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {activeReport === 'expense_analysis' ? (
                  ['Rent', 'Utilities', 'Salaries', 'Maintenance', 'Marketing', 'Supplies', 'Refreshment', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  categoriesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY KPI METRIC CARDS FOR ACTIVE REPORT */}
      {activeReport === 'pending_payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Outstanding Payables</div>
              <div className="text-2xl font-black text-rose-900 mt-1">Rs. {pendingPaymentsSummary.totalOwed.toLocaleString()}</div>
              <div className="text-[11px] font-medium text-rose-700 mt-0.5">Owed across vendors for received inventory</div>
            </div>
            <Building2 className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Vendors With Pending Dues</div>
              <div className="text-2xl font-black text-amber-900 mt-1">{pendingPaymentsSummary.vendorsWithDues} Vendors</div>
              <div className="text-[11px] font-medium text-amber-700 mt-0.5">Out of {pendingPaymentsSummary.totalVendors} total registered vendors</div>
            </div>
            <Clock className="w-8 h-8 text-amber-500 opacity-80" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtered Vendor Records</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{pendingPaymentsData.length} Vendors</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">Matches current search filter</div>
            </div>
            <Filter className="w-8 h-8 text-slate-400 opacity-80" />
          </div>
        </div>
      )}

      {activeReport === 'payroll_disbursement' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Salary Disbursed</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">Rs. {payrollSummary.totalDisbursed.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">Net salary payout in period</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Basic Salary</div>
            <div className="text-xl font-bold text-slate-900 mt-1">Rs. {payrollSummary.totalBasic.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Base contract commitments</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Allowances</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">+ Rs. {payrollSummary.totalAllowances.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Bonuses & Overtime</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Deductions</div>
            <div className="text-xl font-bold text-rose-900 mt-1">- Rs. {payrollSummary.totalDeductions.toLocaleString()}</div>
            <div className="text-[11px] text-rose-700 mt-0.5">Taxes & Advances</div>
          </div>
        </div>
      )}

      {activeReport === 'expense_analysis' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Period Expenses</div>
              <div className="text-2xl font-black text-rose-950 mt-1">Rs. {expenseSummary.totalExpense.toLocaleString()}</div>
              <div className="text-[11px] text-rose-700 mt-0.5">{expenseSummary.count} expense vouchers logged</div>
            </div>
            <DollarSign className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:col-span-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Expense Category Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(expenseSummary.byCategory).map(([cat, amt]) => (
                <div key={cat} className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{cat}</div>
                  <div className="text-sm font-black text-slate-900">Rs. {amt.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'current_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Inventory Items</div>
            <div className="text-2xl font-black text-white mt-1">{currentStockSummary.totalItems} Medicines</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Catalog SKUs</div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-sky-700 uppercase tracking-wider">Total Units in Stock</div>
            <div className="text-2xl font-black text-sky-950 mt-1">{currentStockSummary.totalStockUnits.toLocaleString()}</div>
            <div className="text-[11px] text-sky-700 mt-0.5">Physical quantity in pharmacy</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Purchase Valuation</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">Rs. {currentStockSummary.totalPurchaseValuation.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Based on cost price</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Retail Valuation</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">Rs. {currentStockSummary.totalRetailValuation.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Based on MRP sales price</div>
          </div>
        </div>
      )}

      {activeReport === 'minimum_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total Low Stock Alerts</div>
              <div className="text-2xl font-black text-amber-950 mt-1">{minimumStockSummary.totalLowStock} Items</div>
              <div className="text-[11px] text-amber-700 mt-0.5">Stock is below minimum threshold</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600 opacity-80" />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Critical Out-of-Stock</div>
              <div className="text-2xl font-black text-rose-950 mt-1">{minimumStockSummary.totalOut} Items</div>
              <div className="text-[11px] text-rose-700 mt-0.5">0 units available</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-rose-600 opacity-80" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Action Recommended</div>
              <div className="text-sm font-bold text-blue-900 mt-1">Generate Purchase Order immediately for low stock items</div>
              <div className="text-[11px] text-blue-700 mt-0.5">Prevent pharmacy stockouts</div>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500 opacity-80" />
          </div>
        </div>
      )}

      {activeReport === 'required_stock' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Items Requiring Reorder</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">{requiredStockSummary.totalItemsToOrder} Medicines</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">Need procurement</div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">Total Quantity Needed</div>
            <div className="text-2xl font-black text-sky-950 mt-1">{requiredStockSummary.totalUnitsRequired.toLocaleString()} Units</div>
            <div className="text-[11px] text-sky-700 mt-0.5">Reorder target - Current stock</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Est Capital Procurement Needed</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">Rs. {requiredStockSummary.totalEstCapitalNeeded.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Estimated PO investment</div>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>
              {activeReport === 'pending_payments' && 'Pending Vendor Payments & Payable Balance Report'}
              {activeReport === 'payroll_disbursement' && 'Salary & Payroll Disbursement Records'}
              {activeReport === 'expense_analysis' && 'Operational Expense Analysis'}
              {activeReport === 'purchase_orders' && 'Purchase Orders & Inventory Procurement Audit'}
              {activeReport === 'current_stock' && 'Current Stock Inventory & Stock Valuation Audit'}
              {activeReport === 'minimum_stock' && 'Low Stock & Minimum Inventory Alert List'}
              {activeReport === 'required_stock' && 'Required Stock Requisition & Quantity Calculation'}
              {activeReport === 'pnl_summary' && 'Executive Profit & Loss Financial Summary'}
            </span>
          </h3>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Period: {startDate} to {endDate}
          </span>
        </div>

        {/* REPORT TABLE 1: PENDING PAYMENTS */}
        {activeReport === 'pending_payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Vendor / Supplier Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Total GRN Bills</th>
                  <th className="p-3 text-right">Total Paid</th>
                  <th className="p-3 text-right">Pending Balance</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingPaymentsData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                      No vendor payments or dues found for the selected search filter.
                    </td>
                  </tr>
                ) : (
                  pendingPaymentsData.map((v, idx) => (
                    <tr key={v._id || v.VendorID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{v.VendorID}</td>
                      <td className="p-3 font-bold text-slate-900">{v.VendorName}</td>
                      <td className="p-3 text-slate-600">{v.ContactPerson || 'N/A'}</td>
                      <td className="p-3 text-slate-500 font-mono">{v.Phone}</td>
                      <td className="p-3 text-right text-slate-700">Rs. {v.totalGrnBills.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">Rs. {v.totalPaid.toLocaleString()}</td>
                      <td className={`p-3 text-right font-black ${v.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Rs. {v.pendingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.pendingBalance > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.pendingBalance > 0 ? 'PAYABLE DUE' : 'CLEAR'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 2: PAYROLL DISBURSEMENT */}
        {activeReport === 'payroll_disbursement' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Payroll ID</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Basic Salary</th>
                  <th className="p-3 text-right">Allowances</th>
                  <th className="p-3 text-right">Deductions</th>
                  <th className="p-3 text-right">Net Disbursed</th>
                  <th className="p-3 text-center">Method</th>
                  <th className="p-3 text-center">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payrollData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 font-medium">
                      No payroll disbursement records found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  payrollData.map((p, idx) => (
                    <tr key={p._id || p.PayrollID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{p.PayrollID}</td>
                      <td className="p-3 font-bold text-slate-900">{p.EmployeeName}</td>
                      <td className="p-3 text-slate-600 font-bold">{p.MonthYear}</td>
                      <td className="p-3 text-right text-slate-700">Rs. {p.BasicSalary.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">+ Rs. {p.Allowances.toLocaleString()}</td>
                      <td className="p-3 text-right text-rose-600">- Rs. {p.Deductions.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.NetSalary.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.PaymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-600">{p.PaymentDate || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 3: EXPENSE ANALYSIS */}
        {activeReport === 'expense_analysis' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Expense ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Expense Date</th>
                  <th className="p-3 text-center">Payment Method</th>
                  <th className="p-3 text-center">Receipt Ref</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenseData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                      No expense records found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  expenseData.map((e, idx) => (
                    <tr key={e._id || e.ExpenseID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-rose-600">{e.ExpenseID}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {e.Category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{e.Description}</td>
                      <td className="p-3 text-center text-slate-600">{e.ExpenseDate}</td>
                      <td className="p-3 text-center text-slate-600">{e.PaymentMethod}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{e.ReceiptRef || 'N/A'}</td>
                      <td className="p-3 text-right font-black text-rose-700">Rs. {e.Amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 4: PURCHASE ORDERS */}
        {activeReport === 'purchase_orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">PO ID</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3 text-center">Order Date</th>
                  <th className="p-3 text-center">Expected Delivery</th>
                  <th className="p-3 text-center">Items Count</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">PO Status</th>
                  <th className="p-3 text-center">GRN Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {poData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                      No Purchase Orders found for period ({startDate} to {endDate}).
                    </td>
                  </tr>
                ) : (
                  poData.map((p, idx) => (
                    <tr key={p._id || p.POID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{p.POID}</td>
                      <td className="p-3 font-bold text-slate-900">{p.VendorName}</td>
                      <td className="p-3 text-center text-slate-600">{p.OrderDate}</td>
                      <td className="p-3 text-center text-slate-600">{p.ExpectedDeliveryDate || 'N/A'}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{p.Items?.length || 0}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.TotalAmount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.Status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.linkedGrn ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            GRN #{p.linkedGrn.GRNID} Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending GRN
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 5: CURRENT STOCK */}
        {activeReport === 'current_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine / Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-right">Purchase Price</th>
                  <th className="p-3 text-right">Retail Sale Price</th>
                  <th className="p-3 text-right">Stock Valuation (Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {currentStockData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                      No inventory medicines found matching search query.
                    </td>
                  </tr>
                ) : (
                  currentStockData.map((i, idx) => {
                    const cStock = Number(i.CStock) || 0;
                    const pPrice = Number(i.PurchasePrice) || Number(i.Price) || 0;
                    const val = cStock * pPrice;
                    return (
                      <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                        <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                        <td className="p-3 text-slate-600">{i.Category || i.category || 'General'}</td>
                        <td className="p-3 text-center font-bold text-indigo-700">{cStock} {i.Unit || 'Units'}</td>
                        <td className="p-3 text-right text-slate-600">Rs. {pPrice.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">Rs. {(Number(i.Price) || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-sky-900">Rs. {val.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 6: MINIMUM STOCK ALERT */}
        {activeReport === 'minimum_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Min Threshold</th>
                  <th className="p-3 text-center">Deficit Units</th>
                  <th className="p-3 text-center">Stock Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {minimumStockData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-emerald-600 font-bold py-8">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      All inventory items are currently above their minimum threshold level!
                    </td>
                  </tr>
                ) : (
                  minimumStockData.map((i, idx) => {
                    const cStock = Number(i.CStock) || 0;
                    const minStock = Number(i.MinStock) || 10;
                    const deficit = Math.max(0, minStock - cStock);
                    const isOut = cStock === 0;
                    return (
                      <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                        <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                        <td className="p-3 text-slate-600">{i.Category || i.category || 'General'}</td>
                        <td className={`p-3 text-center font-black ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>{cStock}</td>
                        <td className="p-3 text-center text-slate-600">{minStock}</td>
                        <td className="p-3 text-center font-bold text-rose-600">+ {deficit}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isOut ? 'OUT OF STOCK' : 'LOW STOCK ALERT'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 7: REQUIRED STOCK REQUISITION */}
        {activeReport === 'required_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Item ID</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-center">Target Reorder Qty</th>
                  <th className="p-3 text-center">Required Qty to Order</th>
                  <th className="p-3 text-right">Unit Purchase Cost</th>
                  <th className="p-3 text-right">Est. Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requiredStockData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-emerald-600 font-bold py-8">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      No stock reorders required at this moment.
                    </td>
                  </tr>
                ) : (
                  requiredStockData.map((i, idx) => (
                    <tr key={i._id || i.ItemID || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{i.ItemID || i._id}</td>
                      <td className="p-3 font-bold text-slate-900">{i.ItemName || i.name}</td>
                      <td className="p-3 text-slate-600">{i.Category || i.category || 'General'}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{i.cStock}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{i.reorderTarget}</td>
                      <td className="p-3 text-center font-black text-indigo-700 bg-indigo-50/50">{i.requiredQty} Units</td>
                      <td className="p-3 text-right text-slate-600">Rs. {i.unitCost.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-indigo-900">Rs. {i.estCost.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT TABLE 8: P&L SUMMARY STATEMENT */}
        {activeReport === 'pnl_summary' && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* REVENUES / INFLOWS */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h4 className="font-extrabold text-emerald-900 text-sm flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Inflows & Revenue Streams</span>
                  </h4>
                  <span className="text-xs font-bold text-emerald-700">Period Total</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="font-medium text-slate-700">OPD Patient Token Fees</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.apptFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="font-medium text-slate-700">POS Pharmacy Sales</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.posIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="font-medium text-slate-700">Other Direct Income Receipts</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.otherIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-emerald-100/80 rounded-xl border border-emerald-300 font-extrabold text-emerald-950 text-sm">
                    <span>TOTAL GROSS INFLOWS</span>
                    <span>Rs. {pnlSummaryData.totalIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EXPENSES / OUTFLOWS */}
              <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                  <h4 className="font-extrabold text-rose-900 text-sm flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Outflows & Operating Expenses</span>
                  </h4>
                  <span className="text-xs font-bold text-rose-700">Period Total</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100">
                    <span className="font-medium text-slate-700">Vendor Payments (Inventory Purchases)</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.vendorOutflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100">
                    <span className="font-medium text-slate-700">Staff Salaries & Payroll Disbursement</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.salaryOutflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-xl border border-rose-100">
                    <span className="font-medium text-slate-700">Operational & Building Expenses</span>
                    <span className="font-bold text-slate-900">Rs. {pnlSummaryData.expenseOutflows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-rose-100/80 rounded-xl border border-rose-300 font-extrabold text-rose-950 text-sm">
                    <span>TOTAL GROSS OUTFLOWS</span>
                    <span>Rs. {pnlSummaryData.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NET RESULT BANNER */}
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4 ${
              pnlSummaryData.netProfit >= 0
                ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-700'
                : 'bg-gradient-to-r from-rose-900 to-amber-900 text-white border-rose-700'
            }`}>
              <div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">NET OPERATING FINANCIAL RESULT</div>
                <div className="text-3xl font-black mt-1">
                  {pnlSummaryData.netProfit >= 0 ? 'NET PROFIT: Rs. ' + pnlSummaryData.netProfit.toLocaleString() : 'NET LOSS: - Rs. ' + Math.abs(pnlSummaryData.netProfit).toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Calculated for period: {startDate} to {endDate}
                </div>
              </div>
              <button
                onClick={handlePrintReport}
                className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Print Official P&L Statement</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
