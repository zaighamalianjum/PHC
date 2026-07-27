/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Lock,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  PlusCircle,
  TreeDeciduous,
  Scale,
  FolderTree,
  ChevronRight,
  TrendingUp,
  Package,
  ShoppingCart,
  Coins,
  ArrowRight,
  X,
  PlusIcon
} from 'lucide-react';
import {
  FLAccount,
  SLAccount,
  TLAccount,
  VchHeader,
  VchDetail,
  ACLedger,
  UserRight,
  Item,
  InvVchHeader,
  InvVchDetail,
  InvoiceHeader,
  InvoiceDetail
} from '../types';

interface AccountingDeskProps {
  flAccounts: FLAccount[];
  slAccounts: SLAccount[];
  tlAccounts: TLAccount[];
  onUpdateAccountBalance: (tlid: number, amt: number) => void;
  vouchers: VchHeader[];
  voucherDetails: VchDetail[];
  onAddVoucher: (vch: VchHeader, details: VchDetail[]) => void;
  acLedger: ACLedger[];
  userRights: UserRight[];
  onAddAccount?: (acc: TLAccount) => void;
  onDeleteAccount?: (tlid: number) => void;
  items?: Item[];
  grns?: InvVchHeader[];
  grnDetails?: InvVchDetail[];
  invoices?: InvoiceHeader[];
  invoiceDetails?: InvoiceDetail[];
}

