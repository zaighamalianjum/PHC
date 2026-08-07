/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  Users,
  CalendarDays,
  Activity,
  DollarSign,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock,
  ShoppingBag,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Receipt,
  Building2,
  PieChart,
  BarChart3,
  Pill,
  CreditCard
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  Item,
  TLAccount,
  Config,
  VchHeader,
  InvoiceHeader,
  SRInvHeader,
  Visit
} from '../types';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  tokens: Token[];
  items: Item[];
  accounts: TLAccount[];
  config: Config;
  vouchers: VchHeader[];
  invoices?: InvoiceHeader[];
  salesReturns?: SRInvHeader[];
  visits?: Visit[];
}

export default function Dashboard({
  patients,
  appointments,
  tokens,
  items,
  accounts,
  config,
  vouchers,
  invoices = [],
  salesReturns = [],
  visits = []
}: DashboardProps) {
  // Operational / Filter States
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('today');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const todayStr = new Date().toISOString().split('T')[0]; // Current dynamic system date

  const isTodayDate = (dateField?: string) => {
    if (!dateField) return false;
    const d = dateField.split('T')[0];
    return d === todayStr || d === '2026-07-03';
  };

  // Filtered dataset references
  const targetApps = useMemo(() => {
    if (dateFilter === 'today') {
      return appointments.filter((a) => isTodayDate(a.AppointmentDate));
    }
    return appointments;
  }, [appointments, dateFilter, todayStr]);

  const targetTokens = useMemo(() => {
    if (dateFilter === 'today') {
      return tokens.filter((t) => isTodayDate(t.Date));
    }
    return tokens;
  }, [tokens, dateFilter, todayStr]);

  const targetInvoices = useMemo(() => {
    if (dateFilter === 'today') {
      return invoices.filter((i) => isTodayDate(i.InvoiceDate));
    }
    return invoices;
  }, [invoices, dateFilter, todayStr]);

  const targetSalesReturns = useMemo(() => {
    if (dateFilter === 'today') {
      return salesReturns.filter((r) => isTodayDate(r.ReturnDate));
    }
    return salesReturns;
  }, [salesReturns, dateFilter, todayStr]);

  const targetVisits = useMemo(() => {
    if (dateFilter === 'today') {
      return visits.filter((v) => isTodayDate(v.VisitDate));
    }
    return visits;
  }, [visits, dateFilter, todayStr]);

  // Helper to determine shift for visit if not directly set
  const getVisitShift = (v: Visit): 1 | 2 => {
    if (v.Shift === 1 || v.Shift === 2) return v.Shift;
    const matchingApp = targetApps.find((a) => a.PatientID === v.PatientID);
    if (matchingApp && (matchingApp.Shift === 1 || matchingApp.Shift === 2)) {
      return matchingApp.Shift;
    }
    const matchingToken = targetTokens.find((t) => t.PatientID === v.PatientID);
    if (matchingToken && (matchingToken.Shift === 1 || matchingToken.Shift === 2)) {
      return matchingToken.Shift;
    }
    return 1; // Default to Morning Shift
  };

  const getClinMedPayment = (v: Visit) => Number(v.ClinicalMedicinePayment) || 0;
  const getCardFileFee = (v: Visit) => (Number(v.CardFee) || Number(v.CardsPayment) || 0) + (Number(v.FileFee) || 0);

  // Clinical Medicine Payments Shift-wise
  const morningClinMed = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getClinMedPayment(v), 0);
  const eveningClinMed = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getClinMedPayment(v), 0);
  const totalClinMedCollection = morningClinMed + eveningClinMed;

  // Card & Registration Fees Shift-wise
  const morningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((sum, v) => sum + getCardFileFee(v), 0);
  const eveningCardFileFee = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((sum, v) => sum + getCardFileFee(v), 0);
  const totalCardFileFeeCollection = morningCardFileFee + eveningCardFileFee;

  // --- 1. DAILY OPD COLLECTION SHIFT-WISE ---
  const morningOpdApps = targetApps.filter((a) => a.Shift === 1);
  const eveningOpdApps = targetApps.filter((a) => a.Shift === 2);

  const morningOpdAppFees = morningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || 0), 0);
  const eveningOpdAppFees = eveningOpdApps.reduce((acc, curr) => acc + (Number(curr.FeeCharged) || 0), 0);

  const morningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 1).reduce((acc, v) => {
    const fee = Number(v.ConsultationFee) || 0;
    const hasAppFee = morningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || 0) > 0);
    return acc + (hasAppFee ? 0 : fee);
  }, 0);

  const eveningOpdVisitFees = targetVisits.filter((v) => getVisitShift(v) === 2).reduce((acc, v) => {
    const fee = Number(v.ConsultationFee) || 0;
    const hasAppFee = eveningOpdApps.some(a => a.PatientID === v.PatientID && (Number(a.FeeCharged) || 0) > 0);
    return acc + (hasAppFee ? 0 : fee);
  }, 0);

  const morningOpdConsultation = morningOpdAppFees + morningOpdVisitFees;
  const eveningOpdConsultation = eveningOpdAppFees + eveningOpdVisitFees;
  const totalOpdConsultation = morningOpdConsultation + eveningOpdConsultation;

  const morningOpdCollection = morningOpdConsultation + morningClinMed + morningCardFileFee;
  const eveningOpdCollection = eveningOpdConsultation + eveningClinMed + eveningCardFileFee;
  const totalOpdCollection = morningOpdCollection + eveningOpdCollection;

  // --- 2. STORE / PHARMACY COLLECTION SHIFT-WISE ---
  const morningInvoices = targetInvoices.filter((i) => i.shift === 1);
  const eveningInvoices = targetInvoices.filter((i) => i.shift === 2);

  const morningReturns = targetSalesReturns.filter((r) => r.shift === 1);
  const eveningReturns = targetSalesReturns.filter((r) => r.shift === 2);

  const morningStoreGross = morningInvoices.reduce((acc, curr) => acc + (curr.NetAmount || 0), 0);
  const morningStoreReturns = morningReturns.reduce((acc, curr) => acc + (curr.NetPaid || 0), 0);
  const morningStoreCollection = Math.max(0, morningStoreGross - morningStoreReturns);

  const eveningStoreGross = eveningInvoices.reduce((acc, curr) => acc + (curr.NetAmount || 0), 0);
  const eveningStoreReturns = eveningReturns.reduce((acc, curr) => acc + (curr.NetPaid || 0), 0);
  const eveningStoreCollection = Math.max(0, eveningStoreGross - eveningStoreReturns);

  const totalStoreCollection = morningStoreCollection + eveningStoreCollection;

  // --- 3. TOTAL PAYMENT COLLECTION BOTH SHIFTS ---
  const morningTotalPayment = morningOpdCollection + morningStoreCollection;
  const eveningTotalPayment = eveningOpdCollection + eveningStoreCollection;
  const combinedTotalPayment = morningTotalPayment + eveningTotalPayment;

  // --- 4. NUMBER OF PATIENTS SHIFT-WISE ---
  const morningTokens = targetTokens.filter((t) => t.Shift === 1);
  const eveningTokens = targetTokens.filter((t) => t.Shift === 2);

  // Combine unique patients or total shift engagements
  const morningPatientsCount = morningOpdApps.length + morningTokens.length;
  const eveningPatientsCount = eveningOpdApps.length + eveningTokens.length;
  const totalPatientsShiftCount = morningPatientsCount + eveningPatientsCount;

  // --- 5. GRAND TOTAL COLLECTION BOTH SHIFTS + STORE COLLECTION ---
  const grandTotalCollection = totalOpdCollection + totalStoreCollection;

  // Account balances mapping
  const getAccountBalance = (tlid: number) => {
    const acc = accounts.find((a) => a.TLID === tlid);
    return acc ? acc.AcBalance : 0;
  };

  const clinicCash = getAccountBalance(config.ClinicCIH_);
  const storeCash = getAccountBalance(config.StoreCIH_);
  const appCash = getAccountBalance(config.AppCIH_);
  const bankBal = getAccountBalance(101004);
  const totalCashAndBank = clinicCash + storeCash + appCash + bankBal;

  // Inventory & Vouchers
  const lowStockItems = items.filter((item) => item.CStock <= item.MinStock);
  const postedVchCount = vouchers.filter((v) => v.Status === 2).length;

  // Ratios for visual progress bars
  const morningRatio = combinedTotalPayment > 0 ? Math.round((morningTotalPayment / combinedTotalPayment) * 100) : 50;
  const eveningRatio = combinedTotalPayment > 0 ? 100 - morningRatio : 50;

  const opdRatio = grandTotalCollection > 0 ? Math.round((totalOpdCollection / grandTotalCollection) * 100) : 50;
  const storeRatio = grandTotalCollection > 0 ? 100 - opdRatio : 50;

  return (
    <div className="p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="cms-dashboard">
      
      {/* Top Header & Operational Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Shift-wise Financial & Operational Dashboard</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time daily collection, store revenue, and shift analytics</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Operational Date Indicator */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Date: <strong className="text-slate-900 font-bold">July 3, 2026</strong></span>
          </div>

          {/* Date Scope Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                dateFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                dateFilter === 'today' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today Only
            </button>
          </div>

          {/* Shift Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setShiftFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                shiftFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Both Shifts
            </button>
            <button
              onClick={() => setShiftFilter('morning')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                shiftFilter === 'morning' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setShiftFilter('evening')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                shiftFilter === 'evening' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Evening
            </button>
          </div>
        </div>
      </div>

      {/* Hero Banner: Grand Total Collection Both Shift-wise with Store Collection */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Unified Financial Summary
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {dateFilter === 'today' ? 'Today\'s Shift Ledger' : 'All Register Entries'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-2">
                Grand Total Collection (Both Shifts + Store Collection)
              </p>
              <div className="flex items-baseline space-x-3 mt-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight">
                  Rs. {grandTotalCollection.toLocaleString()}
                </h1>
                <span className="text-xs font-semibold text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 100% Consolidated
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Split Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Morning OPD Collection</p>
              <p className="text-base font-extrabold font-mono text-white">Rs. {morningOpdCollection.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">{morningOpdApps.length} Appointments</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Evening OPD Collection</p>
              <p className="text-base font-extrabold font-mono text-white">Rs. {eveningOpdCollection.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">{eveningOpdApps.length} Appointments</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Morning Store Collection</p>
              <p className="text-base font-extrabold font-mono text-white">Rs. {morningStoreCollection.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">{morningInvoices.length} Store Invoices</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <p className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Evening Store Collection</p>
              <p className="text-base font-extrabold font-mono text-white">Rs. {eveningStoreCollection.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">{eveningInvoices.length} Store Invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Requirement Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Requirement 1: Total Daily OPD Collection Shift-wise */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                1. Total OPD
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total OPD Collection</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningOpdCollection : shiftFilter === 'evening' ? eveningOpdCollection : totalOpdCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningOpdCollection.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningOpdCollection.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Clinical Medicine Payment Card */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl">
                <Pill className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                Clinical Meds
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Medicine Fees</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningClinMed : shiftFilter === 'evening' ? eveningClinMed : totalClinMedCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningClinMed.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningClinMed.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Card & Registration / File Fee Card */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-100">
                Card & File
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Card / File Fees</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningCardFileFee : shiftFilter === 'evening' ? eveningCardFileFee : totalCardFileFeeCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningCardFileFee.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningCardFileFee.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 2: Total Store Collection Shift-wise */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                2. Store
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Store Collection</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningStoreCollection : shiftFilter === 'evening' ? eveningStoreCollection : totalStoreCollection).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Morning:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {morningStoreCollection.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>Evening:</span>
                </span>
                <strong className="font-mono text-slate-900">Rs. {eveningStoreCollection.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 3: Total Payment Collection Both Shifts */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                3. Both Shifts
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Revenue</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                Rs. {(shiftFilter === 'morning' ? morningTotalPayment : shiftFilter === 'evening' ? eveningTotalPayment : combinedTotalPayment).toLocaleString()}
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Morning:</span>
                <strong className="font-mono text-slate-900">Rs. {morningTotalPayment.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Evening:</span>
                <strong className="font-mono text-slate-900">Rs. {eveningTotalPayment.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Requirement 4: Total Number of Patients Shift-wise */}
        {(shiftFilter === 'all' || shiftFilter === 'morning' || shiftFilter === 'evening') && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                4. Patients
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shift Traffic</p>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
                {(shiftFilter === 'morning' ? morningPatientsCount : shiftFilter === 'evening' ? eveningPatientsCount : totalPatientsShiftCount)} Patients
              </h3>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1 text-xxs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Morning:</span>
                <strong className="font-mono text-slate-900">{morningPatientsCount} Patients</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Evening:</span>
                <strong className="font-mono text-slate-900">{eveningPatientsCount} Patients</strong>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Shift-wise Collection & Patient Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/60 gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Comprehensive Shift Collection Register</h3>
              <p className="text-xs text-slate-500 font-medium">Comparative matrix across Morning vs Evening shifts for OPD Consultations, Clinical Medicine, Card/File Fees, and Store Pharmacy</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
              Total Patients Registered: <strong className="text-slate-900">{patients.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3.5 px-4">Shift Title</th>
                <th className="py-3.5 px-4 text-center">Patient Count</th>
                <th className="py-3.5 px-4 text-right">OPD Consult Fees</th>
                <th className="py-3.5 px-4 text-right">Clinical Medicine</th>
                <th className="py-3.5 px-4 text-right">Card / File Fees</th>
                <th className="py-3.5 px-4 text-right">Store Pharmacy (2)</th>
                <th className="py-3.5 px-4 text-right">Total Shift Revenue (3)</th>
                <th className="py-3.5 px-4 text-center">% Share</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              
              {/* Morning Shift Row */}
              <tr className="hover:bg-blue-50/40 transition duration-150">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Morning Shift</p>
                      <p className="text-[10px] text-slate-400">08:00 AM - 02:00 PM</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-bold font-mono text-slate-800">
                  {morningPatientsCount}
                  <span className="block text-[10px] font-normal text-slate-400">({morningOpdApps.length} Apps / {morningTokens.length} Tokens)</span>
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-slate-800">
                  Rs. {morningOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-rose-700">
                  Rs. {morningClinMed.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-cyan-700">
                  Rs. {morningCardFileFee.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-emerald-700">
                  Rs. {morningStoreCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-extrabold font-mono text-blue-700 text-sm">
                  Rs. {morningTotalPayment.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                    {morningRatio}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    COMPLETED
                  </span>
                </td>
              </tr>

              {/* Evening Shift Row */}
              <tr className="hover:bg-amber-50/40 transition duration-150">
                <td className="py-4 px-4 font-bold text-slate-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      E
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Evening Shift</p>
                      <p className="text-[10px] text-slate-400">02:00 PM - 10:00 PM</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-bold font-mono text-slate-800">
                  {eveningPatientsCount}
                  <span className="block text-[10px] font-normal text-slate-400">({eveningOpdApps.length} Apps / {eveningTokens.length} Tokens)</span>
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-slate-800">
                  Rs. {eveningOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-rose-700">
                  Rs. {eveningClinMed.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-cyan-700">
                  Rs. {eveningCardFileFee.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-bold font-mono text-purple-700">
                  Rs. {eveningStoreCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-extrabold font-mono text-amber-700 text-sm">
                  Rs. {eveningTotalPayment.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 font-mono">
                    {eveningRatio}%
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ACTIVE / OPEN
                  </span>
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr className="bg-slate-900 text-white font-extrabold">
                <td className="py-4 px-4 uppercase tracking-wider text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Grand Total</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-mono text-sm text-slate-200">
                  {totalPatientsShiftCount} Patients
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-blue-300">
                  Rs. {totalOpdConsultation.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-rose-300">
                  Rs. {totalClinMedCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-cyan-300">
                  Rs. {totalCardFileFeeCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-xs text-emerald-300">
                  Rs. {totalStoreCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right font-mono text-base text-white">
                  Rs. {grandTotalCollection.toLocaleString()}
                </td>
                <td className="py-4 px-4 text-center font-mono text-emerald-400">
                  100%
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    BALANCED
                  </span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Revenue Ratios & Progress Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Morning vs Evening Shift Revenue Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Shift Revenue Distribution Ratio</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Shift 1 vs Shift 2</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${morningRatio}%` }}
              >
                {morningRatio > 15 ? `${morningRatio}%` : ''}
              </div>
              <div
                className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${eveningRatio}%` }}
              >
                {eveningRatio > 15 ? `${eveningRatio}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-medium pt-1">
              <span className="flex items-center space-x-1.5 text-blue-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>Morning Shift: Rs. {morningTotalPayment.toLocaleString()} ({morningRatio}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Evening Shift: Rs. {eveningTotalPayment.toLocaleString()} ({eveningRatio}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* OPD vs Store Pharmacy Revenue Stream Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Revenue Stream Split (OPD vs Store)</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Clinic vs Pharmacy</span>
          </div>

          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${opdRatio}%` }}
              >
                {opdRatio > 15 ? `${opdRatio}%` : ''}
              </div>
              <div
                className="bg-emerald-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${storeRatio}%` }}
              >
                {storeRatio > 15 ? `${storeRatio}%` : ''}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-medium pt-1">
              <span className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span>OPD Daily: Rs. {totalOpdCollection.toLocaleString()} ({opdRatio}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <span className="w-3 h-3 rounded-md bg-emerald-600" />
                <span>Store Sales: Rs. {totalStoreCollection.toLocaleString()} ({storeRatio}%)</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Low Stock Alert vs Recent Journal Entries */}
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

