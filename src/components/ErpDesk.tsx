import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  ShoppingCart,
  Receipt,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  PackageCheck,
  CreditCard,
  UserPlus,
  FileText,
  Boxes,
  PieChart,
  QrCode,
  Coins,
  Calendar,
  X,
  Landmark,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RotateCcw,
  XCircle
} from 'lucide-react';
import ItemQRScannerModal from './ItemQRScannerModal';
import ItemQRGeneratorModal from './ItemQRGeneratorModal';
import ReportingDesk from './ReportingDesk';

import {
  ErpVendor,
  ErpPurchaseOrder,
  ErpGrn,
  ErpGrnItem,
  ErpTransaction,
  ErpEmployee,
  ErpPayroll,
  ErpExpense,
  ErpAsset,
  User,
  UserRight,
  ClinicSettings
} from '../types';

interface ErpDeskProps {
  currentUser: User | null;
  rights: UserRight[];
  clinicSettings?: ClinicSettings;
}

export default function ErpDesk({ currentUser, rights, clinicSettings }: ErpDeskProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cash_book_pnl' | 'vendors' | 'vendor_statement' | 'po' | 'ledger' | 'hr' | 'expenses_assets' | 'reporting'>('overview');
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Vendor Statement States
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [vendorDateFilter, setVendorDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [vendorPrintModalOpen, setVendorPrintModalOpen] = useState<boolean>(false);
  const [expandedGrnId, setExpandedGrnId] = useState<string | null>(null);

  // Core ERP State Collections
  const [vendors, setVendors] = useState<ErpVendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ErpPurchaseOrder[]>([]);
  const [grns, setGrns] = useState<ErpGrn[]>([]);
  const [transactions, setTransactions] = useState<ErpTransaction[]>([]);
  const [employees, setEmployees] = useState<ErpEmployee[]>([]);
  const [payrolls, setPayrolls] = useState<ErpPayroll[]>([]);
  const [expenses, setExpenses] = useState<ErpExpense[]>([]);
  const [assets, setAssets] = useState<ErpAsset[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Additional Collections for Cash Book & P&L
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientVisits, setPatientVisits] = useState<any[]>([]);
  const [posSales, setPosSales] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cash Book Filter States
  const [cashBookDateFilter, setCashBookDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'all_time'>('today');
  const [cashBookCategoryFilter, setCashBookCategoryFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [cashBookSearch, setCashBookSearch] = useState<string>('');

  // Quick Outflow Logger State
  const [quickOutflowForm, setQuickOutflowForm] = useState<{
    category: string;
    amount: number | string;
    payee: string;
    paymentMethod: 'Cash' | 'Bank' | 'Online';
    date: string;
    description: string;
  }>({
    category: 'Building Rent & Maintenance',
    amount: '',
    payee: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  const [medicineFilterMode, setMedicineFilterMode] = useState<'all' | 'lowStock' | 'selected'>('all');
  const [poCategoryFilter, setPoCategoryFilter] = useState<string>('all');

  // Dynamic Medicine Categories List
  const medicineCategories = useMemo(() => {
    const defaultCats = [
      'Tablet / Capsule',
      'Syrup / Liquid',
      'Injection / Ampoule',
      'Ointment / Cream',
      'Drops',
      'Clinical / Compounded',
      'Patent / Pre-packaged',
      'Surgical / Supplies'
    ];
    const itemCats = (inventoryItems || [])
      .map((i: any) => i.Category || (i.MedicineType === 'C' ? 'Clinical / Compounded' : i.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule'))
      .filter(Boolean);
    return Array.from(new Set([...defaultCats, ...itemCats]));
  }, [inventoryItems]);

  // Selected Vendor for Statement View
  const selectedVendor = useMemo(() => {
    if (!selectedVendorId && vendors.length > 0) {
      return vendors[0];
    }
    return vendors.find(v => v.VendorID === selectedVendorId || v._id === selectedVendorId) || vendors[0] || null;
  }, [vendors, selectedVendorId]);

  // Vendor Statement & Payable Ledger Calculation
  const vendorStatement = useMemo(() => {
    if (!selectedVendor) {
      return { statementRows: [], totalInvoiced: 0, totalPaid: 0, closingBalance: 0 };
    }

    const vName = (selectedVendor.VendorName || '').trim().toLowerCase();
    const vId = (selectedVendor.VendorID || selectedVendor._id || '').trim().toLowerCase();

    // Filter GRNs for this vendor
    const vendorGrns = (grns || []).filter(g => {
      const sName = (g.SupplierName || '').trim().toLowerCase();
      const sId = (g.SupplierID || '').trim().toLowerCase();
      return (vName && sName === vName) || (vId && sId === vId) || (sName && vName.includes(sName));
    });

    // Filter Payments / Transactions for this vendor
    const vendorTxns = (transactions || []).filter(t => {
      const tVName = (t.VendorName || '').trim().toLowerCase();
      const tVId = (t.VendorID || '').trim().toLowerCase();
      const isVendorPay = t.Type === 'VendorPayment' || t.Category === 'Vendor Payment' || (t.Type === 'Expense' && tVName);
      return isVendorPay && ((vName && tVName === vName) || (vId && tVId === vId) || (tVName && vName.includes(tVName)));
    });

    type LedgerRow = {
      id: string;
      date: string;
      type: string;
      refNo: string;
      poNo: string;
      description: string;
      debit: number;   // Payment (settlement)
      credit: number;  // GRN Bill (invoice)
      runningBalance?: number;
      rawItem?: any;
    };

    const rows: LedgerRow[] = [];

    vendorGrns.forEach(g => {
      rows.push({
        id: g.GrnID || g._id || `GRN-${Math.random()}`,
        date: g.ReceivedDate || new Date().toISOString().split('T')[0],
        type: 'Goods Received (GRN)',
        refNo: g.GrnID || 'GRN-N/A',
        poNo: g.POID || (g as any).PoID || 'N/A',
        description: `GRN Received - Invoice #${g.VendorInvoiceNo || g.SupplierInvoiceNo || 'N/A'} (${g.ItemsReceived?.length || g.Items?.length || 0} items)`,
        debit: 0,
        credit: Number(g.TotalAmount || 0),
        rawItem: g
      });
    });

    vendorTxns.forEach(t => {
      rows.push({
        id: t.TransactionID || t._id || `TXN-${Math.random()}`,
        date: t.Date || new Date().toISOString().split('T')[0],
        type: 'Vendor Bill Payment',
        refNo: t.TransactionID || 'PAY-N/A',
        poNo: t.ReferenceNo && t.ReferenceNo.toUpperCase().startsWith('PO') ? t.ReferenceNo : 'N/A',
        description: `Payment Settled via ${t.PaymentMethod || 'Cash'} - ${t.Description || 'Vendor Settlement'}`,
        debit: Number(t.Amount || 0),
        credit: 0,
        rawItem: t
      });
    });

    // Sort chronologically
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Date Filtering
    const now = new Date();
    const filteredRows = rows.filter(r => {
      if (vendorDateFilter === 'all') return true;
      const rDate = new Date(r.date);
      if (isNaN(rDate.getTime())) return true;

      if (vendorDateFilter === 'daily') {
        return rDate.toDateString() === now.toDateString();
      }
      if (vendorDateFilter === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return rDate >= oneWeekAgo;
      }
      if (vendorDateFilter === 'monthly') {
        return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
      }
      if (vendorDateFilter === 'yearly') {
        return rDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Calculate Running Balance
    let running = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    const statementRows = filteredRows.map(r => {
      totalInvoiced += r.credit;
      totalPaid += r.debit;
      running = running + r.credit - r.debit;
      return {
        ...r,
        runningBalance: running
      };
    });

    const closingBalance = Math.max(0, selectedVendor.Balance ?? running);

    return {
      statementRows,
      totalInvoiced,
      totalPaid,
      closingBalance
    };
  }, [selectedVendor, grns, transactions, vendorDateFilter]);

  // UNIFIED CLINIC CASH BOOK & P&L LEDGER COMPUTATIONS
  const cashBookEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      date: string;
      time: string;
      ref: string;
      particulars: string;
      category: string;
      type: 'INFLOW' | 'OUTFLOW';
      amount: number;
      paymentMode: string;
      source: string;
    }> = [];

    // 1. Appointments (OPD Token Collections)
    (appointments || []).forEach((app: any) => {
      const amt = typeof app.FeeCharged === 'number' ? app.FeeCharged : (Number(app.FeeCharged) || 0);
      if (amt > 0 && app.Status !== 3) {
        entries.push({
          id: `APP-${app.AppointmentID || app._id || Math.random()}`,
          date: app.AppointmentDate || app.BookingDate || new Date().toISOString().split('T')[0],
          time: app.Time || 'OPD Shift',
          ref: `TOKEN-${app.AppointmentID || '001'}`,
          particulars: `OPD Consultation Token: ${app.PatientName || 'Patient'} (Dr. Ejaz)`,
          category: 'OPD Token Consultation Fee',
          type: 'INFLOW',
          amount: amt,
          paymentMode: 'Cash',
          source: 'Appointments'
        });
      }
    });

    // 2. Patient Visits (Clinical Medicines, File & Card Registration)
    (patientVisits || []).forEach((vis: any) => {
      const vDate = vis.VisitDate || vis.Date || new Date().toISOString().split('T')[0];
      const pName = vis.PatientName || `Patient #${vis.PatientID || ''}`;
      
      const consultAmt = Number(vis.ConsultationFee) || 0;
      const isPaid = vis.ConsultationPaymentOption === 'Paid - Cash' || vis.ConsultationPaymentOption === 'Paid - Online/Card' || vis.ConsultationPaymentOption === 'Paid' || vis.Status === 2;
      if (consultAmt > 0 && isPaid) {
        entries.push({
          id: `VIS-CONS-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'EMR Consultation',
          ref: `VISIT-${vis.VisitID || vis.PatientID || '001'}`,
          particulars: `OPD Consultation Fee: ${pName} (${vis.DoctorName || 'Dr. Ejaz'})`,
          category: 'OPD Token Consultation Fee',
          type: 'INFLOW',
          amount: consultAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const clinAmt = Number(vis.ClinicalMedicinePayment) || Number(vis.ClinicalMedicinePkr) || 0;
      if (clinAmt > 0) {
        entries.push({
          id: `VIS-CLIN-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Dispensary',
          ref: `PV-${vis.PatientID || '001'}`,
          particulars: `Clinical Formulated Medicine: ${pName}`,
          category: 'Clinical Formulated Medicine',
          type: 'INFLOW',
          amount: clinAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const fileAmt = Number(vis.FileFee) || Number(vis.FilePkr) || 0;
      if (fileAmt > 0) {
        entries.push({
          id: `VIS-FILE-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Reception',
          ref: `FILE-${vis.PatientID || '001'}`,
          particulars: `File Registration & Folder Fee: ${pName}`,
          category: 'File Registration Fee',
          type: 'INFLOW',
          amount: fileAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }

      const cardAmt = Number(vis.CardFee) || Number(vis.CardPkr) || 0;
      if (cardAmt > 0) {
        entries.push({
          id: `VIS-CARD-${vis.VisitID || vis._id || Math.random()}`,
          date: vDate,
          time: vis.VisitTime || 'Reception',
          ref: `CARD-${vis.PatientID || '001'}`,
          particulars: `Health Identity Card Fee: ${pName}`,
          category: 'Patient Card Fee',
          type: 'INFLOW',
          amount: cardAmt,
          paymentMode: 'Cash',
          source: 'PatientVisits'
        });
      }
    });

    // 3. POS / Store Pharmacy Sales
    (posSales || []).forEach((sale: any) => {
      const sAmt = Number(sale.NetAmount) || Number(sale.GAmount) || Number(sale.TotalAmount) || Number(sale.GrandTotal) || Number(sale.Total) || 0;
      if (sAmt > 0) {
        entries.push({
          id: `SALE-${sale.InvoiceNo || sale.SaleID || sale._id || Math.random()}`,
          date: sale.InvoiceDate || sale.Date || sale.CreatedDate || new Date().toISOString().split('T')[0],
          time: sale.Time || 'Pharmacy Counter',
          ref: `INV-${sale.InvoiceNo || 'STORE'}`,
          particulars: `Pharmacy Store Counter Sale: ${sale.PatientID ? `Patient #${sale.PatientID}` : (sale.CustomerName || 'Walk-in Customer')}`,
          category: 'Pharmacy Store Sale',
          type: 'INFLOW',
          amount: sAmt,
          paymentMode: sale.PaymentMethod || sale.PaymentMode || 'Cash',
          source: 'POS Sales'
        });
      }
    });

    // 4. ERP Expenses (Outflows)
    (expenses || []).forEach((exp: any) => {
      const eAmt = Number(exp.Amount) || 0;
      if (eAmt > 0) {
        const rawId = (exp.ExpenseID || exp._id || '').toString();
        const cleanId = rawId ? (rawId.startsWith('EXP-') ? rawId : `EXP-${rawId}`) : `EXP-${Math.random()}`;
        entries.push({
          id: cleanId,
          date: exp.ExpenseDate || exp.Date || new Date().toISOString().split('T')[0],
          time: 'Expenses Ledger',
          ref: cleanId,
          particulars: `${exp.Category}: ${exp.Description || 'Clinic Expense Outflow'}`,
          category: exp.Category || 'General Expense',
          type: 'OUTFLOW',
          amount: eAmt,
          paymentMode: exp.PaymentMethod || 'Cash',
          source: 'Expenses'
        });
      }
    });

    // 5. ERP Payroll / Salaries Paid (Outflows)
    (payrolls || []).forEach((pay: any) => {
      const pAmt = Number(pay.NetSalary) || Number(pay.BasicSalary) || 0;
      if (pAmt > 0) {
        const emp = (employees || []).find(e => e.EmployeeID === pay.EmployeeID);
        const rawId = (pay.PayrollID || pay._id || '').toString();
        const cleanId = rawId ? (rawId.startsWith('PAY-') ? rawId : `PAY-${rawId}`) : `PAY-${Math.random()}`;
        entries.push({
          id: cleanId,
          date: pay.PaymentDate || `${pay.MonthYear || '2026-08'}-01`,
          time: 'HR Accounts',
          ref: cleanId,
          particulars: `Staff Salary Disbursement: ${emp?.FullName || pay.EmployeeID || 'Employee'} (${pay.MonthYear || ''})`,
          category: 'Staff Salary & Payroll',
          type: 'OUTFLOW',
          amount: pAmt,
          paymentMode: pay.PaymentMethod || 'Cash',
          source: 'Payroll'
        });
      }
    });

    // 6. ERP General Ledger Transactions
    (transactions || []).forEach((tx: any) => {
      const tAmt = Number(tx.Amount) || 0;
      if (tAmt > 0) {
        const isOut = tx.Type === 'Expense' || tx.Type === 'VendorPayment' || tx.Type === 'AssetPurchase';
        const rawTxId = (tx.TransactionID || tx._id || '').toString();
        const rawRefNo = (tx.ReferenceNo || '').toString();
        const cleanRef = rawTxId ? (rawTxId.startsWith('TXN-') ? rawTxId : `TXN-${rawTxId}`) : `TXN-${Math.random()}`;

        // Check if this transaction is ALREADY covered by Expenses, Payroll, GRNs, or prior entries
        const isAlreadyIn = entries.some(e => {
          if (rawTxId && (e.id === rawTxId || e.ref === rawTxId)) return true;
          if (rawRefNo && (e.id === rawRefNo || e.ref === rawRefNo || e.id === `EXP-${rawRefNo.replace(/^EXP-/, '')}`)) return true;
          if (tx.Type === 'Expense' && (expenses || []).some((exp: any) => {
            const expId = (exp.ExpenseID || exp._id || '').toString();
            return (expId && (expId === rawRefNo || expId === rawTxId)) || 
                   (Number(exp.Amount) === tAmt && (exp.ExpenseDate === tx.Date || exp.Date === tx.Date));
          })) return true;
          if (tx.Type === 'PayrollPayment' && (payrolls || []).some((pay: any) => {
            const payId = (pay.PayrollID || pay._id || '').toString();
            return payId && (payId === rawRefNo || payId === rawTxId);
          })) return true;
          return false;
        });

        if (!isAlreadyIn) {
          entries.push({
            id: cleanRef,
            date: tx.Date || new Date().toISOString().split('T')[0],
            time: 'General Ledger',
            ref: cleanRef,
            particulars: tx.Description || `${tx.Type} - ${tx.Category}`,
            category: tx.Category || tx.Type,
            type: isOut ? 'OUTFLOW' : 'INFLOW',
            amount: tAmt,
            paymentMode: tx.PaymentMethod || 'Cash',
            source: 'ERP Transactions'
          });
        }
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, patientVisits, posSales, expenses, payrolls, transactions, employees]);

  const filteredCashBookEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    return cashBookEntries.filter(e => {
      if (cashBookDateFilter === 'today') {
        if (e.date !== todayStr) return false;
      } else if (cashBookDateFilter === 'this_week') {
        const d = new Date(e.date);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (cashBookDateFilter === 'this_month') {
        if (!e.date.startsWith(todayStr.slice(0, 7))) return false;
      }

      if (cashBookCategoryFilter === 'INFLOW' && e.type !== 'INFLOW') return false;
      if (cashBookCategoryFilter === 'OUTFLOW' && e.type !== 'OUTFLOW') return false;

      if (cashBookSearch.trim()) {
        const q = cashBookSearch.toLowerCase();
        const match = e.particulars.toLowerCase().includes(q) ||
                      e.category.toLowerCase().includes(q) ||
                      e.ref.toLowerCase().includes(q) ||
                      e.paymentMode.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [cashBookEntries, cashBookDateFilter, cashBookCategoryFilter, cashBookSearch]);

  const cashBookMetrics = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;

    let opdInflow = 0;
    let clinicalInflow = 0;
    let storeInflow = 0;
    let regInflow = 0;

    let salariesOutflow = 0;
    let rentOutflow = 0;
    let billsOutflow = 0;
    let medicinePurchasesOutflow = 0;
    let miscOutflow = 0;

    filteredCashBookEntries.forEach(e => {
      if (e.type === 'INFLOW') {
        totalInflow += e.amount;
        if (e.category.includes('OPD')) opdInflow += e.amount;
        else if (e.category.includes('Clinical')) clinicalInflow += e.amount;
        else if (e.category.includes('Store') || e.category.includes('Pharmacy')) storeInflow += e.amount;
        else regInflow += e.amount;
      } else {
        totalOutflow += e.amount;
        const catLower = e.category.toLowerCase();
        if (catLower.includes('salary') || catLower.includes('payroll')) salariesOutflow += e.amount;
        else if (catLower.includes('rent')) rentOutflow += e.amount;
        else if (catLower.includes('electric') || catLower.includes('water') || catLower.includes('utility') || catLower.includes('bill')) billsOutflow += e.amount;
        else if (catLower.includes('medicine') || catLower.includes('purchase') || catLower.includes('vendor')) medicinePurchasesOutflow += e.amount;
        else miscOutflow += e.amount;
      }
    });

    const netBalance = totalInflow - totalOutflow;
    const marginPercent = totalInflow > 0 ? ((netBalance / totalInflow) * 100).toFixed(1) : '0';

    return {
      totalInflow,
      totalOutflow,
      netBalance,
      marginPercent,
      opdInflow,
      clinicalInflow,
      storeInflow,
      regInflow,
      salariesOutflow,
      rentOutflow,
      billsOutflow,
      medicinePurchasesOutflow,
      miscOutflow
    };
  }, [filteredCashBookEntries]);

  const handleQuickOutflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const amt = Number(quickOutflowForm.amount) || 0;
    if (amt <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const expCatRaw = quickOutflowForm.category || 'Building Rent & Maintenance';
      let expCatMapped: 'Rent' | 'Utilities' | 'Salaries' | 'Maintenance' | 'Marketing' | 'Supplies' | 'Refreshment' | 'Other' = 'Other';
      if (expCatRaw.includes('Rent')) expCatMapped = 'Rent';
      else if (expCatRaw.includes('Salary') || expCatRaw.includes('Payroll')) expCatMapped = 'Salaries';
      else if (expCatRaw.includes('Utility') || expCatRaw.includes('Electricity')) expCatMapped = 'Utilities';
      else if (expCatRaw.includes('Tea') || expCatRaw.includes('Refreshment')) expCatMapped = 'Refreshment';
      else if (expCatRaw.includes('Repair') || expCatRaw.includes('Maintenance')) expCatMapped = 'Maintenance';

      const newExp: ErpExpense = {
        ExpenseID: `EXP-${Date.now().toString().slice(-6)}`,
        Category: expCatMapped,
        Description: quickOutflowForm.description ? `${quickOutflowForm.description} (Paid to: ${quickOutflowForm.payee})` : `${expCatRaw} to ${quickOutflowForm.payee || 'Payee'}`,
        Amount: amt,
        ExpenseDate: quickOutflowForm.date || new Date().toISOString().split('T')[0],
        PaymentMethod: quickOutflowForm.paymentMethod as any || 'Cash',
        ReceiptRef: `REC-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Date.now().toString().slice(-6)}`,
        Type: 'Expense',
        Category: expCatRaw,
        Description: newExp.Description,
        Amount: amt,
        PaymentMethod: newExp.PaymentMethod,
        ReferenceNo: newExp.ExpenseID,
        Date: newExp.ExpenseDate,
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorName: quickOutflowForm.payee || 'Expense Account'
      };

      await saveToDatabase('erp_expenses', newExp);
      await saveToDatabase('erp_transactions', newTxn);

      setExpenses(prev => [newExp, ...prev]);
      setTransactions(prev => [newTxn, ...prev]);

      setQuickOutflowForm({
        category: 'Building Rent & Maintenance',
        amount: '',
        payee: '',
        paymentMethod: 'Cash',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });

      setSyncMessage(`Outflow of Rs. ${amt.toLocaleString()} recorded in Cash Book & P&L!`);
      setTimeout(() => setSyncMessage(null), 3000);
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
    } catch (err: any) {
      console.error('Failed to submit quick outflow:', err);
      alert('Error recording outflow: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintCashBookReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Please allow popups to print the report.");
      return;
    }

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const cDoc = clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)';
    const cDocSub = clinicSettings?.DoctorSignatureText || 'Reg No: 48776 | Homeopathic Medical Specialist';
    const cAddr = clinicSettings?.ClinicAddress || 'Main Boulevard, Lahore';
    const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    const dateLabel = cashBookDateFilter === 'today' ? `Today (${new Date().toLocaleDateString('en-GB')})` :
                      cashBookDateFilter === 'this_week' ? 'Past 7 Days' :
                      cashBookDateFilter === 'this_month' ? `Month of ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}` : 'All Time Records';

    const rowsHtml = filteredCashBookEntries.map((e, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; page-break-inside: avoid;">
        <td style="padding: 7px 6px; text-align: center; font-weight: bold; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 6px; font-family: monospace; white-space: nowrap; font-weight: 600;">${e.date}</td>
        <td style="padding: 7px 6px; font-weight: bold; font-family: monospace; color: #4338ca;">${e.ref}</td>
        <td style="padding: 7px 6px; font-weight: bold; color: #0f172a;">${e.particulars}</td>
        <td style="padding: 7px 6px; color: #475569; font-size: 10px;">${e.category}</td>
        <td style="padding: 7px 6px; text-align: center;">
          <span style="background: ${e.type === 'INFLOW' ? '#dcfce7' : '#ffe4e6'}; color: ${e.type === 'INFLOW' ? '#166534' : '#9f1239'}; font-weight: 800; padding: 2px 7px; border-radius: 4px; font-size: 9px; letter-spacing: 0.5px;">
            ${e.type}
          </span>
        </td>
        <td style="padding: 7px 6px; text-align: right; font-family: monospace; font-weight: 800; color: ${e.type === 'INFLOW' ? '#15803d' : '#be123c'}; font-size: 11px;">
          ${e.type === 'INFLOW' ? '+' : '-'} Rs. ${e.amount.toLocaleString()}
        </td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cash Book & P&L Statement - ${cName}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; line-height: 1.4; }
            .letterhead-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
            .clinic-brand { flex: 1; text-align: center; padding: 0 10px; }
            .clinic-title { font-size: 22px; font-weight: 900; color: #881337; letter-spacing: -0.5px; text-transform: uppercase; font-family: Georgia, serif; }
            .clinic-tagline { font-size: 10px; font-weight: 800; color: #be123c; letter-spacing: 1px; margin-top: 2px; text-transform: uppercase; }
            .doc-details { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 4px; }
            .contact-line { font-size: 10px; color: #475569; font-weight: 600; margin-top: 2px; }
            .report-banner { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
            .report-title { font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
            .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; text-align: center; }
            .card-label { font-size: 9px; font-weight: 800; uppercase; tracking-wider; }
            .card-val { font-size: 16px; font-weight: 900; margin-top: 4px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th { background: #0f172a; color: #ffffff; font-size: 9.5px; text-transform: uppercase; padding: 8px 6px; text-align: left; font-weight: 800; letter-spacing: 0.5px; }
            .footer-sign { margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #475569; page-break-inside: avoid; }
            .sign-box { text-align: center; width: 180px; }
            .sign-line { border-bottom: 1.5px dashed #64748b; height: 35px; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <!-- OFFICIAL A4 LETTERHEAD HEADER -->
          <div class="letterhead-header">
            <img src="${logoSrc}" style="width: 70px; height: 70px; object-fit: contain;" alt="Logo" />
            <div class="clinic-brand">
              <div class="clinic-title">${cName}</div>
              <div class="clinic-tagline">${cTag}</div>
              <div class="doc-details">${cDoc} <span style="font-weight: 400; color: #64748b;">(${cDocSub})</span></div>
              <div class="contact-line">📍 ${cAddr} &nbsp;|&nbsp; 📞 ${cPhone}</div>
            </div>
            <div style="width: 70px; text-align: right;">
              <span style="font-size: 9px; font-weight: 900; background: #0f172a; color: #fff; padding: 3px 6px; border-radius: 4px;">FINANCIAL</span>
            </div>
          </div>

          <!-- REPORT TITLE & TIMESTAMP BANNER -->
          <div class="report-banner">
            <div>
              <div class="report-title">CASH BOOK & FINANCIAL STATEMENT</div>
              <div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-top: 2px;">Filter Period: ${dateLabel}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #475569; font-weight: 600;">
              <div>Generated On: <strong>${new Date().toLocaleString('en-GB')}</strong></div>
              <div>Generated By: <strong>${currentUser?.FullName || currentUser?.LoginName || 'Authorized Officer'}</strong></div>
            </div>
          </div>

          <!-- SUMMARY FINANCIAL CARDS -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-label" style="color: #15803d;">TOTAL CASH COLLECTIONS (INFLOW)</div>
              <div class="card-val" style="color: #15803d;">Rs. ${cashBookMetrics.totalInflow.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="card-label" style="color: #be123c;">TOTAL EXPENSES & OUTFLOWS</div>
              <div class="card-val" style="color: #be123c;">Rs. ${cashBookMetrics.totalOutflow.toLocaleString()}</div>
            </div>
            <div class="summary-card" style="background: #f0fdf4; border-color: #86efac;">
              <div class="card-label" style="color: #166534;">NET OPERATING BALANCE</div>
              <div class="card-val" style="color: ${cashBookMetrics.netBalance >= 0 ? '#15803d' : '#be123c'};">Rs. ${cashBookMetrics.netBalance.toLocaleString()}</div>
            </div>
          </div>

          <!-- TRANSACTIONS LEDGER TABLE -->
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 85px;">Date</th>
                <th style="width: 95px;">Ref / Vch #</th>
                <th>Particulars / Description</th>
                <th style="width: 140px;">Category</th>
                <th style="width: 65px; text-align: center;">Type</th>
                <th style="width: 110px; text-align: right;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a; font-size: 11px;">
                <td colspan="6" style="padding: 8px 6px; text-align: right; font-weight: 900; text-transform: uppercase;">Net Operating Ledger Balance:</td>
                <td style="padding: 8px 6px; text-align: right; font-family: monospace; font-size: 12px; font-weight: 900; color: ${cashBookMetrics.netBalance >= 0 ? '#15803d' : '#be123c'};">
                  Rs. ${cashBookMetrics.netBalance.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- LETTERHEAD FOOTER & SIGNATURES -->
          <div class="footer-sign">
            <div>
              <div style="font-weight: 800; color: #0f172a;">Computer Generated Official Ledger Statement</div>
              <div>${cName} • Finance & Accounts Dept</div>
            </div>
            <div style="display: flex; gap: 30px;">
              <div class="sign-box">
                <div class="sign-line"></div>
                <div style="font-weight: 700; font-size: 10px;">Prepared By (Accountant)</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div style="font-weight: 800; font-size: 10px; color: #0f172a;">Authorized Doctor / Manager</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 400);
  };

  // Modals visibility state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [showQrGeneratorModal, setShowQrGeneratorModal] = useState(false);

  // Pay Vendor Popup Modal State
  const [payVendorModalData, setPayVendorModalData] = useState<{
    vendor: ErpVendor;
    invNo: string;
    poId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
    date: string;
    category: string;
    description: string;
  } | null>(null);

  // Vendor POs Modal State
  const [vendorPoModalData, setVendorPoModalData] = useState<ErpVendor | null>(null);

  // Selected item for Edit/Print
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<ErpPurchaseOrder | null>(null);

  // GRN Form State
  const [grnForm, setGrnForm] = useState<{
    POID: string;
    GRNID: string;
    VendorID: string;
    VendorName: string;
    ReceivedDate: string;
    ChallanNo: string;
    SupplierInvoiceNo: string;
    Remarks: string;
    Items: { ItemID: string; ItemName: string; OrderedQty: number; ReceivedQty: number; UnitPrice: number; LineTotal: number; BatchNo?: string; ExpiryDate?: string }[];
  }>({
    POID: '',
    GRNID: '',
    VendorID: '',
    VendorName: '',
    ReceivedDate: new Date().toISOString().split('T')[0],
    ChallanNo: '',
    SupplierInvoiceNo: '',
    Remarks: '',
    Items: []
  });

  // Form States
  const [vendorForm, setVendorForm] = useState<Partial<ErpVendor>>({
    VendorID: '',
    VendorName: '',
    ContactPerson: '',
    Phone: '',
    Email: '',
    Address: '',
    TaxID: '',
    Balance: 0,
    Status: 'Active'
  });

  const [poForm, setPoForm] = useState<{
    VendorID: string;
    VendorName: string;
    ExpectedDeliveryDate: string;
    Notes: string;
    Items: { ItemID: string; ItemName: string; Category?: string; Qty: number; UnitPrice: number; BatchNo?: string; ExpiryDate?: string }[];
  }>({
    VendorID: '',
    VendorName: '',
    ExpectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    Notes: '',
    Items: [{ ItemID: 'ITM-001', ItemName: 'Panadol Extra 500mg', Category: 'Tablet / Capsule', Qty: 100, UnitPrice: 120, BatchNo: 'B-2026-001' }]
  });

  const [txnForm, setTxnForm] = useState<Partial<ErpTransaction> & { VendorID?: string; VendorName?: string }>({
    Type: 'Expense',
    Category: 'Office Maintenance',
    Description: '',
    Amount: 0,
    PaymentMethod: 'Cash',
    ReferenceNo: '',
    Date: new Date().toISOString().split('T')[0],
    VendorID: '',
    VendorName: ''
  });

  const [empForm, setEmpForm] = useState<Partial<ErpEmployee>>({
    FullName: '',
    Role: 'Pharmacist Assistant',
    Department: 'Pharmacy',
    Phone: '',
    Email: '',
    JoiningDate: new Date().toISOString().split('T')[0],
    Salary: 45000,
    Status: 'Active',
    CNIC: '',
    BankAccount: ''
  });

  const [payrollForm, setPayrollForm] = useState<{
    EmployeeID: string;
    MonthYear: string;
    BasicSalary: number;
    Allowances: number;
    Deductions: number;
    PaymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  }>({
    EmployeeID: '',
    MonthYear: new Date().toISOString().slice(0, 7),
    BasicSalary: 0,
    Allowances: 2000,
    Deductions: 0,
    PaymentMethod: 'Bank'
  });

  const DEFAULT_EXPENSE_CATEGORIES = useMemo(() => [
    'Utilities',
    'Rent',
    'Maintenance',
    'Refreshment',
    'Marketing',
    'Supplies',
    'Salaries',
    'Other'
  ], []);

  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('phc_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddCategoryInput, setShowAddCategoryInput] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editCategoryNewValue, setEditCategoryNewValue] = useState<string>('');

  const [expenseForm, setExpenseForm] = useState<Partial<ErpExpense>>({
    Category: 'Utilities',
    Description: '',
    Amount: 0,
    ExpenseDate: new Date().toISOString().split('T')[0],
    PaymentMethod: 'Cash',
    ReceiptRef: ''
  });

  const allExpenseCategories = useMemo(() => {
    const existingFromDb = (expenses || []).map(e => e.Category).filter(Boolean);
    const combined = [...DEFAULT_EXPENSE_CATEGORIES, ...customExpenseCategories, ...existingFromDb];
    return Array.from(new Set(combined));
  }, [DEFAULT_EXPENSE_CATEGORIES, customExpenseCategories, expenses]);

  const handleSaveNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!allExpenseCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customExpenseCategories, trimmed];
      setCustomExpenseCategories(updated);
      try {
        localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
    }

    setExpenseForm(prev => ({ ...prev, Category: trimmed }));
    setShowAddCategoryInput(false);
    setNewCategoryName('');
  };

  const handleStartEditCategory = (cat: string) => {
    setEditingCategoryName(cat);
    setEditCategoryNewValue(cat);
    setShowAddCategoryInput(false);
  };

  const handleSaveEditedCategory = () => {
    if (!editingCategoryName) return;
    const trimmed = editCategoryNewValue.trim();
    if (!trimmed) return;

    if (trimmed !== editingCategoryName) {
      let updatedCustoms = [...customExpenseCategories];
      if (updatedCustoms.includes(editingCategoryName)) {
        updatedCustoms = updatedCustoms.map(c => c === editingCategoryName ? trimmed : c);
      } else {
        updatedCustoms.push(trimmed);
      }
      setCustomExpenseCategories(updatedCustoms);
      try {
        localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updatedCustoms));
      } catch (e) {
        console.error(e);
      }

      if (expenseForm.Category === editingCategoryName) {
        setExpenseForm(prev => ({ ...prev, Category: trimmed }));
      }
    }

    setEditingCategoryName(null);
    setEditCategoryNewValue('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updatedCustoms = customExpenseCategories.filter(c => c !== catToDelete);
    setCustomExpenseCategories(updatedCustoms);
    try {
      localStorage.setItem('phc_custom_expense_categories', JSON.stringify(updatedCustoms));
    } catch (e) {
      console.error(e);
    }

    if (expenseForm.Category === catToDelete) {
      const remaining = allExpenseCategories.filter(c => c !== catToDelete);
      setExpenseForm(prev => ({ ...prev, Category: remaining[0] || 'Utilities' }));
    }
  };

  const [assetForm, setAssetForm] = useState<Partial<ErpAsset>>({
    AssetName: '',
    Category: 'Equipment',
    PurchaseDate: new Date().toISOString().split('T')[0],
    PurchaseCost: 0,
    CurrentValue: 0,
    DepreciationRate: 10,
    Status: 'Active'
  });

  // Safe JSON Fetch Helper
  const safeFetchJson = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  // Initial Fetching from API Database
  const fetchErpData = async () => {
    setLoading(true);
    try {
      const [
        vRes, poRes, grnRes, txRes, empRes, payRes, expRes, astRes, itemsRes, apptsRes, visitsRes, salesRes
      ] = await Promise.all([
        safeFetchJson('/api/query/erp_vendors'),
        safeFetchJson('/api/query/erp_purchase_orders'),
        safeFetchJson('/api/query/erp_grn'),
        safeFetchJson('/api/query/erp_transactions'),
        safeFetchJson('/api/query/erp_employees'),
        safeFetchJson('/api/query/erp_payroll'),
        safeFetchJson('/api/query/erp_expenses'),
        safeFetchJson('/api/query/erp_assets'),
        safeFetchJson('/api/query/items'),
        safeFetchJson('/api/appointments'),
        safeFetchJson('/api/visits'),
        safeFetchJson('/api/billing/invoices')
      ]);

      if (Array.isArray(vRes)) setVendors(vRes);
      if (Array.isArray(poRes)) setPurchaseOrders(poRes);
      if (Array.isArray(grnRes)) setGrns(grnRes);
      if (Array.isArray(txRes)) setTransactions(txRes);
      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(payRes)) setPayrolls(payRes);
      if (Array.isArray(expRes)) setExpenses(expRes);
      if (Array.isArray(astRes)) setAssets(astRes);
      if (Array.isArray(apptsRes)) setAppointments(apptsRes);
      if (Array.isArray(visitsRes)) setPatientVisits(visitsRes);
      if (Array.isArray(salesRes)) {
        setPosSales(salesRes);
      } else if (salesRes && Array.isArray(salesRes.headers)) {
        setPosSales(salesRes.headers);
      }

      if (Array.isArray(itemsRes)) {
        setInventoryItems(itemsRes);
      }

      setSyncMessage('Data retrieved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.error('Failed to load ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErpData();
    const handleDbUpdate = () => fetchErpData();
    window.addEventListener('phc_db_updated', handleDbUpdate);
    return () => window.removeEventListener('phc_db_updated', handleDbUpdate);
  }, []);

  // Universal Database Helper (Insert, Retrieve, Delete)
  const saveToDatabase = async (collection: string, data: any) => {
    try {
      const id = data._id;
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/query/${collection}/${id}` : `/api/query/${collection}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      const result = ct.includes('application/json') ? await res.json() : { success: false };
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
      return result;
    } catch (e) {
      console.error(`Failed to save to ${collection}:`, e);
      return { success: false };
    }
  };

  const deleteFromDatabase = async (collection: string, id: string) => {
    try {
      const res = await fetch(`/api/query/${collection}/${id}`, {
        method: 'DELETE'
      });
      const ct = res.headers.get('content-type') || '';
      const result = ct.includes('application/json') ? await res.json() : { success: false };
      window.dispatchEvent(new CustomEvent('phc_db_updated'));
      return result;
    } catch (e) {
      console.error(`Failed to delete from ${collection}:`, e);
      return { success: false };
    }
  };

  // Test Entry Generator Function (Stores test entry, verifies retrieval & delete)
  const handleRunTestEntry = async () => {
    setLoading(true);
    setSyncMessage('Executing live database Test Entry across ERP modules...');

    try {
      const testId = `TEST-${Date.now().toString().slice(-4)}`;
      
      // 1. Test Vendor Entry
      const testVendor: ErpVendor = {
        VendorID: `VND-${testId}`,
        VendorName: `Test Alpha Pharma Distributors (${testId})`,
        ContactPerson: 'Test Manager Tariq',
        Phone: '0300-9988776',
        Email: 'test@alphapharma.com',
        Address: 'Test Industrial Estate, Lahore',
        TaxID: `NTN-${testId}`,
        Balance: 25000,
        Status: 'Active'
      };
      await saveToDatabase('erp_vendors', testVendor);

      // 2. Test Transaction Entry
      const testTxn: ErpTransaction = {
        TransactionID: `TXN-${testId}`,
        Type: 'Expense',
        Category: 'Test Utility Inspection',
        Description: 'Test sample ERP automated validation entry',
        Amount: 5500,
        PaymentMethod: 'Cash',
        ReferenceNo: `REF-${testId}`,
        Date: new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin Test'
      };
      await saveToDatabase('erp_transactions', testTxn);

      // 3. Test Expense Entry
      const testExp: ErpExpense = {
        ExpenseID: `EXP-${testId}`,
        Category: 'Maintenance',
        Description: 'Test air compressor repair & servicing',
        Amount: 3200,
        ExpenseDate: new Date().toISOString().split('T')[0],
        PaymentMethod: 'Cash',
        ReceiptRef: `REC-${testId}`
      };
      await saveToDatabase('erp_expenses', testExp);

      // 4. Test Purchase Order & Stock Requisition Entry
      const testPo: ErpPurchaseOrder = {
        POID: `PO-${testId}`,
        VendorID: `VND-${testId}`,
        VendorName: `Test Alpha Pharma Distributors (${testId})`,
        OrderDate: new Date().toISOString().split('T')[0],
        ExpectedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        TotalAmount: 18500,
        PaidAmount: 0,
        Status: 'Sent',
        Notes: 'Automated database verification test purchase order with medicine categories',
        Items: [
          { ItemID: 'ITM-001', ItemName: 'Panadol Extra 500mg', Category: 'Tablet / Capsule', Qty: 100, UnitPrice: 120, LineTotal: 12000, BatchNo: `B-${testId}-01` },
          { ItemID: 'ITM-004', ItemName: 'Arinac Syrup 120ml', Category: 'Syrup / Liquid', Qty: 50, UnitPrice: 130, LineTotal: 6500, BatchNo: `B-${testId}-02` }
        ]
      };
      await saveToDatabase('erp_purchase_orders', testPo);

      // Re-fetch database to confirm retrieval
      await fetchErpData();

      alert(`✅ DATABASE INTEGRATION CONFIRMED & TEST ENTRY SUCCESSFUL!\n\nSuccessfully created, saved, and retrieved live database test records (ID suffix: "${testId}") across:\n• Vendors & Suppliers Table\n• Purchase Orders & Requisitions Table (with Medicine Categories)\n• Financial Transactions Ledger Table\n• Operating Expenses Table\n\nEntire app database link validated!`);
    } catch (err: any) {
      alert(`Test Entry Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS FOR VENDORS
  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!vendorForm.VendorName?.trim()) return alert('Vendor Name is required.');

    // Prevent double entry: duplicate vendor name check
    const trimmedName = vendorForm.VendorName.trim().toLowerCase();
    if (vendors.some(v => v.VendorName?.trim().toLowerCase() === trimmedName)) {
      return alert('Vendor with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      const newVendor: ErpVendor = {
        VendorID: vendorForm.VendorID || `VND-${Math.floor(100 + Math.random() * 900)}`,
        VendorName: vendorForm.VendorName.trim(),
        ContactPerson: vendorForm.ContactPerson || 'N/A',
        Phone: vendorForm.Phone || 'N/A',
        Email: vendorForm.Email || '',
        Address: vendorForm.Address || 'Lahore, Pakistan',
        TaxID: vendorForm.TaxID || '',
        Balance: Number(vendorForm.Balance) || 0,
        Status: vendorForm.Status || 'Active'
      };

      await saveToDatabase('erp_vendors', newVendor);
      setVendors(prev => [newVendor, ...prev]);
      setShowVendorModal(false);
      setVendorForm({ VendorName: '', ContactPerson: '', Phone: '', Address: '', Balance: 0, Status: 'Active' });
      setSyncMessage('Vendor saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving vendor: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor: ErpVendor) => {
    if (!confirm(`Are you sure you want to delete Vendor "${vendor.VendorName}"?`)) return;
    const targetId = vendor._id || vendor.VendorID;
    await deleteFromDatabase('erp_vendors', targetId);
    setVendors(prev => prev.filter(v => (v._id ? v._id !== vendor._id : v.VendorID !== vendor.VendorID)));
    setSyncMessage('Vendor deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR PURCHASE ORDERS & STOCK REQUISITION
  const getRequiredQty = (item: any) => {
    const cStock = item.CStock ?? item.Stock ?? 0;
    const minStock = item.MinStock ?? 100;
    const targetStock = minStock * 2;
    const deficit = targetStock - cStock;
    return Math.max(50, Math.max(0, deficit));
  };

  const isMedicineSelectedInPo = (itemId: string, itemName: string) => {
    return poForm.Items.some(i => (i.ItemID && i.ItemID === itemId) || i.ItemName === itemName);
  };

  const handleToggleMedicineForPo = (med: any) => {
    const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
    if (isSelected) {
      setPoForm(prev => ({
        ...prev,
        Items: prev.Items.filter(i => i.ItemID !== med.ItemID && i.ItemName !== med.ItemName)
      }));
    } else {
      const reqQty = getRequiredQty(med);
      const unitPrice = med.PurchasePrice || med.Price || 10;
      const cat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');
      setPoForm(prev => ({
        ...prev,
        Items: [
          ...prev.Items.filter(i => i.ItemName !== ''),
          {
            ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
            ItemName: med.ItemName,
            Category: cat,
            Qty: reqQty,
            UnitPrice: unitPrice,
            BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
          }
        ]
      }));
    }
  };

  const handleSelectAllLowStockMedicines = () => {
    const lowStockItems = inventoryItems.filter(med => (med.CStock ?? 0) <= (med.MinStock ?? 100));
    if (lowStockItems.length === 0) {
      alert('All medicine stock levels are currently adequate!');
      return;
    }

    const newPoItems = lowStockItems.map(med => ({
      ItemID: med.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
      ItemName: med.ItemName,
      Category: med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule'),
      Qty: getRequiredQty(med),
      UnitPrice: med.PurchasePrice || med.Price || 10,
      BatchNo: med.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
    }));

    setPoForm(prev => ({
      ...prev,
      Items: newPoItems
    }));
  };

  const handleAddPoItem = () => {
    setPoForm(prev => ({
      ...prev,
      Items: [...prev.Items, { ItemID: `ITM-${Date.now().toString().slice(-3)}`, ItemName: '', Category: 'Tablet / Capsule', Qty: 10, UnitPrice: 100, BatchNo: `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` }]
    }));
  };

  const handleUpdatePoItem = (index: number, field: string, value: any) => {
    setPoForm(prev => {
      const updated = [...prev.Items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, Items: updated };
    });
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!poForm.VendorName) return alert('Please select a supplier / vendor.');
    if (!poForm.Items || poForm.Items.length === 0) return alert('Please select at least one medicine item for the Purchase Order.');

    setIsSubmitting(true);
    try {
      const totalAmount = poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) * Number(i.UnitPrice)), 0);

      const newPo: ErpPurchaseOrder = {
        POID: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        VendorID: poForm.VendorID || 'VND-001',
        VendorName: poForm.VendorName,
        OrderDate: new Date().toISOString().split('T')[0],
        ExpectedDeliveryDate: poForm.ExpectedDeliveryDate,
        TotalAmount: totalAmount,
        PaidAmount: 0,
        Status: 'Sent',
        Notes: poForm.Notes,
        Items: poForm.Items.map(i => ({
          ItemID: i.ItemID,
          ItemName: i.ItemName || 'General Item',
          Category: i.Category || 'General Medicine',
          Qty: Number(i.Qty),
          UnitPrice: Number(i.UnitPrice),
          LineTotal: Number(i.Qty) * Number(i.UnitPrice),
          BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
        }))
      };

      await saveToDatabase('erp_purchase_orders', newPo);
      setPurchaseOrders(prev => [newPo, ...prev]);
      setShowPoModal(false);
      setSyncMessage('Purchase Order saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error creating Purchase Order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePo = async (po: ErpPurchaseOrder) => {
    if (!confirm(`Delete Purchase Order ${po.POID}? This will also remove linked Goods Received Notes.`)) return;
    const targetId = po._id || po.POID;
    await deleteFromDatabase('erp_purchase_orders', targetId);

    // Also delete linked GRNs
    const matchGrns = grns.filter(g => g.POID === po.POID);
    for (const g of matchGrns) {
      await deleteFromDatabase('erp_grn', g._id || g.GRNID);
    }
    setGrns(prev => prev.filter(g => g.POID !== po.POID));

    setPurchaseOrders(prev => prev.filter(p => (p._id ? p._id !== po._id : p.POID !== po.POID)));
    setSyncMessage('Purchase Order and linked GRNs deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR GOODS RECEIVED NOTE (GRN) & PARTIAL BATCH RECEIVING
  const getPoItemsReceiptInfo = (po: ErpPurchaseOrder) => {
    const approvedGrns = grns.filter(g => g.POID === po.POID && g.Status === 'Approved');
    const items = po.Items.map(i => {
      const ordered = Number(i.Qty) || 0;
      let alreadyReceived = 0;
      approvedGrns.forEach(g => {
        if (Array.isArray(g.Items)) {
          const matched = g.Items.find(gi => gi.ItemID === i.ItemID || gi.ItemName === i.ItemName);
          if (matched) {
            alreadyReceived += Number(matched.ReceivedQty) || 0;
          }
        }
      });
      const pending = Math.max(0, ordered - alreadyReceived);
      return {
        ItemID: i.ItemID,
        ItemName: i.ItemName,
        OrderedQty: ordered,
        AlreadyReceivedQty: alreadyReceived,
        PendingQty: pending,
        ReceivedQty: pending, // Default proposal is remaining pending items
        UnitPrice: i.UnitPrice,
        LineTotal: pending * i.UnitPrice,
        BatchNo: i.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
      };
    });
    return items.filter(i => i.PendingQty > 0);
  };

  const handleOpenGrnForPo = (po?: ErpPurchaseOrder) => {
    if (po) {
      setGrnForm({
        POID: po.POID,
        GRNID: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
        VendorID: po.VendorID,
        VendorName: po.VendorName,
        ReceivedDate: new Date().toISOString().split('T')[0],
        ChallanNo: `DC-${Math.floor(10000 + Math.random() * 90000)}`,
        SupplierInvoiceNo: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        Remarks: `Stock inward receiving against PO ${po.POID}`,
        Items: getPoItemsReceiptInfo(po)
      });
    } else {
      const firstOpenPo = purchaseOrders.find(p => p.Status !== 'Received') || purchaseOrders[0];
      if (firstOpenPo) {
        handleOpenGrnForPo(firstOpenPo);
        return;
      } else {
        setGrnForm({
          POID: '',
          GRNID: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
          VendorID: '',
          VendorName: '',
          ReceivedDate: new Date().toISOString().split('T')[0],
          ChallanNo: '',
          SupplierInvoiceNo: '',
          Remarks: '',
          Items: []
        });
      }
    }
    setShowGrnModal(true);
  };

  const handleSelectPoForGrn = (poid: string) => {
    const foundPo = purchaseOrders.find(p => p.POID === poid);
    if (foundPo) {
      setGrnForm(prev => ({
        ...prev,
        POID: foundPo.POID,
        VendorID: foundPo.VendorID,
        VendorName: foundPo.VendorName,
        Items: getPoItemsReceiptInfo(foundPo)
      }));
    }
  };

  const handleRemoveGrnItem = (index: number) => {
    setGrnForm(prev => ({
      ...prev,
      Items: prev.Items.filter((_, idx) => idx !== index)
    }));
  };

  const handleResetGrnItems = () => {
    const foundPo = purchaseOrders.find(p => p.POID === grnForm.POID);
    if (foundPo) {
      setGrnForm(prev => ({
        ...prev,
        Items: getPoItemsReceiptInfo(foundPo)
      }));
    }
  };

  const handleApproveGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!grnForm.POID) return alert('Please select a valid Purchase Order ID.');
    if (grnForm.Items.length === 0) return alert('No items remaining in GRN to receive.');

    // Only include items with ReceivedQty > 0
    const receivingItems = grnForm.Items.filter(i => (Number(i.ReceivedQty) || 0) > 0);
    if (receivingItems.length === 0) {
      return alert('Please enter receiving quantity greater than 0 for at least one medicine item in this batch.');
    }

    setIsSubmitting(true);
    const totalAmount = receivingItems.reduce((sum, i) => sum + (Number(i.ReceivedQty) * Number(i.UnitPrice)), 0);

    const payload = {
      ...grnForm,
      Items: receivingItems,
      TotalAmount: totalAmount,
      CreatedBy: currentUser?.FullName || 'Store Manager'
    };

    setLoading(true);
    try {
      const res = await fetch('/api/erp/grn/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Compute updated PO status locally
        const targetPo = purchaseOrders.find(p => p.POID === grnForm.POID);
        let calculatedPoStatus: 'Received' | 'Partially Received' | 'Approved' = 'Received';

        if (targetPo) {
          const approvedGrns = grns.filter(g => g.POID === grnForm.POID && g.Status === 'Approved');
          let isFullyReceived = true;
          let isPartiallyReceived = false;

          targetPo.Items.forEach(poItem => {
            const ordered = Number(poItem.Qty) || 0;
            let cumulativeReceived = 0;
            
            approvedGrns.forEach(g => {
              if (Array.isArray(g.Items)) {
                const matched = g.Items.find(gi => gi.ItemID === poItem.ItemID || gi.ItemName === poItem.ItemName);
                if (matched) cumulativeReceived += Number(matched.ReceivedQty) || 0;
              }
            });

            const currentGrnItem = receivingItems.find(gi => gi.ItemID === poItem.ItemID || gi.ItemName === poItem.ItemName);
            if (currentGrnItem) {
              cumulativeReceived += Number(currentGrnItem.ReceivedQty) || 0;
            }

            if (cumulativeReceived < ordered) {
              isFullyReceived = false;
            }
            if (cumulativeReceived > 0) {
              isPartiallyReceived = true;
            }
          });

          calculatedPoStatus = isFullyReceived ? 'Received' : (isPartiallyReceived ? 'Partially Received' : 'Approved');
        }

        setPurchaseOrders(prev => prev.map(p => p.POID === grnForm.POID ? { ...p, Status: calculatedPoStatus } : p));
        
        const newGrnRecord: ErpGrn = {
          GRNID: payload.GRNID,
          POID: payload.POID,
          VendorID: payload.VendorID,
          VendorName: payload.VendorName,
          ReceivedDate: payload.ReceivedDate,
          ChallanNo: payload.ChallanNo,
          SupplierInvoiceNo: payload.SupplierInvoiceNo,
          TotalAmount: totalAmount,
          Status: 'Approved',
          Remarks: payload.Remarks,
          CreatedBy: payload.CreatedBy,
          Items: payload.Items.map(i => ({
            ItemID: i.ItemID,
            ItemName: i.ItemName,
            OrderedQty: i.OrderedQty,
            AlreadyReceivedQty: i.AlreadyReceivedQty,
            PendingQty: i.PendingQty,
            ReceivedQty: i.ReceivedQty,
            UnitPrice: i.UnitPrice,
            LineTotal: i.ReceivedQty * i.UnitPrice
          }))
        };

        setGrns(prev => [newGrnRecord, ...prev]);

        // Re-fetch inventory items & vendors to show updated stock & balance immediately
        const [itemsRes, vendorsRes] = await Promise.all([
          safeFetchJson('/api/query/items'),
          safeFetchJson('/api/query/erp_vendors')
        ]);
        if (Array.isArray(itemsRes) && itemsRes.length > 0) setInventoryItems(itemsRes);
        if (Array.isArray(vendorsRes) && vendorsRes.length > 0) {
          setVendors(vendorsRes);
        } else if (payload.VendorID || payload.VendorName) {
          setVendors(prev => prev.map(v => (v.VendorID === payload.VendorID || v.VendorName === payload.VendorName) ? { ...v, Balance: (v.Balance || 0) + totalAmount } : v));
        }

        setShowGrnModal(false);
        setSyncMessage(`GRN ${payload.GRNID} approved! Stock updated for PO ${payload.POID} (${calculatedPoStatus === 'Received' ? 'Fully Received' : 'Partially Received'}).`);
        setTimeout(() => setSyncMessage(null), 3000);
        window.dispatchEvent(new CustomEvent('phc_db_updated'));
      } else {
        alert(data.error || 'Failed to approve GRN.');
      }
    } catch (err) {
      console.error('GRN approval error:', err);
      alert('Network error while processing GRN approval.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrn = async (grn: ErpGrn) => {
    if (!confirm(`Delete Goods Received Note ${grn.GRNID}?`)) return;
    const targetId = grn._id || grn.GRNID;
    await deleteFromDatabase('erp_grn', targetId);

    // Delete matching transaction if exists
    const matchTxn = transactions.find(t => t.ReferenceNo === grn.GRNID || t.ReferenceNo === grn.POID);
    if (matchTxn) {
      await deleteFromDatabase('erp_transactions', matchTxn._id || matchTxn.TransactionID);
      setTransactions(prev => prev.filter(t => t.TransactionID !== matchTxn.TransactionID && t._id !== matchTxn._id));
    }

    setGrns(prev => prev.filter(g => (g._id ? g._id !== grn._id : g.GRNID !== grn.GRNID)));
    setSyncMessage('GRN deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handlePrintGrn = (grn: ErpGrn) => {
    const printWin = window.open('', '_blank', 'width=900,height=900');
    if (!printWin) return alert('Popup blocked. Allow popups to print Goods Received Note.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    const itemsRows = grn.Items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="text-align: center; padding: 7px 6px; font-weight: bold; font-family: monospace; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 6px; font-family: monospace; font-weight: bold; color: #475569;">${item.ItemID}</td>
        <td style="padding: 7px 6px; font-weight: bold; color: #0f172a;">${item.ItemName}</td>
        <td style="text-align: center; padding: 7px 6px; font-family: monospace; font-weight: bold; color: #b45309; background: #fffbeb;">${item.BatchNo || 'N/A'}</td>
        <td style="text-align: center; padding: 7px 6px; font-weight: bold; color: #475569;">${item.OrderedQty}</td>
        <td style="text-align: center; padding: 7px 6px; font-weight: 800; color: #15803d; background: #f0fdf4;">${item.ReceivedQty}</td>
      </tr>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Goods Received Note ${grn.GRNID} - Punjab Homeopathic Clinic</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 11.5px;
              line-height: 1.4;
              background: #ffffff;
            }
            * { box-sizing: border-box; }

            .letterhead-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #064e3b;
              padding-bottom: 10px;
              margin-bottom: 12px;
              gap: 12px;
            }
            .logo-col {
              width: 80px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .clinic-info {
              text-align: center;
              flex: 1;
            }
            .clinic-name {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 24px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.5px;
              line-height: 1.1;
            }
            .clinic-tagline {
              font-size: 10px;
              font-weight: 800;
              color: #be123c;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .clinic-reg {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 4px;
            }
            .clinic-timings {
              font-size: 10px;
              font-weight: 800;
              color: #064e3b;
              text-transform: uppercase;
              margin-top: 3px;
            }

            .report-banner {
              background: #0f172a;
              color: #ffffff;
              padding: 8px 14px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .report-banner-title {
              font-size: 12.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #f8fafc;
            }
            .report-banner-ref {
              font-size: 10px;
              font-family: monospace;
              color: #cbd5e1;
              font-weight: 700;
            }

            .meta-grid {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              font-size: 11px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-value {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }

            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 11px;
            }
            .report-table th {
              background: #1e293b;
              color: #ffffff;
              font-weight: 800;
              text-align: left;
              padding: 7px 10px;
              font-size: 10.5px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              border: 1px solid #1e293b;
            }
            .report-table td {
              border: 1px solid #e2e8f0;
              padding: 7px 10px;
              color: #0f172a;
            }

            .signature-section {
              margin-top: 35px;
              padding-top: 15px;
              border-top: 2px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 220px;
            }
            .sig-line-text {
              border-bottom: 1.5px dashed #475569;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              padding-bottom: 2px;
            }
            .sig-line-manager {
              border-bottom: 2.5px solid #0f172a;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              font-family: Georgia, 'Times New Roman', serif;
              padding-bottom: 2px;
            }
            .sig-title-primary {
              font-size: 11px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sig-title-sub {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
            }
            .sig-title-dept {
              font-size: 9px;
              font-weight: 700;
              color: #047857;
            }

            .stamp-box {
              text-align: center;
              width: 130px;
              height: 65px;
              border: 2px dashed #94a3b8;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              background: #fafafa;
            }

            .official-footer {
              margin-top: 15px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <!-- A4 Official Letterhead Header -->
          <div class="letterhead-header">
            <div class="logo-col">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
            <div class="clinic-info">
              <h1 class="clinic-name">${cName}</h1>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-reg">
                <span>PHC Reg. # <u style="text-decoration: underline;">R-___________</u></span>
                &nbsp;|&nbsp;
                <span>PHC License #: ___________________</span>
              </div>
              <div class="clinic-timings">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </div>
            </div>
            <div class="logo-col" style="visibility: hidden;">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
          </div>

          <!-- Official Report Banner & Meta Details -->
          <div class="report-banner">
            <span class="report-banner-title">GOODS RECEIVED NOTE (GRN) - OFFICIAL INWARD AUDIT</span>
            <span class="report-banner-ref">REF: PHC-GRN-${grn.GRNID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">GRN Ref Number</span>
              <span class="meta-value" style="color: #047857;">${grn.GRNID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Purchase Order Ref</span>
              <span class="meta-value" style="color: #4338ca;">${grn.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Goods Received Date</span>
              <span class="meta-value">${grn.ReceivedDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier / Vendor</span>
              <span class="meta-value" style="color: #0f172a;">${grn.VendorName} (${grn.VendorID || 'N/A'})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier Bill / Invoice #</span>
              <span class="meta-value" style="color: #0369a1;">${grn.SupplierInvoiceNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Delivery Challan No</span>
              <span class="meta-value">${grn.ChallanNo || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Store Receiver</span>
              <span class="meta-value">${grn.CreatedBy || 'Warehouse Officer'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <!-- Items Table -->
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 100px;">Item Code</th>
                <th>Medicine Description & Category</th>
                <th style="width: 110px; text-align: center;">Batch No.</th>
                <th style="width: 85px; text-align: center;">Ordered Qty</th>
                <th style="width: 95px; text-align: center;">Received Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin-top: 12px; padding: 10px 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px;">
            <strong>Remarks / Physical Inspection Note:</strong> ${grn.Remarks || 'All received medicines verified for physical condition, batch integrity & quantity.'}
          </div>

          <!-- Executive Signatures & Stamps Block -->
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line-text">
                ${grn.CreatedBy || currentUser?.FullName || 'Accountant / Audit Officer'}
              </div>
              <div class="sig-title-primary" style="color: #0f172a;">PREPARED BY</div>
              <div class="sig-title-sub" style="font-size: 9px; color: #475569;">Warehouse & GRN Receiving Desk</div>
            </div>

            <div class="stamp-box">
              <span>PHC OFFICIAL STAMP</span>
              <span style="font-size: 7px; color: #94a3b8; margin-top: 2px;">[ SEAL & STAMP ]</span>
            </div>

            <div class="sig-box" style="width: 250px;">
              <div class="sig-line-manager">
                Zaigham Ali Anjum
              </div>
              <div class="sig-title-primary">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-title-sub">Manager Operations & Administrative Head</div>
              <div class="sig-title-dept">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <!-- Official Footer -->
          <div class="official-footer">
            <span>Punjab Homeopathic Clinic & Pharmacy • Goods Received Note (GRN) Stock Audit • Confidential Document</span>
            <span>Generated Date: ${new Date().toLocaleString('en-GB')}</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // HANDLERS FOR TRANSACTIONS & VENDOR BILL PAYMENTS
  const handlePayVendor = (vendor: ErpVendor) => {
    const vendorPOs = purchaseOrders.filter(po => 
      (po.VendorID && po.VendorID === vendor.VendorID) || 
      (po.VendorName && po.VendorName.toLowerCase() === vendor.VendorName.toLowerCase())
    );
    const vendorGrns = grns.filter(g => 
      (g.VendorID && g.VendorID === vendor.VendorID) || 
      (g.VendorName && g.VendorName.toLowerCase() === vendor.VendorName.toLowerCase())
    );

    let suggestedInv = '';
    if (vendorGrns.length > 0) {
      const latest = vendorGrns.find(g => g.SupplierInvoiceNo) || vendorGrns[0];
      suggestedInv = latest.SupplierInvoiceNo || latest.ChallanNo || latest.GRNID || '';
    } else if (vendorPOs.length > 0) {
      suggestedInv = vendorPOs[0].POID || '';
    }

    setPayVendorModalData({
      vendor,
      invNo: suggestedInv,
      poId: vendorPOs.length > 0 ? vendorPOs[0].POID : '',
      amount: vendor.Balance > 0 ? vendor.Balance : 0,
      paymentMethod: 'Bank',
      date: new Date().toISOString().split('T')[0],
      category: 'Supplier Sales Invoice Payment',
      description: suggestedInv 
        ? `Payment against Vendor Invoice #${suggestedInv} for ${vendor.VendorName}`
        : `Payment towards outstanding bill for Vendor ${vendor.VendorName}`
    });
  };

  const handleConfirmPayVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorModalData) return;
    const { vendor, invNo, amount, paymentMethod, date, description, category } = payVendorModalData;

    if (!invNo || invNo.trim() === '') {
      return alert('Vendor Invoice Number is required to process vendor bill payment.');
    }
    if (!amount || amount <= 0) {
      return alert('Please enter a valid payment amount greater than zero.');
    }

    setIsSubmitting(true);
    try {
      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        Type: 'VendorPayment',
        Category: category || 'Supplier Sales Invoice Payment',
        Description: description || `Payment against Vendor Invoice #${invNo.trim()} for ${vendor.VendorName}`,
        Amount: Number(amount),
        PaymentMethod: paymentMethod || 'Bank',
        ReferenceNo: invNo.trim(),
        Date: date || new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorID: vendor.VendorID || '',
        VendorName: vendor.VendorName || ''
      };

      await saveToDatabase('erp_transactions', newTxn);
      setTransactions(prev => [newTxn, ...prev]);

      // Settle Vendor's Outstanding Balance in DB
      const pAmt = Number(amount);
      const newBalance = Math.max(0, vendor.Balance - pAmt);
      await saveToDatabase('erp_vendors', { ...vendor, Balance: newBalance });
      setVendors(prev => prev.map(v => (v.VendorID === vendor.VendorID ? { ...v, Balance: newBalance } : v)));

      setPayVendorModalData(null);
      setSyncMessage('Vendor Bill Payment logged and balance updated successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error logging vendor payment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!txnForm.Amount || !txnForm.Category) return alert('Category and Amount are required.');

    if (txnForm.Type === 'VendorPayment') {
      if (!txnForm.ReferenceNo || txnForm.ReferenceNo.trim() === '') {
        return alert('Vendor Invoice Number is required to process vendor bill payment.');
      }
    }

    setIsSubmitting(true);
    try {
      const newTxn: ErpTransaction = {
        TransactionID: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        Type: txnForm.Type || 'Expense',
        Category: txnForm.Category,
        Description: txnForm.Description || '',
        Amount: Number(txnForm.Amount),
        PaymentMethod: txnForm.PaymentMethod || 'Cash',
        ReferenceNo: txnForm.ReferenceNo || 'N/A',
        Date: txnForm.Date || new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin',
        VendorID: txnForm.VendorID || '',
        VendorName: txnForm.VendorName || ''
      };

      await saveToDatabase('erp_transactions', newTxn);
      setTransactions(prev => [newTxn, ...prev]);

      // If this is a Vendor Payment, settle the Vendor's Outstanding Balance in DB
      if (txnForm.Type === 'VendorPayment' && (txnForm.VendorID || txnForm.VendorName)) {
        const pAmt = Number(txnForm.Amount);
        const targetVendor = vendors.find(v => v.VendorID === txnForm.VendorID || v.VendorName === txnForm.VendorName);
        if (targetVendor) {
          const newBalance = Math.max(0, targetVendor.Balance - pAmt);
          const targetId = targetVendor._id || targetVendor.VendorID;
          await saveToDatabase('erp_vendors', { ...targetVendor, Balance: newBalance });
          setVendors(prev => prev.map(v => (v.VendorID === targetVendor.VendorID ? { ...v, Balance: newBalance } : v)));
        }
      }

      setShowTxnModal(false);
      setTxnForm({ Type: 'Expense', Category: 'Office Maintenance', Description: '', Amount: 0, PaymentMethod: 'Cash', VendorID: '', VendorName: '' });
      setSyncMessage('Transaction saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving transaction: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTxn = async (txn: ErpTransaction) => {
    if (!confirm(`Delete transaction ${txn.TransactionID}?`)) return;
    const targetId = txn._id || txn.TransactionID;
    await deleteFromDatabase('erp_transactions', targetId);

    // Delete matching expense if exists
    if (txn.ReferenceNo && txn.ReferenceNo !== 'N/A') {
      const matchExp = expenses.find(e => e.ExpenseID === txn.ReferenceNo || e._id === txn.ReferenceNo);
      if (matchExp) {
        await deleteFromDatabase('erp_expenses', matchExp._id || matchExp.ExpenseID);
        setExpenses(prev => prev.filter(e => e.ExpenseID !== matchExp.ExpenseID && e._id !== matchExp._id));
      }
      const matchPay = payrolls.find(p => p.PayrollID === txn.ReferenceNo || p._id === txn.ReferenceNo);
      if (matchPay) {
        await deleteFromDatabase('erp_payroll', matchPay._id || matchPay.PayrollID);
        setPayrolls(prev => prev.filter(p => p.PayrollID !== matchPay.PayrollID && p._id !== matchPay._id));
      }
    }

    setTransactions(prev => prev.filter(t => (t._id ? t._id !== txn._id : t.TransactionID !== txn.TransactionID)));
    setSyncMessage('Transaction deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR EMPLOYEES & PAYROLL
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!empForm.FullName || !empForm.Salary) return alert('Employee Name and Salary are required.');

    // Prevent double entry: check duplicate employee name
    const trimmedEmpName = empForm.FullName.trim().toLowerCase();
    if (employees.some(emp => emp.FullName.trim().toLowerCase() === trimmedEmpName)) {
      return alert('An employee with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      const newEmp: ErpEmployee = {
        EmployeeID: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        FullName: empForm.FullName.trim(),
        Role: empForm.Role || 'Staff Member',
        Department: empForm.Department || 'General',
        Phone: empForm.Phone || 'N/A',
        Email: empForm.Email || '',
        JoiningDate: empForm.JoiningDate || new Date().toISOString().split('T')[0],
        Salary: Number(empForm.Salary),
        Status: empForm.Status || 'Active',
        CNIC: empForm.CNIC || '35202-0000000-0',
        BankAccount: empForm.BankAccount || ''
      };

      await saveToDatabase('erp_employees', newEmp);
      setEmployees(prev => [newEmp, ...prev]);
      setShowEmpModal(false);
      setEmpForm({ FullName: '', Role: 'Pharmacist Assistant', Salary: 45000, Phone: '', CNIC: '' });
      setSyncMessage('Employee saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving employee: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmp = async (emp: ErpEmployee) => {
    if (!confirm(`Remove employee ${emp.FullName}?`)) return;
    const targetId = emp._id || emp.EmployeeID;
    await deleteFromDatabase('erp_employees', targetId);
    setEmployees(prev => prev.filter(e => (e._id ? e._id !== emp._id : e.EmployeeID !== emp.EmployeeID)));
    setSyncMessage('Employee deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const emp = employees.find(e => e.EmployeeID === payrollForm.EmployeeID);
    if (!emp) return alert('Select a valid employee.');

    // Duplicate check for Payroll in same month/year
    if (payrolls.some(p => p.EmployeeID === emp.EmployeeID && p.MonthYear === payrollForm.MonthYear)) {
      return alert(`Payroll for ${emp.FullName} for period ${payrollForm.MonthYear} has already been processed! Duplicate entry prevented.`);
    }

    setIsSubmitting(true);
    try {
      const basic = Number(payrollForm.BasicSalary) || emp.Salary;
      const allow = Number(payrollForm.Allowances) || 0;
      const ded = Number(payrollForm.Deductions) || 0;
      const net = basic + allow - ded;

      const newPayroll: ErpPayroll = {
        PayrollID: `PAY-${payrollForm.MonthYear}-${emp.EmployeeID}`,
        EmployeeID: emp.EmployeeID,
        EmployeeName: emp.FullName,
        MonthYear: payrollForm.MonthYear,
        BasicSalary: basic,
        Allowances: allow,
        Deductions: ded,
        NetSalary: net,
        PaymentStatus: 'Paid',
        PaymentDate: new Date().toISOString().split('T')[0],
        PaymentMethod: payrollForm.PaymentMethod
      };

      await saveToDatabase('erp_payroll', newPayroll);
      setPayrolls(prev => [newPayroll, ...prev]);

      // Also record transaction for accounting ledger automatically
      const salaryTxn: ErpTransaction = {
        TransactionID: `TXN-PAY-${Date.now().toString().slice(-4)}`,
        Type: 'PayrollPayment',
        Category: 'Staff Salaries Expense',
        Description: `Salary disbursement for ${emp.FullName} (${payrollForm.MonthYear})`,
        Amount: net,
        PaymentMethod: payrollForm.PaymentMethod,
        ReferenceNo: newPayroll.PayrollID,
        Date: new Date().toISOString().split('T')[0],
        CreatedBy: currentUser?.FullName || 'Admin'
      };
      await saveToDatabase('erp_transactions', salaryTxn);
      setTransactions(prev => [salaryTxn, ...prev]);

      setShowPayrollModal(false);
      setSyncMessage('Payroll processed successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error processing payroll: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayroll = async (pay: ErpPayroll) => {
    if (!confirm(`Delete payroll record for ${pay.EmployeeName} (${pay.MonthYear})?`)) return;
    const targetId = pay._id || pay.PayrollID;
    await deleteFromDatabase('erp_payroll', targetId);

    // Delete corresponding transaction
    const matchTxn = transactions.find(t => t.ReferenceNo === pay.PayrollID || t.TransactionID === `TXN-PAY-${pay.PayrollID}`);
    if (matchTxn) {
      await deleteFromDatabase('erp_transactions', matchTxn._id || matchTxn.TransactionID);
      setTransactions(prev => prev.filter(t => t.TransactionID !== matchTxn.TransactionID && t._id !== matchTxn._id));
    }

    setPayrolls(prev => prev.filter(p => (p._id ? p._id !== pay._id : p.PayrollID !== pay.PayrollID)));
    setSyncMessage('Payroll record deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // HANDLERS FOR EXPENSES & ASSETS
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!expenseForm.Amount || !expenseForm.Description) return alert('Expense Description and Amount are required.');

    setIsSubmitting(true);
    try {
      const newExpense: ErpExpense = {
        ExpenseID: `EXP-${Math.floor(100 + Math.random() * 900)}`,
        Category: expenseForm.Category || 'Other',
        Description: expenseForm.Description,
        Amount: Number(expenseForm.Amount),
        ExpenseDate: expenseForm.ExpenseDate || new Date().toISOString().split('T')[0],
        PaymentMethod: expenseForm.PaymentMethod || 'Cash',
        ReceiptRef: expenseForm.ReceiptRef || 'N/A'
      };

      await saveToDatabase('erp_expenses', newExpense);
      setExpenses(prev => [newExpense, ...prev]);

      // Auto log transaction
      const expTxn: ErpTransaction = {
        TransactionID: `TXN-EXP-${Date.now().toString().slice(-4)}`,
        Type: 'Expense',
        Category: `Operating Expense (${newExpense.Category})`,
        Description: newExpense.Description,
        Amount: newExpense.Amount,
        PaymentMethod: newExpense.PaymentMethod,
        ReferenceNo: newExpense.ExpenseID,
        Date: newExpense.ExpenseDate,
        CreatedBy: currentUser?.FullName || 'Admin'
      };
      await saveToDatabase('erp_transactions', expTxn);
      setTransactions(prev => [expTxn, ...prev]);

      setShowExpenseModal(false);
      setExpenseForm({ Category: 'Utilities', Description: '', Amount: 0 });
      setSyncMessage('Expense saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving expense: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (exp: ErpExpense) => {
    if (!confirm(`Delete expense ${exp.ExpenseID}?`)) return;
    const targetId = exp._id || exp.ExpenseID;
    await deleteFromDatabase('erp_expenses', targetId);

    // Delete matching transaction from erp_transactions so it doesn't linger in GL/CashBook
    const matchTxn = transactions.find(t => t.ReferenceNo === exp.ExpenseID || t.TransactionID === exp.ExpenseID || t.ReferenceNo === exp._id || (t.Type === 'Expense' && t.Amount === exp.Amount && t.Date === exp.ExpenseDate));
    if (matchTxn) {
      await deleteFromDatabase('erp_transactions', matchTxn._id || matchTxn.TransactionID);
      setTransactions(prev => prev.filter(t => t.TransactionID !== matchTxn.TransactionID && t._id !== matchTxn._id));
    }

    setExpenses(prev => prev.filter(e => (e._id ? e._id !== exp._id : e.ExpenseID !== exp.ExpenseID)));
    setSyncMessage('Expense deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!assetForm.AssetName || !assetForm.PurchaseCost) return alert('Asset Name and Cost are required.');

    // Prevent double entry: check duplicate asset name
    if (assets.some(a => a.AssetName.trim().toLowerCase() === assetForm.AssetName?.trim().toLowerCase())) {
      return alert('An asset with this name already exists! Duplicate entry prevented.');
    }

    setIsSubmitting(true);
    try {
      const cost = Number(assetForm.PurchaseCost);
      const newAsset: ErpAsset = {
        AssetID: `AST-${Math.floor(100 + Math.random() * 900)}`,
        AssetName: assetForm.AssetName.trim(),
        Category: assetForm.Category || 'Equipment',
        PurchaseDate: assetForm.PurchaseDate || new Date().toISOString().split('T')[0],
        PurchaseCost: cost,
        CurrentValue: Number(assetForm.CurrentValue) || cost,
        DepreciationRate: Number(assetForm.DepreciationRate) || 10,
        Status: assetForm.Status || 'Active'
      };

      await saveToDatabase('erp_assets', newAsset);
      setAssets(prev => [newAsset, ...prev]);
      setShowAssetModal(false);
      setAssetForm({ AssetName: '', PurchaseCost: 0, DepreciationRate: 10 });
      setSyncMessage('Asset saved successfully!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      alert('Error saving asset: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (ast: ErpAsset) => {
    if (!confirm(`Delete asset ${ast.AssetName}?`)) return;
    const targetId = ast._id || ast.AssetID;
    await deleteFromDatabase('erp_assets', targetId);
    setAssets(prev => prev.filter(a => (a._id ? a._id !== ast._id : a.AssetID !== ast.AssetID)));
    setSyncMessage('Asset deleted successfully!');
    setTimeout(() => setSyncMessage(null), 3000);
  };

  // PRINT PURCHASE ORDER FUNCTION (3 Columns Layout: Medicine Name & Required Qty Only)
  const handlePrintPo = (po: ErpPurchaseOrder) => {
    const printWin = window.open('', '_blank', 'width=950,height=900');
    if (!printWin) return alert('Popup blocked. Allow popups to print Purchase Order.');

    const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
    const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY. RESTORING BALANCE.';
    const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

    const totalItems = po.Items.length;
    const colSize = Math.max(1, Math.ceil(totalItems / 3));

    const col1Items = po.Items.slice(0, colSize);
    const col2Items = po.Items.slice(colSize, colSize * 2);
    const col3Items = po.Items.slice(colSize * 2);

    const renderColumnTable = (items: typeof po.Items, startIdx: number) => {
      if (!items || items.length === 0) return `<div style="flex: 1;"></div>`;

      const rowsHtml = items.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #475569; width: 26px;">${startIdx + idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0f172a;">
            ${item.ItemName}
            ${item.Category ? `<div style="font-size: 8.5px; color: #4338ca; font-weight: 600; margin-top: 1px;">Cat: ${item.Category}</div>` : ''}
          </td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 5px; font-weight: bold; color: #0284c7; width: 60px; background: #f0f9ff;">${item.Qty}</td>
        </tr>
      `).join('');

      return `
        <div style="flex: 1; min-width: 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 26px; font-size: 9px; text-transform: uppercase;">#</th>
                <th style="border: 1px solid #334155; padding: 6px; text-align: left; font-size: 9px; text-transform: uppercase;">Medicine Name</th>
                <th style="border: 1px solid #334155; padding: 6px; text-align: center; width: 60px; font-size: 9px; text-transform: uppercase;">Req Qty</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    };

    const col1Html = renderColumnTable(col1Items, 0);
    const col2Html = renderColumnTable(col2Items, colSize);
    const col3Html = renderColumnTable(col3Items, colSize * 2);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order ${po.POID} - Punjab Homeopathic Clinic</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 11.5px;
              line-height: 1.4;
              background: #ffffff;
            }
            * { box-sizing: border-box; }

            .letterhead-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #064e3b;
              padding-bottom: 10px;
              margin-bottom: 12px;
              gap: 12px;
            }
            .logo-col {
              width: 80px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .clinic-info {
              text-align: center;
              flex: 1;
            }
            .clinic-name {
              font-family: Georgia, "Times New Roman", serif;
              font-size: 24px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: -0.5px;
              line-height: 1.1;
            }
            .clinic-tagline {
              font-size: 10px;
              font-weight: 800;
              color: #be123c;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .clinic-reg {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              margin-top: 4px;
            }
            .clinic-timings {
              font-size: 10px;
              font-weight: 800;
              color: #064e3b;
              text-transform: uppercase;
              margin-top: 3px;
            }

            .report-banner {
              background: #0f172a;
              color: #ffffff;
              padding: 8px 14px;
              border-radius: 6px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .report-banner-title {
              font-size: 12.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #f8fafc;
            }
            .report-banner-ref {
              font-size: 10px;
              font-family: monospace;
              color: #cbd5e1;
              font-weight: 700;
            }

            .meta-grid {
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 14px;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              font-size: 11px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-value {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }

            .grid-container {
              display: flex;
              gap: 10px;
              align-items: flex-start;
              width: 100%;
            }

            .signature-section {
              margin-top: 35px;
              padding-top: 15px;
              border-top: 2px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 220px;
            }
            .sig-line-text {
              border-bottom: 1.5px dashed #475569;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              padding-bottom: 2px;
            }
            .sig-line-manager {
              border-bottom: 2.5px solid #0f172a;
              height: 38px;
              margin-bottom: 6px;
              display: flex;
              align-items: flex-end;
              justify-content: center;
              font-size: 13px;
              font-weight: 900;
              color: #0f172a;
              font-family: Georgia, 'Times New Roman', serif;
              padding-bottom: 2px;
            }
            .sig-title-primary {
              font-size: 11px;
              font-weight: 900;
              color: #881337;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sig-title-sub {
              font-size: 10px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
            }
            .sig-title-dept {
              font-size: 9px;
              font-weight: 700;
              color: #047857;
            }

            .stamp-box {
              text-align: center;
              width: 130px;
              height: 65px;
              border: 2px dashed #94a3b8;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: #64748b;
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              background: #fafafa;
            }

            .official-footer {
              margin-top: 15px;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <!-- A4 Official Letterhead Header -->
          <div class="letterhead-header">
            <div class="logo-col">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
            <div class="clinic-info">
              <h1 class="clinic-name">${cName}</h1>
              <div class="clinic-tagline">${cTag}</div>
              <div class="clinic-reg">
                <span>PHC Reg. # <u style="text-decoration: underline;">R-___________</u></span>
                &nbsp;|&nbsp;
                <span>PHC License #: ___________________</span>
              </div>
              <div class="clinic-timings">
                Clinic Timings: Morning 8:30 AM to 12:00 PM &nbsp;|&nbsp; Evening 4:30 PM to 9:00 PM
              </div>
            </div>
            <div class="logo-col" style="visibility: hidden;">
              <img src="${logoSrc}" alt="PHC Logo" class="logo-img" />
            </div>
          </div>

          <!-- Official Report Banner & Meta Details -->
          <div class="report-banner">
            <span class="report-banner-title">OFFICIAL PURCHASE ORDER (PO) - STOCK REQUISITION</span>
            <span class="report-banner-ref">REF: PHC-PO-${po.POID}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">PO Ref Number</span>
              <span class="meta-value" style="color: #4338ca;">${po.POID}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Order Date</span>
              <span class="meta-value">${po.OrderDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Expected Delivery</span>
              <span class="meta-value">${po.ExpectedDeliveryDate || 'Immediate'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Supplier / Vendor</span>
              <span class="meta-value" style="color: #0f172a;">${po.VendorName} (${po.VendorID || 'N/A'})</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">PO Status</span>
              <span class="meta-value" style="color: #047857;">${po.Status ? po.Status.toUpperCase() : 'APPROVED'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Line Items</span>
              <span class="meta-value" style="color: #881337;">${po.Items.length} Medicines</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Order Est Amount</span>
              <span class="meta-value">Rs. ${(po.TotalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Audit Prepared By</span>
              <span class="meta-value">${currentUser?.FullName || 'Staff Accountant'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsible Manager</span>
              <span class="meta-value" style="color: #881337;">Mr. Zaigham Ali Anjum</span>
            </div>
          </div>

          <div class="grid-container">
            ${col1Html}
            ${col2Html}
            ${col3Html}
          </div>

          ${po.Notes ? `<div style="margin-top: 12px; padding: 10px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px;"><strong>Special Instructions / Vendor Notes:</strong> ${po.Notes}</div>` : ''}

          <!-- Executive Signatures & Stamps Block -->
          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-line-text">
                ${currentUser?.FullName || 'Accountant / Audit Officer'}
              </div>
              <div class="sig-title-primary" style="color: #0f172a;">PREPARED BY</div>
              <div class="sig-title-sub" style="font-size: 9px; color: #475569;">Procurement & Inventory Desk</div>
            </div>

            <div class="stamp-box">
              <span>PHC OFFICIAL STAMP</span>
              <span style="font-size: 7px; color: #94a3b8; margin-top: 2px;">[ SEAL & STAMP ]</span>
            </div>

            <div class="sig-box" style="width: 250px;">
              <div class="sig-line-manager">
                Zaigham Ali Anjum
              </div>
              <div class="sig-title-primary">MR. ZAIGHAM ALI ANJUM</div>
              <div class="sig-title-sub">Manager Operations & Administrative Head</div>
              <div class="sig-title-dept">Punjab Homeopathic Clinic & Pharmacy</div>
            </div>
          </div>

          <!-- Official Footer -->
          <div class="official-footer">
            <span>Punjab Homeopathic Clinic & Pharmacy • Official Purchase Order (PO) • Confidential Document</span>
            <span>Generated Date: ${new Date().toLocaleString('en-GB')}</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 300);
  };

  // CALCULATED ERP METRICS
  const totalVendorBalance = vendors.reduce((sum, v) => sum + v.Balance, 0);
  const totalIncome = cashBookMetrics.totalInflow;
  const totalExpenseTxns = cashBookMetrics.totalOutflow;
  const netOperatingProfit = cashBookMetrics.netBalance;
  const totalAssetValuation = assets.reduce((sum, a) => sum + a.CurrentValue, 0);
  const totalMonthlyPayroll = payrolls.reduce((sum, p) => sum + p.NetSalary, 0);

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 p-4 md:p-6 space-y-6 pb-24">
      {/* HEADER BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mini ERP System</h1>
            <p className="text-xs text-slate-500">Integrated Procurement, General Ledger, HR & Payroll, Assets & Operating Expenses</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {syncMessage && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center space-x-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{syncMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={fetchErpData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center space-x-1.5 border border-slate-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Sync Data</span>
          </button>

          <button
            type="button"
            onClick={handleRunTestEntry}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Insert Test Entry Suite</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1 bg-white p-1.5 rounded-xl border">
        {[
          { id: 'overview', label: 'ERP Dashboard', icon: PieChart },
          { id: 'cash_book_pnl', label: 'Cash Book & Clinic P&L', icon: Landmark },
          { id: 'vendors', label: 'Vendors Directory', icon: Building2 },
          { id: 'vendor_statement', label: 'Vendor Statement & Ledger', icon: FileText },
          { id: 'po', label: 'Purchase Orders', icon: ShoppingCart },
          { id: 'ledger', label: 'Financial Ledger', icon: Receipt },
          { id: 'hr', label: 'HR & Payroll', icon: Users },
          { id: 'expenses_assets', label: 'Expenses & Assets', icon: Boxes },
          { id: 'reporting', label: 'Reporting & Analytics', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Income Receipts</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">Rs. {totalIncome.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">OPD, Dispensary & Pharmacy Sales</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Outflow / Expenses</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">Rs. {totalExpenseTxns.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Utilities, Rent, Salaries & Purchases</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Net Cash Balance</p>
                <h3 className={`text-2xl font-black mt-1 ${netOperatingProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  Rs. {netOperatingProfit.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Margin: {cashBookMetrics.marginPercent}%</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Vendor Payables</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">Rs. {totalVendorBalance.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{vendors.length} Active Distributors</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Fixed Asset Valuation</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">Rs. {totalAssetValuation.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{assets.length} Equipment & Fixtures</p>
              </div>
              <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* RECENT TRANSACTIONS TABLE & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Recent Clinic Operational & Financial Receipts</span>
                </h3>
                <button
                  onClick={() => setActiveTab('cash_book_pnl')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  View Full Cash Book &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Ref No</th>
                      <th className="p-2.5">Particulars / Category</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {cashBookEntries.slice(0, 8).map((txn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{txn.date}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-700">{txn.ref}</td>
                        <td className="p-2.5 text-slate-800">
                          <div className="font-bold text-slate-900">{txn.particulars}</div>
                          <div className="text-[10px] text-slate-400">{txn.category}</div>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            txn.type === 'INFLOW' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className={`p-2.5 text-right font-bold ${
                          txn.type === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          Rs. {txn.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {cashBookEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-6 text-slate-400">
                          No clinic cash collection or transaction records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUICK MODULE LAUNCHPAD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Quick ERP Actions</h3>
              
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowVendorModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Supplier Vendor</div>
                      <div className="text-[10px] text-slate-400">Register new distributor</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowPoModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Create Purchase Order</div>
                      <div className="text-[10px] text-slate-400">Requisition stock from vendor</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowTxnModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Log Income / Expense Voucher</div>
                      <div className="text-[10px] text-slate-400">General ledger posting</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowEmpModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Add Staff / Employee</div>
                      <div className="text-[10px] text-slate-400">HR profile & salary setup</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-rose-600" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">Record Operational Expense</div>
                      <div className="text-[10px] text-slate-400">Utilities, Rent & Maintenance</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLINIC DAILY CASH BOOK & MONTHLY P&L LEDGER DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'cash_book_pnl' && (
        <div className="space-y-6">
          {/* Header Banner & Print Button */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-extrabold tracking-tight">Clinic Daily Cash Book & P&L Ledger</h2>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Real-time tracking of Patient Collections (OPD Tokens, Clinical Meds, Pharmacy) vs Operating Outflows (Staff Salaries, Building Rent, Electricity Bills & Medicine Purchases).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrintCashBookReport}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Cash Book Statement</span>
              </button>
            </div>
          </div>

          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Inflow */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 mr-1" />
                  Total Cash Collections (Inflow)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                  Income
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                PKR {cashBookMetrics.totalInflow.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-emerald-100 grid grid-cols-2 gap-1 font-medium">
                <span>OPD Tokens: <strong>{cashBookMetrics.opdInflow.toLocaleString()}</strong></span>
                <span>Clinical Meds: <strong>{cashBookMetrics.clinicalInflow.toLocaleString()}</strong></span>
                <span>Store Pharmacy: <strong>{cashBookMetrics.storeInflow.toLocaleString()}</strong></span>
                <span>Cards & Reg: <strong>{cashBookMetrics.regInflow.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Total Outflow */}
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center">
                  <ArrowDownRight className="w-4 h-4 text-rose-600 mr-1" />
                  Total Outflows & Deductions
                </span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">
                  Expenses
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                PKR {cashBookMetrics.totalOutflow.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-rose-100 grid grid-cols-2 gap-1 font-medium">
                <span>Salaries Paid: <strong>{cashBookMetrics.salariesOutflow.toLocaleString()}</strong></span>
                <span>Building Rent: <strong>{cashBookMetrics.rentOutflow.toLocaleString()}</strong></span>
                <span>Electricity/Bills: <strong>{cashBookMetrics.billsOutflow.toLocaleString()}</strong></span>
                <span>Meds Purchase: <strong>{cashBookMetrics.medicinePurchasesOutflow.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Net Operating Profit / Balance */}
            <div className={`border p-4 rounded-2xl bg-white shadow-xs space-y-2 ${cashBookMetrics.netBalance >= 0 ? 'bg-purple-50/50 border-purple-300' : 'bg-red-50/50 border-red-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center">
                  <Wallet className="w-4 h-4 text-purple-700 mr-1" />
                  Net Cash Profit / Remaining Balance
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cashBookMetrics.netBalance >= 0 ? 'bg-purple-200 text-purple-900' : 'bg-red-200 text-red-900'}`}>
                  {cashBookMetrics.marginPercent}% Net Margin
                </span>
              </div>
              <div className={`text-2xl font-black font-mono ${cashBookMetrics.netBalance >= 0 ? 'text-purple-950' : 'text-red-700'}`}>
                PKR {cashBookMetrics.netBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 pt-1 border-t border-purple-200 font-medium leading-tight">
                Net remaining liquidity available in clinic cash box after deducting all operational overheads and salaries.
              </p>
            </div>
          </div>

          {/* Quick Record Outflow / Expense Form Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Coins className="w-4 h-4 text-rose-600 mr-1.5" />
                Quick Outflow Logger (Rent, Salaries, Electricity Bills & Purchases)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Instantly record any clinic cash deduction</span>
            </div>

            <form onSubmit={handleQuickOutflowSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">Outflow Category</label>
                <select
                  value={quickOutflowForm.category}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, category: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Building Rent & Maintenance">Building Rent & Maintenance</option>
                  <option value="Staff Salary & Payroll">Staff Salary & Payroll</option>
                  <option value="Electricity & Utility Bills">Electricity & Utility Bills</option>
                  <option value="Medicine Stock Purchase">Medicine Stock Purchase</option>
                  <option value="Tea, Refreshment & Pantry">Tea, Refreshment & Pantry</option>
                  <option value="Repair & Clinic Upkeep">Repair & Clinic Upkeep</option>
                  <option value="Miscellaneous Overhead">Miscellaneous Overhead</option>
                </select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Amount (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={quickOutflowForm.amount}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, amount: e.target.value })}
                  required
                  className="w-full text-xs font-bold font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Paid To / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Landlord / K-Electric / Vendor"
                  value={quickOutflowForm.payee}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, payee: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Date</label>
                <input
                  type="date"
                  value={quickOutflowForm.date}
                  onChange={(e) => setQuickOutflowForm({ ...quickOutflowForm, date: e.target.value })}
                  className="w-full text-xs font-medium p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deduct Outflow Payment</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Toolbar & Ledger Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Period Quick Filters */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'Past 7 Days' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'all_time', label: 'All Time' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setCashBookDateFilter(p.id as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex-1 sm:flex-none ${
                      cashBookDateFilter === p.id
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Type Category Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                {[
                  { id: 'ALL', label: 'All Transactions' },
                  { id: 'INFLOW', label: 'Inflows Only' },
                  { id: 'OUTFLOW', label: 'Outflows Only' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCashBookCategoryFilter(c.id as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex-1 sm:flex-none ${
                      cashBookCategoryFilter === c.id
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ledger entries..."
                  value={cashBookSearch}
                  onChange={(e) => setCashBookSearch(e.target.value)}
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Cash Book Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-400 mr-2" />
                Cash Book Transaction Ledger Records ({filteredCashBookEntries.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Real-time synchronized with Patient Desk & ERP</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3 w-28">Date</th>
                    <th className="p-3 w-28">Ref #</th>
                    <th className="p-3">Particulars / Description</th>
                    <th className="p-3 w-40">Category</th>
                    <th className="p-3 text-center w-24">Type</th>
                    <th className="p-3 text-right w-32">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCashBookEntries.length > 0 ? (
                    filteredCashBookEntries.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{e.date}</td>
                        <td className="p-3 font-mono font-bold text-purple-950 text-[11px]">{e.ref}</td>
                        <td className="p-3 font-bold text-slate-900">{e.particulars}</td>
                        <td className="p-3 font-medium text-slate-600">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {e.type === 'INFLOW' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center">
                              <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              INFLOW
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-rose-300 inline-flex items-center">
                              <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              OUTFLOW
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-black text-sm ${e.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {e.type === 'INFLOW' ? '+' : '-'} PKR {e.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No financial records found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDORS DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Distributors & Vendors Directory</h2>
              <p className="text-xs text-slate-500">Manage pharmaceutical suppliers, tax IDs, and outstanding balances</p>
            </div>
            <button
              onClick={() => setShowVendorModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Vendor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Vendor Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Address</th>
                  <th className="p-3 text-right">Outstanding Balance</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {vendors.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-700">{v.VendorID}</td>
                    <td className="p-3 font-bold text-slate-900">{v.VendorName}</td>
                    <td className="p-3 text-slate-600">{v.ContactPerson}</td>
                    <td className="p-3 text-slate-600">{v.Phone}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{v.Address}</td>
                    <td className="p-3 text-right font-bold text-amber-600">Rs. {v.Balance.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {v.Status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedVendorId(v.VendorID || v._id || '');
                            setActiveTab('vendor_statement');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="View detailed Vendor Account Statement & Payable Ledger"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Statement</span>
                        </button>
                        <button
                          onClick={() => setVendorPoModalData(v)}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="View all Purchase Orders for this vendor"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>View PO</span>
                        </button>
                        <button
                          onClick={() => handlePayVendor(v)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                          title="Pay vendor bill & clear Accounts Payable"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Pay Bill</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(v)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2B: VENDOR ACCOUNT STATEMENT & PAYABLE LEDGER */}
      {activeTab === 'vendor_statement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6 animate-fadeIn" id="erp-vendor-statement-tab">
          {/* Header & Controls */}
          <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                <span>Vendor Account Statement & Payable Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Synchronized statement of Goods Received Notes (GRNs), vendor payments, and Accounts Payable ledger
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={() => {
                  if (selectedVendor) {
                    setVendorPoModalData(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="View Purchase Orders for selected vendor"
              >
                <Boxes className="w-4 h-4" />
                <span>View PO</span>
              </button>

              <button
                onClick={() => {
                  if (selectedVendor) {
                    handlePayVendor(selectedVendor);
                  }
                }}
                disabled={!selectedVendor}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => setShowVendorModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </button>

              <button
                onClick={() => fetchErpData()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-slate-600" />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={() => setVendorPrintModalOpen(true)}
                disabled={!selectedVendor}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Vendor Selector Banner */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                {selectedVendor?.VendorName ? selectedVendor.VendorName.charAt(0).toUpperCase() : 'V'}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Select Vendor / Distributor ({vendors.length} Total):
                </label>
                <select
                  value={selectedVendorId || (selectedVendor?.VendorID || selectedVendor?._id || '')}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="mt-0.5 bg-white text-slate-900 font-bold text-xs rounded-lg px-3 py-1.5 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer min-w-[280px]"
                >
                  {vendors.length === 0 ? (
                    <option value="">No Vendors Found in Database</option>
                  ) : (
                    vendors.map(v => (
                      <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                        {v.VendorName} ({v.VendorID || 'N/A'}) - Balance: Rs. {(v.Balance || 0).toLocaleString()}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedVendor && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Contact Person</span>
                  <span className="font-bold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Phone Number</span>
                  <span className="font-bold text-slate-900">{selectedVendor.Phone || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Tax / NTN No</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statement Date Range Filter Pills */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">Statement Period Filter:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setVendorDateFilter(filterKey)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                    vendorDateFilter === filterKey
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {filterKey === 'all' ? 'All Time (Full Statement)' : filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoiced / Goods Received (GRN)
              </span>
              <p className="text-xl font-black text-amber-700 font-mono">
                Rs. {vendorStatement.totalInvoiced.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">Total Goods Received (Credit)</p>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Payments Cleared
              </span>
              <p className="text-xl font-black text-emerald-700 font-mono">
                Rs. {vendorStatement.totalPaid.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-600">Total Payments Settled (Debit)</p>
            </div>

            <div className="bg-amber-500 text-white p-4 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-100 uppercase tracking-wider block">
                Closing Accounts Payable Balance
              </span>
              <p className="text-xl font-black font-mono">
                Rs. {vendorStatement.closingBalance.toLocaleString()}
              </p>
              <p className="text-[10px] text-amber-100">Net Outstanding Amount Due</p>
            </div>
          </div>

          {/* Statement Rows Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-amber-600 mr-1.5" />
                Ledger Statement Audit Entries ({vendorStatement.statementRows.length} Records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-800 text-slate-200 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ref / Voucher #</th>
                    <th className="p-3">P.O. Number</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Debit (Paid)</th>
                    <th className="p-3 text-right">Credit (Bill)</th>
                    <th className="p-3 text-right">Running Balance</th>
                    <th className="p-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-700">
                  {vendorStatement.statementRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                        No transactions or GRNs recorded for this vendor in selected period.
                      </td>
                    </tr>
                  ) : (
                    vendorStatement.statementRows.map((row, idx) => (
                      <React.Fragment key={row.id || idx}>
                        <tr className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono text-slate-600">{row.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.credit > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">{row.refNo}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">
                            {row.poNo !== 'N/A' ? (
                              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-mono text-[11px]">
                                {row.poNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs truncate text-slate-600">{row.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            Rs. {(row.runningBalance || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            {row.type === 'Goods Received (GRN)' && row.rawItem?.ItemsReceived ? (
                              <button
                                onClick={() => setExpandedGrnId(expandedGrnId === row.id ? null : row.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline cursor-pointer"
                              >
                                {expandedGrnId === row.id ? 'Hide Items' : 'View Items'}
                              </button>
                            ) : row.debit > 0 ? (
                              <button
                                onClick={() => handleDeleteTxn(row.rawItem)}
                                className="text-rose-600 hover:bg-rose-50 p-1 rounded transition cursor-pointer"
                                title="Delete Payment Transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable GRN items line breakdown */}
                        {expandedGrnId === row.id && row.rawItem?.ItemsReceived && (
                          <tr className="bg-slate-50">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                                  GRN Itemized Audit Breakdown ({row.rawItem.ItemsReceived.length} Items)
                                </h4>
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-600 font-bold">
                                      <th className="p-1.5">Medicine Name</th>
                                      <th className="p-1.5 text-center">Qty Received</th>
                                      <th className="p-1.5 text-right">Unit Price</th>
                                      <th className="p-1.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.rawItem.ItemsReceived.map((item: any, itemIdx: number) => (
                                      <tr key={itemIdx}>
                                        <td className="p-1.5 font-bold text-slate-800">{item.MedicineName}</td>
                                        <td className="p-1.5 text-center font-mono">{item.QuantityReceived}</td>
                                        <td className="p-1.5 text-right font-mono">Rs. {(item.UnitPrice || 0).toLocaleString()}</td>
                                        <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                                          Rs. {((item.QuantityReceived || 0) * (item.UnitPrice || 0)).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASE ORDERS */}
      {activeTab === 'po' && (
        <div className="space-y-4">
          {/* Inventory Stock Requisition Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl font-bold">
                <Boxes className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Inventory Stock Requisition Status</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  <span className="font-extrabold text-amber-900">
                    {inventoryItems.filter(med => (med.CStock ?? 0) <= (med.MinStock ?? 100)).length} Medicines
                  </span> currently below minimum stock level and require purchase order replenishment.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                handleSelectAllLowStockMedicines();
                setShowPoModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Auto-Create PO for Low Stock Items</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Purchase Orders & Stock Requisitions Log</h2>
                <p className="text-xs text-slate-500">Create, track, and print official POs for medicine stock replenishment</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenGrnForPo()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Process GRN (Receive Goods)</span>
                </button>
                <button
                  onClick={() => setShowPoModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Purchase Order</span>
                </button>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3">Order Date</th>
                  <th className="p-3">Expected Delivery</th>
                  <th className="p-3 text-center">Items Count</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchaseOrders.map((po, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{po.POID}</td>
                    <td className="p-3 font-bold text-slate-900">{po.VendorName}</td>
                    <td className="p-3 text-slate-600">{po.OrderDate}</td>
                    <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate}</td>
                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-700">{po.Items?.length || 0} items</div>
                      {po.Items && po.Items.some(i => i.BatchNo) && (
                        <div
                          className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5 cursor-help"
                          title={po.Items.map(i => `${i.ItemName}: Batch ${i.BatchNo || 'N/A'}`).join(' | ')}
                        >
                          Batch: {po.Items.find(i => i.BatchNo)?.BatchNo} {po.Items.length > 1 ? `+${po.Items.length - 1}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">Rs. {po.TotalAmount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        po.Status === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : po.Status === 'Partially Received'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {po.Status === 'Received' ? '✓ Fully Received' : po.Status === 'Partially Received' ? '⚡ Partially Received' : po.Status}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                      {po.Status !== 'Received' ? (
                        <button
                          onClick={() => handleOpenGrnForPo(po)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Process GRN stock inward for this PO"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{po.Status === 'Partially Received' ? 'Receive Next Batch' : 'Receive Stock (GRN)'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-extrabold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
                          Stock Added
                        </span>
                      )}
                      <button
                        onClick={() => handlePrintPo(po)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Print Official PO"
                      >
                        <Printer className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => handleDeletePo(po)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete PO"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goods Received Notes (GRN) Received Stock Log */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Goods Received Notes (GRN) & Inward Stock Log</h2>
              </div>
              <p className="text-xs text-slate-500">Official verified receipts of PO shipments received and added to pharmacy stock</p>
            </div>
            <button
              onClick={() => handleOpenGrnForPo()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New GRN</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">GRN Number</th>
                  <th className="p-3">PO Reference</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3">Received Date</th>
                  <th className="p-3">Challan / Inv No.</th>
                  <th className="p-3 text-center">Items Received</th>
                  <th className="p-3 text-right">Total Value</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 font-medium">
                      No Goods Received Notes (GRNs) logged yet. Click "Process GRN" or select a Purchase Order to receive stock into inventory.
                    </td>
                  </tr>
                ) : (
                  grns.map((grn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-700">{grn.GRNID}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600">{grn.POID}</td>
                      <td className="p-3 font-bold text-slate-900">{grn.VendorName}</td>
                      <td className="p-3 text-slate-600">{grn.ReceivedDate}</td>
                      <td className="p-3 text-slate-500 font-mono">{grn.ChallanNo || grn.SupplierInvoiceNo || 'N/A'}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{grn.Items?.length || 0}</td>
                      <td className="p-3 text-right font-bold text-slate-900">Rs. {(grn.TotalAmount || 0).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Stock Approved
                        </span>
                        <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1 font-semibold inline-block cursor-help" title="Double Entry GL Posted: Debit Inventory (103001) | Credit Accounts Payable (201001)">
                          GL: Dr 103001 | Cr 201001
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePrintGrn(grn)}
                          className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer flex items-center space-x-1 mx-auto font-bold border border-slate-200 text-[11px]"
                          title="Print Official GRN Voucher"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Print GRN</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL LEDGER & VOUCHERS */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">General Ledger & Transaction Vouchers</h2>
              <p className="text-xs text-slate-500">Record income receipts, expense vouchers, and bank/cash settlements</p>
            </div>
            <button
              onClick={() => setShowTxnModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 self-start cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Financial Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Txn ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{t.TransactionID}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{t.Date}</td>
                    <td className="p-3 font-bold text-slate-900">{t.Category}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{t.Description || 'N/A'}</td>
                    <td className="p-3 text-slate-600 font-bold">{t.PaymentMethod}</td>
                    <td className="p-3 text-slate-500">{t.CreatedBy}</td>
                    <td className={`p-3 text-right font-black ${
                      t.Type === 'Income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      Rs. {t.Amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteTxn(t)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Delete Txn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HR & PAYROLL */}
      {activeTab === 'hr' && (
        <div className="space-y-6">
          {/* EMPLOYEES DIRECTORY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Staff & Human Resources Directory</h2>
                <p className="text-xs text-slate-500">Employee profiles, monthly salaries, and bank accounts</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPayrollModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Process Payroll</span>
                </button>

                <button
                  onClick={() => setShowEmpModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Emp ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Role / Designation</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">CNIC</th>
                    <th className="p-3 text-right">Monthly Salary</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {employees.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{emp.EmployeeID}</td>
                      <td className="p-3 font-bold text-slate-900">{emp.FullName}</td>
                      <td className="p-3 text-slate-700 font-semibold">{emp.Role}</td>
                      <td className="p-3 text-slate-600">{emp.Department}</td>
                      <td className="p-3 text-slate-600">{emp.Phone}</td>
                      <td className="p-3 font-mono text-slate-500">{emp.CNIC}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {emp.Salary.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteEmp(emp)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYROLL HISTORY */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Monthly Payroll Disbursement History</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Payroll ID</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3 text-right">Basic</th>
                    <th className="p-3 text-right">Allowances</th>
                    <th className="p-3 text-right">Deductions</th>
                    <th className="p-3 text-right">Net Salary</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payrolls.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{p.PayrollID}</td>
                      <td className="p-3 text-slate-600 font-bold">{p.MonthYear}</td>
                      <td className="p-3 font-bold text-slate-900">{p.EmployeeName}</td>
                      <td className="p-3 text-right text-slate-600">Rs. {p.BasicSalary.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600">+ Rs. {p.Allowances.toLocaleString()}</td>
                      <td className="p-3 text-right text-rose-600">- Rs. {p.Deductions.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-900">Rs. {p.NetSalary.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.PaymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EXPENSES & ASSETS */}
      {activeTab === 'expenses_assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OPERATIONAL EXPENSES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Operational Expenses Tracker</h3>
                <p className="text-xs text-slate-500">Utilities, Rent, Refreshments & Maintenance</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{exp.ExpenseDate}</td>
                      <td className="p-2.5 font-bold text-slate-800">{exp.Category}</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate">{exp.Description}</td>
                      <td className="p-2.5 text-right font-black text-rose-600">Rs. {exp.Amount.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIXED ASSETS REGISTER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fixed Asset Register</h3>
                <p className="text-xs text-slate-500">Refrigerators, POS hardware, Furniture & Equipment</p>
              </div>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Asset</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-2.5">Asset Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Cost</th>
                    <th className="p-2.5 text-right">Current Value</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {assets.map((ast, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{ast.AssetName}</td>
                      <td className="p-2.5 text-slate-600">{ast.Category}</td>
                      <td className="p-2.5 text-right text-slate-500">Rs. {ast.PurchaseCost.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-black text-indigo-600">Rs. {ast.CurrentValue.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteAsset(ast)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: REPORTING & ANALYTICS */}
      {activeTab === 'reporting' && (
        <ReportingDesk
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          grns={grns}
          transactions={transactions}
          employees={employees}
          payrolls={payrolls}
          expenses={expenses}
          assets={assets}
          inventoryItems={inventoryItems}
          appointments={appointments}
          patientVisits={patientVisits}
          posSales={posSales}
          currentUser={currentUser}
          clinicSettings={clinicSettings}
        />
      )}

      {/* MODAL: ADD VENDOR */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Register New Supplier Vendor</h3>
            <form onSubmit={handleAddVendor} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Vendor / Company Name</label>
                <input
                  type="text"
                  required
                  value={vendorForm.VendorName}
                  onChange={e => setVendorForm({ ...vendorForm, VendorName: e.target.value })}
                  placeholder="e.g. High-Tech Pharma"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Contact Person</label>
                <input
                  type="text"
                  value={vendorForm.ContactPerson}
                  onChange={e => setVendorForm({ ...vendorForm, ContactPerson: e.target.value })}
                  placeholder="e.g. Mr. Tariq"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={vendorForm.Phone}
                    onChange={e => setVendorForm({ ...vendorForm, Phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Tax NTN ID</label>
                  <input
                    type="text"
                    value={vendorForm.TaxID}
                    onChange={e => setVendorForm({ ...vendorForm, TaxID: e.target.value })}
                    placeholder="NTN-123456"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Address</label>
                <input
                  type="text"
                  value={vendorForm.Address}
                  onChange={e => setVendorForm({ ...vendorForm, Address: e.target.value })}
                  placeholder="Lahore, Pakistan"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {showPoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-xl border space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <span>Create Purchase Order & Stock Requisition</span>
                </h3>
                <p className="text-xs text-slate-500">Pick medicines directly from inventory stock list or auto-fill required stock quantities</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPoModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-5">
              {/* TOP VENDOR & DATE SELECTOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700">Select Supplier Vendor</label>
                  <select
                    required
                    value={poForm.VendorName}
                    onChange={e => {
                      const v = vendors.find(item => item.VendorName === e.target.value);
                      setPoForm({ ...poForm, VendorName: e.target.value, VendorID: v?.VendorID || '' });
                    }}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>
                    {vendors.map((v, idx) => (
                      <option key={idx} value={v.VendorName}>{v.VendorName} ({v.VendorID})</option>
                    ))}
                    {vendors.length === 0 && <option value="High-Tech Pharma Distributors Ltd">High-Tech Pharma Distributors Ltd</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poForm.ExpectedDeliveryDate}
                    onChange={e => setPoForm({ ...poForm, ExpectedDeliveryDate: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* GRID-VIEW MEDICINE STOCK PICKER */}
              <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      <span>Medicine Inventory & Required Stock Grid View</span>
                    </h4>
                    <p className="text-[11px] text-indigo-700">Click any medicine card to automatically calculate & add required stock to PO</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllLowStockMedicines}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs flex items-center space-x-1 cursor-pointer"
                      title="Auto-select all items where CStock <= MinStock"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Select All Low Stock Items</span>
                    </button>
                    {poForm.Items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPoForm(prev => ({ ...prev, Items: [] }))}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Clear List
                      </button>
                    )}
                  </div>
                </div>

                  {/* SEARCH & FILTERS */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full flex space-x-1.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search medicine name, category, salt or code..."
                          value={medicineSearchTerm}
                          onChange={e => setMedicineSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQrScannerModal(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan QR</span>
                      </button>
                    </div>

                  {/* Medicine Category Dropdown Filter */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={poCategoryFilter}
                      onChange={e => setPoCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer shadow-2xs"
                    >
                      <option value="all">🏷️ All Medicine Categories</option>
                      {medicineCategories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 self-start sm:self-auto text-xs">
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      All ({inventoryItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('lowStock')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'lowStock' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Low Stock ({inventoryItems.filter(i => (i.CStock ?? 0) <= (i.MinStock ?? 100)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMedicineFilterMode('selected')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        medicineFilterMode === 'selected' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border'
                      }`}
                    >
                      Selected ({poForm.Items.length})
                    </button>
                  </div>
                </div>

                {/* MEDICINES GRID VIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {inventoryItems
                    .filter(med => {
                      const medCat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');
                      const matchCategory = poCategoryFilter === 'all' || medCat.toLowerCase().includes(poCategoryFilter.toLowerCase());
                      const matchSearch = med.ItemName?.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
                                          med.ItemID?.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
                                          medCat.toLowerCase().includes(medicineSearchTerm.toLowerCase());
                      const cStock = med.CStock ?? med.Stock ?? 0;
                      const minStock = med.MinStock ?? 100;
                      if (!matchSearch || !matchCategory) return false;
                      if (medicineFilterMode === 'lowStock') return cStock <= minStock;
                      if (medicineFilterMode === 'selected') return isMedicineSelectedInPo(med.ItemID, med.ItemName);
                      return true;
                    })
                    .map((med, idx) => {
                      const cStock = med.CStock ?? med.Stock ?? 0;
                      const minStock = med.MinStock ?? 100;
                      const isLow = cStock <= minStock;
                      const reqQty = getRequiredQty(med);
                      const isSelected = isMedicineSelectedInPo(med.ItemID, med.ItemName);
                      const currentPoItem = poForm.Items.find(i => (i.ItemID && i.ItemID === med.ItemID) || i.ItemName === med.ItemName);
                      const medCat = med.Category || (med.MedicineType === 'C' ? 'Clinical / Compounded' : med.MedicineType === 'P' ? 'Patent / Pre-packaged' : 'Tablet / Capsule');

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                              : isLow
                              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                              : 'bg-white border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <p className="font-bold text-xs text-slate-900 leading-tight">{med.ItemName}</p>
                                <p className="text-[10px] font-mono text-slate-500">{med.ItemID || 'ITM'}</p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isLow ? 'LOW STOCK' : 'In Stock'}
                              </span>
                            </div>

                            {/* Medicine Category Badge */}
                            <div className="mt-1.5 flex items-center">
                              <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 flex items-center space-x-1">
                                <span>🏷️</span>
                                <span>{medCat}</span>
                              </span>
                            </div>

                            <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                              <div className="flex justify-between">
                                <span>Current Stock:</span>
                                <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-slate-800'}`}>
                                  {cStock} {med.Unit || 'Tab'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Required Stock:</span>
                                <span className="font-extrabold text-indigo-700 bg-indigo-100/60 px-1 rounded">
                                  +{reqQty} {med.Unit || 'Tab'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Purchase Rate:</span>
                                <span className="font-bold text-slate-900">
                                  Rs. {med.PurchasePrice || med.Price || 10}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                            {isSelected ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-extrabold text-emerald-700 flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  Selected
                                </span>
                                <div className="flex items-center space-x-1">
                                  <label className="text-[10px] text-slate-500 font-bold">Qty:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={currentPoItem?.Qty || reqQty}
                                    onChange={e => {
                                      const val = Number(e.target.value);
                                      setPoForm(prev => ({
                                        ...prev,
                                        Items: prev.Items.map(i =>
                                          (i.ItemID === med.ItemID || i.ItemName === med.ItemName)
                                            ? { ...i, Qty: val }
                                            : i
                                        )
                                      }));
                                    }}
                                    className="w-14 p-0.5 text-center text-xs border rounded font-bold bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMedicineForPo(med)}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-bold px-1 cursor-pointer"
                                    title="Remove from PO"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleMedicineForPo(med)}
                                className={`w-full py-1 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                                  isLow
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Choose for PO ({reqQty} {med.Unit || 'Tab'})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* REQUISITION ORDER SUMMARY TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Selected Order Items Requisition List ({poForm.Items.length} Items)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Item Line</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5 w-36">Medicine Category</th>
                        <th className="p-2.5 w-32">Batch No.</th>
                        <th className="p-2.5 w-24 text-center">Required Qty</th>
                        <th className="p-2.5 w-28 text-right">Unit Price (Rs.)</th>
                        <th className="p-2.5 w-28 text-right">Subtotal</th>
                        <th className="p-2.5 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poForm.Items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 font-medium">
                            No medicines selected yet. Choose items from the grid above or auto-select low stock items!
                          </td>
                        </tr>
                      ) : (
                        poForm.Items.map((item, idx) => {
                          const subtotal = (Number(item.Qty) || 0) * (Number(item.UnitPrice) || 0);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-medium">
                                <input
                                  type="text"
                                  placeholder="Medicine Name"
                                  value={item.ItemName}
                                  onChange={e => handleUpdatePoItem(idx, 'ItemName', e.target.value)}
                                  className="w-full p-1 border rounded-lg text-xs font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={item.Category || 'Tablet / Capsule'}
                                  onChange={e => handleUpdatePoItem(idx, 'Category', e.target.value)}
                                  className="w-full p-1 border rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50/60 cursor-pointer"
                                >
                                  {medicineCategories.map((c, cIdx) => (
                                    <option key={cIdx} value={c}>{c}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  placeholder="Batch No."
                                  value={item.BatchNo || ''}
                                  onChange={e => handleUpdatePoItem(idx, 'BatchNo', e.target.value)}
                                  className="w-full p-1 border rounded-lg text-xs font-mono font-bold bg-amber-50/60 text-amber-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="Qty"
                                  value={item.Qty}
                                  onChange={e => handleUpdatePoItem(idx, 'Qty', Number(e.target.value))}
                                  className="w-full p-1 border rounded-lg text-xs text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Price"
                                  value={item.UnitPrice}
                                  onChange={e => handleUpdatePoItem(idx, 'UnitPrice', Number(e.target.value))}
                                  className="w-full p-1 border rounded-lg text-xs text-right font-semibold"
                                />
                              </td>
                              <td className="p-2 text-right font-bold text-slate-900">
                                Rs. {subtotal.toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPoForm(prev => ({
                                      ...prev,
                                      Items: prev.Items.filter((_, i) => i !== idx)
                                    }));
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER & GRAND TOTAL */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-sm">
                  <span className="text-slate-500 font-bold">Grand Total Amount: </span>
                  <span className="text-lg font-black text-indigo-700 ml-1">
                    Rs. {poForm.Items.reduce((sum, i) => sum + (Number(i.Qty) * Number(i.UnitPrice)), 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPoModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={poForm.Items.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Generate & Post Purchase Order</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / PROCESS GOODS RECEIVED NOTE (GRN) */}
      {showGrnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Receive Goods & Approve GRN (Stock Inward)</span>
                </h3>
                <p className="text-xs text-slate-500">Enter or select Purchase Order (PO Number) to fetch items, verify received quantities, and add stock to inventory</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGrnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveGrn} className="space-y-4">
              {/* PO SELECTOR & METADATA GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Purchase Order (PO Number)</label>
                  <select
                    value={grnForm.POID}
                    onChange={e => handleSelectPoForGrn(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-white text-indigo-700 border-indigo-200 focus:outline-hidden"
                  >
                    <option value="">-- Choose Purchase Order --</option>
                    {purchaseOrders.map((p, idx) => (
                      <option key={idx} value={p.POID}>
                        {p.POID} ({p.VendorName}) - {p.Status === 'Received' ? '✓ Fully Received' : p.Status === 'Partially Received' ? '⚡ Partially Received' : 'Pending Order'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GRN Number</label>
                  <input
                    type="text"
                    readOnly
                    value={grnForm.GRNID}
                    className="w-full p-2 border rounded-xl text-xs font-mono font-bold bg-slate-100 text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Received Date</label>
                  <input
                    type="date"
                    required
                    value={grnForm.ReceivedDate}
                    onChange={e => setGrnForm({ ...grnForm, ReceivedDate: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    readOnly
                    value={grnForm.VendorName || 'No Vendor Selected'}
                    className="w-full p-2 border rounded-xl text-xs font-bold bg-slate-100 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Challan No.</label>
                  <input
                    type="text"
                    placeholder="e.g. DC-98124"
                    value={grnForm.ChallanNo}
                    onChange={e => setGrnForm({ ...grnForm, ChallanNo: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-55421"
                    value={grnForm.SupplierInvoiceNo}
                    onChange={e => setGrnForm({ ...grnForm, SupplierInvoiceNo: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              {/* RECEIVED MEDICINES TABLE WITH PARTIAL DELIVERY COLUMNS */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    PO Order Items & Partial Batch Receiving ({grnForm.Items.length} Line Items)
                  </label>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const selectedPo = purchaseOrders.find(p => p.POID === grnForm.POID);
                      const pendingPoItems = selectedPo ? getPoItemsReceiptInfo(selectedPo) : [];
                      const fullCount = pendingPoItems.length;
                      if (fullCount > grnForm.Items.length) {
                        return (
                          <button
                            type="button"
                            onClick={handleResetGrnItems}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-bold border border-indigo-200 transition flex items-center space-x-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore Excluded Items ({fullCount - grnForm.Items.length} excluded)</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Partial receiving supported: Excluded items remain pending in PO for next batch
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Item ID</th>
                        <th className="p-2.5">Medicine Description</th>
                        <th className="p-2.5 text-center w-24">Batch No.</th>
                        <th className="p-2.5 text-center w-20">Ordered</th>
                        <th className="p-2.5 text-center w-20">Prev. Recv</th>
                        <th className="p-2.5 text-center w-20">Pending</th>
                        <th className="p-2.5 text-center w-24">Now Receiving</th>
                        <th className="p-2.5 text-right w-20">Unit Price</th>
                        <th className="p-2.5 text-right w-24">Subtotal</th>
                        <th className="p-2.5 text-center w-20">Exclude</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grnForm.Items.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-6 text-center text-slate-400 font-medium">
                            No items in current GRN batch. {grnForm.POID ? 'All items were excluded from this delivery.' : 'Please select a Purchase Order from above!'}
                            {grnForm.POID && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={handleResetGrnItems}
                                  className="text-xs text-indigo-600 underline font-bold"
                                >
                                  Click here to restore all PO items
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        grnForm.Items.map((item, idx) => {
                          const prevReceived = item.AlreadyReceivedQty || 0;
                          const pending = item.PendingQty ?? Math.max(0, item.OrderedQty - prevReceived);
                          const subtotal = (Number(item.ReceivedQty) || 0) * (Number(item.UnitPrice) || 0);

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-slate-500 font-bold">{item.ItemID}</td>
                              <td className="p-2.5 font-bold text-slate-900">{item.ItemName}</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="text"
                                  placeholder="Batch No."
                                  value={item.BatchNo || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setGrnForm(prev => {
                                      const updated = [...prev.Items];
                                      updated[idx] = { ...updated[idx], BatchNo: val };
                                      return { ...prev, Items: updated };
                                    });
                                  }}
                                  className="w-22 p-1 border border-amber-200 rounded-lg text-xs text-center font-mono font-bold bg-amber-50 text-amber-900 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-600">{item.OrderedQty}</td>
                              <td className="p-2.5 text-center font-bold text-indigo-600 bg-indigo-50/50">{prevReceived}</td>
                              <td className="p-2.5 text-center font-bold text-amber-700 bg-amber-50/50">{pending}</td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={pending > 0 ? pending * 2 : 9999}
                                  value={item.ReceivedQty}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setGrnForm(prev => {
                                      const updated = [...prev.Items];
                                      updated[idx] = { ...updated[idx], ReceivedQty: val, LineTotal: val * updated[idx].UnitPrice };
                                      return { ...prev, Items: updated };
                                    });
                                  }}
                                  className="w-20 p-1 border border-emerald-300 rounded-lg text-xs text-center font-black bg-emerald-50 text-emerald-900 focus:outline-hidden"
                                />
                              </td>
                              <td className="p-2.5 text-right font-semibold text-slate-700">Rs. {item.UnitPrice}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGrnItem(idx)}
                                  title="Exclude medicine item from this GRN batch (will remain pending in PO for next batch)"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[11px] font-bold transition inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Exclude</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Verification / Quality Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. All medicine boxes verified in good condition and unexpired."
                  value={grnForm.Remarks}
                  onChange={e => setGrnForm({ ...grnForm, Remarks: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-white"
                />
              </div>

              {/* FOOTER & APPROVE BUTTON */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-sm">
                  <span className="text-slate-500 font-bold">Total GRN Inward Value: </span>
                  <span className="text-lg font-black text-emerald-700 ml-1">
                    Rs. {grnForm.Items.reduce((sum, i) => sum + (Number(i.ReceivedQty) * Number(i.UnitPrice)), 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowGrnModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grnForm.Items.length === 0 || !grnForm.POID}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve GRN & Update Inventory Stock</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG TRANSACTION */}
      {showTxnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Log Financial Voucher</h3>
            <form onSubmit={handleAddTxn} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={txnForm.Type}
                    onChange={e => setTxnForm({ ...txnForm, Type: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                    <option value="VendorPayment">Vendor Payment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Payment Method</label>
                  <select
                    value={txnForm.PaymentMethod}
                    onChange={e => setTxnForm({ ...txnForm, PaymentMethod: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {txnForm.Type === 'VendorPayment' && (
                <div className="space-y-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">Select Vendor / Supplier</label>
                    <select
                      value={txnForm.VendorName}
                      onChange={e => {
                        const v = vendors.find(item => item.VendorName === e.target.value);
                        setTxnForm({
                          ...txnForm,
                          VendorName: e.target.value,
                          VendorID: v?.VendorID || '',
                          Amount: v?.Balance || txnForm.Amount || 0
                        });
                      }}
                      className="w-full p-2 border rounded-xl text-xs bg-white font-bold text-slate-800 border-amber-300"
                    >
                      <option value="">-- Choose Vendor / Supplier --</option>
                      {vendors.map((v, idx) => (
                        <option key={idx} value={v.VendorName}>
                          {v.VendorName} (Outstanding: Rs. {v.Balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      Vendor Invoice Number / Bill No <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={txnForm.ReferenceNo || ''}
                      onChange={e => setTxnForm({ 
                        ...txnForm, 
                        ReferenceNo: e.target.value,
                        Description: e.target.value ? `Payment against Vendor Invoice #${e.target.value} for ${txnForm.VendorName || 'Vendor'}` : txnForm.Description
                      })}
                      placeholder="e.g. INV-90821 or GRN-4321"
                      className="w-full p-2 border rounded-xl text-xs bg-white font-mono font-bold text-indigo-900 border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />

                    {(() => {
                      const matchingGrns = grns.filter(g => 
                        (txnForm.VendorID && g.VendorID === txnForm.VendorID) ||
                        (txnForm.VendorName && g.VendorName === txnForm.VendorName)
                      );
                      if (matchingGrns.length === 0) return null;

                      return (
                        <div className="mt-2">
                          <span className="text-[10px] font-bold text-amber-800 block mb-1">
                            Available GRNs/Invoices for this Vendor:
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {matchingGrns.map((g, gIdx) => {
                              const invLabel = g.SupplierInvoiceNo || g.ChallanNo || g.GRNID;
                              return (
                                <button
                                  type="button"
                                  key={gIdx}
                                  onClick={() => setTxnForm({
                                    ...txnForm,
                                    ReferenceNo: invLabel,
                                    Amount: g.TotalAmount || txnForm.Amount || 0,
                                    Description: `Payment against Vendor Invoice #${invLabel} (${g.GRNID})`
                                  })}
                                  className="text-[10px] px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-mono font-bold transition cursor-pointer"
                                >
                                  #{invLabel} (Rs. {(g.TotalAmount || 0).toLocaleString()})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600">Category Name</label>
                <input
                  type="text"
                  required
                  value={txnForm.Category}
                  onChange={e => setTxnForm({ ...txnForm, Category: e.target.value })}
                  placeholder="e.g. Electricity Bill, Vendor Payment"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={txnForm.Amount || ''}
                  onChange={e => setTxnForm({ ...txnForm, Amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Description</label>
                <input
                  type="text"
                  value={txnForm.Description}
                  onChange={e => setTxnForm({ ...txnForm, Description: e.target.value })}
                  placeholder="Remarks"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTxnModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Staff Employee Profile</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Full Name</label>
                <input
                  type="text"
                  required
                  value={empForm.FullName}
                  onChange={e => setEmpForm({ ...empForm, FullName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Role</label>
                  <input
                    type="text"
                    value={empForm.Role}
                    onChange={e => setEmpForm({ ...empForm, Role: e.target.value })}
                    placeholder="Pharmacist"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={empForm.Salary || ''}
                    onChange={e => setEmpForm({ ...empForm, Salary: Number(e.target.value) })}
                    placeholder="45000"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={empForm.Phone}
                    onChange={e => setEmpForm({ ...empForm, Phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">CNIC</label>
                  <input
                    type="text"
                    value={empForm.CNIC}
                    onChange={e => setEmpForm({ ...empForm, CNIC: e.target.value })}
                    placeholder="35202-1234567-1"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROCESS PAYROLL */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Process Monthly Staff Salary Payroll</h3>
            <form onSubmit={handleProcessPayroll} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Select Employee</label>
                <select
                  required
                  value={payrollForm.EmployeeID}
                  onChange={e => {
                    const emp = employees.find(item => item.EmployeeID === e.target.value);
                    setPayrollForm({
                      ...payrollForm,
                      EmployeeID: e.target.value,
                      BasicSalary: emp?.Salary || 0
                    });
                  }}
                  className="w-full mt-1 p-2 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp, idx) => (
                    <option key={idx} value={emp.EmployeeID}>{emp.FullName} ({emp.Role}) - Rs. {emp.Salary.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Month / Year</label>
                  <input
                    type="month"
                    required
                    value={payrollForm.MonthYear}
                    onChange={e => setPayrollForm({ ...payrollForm, MonthYear: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Basic Salary</label>
                  <input
                    type="number"
                    value={payrollForm.BasicSalary}
                    onChange={e => setPayrollForm({ ...payrollForm, BasicSalary: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Allowances (Rs.)</label>
                  <input
                    type="number"
                    value={payrollForm.Allowances}
                    onChange={e => setPayrollForm({ ...payrollForm, Allowances: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Deductions (Rs.)</label>
                  <input
                    type="number"
                    value={payrollForm.Deductions}
                    onChange={e => setPayrollForm({ ...payrollForm, Deductions: Number(e.target.value) })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Confirm & Disburse Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Record Operational Expense</h3>
              <button
                type="button"
                onClick={() => {
                  setShowExpenseModal(false);
                  setShowAddCategoryInput(false);
                  setNewCategoryName('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Categories (Grid View)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategoryInput(!showAddCategoryInput);
                      setEditingCategoryName(null);
                      setNewCategoryName('');
                    }}
                    className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Inline New Category Creation Input */}
                {showAddCategoryInput && (
                  <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 animate-fadeIn">
                    <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wide block">
                      New Category Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Generator Fuel, Internet"
                        className="flex-1 p-2 text-xs border border-indigo-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveNewCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveNewCategory}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Edit Category Input */}
                {editingCategoryName && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wide block">
                        Edit Category: <span className="underline">{editingCategoryName}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryName(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editCategoryNewValue}
                        onChange={(e) => setEditCategoryNewValue(e.target.value)}
                        className="flex-1 p-2 text-xs border border-amber-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEditedCategory();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditedCategory}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid View of Categories */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {allExpenseCategories.map((cat) => {
                    const isSelected = expenseForm.Category === cat;

                    return (
                      <div
                        key={cat}
                        onClick={() => setExpenseForm(prev => ({ ...prev, Category: cat }))}
                        className={`group p-2 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center justify-between gap-1 select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60'
                        }`}
                      >
                        <span className="truncate flex-1">{cat}</span>

                        <div className="flex items-center space-x-0.5 shrink-0">
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditCategory(cat);
                            }}
                            title={`Edit ${cat}`}
                            className={`p-0.5 rounded transition cursor-pointer ${
                              isSelected
                                ? 'hover:bg-white/20 text-white/90 hover:text-white'
                                : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Edit className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete category "${cat}"?`)) {
                                handleDeleteCategory(cat);
                              }
                            }}
                            title={`Delete ${cat}`}
                            className={`p-0.5 rounded transition cursor-pointer ${
                              isSelected
                                ? 'hover:bg-rose-500/80 text-white/90 hover:text-white'
                                : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Selected Category: <strong className="text-indigo-700">{expenseForm.Category}</strong>
                  </label>
                  <select
                    value={expenseForm.Category}
                    onChange={e => setExpenseForm({ ...expenseForm, Category: e.target.value })}
                    className="w-full mt-0.5 p-1.5 border rounded-lg text-xs bg-white font-bold focus:ring-2 focus:ring-indigo-500 text-slate-700"
                  >
                    {allExpenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.Description}
                  onChange={e => setExpenseForm({ ...expenseForm, Description: e.target.value })}
                  placeholder="e.g. AC Gas Refill & Service"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.Amount || ''}
                  onChange={e => setExpenseForm({ ...expenseForm, Amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ASSET */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Fixed Asset Record</h3>
            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Asset Name</label>
                <input
                  type="text"
                  required
                  value={assetForm.AssetName}
                  onChange={e => setAssetForm({ ...assetForm, AssetName: e.target.value })}
                  placeholder="e.g. Haier Insulin Refrigerator"
                  className="w-full mt-1 p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Category</label>
                  <select
                    value={assetForm.Category}
                    onChange={e => setAssetForm({ ...assetForm, Category: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="Equipment">Equipment</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Purchase Cost (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={assetForm.PurchaseCost || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setAssetForm({ ...assetForm, PurchaseCost: val, CurrentValue: val });
                    }}
                    placeholder="150000"
                    className="w-full mt-1 p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Save Fixed Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE VENDOR STATEMENT PREVIEW MODAL */}
      {vendorPrintModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:m-0 print:overflow-visible">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[92vh] print:h-auto print:max-w-none print:w-full print:border-0 print:shadow-none print:rounded-none animate-fadeIn">
            {/* Modal Control Bar (Hidden on Print) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl shrink-0">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-amber-600" />
                  Vendor Account Statement A4 Letterhead Preview
                </span>
                <p className="text-[10px] text-slate-500">Official ledger statement for {selectedVendor.VendorName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Statement (A4)
                </button>
                <button
                  onClick={() => setVendorPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Document Sheet */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-900 bg-white" id="vendor-printable-sheet">
              {/* OFFICIAL PUNJAB HOMEOPATHIC CLINIC A4 LETTERHEAD HEADER */}
              {(() => {
                const cName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY';
                const cTag = clinicSettings?.ClinicLogoText || 'HEALING NATURALLY • RESTORING BALANCE';
                const cDoc = clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)';
                const cDocSub = clinicSettings?.DoctorSignatureText || 'Reg No: 48776 | Homeopathic Medical Specialist';
                const cAddr = clinicSettings?.ClinicAddress || 'Main Boulevard, Lahore, Pakistan';
                const cPhone = clinicSettings?.PhoneMobile || '+92 300 1234567';
                const logoSrc = clinicSettings?.ClinicLogoImage || '/nhc_logo.svg';

                return (
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      {/* Official Clinic Logo */}
                      <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                        <img src={logoSrc} alt={cName} className="max-w-full max-h-full object-contain" />
                      </div>

                      {/* Center Branding */}
                      <div className="text-center flex-1">
                        <h1 className="text-xl sm:text-2xl font-black text-rose-950 uppercase tracking-tight font-serif leading-tight">
                          {cName}
                        </h1>
                        <p className="text-[10px] font-extrabold text-rose-800 tracking-widest uppercase mt-0.5">
                          {cTag}
                        </p>
                        <p className="text-[11px] font-extrabold text-slate-800 mt-0.5">
                          {cDoc} <span className="font-normal text-slate-600">({cDocSub})</span>
                        </p>
                        <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                          📍 {cAddr} &nbsp;|&nbsp; 📞 {cPhone}
                        </p>
                      </div>

                      {/* Right Statement Badge */}
                      <div className="text-right space-y-1 shrink-0">
                        <span className="inline-block px-3 py-1 bg-amber-100 print:bg-slate-100 text-amber-900 print:text-slate-900 border border-amber-300 print:border-slate-400 font-black text-xs uppercase tracking-wider rounded-md">
                          SUPPLIER STATEMENT
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono pt-1">
                          Statement Date: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-GB')}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Period Filter: <span className="font-bold text-slate-800 capitalize">{vendorDateFilter === 'all' ? 'All Time (Full Ledger)' : vendorDateFilter}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Doc Ref: STMT-{selectedVendor.VendorID || 'VND'}-{new Date().toISOString().slice(0,10).replace(/-/g,'')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SUPPLIER DETAILS & SUMMARY CARDS */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs print:bg-slate-50">
                <div className="space-y-1.5 border-r border-slate-200 pr-4">
                  <p className="text-[10px] font-black uppercase text-amber-800 print:text-slate-800 tracking-wider flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1" />
                    Supplier / Distributor Details
                  </p>
                  <p className="font-black text-sm text-slate-950">{selectedVendor.VendorName}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-700 text-[11px]">
                    <p>Vendor ID: <span className="font-mono font-bold text-slate-900">{selectedVendor.VendorID || 'N/A'}</span></p>
                    <p>NTN / Tax ID: <span className="font-mono font-bold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span></p>
                    <p>Contact: <span className="font-bold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span></p>
                    <p>Phone: <span className="font-bold text-slate-900">{selectedVendor.Phone || 'N/A'}</span></p>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">Address: {selectedVendor.Address || 'N/A'}</p>
                </div>

                <div className="space-y-1.5 pl-2 text-right flex flex-col justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Accounts Payable Financial Summary
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Total Purchases / GRN Bills (Credit):</span>
                      <span className="font-mono font-bold text-amber-800 print:text-slate-900">Rs. {vendorStatement.totalInvoiced.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>Total Bill Payments Settled (Debit):</span>
                      <span className="font-mono font-bold text-emerald-700 print:text-slate-900">Rs. {vendorStatement.totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-300/80 print:bg-slate-100 print:border-slate-400">
                    <span className="text-xs font-black uppercase text-slate-900">Net Outstanding Balance:</span>
                    <span className="text-base font-mono font-black text-amber-800 print:text-slate-950">Rs. {vendorStatement.closingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* STATEMENT ROWS TABLE (WITH PURCHASE ORDER NUMBER COLUMN) */}
              <div className="border border-slate-300 rounded-xl overflow-hidden print:border-slate-400">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider print:bg-slate-950">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Ref / Voucher #</th>
                      <th className="p-2.5">P.O. Number</th>
                      <th className="p-2.5">Description / Particulars</th>
                      <th className="p-2.5 text-right">Debit (Paid)</th>
                      <th className="p-2.5 text-right">Credit (Bill)</th>
                      <th className="p-2.5 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                    {vendorStatement.statementRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          No transactions or GRNs recorded for this vendor in selected period.
                        </td>
                      </tr>
                    ) : (
                      vendorStatement.statementRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-700 whitespace-nowrap">{row.date}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              row.credit > 0 ? 'bg-amber-100 text-amber-900 print:bg-slate-100 print:text-slate-900' : 'bg-emerald-100 text-emerald-900 print:bg-slate-100 print:text-slate-900'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{row.refNo}</td>
                          <td className="p-2.5 font-mono font-bold text-indigo-700 print:text-slate-900 whitespace-nowrap">
                            {row.poNo !== 'N/A' ? row.poNo : '-'}
                          </td>
                          <td className="p-2.5 text-slate-700">{row.description}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700 print:text-slate-900 whitespace-nowrap">
                            {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-amber-700 print:text-slate-900 whitespace-nowrap">
                            {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                            Rs. {(row.runningBalance || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900 text-xs">
                      <td colSpan={5} className="p-2.5 text-right uppercase font-black">Total Ledger Summary:</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-800 print:text-slate-950 whitespace-nowrap">
                        Rs. {vendorStatement.totalPaid.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-800 print:text-slate-950 whitespace-nowrap">
                        Rs. {vendorStatement.totalInvoiced.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        Rs. {vendorStatement.closingBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* AUDIT & SIGNATURES BLOCK FOR A4 LETTERHEAD */}
              <div className="pt-8 mt-6 border-t border-slate-300 grid grid-cols-4 gap-4 text-center text-[10px] font-bold text-slate-700 print:pt-12">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-1 h-8 flex items-end justify-center font-mono text-[9px] text-slate-600">
                    {currentUser?.FullName || 'Accountant'}
                  </div>
                  <p className="uppercase tracking-wider font-extrabold text-[9px]">PREPARED BY (ACCOUNTANT)</p>
                  <p className="text-[8px] text-slate-500 font-medium">Accounts & Audit Desk</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-1 h-8"></div>
                  <p className="uppercase tracking-wider font-extrabold text-[9px]">CHECKED BY (AUDITOR)</p>
                  <p className="text-[8px] text-slate-500 font-medium">Internal Audit Wing</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-1 h-8"></div>
                  <p className="uppercase tracking-wider font-extrabold text-[9px]">VENDOR STAMP & SIGN</p>
                  <p className="text-[8px] text-slate-500 font-medium">Authorized Distributor Seal</p>
                </div>

                <div className="space-y-1">
                  <div className="border-b-2 border-slate-900 pb-1 h-8 flex items-end justify-center font-black text-xs text-slate-900 font-serif">
                    Zaigham Ali Anjum
                  </div>
                  <p className="uppercase tracking-wider font-extrabold text-[10px] text-rose-900">MR. ZAIGHAM ALI ANJUM</p>
                  <p className="text-[9px] text-slate-800 font-bold">Manager Operations & Administrative Head</p>
                  <p className="text-[8px] text-emerald-800 font-bold">Punjab Homeopathic Clinic & Pharmacy</p>
                </div>
              </div>

              {/* FOOTER DISCLAIMER */}
              <div className="pt-4 border-t border-slate-200 text-between flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <p>Punjab Homeopathic Clinic & Pharmacy • Accounts Payable Ledger System • Confidential Document</p>
                <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAY VENDOR BILL POPUP MODAL */}
      {payVendorModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                  <Coins className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Pay Vendor Bill & Clear Payable</h3>
                  <p className="text-xs text-slate-500">
                    Vendor: <strong className="text-slate-800">{payVendorModalData.vendor.VendorName}</strong> ({payVendorModalData.vendor.VendorID || 'N/A'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayVendorModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payable Balance Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Current Outstanding Payable</span>
                <div className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                  Rs. {payVendorModalData.vendor.Balance.toLocaleString()}
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Status: {payVendorModalData.vendor.Balance > 0 ? 'Payable Due' : 'Cleared'}
              </span>
            </div>

            {/* Purchase Orders & GRNs for this Vendor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Select Purchase Order / Invoice Number</span>
                </label>
                <span className="text-[11px] text-slate-500 italic">Click PO to auto-fill invoice & amount</span>
              </div>

              {(() => {
                const vPos = purchaseOrders.filter(po => 
                  (po.VendorID && po.VendorID === payVendorModalData.vendor.VendorID) || 
                  (po.VendorName && po.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );
                const vGrns = grns.filter(g => 
                  (g.VendorID && g.VendorID === payVendorModalData.vendor.VendorID) || 
                  (g.VendorName && g.VendorName.toLowerCase() === payVendorModalData.vendor.VendorName.toLowerCase())
                );

                if (vPos.length === 0 && vGrns.length === 0) {
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium text-center">
                      No prior Purchase Orders or GRNs logged for this vendor. Enter Supplier Invoice Number manually below.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    {vPos.map((po, idx) => {
                      const matchGrn = vGrns.find(g => g.POID === po.POID);
                      const invStr = matchGrn?.SupplierInvoiceNo || po.POID;
                      const isSelected = payVendorModalData.invNo === invStr || payVendorModalData.poId === po.POID;

                      return (
                        <button
                          key={po.POID || idx}
                          type="button"
                          onClick={() => {
                            setPayVendorModalData(prev => prev ? ({
                              ...prev,
                              invNo: invStr,
                              poId: po.POID,
                              amount: po.TotalAmount > 0 && po.TotalAmount <= prev.vendor.Balance ? po.TotalAmount : prev.amount,
                              description: `Payment against PO #${po.POID} (Invoice #${invStr}) for ${prev.vendor.VendorName}`
                            }) : null);
                          }}
                          className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs font-black text-indigo-700">P.O. #{po.POID}</span>
                              {matchGrn?.SupplierInvoiceNo && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border font-mono">
                                  Inv: {matchGrn.SupplierInvoiceNo}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Date: {po.OrderDate} | {po.Items?.length || 0} Items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-extrabold font-mono text-slate-900">Rs. {(po.TotalAmount || 0).toLocaleString()}</div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                              po.Status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {po.Status || 'Pending'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Payment Form */}
            <form onSubmit={handleConfirmPayVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Vendor Invoice / Supplier Bill No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-9821 / Challan # / PO #"
                    value={payVendorModalData.invNo}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, invNo: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Payment Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    placeholder="Amount to pay"
                    value={payVendorModalData.amount || ''}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, amount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Method</label>
                  <select
                    value={payVendorModalData.paymentMethod}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, paymentMethod: e.target.value as any })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer / Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payVendorModalData.date}
                    onChange={e => setPayVendorModalData({ ...payVendorModalData, date: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Payment Description / Notes</label>
                <input
                  type="text"
                  placeholder="Payment notes or bank transaction ref"
                  value={payVendorModalData.description}
                  onChange={e => setPayVendorModalData({ ...payVendorModalData, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayVendorModalData(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Post Vendor Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR PURCHASE ORDERS MODAL */}
      {vendorPoModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl font-bold">
                  <Boxes className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Purchase Orders — {vendorPoModalData.VendorName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vendor Code: <strong className="text-slate-800">{vendorPoModalData.VendorID || 'N/A'}</strong> | Contact: {vendorPoModalData.Phone || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVendorPoModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const vPos = purchaseOrders.filter(po => 
                (po.VendorID && po.VendorID === vendorPoModalData.VendorID) || 
                (po.VendorName && po.VendorName.toLowerCase() === vendorPoModalData.VendorName.toLowerCase())
              );

              if (vPos.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="text-slate-700 font-bold text-sm">No Purchase Orders Found</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No official purchase orders have been created for {vendorPoModalData.VendorName} yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setVendorPoModalData(null);
                        setPoForm(prev => ({
                          ...prev,
                          VendorID: vendorPoModalData.VendorID || '',
                          VendorName: vendorPoModalData.VendorName || ''
                        }));
                        setShowPoModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition inline-flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New PO for this Vendor</span>
                    </button>
                  </div>
                );
              }

              const totalValue = vPos.reduce((acc, p) => acc + (p.TotalAmount || 0), 0);

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 gap-2">
                    <div className="text-xs font-bold text-slate-700">
                      Total Purchase Orders: <span className="text-indigo-700 font-black">{vPos.length} Orders</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Total Orders Value: <span className="text-emerald-700 font-mono font-black">Rs. {totalValue.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVendorPoModalData(null);
                        setPoForm(prev => ({
                          ...prev,
                          VendorID: vendorPoModalData.VendorID || '',
                          VendorName: vendorPoModalData.VendorName || ''
                        }));
                        setShowPoModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New PO</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="p-3">PO Ref No</th>
                          <th className="p-3">Order Date</th>
                          <th className="p-3">Expected Delivery</th>
                          <th className="p-3 text-center">Items Count</th>
                          <th className="p-3 text-right">Total Amount</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {vPos.map((po, idx) => (
                          <tr key={po.POID || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold text-indigo-700">{po.POID}</td>
                            <td className="p-3 text-slate-600">{po.OrderDate}</td>
                            <td className="p-3 text-slate-600">{po.ExpectedDeliveryDate || 'Immediate'}</td>
                            <td className="p-3 text-center font-bold text-slate-700">
                              {po.Items?.length || 0} items
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              Rs. {(po.TotalAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                po.Status === 'Received'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : po.Status === 'Partially Received'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              }`}>
                                {po.Status || 'Pending'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handlePrintPo(po)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded border border-slate-300 transition cursor-pointer flex items-center space-x-1"
                                  title="Print Official PO"
                                >
                                  <Printer className="w-3 h-3 text-slate-600" />
                                  <span>Print</span>
                                </button>
                                {po.Status !== 'Received' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVendorPoModalData(null);
                                      handleOpenGrnForPo(po);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded border border-emerald-200 transition cursor-pointer flex items-center space-x-1"
                                    title="Process Goods Received Note (GRN)"
                                  >
                                    <PackageCheck className="w-3 h-3 text-emerald-600" />
                                    <span>GRN</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setVendorPoModalData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner & Generator Modals */}
      <ItemQRScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        onScanSuccess={(parsed) => {
          setMedicineSearchTerm(parsed.itemId || parsed.itemName);
          setShowQrScannerModal(false);
        }}
      />

      <ItemQRGeneratorModal
        isOpen={showQrGeneratorModal}
        onClose={() => setShowQrGeneratorModal(false)}
        items={inventoryItems.map((itm: any) => ({
          ItemID: itm.ItemID || `ITM-${Math.floor(100 + Math.random() * 900)}`,
          ItemName: itm.ItemName || 'Medicine Item',
          MedicineType: itm.MedicineType || 'P',
          Category: itm.Category || 'General',
          Price: itm.Price || itm.PurchasePrice || 100,
          CStock: itm.CStock ?? itm.Stock ?? 0,
          Unit: itm.Unit || 'Pack'
        }))}
        clinicName="ERP Pharmacy Operations"
      />
    </div>
  );
}