export default function AccountingDesk({
  flAccounts,
  slAccounts,
  tlAccounts,
  onUpdateAccountBalance,
  vouchers,
  voucherDetails,
  onAddVoucher,
  acLedger,
  userRights,
  onAddAccount,
  onDeleteAccount,
  items = [],
  grns = [],
  grnDetails = [],
  invoices = [],
  invoiceDetails = []
}: AccountingDeskProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'coa' | 'voucher' | 'pl_expenses' | 'commerce'>('coa');

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'accounts');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Active expanded levels in Tree
  const [expandedFl, setExpandedFl] = useState<number[]>(flAccounts.map((f) => f.FLID));
  const [expandedSl, setExpandedSl] = useState<number[]>(slAccounts.map((s) => s.SLID));
  const [selectedTlid, setSelectedTlid] = useState<number | null>(null);
  const [coaSearch, setCoaSearch] = useState('');

  // Account creation state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [targetSlidForNewAcc, setTargetSlidForNewAcc] = useState<number | null>(null);
  const [newAccName, setNewAccName] = useState('');
  const [newAccInitBal, setNewAccInitBal] = useState<number>(0);

  // Voucher entry form
  const [vchType, setVchType] = useState<'JV' | 'CRV' | 'CPV'>('JV');
  const [vchRemarks, setVchRemarks] = useState('');
  const [vchDate, setVchDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Multi-row voucher details grid
  const [voucherRows, setVoucherRows] = useState<{ TLID: number; Debit: number; Credit: number; Description: string }[]>([
    { TLID: 101001, Debit: 0, Credit: 0, Description: '' },
    { TLID: 502001, Debit: 0, Credit: 0, Description: '' }
  ]);

  const [vchSuccess, setVchSuccess] = useState('');

  // Rapid Expense state
  const [expenseTlid, setExpenseTlid] = useState<number>(502001); // default rent
  const [expenseFundingTlid, setExpenseFundingTlid] = useState<number>(101001); // default morning cash box
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseSuccess, setExpenseSuccess] = useState<string>('');

  // Calculate voucher balancing totals
  const totalDebit = voucherRows.reduce((sum, r) => sum + r.Debit, 0);
  const totalCredit = voucherRows.reduce((sum, r) => sum + r.Credit, 0);
  const diffBalance = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && diffBalance === 0;

  // Expand / collapse tree handlers
  const toggleFl = (flid: number) => {
    setExpandedFl(
      expandedFl.includes(flid) ? expandedFl.filter((id) => id !== flid) : [...expandedFl, flid]
    );
  };

  const toggleSl = (slid: number) => {
    setExpandedSl(
      expandedSl.includes(slid) ? expandedSl.filter((id) => id !== slid) : [...expandedSl, slid]
    );
  };

  // Add line to voucher row grid
  const handleAddVchRow = () => {
    setVoucherRows([
      ...voucherRows,
      { TLID: tlAccounts[0]?.TLID || 101001, Debit: 0, Credit: 0, Description: '' }
    ]);
  };

  const handleRemoveVchRow = (index: number) => {
    setVoucherRows(voucherRows.filter((_, idx) => idx !== index));
  };

  const handleUpdateVchRow = (index: number, key: string, val: any) => {
    const updated = [...voucherRows];
    updated[index] = { ...updated[index], [key]: val };
    setVoucherRows(updated);
  };

  // Submit and balance post double-entry voucher
  const handlePostVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert(`Ledger Grid Unbalanced: Total Debits (Rs. ${totalDebit}) must equal Total Credits (Rs. ${totalCredit}). Difference is Rs. ${diffBalance}.`);
      return;
    }
    if (!canPost) {
      alert('Security Protection: Accountant/Admin (PostRec) authorization required.');
      return;
    }

    const nextVchNo = `${vchType}-${String(vouchers.length + 1).padStart(4, '0')}`;
    const vchHeader: VchHeader = {
      VchNo: nextVchNo,
      VchDate: vchDate,
      VchType: vchType,
      Status: 2, // Posted
      Remarks: vchRemarks || `${vchType} double-entry voucher entry`
    };

    const details: VchDetail[] = voucherRows.map((r) => ({
      VchNo: nextVchNo,
      TLID: r.TLID,
      Debit: r.Debit,
      Credit: r.Credit,
      Description: r.Description || vchRemarks
    }));

    onAddVoucher(vchHeader, details);
    setVchSuccess(`Double-entry voucher ${nextVchNo} posted successfully! Mapped accounts balances have updated.`);
    
    // Clear form
    setVchRemarks('');
    setVoucherRows([
      { TLID: 101001, Debit: 0, Credit: 0, Description: '' },
      { TLID: 502001, Debit: 0, Credit: 0, Description: '' }
    ]);

    setTimeout(() => setVchSuccess(''), 6000);
  };

  // Submit Rapid Expense
  const handleRecordRapidExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!canPost) {
      alert('Security Protection: Accountant/Admin authorization required.');
      return;
    }

    const nextVchNo = `CPV-EXP-${String(vouchers.length + 1).padStart(4, '0')}`;
    const remarks = expenseDesc || `Paid for ${tlAccounts.find(a => a.TLID === expenseTlid)?.TLName || 'expense'}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const vchHeader: VchHeader = {
      VchNo: nextVchNo,
      VchDate: dateStr,
      VchType: 'CPV',
      Status: 2,
      Remarks: remarks
    };

    // Double entry rows: Debit Expense, Credit Asset Cash
    const details: VchDetail[] = [
      {
        VchNo: nextVchNo,
        TLID: expenseTlid,
        Debit: amt,
        Credit: 0,
        Description: remarks
      },
      {
        VchNo: nextVchNo,
        TLID: expenseFundingTlid,
        Debit: 0,
        Credit: amt,
        Description: remarks
      }
    ];

    onAddVoucher(vchHeader, details);
    setExpenseSuccess(`Rapid expense ${nextVchNo} recorded. Rs. ${amt.toLocaleString()} debited to ${tlAccounts.find(a => a.TLID === expenseTlid)?.TLName}.`);
    
    // Clear Rapid Form
    setExpenseAmount('');
    setExpenseDesc('');
    setTimeout(() => setExpenseSuccess(''), 6000);
  };

  // Handle Creating custom account
  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlidForNewAcc) return;
    if (!newAccName.trim()) {
      alert('Account name is required.');
      return;
    }

    const slAcc = slAccounts.find(s => s.SLID === targetSlidForNewAcc);
    if (!slAcc) return;

    // Auto-compute next TLID code
    const existingSisters = tlAccounts.filter(t => t.SLID === targetSlidForNewAcc);
    const maxSisterCode = existingSisters.reduce((max, t) => t.TLID > max ? t.TLID : max, targetSlidForNewAcc * 10);
    // E.g. SLID is 502000, first tlid can be 502001
    const nextTlid = maxSisterCode + 1;

    const newAccount: TLAccount = {
      FLID: slAcc.FLID,
      SLID: slAcc.SLID,
      TLID: nextTlid,
      TLName: newAccName.trim(),
      AcBalance: newAccInitBal || 0
    };

    if (onAddAccount) {
      onAddAccount(newAccount);
      setNewAccName('');
      setNewAccInitBal(0);
      setShowAddAccountModal(false);
      setSelectedTlid(nextTlid);
    }
  };

  // Handle Deleting Account
  const handleDeleteAccountClick = (tlid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Safe-guards: System core accounts cannot be deleted
    const coreSystemAccounts = [
      101001, 101002, 102001, 103001, 201001, 201002,
      401101, 401102, 401103, 401104, 401105, 401201, 401202, 401203, 401204, 401205,
      401001, 401002, 402001, 501001, 501002, 501003, 502001
    ];
    if (coreSystemAccounts.includes(tlid)) {
      alert('Security lock: Core clinic accounts are locked and cannot be deleted.');
      return;
    }

    // Safeguard: Check if account has ledger postings
    const hasPostings = acLedger.some(l => l.TLID === tlid);
    if (hasPostings) {
      alert(`Cannot delete: Account code [${tlid}] has active general ledger journal entries registered.`);
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete account: [${tlid}] ${tlAccounts.find(a => a.TLID === tlid)?.TLName}?`)) {
      if (onDeleteAccount) {
        onDeleteAccount(tlid);
        if (selectedTlid === tlid) {
          setSelectedTlid(null);
        }
      }
    }
  };

  // Details helper for selected account ledger logs
  const selectedAccountDetails = tlAccounts.find((t) => t.TLID === selectedTlid);
  const accountLedgerPostings = acLedger.filter((l) => l.TLID === selectedTlid);

  // Compute live calculations for custom mini P&L dashboard
  const operatingRevenues = tlAccounts.filter(acc => Math.floor(acc.TLID / 100000) === 4);
  const totalRevenuesAmt = operatingRevenues.reduce((sum, acc) => sum + Math.abs(acc.AcBalance), 0);

  const directCogsAcc = tlAccounts.find(acc => acc.TLID === 501001);
  const totalCogsAmt = directCogsAcc ? directCogsAcc.AcBalance : 0;

  const grossProfitAmt = totalRevenuesAmt - totalCogsAmt;

  const operatingExpenses = tlAccounts.filter(acc => Math.floor(acc.TLID / 100000) === 5 && acc.TLID !== 501001);
  const totalExpensesAmt = operatingExpenses.reduce((sum, acc) => sum + acc.AcBalance, 0);

  const netIncomeAmt = grossProfitAmt - totalExpensesAmt;

  // Filter COA by search string
  const matchesSearch = (text: string) => text.toLowerCase().includes(coaSearch.toLowerCase());

  // Inventory stats calculations
  const totalItemsCount = items.length;
  const totalStockValuation = items.reduce((sum, itm) => sum + (itm.CStock * (itm.PurchasePrice || 0)), 0);
  const totalPotentialRetailVal = items.reduce((sum, itm) => sum + (itm.CStock * (itm.Price || 0)), 0);
  const lowStockItems = items.filter(itm => itm.CStock < 20);

  // Purchases GRN values
  const totalPurchasesAmt = grnDetails.reduce((sum, d) => sum + (d.QtyIn * d.PurchaseRate), 0);

  // Sales values
  const totalSalesGross = invoices.reduce((sum, inv) => sum + inv.GAmount, 0);
  const totalSalesDiscount = invoices.reduce((sum, inv) => sum + inv.Discount, 0);
  const totalSalesNet = invoices.reduce((sum, inv) => sum + inv.NetAmount, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="accounts-desk">
      
      {/* Top Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              General Double-Entry Accounting Cockpit
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time unified Chart of Accounts tree, double-entry voucher journals, operational expenses logger, and inventory asset mapping.
          </p>
        </div>

        {/* Cohesive Sub Tab Navigator */}
        <div className="flex flex-wrap gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300">
          <button
            onClick={() => setActiveSubTab('coa')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'coa' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>Chart of Accounts</span>
          </button>
          <button
            onClick={() => setActiveSubTab('voucher')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'voucher' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Voucher Journal</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pl_expenses')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'pl_expenses' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>P&L & Expenses</span>
          </button>
          <button
            onClick={() => setActiveSubTab('commerce')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'commerce' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-orange-600" />
            <span>Inventory & Sales Link</span>
          </button>
        </div>
      </div>

      {/* QUICK HIGHLIGHT CARDS BAR (Bento Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Doctor Morning Cash</p>
            <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">
              Rs. {tlAccounts.find(a => a.TLID === 101001)?.AcBalance.toLocaleString() || '0'}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Doctor Evening Cash</p>
            <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">
              Rs. {tlAccounts.find(a => a.TLID === 101002)?.AcBalance.toLocaleString() || '0'}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Net Operating Revenue</p>
            <h4 className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">
              Rs. {totalRevenuesAmt.toLocaleString()}
            </h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className={`p-2.5 rounded-lg shrink-0 ${netIncomeAmt >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Net Profit/Loss</p>
            <h4 className={`text-sm font-bold font-mono mt-0.5 truncate ${netIncomeAmt >= 0 ? 'text-teal-700' : 'text-red-700'}`}>
              Rs. {netIncomeAmt.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>

      {/* SUB-TABS INTERFACE WORKSPACE */}

      {/* 1. CHART OF ACCOUNTS (COA) WITH CREATE/DELETE */}
      {activeSubTab === 'coa' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn" id="coa-tab">
          
          {/* Interactive Chart of Accounts list tree */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <FolderTree className="w-4 h-4 text-blue-500 mr-2" />
                  General Ledger Accounts Tree
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Click Level-1/Level-2 items to expand, select Level-3 to audit statements.</p>
              </div>

              {/* COA Search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ledger accounts..."
                  value={coaSearch}
                  onChange={(e) => setCoaSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xxs font-medium border border-slate-200 rounded-lg w-44 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Tree Workspace */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs select-none">
              
              {flAccounts.map((fl) => {
                const flExpanded = expandedFl.includes(fl.FLID);
                const childSls = slAccounts.filter((s) => s.FLID === fl.FLID);
                const filteredChildSls = childSls.filter(s => 
                  matchesSearch(s.SLName) || 
                  tlAccounts.some(t => t.SLID === s.SLID && matchesSearch(t.TLName))
                );

                if (coaSearch && filteredChildSls.length === 0) return null;

                return (
                  <div key={fl.FLID} className="space-y-1.5">
                    <div
                      onClick={() => toggleFl(fl.FLID)}
                      className="flex items-center justify-between py-2 px-3 bg-slate-100 hover:bg-slate-150 rounded-lg cursor-pointer font-extrabold text-slate-900 tracking-tight transition"
                    >
                      <div className="flex items-center space-x-1.5">
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${flExpanded ? 'rotate-90' : ''}`} />
                        <span>{fl.FLName}</span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-slate-400 bg-white px-1.5 py-0.5 rounded border">Level 1 (Code: {fl.FLID})</span>
                    </div>

                    {flExpanded && (
                      <div className="pl-5 space-y-1.5 animate-fadeIn">
                        {filteredChildSls.map((sl) => {
                          const slExpanded = expandedSl.includes(sl.SLID);
                          const childTls = tlAccounts.filter((t) => t.SLID === sl.SLID);
                          const filteredChildTls = childTls.filter(t => matchesSearch(t.TLName));

                          if (coaSearch && filteredChildTls.length === 0) return null;

                          return (
                            <div key={sl.SLID} className="space-y-1 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                              <div
                                onClick={() => toggleSl(sl.SLID)}
                                className="flex items-center justify-between py-1 px-2 hover:bg-slate-100/70 rounded-md cursor-pointer font-bold text-slate-700 transition"
                              >
                                <div className="flex items-center space-x-1.5">
                                  <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${slExpanded ? 'rotate-90' : ''}`} />
                                  <span className="text-[11px]">{sl.SLName}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[8px] font-mono text-slate-400">Level 2: {sl.SLID}</span>
                                  
                                  {/* Add Custom Level-3 account button */}
                                  {canAdd && onAddAccount && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTargetSlidForNewAcc(sl.SLID);
                                        setShowAddAccountModal(true);
                                      }}
                                      title="Add Custom Account under this Group"
                                      className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                                    >
                                      <PlusIcon className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {slExpanded && (
                                <div className="pl-4 space-y-0.5 animate-fadeIn">
                                  {filteredChildTls.map((tl) => {
                                    const active = selectedTlid === tl.TLID;
                                    const isLocked = [
                                      101001, 101002, 102001, 103001, 201001, 201002,
                                      401101, 401102, 401103, 401104, 401105, 401201, 401202, 401203, 401204, 401205,
                                      401001, 401002, 402001, 501001, 501002, 501003, 502001
                                    ].includes(tl.TLID);

                                    return (
                                      <div
                                        key={tl.TLID}
                                        onClick={() => setSelectedTlid(tl.TLID)}
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                          active
                                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                            : 'hover:bg-white text-slate-600 font-semibold'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2 min-w-0">
                                          <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                                          <span className="truncate text-[10.5px]">{tl.TLName}</span>
                                        </div>
                                        <div className="flex items-center space-x-2.5 shrink-0 ml-2">
                                          <div className="text-right">
                                            <span className="font-mono font-bold text-slate-800 text-[10.5px]">
                                              Rs. {tl.AcBalance.toLocaleString()}
                                            </span>
                                            <p className="text-[8px] font-mono text-slate-400 font-semibold">Code: {tl.TLID}</p>
                                          </div>
                                          
                                          {/* Custom Level-3 account delete button with postings check */}
                                          {!isLocked && onDeleteAccount && (
                                            <button
                                              onClick={(e) => handleDeleteAccountClick(tl.TLID, e)}
                                              title={acLedger.some(l => l.TLID === tl.TLID) ? "Locked: active transaction entries exist" : "Delete Custom Account"}
                                              className={`p-1 rounded border transition ${
                                                acLedger.some(l => l.TLID === tl.TLID)
                                                  ? 'text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed'
                                                  : 'text-red-500 bg-red-50 hover:bg-red-100 border-red-100'
                                              }`}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Statement Audit History Sidebar */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]" id="coa-ledger-sidebar">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Account Ledger Audit Statement</h3>
            
            {selectedAccountDetails ? (
              <div className="flex-1 flex flex-col justify-between h-full space-y-4 overflow-hidden">
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {/* Account statement box header */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 border border-slate-800 relative overflow-hidden">
                    <div className="absolute right-3 top-3 opacity-15">
                      <Scale className="w-16 h-16 text-white" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider block">Ledger Audit Certificate</span>
                    <h4 className="font-extrabold text-sm tracking-tight text-white mt-1">{selectedAccountDetails.TLName}</h4>
                    <p className="text-[9px] text-slate-400 font-bold font-mono">Account ID Code: [ {selectedAccountDetails.TLID} ]</p>
                    
                    <div className="pt-2.5 border-t border-slate-800/80 flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-400 font-medium">Running Trial Balance:</span>
                      <strong className="text-base font-bold font-mono text-emerald-400">Rs. {selectedAccountDetails.AcBalance.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Transaction posting history logs */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Double-Entry Journal Postings</span>
                    
                    {accountLedgerPostings.length === 0 ? (
                      <p className="text-xxs text-slate-400 italic text-center py-12 bg-slate-50 border border-dashed rounded-xl">
                        No transactions registered for this account code in General Ledger records yet.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {accountLedgerPostings.map((l) => (
                          <div key={l.ACLedgerID} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 text-[10px] font-semibold text-slate-600 space-y-1.5 relative transition">
                            <div className="flex justify-between items-start font-bold text-slate-900">
                              <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded border border-blue-100">{l.VchNo}</span>
                              <span className="text-slate-400 font-mono text-[9px]">{l.TxDate}</span>
                            </div>
                            <p className="text-slate-500 font-medium text-[10.5px] italic">"{l.Remarks || 'Operational general accounting double entry'}"</p>
                            
                            <div className="pt-1.5 border-t border-slate-200/60 flex justify-between">
                              <span>Debit: <strong className="font-mono text-emerald-600">Rs. {l.Debit.toLocaleString()}</strong></span>
                              <span>Credit: <strong className="font-mono text-red-600">Rs. {l.Credit.toLocaleString()}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 font-semibold italic text-center pt-2 border-t border-slate-100">
                  Subledger balances synchronize instantly upon billing checkout, purchases receipt, or manual vouchers post.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-semibold">
                <TreeDeciduous className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-xs leading-relaxed max-w-[200px]">Select any Level-3 account in the tree hierarchy to view its live ledger balances and audit statements.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. DOUBLE ENTRY VOUCHER JOURNAL ENTRY */}
      {activeSubTab === 'voucher' && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fadeIn" id="voucher-tab">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-950 flex items-center">
                <Scale className="w-4.5 h-4.5 text-indigo-500 mr-2 shrink-0 animate-pulse" />
                Double-Entry General Journal Voucher
              </h3>
              <p className="text-xxs text-slate-400 mt-0.5">Authoritatively record general transaction items into the system. Real-time balance constraint checking is applied.</p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Accounting Control</span>
          </div>

          {vchSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 shrink-0 text-emerald-600" />
              {vchSuccess}
            </div>
          )}

          <form onSubmit={handlePostVoucher} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Journal Type *</label>
                <select
                  required
                  value={vchType}
                  onChange={(e) => setVchType(e.target.value as any)}
                  className="mt-1 w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="JV">JV = General Journal Voucher</option>
                  <option value="CRV">CRV = Cash Receipt Voucher</option>
                  <option value="CPV">CPV = Cash Payment Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Posting Date</label>
                <input
                  type="date"
                  required
                  value={vchDate}
                  onChange={(e) => setVchDate(e.target.value)}
                  className="mt-1 w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Journal Narrative / Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disbursed consulting payouts, adjusted cash boxes"
                  value={vchRemarks}
                  onChange={(e) => setVchRemarks(e.target.value)}
                  className="mt-1 w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Voucher Row details editing grid */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Debits & Credits Distribution Grid</span>
                <button
                  type="button"
                  onClick={handleAddVchRow}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xxs font-extrabold uppercase rounded-lg flex items-center transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Ledger Line
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {voucherRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-150">
                    
                    {/* Account select dropdown */}
                    <div className="md:col-span-5">
                      <select
                        value={row.TLID}
                        onChange={(e) => handleUpdateVchRow(idx, 'TLID', parseInt(e.target.value))}
                        className="w-full text-xxs font-bold border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                      >
                        {tlAccounts.map((tl) => (
                          <option key={tl.TLID} value={tl.TLID}>
                            [{tl.TLID}] {tl.TLName} (Rs. {tl.AcBalance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Debit */}
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Debit Amount"
                        value={row.Debit || ''}
                        onChange={(e) => handleUpdateVchRow(idx, 'Debit', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 rounded-lg p-1.5 text-center focus:bg-white focus:outline-none text-emerald-700"
                      />
                    </div>

                    {/* Credit */}
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Credit Amount"
                        value={row.Credit || ''}
                        onChange={(e) => handleUpdateVchRow(idx, 'Credit', parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 rounded-lg p-1.5 text-center focus:bg-white focus:outline-none text-red-700"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={row.Description}
                        onChange={(e) => handleUpdateVchRow(idx, 'Description', e.target.value)}
                        className="w-full text-xxs font-medium border border-slate-200 bg-slate-50 rounded-lg p-1.5 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Delete row */}
                    <div className="md:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveVchRow(idx)}
                        disabled={voucherRows.length <= 2}
                        className="text-red-500 hover:text-red-700 disabled:opacity-20 disabled:cursor-not-allowed p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Totals & Real-time Balance Constraint checking */}
              <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold gap-3">
                <div className="flex space-x-6 text-slate-500 font-extrabold uppercase text-[10px]">
                  <span>Total Debit: <strong className="font-mono text-slate-900 text-xs bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border">Rs. {totalDebit.toLocaleString()}</strong></span>
                  <span>Total Credit: <strong className="font-mono text-slate-900 text-xs bg-red-50 text-red-800 px-1.5 py-0.5 rounded border">Rs. {totalCredit.toLocaleString()}</strong></span>
                </div>

                {/* Constraint status indicator */}
                <div className="flex items-center">
                  {isBalanced ? (
                    <span className="text-xxs font-bold uppercase text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg flex items-center shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0 text-teal-600" />
                      Balanced (Debits = Credits)
                    </span>
                  ) : (
                    <span className="text-xxs font-bold uppercase text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg flex items-center shadow-xs">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 shrink-0 text-red-500 animate-pulse" />
                      Unbalanced Difference: Rs. {diffBalance.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Posting Button */}
            <button
              type="submit"
              disabled={!isBalanced || !canPost}
              className={`w-full py-2.5 rounded-xl text-xxs font-black uppercase tracking-wider text-white shadow-md transition-all duration-300 ${
                isBalanced && canPost
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 shadow-indigo-600/15 cursor-pointer'
                  : 'bg-slate-300 text-slate-400 cursor-not-allowed border'
              }`}
            >
              {canPost ? 'Authorize & Post Balanced Voucher to Database' : 'Unauthorized - Posting Locked'}
            </button>
          </form>
        </div>
      )}

      {/* 3. PROFIT & LOSS STATEMENT & RAPID EXPENSES LOG */}
      {activeSubTab === 'pl_expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn" id="pl-expenses-tab">
          
          {/* Detailed income statement */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                  General Ledger Income Statement (Profit & Loss)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Dynamically calculated based on current accounts ledger records.</p>
              </div>
              <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 border rounded px-1.5">Live Audit</span>
            </div>

            {/* P&L statement sheet */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Revenue category */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-extrabold border">
                  <span className="uppercase text-slate-800 tracking-wider">A. OPERATING REVENUE</span>
                  <span className="font-mono text-slate-900">Rs. {totalRevenuesAmt.toLocaleString()}</span>
                </div>
                <div className="pl-3 space-y-1 text-slate-600">
                  {operatingRevenues.map(acc => (
                    <div key={acc.TLID} className="flex justify-between font-semibold">
                      <span>[{acc.TLID}] {acc.TLName}</span>
                      <span className="font-mono">Rs. {Math.abs(acc.AcBalance).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost of sales */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-extrabold border">
                  <span className="uppercase text-slate-800 tracking-wider">B. LESS COST OF SALES (COGS)</span>
                  <span className="font-mono text-red-700">Rs. {totalCogsAmt.toLocaleString()}</span>
                </div>
                <div className="pl-3 space-y-1 text-slate-600">
                  <div className="flex justify-between font-semibold">
                    <span>[501001] Pharmacy Cost of Goods Sold</span>
                    <span className="font-mono">Rs. {totalCogsAmt.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Gross margin */}
              <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-lg font-black text-slate-900 border border-emerald-200">
                <span className="uppercase tracking-wider">C. GROSS OPERATING PROFIT</span>
                <span className="font-mono text-emerald-800 text-sm">Rs. {grossProfitAmt.toLocaleString()}</span>
              </div>

              {/* Operating expenses */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-extrabold border">
                  <span className="uppercase text-slate-800 tracking-wider">D. LESS OPERATING EXPENSES</span>
                  <span className="font-mono text-red-700">Rs. {totalExpensesAmt.toLocaleString()}</span>
                </div>
                <div className="pl-3 space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {operatingExpenses.length === 0 ? (
                    <p className="text-xxs text-slate-400 italic">No custom operating expense accounts registered.</p>
                  ) : (
                    operatingExpenses.map(acc => (
                      <div key={acc.TLID} className="flex justify-between font-semibold text-slate-600">
                        <span>[{acc.TLID}] {acc.TLName}</span>
                        <span className="font-mono">Rs. {acc.AcBalance.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Net profits */}
              <div className={`p-3 rounded-xl font-black text-slate-900 border flex justify-between items-center ${
                netIncomeAmt >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <span className="uppercase tracking-wider text-[11px]">E. NET INCOME / PROFIT (LOSS)</span>
                </div>
                <span className={`font-mono text-base ${netIncomeAmt >= 0 ? 'text-teal-800' : 'text-red-800'}`}>
                  Rs. {netIncomeAmt.toLocaleString()}
                </span>
              </div>

            </div>
          </div>

          {/* Rapid Operating Expense logger */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-[650px]">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-extrabold text-slate-950 flex items-center">
                  <Coins className="w-4 h-4 text-amber-500 mr-2" />
                  Log Rapid Expense Payment
                </h3>
                <p className="text-xxs text-slate-400 mt-0.5">Disburse operational payments quickly. Posts balanced cash payments automatically.</p>
              </div>

              {expenseSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xxs font-bold rounded-lg border border-emerald-100 mb-4 animate-fadeIn">
                  {expenseSuccess}
                </div>
              )}

              <form onSubmit={handleRecordRapidExpense} className="space-y-4">
                
                <div>
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Debit Expense Category *</label>
                  <select
                    value={expenseTlid}
                    onChange={(e) => setExpenseTlid(parseInt(e.target.value))}
                    className="mt-1 w-full text-xxs font-bold border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
                  >
                    {operatingExpenses.map((acc) => (
                      <option key={acc.TLID} value={acc.TLID}>
                        [{acc.TLID}] - {acc.TLName} (Rs. {acc.AcBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Credit Funding Account (Cash/Bank) *</label>
                  <select
                    value={expenseFundingTlid}
                    onChange={(e) => setExpenseFundingTlid(parseInt(e.target.value))}
                    className="mt-1 w-full text-xxs font-bold border border-slate-200 rounded-lg p-2 bg-white focus:outline-none"
                  >
                    {tlAccounts.filter(acc => Math.floor(acc.TLID / 100000) === 1).map((acc) => (
                      <option key={acc.TLID} value={acc.TLID}>
                        [{acc.TLID}] - {acc.TLName} (Rs. {acc.AcBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Expense Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter payment cash value..."
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="mt-1 w-full text-xs font-mono font-bold border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Description Narrative</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paid internet service bill, electricity..."
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="mt-1 w-full text-xxs font-semibold border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canPost}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xxs uppercase tracking-wider transition shadow"
                >
                  Confirm & Disburse Expense Cash
                </button>
              </form>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-100 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                This transaction logs a balanced <strong>Cash Payment Voucher (CPV)</strong> instantly under general ledger archives, keeping balance sheets completely compliant.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 4. INVENTORY, PURCHASES & SALES INTEGRATION */}
      {activeSubTab === 'commerce' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn" id="commerce-tab">
          
          {/* Inventory Valuation listing */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 flex items-center">
                  <Package className="w-4 h-4 text-orange-500 mr-2" />
                  Small-Level Drug Inventory & Stock Valuation
                </h3>
                <p className="text-xxs text-slate-400 mt-0.5">Asset capitalize inventory values synced with General Ledger Account [103001].</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400">Total Items: {totalItemsCount}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border text-center">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Total Valuation (COGS)</span>
                <span className="text-xs font-mono font-black text-slate-800">Rs. {totalStockValuation.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border text-center">
                <span className="text-[8px] font-bold text-slate-400 block uppercase">Potential Retail Valuation</span>
                <span className="text-xs font-mono font-black text-slate-800">Rs. {totalPotentialRetailVal.toLocaleString()}</span>
              </div>
              <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-100 text-center">
                <span className="text-[8px] font-bold text-red-500 block uppercase">Low Stocks Items (&lt;20)</span>
                <span className="text-xs font-mono font-black text-red-700">{lowStockItems.length} items</span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 uppercase tracking-wider font-extrabold text-[8px]">
                    <th className="py-2">Drug Item Name</th>
                    <th className="py-2 text-center">Current Stock</th>
                    <th className="py-2 text-right">Cost Price</th>
                    <th className="py-2 text-right">Retail Price</th>
                    <th className="py-2 text-right">Capital Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-600">
                  {items.map((itm, idx) => {
                    const capitalVal = itm.CStock * (itm.PurchasePrice || 0);
                    return (
                      <tr key={`${itm.ItemID}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2">
                          <p className="font-bold text-slate-800 text-[10.5px]">{itm.ItemName}</p>
                          <p className="text-[8px] text-slate-400 font-mono">Code: {itm.ItemID}</p>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black font-mono ${
                            itm.CStock < 20 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {itm.CStock}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono text-[9.5px]">Rs. {itm.PurchasePrice || 0}</td>
                        <td className="py-2 text-right font-mono text-[9.5px]">Rs. {itm.Price || 0}</td>
                        <td className="py-2 text-right font-mono font-extrabold text-slate-800 text-[9.5px]">Rs. {capitalVal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commerce journal integrations summary log */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] space-y-4">
            
            {/* Purchase Entries */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b pb-2 mb-2 flex justify-between items-center">
                <span className="text-xxs font-black text-slate-400 uppercase tracking-wider">Purchase (GRN Receipts) Logs</span>
                <span className="font-mono text-[9px] font-black text-indigo-700">Rs. {totalPurchasesAmt.toLocaleString()}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {grns.length === 0 ? (
                  <p className="text-xxs italic text-slate-400 text-center py-6">No supplier stock purchases recorded yet.</p>
                ) : (
                  grns.map(g => (
                    <div key={g.VchNo} className="bg-slate-50 border p-2 rounded-xl text-[9px] font-semibold text-slate-600 relative space-y-1">
                      <div className="flex justify-between items-center text-slate-900">
                        <span className="font-bold text-indigo-600">{g.VchNo}</span>
                        <span className="font-mono">{g.VchDate}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">Supplier Ref: <strong>{g.SID}</strong></p>
                      <p className="text-[9px] italic text-slate-400 truncate">"{g.Remarks}"</p>
                      <div className="flex justify-between text-slate-400 font-bold border-t pt-1 mt-1 text-[8px] uppercase">
                        <span>CAPITALIZED ASSET</span>
                        <span className="text-slate-800 font-mono">JV-GRN posted</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sales Invoices */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b pb-2 mb-2 flex justify-between items-center">
                <span className="text-xxs font-black text-slate-400 uppercase tracking-wider">Retail Sales receipts Logs</span>
                <span className="font-mono text-[9px] font-black text-emerald-700">Rs. {totalSalesNet.toLocaleString()}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {invoices.length === 0 ? (
                  <p className="text-xxs italic text-slate-400 text-center py-6">No pharmacy retail sales recorded yet.</p>
                ) : (
                  invoices.map(inv => (
                    <div key={inv.InvoiceNo} className="bg-slate-50 border p-2 rounded-xl text-[9px] font-semibold text-slate-600 relative space-y-1">
                      <div className="flex justify-between items-center text-slate-900">
                        <span className="font-bold text-emerald-600">{inv.InvoiceNo}</span>
                        <span className="font-mono">{inv.InvoiceDate}</span>
                      </div>
                      <div className="flex justify-between text-[9.5px]">
                        <span>Net Paid: <strong className="text-slate-800 font-mono">Rs. {inv.NetAmount.toLocaleString()}</strong></span>
                        <span className="text-slate-400">Discount: Rs. {inv.Discount}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-bold border-t pt-1 mt-1 text-[8px] uppercase">
                        <span>Cash Inflow Shift {inv.shift || 1}</span>
                        <span className="text-slate-800 font-mono">CRV-PH posted</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DYNAMIC ACCOUNT CREATION MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Add New General Ledger Account</h3>
                <p className="text-xxs text-slate-400 font-medium">Create a new sub-ledger account under Group Code: [ {targetSlidForNewAcc} ]</p>
              </div>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Account Ledger Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Utilities, Generator Fuel, Laundry..."
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-black text-slate-500 uppercase tracking-wider">Initial Account Trial Balance (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newAccInitBal || ''}
                  onChange={(e) => setNewAccInitBal(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full font-mono font-bold border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xxs text-slate-600 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xxs font-bold transition flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Save Ledger Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
