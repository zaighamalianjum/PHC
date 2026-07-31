/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Users,
  CalendarDays,
  Activity,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  Item,
  TLAccount,
  Config,
  VchHeader
} from '../types';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  tokens: Token[];
  items: Item[];
  accounts: TLAccount[];
  config: Config;
  vouchers: VchHeader[];
}

export default function Dashboard({
  patients,
  appointments,
  tokens,
  items,
  accounts,
  config,
  vouchers
}: DashboardProps) {

  // Metrics calculations
  const totalPatients = patients.length;
  
  // Today's Date representation in initialData
  const todayStr = '2026-07-03';
  
  const todayApps = appointments.filter((a) => a.AppointmentDate === todayStr);
  const pendingAppsCount = todayApps.filter((a) => a.Status === 1).length;
  const completedAppsCount = todayApps.filter((a) => a.Status === 2 || a.Status === 4).length;
  const morningApps = todayApps.filter((a) => a.Shift === 1).length;
  const eveningApps = todayApps.filter((a) => a.Shift === 2).length;

  // Token stats
  const activeTokens = tokens.filter((t) => t.Status === 1); // Waiting
  const servedTokens = tokens.filter((t) => t.Status === 2); // Completed
  const canceledTokens = tokens.filter((t) => t.Status === 3);

  // Mapped accounts balances
  const getAccountBalance = (tlid: number) => {
    const acc = accounts.find((a) => a.TLID === tlid);
    return acc ? acc.AcBalance : 0;
  };

  const clinicCash = getAccountBalance(config.ClinicCIH_);
  const storeCash = getAccountBalance(config.StoreCIH_);
  const appCash = getAccountBalance(config.AppCIH_);
  const bankBal = getAccountBalance(101004); // Bank Al-Falah from list
  const totalCashAndBank = clinicCash + storeCash + appCash + bankBal;

  // Inventory alert stock checking
  const lowStockItems = items.filter((item) => item.CStock <= item.MinStock);

  // Accounting entries
  const postedVchCount = vouchers.filter((v) => v.Status === 2).length;

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="cms-dashboard">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Clinic Operations Control</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Real-time indicators for Clinic, Pharmacy, and Accounts of PHC CMS</p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-semibold text-slate-600 w-fit">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Operational Date: <strong className="text-slate-900 font-bold">July 3, 2026</strong></span>
        </div>
      </div>

      {/* Main stats boxes in Bento Grid style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Box 1: Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-200">
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Demographics</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalPatients} Registered</h3>
            <p className="text-xxs text-slate-400 mt-0.5 font-medium">Total active intake profiles</p>
          </div>
        </div>

        {/* Box 2: OPD Desk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-200">
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">OPD Desk</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{todayApps.length} Today</h3>
            <p className="text-xxs mt-0.5 font-semibold flex items-center space-x-2">
              <span className="text-blue-600">{morningApps} M</span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-600">{eveningApps} E</span>
            </p>
          </div>
        </div>

        {/* Box 3: Token Queue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-200">
          <div className="p-3 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Token Queue</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeTokens.length} Waiting</h3>
            <p className="text-xxs mt-0.5 font-semibold flex items-center space-x-2">
              <span className="text-purple-600">{servedTokens.length} Served</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">{canceledTokens.length} Canceled</span>
            </p>
          </div>
        </div>

        {/* Box 4: Inventory Warnings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4 hover:shadow-md transition duration-200">
          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Inventory Warnings</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{lowStockItems.length} Low Stock</h3>
            <p className="text-xxs text-rose-500 font-semibold mt-0.5">Under safety threshold</p>
          </div>
        </div>
      </div>

      {/* Accounting Cash Box Section - Multi-Level Balances Mapping */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" id="dashboard-cashbox">
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 gap-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600 shrink-0" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">General Ledger Account Balances (Mapped Cash Desks)</h4>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-150 px-3 py-1 rounded-full flex items-center space-x-1 w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Operational Liquid Assets: Rs. {totalCashAndBank.toLocaleString()}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/30 transition duration-150">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinic Cash Desk</span>
              <p className="text-xxs text-slate-400 font-mono mt-0.5">Account ID: {config.ClinicCIH_}</p>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 font-mono">Rs. {clinicCash.toLocaleString()}</span>
              <p className="text-xxs text-slate-400 mt-0.5">ClinicCIH_ Mapping</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/30 transition duration-150">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pharmacy Cash Desk</span>
              <p className="text-xxs text-slate-400 font-mono mt-0.5">Account ID: {config.StoreCIH_}</p>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 font-mono">Rs. {storeCash.toLocaleString()}</span>
              <p className="text-xxs text-slate-400 mt-0.5">StoreCIH_ Mapping</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/30 transition duration-150">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OPD Ticket Desk</span>
              <p className="text-xxs text-slate-400 font-mono mt-0.5">Account ID: {config.AppCIH_}</p>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 font-mono">Rs. {appCash.toLocaleString()}</span>
              <p className="text-xxs text-slate-400 mt-0.5">AppCIH_ Mapping</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/30 transition duration-150">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Bank Current A/C</span>
              <p className="text-xxs text-slate-400 font-mono mt-0.5">Account ID: 101004</p>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-800 font-mono">Rs. {bankBal.toLocaleString()}</span>
              <p className="text-xxs text-slate-400 mt-0.5">Clearing settlement account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert vs Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inventory Safety Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col" id="dashboard-inventory-alerts">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Critical Pharmacy Re-order Alerts</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-200">
              {lowStockItems.length} Warnings
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto flex-1">
            {lowStockItems.length === 0 ? (
              <p className="p-5 text-xs text-slate-400 font-medium text-center">All pharmaceutical products have satisfactory inventory balances.</p>
            ) : (
              lowStockItems.map((item, idx) => (
                <div key={`${item.ItemID}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.ItemName}</p>
                    <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {item.ItemID} | Unit: {item.Unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      {item.CStock} {item.Unit}s left
                    </span>
                    <p className="text-xxs text-slate-400 font-semibold mt-1">Min. Threshold: {item.MinStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Voucher Status Ledger Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col" id="dashboard-voucher-alerts">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Double-Entry Financial Audits</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              {postedVchCount} General Ledger Postings
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto flex-1">
            {vouchers.length === 0 ? (
              <p className="p-5 text-xs text-slate-400 font-medium text-center">No accounting vouchers registered in system journals.</p>
            ) : (
              vouchers.map((v) => (
                <div key={v.VchNo} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                        v.VchType === 'JV' ? 'bg-indigo-50 text-indigo-600 border border-indigo-150' :
                        v.VchType === 'CRV' ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' :
                        'bg-rose-50 text-rose-600 border border-rose-150'
                      }`}>
                        {v.VchType}
                      </span>
                      <p className="text-xs font-bold text-slate-800 font-mono truncate">{v.VchNo}</p>
                    </div>
                    <p className="text-xxs text-slate-500 mt-1 truncate font-medium">{v.Remarks || 'Operational journal posting'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${
                      v.Status === 2 ? 'bg-blue-100 text-blue-800' : 'bg-slate-150 text-slate-600'
                    }`}>
                      {v.Status === 2 ? 'GL POSTED' : 'DRAFT'}
                    </span>
                    <p className="text-xxs text-slate-400 mt-1 font-mono">{v.VchDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
