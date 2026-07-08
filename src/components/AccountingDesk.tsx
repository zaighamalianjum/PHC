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
  ChevronRight
} from 'lucide-react';
import {
  FLAccount,
  SLAccount,
  TLAccount,
  VchHeader,
  VchDetail,
  ACLedger,
  UserRight
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
  userRights
}: AccountingDeskProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'coa' | 'voucher'>('coa');

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'accounts');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Active expanded levels in Tree
  const [expandedFl, setExpandedFl] = useState<number[]>(flAccounts.map((f) => f.FLID));
  const [expandedSl, setExpandedSl] = useState<number[]>(slAccounts.map((s) => s.SLID));
  const [selectedTlid, setSelectedTlid] = useState<number | null>(null);

  // Voucher entry form
  const [vchType, setVchType] = useState<'JV' | 'CRV' | 'CPV'>('JV');
  const [vchRemarks, setVchRemarks] = useState('');
  const [vchDate, setVchDate] = useState('2026-07-03');

  // Multi-row voucher details grid
  const [voucherRows, setVoucherRows] = useState<{ TLID: number; Debit: number; Credit: number; Description: string }[]>([
    { TLID: 101001, Debit: 0, Credit: 0, Description: '' },
    { TLID: 401001, Debit: 0, Credit: 0, Description: '' }
  ]);

  const [vchSuccess, setVchSuccess] = useState('');

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
      { TLID: 401001, Debit: 0, Credit: 0, Description: '' }
    ]);

    setTimeout(() => setVchSuccess(''), 6000);
  };

  // Details helper for selected account ledger logs
  const selectedAccountDetails = tlAccounts.find((t) => t.TLID === selectedTlid);
  const accountLedgerPostings = acLedger.filter((l) => l.TLID === selectedTlid);

  return (
    <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="accounts-desk">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <BookOpen className="w-5.5 h-5.5 text-blue-600 mr-2" />
            Double-Entry Accounting Ledger (3-Tier COA)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Control hierarchical Chart of Accounts, post balanced vouchers, and track ledger balances</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('coa')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'coa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Chart of Accounts (COA)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('voucher')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'voucher' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Voucher Journal Entry</span>
          </button>
        </div>
      </div>

      {/* CHART OF ACCOUNTS TREE TAB */}
      {activeSubTab === 'coa' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fadeIn" id="coa-tab">
          
          {/* Interactive Tree View */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-950 flex items-center">
                <FolderTree className="w-4 h-4 text-emerald-500 mr-2" />
                3-Tier Chart of Accounts Tree Hierarchy
              </h3>
              <span className="text-xxs font-mono text-slate-400 font-bold">FLID → SLID → TLID</span>
            </div>

            {/* Tree Workspace */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs select-none">
              
              {/* Level 1 (FirstLevel FLID) */}
              {flAccounts.map((fl) => {
                const flExpanded = expandedFl.includes(fl.FLID);
                const childSls = slAccounts.filter((s) => s.FLID === fl.FLID);

                return (
                  <div key={fl.FLID} className="space-y-1.5">
                    <div
                      onClick={() => toggleFl(fl.FLID)}
                      className="flex items-center space-x-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer font-bold text-slate-900 tracking-tight transition"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${flExpanded ? 'rotate-90' : ''}`} />
                      <span>{fl.FLName}</span>
                      <span className="text-xxs font-mono text-slate-400 font-bold bg-white px-1 py-0.2 rounded border">Level 1 (Code: {fl.FLID})</span>
                    </div>

                    {/* Level 2 (SecondLevel SLID) */}
                    {flExpanded && (
                      <div className="pl-6 space-y-1 animate-fadeIn">
                        {childSls.map((sl) => {
                          const slExpanded = expandedSl.includes(sl.SLID);
                          const childTls = tlAccounts.filter((t) => t.SLID === sl.SLID);

                          return (
                            <div key={sl.SLID} className="space-y-1">
                              <div
                                onClick={() => toggleSl(sl.SLID)}
                                className="flex items-center space-x-2 py-1 px-2.5 hover:bg-slate-50 border border-slate-100 rounded-md cursor-pointer font-semibold text-slate-700 transition"
                              >
                                <ChevronRight className={`w-3 h-3 shrink-0 text-slate-400 transition-transform ${slExpanded ? 'rotate-90' : ''}`} />
                                <span>{sl.SLName}</span>
                                <span className="text-xxs font-mono text-slate-400 font-bold">Level 2 (Code: {sl.SLID})</span>
                              </div>

                              {/* Level 3 (ThirdLevel TLID) */}
                              {slExpanded && (
                                <div className="pl-5 space-y-0.5 animate-fadeIn">
                                  {childTls.map((tl) => {
                                    const active = selectedTlid === tl.TLID;
                                    return (
                                      <div
                                        key={tl.TLID}
                                        onClick={() => setSelectedTlid(tl.TLID)}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                          active
                                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                            : 'hover:bg-slate-50/50 text-slate-600 font-medium'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                          <span>{tl.TLName}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-mono font-bold text-slate-800">Rs. {tl.AcBalance.toLocaleString()}</span>
                                          <p className="text-xxs font-mono text-slate-400 font-bold mt-0.5">Code: {tl.TLID}</p>
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

          {/* Account Ledger Details Sidebar */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px]" id="coa-ledger-sidebar">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Account Statement Audit</h3>
            
            {selectedAccountDetails ? (
              <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {/* Account detail box */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 border border-slate-800 relative overflow-hidden">
                    <span className="text-xxs font-mono font-bold text-slate-400 uppercase tracking-wider">Third level Account Statement</span>
                    <h4 className="font-bold text-sm tracking-tight text-emerald-400 mt-1">{selectedAccountDetails.TLName}</h4>
                    <p className="text-xxs text-slate-300 font-semibold font-mono">Account ID Code: {selectedAccountDetails.TLID}</p>
                    
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-xxs text-slate-400">Ledger Statement Balance:</span>
                      <strong className="text-lg font-bold font-mono">Rs. {selectedAccountDetails.AcBalance.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Transaction posting history list */}
                  <div className="space-y-2.5">
                    <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Double-Entry Journal Postings</span>
                    
                    {accountLedgerPostings.length === 0 ? (
                      <p className="text-xxs text-slate-400 italic text-center py-12">No historical ledger records found for this account code.</p>
                    ) : (
                      <div className="space-y-2">
                        {accountLedgerPostings.map((l) => (
                          <div key={l.ACLedgerID} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xxs font-semibold text-slate-600 space-y-1.5 relative">
                            <div className="flex justify-between items-start font-bold text-slate-900">
                              <span className="font-mono">{l.VchNo}</span>
                              <span className="text-slate-400 font-mono">{l.TxDate}</span>
                            </div>
                            <p className="text-slate-500 text-xxs font-medium truncate italic">"{l.Remarks || 'Operational double-entry'}"</p>
                            
                            <div className="pt-1.5 border-t border-slate-150 flex justify-between">
                              <span>Debit: <strong className="font-mono text-emerald-600">Rs. {l.Debit.toLocaleString()}</strong></span>
                              <span>Credit: <strong className="font-mono text-red-600">Rs. {l.Credit.toLocaleString()}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xxs text-slate-400 font-semibold italic text-center pt-2 border-t border-slate-100">
                  Balances automatically synchronize upon checkout or voucher postings.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-semibold">
                <TreeDeciduous className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-xs leading-relaxed">Select any Level-3 account in the tree hierarchy to view its live ledger balances and audit statements.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* DOUBLE ENTRY VOUCHER JOURNAL TAB */}
      {activeSubTab === 'voucher' && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5" id="voucher-tab">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-3">
            <h3 className="text-sm font-bold text-slate-950 flex items-center">
              <Scale className="w-4.5 h-4.5 text-indigo-500 mr-2 shrink-0 animate-pulse" />
              Double-Entry Voucher Worksheet
            </h3>
            <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">Accounting Control</span>
          </div>

          {vchSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
              {vchSuccess}
            </div>
          )}

          <form onSubmit={handlePostVoucher} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Voucher Journal Type *</label>
                <select
                  required
                  value={vchType}
                  onChange={(e) => setVchType(e.target.value as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="JV">JV = Journal Voucher</option>
                  <option value="CRV">CRV = Cash Receipt Voucher</option>
                  <option value="CPV">CPV = Cash Payment Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Posting Date</label>
                <input
                  type="date"
                  required
                  value={vchDate}
                  onChange={(e) => setVchDate(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Journal Narrative / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed consulting payouts, adjusted cash boxes"
                  value={vchRemarks}
                  onChange={(e) => setVchRemarks(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Voucher Row details editing grid */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xxs font-bold text-slate-400 uppercase">Debits & Credits Distribution Grid</span>
                <button
                  type="button"
                  onClick={handleAddVchRow}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xxs font-bold rounded flex items-center transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Entry Row
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {voucherRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    
                    {/* Account select dropdown */}
                    <div className="md:col-span-4">
                      <select
                        value={row.TLID}
                        onChange={(e) => handleUpdateVchRow(idx, 'TLID', parseInt(e.target.value))}
                        className="w-full text-xs border border-slate-200 bg-white rounded p-1.5 focus:outline-none"
                      >
                        {tlAccounts.map((tl) => (
                          <option key={tl.TLID} value={tl.TLID}>
                            [{tl.TLID}] - {tl.TLName} (Rs. {tl.AcBalance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Debit */}
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Debit"
                        value={row.Debit || ''}
                        onChange={(e) => handleUpdateVchRow(idx, 'Debit', parseInt(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold border border-slate-200 bg-white rounded p-1.5 focus:outline-none"
                      />
                    </div>

                    {/* Credit */}
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Credit"
                        value={row.Credit || ''}
                        onChange={(e) => handleUpdateVchRow(idx, 'Credit', parseInt(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold border border-slate-200 bg-white rounded p-1.5 focus:outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="Line description..."
                        value={row.Description}
                        onChange={(e) => handleUpdateVchRow(idx, 'Description', e.target.value)}
                        className="w-full text-xs border border-slate-200 bg-white rounded p-1.5 focus:outline-none"
                      />
                    </div>

                    {/* Delete row */}
                    <div className="md:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveVchRow(idx)}
                        disabled={voucherRows.length <= 2}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Totals & Real-time Balance Constraint checking */}
              <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-bold gap-3">
                <div className="flex space-x-6 text-slate-600 font-semibold">
                  <span>Total Debit: <strong className="font-mono text-slate-900 text-sm">Rs. {totalDebit.toLocaleString()}</strong></span>
                  <span>Total Credit: <strong className="font-mono text-slate-900 text-sm">Rs. {totalCredit.toLocaleString()}</strong></span>
                </div>

                {/* Constraint warnings */}
                <div className="flex items-center">
                  {isBalanced ? (
                    <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />
                      Ledger Balanced (Debits = Credits)
                    </span>
                  ) : (
                    <span className="text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1.5 shrink-0 text-red-500 animate-bounce" />
                      Unbalanced by: Rs. {diffBalance.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Posting Button */}
            <button
              type="submit"
              disabled={!isBalanced || !canPost}
              className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition ${
                isBalanced && canPost
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {canPost ? 'Authorize & Post Balanced Voucher to General Ledger' : 'Unauthorized - Posting Locked'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
