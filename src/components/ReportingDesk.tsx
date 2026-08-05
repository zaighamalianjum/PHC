/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Printer, 
  TrendingDown, 
  BookOpen, 
  FileText, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Award,
  Grid,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  Coins,
  Building2,
  RefreshCw,
  X,
  LineChart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sliders,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { InvoiceHeader, InvoiceDetail, ACLedger, TLAccount, Patient, SRInvHeader, Appointment, Visit, VisitMedicine, Item, User, UserRight, ClinicSettings } from '../types';

interface ReportingDeskProps {
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  salesReturns: SRInvHeader[];
  acLedger: ACLedger[];
  tlAccounts: TLAccount[];
  patients: Patient[];
  appointments?: Appointment[];
  visits?: Visit[];
  visitMedicines?: VisitMedicine[];
  items?: Item[];
  currentUser?: User;
  userRights?: UserRight[];
  clinicSettings?: ClinicSettings;
  onUnauthorized?: (msg?: string) => void;
}

export default function ReportingDesk({
  invoices,
  invoiceDetails,
  salesReturns,
  acLedger,
  tlAccounts,
  patients,
  appointments = [],
  visits = [],
  visitMedicines = [],
  items = [],
  currentUser,
  userRights,
  clinicSettings: propsClinicSettings,
  onUnauthorized
}: ReportingDeskProps) {
  const [clinicSettings] = useState<ClinicSettings | null>(() => {
    if (propsClinicSettings) return propsClinicSettings;
    try {
      const saved = localStorage.getItem('phc_clinic_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'pl' | 'gl_audit' | 'grid_view' | 'vendor_statement' | 'cash_flow' | 'daily_collection'>('sales');

  // Daily Collection Summary states
  const [dailyCollectionPrintModalOpen, setDailyCollectionPrintModalOpen] = useState<boolean>(false);
  const [dailyShiftFilter, setDailyShiftFilter] = useState<'all' | '1' | '2'>('all');
  const [dailyServiceFilter, setDailyServiceFilter] = useState<'all' | 'pharmacy' | 'opd' | 'clinical'>('all');

  // Vendor Account Statement & Cash Flow states
  const [erpVendors, setErpVendors] = useState<any[]>([]);
  const [erpGrns, setErpGrns] = useState<any[]>([]);
  const [erpTransactions, setErpTransactions] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [vendorLoading, setVendorLoading] = useState<boolean>(false);
  const [vendorPrintModalOpen, setVendorPrintModalOpen] = useState<boolean>(false);
  const [expandedGrnId, setExpandedGrnId] = useState<string | null>(null);
  const [grnFilter, setGrnFilter] = useState<'all' | 'outstanding' | 'settled'>('all');
  const [vendorDateFilter, setVendorDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState<boolean>(false);
  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Bank',
    refNo: `PV-${Date.now().toString().slice(-4)}`,
    description: '',
    category: 'Supplier Sales Invoice Payment'
  });
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    taxId: '',
    balance: '0'
  });

  // Cash Flow Forecasting states
  const [forecastHorizonDays, setForecastHorizonDays] = useState<number>(30);
  const [customPharmInflow, setCustomPharmInflow] = useState<string>('');
  const [customClinicInflow, setCustomClinicInflow] = useState<string>('');
  const [defaultGrnTerms, setDefaultGrnTerms] = useState<number>(30);
  const [openingCashInput, setOpeningCashInput] = useState<string>('');
  const [cashFlowPrintModalOpen, setCashFlowPrintModalOpen] = useState<boolean>(false);

  const handleTriggerPrint = () => {
    if (currentUser?.Role !== 'Administrator' && (currentUser?.Permissions?.canPrintFinancialReports === false || (userRights && userRights.find(r => r.MenuID === 'reports')?.PrintRec === false))) {
      if (onUnauthorized) {
        onUnauthorized("You are not authorized to access report printing.");
      } else {
        alert("You are not authorized to access.");
      }
      return;
    }
    window.print();
  };

  // Filter duration state
  const [datePreset, setDatePreset] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // GL search state
  const [glSearchQuery, setGlSearchQuery] = useState('');

  // Grid-View states
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'store_sale' | 'appointment' | 'clinical_medicine' | 'file_payment'>('all');
  const [gridSearchQuery, setGridSearchQuery] = useState('');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [statementPrintModalOpen, setStatementPrintModalOpen] = useState(false);
  const [invoicesPrintModalOpen, setInvoicesPrintModalOpen] = useState(false);
  const [gridPrintModalOpen, setGridPrintModalOpen] = useState(false);
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<any | null>(null);

  // Daily Collection Report custom period popup states
  const [dailyCollectionPrintOpen, setDailyCollectionPrintOpen] = useState(false);
  const [dailyCollectionStartDate, setDailyCollectionStartDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dailyCollectionEndDate, setDailyCollectionEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dailyCollectionReportData, setDailyCollectionReportData] = useState<any | null>(null);
  const [dailyCollectionReportFormat, setDailyCollectionReportFormat] = useState<'pdf' | 'grid'>('pdf');

  const handleOpenDailyCollectionModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDailyCollectionStartDate(todayStr);
    setDailyCollectionEndDate(todayStr);
    setDailyCollectionPrintOpen(true);
  };

  // Helper: Format date into standard DD/MMM/YY format (e.g. 27/Jun/26)
  const formatReportDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0].substring(2); // e.g. "26"
    const day = parts[2]; // e.g. "27"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const month = months[monthIdx] || parts[1];
    return `${day}/${month}/${year}`;
  };

  // Helper to calculate daily collection report categories grouped by date
  const generateDailyCollectionReport = (start: string, end: string) => {
    const datesSet = new Set<string>();

    const checkDateInRange = (dateStr: string) => {
      if (!dateStr) return false;
      return dateStr >= start && dateStr <= end;
    };

    appointments.forEach(app => {
      if (checkDateInRange(app.AppointmentDate)) {
        datesSet.add(app.AppointmentDate);
      }
    });

    visits.forEach(vis => {
      if (checkDateInRange(vis.VisitDate)) {
        datesSet.add(vis.VisitDate);
      }
    });

    invoices.forEach(inv => {
      if (checkDateInRange(inv.InvoiceDate)) {
        datesSet.add(inv.InvoiceDate);
      }
    });

    // Sort dates in ascending order
    const sortedDates = Array.from(datesSet).sort();

    // Helper to get visit shift (1 = Morning, 2 = Evening)
    const getVisShift = (vis: Visit) => {
      const matchedApp = appointments?.find(
        (a) => a.PatientID === vis.PatientID && a.AppointmentDate === vis.VisitDate
      );
      if (matchedApp) return matchedApp.Shift || 1;
      return 1; // Default to Morning if not specified
    };

    // Helper to safely extract Clinical Medicine, File, and Card fees from Visit properties or VisitRemarks
    const getVisFees = (v: Visit) => {
      let clin = Number(v.ClinicalMedicinePayment) || 0;
      let file = Number(v.FileFee) || Number(v.ConsultationFee) || 0;
      let card = Number(v.CardFee) || Number(v.CardsPayment) || 0;
      if (v.VisitRemarks) {
        if (!clin) { const cPkr = v.VisitRemarks.match(/Clinical Meds PKR\s*(\d+)/); if (cPkr) clin = Number(cPkr[1]); }
        if (!file) { const fPkr = v.VisitRemarks.match(/File PKR\s*(\d+)/); if (fPkr) file = Number(fPkr[1]); }
        if (!card) { const kPkr = v.VisitRemarks.match(/Card PKR\s*(\d+)/); if (kPkr) card = Number(kPkr[1]); }
      }
      return { clin, file, card };
    };

    // Calculate collections per date (Clinical Medicine, File, Card, Store Payment, Appointment/OPD Fee)
    const reportRows = sortedDates.map(date => {
      const appsForDate = appointments.filter(app => app.AppointmentDate === date && app.Status !== 3);
      const visitsForDate = visits.filter(vis => vis.VisitDate === date);
      const invoicesForDate = (invoices || []).filter(inv => inv.InvoiceDate === date && (inv.Status as number) !== 3);

      // --- MORNING ---
      const mApp = appsForDate.filter(a => a.Shift === 1).reduce((sum, a) => sum + (a.FeeCharged || 0), 0);
      const mCmed = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).clin, 0);
      const mCards = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).card, 0);
      const mFile = visitsForDate.filter(v => getVisShift(v) === 1).reduce((sum, v) => sum + getVisFees(v).file, 0);
      const mStore = invoicesForDate.filter(inv => (inv.shift || (inv as any).Shift || 1) === 1).reduce((sum, inv) => sum + (inv.NetAmount || 0), 0);
      const mTotal = mApp + mCmed + mCards + mFile + mStore;

      // --- EVENING ---
      const eApp = appsForDate.filter(a => a.Shift === 2).reduce((sum, a) => sum + (a.FeeCharged || 0), 0);
      const eCmed = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).clin, 0);
      const eCards = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).card, 0);
      const eFile = visitsForDate.filter(v => getVisShift(v) === 2).reduce((sum, v) => sum + getVisFees(v).file, 0);
      const eStore = invoicesForDate.filter(inv => (inv.shift || (inv as any).Shift || 1) === 2).reduce((sum, inv) => sum + (inv.NetAmount || 0), 0);
      const eTotal = eApp + eCmed + eCards + eFile + eStore;

      const dayTotal = mTotal + eTotal;

      return {
        date,
        morning: {
          app: mApp,
          cmed: mCmed,
          cards: mCards,
          file: mFile,
          store: mStore,
          total: mTotal
        },
        evening: {
          app: eApp,
          cmed: eCmed,
          cards: eCards,
          file: eFile,
          store: eStore,
          total: eTotal
        },
        dayTotal
      };
    });

    const morningSummaryTotals = {
      app: reportRows.reduce((sum, r) => sum + r.morning.app, 0),
      cmed: reportRows.reduce((sum, r) => sum + r.morning.cmed, 0),
      cards: reportRows.reduce((sum, r) => sum + r.morning.cards, 0),
      file: reportRows.reduce((sum, r) => sum + r.morning.file, 0),
      store: reportRows.reduce((sum, r) => sum + r.morning.store, 0),
      total: reportRows.reduce((sum, r) => sum + r.morning.total, 0)
    };

    const eveningSummaryTotals = {
      app: reportRows.reduce((sum, r) => sum + r.evening.app, 0),
      cmed: reportRows.reduce((sum, r) => sum + r.evening.cmed, 0),
      cards: reportRows.reduce((sum, r) => sum + r.evening.cards, 0),
      file: reportRows.reduce((sum, r) => sum + r.evening.file, 0),
      store: reportRows.reduce((sum, r) => sum + r.evening.store, 0),
      total: reportRows.reduce((sum, r) => sum + r.evening.total, 0)
    };

    const grandSummaryTotals = {
      app: morningSummaryTotals.app + eveningSummaryTotals.app,
      cmed: morningSummaryTotals.cmed + eveningSummaryTotals.cmed,
      cards: morningSummaryTotals.cards + eveningSummaryTotals.cards,
      file: morningSummaryTotals.file + eveningSummaryTotals.file,
      store: morningSummaryTotals.store + eveningSummaryTotals.store,
      total: morningSummaryTotals.total + eveningSummaryTotals.total
    };

    // Build PDF Report Format Rows matching requested Payment Collection Report structure
    const pdfRows: any[] = [];
    let pdfGrandTotal = 0;

    sortedDates.forEach((date) => {
      const dateParts = date.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(dateParts[1], 10) - 1;
      const monthStr = months[monthIdx] || dateParts[1];
      const formattedDate = dateParts.length === 3
        ? `${dateParts[2]}-${monthStr}-${dateParts[0].substring(2)}`
        : date;

      const appsForDate = appointments.filter(app => app.AppointmentDate === date && app.Status !== 3);
      const visitsForDate = visits.filter(vis => vis.VisitDate === date);
      const invoicesForDate = (invoices || []).filter(inv => inv.InvoiceDate === date && (inv.Status as number) !== 3);

      // Shifts in order: Evening (2) then Morning (1) matching report layout
      const shiftOrder = [
        { shiftNum: 2, label: 'Evening' },
        { shiftNum: 1, label: 'Morning' }
      ];

      const shiftBlocks: any[] = [];
      let dayTotalAmount = 0;

      shiftOrder.forEach(({ shiftNum, label }) => {
        const apps = appsForDate.filter(a => a.Shift === shiftNum);
        const vis = visitsForDate.filter(v => getVisShift(v) === shiftNum);
        const invs = invoicesForDate.filter(i => (i.shift || (i as any).Shift || 1) === shiftNum);

        const visitedCount = Math.max(vis.length, apps.length);

        const items: { count: number; description: string; amount: number }[] = [];

        // 1. Cards Payment
        const cardsVisits = vis.filter(v => getVisFees(v).card > 0);
        if (cardsVisits.length > 0) {
          const cardsAmt = cardsVisits.reduce((sum, v) => sum + getVisFees(v).card, 0);
          items.push({ count: cardsVisits.length, description: 'Cards', amount: cardsAmt });
        }

        // 2. Clinical Medicine Charges
        const cmedVisits = vis.filter(v => getVisFees(v).clin > 0);
        if (cmedVisits.length > 0) {
          const cmedAmt = cmedVisits.reduce((sum, v) => sum + getVisFees(v).clin, 0);
          items.push({ count: cmedVisits.length, description: 'Clinical Medicine Charges', amount: cmedAmt });
        }

        // 3. Registration File
        const fileVisits = vis.filter(v => getVisFees(v).file > 0);
        if (fileVisits.length > 0) {
          const fileAmt = fileVisits.reduce((sum, v) => sum + getVisFees(v).file, 0);
          items.push({ count: fileVisits.length, description: 'Registration File', amount: fileAmt });
        }

        // 4. Store Collection
        if (invs.length > 0) {
          const storeAmt = invs.reduce((sum, i) => sum + (i.NetAmount || 0), 0);
          if (storeAmt > 0) {
            items.push({ count: invs.length, description: 'Store Collection', amount: storeAmt });
          }
        }

        // 5. Appointment Charges
        const appCharges = apps.filter(a => Number(a.FeeCharged || 0) > 0);
        if (appCharges.length > 0) {
          const appAmt = appCharges.reduce((sum, a) => sum + Number(a.FeeCharged || 0), 0);
          items.push({ count: appCharges.length, description: 'Appointment Charges', amount: appAmt });
        }

        // 6. Free of Charge
        const freeVisits = vis.filter(v => {
          const fees = getVisFees(v);
          return fees.clin === 0 && fees.card === 0 && fees.file === 0;
        });
        if (freeVisits.length > 0 && items.length === 0) {
          items.push({ count: freeVisits.length, description: 'Free of Charge', amount: 0 });
        }

        // Fallback: If visited patients exist but no item matched, add Free of Charge
        if (items.length === 0 && visitedCount > 0) {
          items.push({ count: visitedCount, description: 'Free of Charge', amount: 0 });
        }

        const shiftTotal = items.reduce((sum, it) => sum + it.amount, 0);

        if (visitedCount > 0 || shiftTotal > 0 || items.length > 0) {
          dayTotalAmount += shiftTotal;
          shiftBlocks.push({
            shiftLabel: label,
            visitedCount,
            items,
            shiftTotal
          });
        }
      });

      if (shiftBlocks.length > 0) {
        pdfGrandTotal += dayTotalAmount;
        pdfRows.push({
          date: formattedDate,
          rawDate: date,
          shiftBlocks,
          todayClosing: dayTotalAmount
        });
      }
    });

    return {
      startDate: start,
      endDate: end,
      rows: reportRows,
      morningTotals: morningSummaryTotals,
      eveningTotals: eveningSummaryTotals,
      grandTotals: grandSummaryTotals,
      pdfRows,
      pdfGrandTotal
    };
  };

  // Helper: Filter records by date preset or custom range
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const recStr = dateStr.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    if (datePreset === 'daily') {
      return recStr === todayStr;
    } else if (datePreset === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgoStr = d.toISOString().split('T')[0];
      return recStr >= weekAgoStr && recStr <= todayStr;
    } else if (datePreset === 'monthly') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const monthAgoStr = d.toISOString().split('T')[0];
      return recStr >= monthAgoStr && recStr <= todayStr;
    } else if (datePreset === 'yearly') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      const yearAgoStr = d.toISOString().split('T')[0];
      return recStr >= yearAgoStr && recStr <= todayStr;
    } else {
      // Custom date range
      return recStr >= startDate && recStr <= endDate;
    }
  };

  // Get filtered invoices
  const filteredInvoices = invoices.filter(inv => filterByDate(inv.InvoiceDate));
  
  // Calculate sales summaries
  const totalGrossSales = filteredInvoices.reduce((sum, inv) => sum + inv.GAmount, 0);
  const totalDiscounts = filteredInvoices.reduce((sum, inv) => sum + inv.Discount, 0);
  const totalNetSales = filteredInvoices.reduce((sum, inv) => sum + inv.NetAmount, 0);

  // Filtered sales returns
  const filteredReturns = salesReturns.filter(ret => filterByDate(ret.ReturnDate));
  const totalReturnsPaid = filteredReturns.reduce((sum, ret) => sum + ret.NetPaid, 0);

  // Get patient full name helper
  const getPatientName = (patientId: string) => {
    const pat = patients.find(p => p.PatientID === patientId);
    return pat ? pat.PatientName : 'Walk-in Client';
  };

  // Fetch saved reports from the MongoDB database
  const fetchSavedReports = async () => {
    try {
      const cachedSettings = localStorage.getItem('cms_mongodb_settings');
      let url = 'http://localhost:5000';
      if (cachedSettings) {
        url = JSON.parse(cachedSettings).BridgeUrl || 'http://localhost:5000';
      }
      const res = await fetch(`${url}/api/query/financial_grid_reports?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setSavedReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to fetch saved reports:', e);
    }
  };

  useEffect(() => {
    if (activeReportTab === 'grid_view') {
      fetchSavedReports();
    }
  }, [activeReportTab, datePreset, startDate, endDate]);

  // Safe JSON fetch helper
  const safeFetchJson = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  // Fetch Vendor Account Statement data from erp_vendors, suppliers, erp_grn, pos grns, and erp_transactions
  const fetchVendorStatementData = async () => {
    setVendorLoading(true);
    try {
      const [vRes, sRes, gRes, posGrnRes, tRes] = await Promise.all([
        safeFetchJson('/api/query/erp_vendors'),
        safeFetchJson('/api/query/suppliers'),
        safeFetchJson('/api/query/erp_grn'),
        safeFetchJson('/api/grns', { headers: [], details: [] }),
        safeFetchJson('/api/query/erp_transactions')
      ]);
      const vList = Array.isArray(vRes) ? vRes : [];
      const sList = Array.isArray(sRes) ? sRes : [];
      const gList = Array.isArray(gRes) ? gRes : [];
      const posGrnHeaders = Array.isArray(posGrnRes?.headers) ? posGrnRes.headers : [];
      const posGrnDetails = Array.isArray(posGrnRes?.details) ? posGrnRes.details : [];
      const tList = Array.isArray(tRes) ? tRes : [];

      // Combine vendors & suppliers into a unified vendor list
      const vendorMap = new Map<string, any>();
      vList.forEach((v: any) => {
        const id = v.VendorID || v.SID || v.SupplierID || v._id;
        if (id) vendorMap.set(String(id).trim(), { ...v, VendorID: v.VendorID || id });
      });
      sList.forEach((s: any) => {
        const id = s.SID || s.SupplierID || s.VendorID || s._id;
        const name = s.SupplierName || s.VendorName || s.Name;
        const existingKey = Array.from(vendorMap.keys()).find(k => {
          const item = vendorMap.get(k);
          return item.VendorName?.toLowerCase().trim() === name?.toLowerCase().trim();
        });
        if (!existingKey && id) {
          vendorMap.set(String(id).trim(), {
            _id: s._id || id,
            VendorID: id,
            VendorName: name || 'Supplier',
            ContactPerson: s.ContactPerson || s.Contact || 'N/A',
            Phone: s.Phone || 'N/A',
            Address: s.Address || 'N/A',
            TaxID: s.TaxID || s.NTN || 'N/A',
            Balance: Number(s.Balance) || 0
          });
        }
      });
      const unifiedVendors = Array.from(vendorMap.values());

      // Normalize POS/Inventory GRNs from /api/grns
      const normalizedPosGrns = posGrnHeaders.map((h: any) => {
        const matchingDetails = posGrnDetails.filter((d: any) => d.VchNo === h.VchNo);
        const totalAmount = matchingDetails.reduce((sum: number, d: any) => sum + ((Number(d.QtyIn) || 0) * (Number(d.PurchaseRate) || 0)), 0);
        return {
          _id: h._id || h.VchNo,
          GRNID: h.VchNo,
          POID: h.POID || 'N/A',
          VendorID: h.SID || h.SupplierID || h.VendorID || '',
          VendorName: h.SupplierName || h.VendorName || '',
          ReceivedDate: h.VchDate || h.Date || new Date().toISOString().split('T')[0],
          ChallanNo: h.VchNo,
          TotalAmount: totalAmount,
          Status: 'Approved',
          Remarks: h.Remarks || 'POS Supplier Inward GRN',
          Items: matchingDetails.map((d: any) => ({
            ItemID: d.ItemID,
            ItemName: d.ItemName || d.ItemID,
            ReceivedQty: d.QtyIn,
            UnitPrice: d.PurchaseRate,
            LineTotal: (Number(d.QtyIn) || 0) * (Number(d.PurchaseRate) || 0)
          }))
        };
      });

      // Deduplicate GRNs
      const grnMap = new Map<string, any>();
      gList.forEach((g: any) => {
        const key = g.GRNID || g.ChallanNo || g._id;
        if (key) grnMap.set(String(key).trim(), g);
      });
      normalizedPosGrns.forEach((g: any) => {
        const key = g.GRNID || g.ChallanNo || g._id;
        if (key && !grnMap.has(String(key).trim())) {
          grnMap.set(String(key).trim(), g);
        }
      });
      const unifiedGrns = Array.from(grnMap.values());

      setErpVendors(unifiedVendors);
      setErpGrns(unifiedGrns);
      setErpTransactions(tList);

      if (!selectedVendorId && unifiedVendors.length > 0) {
        setSelectedVendorId(unifiedVendors[0].VendorID || unifiedVendors[0]._id || '');
      }
    } catch (err) {
      console.warn('Failed to fetch vendor statement data:', err);
    } finally {
      setVendorLoading(false);
    }
  };

  useEffect(() => {
    if (activeReportTab === 'vendor_statement' || activeReportTab === 'cash_flow') {
      fetchVendorStatementData();
    }
  }, [activeReportTab]);

  // Selected vendor object
  const selectedVendor = erpVendors.find(v => {
    const vId = String(v.VendorID || v.SID || v.SupplierID || v._id || '').trim();
    const selId = String(selectedVendorId || '').trim();
    if (vId && selId && vId === selId) return true;
    if (v.VendorName && selId && v.VendorName.toLowerCase().trim() === selId.toLowerCase()) return true;
    return false;
  }) || erpVendors[0];

  // Helper actions for Vendor Management
  const handleRecordVendorPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return alert('No vendor selected.');
    const amt = parseFloat(vendorPaymentForm.amount);
    if (!amt || amt <= 0) return alert('Please enter a valid payment amount.');

    const pTxn = {
      TransactionID: `TXN-PAY-${Date.now().toString().slice(-4)}`,
      Type: 'VendorPayment',
      Category: vendorPaymentForm.category || 'Supplier Sales Invoice Payment',
      Description: vendorPaymentForm.description || `Vendor Payment to ${selectedVendor.VendorName}`,
      Amount: amt,
      PaymentMethod: vendorPaymentForm.method || 'Bank',
      ReferenceNo: vendorPaymentForm.refNo || `PV-${Date.now().toString().slice(-4)}`,
      Date: vendorPaymentForm.date || new Date().toISOString().split('T')[0],
      VendorID: selectedVendor.VendorID || selectedVendor.SID || selectedVendor._id || '',
      VendorName: selectedVendor.VendorName || '',
      CreatedBy: currentUser?.FullName || 'Finance Manager'
    };

    setVendorLoading(true);
    try {
      await fetch('/api/query/erp_transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pTxn)
      });

      const currentBal = Number(selectedVendor.Balance || 0);
      const newBal = Math.max(0, currentBal - amt);
      const vendorDbId = selectedVendor._id;
      if (vendorDbId) {
        await fetch(`/api/query/erp_vendors/${vendorDbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...selectedVendor, Balance: newBal })
        });
      } else {
        await fetch('/api/query/erp_vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...selectedVendor, Balance: newBal })
        });
      }

      setShowRecordPaymentModal(false);
      setVendorPaymentForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Bank',
        refNo: `PV-${Date.now().toString().slice(-4)}`,
        description: '',
        category: 'Supplier Sales Invoice Payment'
      });
      await fetchVendorStatementData();
      alert('Vendor Payment Voucher recorded successfully!');
    } catch (err) {
      console.error('Failed to record vendor payment:', err);
      alert('Failed to record payment in database.');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleAddNewVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.name.trim()) return alert('Vendor Name is required.');
    const vObj = {
      VendorID: `VND-${Math.floor(100 + Math.random() * 900)}`,
      VendorName: newVendorForm.name.trim(),
      ContactPerson: newVendorForm.contact || 'N/A',
      Phone: newVendorForm.phone || 'N/A',
      Address: newVendorForm.address || 'N/A',
      TaxID: newVendorForm.taxId || 'N/A',
      Balance: parseFloat(newVendorForm.balance) || 0,
      Status: 'Active'
    };

    setVendorLoading(true);
    try {
      await fetch('/api/query/erp_vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vObj)
      });
      setShowAddVendorModal(false);
      setNewVendorForm({ name: '', contact: '', phone: '', address: '', taxId: '', balance: '0' });
      if (vObj.VendorID) setSelectedVendorId(vObj.VendorID);
      await fetchVendorStatementData();
      alert('New Vendor saved to database successfully!');
    } catch (err) {
      console.error('Failed to add vendor:', err);
      alert('Failed to save vendor to database.');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleDeleteTransaction = async (txnId: string) => {
    if (!confirm('Are you sure you want to delete this payment transaction from the database?')) return;
    setVendorLoading(true);
    try {
      await fetch(`/api/query/erp_transactions/${txnId}`, { method: 'DELETE' });
      await fetchVendorStatementData();
      alert('Transaction deleted successfully!');
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction.');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleDeleteSelectedVendor = async () => {
    if (!selectedVendor) return;
    if (!confirm(`Are you sure you want to delete Vendor "${selectedVendor.VendorName}" from the database?`)) return;
    setVendorLoading(true);
    try {
      const vId = selectedVendor._id || selectedVendor.VendorID;
      await fetch(`/api/query/erp_vendors/${vId}`, { method: 'DELETE' });
      setSelectedVendorId('');
      await fetchVendorStatementData();
      alert('Vendor deleted successfully!');
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      alert('Failed to delete vendor.');
    } finally {
      setVendorLoading(false);
    }
  };

  // Calculate Vendor Account Statement
  const getVendorAccountStatement = () => {
    if (!selectedVendor) return { statementRows: [], totalInvoiced: 0, totalPaid: 0, closingBalance: 0, grnAuditList: [] };

    const vId = String(selectedVendor.VendorID || selectedVendor.SID || selectedVendor.SupplierID || selectedVendor._id || '').trim();
    const vName = (selectedVendor.VendorName || selectedVendor.SupplierName || '').toLowerCase().trim();

    // Filter GRNs for this vendor
    const vendorGrns = erpGrns.filter(g => {
      const gVId = String(g.VendorID || g.SupplierID || g.SID || '').trim();
      if (vId && gVId && gVId === vId) return true;
      if (selectedVendor._id && gVId && gVId === String(selectedVendor._id)) return true;
      const gVName = (g.VendorName || g.SupplierName || '').toLowerCase().trim();
      if (vName && gVName && (gVName === vName || gVName.includes(vName) || vName.includes(gVName))) return true;
      return false;
    });

    // Filter Payments / Transactions for this vendor
    const vendorTxns = erpTransactions.filter(t => {
      const tVId = String(t.VendorID || t.SupplierID || '').trim();
      if (vId && tVId && tVId === vId) return true;
      if (selectedVendor._id && tVId && tVId === String(selectedVendor._id)) return true;
      const tVName = (t.VendorName || t.SupplierName || '').toLowerCase().trim();
      if (vName && tVName && (tVName === vName || tVName.includes(vName) || vName.includes(tVName))) return true;
      if (vName && (t.Description || '').toLowerCase().includes(vName)) return true;
      return false;
    });

    // Compute linked payment vouchers audit list for GRNs
    const grnAuditList = vendorGrns.map(grn => {
      const grnId = grn.GRNID || grn.ChallanNo || grn._id || 'GRN';
      const poId = grn.POID || 'N/A';
      const itemsCount = grn.Items ? grn.Items.length : 0;
      const grnCost = Number(grn.TotalAmount || grn.TotalCost || 0);
      const grnDateStr = grn.ReceivedDate || grn.Date || new Date().toISOString().split('T')[0];
      const terms = grn.PaymentTerms ? parseInt(grn.PaymentTerms) : (defaultGrnTerms || 30);
      const grnDateMs = new Date(grnDateStr).getTime();
      const dueDateMs = grnDateMs + (terms * 24 * 60 * 60 * 1000);
      const dueDateStr = new Date(dueDateMs).toISOString().split('T')[0];

      // Match payment vouchers specifically linked to this GRN or PO or vendor payments
      const directLinkedVouchers = vendorTxns.filter(t => {
        if (t.GRNID && (t.GRNID === grnId || t.GRNID === grn._id)) return true;
        if (t.ReferenceNo && (t.ReferenceNo === grnId || (poId !== 'N/A' && t.ReferenceNo === poId))) return true;
        if (t.Description && (t.Description.includes(grnId) || (poId !== 'N/A' && t.Description.includes(poId)))) return true;
        return false;
      }).map(t => ({
        id: t.TransactionID || t._id,
        voucherNo: t.ReferenceNo || t.TransactionID || t.VoucherNo || t._id || 'PV-PAY',
        date: t.Date || t.TxDate || new Date().toISOString().split('T')[0],
        amount: Number(t.Amount || t.Debit || t.PaidAmount || 0),
        paymentMethod: t.PaymentMethod || t.Channel || 'Bank/Cash Transfer',
        description: t.Description || `Payment Voucher settlement for ${grnId}`,
        createdBy: t.CreatedBy || 'Finance Desk'
      }));

      let effectiveVouchers = [...directLinkedVouchers];
      // Fallback: If no direct GRN reference tag, check matching vendor payments on or after GRN date
      if (effectiveVouchers.length === 0 && vendorTxns.length > 0) {
        const vendorMatchingTxns = vendorTxns.filter(t => new Date(t.Date || 0).getTime() >= grnDateMs);
        if (vendorMatchingTxns.length > 0) {
          effectiveVouchers = vendorMatchingTxns.map(t => ({
            id: t.TransactionID || t._id,
            voucherNo: t.ReferenceNo || t.TransactionID || 'PV-GEN',
            date: t.Date || new Date().toISOString().split('T')[0],
            amount: Number(t.Amount || t.Debit || 0),
            paymentMethod: t.PaymentMethod || 'Vendor Payment',
            description: t.Description || `General Vendor Payment Voucher`,
            createdBy: t.CreatedBy || 'Finance Desk'
          }));
        }
      }

      const totalVouchersPaid = effectiveVouchers.reduce((sum, v) => sum + v.amount, 0);
      const settledAmount = Math.min(grnCost, totalVouchersPaid);
      const netDue = Math.max(0, grnCost - settledAmount);

      let settlementStatus: 'settled' | 'partial' | 'unsettled' = 'unsettled';
      if (netDue === 0 && grnCost > 0) settlementStatus = 'settled';
      else if (settledAmount > 0) settlementStatus = 'partial';

      return {
        grnId,
        poId,
        itemsCount,
        grnCost,
        grnDateStr,
        dueDateStr,
        terms,
        linkedVouchers: effectiveVouchers,
        settledAmount,
        netDue,
        settlementStatus,
        items: grn.Items || []
      };
    });

    // Convert GRNs into Credit entries (payable increases)
    const grnEntries = vendorGrns.map(grn => {
      const itemsCount = grn.Items ? grn.Items.length : 0;
      const totalAmount = Number(grn.TotalAmount || grn.TotalCost || 0);
      const grnId = grn.GRNID || grn.ChallanNo || grn._id || 'GRN';
      const audit = grnAuditList.find(a => a.grnId === grnId);

      return {
        id: grnId,
        rawId: grn._id || grnId,
        date: grn.ReceivedDate || grn.Date || new Date().toISOString().split('T')[0],
        type: 'GRN / Goods Received',
        refNo: grnId,
        description: `GRN Purchase Order #${grn.POID || 'N/A'} - ${itemsCount} items received`,
        debit: 0,
        credit: totalAmount,
        rawDate: new Date(grn.ReceivedDate || grn.Date || Date.now()).getTime(),
        createdBy: grn.CreatedBy || 'Store Receiver',
        audit
      };
    });

    // Convert Payments/Transactions into Debit entries (payable decreases)
    const paymentEntries = vendorTxns.map(txn => {
      const pAmt = Number(txn.Amount || 0);
      return {
        id: txn.TransactionID || txn._id,
        rawId: txn._id || txn.TransactionID,
        date: txn.Date || new Date().toISOString().split('T')[0],
        type: txn.Type === 'VendorPayment' ? 'Vendor Payment' : (txn.Type || 'Transaction'),
        refNo: txn.ReferenceNo || txn.TransactionID || 'PAY',
        description: txn.Description || `Payment via ${txn.PaymentMethod || 'Bank/Cash'} to ${selectedVendor.VendorName}`,
        debit: txn.Type === 'VendorPayment' ? pAmt : 0,
        credit: txn.Type !== 'VendorPayment' ? pAmt : 0,
        rawDate: new Date(txn.Date || Date.now()).getTime(),
        createdBy: txn.CreatedBy || 'Finance Desk'
      };
    });

    // Combine & sort chronologically
    const allEvents = [...grnEntries, ...paymentEntries].sort((a, b) => a.rawDate - b.rawDate);

    let runningBalance = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    const statementRows = allEvents.map(evt => {
      totalInvoiced += evt.credit;
      totalPaid += evt.debit;
      runningBalance += (evt.credit - evt.debit);
      return {
        ...evt,
        runningBalance
      };
    });

    // Filter rows by vendor date range
    const filteredRows = statementRows.filter(row => {
      if (!row.date || vendorDateFilter === 'all') return true;
      const recStr = row.date.split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      if (vendorDateFilter === 'daily') return recStr === todayStr;
      if (vendorDateFilter === 'weekly') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return recStr >= d.toISOString().split('T')[0] && recStr <= todayStr;
      }
      if (vendorDateFilter === 'monthly') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return recStr >= d.toISOString().split('T')[0] && recStr <= todayStr;
      }
      if (vendorDateFilter === 'yearly') {
        const d = new Date(); d.setDate(d.getDate() - 365);
        return recStr >= d.toISOString().split('T')[0] && recStr <= todayStr;
      }
      return true;
    });

    const closingBalance = selectedVendor.Balance !== undefined ? selectedVendor.Balance : runningBalance;

    return {
      statementRows: filteredRows,
      totalInvoiced,
      totalPaid,
      closingBalance,
      grnAuditList
    };
  };

  const vendorStatement = getVendorAccountStatement();

  // Helper: Calculate daily collection report categories from Pharmacy, OPD, and Clinical services with shift breakdowns
  const getDailyCollectionReport = () => {
    const matchedVisits = (visits || []).filter(vis => filterByDate(vis.VisitDate));
    const matchedApps = (appointments || []).filter(app => filterByDate(app.AppointmentDate) && app.Status !== 3);
    const matchedInvoices = (invoices || []).filter(inv => filterByDate(inv.InvoiceDate));

    // Shift & Service Category breakdown variables
    let morningPharmacyPOS = 0;
    let eveningPharmacyPOS = 0;

    let morningPatentMed = 0;
    let eveningPatentMed = 0;

    let morningAppFees = 0;
    let eveningAppFees = 0;

    let morningFileCardFees = 0;
    let eveningFileCardFees = 0;

    let morningClinicalMed = 0;
    let eveningClinicalMed = 0;

    let morningDoctorConsult = 0;
    let eveningDoctorConsult = 0;

    let morningLabRevenue = 0;
    let eveningLabRevenue = 0;

    // Itemized receipt trail for cashier & shift audit
    const itemizedReceipts: Array<{
      id: string;
      receiptNo: string;
      date: string;
      shift: 1 | 2;
      shiftLabel: string;
      category: 'Pharmacy' | 'OPD' | 'Clinical';
      serviceLine: string;
      patientName: string;
      paymentMethod: string;
      amount: number;
    }> = [];

    // 1. Process Pharmacy POS Retail Invoices
    matchedInvoices.forEach(inv => {
      const amt = Number(inv.NetAmount || 0);
      const shift = inv.shift === 2 ? 2 : 1;
      if (shift === 2) {
        eveningPharmacyPOS += amt;
      } else {
        morningPharmacyPOS += amt;
      }

      itemizedReceipts.push({
        id: inv.InvoiceNo,
        receiptNo: inv.InvoiceNo,
        date: inv.InvoiceDate || new Date().toISOString().split('T')[0],
        shift,
        shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
        category: 'Pharmacy',
        serviceLine: 'Pharmacy POS Retail Sales',
        patientName: getPatientName(inv.PatientID),
        paymentMethod: 'Cash / Direct POS',
        amount: amt
      });
    });

    // 2. Process OPD Appointments (Consultation & Booking fees)
    matchedApps.forEach(app => {
      const fee = Number(app.FeeCharged || 0);
      const shift = app.Shift === 2 ? 2 : 1;
      if (shift === 2) {
        eveningAppFees += fee;
      } else {
        morningAppFees += fee;
      }

      if (fee > 0) {
        itemizedReceipts.push({
          id: app.AppointmentID || `APP-${app.PatientID}-${app.AppointmentDate}`,
          receiptNo: app.AppointmentID || `OPD-TKT-${app.PatientID}`,
          date: app.AppointmentDate || new Date().toISOString().split('T')[0],
          shift,
          shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
          category: 'OPD',
          serviceLine: 'OPD Token & Doctor Consultation Fee',
          patientName: getPatientName(app.PatientID),
          paymentMethod: 'Cash / Token Counter',
          amount: fee
        });
      }
    });

    // 3. Process Visits (File & Registration Fees, Clinical Medicine, Standalone Doctor Fees, Patent Sourcing)
    matchedVisits.forEach(vis => {
      const assocApp = matchedApps.find(a => a.PatientID === vis.PatientID && a.AppointmentDate === vis.VisitDate);
      const shift = assocApp ? (assocApp.Shift === 2 ? 2 : 1) : 1;
      const patName = getPatientName(vis.PatientID);

      // File & Registration / Card Payment
      const fileCardAmt = (Number(vis.CardsPayment) || 0) || ((Number(vis.FileFee || 0) + Number(vis.CardFee || 0)));
      if (fileCardAmt > 0) {
        if (shift === 2) {
          eveningFileCardFees += fileCardAmt;
        } else {
          morningFileCardFees += fileCardAmt;
        }

        itemizedReceipts.push({
          id: `FC-${vis.VisitID || vis.PatientID}`,
          receiptNo: vis.VisitID || `REG-${vis.PatientID}`,
          date: vis.VisitDate || new Date().toISOString().split('T')[0],
          shift,
          shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
          category: 'OPD',
          serviceLine: 'OPD File & Card Registration Fee',
          patientName: patName,
          paymentMethod: 'Cash / Desk Receipt',
          amount: fileCardAmt
        });
      }

      // Clinical Medicine Sourcing Payment
      const clinAmt = Number(vis.ClinicalMedicinePayment || 0);
      if (clinAmt > 0) {
        if (shift === 2) {
          eveningClinicalMed += clinAmt;
        } else {
          morningClinicalMed += clinAmt;
        }

        itemizedReceipts.push({
          id: `CM-${vis.VisitID}`,
          receiptNo: `CLIN-MED-${vis.VisitID}`,
          date: vis.VisitDate || new Date().toISOString().split('T')[0],
          shift,
          shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
          category: 'Clinical',
          serviceLine: 'Clinical Medicine Sourcing',
          patientName: patName,
          paymentMethod: 'Cash / Service Counter',
          amount: clinAmt
        });
      }

      // Standalone Doctor Consultation Fee (if not captured via appointment)
      if (!assocApp && Number(vis.ConsultationFee || 0) > 0) {
        const docFee = Number(vis.ConsultationFee || 0);
        if (shift === 2) {
          eveningDoctorConsult += docFee;
        } else {
          morningDoctorConsult += docFee;
        }

        itemizedReceipts.push({
          id: `DOC-${vis.VisitID}`,
          receiptNo: `DOC-FEE-${vis.VisitID}`,
          date: vis.VisitDate || new Date().toISOString().split('T')[0],
          shift,
          shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
          category: 'Clinical',
          serviceLine: 'Doctor Consultation & Special Procedure',
          patientName: patName,
          paymentMethod: 'Cash / Direct',
          amount: docFee
        });
      }

      // Patent Medicine in visit if Sourced from Clinic
      if (vis.PatentPaymentOption === 'Clinic') {
        const meds = (visitMedicines || []).filter(m => m.VisitID === vis.VisitID && m.MedicineType === 'P');
        let visitPatentCost = 0;
        meds.forEach(m => {
          const itm = (items || []).find(i => i.ItemID === m.ItemID);
          const price = m.Price !== undefined ? m.Price : (itm ? itm.Price : 10.0);
          visitPatentCost += price * 10;
        });

        if (visitPatentCost > 0) {
          if (shift === 2) {
            eveningPatentMed += visitPatentCost;
          } else {
            morningPatentMed += visitPatentCost;
          }

          itemizedReceipts.push({
            id: `PAT-${vis.VisitID}`,
            receiptNo: `PAT-SRC-${vis.VisitID}`,
            date: vis.VisitDate || new Date().toISOString().split('T')[0],
            shift,
            shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
            category: 'Pharmacy',
            serviceLine: 'Clinic Sourced Patent Medicine',
            patientName: patName,
            paymentMethod: 'Cash / Desk',
            amount: visitPatentCost
          });
        }
      }
    });

    // 4. Lab & Diagnostic Test Fees from ACLedger
    const labEntries = acLedger.filter(l => l.TLID === 401002 && filterByDate(l.TxDate));
    labEntries.forEach((l, idx) => {
      const amt = l.Credit || 0;
      const shift = idx % 2 === 1 ? 2 : 1;
      if (shift === 2) {
        eveningLabRevenue += amt;
      } else {
        morningLabRevenue += amt;
      }

      if (amt > 0) {
        itemizedReceipts.push({
          id: `LAB-${l.VchNo || idx}`,
          receiptNo: l.VchNo || `LAB-VCH-${idx}`,
          date: l.TxDate || new Date().toISOString().split('T')[0],
          shift,
          shiftLabel: shift === 1 ? 'Morning Shift' : 'Evening Shift',
          category: 'Clinical',
          serviceLine: 'Laboratory & Diagnostic Test Fees',
          patientName: l.Remarks || 'Lab Patient',
          paymentMethod: 'Cash / Ledger Posting',
          amount: amt
        });
      }
    });

    // Fallback using acLedger if operational tables have no matching date entries
    if (matchedVisits.length === 0 && matchedApps.length === 0 && matchedInvoices.length === 0) {
      const filteredLedgers = acLedger.filter(log => filterByDate(log.TxDate));
      if (filteredLedgers.length > 0) {
        const patentLedgers = filteredLedgers.filter(l => l.TLID === 401103 || l.TLID === 401203);
        const patentTot = patentLedgers.reduce((sum, l) => sum + l.Credit, 0);
        morningPharmacyPOS = patentTot * 0.6;
        eveningPharmacyPOS = patentTot * 0.4;

        const clinicalLedgers = filteredLedgers.filter(l => l.TLID === 401102 || l.TLID === 401202);
        const clinTot = clinicalLedgers.reduce((sum, l) => sum + l.Credit, 0);
        morningClinicalMed = clinTot * 0.6;
        eveningClinicalMed = clinTot * 0.4;

        const appLedgers = filteredLedgers.filter(
          l => (l.TLID === 401101 || l.TLID === 401201 || l.TLID === 401001) && !l.VchNo.includes('WALK') && !l.VchNo.includes('CARD')
        );
        const appTot = appLedgers.reduce((sum, l) => sum + l.Credit, 0);
        morningAppFees = appTot * 0.6;
        eveningAppFees = appTot * 0.4;

        const fileCardLedgers = filteredLedgers.filter(
          l => l.TLID === 401105 || l.TLID === 401205 || (l.VchNo && (l.VchNo.includes('WALK') || l.VchNo.includes('CARD')))
        );
        const fcTot = fileCardLedgers.reduce((sum, l) => sum + l.Credit, 0);
        morningFileCardFees = fcTot * 0.6;
        eveningFileCardFees = fcTot * 0.4;
      }
    }

    // Totals by Category & Shift
    const morningPharmacyTotal = morningPharmacyPOS + morningPatentMed;
    const eveningPharmacyTotal = eveningPharmacyPOS + eveningPatentMed;
    const totalPharmacy = morningPharmacyTotal + eveningPharmacyTotal;

    const morningOPDTotal = morningAppFees + morningFileCardFees;
    const eveningOPDTotal = eveningAppFees + eveningFileCardFees;
    const totalOPD = morningOPDTotal + eveningOPDTotal;

    const morningClinicalTotal = morningClinicalMed + morningDoctorConsult + morningLabRevenue;
    const eveningClinicalTotal = eveningClinicalMed + eveningDoctorConsult + eveningLabRevenue;
    const totalClinical = morningClinicalTotal + eveningClinicalTotal;

    const morningTotal = morningPharmacyTotal + morningOPDTotal + morningClinicalTotal;
    const eveningTotal = eveningPharmacyTotal + eveningOPDTotal + eveningClinicalTotal;
    const grandTotalDailyCash = totalPharmacy + totalOPD + totalClinical;

    return {
      // Category & Shift totals
      totalPharmacy,
      morningPharmacyTotal,
      eveningPharmacyTotal,
      morningPharmacyPOS,
      eveningPharmacyPOS,
      morningPatentMed,
      eveningPatentMed,

      totalOPD,
      morningOPDTotal,
      eveningOPDTotal,
      morningAppFees,
      eveningAppFees,
      morningFileCardFees,
      eveningFileCardFees,

      totalClinical,
      morningClinicalTotal,
      eveningClinicalTotal,
      morningClinicalMed,
      eveningClinicalMed,
      morningDoctorConsult,
      eveningDoctorConsult,
      morningLabRevenue,
      eveningLabRevenue,

      // Combined shift totals
      morningTotal,
      eveningTotal,
      grandTotalDailyCash,

      // Itemized receipt log
      itemizedReceipts,

      // Backward compatibility fields
      patentMedicineSales: totalPharmacy,
      clinicalMedicineSales: totalClinical,
      appointmentCollection: morningAppFees + eveningAppFees,
      consultancyCollection: morningFileCardFees + eveningFileCardFees,
      totalCollection: grandTotalDailyCash
    };
  };

  // Calculate Cash Flow Forecast
  const getCashFlowForecastData = () => {
    // 1. Calculate historical daily averages
    const dailyCol = getDailyCollectionReport();
    
    let daysSpan = 30;
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
      if (diff > 0) daysSpan = diff;
    }

    const historicalPharmTotal = dailyCol.patentMedicineSales + dailyCol.clinicalMedicineSales;
    const historicalClinicTotal = dailyCol.appointmentCollection + dailyCol.consultancyCollection;

    const histDailyPharm = Math.round(historicalPharmTotal / daysSpan);
    const histDailyClinic = Math.round(historicalClinicTotal / daysSpan);

    const dailyPharm = customPharmInflow !== '' ? (parseFloat(customPharmInflow) || 0) : (histDailyPharm > 0 ? histDailyPharm : 15000);
    const dailyClinic = customClinicInflow !== '' ? (parseFloat(customClinicInflow) || 0) : (histDailyClinic > 0 ? histDailyClinic : 8000);
    const totalDailyInflow = dailyPharm + dailyClinic;

    // Opening Cash Balance
    const cashAcc = tlAccounts.find(a => a.TLID === 101101 || (a.TLName || '').toLowerCase().includes('cash'));
    const derivedOpeningCash = cashAcc ? Math.abs(cashAcc.AcBalance) : 50000;
    const openingCash = openingCashInput !== '' ? (parseFloat(openingCashInput) || 0) : derivedOpeningCash;

    // 2. Upcoming GRN Supplier Payables
    const now = new Date();
    now.setHours(0,0,0,0);
    const nowMs = now.getTime();

    const grnCommitments = erpGrns.map(grn => {
      const grnCost = Number(grn.TotalAmount || grn.TotalCost || 0);
      const grnId = grn.GRNID || grn._id || 'GRN';
      const vendorName = grn.VendorName || (erpVendors.find(v => v.VendorID === grn.VendorID)?.VendorName) || 'Supplier';
      const terms = grn.PaymentTerms ? parseInt(grn.PaymentTerms) : (defaultGrnTerms || 30);
      
      const grnDate = new Date(grn.ReceivedDate || grn.Date || nowMs);
      grnDate.setHours(0,0,0,0);
      const grnDateMs = grnDate.getTime();
      
      const dueDateMs = grnDateMs + (terms * 24 * 60 * 60 * 1000);
      const dueDate = new Date(dueDateMs);
      const daysUntilDue = Math.ceil((dueDateMs - nowMs) / (1000 * 60 * 60 * 24));

      // Find payments settled for this GRN or Vendor
      const payments = erpTransactions
        .filter(t => (t.GRNID && t.GRNID === grnId) || (t.VendorID && t.VendorID === grn.VendorID && new Date(t.Date || 0).getTime() >= grnDateMs))
        .reduce((s, t) => s + Number(t.Amount || 0), 0);

      const netDue = Math.max(0, grnCost - payments);

      let status: 'overdue' | 'due_soon' | 'scheduled' | 'settled' = 'scheduled';
      if (netDue === 0) status = 'settled';
      else if (daysUntilDue < 0) status = 'overdue';
      else if (daysUntilDue <= 7) status = 'due_soon';

      return {
        grnId,
        poId: grn.POID || 'N/A',
        vendorName,
        vendorId: grn.VendorID || '',
        grnDate,
        terms,
        dueDate,
        dueDateMs,
        daysUntilDue,
        grnCost,
        payments,
        netDue,
        status
      };
    }).filter(c => c.netDue > 0);

    // 3. Aging Buckets for Payables
    const agingBuckets = {
      overdue: 0,
      days1_7: 0,
      days8_14: 0,
      days15_30: 0,
      days31_60: 0,
      days61_90: 0
    };

    grnCommitments.forEach(c => {
      if (c.daysUntilDue < 0) agingBuckets.overdue += c.netDue;
      else if (c.daysUntilDue <= 7) agingBuckets.days1_7 += c.netDue;
      else if (c.daysUntilDue <= 14) agingBuckets.days8_14 += c.netDue;
      else if (c.daysUntilDue <= 30) agingBuckets.days15_30 += c.netDue;
      else if (c.daysUntilDue <= 60) agingBuckets.days31_60 += c.netDue;
      else agingBuckets.days61_90 += c.netDue;
    });

    const totalUpcomingPayables = grnCommitments.reduce((s, c) => s + c.netDue, 0);

    // 4. Generate Day-by-Day Forecast Schedule
    const dailyTimeline: Array<{
      dayIndex: number;
      dateStr: string;
      dateMs: number;
      pharmInflow: number;
      clinicInflow: number;
      totalInflow: number;
      supplierOutflow: number;
      netCashFlow: number;
      endingCash: number;
      dueGrns: typeof grnCommitments;
    }> = [];

    let runningCash = openingCash;
    let minCashPoint = openingCash;
    let minCashDate = new Date(nowMs);
    let totalProjectedInflow = 0;
    let totalProjectedOutflow = 0;

    for (let i = 0; i < forecastHorizonDays; i++) {
      const dayMs = nowMs + (i * 24 * 60 * 60 * 1000);
      const dayDate = new Date(dayMs);
      const dateStr = dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      const dueGrns = grnCommitments.filter(c => {
        if (i === 0) {
          return c.daysUntilDue <= 0;
        } else {
          return c.daysUntilDue === i;
        }
      });

      const dayOutflow = dueGrns.reduce((s, c) => s + c.netDue, 0);
      const pharmIn = dailyPharm;
      const clinicIn = dailyClinic;
      const dayInflow = totalDailyInflow;

      const netFlow = dayInflow - dayOutflow;
      runningCash += netFlow;

      totalProjectedInflow += dayInflow;
      totalProjectedOutflow += dayOutflow;

      if (runningCash < minCashPoint) {
        minCashPoint = runningCash;
        minCashDate = dayDate;
      }

      dailyTimeline.push({
        dayIndex: i,
        dateStr,
        dateMs: dayMs,
        pharmInflow: pharmIn,
        clinicInflow: clinicIn,
        totalInflow: dayInflow,
        supplierOutflow: dayOutflow,
        netCashFlow: netFlow,
        endingCash: runningCash,
        dueGrns
      });
    }

    let liquidityStatus: 'healthy' | 'caution' | 'critical' = 'healthy';
    if (minCashPoint < 0) {
      liquidityStatus = 'critical';
    } else if (minCashPoint < totalDailyInflow * 3) {
      liquidityStatus = 'caution';
    }

    return {
      histDailyPharm,
      histDailyClinic,
      dailyPharm,
      dailyClinic,
      totalDailyInflow,
      openingCash,
      grnCommitments,
      agingBuckets,
      totalUpcomingPayables,
      dailyTimeline,
      totalProjectedInflow,
      totalProjectedOutflow,
      projectedEndingCash: runningCash,
      minCashPoint,
      minCashDate,
      liquidityStatus
    };
  };

  const cashForecast = getCashFlowForecastData();

  // Save statement to MongoDB
  const handleSaveStatementToDb = async (statementData: any) => {
    try {
      setSaveStatus('Saving statement to MongoDB...');
      const cachedSettings = localStorage.getItem('cms_mongodb_settings');
      let url = 'http://localhost:5000';
      if (cachedSettings) {
        url = JSON.parse(cachedSettings).BridgeUrl || 'http://localhost:5000';
      }

      const res = await fetch(`${url}/api/query/financial_grid_reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statementData)
      });

      if (res.ok) {
        setSaveStatus('Statement Successfully Saved to MongoDB Database!');
        fetchSavedReports();
        setTimeout(() => setSaveStatus(''), 5000);
      } else {
        const err = await res.json();
        setSaveStatus(`Failed to save: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      setSaveStatus(`Network error: ${e.message}`);
    }
  };

  // Delete saved report
  const handleDeleteSavedReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this saved financial statement from the database?')) return;
    try {
      const cachedSettings = localStorage.getItem('cms_mongodb_settings');
      let url = 'http://localhost:5000';
      if (cachedSettings) {
        url = JSON.parse(cachedSettings).BridgeUrl || 'http://localhost:5000';
      }
      const res = await fetch(`${url}/api/query/financial_grid_reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchSavedReports();
        if (selectedHistoricalReport?._id === id) {
          setSelectedHistoricalReport(null);
        }
      } else {
        alert('Failed to delete report.');
      }
    } catch (err: any) {
      alert(`Error deleting report: ${err.message}`);
    }
  };

  // Constructing Grid-View elements
  // Helper to determine shift for visits (from appointment or token)
  const getVisitShift = (vis: Visit) => {
    const matchedApp = appointments?.find(
      (a) => a.PatientID === vis.PatientID && a.AppointmentDate === vis.VisitDate
    );
    if (matchedApp) return matchedApp.Shift || 1;
    return 1; // Default
  };

  // 1. Store Sales (Invoices with MedicineType 'S' or 'P' or all checkout invoices)
  const storeSalesGridItems = filteredInvoices.map((inv) => ({
    id: inv.InvoiceNo,
    date: inv.InvoiceDate,
    patientName: getPatientName(inv.PatientID),
    patientId: inv.PatientID,
    amount: inv.NetAmount,
    shift: inv.shift === 1 ? 'Morning' : 'Evening',
    shiftNum: inv.shift || 1,
    status: inv.Status === 2 ? 'Posted' : 'Draft',
    type: 'Store Sale',
    details: `Gross: Rs. ${inv.GAmount.toLocaleString()} | Discount: Rs. ${inv.Discount.toLocaleString()}`
  }));

  // 2. Appointments & Tokens
  const appointmentsGridItems = (appointments || [])
    .filter((app) => filterByDate(app.AppointmentDate) && app.Status !== 3)
    .map((app) => ({
      id: app.AppointmentID,
      date: app.AppointmentDate,
      patientName: getPatientName(app.PatientID),
      patientId: app.PatientID,
      amount: app.FeeCharged,
      shift: app.Shift === 1 ? 'Morning' : 'Evening',
      shiftNum: app.Shift || 1,
      status: app.Status === 4 ? 'Posted' : 'New/Pending',
      type: 'Appointment',
      details: `OPD ticket consultation fee`
    }));

  // Add standalone visit consultations if any
  const visitConsultationsGridItems = (visits || [])
    .filter((vis) => filterByDate(vis.VisitDate) && Number(vis.ConsultationFee || 0) > 0 && !(appointments || []).some(a => a.PatientID === vis.PatientID && a.AppointmentDate === vis.VisitDate))
    .map((vis) => {
      const shiftNum = getVisitShift(vis);
      return {
        id: `${vis.VisitID}-CON`,
        date: vis.VisitDate,
        patientName: getPatientName(vis.PatientID),
        patientId: vis.PatientID,
        amount: Number(vis.ConsultationFee || 0),
        shift: shiftNum === 1 ? 'Morning' : 'Evening',
        shiftNum: shiftNum,
        status: vis.Status === 2 ? 'Posted' : 'Draft',
        type: 'Appointment',
        details: `Doctor Consultation checkout fee`
      };
    });

  // 3. Clinical Medicine
  const clinicalMedicinesGridItems = (visits || [])
    .filter((vis) => filterByDate(vis.VisitDate) && Number(vis.ClinicalMedicinePayment || 0) > 0)
    .map((vis) => {
      const shiftNum = getVisitShift(vis);
      return {
        id: vis.VisitID,
        date: vis.VisitDate,
        patientName: getPatientName(vis.PatientID),
        patientId: vis.PatientID,
        amount: Number(vis.ClinicalMedicinePayment || 0),
        shift: shiftNum === 1 ? 'Morning' : 'Evening',
        shiftNum: shiftNum,
        status: vis.Status === 2 ? 'Posted' : 'Draft',
        type: 'Clinical Medicine',
        details: `Compounded formulation doctors prescription fee`
      };
    });

  // 4. File Payments
  const filePaymentsGridItems = (visits || [])
    .filter((vis) => filterByDate(vis.VisitDate) && (Number(vis.CardsPayment || 0) > 0 || (Number(vis.FileFee || 0) + Number(vis.CardFee || 0)) > 0))
    .map((vis) => {
      const shiftNum = getVisitShift(vis);
      const amt = Number(vis.CardsPayment || 0) || ((Number(vis.FileFee || 0) + Number(vis.CardFee || 0)));
      return {
        id: `${vis.VisitID}-FP`,
        date: vis.VisitDate,
        patientName: getPatientName(vis.PatientID),
        patientId: vis.PatientID,
        amount: amt,
        shift: shiftNum === 1 ? 'Morning' : 'Evening',
        shiftNum: shiftNum,
        status: vis.Status === 2 ? 'Posted' : 'Draft',
        type: 'File Payment',
        details: `Patient cards/file creation & registration fee (File: PKR ${vis.FileFee || 0}, Card: PKR ${vis.CardFee || 0})`
      };
    });

  // Combined Grid items
  const allGridItems = [
    ...storeSalesGridItems,
    ...appointmentsGridItems,
    ...visitConsultationsGridItems,
    ...clinicalMedicinesGridItems,
    ...filePaymentsGridItems
  ];

  // Filtering Grid items
  const filteredGridItems = allGridItems.filter((item) => {
    // Shift filter
    if (selectedShiftFilter !== 'all') {
      const isMorning = item.shiftNum === 1;
      if (selectedShiftFilter === 'morning' && !isMorning) return false;
      if (selectedShiftFilter === 'evening' && isMorning) return false;
    }

    // Category filter
    if (selectedCategoryFilter !== 'all') {
      if (selectedCategoryFilter === 'store_sale' && item.type !== 'Store Sale') return false;
      if (selectedCategoryFilter === 'appointment' && item.type !== 'Appointment') return false;
      if (selectedCategoryFilter === 'clinical_medicine' && item.type !== 'Clinical Medicine') return false;
      if (selectedCategoryFilter === 'file_payment' && item.type !== 'File Payment') return false;
    }

    // Search query
    if (gridSearchQuery) {
      const q = gridSearchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientId.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Totals for grid view
  const storeSalesTotal = filteredGridItems.filter(i => i.type === 'Store Sale').reduce((sum, i) => sum + i.amount, 0);
  const storeSalesCount = filteredGridItems.filter(i => i.type === 'Store Sale').length;

  const appointmentsTotal = filteredGridItems.filter(i => i.type === 'Appointment').reduce((sum, i) => sum + i.amount, 0);
  const appointmentsCount = filteredGridItems.filter(i => i.type === 'Appointment').length;

  const clinicalTotal = filteredGridItems.filter(i => i.type === 'Clinical Medicine').reduce((sum, i) => sum + i.amount, 0);
  const clinicalCount = filteredGridItems.filter(i => i.type === 'Clinical Medicine').length;

  const filePaymentsTotal = filteredGridItems.filter(i => i.type === 'File Payment').reduce((sum, i) => sum + i.amount, 0);
  const filePaymentsCount = filteredGridItems.filter(i => i.type === 'File Payment').length;

  const grandTotalGridAmount = storeSalesTotal + appointmentsTotal + clinicalTotal + filePaymentsTotal;

  const handleCleanPrintActiveReport = (reportData?: any) => {
    const activeReport = reportData || selectedHistoricalReport || {
      _id: `REP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      reportDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      datePreset,
      startDate: datePreset === 'custom' ? startDate : undefined,
      endDate: datePreset === 'custom' ? endDate : undefined,
      shiftFilter: selectedShiftFilter,
      categoryFilter: selectedCategoryFilter,
      summary: {
        storeSalesTotal,
        storeSalesCount,
        appointmentsTotal,
        appointmentsCount,
        clinicalTotal,
        clinicalCount,
        filePaymentsTotal,
        filePaymentsCount,
        grandTotal: grandTotalGridAmount
      },
      items: filteredGridItems
    };

    const reportItems = activeReport.items || [];
    const morningItems = reportItems.filter((i: any) => i.shiftNum === 1);
    const eveningItems = reportItems.filter((i: any) => i.shiftNum === 2);

    const morningSales = morningItems.filter((i: any) => i.type === 'Store Sale');
    const morningApps = morningItems.filter((i: any) => i.type === 'Appointment');
    const morningClinical = morningItems.filter((i: any) => i.type === 'Clinical Medicine');
    const morningFile = morningItems.filter((i: any) => i.type === 'File Payment');

    const eveningSales = eveningItems.filter((i: any) => i.type === 'Store Sale');
    const eveningApps = eveningItems.filter((i: any) => i.type === 'Appointment');
    const eveningClinical = eveningItems.filter((i: any) => i.type === 'Clinical Medicine');
    const eveningFile = eveningItems.filter((i: any) => i.type === 'File Payment');

    const renderTableRows = (itemsList: any[]) => {
      if (!itemsList || itemsList.length === 0) return '';
      return itemsList.map(item => `
        <tr>
          <td style="padding: 4px 6px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${item.id || '-'}</td>
          <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0;">${item.patientName || 'N/A'} (${item.patientId || 'N/A'})</td>
          <td style="padding: 4px 6px; font-style: italic; color: #64748b; border-bottom: 1px solid #e2e8f0;">${item.details || '-'}</td>
          <td style="padding: 4px 6px; text-align: right; font-family: monospace; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Rs. ${(Number(item.amount) || 0).toLocaleString()}</td>
        </tr>
      `).join('');
    };

    const renderShiftSection = (title: string, count: number, sales: any[], apps: any[], clin: any[], files: any[], totalAmt: number, colorBorder: string) => {
      if (count === 0) {
        return `
          <div style="margin-bottom: 16px;">
            <div style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 6px 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
              <span>${title}</span>
              <span>Total Logs: 0</span>
            </div>
            <p style="font-size: 10px; font-style: italic; color: #94a3b8; padding-left: 10px; margin-top: 4px;">No transactions logged for this shift during this period.</p>
          </div>
        `;
      }

      return `
        <div style="margin-bottom: 20px;">
          <div style="background-color: #f8fafc; border-left: 4px solid ${colorBorder}; padding: 6px 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; text-transform: uppercase;">
            <span>${title}</span>
            <span>Total Logs: ${count}</span>
          </div>

          ${sales.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155;">A. Store Medicine Sales</div>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 4px;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #cbd5e1; color: #475569; text-align: left;">
                    <th style="padding: 4px 6px;">Vch No</th>
                    <th style="padding: 4px 6px;">Patient Account</th>
                    <th style="padding: 4px 6px;">Details</th>
                    <th style="padding: 4px 6px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderTableRows(sales)}
                  <tr style="font-weight: bold; border-top: 1px solid #94a3b8;">
                    <td colspan="3" style="padding: 4px 6px; text-align: right;">Subtotal Store Sales:</td>
                    <td style="padding: 4px 6px; text-align: right; font-family: monospace;">Rs. ${sales.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          ${apps.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155;">B. OPD Appointments Consultation</div>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 4px;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #cbd5e1; color: #475569; text-align: left;">
                    <th style="padding: 4px 6px;">Appt ID</th>
                    <th style="padding: 4px 6px;">Patient Account</th>
                    <th style="padding: 4px 6px;">Details</th>
                    <th style="padding: 4px 6px; text-align: right;">Fee Charged</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderTableRows(apps)}
                  <tr style="font-weight: bold; border-top: 1px solid #94a3b8;">
                    <td colspan="3" style="padding: 4px 6px; text-align: right;">Subtotal Appointments:</td>
                    <td style="padding: 4px 6px; text-align: right; font-family: monospace;">Rs. ${apps.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          ${clin.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155;">C. Doctors Clinical Formulations</div>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 4px;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #cbd5e1; color: #475569; text-align: left;">
                    <th style="padding: 4px 6px;">Visit ID</th>
                    <th style="padding: 4px 6px;">Patient Account</th>
                    <th style="padding: 4px 6px;">Details</th>
                    <th style="padding: 4px 6px; text-align: right;">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderTableRows(clin)}
                  <tr style="font-weight: bold; border-top: 1px solid #94a3b8;">
                    <td colspan="3" style="padding: 4px 6px; text-align: right;">Subtotal Clinical Medicines:</td>
                    <td style="padding: 4px 6px; text-align: right; font-family: monospace;">Rs. ${clin.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          ${files.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #334155;">D. Cards & File Registrations</div>
              <table style="width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 4px;">
                <thead>
                  <tr style="border-bottom: 1.5px solid #cbd5e1; color: #475569; text-align: left;">
                    <th style="padding: 4px 6px;">Ref ID</th>
                    <th style="padding: 4px 6px;">Patient Account</th>
                    <th style="padding: 4px 6px;">Details</th>
                    <th style="padding: 4px 6px; text-align: right;">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderTableRows(files)}
                  <tr style="font-weight: bold; border-top: 1px solid #94a3b8;">
                    <td colspan="3" style="padding: 4px 6px; text-align: right;">Subtotal File Payments:</td>
                    <td style="padding: 4px 6px; text-align: right; font-family: monospace;">Rs. ${files.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; text-align: right; width: 240px;">
              <span style="font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; display: block;">SHIFT TOTAL REVENUE</span>
              <span style="font-family: monospace; font-size: 12px; font-weight: 900; color: #0f172a;">Rs. ${totalAmt.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    };

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Active Financial Audit Report - PHC</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1, h2, h3, h4, p { margin: 0; }
    .header-box { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
    .title { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }
    .subtitle { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: left; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; margin-top: 10px; font-size: 10px; background-color: #f8fafc; }
    .meta-label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
    .meta-val { font-weight: 700; color: #1e293b; }
    .grand-summary { border-top: 2px solid #0f172a; padding-top: 15px; margin-top: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background-color: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; margin-bottom: 10px; }
    .grand-total-box { display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 0.5px; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; padding-top: 15px; text-align: center; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #cbd5e1; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1 class="title">PUNJAB HOMEOPATHIC CLINIC (PHC)</h1>
    <p class="subtitle">Comprehensive Financial Audit & Revenue Statement</p>
    <div class="meta-grid">
      <div>
        <div class="meta-label">Report Ref ID</div>
        <div class="meta-val" style="font-family: monospace;">${activeReport._id}</div>
      </div>
      <div>
        <div class="meta-label">Audit Period</div>
        <div class="meta-val" style="text-transform: capitalize;">${activeReport.datePreset} (${startDate} to ${endDate})</div>
      </div>
      <div>
        <div class="meta-label">Statement Date</div>
        <div class="meta-val" style="font-family: monospace;">${activeReport.reportDate}</div>
      </div>
    </div>
  </div>

  ${renderShiftSection("1. MORNING SHIFT REVENUE LOGS (08:00 - 14:00)", morningItems.length, morningSales, morningApps, morningClinical, morningFile, morningItems.reduce((s: any, i: any) => s + (Number(i.amount) || 0), 0), "#f97316")}
  ${renderShiftSection("2. EVENING SHIFT REVENUE LOGS (17:00 - 21:00)", eveningItems.length, eveningSales, eveningApps, eveningClinical, eveningFile, eveningItems.reduce((s: any, i: any) => s + (Number(i.amount) || 0), 0), "#6366f1")}

  <div class="grand-summary">
    <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">3. CONSOLIDATED GRAND RECOVERY SUMMARY</div>
    <div class="summary-grid">
      <div>
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Total Store Sales</span>
        <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a;">Rs. ${(activeReport.summary?.storeSalesTotal || 0).toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #94a3b8; display: block;">Count: ${activeReport.summary?.storeSalesCount || 0}</span>
      </div>
      <div>
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Total OPD Fees</span>
        <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a;">Rs. ${(activeReport.summary?.appointmentsTotal || 0).toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #94a3b8; display: block;">Count: ${activeReport.summary?.appointmentsCount || 0}</span>
      </div>
      <div>
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Total Clinical Meds</span>
        <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a;">Rs. ${(activeReport.summary?.clinicalTotal || 0).toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #94a3b8; display: block;">Count: ${activeReport.summary?.clinicalCount || 0}</span>
      </div>
      <div>
        <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Total File Charges</span>
        <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0f172a;">Rs. ${(activeReport.summary?.filePaymentsTotal || 0).toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #94a3b8; display: block;">Count: ${activeReport.summary?.filePaymentsCount || 0}</span>
      </div>
    </div>

    <div class="grand-total-box">
      <span>CONSOLIDATED GRAND TOTAL CASH COLLECTED</span>
      <span style="font-family: monospace; font-size: 14px;">Rs. ${(activeReport.summary?.grandTotal || 0).toLocaleString()}</span>
    </div>
  </div>

  <div class="sig-grid">
    <div class="sig-line">
      <p>PREPARED BY (PHARMACIST/ACCOUNTANT)</p>
    </div>
    <div class="sig-line">
      <p>AUDITED & CERTIFIED BY</p>
    </div>
    <div class="sig-line">
      <p>APPROVED & POSTED BY (ADMINISTRATOR)</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    }
  };

  const handleCleanPrintInvoicesReport = () => {
    const invoiceRowsHtml = filteredInvoices.map((inv) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #0f172a;">${inv.InvoiceNo}</td>
        <td style="padding: 6px 8px; color: #475569;">${inv.InvoiceDate}</td>
        <td style="padding: 6px 8px; color: #0f172a;">${getPatientName(inv.PatientID)} (${inv.PatientID})</td>
        <td style="padding: 6px 8px; font-weight: bold; text-transform: uppercase; font-size: 10px;">${inv.shift === 2 ? 'Evening' : 'Morning'}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace;">Rs. ${inv.GAmount.toLocaleString()}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #d97706;">-Rs. ${inv.Discount.toLocaleString()}</td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">Rs. ${inv.NetAmount.toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Processed Retail Invoices Statement - Punjab Homeopathic Clinic</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #ffffff; }
    h1, h2, h3, p { margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 15px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #020617; }
    .header h2 { font-size: 13px; font-weight: 800; text-transform: uppercase; margin-top: 4px; color: #0f172a; }
    .meta { font-size: 11px; font-weight: 600; color: #475569; margin-top: 6px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; text-align: center; }
    .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; }
    .summary-card label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
    .summary-card .val { font-size: 15px; font-weight: 900; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
    th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 8px; text-align: left; border-bottom: 2px solid #0f172a; }
    .total-row { background: #f8fafc; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
    .total-row td { padding: 8px; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 40px; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .sig-box { border-top: 1px solid #94a3b8; padding-top: 6px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align: right; margin-bottom: 12px;" class="no-print">
    <button onclick="window.print()" style="padding: 8px 18px; background: #0f172a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Print Document</button>
  </div>
  <div class="header">
    <h1>PUNJAB HOMEOPATHIC CLINIC & EMR SYSTEM</h1>
    <h2>PROCESSED RETAIL INVOICES STATEMENT</h2>
    <div class="meta">
      Period: <strong>${startDate}</strong> to <strong>${endDate}</strong> &nbsp;•&nbsp;
      Preset: <strong style="text-transform: uppercase;">${datePreset}</strong> &nbsp;•&nbsp;
      Printed: <strong>${new Date().toLocaleString()}</strong>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <label>Total Invoices</label>
      <div class="val">${filteredInvoices.length}</div>
    </div>
    <div class="summary-card">
      <label>Total Discounts</label>
      <div class="val" style="color: #b45309;">Rs. ${totalDiscounts.toLocaleString()}</div>
    </div>
    <div class="summary-card" style="background: #ecfdf5; border-color: #a7f3d0;">
      <label style="color: #047857;">Net Revenue Mapped</label>
      <div class="val" style="color: #064e3b;">Rs. ${totalNetSales.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Invoice No</th>
        <th>Billing Date</th>
        <th>Patient Account</th>
        <th>OPD Shift</th>
        <th style="text-align: right;">Gross Amount</th>
        <th style="text-align: right;">Discount</th>
        <th style="text-align: right;">Net Paid</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceRowsHtml}
      <tr class="total-row">
        <td colspan="4" style="text-align: right; text-transform: uppercase;">Total Cumulative Revenue:</td>
        <td style="text-align: right; font-family: monospace;">Rs. ${totalGrossSales.toLocaleString()}</td>
        <td style="text-align: right; font-family: monospace; color: #b45309;">-Rs. ${totalDiscounts.toLocaleString()}</td>
        <td style="text-align: right; font-family: monospace; font-size: 13px; color: #047857;">Rs. ${totalNetSales.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-box">PREPARED BY (ACCOUNTANT)</div>
    <div class="sig-box">AUDITED BY</div>
    <div class="sig-box">APPROVED BY</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    } else {
      window.print();
    }
  };

  const handleCleanPrintGridViewReport = () => {
    const storeSubtotal = filteredGridItems.filter(i => i.type === 'Store Sale').reduce((s, i) => s + i.amount, 0);
    const appSubtotal = filteredGridItems.filter(i => i.type === 'Appointment').reduce((s, i) => s + i.amount, 0);
    const clinSubtotal = filteredGridItems.filter(i => i.type === 'Clinical Medicine').reduce((s, i) => s + i.amount, 0);
    const fileSubtotal = filteredGridItems.filter(i => i.type === 'File Payment').reduce((s, i) => s + i.amount, 0);
    const totalAmount = filteredGridItems.reduce((s, i) => s + i.amount, 0);

    const rowsHtml = filteredGridItems.map((item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 5px 8px; font-family: monospace; font-weight: bold; color: #0f172a;">${item.id}</td>
        <td style="padding: 5px 8px; font-family: monospace; color: #334155;">${item.date}</td>
        <td style="padding: 5px 8px; font-weight: bold; color: #0f172a;">${item.type}</td>
        <td style="padding: 5px 8px; color: #1e293b;">${item.patientName || 'N/A'} (${item.patientId || 'N/A'})</td>
        <td style="padding: 5px 8px; font-weight: bold; text-transform: uppercase; font-size: 9px;">${item.shift}</td>
        <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 800; color: #0f172a;">Rs. ${(Number(item.amount) || 0).toLocaleString()}</td>
        <td style="padding: 5px 8px; color: #64748b; font-style: italic; font-size: 10px;">${item.details || '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Audit Grid-View Transactions Report - PHC</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    h1, h2, h3, h4, p { margin: 0; }
    .header-box { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
    .subtitle { font-size: 10px; font-weight: 800; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
    .title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
    .meta-line { font-size: 10px; font-weight: 700; color: #475569; margin-top: 6px; display: flex; justify-content: center; gap: 12px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; margin-bottom: 15px; }
    .kpi-card { background-color: #f8fafc; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
    .kpi-label { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; }
    .kpi-val { font-family: monospace; font-size: 13px; font-weight: 900; color: #0f172a; display: block; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; border: 1px solid #cbd5e1; }
    th { background-color: #f1f5f9; font-weight: 800; text-transform: uppercase; color: #334155; font-size: 9px; padding: 6px 8px; border-bottom: 2px solid #0f172a; text-align: left; }
    .total-row { background-color: #f1f5f9; font-weight: 900; font-size: 11px; border-top: 2px solid #0f172a; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 35px; padding-top: 15px; text-align: center; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #cbd5e1; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="subtitle">PUNJAB HOMEOPATHIC CLINIC & EMR SYSTEM</div>
    <h1 class="title">AUDIT GRID-VIEW TRANSACTIONS REPORT</h1>
    <div class="meta-line">
      <span>Period: <strong>${startDate}</strong> to <strong>${endDate}</strong></span>
      <span>•</span>
      <span>Preset: <strong style="text-transform: uppercase;">${datePreset}</strong></span>
      <span>•</span>
      <span>Shift: <strong style="text-transform: uppercase;">${selectedShiftFilter}</strong></span>
      <span>•</span>
      <span>Category: <strong style="text-transform: uppercase;">${selectedCategoryFilter.replace('_', ' ')}</strong></span>
      <span>•</span>
      <span>Printed: <strong>${new Date().toLocaleString()}</strong></span>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <span class="kpi-label">Matched Audit Records</span>
      <span class="kpi-val">${filteredGridItems.length}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Store Sales Subtotal</span>
      <span class="kpi-val" style="color: #047857;">Rs. ${storeSubtotal.toLocaleString()}</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">Consultation Subtotal</span>
      <span class="kpi-val" style="color: #1d4ed8;">Rs. ${appSubtotal.toLocaleString()}</span>
    </div>
    <div class="kpi-card" style="background-color: #faf5ff; border-color: #d8b4fe;">
      <span class="kpi-label" style="color: #6b21a8;">Total Audited Revenue</span>
      <span class="kpi-val" style="color: #581c87;">Rs. ${totalAmount.toLocaleString()}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Tx Log ID</th>
        <th>Date</th>
        <th>Category</th>
        <th>Patient Account</th>
        <th>Shift</th>
        <th style="text-align: right;">Amount</th>
        <th>Narrative / Details</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="total-row">
        <td colspan="5" style="padding: 8px; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Total Cumulative Audited Value:</td>
        <td style="padding: 8px; text-align: right; font-family: monospace; font-size: 12px; color: #581c87;">Rs. ${totalAmount.toLocaleString()}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="sig-grid">
    <div class="sig-line">
      <p>PREPARED BY (ACCOUNTANT)</p>
    </div>
    <div class="sig-line">
      <p>AUDITED BY</p>
    </div>
    <div class="sig-line">
      <p>APPROVED BY</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    }
  };

  const handlePrintDailyCollectionSummary = () => {
    const dailyData = getDailyCollectionReport();
    
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Daily Collection Summary Report - ${clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 15px; color: #0f172a; margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 15px; }
    .no-print button { background: #059669; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .header h2 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .header h3 { margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #059669; }
    .header p { margin: 4px 0 0 0; font-size: 11px; color: #475569; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
    .kpi-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; }
    .kpi-val { font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background: #1e293b; color: white; font-size: 9px; text-transform: uppercase; }
    .subtotal { background: #f1f5f9; font-weight: bold; }
    .grandtotal { background: #0f172a; color: white; font-weight: 900; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; text-align: center; font-size: 9px; font-weight: bold; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Daily Collection Summary Report (A4 Portrait)</div>
    <button onclick="window.print()">🖨️ Print Summary Report</button>
  </div>

  <div class="header">
    <h2>${clinicSettings?.ClinicName ? clinicSettings.ClinicName.toUpperCase() : 'PUNJAB HOMEOPATHIC CLINIC & EMR SYSTEM'}</h2>
    <h3>DAILY COLLECTION SUMMARY & SHIFT RECONCILIATION REPORT</h3>
    <p>Report Date: <strong>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> • Printed At: <strong>${new Date().toLocaleTimeString()}</strong></p>
  </div>

  <div class="kpis">
    <div class="kpi-card">
      <div class="kpi-title">Morning Shift Collections</div>
      <div class="kpi-val" style="color: #d97706;">Rs. ${dailyData.morningTotal.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Evening Shift Collections</div>
      <div class="kpi-val" style="color: #4f46e5;">Rs. ${dailyData.eveningTotal.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Pharmacy Subtotal</div>
      <div class="kpi-val" style="color: #059669;">Rs. ${dailyData.totalPharmacy.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Grand Total Cash Receipts</div>
      <div class="kpi-val" style="color: #0f172a;">Rs. ${dailyData.grandTotalDailyCash.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Service Line / Revenue Category</th>
        <th class="text-center">Category</th>
        <th class="text-right">Morning Shift (Shift 1)</th>
        <th class="text-right">Evening Shift (Shift 2)</th>
        <th class="text-right">Total Daily Receipts</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Pharmacy POS Retail Sales</td>
        <td class="text-center">Pharmacy</td>
        <td class="text-right">Rs. ${dailyData.morningPharmacyPOS.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningPharmacyPOS.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningPharmacyPOS + dailyData.eveningPharmacyPOS).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Clinic Sourced Patent Medicine</td>
        <td class="text-center">Pharmacy</td>
        <td class="text-right">Rs. ${dailyData.morningPatentMed.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningPatentMed.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningPatentMed + dailyData.eveningPatentMed).toLocaleString()}</td>
      </tr>
      <tr class="subtotal">
        <td>SUBTOTAL PHARMACY REVENUE</td>
        <td class="text-center">SUBTOTAL</td>
        <td class="text-right">Rs. ${dailyData.morningPharmacyTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningPharmacyTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.totalPharmacy.toLocaleString()}</td>
      </tr>
      <tr>
        <td>OPD Appointments & Token Fees</td>
        <td class="text-center">OPD</td>
        <td class="text-right">Rs. ${dailyData.morningAppFees.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningAppFees.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningAppFees + dailyData.eveningAppFees).toLocaleString()}</td>
      </tr>
      <tr>
        <td>OPD File & Registration Card Fees</td>
        <td class="text-center">OPD</td>
        <td class="text-right">Rs. ${dailyData.morningFileCardFees.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningFileCardFees.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningFileCardFees + dailyData.eveningFileCardFees).toLocaleString()}</td>
      </tr>
      <tr class="subtotal">
        <td>SUBTOTAL OPD REVENUE</td>
        <td class="text-center">SUBTOTAL</td>
        <td class="text-right">Rs. ${dailyData.morningOPDTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningOPDTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.totalOPD.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Clinical Medicine Sourcing</td>
        <td class="text-center">Clinical</td>
        <td class="text-right">Rs. ${dailyData.morningClinicalMed.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningClinicalMed.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningClinicalMed + dailyData.eveningClinicalMed).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Doctor Consultations & Special Procedures</td>
        <td class="text-center">Clinical</td>
        <td class="text-right">Rs. ${dailyData.morningDoctorConsult.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningDoctorConsult.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningDoctorConsult + dailyData.eveningDoctorConsult).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Laboratory & Diagnostic Test Fees</td>
        <td class="text-center">Clinical</td>
        <td class="text-right">Rs. ${dailyData.morningLabRevenue.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningLabRevenue.toLocaleString()}</td>
        <td class="text-right">Rs. ${(dailyData.morningLabRevenue + dailyData.eveningLabRevenue).toLocaleString()}</td>
      </tr>
      <tr class="subtotal">
        <td>SUBTOTAL CLINICAL SERVICES REVENUE</td>
        <td class="text-center">SUBTOTAL</td>
        <td class="text-right">Rs. ${dailyData.morningClinicalTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningClinicalTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.totalClinical.toLocaleString()}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="grandtotal">
        <td>GRAND TOTAL DAILY CASH RECEIPTS</td>
        <td class="text-center">TOTAL</td>
        <td class="text-right">Rs. ${dailyData.morningTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.eveningTotal.toLocaleString()}</td>
        <td class="text-right">Rs. ${dailyData.grandTotalDailyCash.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signatures">
    <div class="sig-line"><p>MORNING CASHIER SIGNATURE</p></div>
    <div class="sig-line"><p>EVENING CASHIER SIGNATURE</p></div>
    <div class="sig-line"><p>ACCOUNTS MANAGER / AUDITOR</p></div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    }
  };

  // Clean A4 Window Print for Custom Period Daily Collection (PDF & Grid Format)
  const handleCleanPrintDailyCollectionReport = (data: any, format: 'pdf' | 'grid' = 'pdf') => {
    if (!data) return;

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const clinicAddress = clinicSettings?.ClinicAddress || '39-Shalimar Road, Garhi Shahu, Lahore-39';
    const phone = clinicSettings?.PhoneMobile || '0300-1234567';

    if (format === 'pdf') {
      const rowsHtml = data.pdfRows.length === 0 ? `
        <tr>
          <td colspan="5" style="padding: 20px; text-align: center; color: #64748b; font-style: italic; font-weight: bold;">
            No collection records found for the selected custom period (${formatReportDate(data.startDate)} to ${formatReportDate(data.endDate)}).
          </td>
        </tr>
      ` : data.pdfRows.map((dateBlock: any) => {
        return dateBlock.shiftBlocks.map((shiftBlock: any) => {
          const itemRows = shiftBlock.items.map((item: any, itemIdx: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${itemIdx === 0 ? `${dateBlock.date} ${shiftBlock.shiftLabel}` : ''}</td>
              <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #0f172a;">${itemIdx === 0 ? shiftBlock.visitedCount : ''}</td>
              <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold;">${item.count || '-'}</td>
              <td style="padding: 6px 8px; color: #1e293b;">${item.description}</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold;">Rs. ${(Number(item.amount) || 0).toLocaleString()}</td>
            </tr>
          `).join('');

          const shiftTotalRow = `
            <tr style="background-color: #f8fafc; font-weight: bold; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px;"></td>
              <td style="padding: 6px 8px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Shift Total (${shiftBlock.shiftLabel})</td>
              <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: 900; color: #0f172a; border-top: 1px solid #0f172a;">Rs. ${(Number(shiftBlock.shiftTotal) || 0).toLocaleString()}</td>
            </tr>
          `;
          return itemRows + shiftTotalRow;
        }).join('') + `
          <tr style="background-color: #f1f5f9; font-weight: 900; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a;">
            <td style="padding: 8px;"></td>
            <td style="padding: 8px;"></td>
            <td style="padding: 8px;"></td>
            <td style="padding: 8px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">Today Closing (${dateBlock.date})</td>
            <td style="padding: 8px; text-align: right; font-family: monospace; font-size: 13px; color: #0f172a; border-top: 2px solid #0f172a;">Rs. ${(Number(dateBlock.todayClosing) || 0).toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Collection Report - ${clinicName}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 10px 16px; border-radius: 8px; margin-bottom: 15px; }
    .no-print button { background: #7e22ce; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
    .clinic-title { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
    .clinic-address { font-size: 11px; font-weight: 700; color: #334155; margin-top: 2px; }
    .report-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 8px; }
    .meta-bar { font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 4px; display: flex; justify-content: center; gap: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; border: 1px solid #cbd5e1; }
    th { background: #f8fafc; color: #0f172a; font-weight: 900; text-transform: uppercase; font-size: 10px; padding: 8px; border-bottom: 2px solid #0f172a; border-right: 1px solid #cbd5e1; text-align: left; }
    td { padding: 6px 8px; border-right: 1px solid #cbd5e1; }
    .grand-total-bar { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 10px 12px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; font-weight: 900; }
    .footer { margin-top: 25px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; color: #64748b; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; text-align: center; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Payment Collection Report Preview (A4 Portrait)</div>
    <button onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="clinic-address">${clinicAddress} • Tel: ${phone}</div>
    <div class="report-title">PAYMENT COLLECTION REPORT</div>
    <div class="meta-bar">
      <span>From: <u>${formatReportDate(data.startDate)}</u></span>
      <span>To: <u>${formatReportDate(data.endDate)}</u></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Date & Shift</th>
        <th style="width: 16%; text-align: center;">Patients Visited</th>
        <th style="width: 16%; text-align: center;">No of Patients</th>
        <th style="width: 31%;">Payment Description</th>
        <th style="width: 15%; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="grand-total-bar">
    <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">GRAND TOTAL COLLECTION</span>
    <span style="font-family: monospace; font-size: 16px; color: #0f172a;">Rs. ${(Number(data.pdfGrandTotal) || 0).toLocaleString()}</span>
  </div>

  <div class="signatures">
    <div class="sig-line">PREPARED BY (CASHIER)</div>
    <div class="sig-line">CHECKED BY (ACCOUNTANT)</div>
    <div class="sig-line">APPROVED BY (ADMIN)</div>
  </div>

  <div class="footer">
    <span>Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    <span>Generated By: ${currentUser?.FullName || currentUser?.LoginName || 'ADMIN'}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
      }
    } else {
      // GRID FORMAT (A4 Landscape)
      const rowsHtml = data.rows.length === 0 ? `
        <tr>
          <td colspan="14" style="padding: 20px; text-align: center; color: #64748b; font-style: italic; font-weight: bold;">
            No transaction records found for the selected custom period.
          </td>
        </tr>
      ` : data.rows.map((row: any) => {
        const pts = row.date.split('-');
        const dateDisp = pts.length === 3 ? `${pts[2]}-${pts[1]}-${pts[0].substring(2)}` : row.date;
        return `
          <tr style="border-bottom: 1px solid #cbd5e1; font-family: monospace;">
            <td style="padding: 5px 6px; text-align: center; font-family: sans-serif; font-weight: bold; color: #0f172a;">${dateDisp}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.app || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.cmed || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.cards || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.file || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.morning.store || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #f1f5f9; font-weight: bold; color: #0f172a;">${row.morning.total || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.app || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.cmed || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.cards || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.file || '-'}</td>
            <td style="padding: 5px 6px; text-align: right;">${row.evening.store || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #f1f5f9; font-weight: bold; color: #0f172a;">${row.evening.total || '-'}</td>
            <td style="padding: 5px 6px; text-align: right; background-color: #e2e8f0; font-family: sans-serif; font-weight: 900; color: #0f172a;">${(Number(row.dayTotal) || 0).toLocaleString()}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Collection Grid-View Summary - ${clinicName}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 12px; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 8px 14px; border-radius: 8px; margin-bottom: 12px; }
    .no-print button { background: #7e22ce; color: white; border: none; padding: 6px 16px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    .clinic-title { font-size: 18px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
    .report-title { font-size: 13px; font-weight: 800; color: #334155; margin-top: 2px; }
    .meta-bar { font-size: 11px; font-weight: 700; color: #475569; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; border: 1px solid #94a3b8; }
    th { border: 1px solid #94a3b8; padding: 5px; text-align: center; font-weight: 800; font-size: 9px; }
    td { border: 1px solid #cbd5e1; }
    .th-morn { background: #eff6ff; color: #1d4ed8; text-transform: uppercase; }
    .th-eve { background: #fef3c7; color: #b45309; text-transform: uppercase; }
    .summary-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
    .summary-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fafafa; }
    .summary-box h3 { font-size: 10px; font-weight: 900; text-transform: uppercase; margin: 0 0 6px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .summary-table th, .summary-table td { border: 1px solid #cbd5e1; padding: 4px 6px; }
    .summary-table th { background: #f1f5f9; font-weight: 800; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 25px; text-align: center; font-size: 9px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: bold; font-size: 13px;">Daily Collection Grid-View Summary (A4 Landscape)</div>
    <button onclick="window.print()">🖨️ Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="clinic-title">${clinicName}</div>
    <div class="report-title">DAILY COLLECTION REPORT (CLINIC & STORE) - GRID-VIEW SUMMARY</div>
    <div class="meta-bar">
      Period: <strong>${formatReportDate(data.startDate)}</strong> to <strong>${formatReportDate(data.endDate)}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr style="background-color: #f8fafc;">
        <th rowSpan="2" style="width: 8%;">Date</th>
        <th colSpan="6" class="th-morn">Morning Shift</th>
        <th colSpan="6" class="th-eve">Evening Shift</th>
        <th rowSpan="2" style="width: 10%; background-color: #f1f5f9;">Day Total</th>
      </tr>
      <tr style="background-color: #f1f5f9; font-size: 8.5px;">
        <th style="width: 6.5%;">App</th>
        <th style="width: 6.5%;">C.med</th>
        <th style="width: 6.5%;">Cards</th>
        <th style="width: 6.5%;">File</th>
        <th style="width: 6.5%;">Store</th>
        <th style="width: 7.5%; background-color: #dbeafe; font-weight: 900;">Total</th>
        <th style="width: 6.5%;">App</th>
        <th style="width: 6.5%;">C.med</th>
        <th style="width: 6.5%;">Cards</th>
        <th style="width: 6.5%;">File</th>
        <th style="width: 6.5%;">Store</th>
        <th style="width: 7.5%; background-color: #fef3c7; font-weight: 900;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${data.rows.length > 0 ? `
        <tr style="background-color: #f8fafc; font-weight: 900; font-size: 10px; border-top: 2px solid #0f172a;">
          <td style="padding: 6px; text-align: center; text-transform: uppercase;">Total</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.app || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.cmed || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.cards || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.file || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.morningTotals.store || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace; background-color: #dbeafe; color: #1e3a8a;">${data.morningTotals.total || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.app || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.cmed || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.cards || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.file || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace;">${data.eveningTotals.store || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: monospace; background-color: #fef3c7; color: #78350f;">${data.eveningTotals.total || '-'}</td>
          <td style="padding: 6px; text-align: right; font-family: sans-serif; font-size: 11px; background-color: #0f172a; color: #ffffff;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
        </tr>
      ` : ''}
    </tbody>
  </table>

  <div class="summary-container">
    <div class="summary-box">
      <h3>Summary 1: Revenue Categories</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Category</th>
            <th style="text-align: right;">Morning</th>
            <th style="text-align: right;">Evening</th>
            <th style="text-align: right; background-color: #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Appointments (App)</td>
            <td style="text-align: right;">${data.morningTotals.app || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.app || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.app || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Clinical Medicine (C.med)</td>
            <td style="text-align: right;">${data.morningTotals.cmed || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.cmed || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.cmed || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Cards Fee</td>
            <td style="text-align: right;">${data.morningTotals.cards || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.cards || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.cards || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">File Fee</td>
            <td style="text-align: right;">${data.morningTotals.file || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.file || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.file || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Store Sales</td>
            <td style="text-align: right;">${data.morningTotals.store || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.store || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.store || '-'}</td>
          </tr>
          <tr style="font-weight: 900; background-color: #f1f5f9;">
            <td style="font-family: sans-serif; text-transform: uppercase;">Total Cumulative</td>
            <td style="text-align: right;">${data.morningTotals.total || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.total || '-'}</td>
            <td style="text-align: right; background-color: #0f172a; color: white;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="summary-box">
      <h3>Summary 2: Departmental Grouping</h3>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Grouping</th>
            <th style="text-align: right;">Morning</th>
            <th style="text-align: right;">Evening</th>
            <th style="text-align: right; background-color: #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody style="font-family: monospace;">
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">App & C.med</td>
            <td style="text-align: right;">${(data.morningTotals.app + data.morningTotals.cmed) || '-'}</td>
            <td style="text-align: right;">${(data.eveningTotals.app + data.eveningTotals.cmed) || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${(data.grandTotals.app + data.grandTotals.cmed) || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Cards & File</td>
            <td style="text-align: right;">${(data.morningTotals.cards + data.morningTotals.file) || '-'}</td>
            <td style="text-align: right;">${(data.eveningTotals.cards + data.eveningTotals.file) || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${(data.grandTotals.cards + data.grandTotals.file) || '-'}</td>
          </tr>
          <tr>
            <td style="font-family: sans-serif; font-weight: bold;">Store Sales</td>
            <td style="text-align: right;">${data.morningTotals.store || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.store || '-'}</td>
            <td style="text-align: right; font-weight: bold; background: #f8fafc;">${data.grandTotals.store || '-'}</td>
          </tr>
          <tr style="font-weight: 900; background-color: #f1f5f9;">
            <td style="font-family: sans-serif; text-transform: uppercase;">Total Cumulative</td>
            <td style="text-align: right;">${data.morningTotals.total || '-'}</td>
            <td style="text-align: right;">${data.eveningTotals.total || '-'}</td>
            <td style="text-align: right; background-color: #0f172a; color: white;">Rs. ${data.grandTotals.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="signatures">
    <div class="sig-line">PREPARED BY (ACCOUNTANT)</div>
    <div class="sig-line">AUDITED BY (FINANCE)</div>
    <div class="sig-line">APPROVED BY (ADMINISTRATOR)</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
      }
    }
  };

  // Profit and Loss calculations based on real accounting ledgers in the selected timeframe
  const getPLLedgerSummaries = () => {
    const filteredLedgers = acLedger.filter(log => filterByDate(log.TxDate));

    const accountNetDebitCredit = (tlid: number) => {
      const rows = filteredLedgers.filter(r => r.TLID === tlid);
      const debits = rows.reduce((s, r) => s + r.Debit, 0);
      const credits = rows.reduce((s, r) => s + r.Credit, 0);
      
      const firstDigit = Math.floor(tlid / 100000);
      if (firstDigit === 1 || firstDigit === 5) {
        return debits - credits; // Debit normal
      } else {
        return credits - debits; // Credit normal
      }
    };

    // Morning shift specific revenues (401101 - 401105)
    let morningAppRevenue = accountNetDebitCredit(401101);
    let morningClinicalRevenue = accountNetDebitCredit(401102);
    let morningPatentRevenue = accountNetDebitCredit(401103);
    let morningStoreRevenue = accountNetDebitCredit(401104);
    let morningFileCardRevenue = accountNetDebitCredit(401105);

    // Evening shift specific revenues (401201 - 401205)
    let eveningAppRevenue = accountNetDebitCredit(401201);
    let eveningClinicalRevenue = accountNetDebitCredit(401202);
    let eveningPatentRevenue = accountNetDebitCredit(401203);
    let eveningStoreRevenue = accountNetDebitCredit(401204);
    let eveningFileCardRevenue = accountNetDebitCredit(401205);

    // Shared / general accounts
    let legacyAppRevenue = accountNetDebitCredit(401001);
    let labTestRevenue = accountNetDebitCredit(401002);
    let legacyStoreRevenue = accountNetDebitCredit(402001);

    let pharmacyDiscounts = accountNetDebitCredit(501002);
    let salesReturnsReversals = accountNetDebitCredit(501003);
    let pharmacyCOGS = accountNetDebitCredit(501001);

    // Fallback if there are no ledger logs
    if (filteredLedgers.length === 0) {
      const matchedAppointments = appointments.filter(a => filterByDate(a.AppointmentDate) && a.Status === 4);
      matchedAppointments.forEach(a => {
        if (a.Shift === 1) {
          morningAppRevenue += a.FeeCharged;
        } else {
          eveningAppRevenue += a.FeeCharged;
        }
      });

      const matchedInvoices = invoices.filter(inv => filterByDate(inv.InvoiceDate));
      matchedInvoices.forEach(inv => {
        const details = invoiceDetails.filter(d => d.InvoiceNo === inv.InvoiceNo);
        details.forEach(d => {
          const mType = d.MedicineType || 'S';
          if (inv.shift === 1) {
            if (mType === 'C') {
              morningClinicalRevenue += d.LineTotal;
            } else if (mType === 'P') {
              morningPatentRevenue += d.LineTotal;
            } else {
              morningStoreRevenue += d.LineTotal;
            }
          } else {
            if (mType === 'C') {
              eveningClinicalRevenue += d.LineTotal;
            } else if (mType === 'P') {
              eveningPatentRevenue += d.LineTotal;
            } else {
              eveningStoreRevenue += d.LineTotal;
            }
          }
        });
      });

      // Supplement fallback with clinical payments and file/card payments from visits table
      const matchedVisits = visits.filter(v => filterByDate(v.VisitDate) && v.Status === 2);
      matchedVisits.forEach(v => {
        const pay = Number(v.ClinicalMedicinePayment) || 0;
        const fileCardPay = (Number(v.CardsPayment) || 0) || ((Number(v.FileFee || 0) + Number(v.CardFee || 0)));
        const assocApp = appointments.find(a => a.PatientID === v.PatientID && filterByDate(a.AppointmentDate));
        const shift = assocApp ? assocApp.Shift : 1;
        if (pay > 0) {
          if (shift === 1) {
            morningClinicalRevenue += pay;
          } else {
            eveningClinicalRevenue += pay;
          }
        }
        if (fileCardPay > 0) {
          if (shift === 1) {
            morningFileCardRevenue += fileCardPay;
          } else {
            eveningFileCardRevenue += fileCardPay;
          }
        }
      });

      pharmacyDiscounts = totalDiscounts;
      salesReturnsReversals = totalReturnsPaid;
      pharmacyCOGS = matchedInvoices.length > 0 ? (totalGrossSales * 0.75) : 0;

      labTestRevenue = acLedger
        .filter(l => l.TLID === 401002 && filterByDate(l.TxDate))
        .reduce((sum, l) => sum + l.Credit, 0);
      if (labTestRevenue === 0) {
        const baseLabAcc = tlAccounts.find(a => a.TLID === 401002);
        labTestRevenue = baseLabAcc ? Math.abs(baseLabAcc.AcBalance) : 0;
      }
    }

    // Operating expenses
    const operatingExpAccounts = tlAccounts.filter(acc => Math.floor(acc.TLID / 100000) === 5 && acc.TLID !== 501001);
    const expensesList = operatingExpAccounts.map(acc => {
      let periodAmt = filteredLedgers
        .filter(l => l.TLID === acc.TLID)
        .reduce((sum, l) => sum + (l.Debit - l.Credit), 0);
      
      if (filteredLedgers.length === 0) {
        periodAmt = Math.abs(acc.AcBalance) * 0.25;
      }

      return {
        name: acc.TLName,
        code: acc.TLID,
        amount: periodAmt
      };
    });

    const totalOperatingExpenses = expensesList.reduce((sum, exp) => sum + exp.amount, 0);

    const totalMorningRevenue = morningAppRevenue + morningClinicalRevenue + morningPatentRevenue + morningStoreRevenue + morningFileCardRevenue;
    const totalEveningRevenue = eveningAppRevenue + eveningClinicalRevenue + eveningPatentRevenue + eveningStoreRevenue + eveningFileCardRevenue;
    const totalLegacyRevenue = legacyAppRevenue + legacyStoreRevenue;

    const grossRevenue = totalMorningRevenue + totalEveningRevenue + totalLegacyRevenue + labTestRevenue;
    const deductions = pharmacyDiscounts + salesReturnsReversals;
    const netRevenue = grossRevenue - deductions;
    const grossProfit = netRevenue - pharmacyCOGS;
    const netProfitLoss = grossProfit - totalOperatingExpenses;

    return {
      morningAppRevenue,
      morningClinicalRevenue,
      morningPatentRevenue,
      morningStoreRevenue,
      morningFileCardRevenue,
      totalMorningRevenue,

      eveningAppRevenue,
      eveningClinicalRevenue,
      eveningPatentRevenue,
      eveningStoreRevenue,
      eveningFileCardRevenue,
      totalEveningRevenue,

      legacyAppRevenue,
      legacyStoreRevenue,
      totalLegacyRevenue,
      labTestRevenue,

      pharmacyDiscounts,
      salesReturnsReversals,
      pharmacyCOGS,
      expensesList,
      grossRevenue,
      deductions,
      netRevenue,
      grossProfit,
      totalOperatingExpenses,
      netProfitLoss
    };
  };

  const pl = getPLLedgerSummaries();

  // Filter general ledger audit line postings
  const filteredGlPostings = acLedger.filter(log => {
    const matchesDate = filterByDate(log.TxDate);
    const matchesSearch = glSearchQuery === '' || 
      log.VchNo.toLowerCase().includes(glSearchQuery.toLowerCase()) ||
      (log.Remarks || '').toLowerCase().includes(glSearchQuery.toLowerCase()) ||
      String(log.TLID).includes(glSearchQuery) ||
      (tlAccounts.find(a => a.TLID === log.TLID)?.TLName || '').toLowerCase().includes(glSearchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 text-slate-800" id="reporting-desk-root">
      
      {/* Upper banner controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4 print:hidden">
        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'sales' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Shift Collections
          </button>
          <button
            onClick={() => setActiveReportTab('pl')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'pl' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-teal-600" />
            P&L Statement
          </button>
          <button
            onClick={() => setActiveReportTab('gl_audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'gl_audit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Ledger Audit Journal
          </button>
          <button
            onClick={() => setActiveReportTab('grid_view')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'grid_view' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5 mr-1 text-purple-600" />
            Grid-View Report
          </button>
          <button
            onClick={() => setActiveReportTab('vendor_statement')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'vendor_statement' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Vendor Statement
          </button>
          <button
            onClick={() => setActiveReportTab('daily_collection')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'daily_collection' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Daily Collection Summary
          </button>
          <button
            onClick={() => setActiveReportTab('cash_flow')}
            className={`px-3.5 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition duration-150 flex items-center ${
              activeReportTab === 'cash_flow' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Cash Flow Forecast
          </button>
        </div>
      </div>

      {/* Date Filters Ribbon */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center gap-4 text-xs font-sans print:hidden">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400">Duration Preset:</span>
        </div>

        <div className="relative inline-block text-left">
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as any)}
            className="bg-slate-950 text-emerald-400 font-extrabold uppercase text-xs rounded-xl px-3.5 py-1.5 border border-slate-800 shadow-sm focus:outline-none focus:border-emerald-500 cursor-pointer appearance-none pr-8 tracking-wider"
          >
            <option value="daily" className="bg-slate-900 text-white font-bold">Today (Daily)</option>
            <option value="weekly" className="bg-slate-900 text-white font-bold">Last 7 Days (Weekly)</option>
            <option value="monthly" className="bg-slate-900 text-white font-bold">Last 30 Days (Monthly)</option>
            <option value="yearly" className="bg-slate-900 text-white font-bold">Last 365 Days (Yearly)</option>
            <option value="custom" className="bg-slate-900 text-white font-bold">Custom Range...</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center space-x-2 animate-fadeIn">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-emerald-400 font-mono text-[10px] focus:outline-none focus:border-emerald-500"
            />
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-emerald-400 font-mono text-[10px] focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Audit Window: <span className="text-emerald-400 font-extrabold font-mono">
            {datePreset === 'daily' && 'TODAY ONLY'}
            {datePreset === 'weekly' && 'LAST 7 DAYS'}
            {datePreset === 'monthly' && 'LAST 30 DAYS'}
            {datePreset === 'yearly' && 'LAST 365 DAYS'}
            {datePreset === 'custom' && `${startDate} to ${endDate}`}
          </span>
        </div>
      </div>

      {/* VIEW 1: SHIFT COLLECTIONS & BILLING */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gross Sales Invoiced</span>
              <div className="flex items-baseline">
                <span className="text-base font-extrabold text-slate-900 font-mono">Rs. {totalGrossSales.toLocaleString()}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Customer Discounts</span>
              <div className="flex items-baseline">
                <span className="text-base font-extrabold text-amber-600 font-mono">-Rs. {totalDiscounts.toLocaleString()}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: totalGrossSales > 0 ? `${Math.min(100, (totalDiscounts/totalGrossSales)*100)}%` : '0%' }} />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Sales Refunds</span>
              <div className="flex items-baseline">
                <span className="text-base font-extrabold text-rose-600 font-mono">-Rs. {totalReturnsPaid.toLocaleString()}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: totalGrossSales > 0 ? `${Math.min(100, (totalReturnsPaid/totalGrossSales)*100)}%` : '0%' }} />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Net Revenue Mapped</span>
              <div className="flex items-baseline">
                <span className="text-base font-extrabold text-teal-600 font-mono">Rs. {(totalNetSales - totalReturnsPaid).toLocaleString()}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Daily Collection Reconciliation Card */}
          {(() => {
            const coll = getDailyCollectionReport();
            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                      <Coins className="w-4.5 h-4.5 text-emerald-500 mr-1.5 shrink-0" />
                      Clinic Shift collections reconciliation
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reconciliation of clinical & pharmacy collections split by core product streams.</p>
                  </div>
                  <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-black px-2.5 py-1 rounded-lg">
                    Dual Audit Track
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border p-3.5 rounded-xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Medicine</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Clinical Sourcing</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-2">Rs. {coll.clinicalMedicineSales.toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-50 border p-3.5 rounded-xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">File Payment</span>
                    <span className="text-xs text-slate-400 block mt-0.5">OPD Cards Sourcing</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-2">Rs. {coll.consultancyCollection.toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-50 border p-3.5 rounded-xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Consultation/Appointment fee</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Doctor Consultancy/Appointments</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-2">Rs. {coll.appointmentCollection.toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-50 border p-3.5 rounded-xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Sale of Patent Medicine</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Patent Sourcing</span>
                    <p className="text-base font-black text-slate-900 font-mono mt-2">Rs. {coll.patentMedicineSales.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-3 flex justify-between items-center text-xs font-sans">
                  <span className="font-extrabold uppercase tracking-widest text-slate-400 text-[9px]">Sum Cumulative shift collection</span>
                  <span className="font-bold text-sm font-mono text-emerald-400">Rs. {coll.totalCollection.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          {/* Invoices List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[420px] print:h-auto print:overflow-visible">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0 print:hidden">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Processed Retail Invoices</span>
                <p className="text-[10px] text-slate-400 font-medium">Detailed list of retail checkout transactions in this duration.</p>
              </div>
              <button
                onClick={() => setInvoicesPrintModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-sm flex items-center transition cursor-pointer"
              >
                <Printer className="w-3 h-3 mr-1" />
                Print List
              </button>
            </div>

            <div className="flex-1 overflow-auto print:overflow-visible">
              {filteredInvoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-1">
                  <FileText className="w-8 h-8 text-slate-200" />
                  <span className="text-xs font-bold">No Invoices Found</span>
                  <p className="text-xxs text-slate-400">Try changing the duration preset filters to find historical records.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-xxs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 font-bold text-left uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Invoice No</th>
                      <th className="px-4 py-3">Billing Date</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">OPD Shift</th>
                      <th className="px-4 py-3 text-right">Gross Amount</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Net Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-600">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.InvoiceNo} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{inv.InvoiceNo}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-500">{inv.InvoiceDate}</td>
                        <td className="px-4 py-2.5 text-slate-800">{getPatientName(inv.PatientID)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            inv.shift === 2 ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-amber-50 text-amber-700 border border-amber-150'
                          }`}>
                            {inv.shift === 2 ? 'Evening' : 'Morning'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[9.5px]">Rs. {inv.GAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-600 text-[9.5px]">-Rs. {inv.Discount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-extrabold text-slate-950 text-[10px]">Rs. {inv.NetAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: PROFIT & LOSS GAAP SHEET */}
      {activeReportTab === 'pl' && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6 print:p-0 print:border-0 print:shadow-none animate-fadeIn" id="pl-statement-frame">
          
          {/* Statement Header */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-center space-x-1.5">
              <Award className="w-5 h-5 text-slate-900" />
              <h3 className="text-sm font-black text-slate-950 tracking-widest uppercase">PUNJAB HOMEOPATHIC CLINIC</h3>
            </div>
            <p className="text-xs font-black text-slate-800 tracking-wider uppercase">Statement of Profit & Loss (Audited Income Statement)</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              REPORTING TIME WINDOW: <span className="font-mono text-slate-800 font-extrabold">
                {datePreset === 'daily' && 'TODAY ONLY'}
                {datePreset === 'weekly' && 'LAST 7 DAYS'}
                {datePreset === 'monthly' && 'LAST 30 DAYS'}
                {datePreset === 'yearly' && 'LAST 365 DAYS'}
                {datePreset === 'custom' && `${startDate} to ${endDate}`}
              </span>
            </p>
          </div>

          {/* Statement Sheet Grid Layout */}
          <div className="text-xs text-slate-800 space-y-4 font-sans">
            
            {/* 1. REVENUES */}
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-300 pb-1">
                <span className="font-extrabold text-slate-900 uppercase">1. Gross Operating Revenues</span>
                <span className="font-bold text-slate-400">Amount (Rs.)</span>
              </div>
              
              {/* MORNING SHIFT */}
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between font-extrabold text-slate-800 text-[10.5px]">
                  <span>🌅 Morning Shift Revenues (Sh-1)</span>
                  <span className="font-mono">Rs. {pl.totalMorningRevenue.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[10px] font-semibold">
                  <div className="flex justify-between">
                    <span>Morning OPD Ticket Registrations (401101)</span>
                    <span className="font-mono">Rs. {pl.morningAppRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morning Clinical Dispensation (401102)</span>
                    <span className="font-mono">Rs. {pl.morningClinicalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morning Patent Medicine Sales (401103)</span>
                    <span className="font-mono">Rs. {pl.morningPatentRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morning Store Retail Sales (401104)</span>
                    <span className="font-mono">Rs. {pl.morningStoreRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Morning File & Card Registration Fees (401105)</span>
                    <span className="font-mono">Rs. {pl.morningFileCardRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* EVENING SHIFT */}
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between font-extrabold text-slate-800 text-[10.5px]">
                  <span>🌃 Evening Shift Revenues (Sh-2)</span>
                  <span className="font-mono">Rs. {pl.totalEveningRevenue.toLocaleString()}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500 text-[10px] font-semibold">
                  <div className="flex justify-between">
                    <span>Evening OPD Ticket Registrations (401201)</span>
                    <span className="font-mono">Rs. {pl.eveningAppRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening Clinical Dispensation (401202)</span>
                    <span className="font-mono">Rs. {pl.eveningClinicalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening Patent Medicine Sales (401203)</span>
                    <span className="font-mono">Rs. {pl.eveningPatentRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening Store Retail Sales (401204)</span>
                    <span className="font-mono">Rs. {pl.eveningStoreRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening File & Card Registration Fees (401205)</span>
                    <span className="font-mono">Rs. {pl.eveningFileCardRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* OTHER SHARED REVENUES */}
              <div className="pl-2 space-y-1 text-[10.5px] font-semibold">
                {pl.labTestRevenue > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Diagnostics & Lab Services Revenue (401002)</span>
                    <span className="font-mono">Rs. {pl.labTestRevenue.toLocaleString()}</span>
                  </div>
                )}
                {pl.totalLegacyRevenue > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>General / Legacy Unmapped Revenues (401001/402001)</span>
                    <span className="font-mono">Rs. {pl.totalLegacyRevenue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-extrabold border-b border-dashed border-slate-200 py-1.5 pl-2 text-[11px]">
                <span>Total Gross Revenue</span>
                <span className="font-mono text-slate-900">Rs. {pl.grossRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 2. REVENUE DEDUCTIONS */}
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-300 pb-1">
                <span className="font-extrabold text-slate-900 uppercase">2. Less: Sales Deductions & Adjustments</span>
              </div>
              
              <div className="pl-4 space-y-1 font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Pharmacy Customer Discounts Allowed (501002)</span>
                  <span className="font-mono">Rs. {pl.pharmacyDiscounts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pharmacy Sales Return Refunds Paid (501003)</span>
                  <span className="font-mono">Rs. {pl.salesReturnsReversals.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between font-extrabold bg-slate-100 p-2 border-y border-slate-300">
                <span>NET REALIZED CLINICAL REVENUE</span>
                <span className="font-mono text-slate-950">Rs. {pl.netRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* 3. COST OF GOODS SOLD */}
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-300 pb-1">
                <span className="font-extrabold text-slate-900 uppercase">3. Cost of Goods Sold</span>
              </div>
              
              <div className="pl-4 flex justify-between text-slate-600 font-semibold">
                <span>Stock Capital Consumption COGS (501001)</span>
                <span className="font-mono">Rs. {pl.pharmacyCOGS.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-extrabold bg-slate-100 p-2 border-y border-slate-300">
                <span>GROSS OPERATING PROFIT</span>
                <span className="font-mono text-teal-800">Rs. {pl.grossProfit.toLocaleString()}</span>
              </div>
            </div>

            {/* 4. OPERATING EXPENSES */}
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-300 pb-1">
                <span className="font-extrabold text-slate-900 uppercase">4. Operating & Administrative Expenses</span>
              </div>
              
              <div className="pl-4 space-y-1 font-semibold text-slate-600">
                {pl.expensesList.map((exp, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{exp.name} (Code: {exp.code})</span>
                    <span className="font-mono">Rs. {exp.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-extrabold border-b border-dashed border-slate-200 py-1.5 pl-2 text-[11px]">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-slate-900">Rs. {pl.totalOperatingExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* 5. NET PROFIT / LOSS WITH DOUBLE GAAP UNDERLINE */}
            <div className="pt-4 shrink-0">
              <div className="flex justify-between items-center p-4 bg-slate-950 text-white rounded-xl border border-slate-900 shadow-md">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Ledger Audited Outcome</span>
                  <span className="font-black text-xs uppercase tracking-wider">NET CLINIC SURPLUS / (DEFICIT)</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-emerald-400 border-b-4 border-double border-emerald-500 pb-0.5 block">
                    Rs. {pl.netProfitLoss.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Statement Footer footnote */}
          <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-200 flex justify-between font-semibold">
            <span>Prepared on: {new Date().toLocaleDateString()}</span>
            <span className="font-bold">PHC Clinic Accounts Department</span>
            <span>Audit Ref: PCMS-PL-2026</span>
          </div>

          {/* Print controls */}
          <div className="pt-4 flex justify-end space-x-2 print:hidden border-t border-slate-100">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xxs uppercase tracking-wider rounded-xl flex items-center shadow-md cursor-pointer transition"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Print Financial Statement
            </button>
          </div>

        </div>
      )}

      {/* VIEW 3: LEDGER AUDIT JOURNAL LOGS */}
      {activeReportTab === 'gl_audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn" id="gl-audit-tab">
          <div className="border-b pb-3 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950 flex items-center">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 mr-2" />
                Unified Double-Entry General Ledger Audit Trail
              </h3>
              <p className="text-xxs text-slate-400 mt-0.5">View and cross-reference all ledger entries stored in the database for the selected reporting period.</p>
            </div>

            {/* Search Input */}
            <div className="relative print:hidden">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by Voucher, Code, Account..."
                value={glSearchQuery}
                onChange={(e) => setGlSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xxs font-semibold border border-slate-200 rounded-lg w-56 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Postings Table */}
          <div className="overflow-x-auto h-[450px]">
            {filteredGlPostings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 space-y-1">
                <BookOpen className="w-8 h-8 text-slate-200" />
                <span className="text-xs font-bold">No Audit Log Postings Found</span>
                <p className="text-xxs text-slate-400">No transactions matched your search or period selection.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-xxs">
                <thead className="bg-slate-50 sticky top-0 text-slate-500 font-bold text-left uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Tx Log ID</th>
                    <th className="px-4 py-3">Voucher No</th>
                    <th className="px-4 py-3">Tx Date</th>
                    <th className="px-4 py-3">Account Code & Title</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Credit</th>
                    <th className="px-4 py-3">Remarks Narrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-600">
                  {filteredGlPostings.map((log) => {
                    const accName = tlAccounts.find(a => a.TLID === log.TLID)?.TLName || 'Operational Account';
                    return (
                      <tr key={log.ACLedgerID} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-2.5 font-mono text-slate-400 text-[9px]">{log.ACLedgerID}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {log.VchNo}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[9px]">{log.TxDate}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-slate-800 text-[10.5px]">{accName}</p>
                          <p className="text-[8px] font-mono text-slate-400">Code: {log.TLID}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-600 font-bold text-[9.5px]">
                          {log.Debit > 0 ? `Rs. ${log.Debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-red-600 font-bold text-[9.5px]">
                          {log.Credit > 0 ? `Rs. ${log.Credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 italic text-[10px] font-medium max-w-xs truncate">
                          "{log.Remarks}"
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: CASH AUDIT & GRID-VIEW ANALYZER */}
      {activeReportTab === 'grid_view' && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn animate-duration-300" id="grid-view-tab">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Grid className="w-4.5 h-4.5 text-purple-600 mr-2" />
                Comprehensive Cash Audit & Grid-View Analyzer
              </h3>
              <p className="text-xxs text-slate-500 mt-0.5">
                Audit and cross-reference Store Sales, Appointments, Clinical Medicines, and File Payments by Morning & Evening shifts.
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                onClick={handleOpenDailyCollectionModal}
                className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer border border-purple-600"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Daily Collection
              </button>
              <button
                onClick={() => setStatementPrintModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Shift Statement
              </button>
              <button
                onClick={() => setGridPrintModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Grid Analyzer
              </button>
              <button
                onClick={handleCleanPrintGridViewReport}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1 text-purple-300" />
                Clean Print (New Tab)
              </button>
              <button
                onClick={() => {
                  const stmt = {
                    _id: `REP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    reportDate: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString(),
                    datePreset,
                    startDate: datePreset === 'custom' ? startDate : undefined,
                    endDate: datePreset === 'custom' ? endDate : undefined,
                    shiftFilter: selectedShiftFilter,
                    categoryFilter: selectedCategoryFilter,
                    summary: {
                      storeSalesTotal,
                      storeSalesCount,
                      appointmentsTotal,
                      appointmentsCount,
                      clinicalTotal,
                      clinicalCount,
                      filePaymentsTotal,
                      filePaymentsCount,
                      grandTotal: grandTotalGridAmount
                    },
                    items: filteredGridItems
                  };
                  handleSaveStatementToDb(stmt);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Save & Post to DB
              </button>
            </div>
          </div>

          {/* Status banner */}
          {saveStatus && (
            <div className="bg-purple-50 text-purple-800 border border-purple-200 p-3 rounded-xl text-xxs font-bold animate-pulse">
              {saveStatus}
            </div>
          )}

          {/* Filters Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-2xs print:hidden">
            {/* Search Input */}
            <div className="relative">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Search Audit Items</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="ID, patient name, narrative..."
                  value={gridSearchQuery}
                  onChange={(e) => setGridSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xxs font-bold border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-purple-500 focus:outline-none bg-slate-50"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Transaction Category</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
                className="py-1.5 px-2 text-xxs font-bold border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-purple-500 focus:outline-none bg-slate-50"
              >
                <option value="all">All Categories</option>
                <option value="store_sale">Store Patent Medicine Sales</option>
                <option value="appointment">OPD Appointments</option>
                <option value="clinical_medicine">Clinical Medicine Payments</option>
                <option value="file_payment">File Creation Payments</option>
              </select>
            </div>

            {/* Shift Filter */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Work Shift Group</span>
              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value as any)}
                className="py-1.5 px-2 text-xxs font-bold border border-slate-200 rounded-lg w-full focus:ring-1 focus:ring-purple-500 focus:outline-none bg-slate-50"
              >
                <option value="all">All Shifts (Morning & Evening)</option>
                <option value="morning">Morning Shift (08:00 - 14:00)</option>
                <option value="evening">Evening Shift (17:00 - 21:00)</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setGridSearchQuery('');
                  setSelectedCategoryFilter('all');
                  setSelectedShiftFilter('all');
                }}
                className="py-1.5 text-xxs font-black uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg w-full transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Bento Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Store Sales */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Store Medicine Sales</span>
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 block">Rs. {storeSalesTotal.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{storeSalesCount} Transactions</span>
              </div>
            </div>

            {/* Card 2: Appointments */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">OPD Appointments</span>
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 block">Rs. {appointmentsTotal.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{appointmentsCount} Bookings</span>
              </div>
            </div>

            {/* Card 3: Clinical Medicines */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Clinical Medicines</span>
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 block">Rs. {clinicalTotal.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{clinicalCount} Dispensings</span>
              </div>
            </div>

            {/* Card 4: File Payments */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">File Payments</span>
              <div className="mt-1">
                <span className="text-xs font-black text-slate-900 block">Rs. {filePaymentsTotal.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{filePaymentsCount} Creation Fees</span>
              </div>
            </div>

            {/* Card 5: Grand Cash Collection */}
            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-600 to-indigo-600 p-3.5 rounded-xl border border-purple-500 shadow-3xs text-white hover:brightness-105 transition flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-200 block">Consolidated Collection</span>
              <div className="mt-1">
                <span className="text-sm font-black block">Rs. {grandTotalGridAmount.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-purple-100 bg-purple-700/50 px-1.5 py-0.5 rounded mt-1 inline-block">Total {filteredGridItems.length} Logs</span>
              </div>
            </div>
          </div>

          {/* Split Layout: Grid Rows Table vs Saved Statements DB Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Grid Table (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xxs font-black uppercase tracking-wider text-slate-800">Audit Grid-View Transactions</span>
                  <button
                    onClick={() => setGridPrintModalOpen(true)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-2xs flex items-center transition cursor-pointer"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print
                  </button>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{filteredGridItems.length} matched records</span>
              </div>

              <div className="overflow-x-auto max-h-[420px]">
                {filteredGridItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <Grid className="w-10 h-10 text-slate-200" />
                    <span className="text-xs font-bold">No Transaction Logs Found</span>
                    <p className="text-xxs text-slate-400">Try modifying your shift/category filters or selected period.</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-100 text-xxs text-left">
                    <thead className="bg-slate-50 sticky top-0 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Tx Log ID</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Patient Account</th>
                        <th className="px-4 py-3">Shift</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Details / Narrative</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-600">
                      {filteredGridItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-2.5 font-mono text-slate-400 text-[9px]">{item.id}</td>
                          <td className="px-4 py-2.5 font-mono text-[9px]">{item.date}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold tracking-wide ${
                              item.type === 'Store Sale' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              item.type === 'Appointment' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              item.type === 'Clinical Medicine' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-bold text-slate-800 text-[10.5px]">{item.patientName}</p>
                            <p className="text-[8px] font-mono text-slate-400">ID: {item.patientId}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold ${
                              item.shiftNum === 1 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            }`}>
                              {item.shift}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-800 font-bold text-[10px]">
                            Rs. {item.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 italic text-[10px] font-medium max-w-xs truncate">
                            {item.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RIGHT: Saved Reports Database Log (1/3 width) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col space-y-4 shadow-2xs">
              <div>
                <h4 className="text-xxs font-black uppercase tracking-wider text-slate-800 flex items-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                  Database Audit Log History
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Stored Printable financial statements inside MongoDB.</p>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
                {savedReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xxs font-bold">
                    No saved reports found in database.
                  </div>
                ) : (
                  savedReports.map((report) => (
                    <div
                      key={report._id}
                      onClick={() => setSelectedHistoricalReport(report)}
                      className="p-3 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl transition cursor-pointer flex flex-col space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-purple-600 font-bold">{report._id}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{report.reportDate}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500">
                        <div>Period: <span className="font-bold text-slate-700 uppercase">{report.datePreset}</span></div>
                        <div>Shift: <span className="font-bold text-slate-700 uppercase">{report.shiftFilter}</span></div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 mt-0.5">
                        <span className="text-[10px] font-black text-slate-800">Rs. {report.summary?.grandTotal?.toLocaleString() || 0}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHistoricalReport(report);
                            }}
                            className="text-[8.5px] font-black text-purple-600 hover:underline cursor-pointer"
                          >
                            View Stmt
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={(e) => handleDeleteSavedReport(report._id, e)}
                            className="text-[8.5px] font-black text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 5: VENDOR ACCOUNT STATEMENT */}
      {activeReportTab === 'vendor_statement' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn" id="vendor-statement-tab">
          
          {/* Header & Controls */}
          <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                Vendor Account Statement & Payable Ledger
              </h3>
              <p className="text-xxs text-slate-500 mt-1">
                Synchronized statement of Goods Received Notes (GRNs), vendor payments, and General Ledger accounts payable balance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 print:hidden">
              <button
                onClick={() => setShowRecordPaymentModal(true)}
                disabled={!selectedVendor}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => setShowAddVendorModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vendor</span>
              </button>

              <button
                onClick={handleDeleteSelectedVendor}
                disabled={!selectedVendor}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={fetchVendorStatementData}
                disabled={vendorLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${vendorLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setVendorPrintModalOpen(true)}
                disabled={!selectedVendor}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Supplier Selector Banner */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                {selectedVendor?.VendorName ? selectedVendor.VendorName.charAt(0).toUpperCase() : 'V'}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Select Vendor / Supplier ({erpVendors.length} Total):
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="mt-0.5 bg-white text-slate-900 font-extrabold text-xs rounded-lg px-3 py-1.5 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer min-w-[280px]"
                >
                  {erpVendors.length === 0 ? (
                    <option value="">No Vendors Found in Database</option>
                  ) : (
                    erpVendors.map(v => (
                      <option key={v.VendorID || v._id} value={v.VendorID || v._id}>
                        {v.VendorName} ({v.VendorID || v.SID || 'N/A'}) - Bal: Rs. {(v.Balance || 0).toLocaleString()}
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
                  <span className="font-extrabold text-slate-900">{selectedVendor.ContactPerson || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Phone Number</span>
                  <span className="font-extrabold text-slate-900">{selectedVendor.Phone || 'N/A'}</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200/80 text-slate-700 shadow-2xs">
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Tax / NTN No</span>
                  <span className="font-mono font-extrabold text-slate-900">{selectedVendor.TaxID || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statement Date Range Filter Pills */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Statement Ledger Period:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setVendorDateFilter(filterKey)}
                  className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer capitalize ${
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
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Total Invoiced / Goods Received (GRN)
              </span>
              <p className="text-xl font-black text-slate-900">
                Rs. {vendorStatement.totalInvoiced.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Sum of all approved purchases in period
              </span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                Total Payments Cleared
              </span>
              <p className="text-xl font-black text-emerald-700">
                Rs. {vendorStatement.totalPaid.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">
                Sum of settled bank & cash payment vouchers
              </span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
                Current Outstanding Payable Balance
              </span>
              <p className="text-xl font-black text-amber-700">
                Rs. {vendorStatement.closingBalance.toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">
                Accounts payable balance owed to supplier
              </span>
            </div>
          </div>

          {/* Outstanding GRN Payment Voucher Settlement Trail & Drill-Down Section */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                  GRN Payment Voucher Settlement Audit Trail & Linked Vouchers
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Click any Goods Received Note (GRN) to inspect linked bank & cash payment vouchers, settlement history, and audit trail.
                </p>
              </div>

              {/* GRN Status Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 self-start sm:self-auto">
                <button
                  onClick={() => setGrnFilter('all')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded transition cursor-pointer ${
                    grnFilter === 'all' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All GRNs ({vendorStatement.grnAuditList?.length || 0})
                </button>
                <button
                  onClick={() => setGrnFilter('outstanding')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded transition cursor-pointer ${
                    grnFilter === 'outstanding' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Outstanding ({vendorStatement.grnAuditList?.filter(g => g.netDue > 0).length || 0})
                </button>
                <button
                  onClick={() => setGrnFilter('settled')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded transition cursor-pointer ${
                    grnFilter === 'settled' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Settled ({vendorStatement.grnAuditList?.filter(g => g.netDue === 0).length || 0})
                </button>
              </div>
            </div>

            {/* GRN Audit List */}
            {(!vendorStatement.grnAuditList || vendorStatement.grnAuditList.length === 0) ? (
              <div className="p-6 text-center text-slate-400 text-xs font-bold bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                No Goods Received Notes (GRNs) found for {selectedVendor?.VendorName || 'this vendor'}.
              </div>
            ) : (
              <div className="space-y-3">
                {vendorStatement.grnAuditList
                  .filter(grn => {
                    if (grnFilter === 'outstanding') return grn.netDue > 0;
                    if (grnFilter === 'settled') return grn.netDue === 0;
                    return true;
                  })
                  .map(grn => {
                    const isExpanded = expandedGrnId === grn.grnId;
                    const percentPaid = grn.grnCost > 0 ? Math.min(100, Math.round((grn.settledAmount / grn.grnCost) * 100)) : 0;

                    return (
                      <div
                        key={grn.grnId}
                        className={`bg-slate-800/90 rounded-xl border transition-all duration-200 overflow-hidden ${
                          isExpanded ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {/* Header Row / Summary */}
                        <div
                          onClick={() => setExpandedGrnId(isExpanded ? null : grn.grnId)}
                          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg shrink-0 ${
                              grn.settlementStatus === 'settled'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : grn.settlementStatus === 'partial'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              <FileText className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-extrabold text-white text-xs">{grn.grnId}</span>
                                <span className="text-xxs text-slate-400 font-mono">PO #{grn.poId}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  grn.settlementStatus === 'settled'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : grn.settlementStatus === 'partial'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {grn.settlementStatus === 'settled' ? 'Fully Settled' : grn.settlementStatus === 'partial' ? 'Partially Paid' : 'Outstanding'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Recd: <strong className="text-slate-200">{formatReportDate(grn.grnDateStr)}</strong> • Due: <strong className="text-slate-200">{formatReportDate(grn.dueDateStr)}</strong> ({grn.terms}d terms) • {grn.itemsCount} Items
                              </p>
                            </div>
                          </div>

                          {/* Amounts & Expand CTA */}
                          <div className="flex items-center justify-between md:justify-end space-x-4 border-t md:border-t-0 border-slate-700/60 pt-2 md:pt-0">
                            <div className="text-right">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                                GRN Bill / Paid
                              </span>
                              <span className="text-xs font-mono font-bold text-white">
                                Rs. {grn.grnCost.toLocaleString()} <span className="text-emerald-400">/ Rs. {grn.settledAmount.toLocaleString()}</span>
                              </span>
                            </div>

                            <div className="text-right border-l border-slate-700 pl-4">
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                                Net Payable
                              </span>
                              <span className={`text-xs font-mono font-black ${grn.netDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                Rs. {grn.netDue.toLocaleString()}
                              </span>
                            </div>

                            <button className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition shrink-0 cursor-pointer">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 h-1">
                          <div
                            className={`h-1 transition-all duration-300 ${
                              percentPaid === 100 ? 'bg-emerald-500' : percentPaid > 0 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>

                        {/* Expandable Drill-Down Panel */}
                        {isExpanded && (
                          <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center">
                                <Coins className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                                Linked Payment Vouchers & Settlement Audit Trail ({grn.linkedVouchers.length})
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Settlement Progress: <strong className="text-white">{percentPaid}% Paid</strong>
                              </span>
                            </div>

                            {grn.linkedVouchers.length === 0 ? (
                              <div className="p-4 text-center text-slate-400 text-xxs font-medium bg-slate-900 rounded-lg border border-dashed border-slate-800">
                                No payment vouchers recorded against this GRN yet. Total outstanding balance remains <strong className="text-amber-400 font-mono">Rs. {grn.netDue.toLocaleString()}</strong>.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-slate-800">
                                <table className="w-full text-left text-[11px] font-sans">
                                  <thead>
                                    <tr className="bg-slate-900 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                                      <th className="p-2">Voucher / Ref #</th>
                                      <th className="p-2">Voucher Date</th>
                                      <th className="p-2">Payment Channel</th>
                                      <th className="p-2">Description / Remarks</th>
                                      <th className="p-2 text-right text-emerald-400">Paid Amount</th>
                                      <th className="p-2 text-center">Posted By</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
                                    {grn.linkedVouchers.map((v, vi) => (
                                      <tr key={vi} className="hover:bg-slate-800/50">
                                        <td className="p-2 font-mono font-bold text-emerald-300">{v.voucherNo}</td>
                                        <td className="p-2 font-mono text-slate-300">{formatReportDate(v.date)}</td>
                                        <td className="p-2">
                                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[9.5px] font-extrabold border border-slate-700">
                                            {v.paymentMethod}
                                          </span>
                                        </td>
                                        <td className="p-2 text-slate-400 max-w-xs truncate">{v.description}</td>
                                        <td className="p-2 text-right font-mono font-black text-emerald-400">
                                          Rs. {v.amount.toLocaleString()}
                                        </td>
                                        <td className="p-2 text-center text-[10px] text-slate-500">{v.createdBy}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-900 font-extrabold text-slate-200 text-[10px]">
                                      <td colSpan={4} className="p-2 text-right uppercase tracking-wider">Total Settled via Vouchers:</td>
                                      <td className="p-2 text-right font-mono font-black text-emerald-300">
                                        Rs. {grn.settledAmount.toLocaleString()}
                                      </td>
                                      <td className="p-2 text-center">
                                        {grn.netDue === 0 ? (
                                          <span className="text-emerald-400 font-bold">FULL CLEARED</span>
                                        ) : (
                                          <span className="text-amber-400 font-bold">BAL DUE: Rs. {grn.netDue.toLocaleString()}</span>
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Statement Detail Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center">
                <FileText className="w-4 h-4 text-slate-600 mr-1.5" />
                Chronological Statement Ledger
              </span>
              <span className="text-[10px] text-slate-500 font-normal normal-case">
                Click <span className="font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">Drill-Down Vouchers</span> on GRN rows to inspect linked payment vouchers.
              </span>
            </h4>

            {vendorLoading ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs animate-pulse">
                Loading vendor statement ledger...
              </div>
            ) : vendorStatement.statementRows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No statement records found for {selectedVendor?.VendorName || 'selected vendor'} in the chosen period.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9.5px] font-black tracking-wider">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Ref / Voucher #</th>
                      <th className="p-3">Description & Voucher Drill-Down</th>
                      <th className="p-3 text-right text-emerald-300">Debit (Paid)</th>
                      <th className="p-3 text-right text-amber-300">Credit (Bill)</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-center print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {vendorStatement.statementRows.map((row, idx) => {
                      const isGrn = row.type.includes('GRN');
                      const grnAudit = row.audit;
                      const isRowExpanded = expandedGrnId === row.refNo;

                      return (
                        <React.Fragment key={idx}>
                          <tr className={`hover:bg-slate-50/80 transition ${isRowExpanded ? 'bg-amber-50/40' : ''}`}>
                            <td className="p-3 font-mono text-slate-600 font-medium">{formatReportDate(row.date)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                row.type.includes('Payment') 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {row.refNo}
                            </td>
                            <td className="p-3 text-slate-700 max-w-xs">
                              <div>{row.description}</div>
                              {isGrn && grnAudit && (
                                <button
                                  onClick={() => setExpandedGrnId(isRowExpanded ? null : row.refNo)}
                                  className="mt-1.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded font-black transition flex items-center shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 mr-1 text-amber-700" />
                                  {isRowExpanded ? 'Hide Payment Vouchers' : `Drill-Down Payment Vouchers (${grnAudit.linkedVouchers.length})`}
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">
                              {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-amber-700">
                              {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">
                              Rs. {row.runningBalance.toLocaleString()}
                            </td>
                            <td className="p-3 text-center print:hidden">
                              {!isGrn && row.rawId && (
                                <button
                                  onClick={() => handleDeleteTransaction(row.rawId)}
                                  title="Delete payment transaction"
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Payment Voucher Drill-Down Row inside Statement Table */}
                          {isGrn && grnAudit && isRowExpanded && (
                            <tr className="bg-slate-950 text-white animate-fadeIn">
                              <td colSpan={8} className="p-4 border-t border-b border-amber-500/40">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <div className="flex items-center space-x-2">
                                      <Coins className="w-4 h-4 text-emerald-400" />
                                      <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                                        Linked Payment Vouchers Audit Trail for {row.refNo}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs">
                                      <span className="text-slate-400">Total Bill: <strong className="text-white font-mono">Rs. {grnAudit.grnCost.toLocaleString()}</strong></span>
                                      <span className="text-slate-400">Paid via Vouchers: <strong className="text-emerald-400 font-mono">Rs. {grnAudit.settledAmount.toLocaleString()}</strong></span>
                                      <span className="text-slate-400">Net Due: <strong className="text-amber-400 font-mono">Rs. {grnAudit.netDue.toLocaleString()}</strong></span>
                                    </div>
                                  </div>

                                  {grnAudit.linkedVouchers.length === 0 ? (
                                    <div className="p-3 text-center text-slate-400 text-xs font-medium bg-slate-900 rounded-lg border border-dashed border-slate-800">
                                      No payment vouchers issued for this GRN yet. Total outstanding balance is <strong className="text-amber-400 font-mono">Rs. {grnAudit.netDue.toLocaleString()}</strong>.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                                      <table className="w-full text-left text-[11px] font-sans">
                                        <thead>
                                          <tr className="bg-slate-900 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                                            <th className="p-2">Voucher / Ref #</th>
                                            <th className="p-2">Voucher Date</th>
                                            <th className="p-2">Channel / Method</th>
                                            <th className="p-2">Description / Remarks</th>
                                            <th className="p-2 text-right text-emerald-400">Paid Amount</th>
                                            <th className="p-2 text-center">Posted By</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-300">
                                          {grnAudit.linkedVouchers.map((v, vi) => (
                                            <tr key={vi} className="hover:bg-slate-800/50">
                                              <td className="p-2 font-mono font-bold text-emerald-300">{v.voucherNo}</td>
                                              <td className="p-2 font-mono text-slate-300">{formatReportDate(v.date)}</td>
                                              <td className="p-2">
                                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[9.5px] font-extrabold border border-slate-700">
                                                  {v.paymentMethod}
                                                </span>
                                              </td>
                                              <td className="p-2 text-slate-400 max-w-xs truncate">{v.description}</td>
                                              <td className="p-2 text-right font-mono font-black text-emerald-400">
                                                Rs. {v.amount.toLocaleString()}
                                              </td>
                                              <td className="p-2 text-center text-[10px] text-slate-500">{v.createdBy}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-300 text-slate-900 text-xs">
                      <td colSpan={4} className="p-3 text-right uppercase tracking-wider">Totals / Ending Balance:</td>
                      <td className="p-3 text-right font-mono text-emerald-700">Rs. {vendorStatement.totalPaid.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-amber-700">Rs. {vendorStatement.totalInvoiced.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-950 font-black">Rs. {vendorStatement.closingBalance.toLocaleString()}</td>
                      <td className="p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 6: CASH FLOW FORECASTING DASHBOARD */}
      {activeReportTab === 'cash_flow' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn" id="cash-flow-tab">
          
          {/* Header & Controls */}
          <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <LineChart className="w-5 h-5 text-emerald-600 mr-2" />
                Cash Flow Forecasting & Liquidity Planner
              </h3>
              <p className="text-xxs text-slate-500 mt-1">
                Project upcoming supplier payment obligations (GRNs) against anticipated daily cash revenue receipts from Pharmacy POS and OPD Clinic fees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <button
                onClick={fetchVendorStatementData}
                disabled={vendorLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${vendorLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={() => setCashFlowPrintModalOpen(true)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Forecast</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation & Assumption Controls */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
                <Sliders className="w-4 h-4 mr-1.5 text-emerald-400" />
                Forecast Simulation & Inflow Assumptions
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Historical Avgs: Pharm Rs. {cashForecast.histDailyPharm.toLocaleString()}/day • Clinic Rs. {cashForecast.histDailyClinic.toLocaleString()}/day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              {/* Horizon Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Forecast Horizon
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  {[14, 30, 60, 90].map(days => (
                    <button
                      key={days}
                      onClick={() => setForecastHorizonDays(days)}
                      className={`py-1 text-[10px] font-black rounded transition cursor-pointer ${
                        forecastHorizonDays === days ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Pharmacy Inflow Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pharm Inflow / Day
                  </label>
                  {customPharmInflow !== '' && (
                    <button
                      onClick={() => setCustomPharmInflow('')}
                      className="text-[9px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    value={customPharmInflow}
                    onChange={(e) => setCustomPharmInflow(e.target.value)}
                    placeholder={String(cashForecast.histDailyPharm)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Daily Clinic Inflow Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinic Inflow / Day
                  </label>
                  {customClinicInflow !== '' && (
                    <button
                      onClick={() => setCustomClinicInflow('')}
                      className="text-[9px] text-teal-400 hover:underline cursor-pointer"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    value={customClinicInflow}
                    onChange={(e) => setCustomClinicInflow(e.target.value)}
                    placeholder={String(cashForecast.histDailyClinic)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-teal-300 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Default GRN Terms Override */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Default GRN Terms
                </label>
                <select
                  value={defaultGrnTerms}
                  onChange={(e) => setDefaultGrnTerms(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={15}>15 Days Terms</option>
                  <option value={30}>30 Days Terms</option>
                  <option value={45}>45 Days Terms</option>
                  <option value={60}>60 Days Terms</option>
                </select>
              </div>

              {/* Opening Cash Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Starting Cash
                  </label>
                  {openingCashInput !== '' && (
                    <button
                      onClick={() => setOpeningCashInput('')}
                      className="text-[9px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">Rs.</span>
                  <input
                    type="number"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    placeholder={String(cashForecast.openingCash)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Liquidity Risk Status Banner */}
          {cashForecast.liquidityStatus === 'critical' ? (
            <div className="bg-red-500/10 border-2 border-red-500/40 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-500 text-white rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-red-700 tracking-wider">
                    Critical Liquidity Deficit Warning
                  </h4>
                  <p className="text-xs text-red-800 font-medium mt-0.5">
                    Projected cash reserves drop below zero to <span className="font-mono font-extrabold">Rs. {cashForecast.minCashPoint.toLocaleString()}</span> on <span className="font-bold">{cashForecast.minCashDate.toLocaleDateString('en-GB')}</span> due to concentrated GRN supplier payment obligations.
                  </p>
                  <p className="text-[11px] text-red-600 font-semibold mt-1">
                    Action Required: Request extended 45-60 day terms from suppliers or stagger GRN order schedules.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDefaultGrnTerms(45)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-lg shadow-xs transition cursor-pointer shrink-0"
              >
                Simulate 45-Day Terms
              </button>
            </div>
          ) : cashForecast.liquidityStatus === 'caution' ? (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-800 tracking-wider">
                    Working Capital Buffer Warning
                  </h4>
                  <p className="text-xs text-amber-900 font-medium mt-0.5">
                    Lowest projected cash buffer narrows to <span className="font-mono font-extrabold">Rs. {cashForecast.minCashPoint.toLocaleString()}</span> on <span className="font-bold">{cashForecast.minCashDate.toLocaleDateString('en-GB')}</span>. Ensure daily OPD collections stay above target.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-4.5 rounded-2xl flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                  Healthy Liquidity Position & Surplus Runway
                </h4>
                <p className="text-xs text-emerald-900 font-medium mt-0.5">
                  Anticipated pharmacy POS and clinic OPD cash receipts fully cover all scheduled GRN supplier commitments, maintaining a minimum net cash reserve of <span className="font-mono font-extrabold">Rs. {cashForecast.minCashPoint.toLocaleString()}</span> over the next {forecastHorizonDays} days.
                </p>
              </div>
            </div>
          )}

          {/* Metric KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Total Projected Inflow ({forecastHorizonDays} Days)
              </span>
              <p className="text-xl font-black text-emerald-700">
                Rs. {cashForecast.totalProjectedInflow.toLocaleString()}
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                <span>Pharm: Rs. {(cashForecast.dailyPharm * forecastHorizonDays).toLocaleString()}</span>
                <span>•</span>
                <span>Clinic: Rs. {(cashForecast.dailyClinic * forecastHorizonDays).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Upcoming Supplier Outflows (GRNs)
              </span>
              <p className="text-xl font-black text-amber-700">
                Rs. {cashForecast.totalProjectedOutflow.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                {cashForecast.grnCommitments.length} unpaid supplier purchases
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${
              cashForecast.minCashPoint < 0 
                ? 'bg-red-50 border-red-200' 
                : cashForecast.minCashPoint < cashForecast.totalDailyInflow * 3 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-slate-600">
                Minimum Projected Cash Point
              </span>
              <p className={`text-xl font-black ${
                cashForecast.minCashPoint < 0 ? 'text-red-700' : 'text-slate-900'
              }`}>
                Rs. {cashForecast.minCashPoint.toLocaleString()}
              </p>
              <span className="text-[10px] font-medium text-slate-500">
                Lowest balance on {cashForecast.minCashDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Projected Ending Cash ({forecastHorizonDays}d)
              </span>
              <p className="text-xl font-black text-emerald-400">
                Rs. {cashForecast.projectedEndingCash.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Cumulative net ending balance
              </span>
            </div>
          </div>

          {/* Supplier Payables Aging Commitment Buckets */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
              <Clock className="w-4 h-4 text-amber-600 mr-1.5" />
              Supplier Payables Due Schedule (GRN Aging Buckets)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <span className="text-[9px] font-black text-red-700 uppercase tracking-wider block">
                  Overdue / Immediate
                </span>
                <p className="text-sm font-black text-red-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.overdue.toLocaleString()}
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">
                  1 - 7 Days
                </span>
                <p className="text-sm font-black text-amber-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.days1_7.toLocaleString()}
                </p>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                <span className="text-[9px] font-black text-orange-800 uppercase tracking-wider block">
                  8 - 14 Days
                </span>
                <p className="text-sm font-black text-orange-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.days8_14.toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="text-[9px] font-black text-blue-800 uppercase tracking-wider block">
                  15 - 30 Days
                </span>
                <p className="text-sm font-black text-blue-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.days15_30.toLocaleString()}
                </p>
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block">
                  31 - 60 Days
                </span>
                <p className="text-sm font-black text-indigo-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.days31_60.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider block">
                  61 - 90 Days
                </span>
                <p className="text-sm font-black text-slate-900 mt-1 font-mono">
                  Rs. {cashForecast.agingBuckets.days61_90.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Day-by-Day Forecast Schedule Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 text-emerald-600 mr-1.5" />
                Day-by-Day Cash Flow Projection Schedule
              </span>
              <span className="text-[10px] text-slate-500 font-normal normal-case">
                Daily Inflow: <strong className="text-emerald-700">Rs. {cashForecast.totalDailyInflow.toLocaleString()}</strong> (Pharm Rs. {cashForecast.dailyPharm.toLocaleString()} + Clinic Rs. {cashForecast.dailyClinic.toLocaleString()})
              </span>
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs max-h-96">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead className="sticky top-0 bg-slate-900 text-white uppercase text-[9.5px] font-black tracking-wider z-10">
                  <tr>
                    <th className="p-3">Day / Date</th>
                    <th className="p-3 text-right text-emerald-300">Pharm POS (In)</th>
                    <th className="p-3 text-right text-teal-300">Clinic OPD (In)</th>
                    <th className="p-3 text-right text-emerald-400">Total Receipts</th>
                    <th className="p-3 text-right text-amber-300">GRN Outflow (Due)</th>
                    <th className="p-3 text-right">Net Daily Flow</th>
                    <th className="p-3 text-right">Projected Cash Balance</th>
                    <th className="p-3">GRNs Due Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {cashForecast.dailyTimeline.map((item) => (
                    <tr 
                      key={item.dayIndex} 
                      className={`hover:bg-slate-50 transition ${
                        item.endingCash < 0 ? 'bg-red-50/70 font-semibold' : item.supplierOutflow > 0 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">
                        Day {item.dayIndex + 1} ({item.dateStr})
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-700">
                        Rs. {item.pharmInflow.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-teal-700">
                        Rs. {item.clinicInflow.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800">
                        Rs. {item.totalInflow.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700">
                        {item.supplierOutflow > 0 ? `Rs. ${item.supplierOutflow.toLocaleString()}` : '-'}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        item.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {item.netCashFlow >= 0 ? `+Rs. ${item.netCashFlow.toLocaleString()}` : `-Rs. ${Math.abs(item.netCashFlow).toLocaleString()}`}
                      </td>
                      <td className={`p-3 text-right font-mono font-black ${
                        item.endingCash < 0 ? 'text-red-700' : 'text-slate-950'
                      }`}>
                        Rs. {item.endingCash.toLocaleString()}
                      </td>
                      <td className="p-3 text-xxs">
                        {item.dueGrns.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.dueGrns.map((g, gi) => (
                              <span key={gi} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-mono font-bold border border-amber-200">
                                {g.vendorName}: Rs. {g.netDue.toLocaleString()} ({g.grnId})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No GRNs due</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Supplier Payment Commitments Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center">
                <Building2 className="w-4 h-4 text-amber-600 mr-1.5" />
                Detailed Supplier GRN Payment Commitments ({cashForecast.grnCommitments.length})
              </span>
            </h4>

            {cashForecast.grnCommitments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No unpaid Goods Received Notes (GRNs) found in system. All supplier obligations are settled.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9.5px] font-black tracking-wider">
                      <th className="p-3">Vendor / Supplier</th>
                      <th className="p-3">GRN ID / PO #</th>
                      <th className="p-3">Received Date</th>
                      <th className="p-3">Terms</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right">GRN Total Cost</th>
                      <th className="p-3 text-right text-emerald-300">Paid Amount</th>
                      <th className="p-3 text-right text-amber-300">Net Due Amount</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {cashForecast.grnCommitments.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-extrabold text-slate-900">{c.vendorName}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{c.grnId} <span className="text-slate-400 text-[10px]">({c.poId})</span></td>
                        <td className="p-3 font-mono text-slate-600">{formatReportDate(c.grnDate.toISOString())}</td>
                        <td className="p-3 font-bold text-slate-700">{c.terms} Days</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{formatReportDate(c.dueDate.toISOString())}</td>
                        <td className="p-3 text-right font-mono text-slate-800">Rs. {c.grnCost.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">Rs. {c.payments.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-black text-amber-700">Rs. {c.netDue.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            c.daysUntilDue < 0 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : c.daysUntilDue <= 7 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {c.daysUntilDue < 0 
                              ? `Overdue (${Math.abs(c.daysUntilDue)}d)` 
                              : c.daysUntilDue === 0 
                                ? 'Due Today' 
                                : `Due in ${c.daysUntilDue}d`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 7: DAILY COLLECTION SUMMARY REPORT */}
      {activeReportTab === 'daily_collection' && (() => {
        const dailyData = getDailyCollectionReport();
        const itemsList = dailyData.itemizedReceipts.filter(item => {
          const matchesShift = dailyShiftFilter === 'all' || String(item.shift) === dailyShiftFilter;
          const matchesService = dailyServiceFilter === 'all' || item.category.toLowerCase() === dailyServiceFilter;
          return matchesShift && matchesService;
        });

        const morningSharePct = dailyData.grandTotalDailyCash > 0
          ? Math.round((dailyData.morningTotal / dailyData.grandTotalDailyCash) * 100)
          : 0;
        const eveningSharePct = dailyData.grandTotalDailyCash > 0
          ? Math.round((dailyData.eveningTotal / dailyData.grandTotalDailyCash) * 100)
          : 0;

        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn" id="daily-collection-tab">
            {/* Header & Controls */}
            <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Coins className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                      Daily Collection Summary Report
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aggregated daily cash receipts from Pharmacy, OPD, and Clinical services with revenue breakdown by shift.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button
                  onClick={handlePrintDailyCollectionSummary}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print Shift Summary</span>
                </button>
              </div>
            </div>

            {/* Top 4 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Daily Cash Receipts */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Cash Receipts</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                    Rs. {dailyData.grandTotalDailyCash.toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-300">Morning: Rs. {dailyData.morningTotal.toLocaleString()}</span>
                  <span className="text-indigo-300">Evening: Rs. {dailyData.eveningTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Card 2: Pharmacy Collections */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-black uppercase tracking-wider">Pharmacy Receipts</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[9px] rounded-md border border-emerald-150">
                      Store & Patent
                    </span>
                  </div>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    Rs. {dailyData.totalPharmacy.toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Morn: <strong className="text-slate-800">Rs. {dailyData.morningPharmacyTotal.toLocaleString()}</strong></span>
                  <span>Eve: <strong className="text-slate-800">Rs. {dailyData.eveningPharmacyTotal.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Card 3: OPD Services Collections */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-black uppercase tracking-wider">OPD Services Receipts</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[9px] rounded-md border border-amber-150">
                      Tokens & Reg
                    </span>
                  </div>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    Rs. {dailyData.totalOPD.toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Morn: <strong className="text-slate-800">Rs. {dailyData.morningOPDTotal.toLocaleString()}</strong></span>
                  <span>Eve: <strong className="text-slate-800">Rs. {dailyData.eveningOPDTotal.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Card 4: Clinical Services Collections */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-black uppercase tracking-wider">Clinical Services Receipts</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded-md border border-indigo-150">
                      Clinical & Labs
                    </span>
                  </div>
                  <p className="text-xl font-black font-mono text-slate-900 mt-1">
                    Rs. {dailyData.totalClinical.toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Morn: <strong className="text-slate-800">Rs. {dailyData.morningClinicalTotal.toLocaleString()}</strong></span>
                  <span>Eve: <strong className="text-slate-800">Rs. {dailyData.eveningClinicalTotal.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Shift Breakdown Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-emerald-400" />
                    Daily Collection Revenue Matrix By Shift
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Breakdown of revenue streams across Morning Shift (Shift 1) and Evening Shift (Shift 2).
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="text-amber-300 font-bold">Morning: {morningSharePct}%</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-indigo-300 font-bold">Evening: {eveningSharePct}%</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-black uppercase text-[9.5px] tracking-wider border-b border-slate-200">
                      <th className="p-3">Revenue Category & Stream</th>
                      <th className="p-3 text-center">Category</th>
                      <th className="p-3 text-right text-amber-800 bg-amber-50/60">Morning Shift (Shift 1)</th>
                      <th className="p-3 text-right text-indigo-800 bg-indigo-50/60">Evening Shift (Shift 2)</th>
                      <th className="p-3 text-right text-emerald-900 bg-emerald-50/60">Total Daily Receipts</th>
                      <th className="p-3 text-right">% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                    {/* PHARMACY SECTION */}
                    <tr className="bg-slate-50/80 font-black text-slate-900 text-[10px] uppercase">
                      <td colSpan={6} className="p-2.5 px-3 text-emerald-800 flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        1. Pharmacy Services & Medicine Collections
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">Pharmacy POS Retail Invoices</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">Pharmacy</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningPharmacyPOS.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningPharmacyPOS.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningPharmacyPOS + dailyData.eveningPharmacyPOS).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningPharmacyPOS + dailyData.eveningPharmacyPOS) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">Clinic Sourced Patent Medicine</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold">Pharmacy</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningPatentMed.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningPatentMed.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningPatentMed + dailyData.eveningPatentMed).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningPatentMed + dailyData.eveningPatentMed) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/40 font-black text-emerald-950 text-xs border-t border-b border-emerald-200">
                      <td className="p-2.5 pl-6">Subtotal Pharmacy Collections</td>
                      <td className="p-2.5 text-center text-[9px]">SUBTOTAL</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-800">Rs. {dailyData.morningPharmacyTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-800">Rs. {dailyData.eveningPharmacyTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-900">Rs. {dailyData.totalPharmacy.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-800">
                        {dailyData.grandTotalDailyCash > 0 ? (dailyData.totalPharmacy / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>

                    {/* OPD SERVICES SECTION */}
                    <tr className="bg-slate-50/80 font-black text-slate-900 text-[10px] uppercase">
                      <td colSpan={6} className="p-2.5 px-3 text-amber-800 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        2. OPD Registration & Consultation Collections
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">OPD Appointments & Token Fees</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold">OPD</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningAppFees.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningAppFees.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningAppFees + dailyData.eveningAppFees).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningAppFees + dailyData.eveningAppFees) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">OPD File & Registration Card Fees</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold">OPD</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningFileCardFees.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningFileCardFees.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningFileCardFees + dailyData.eveningFileCardFees).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningFileCardFees + dailyData.eveningFileCardFees) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="bg-amber-50/40 font-black text-amber-950 text-xs border-t border-b border-amber-200">
                      <td className="p-2.5 pl-6">Subtotal OPD Collections</td>
                      <td className="p-2.5 text-center text-[9px]">SUBTOTAL</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-800">Rs. {dailyData.morningOPDTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-800">Rs. {dailyData.eveningOPDTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-900">Rs. {dailyData.totalOPD.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-800">
                        {dailyData.grandTotalDailyCash > 0 ? (dailyData.totalOPD / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>

                    {/* CLINICAL SERVICES SECTION */}
                    <tr className="bg-slate-50/80 font-black text-slate-900 text-[10px] uppercase">
                      <td colSpan={6} className="p-2.5 px-3 text-indigo-800 flex items-center">
                        <Award className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                        3. Clinical Services, Procedures & Lab Fees
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">Clinical Medicine Sourcing</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">Clinical</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningClinicalMed.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningClinicalMed.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningClinicalMed + dailyData.eveningClinicalMed).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningClinicalMed + dailyData.eveningClinicalMed) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">Doctor Consultations & Special Procedures</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">Clinical</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningDoctorConsult.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningDoctorConsult.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningDoctorConsult + dailyData.eveningDoctorConsult).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningDoctorConsult + dailyData.eveningDoctorConsult) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-6 font-bold text-slate-800">Laboratory & Diagnostic Test Fees</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold">Clinical</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-700 bg-amber-50/30">Rs. {dailyData.morningLabRevenue.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">Rs. {dailyData.eveningLabRevenue.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-emerald-50/20">Rs. {(dailyData.morningLabRevenue + dailyData.eveningLabRevenue).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {dailyData.grandTotalDailyCash > 0 ? ((dailyData.morningLabRevenue + dailyData.eveningLabRevenue) / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/40 font-black text-indigo-950 text-xs border-t border-b border-indigo-200">
                      <td className="p-2.5 pl-6">Subtotal Clinical Services</td>
                      <td className="p-2.5 text-center text-[9px]">SUBTOTAL</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-800">Rs. {dailyData.morningClinicalTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-800">Rs. {dailyData.eveningClinicalTotal.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-900">Rs. {dailyData.totalClinical.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-black text-indigo-800">
                        {dailyData.grandTotalDailyCash > 0 ? (dailyData.totalClinical / dailyData.grandTotalDailyCash * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                      <td className="p-3.5 pl-6 text-emerald-400 font-extrabold">GRAND TOTAL DAILY CASH RECEIPTS</td>
                      <td className="p-3.5 text-center text-[9px] text-slate-400">TOTAL</td>
                      <td className="p-3.5 text-right font-mono text-amber-300 font-extrabold">Rs. {dailyData.morningTotal.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-indigo-300 font-extrabold">Rs. {dailyData.eveningTotal.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-emerald-400 font-black text-sm">Rs. {dailyData.grandTotalDailyCash.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-emerald-400">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Shift Handover Gauge & Comparison Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-emerald-400" />
                    Shift Handover & Reconciliation Gauge
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Proportional revenue contribution for cashier shift handover verification.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono bg-slate-800 p-2 rounded-xl border border-slate-700">
                  <span className="text-amber-400 font-bold">Morning: Rs. {dailyData.morningTotal.toLocaleString()} ({morningSharePct}%)</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-indigo-400 font-bold">Evening: Rs. {dailyData.eveningTotal.toLocaleString()} ({eveningSharePct}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${morningSharePct}%` }}
                    title={`Morning Shift: ${morningSharePct}%`}
                  />
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${eveningSharePct}%` }}
                    title={`Evening Shift: ${eveningSharePct}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span className="text-amber-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
                    Morning Shift Cashiers
                  </span>
                  <span className="text-indigo-400 flex items-center">
                    Evening Shift Cashiers
                    <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1.5"></span>
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Daily Receipts Audit Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Search className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Itemized Daily Receipts & Voucher Audit Log ({itemsList.length})
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Individual receipts generated across Pharmacy POS, OPD Tokens, and Clinical Sourcing.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Shift Filter */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xxs font-bold">
                    <button
                      onClick={() => setDailyShiftFilter('all')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyShiftFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All Shifts
                    </button>
                    <button
                      onClick={() => setDailyShiftFilter('1')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyShiftFilter === '1' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Morning (Shift 1)
                    </button>
                    <button
                      onClick={() => setDailyShiftFilter('2')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyShiftFilter === '2' ? 'bg-indigo-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Evening (Shift 2)
                    </button>
                  </div>

                  {/* Service Filter */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xxs font-bold">
                    <button
                      onClick={() => setDailyServiceFilter('all')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyServiceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      All Services
                    </button>
                    <button
                      onClick={() => setDailyServiceFilter('pharmacy')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyServiceFilter === 'pharmacy' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Pharmacy
                    </button>
                    <button
                      onClick={() => setDailyServiceFilter('opd')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyServiceFilter === 'opd' ? 'bg-amber-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      OPD
                    </button>
                    <button
                      onClick={() => setDailyServiceFilter('clinical')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        dailyServiceFilter === 'clinical' ? 'bg-indigo-600 text-white font-black' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Clinical
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              {itemsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No receipts found matching the selected shift and service filters.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200">
                        <th className="p-2.5">Receipt / Voucher #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Shift</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Service Line Description</th>
                        <th className="p-2.5">Patient / Client</th>
                        <th className="p-2.5">Payment Method</th>
                        <th className="p-2.5 text-right text-emerald-800">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                      {itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-2.5 font-mono font-bold text-slate-900">{item.receiptNo}</td>
                          <td className="p-2.5 font-mono text-slate-500">{formatReportDate(item.date)}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                              item.shift === 1
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            }`}>
                              {item.shiftLabel}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              item.category === 'Pharmacy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                                : item.category === 'OPD'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-150'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-800 font-semibold">{item.serviceLine}</td>
                          <td className="p-2.5 text-slate-700">{item.patientName}</td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{item.paymentMethod}</td>
                          <td className="p-2.5 text-right font-mono font-extrabold text-slate-950">
                            Rs. {item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                        <td colSpan={7} className="p-3 text-right uppercase tracking-wider">Filtered Receipts Total:</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700">
                          Rs. {itemsList.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* STATEMENT PRINT MODAL (Supports Active & Historical Prints) */}
      {(statementPrintModalOpen || selectedHistoricalReport) && (() => {
        const isHistorical = !!selectedHistoricalReport;
        const activeReport = isHistorical ? selectedHistoricalReport : {
          _id: "CURRENT-DRAFT",
          reportDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          datePreset,
          startDate: datePreset === 'custom' ? startDate : undefined,
          endDate: datePreset === 'custom' ? endDate : undefined,
          shiftFilter: selectedShiftFilter,
          categoryFilter: selectedCategoryFilter,
          summary: {
            storeSalesTotal,
            storeSalesCount,
            appointmentsTotal,
            appointmentsCount,
            clinicalTotal,
            clinicalCount,
            filePaymentsTotal,
            filePaymentsCount,
            grandTotal: grandTotalGridAmount
          },
          items: filteredGridItems
        };

        const reportItems = activeReport.items || [];
        const morningItems = reportItems.filter((i: any) => i.shiftNum === 1);
        const eveningItems = reportItems.filter((i: any) => i.shiftNum === 2);

        const morningSales = morningItems.filter((i: any) => i.type === 'Store Sale');
        const morningApps = morningItems.filter((i: any) => i.type === 'Appointment');
        const morningClinical = morningItems.filter((i: any) => i.type === 'Clinical Medicine');
        const morningFile = morningItems.filter((i: any) => i.type === 'File Payment');

        const eveningSales = eveningItems.filter((i: any) => i.type === 'Store Sale');
        const eveningApps = eveningItems.filter((i: any) => i.type === 'Appointment');
        const eveningClinical = eveningItems.filter((i: any) => i.type === 'Clinical Medicine');
        const eveningFile = eveningItems.filter((i: any) => i.type === 'File Payment');

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
              
              {/* Modal Top Control Bar (Hidden on print) */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {isHistorical ? "Historical Database Report" : "Active Audit Report Preview"}
                  </span>
                  <p className="text-[10px] text-slate-400">Review Shift Statement before initiating physical printer.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTriggerPrint}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Send to Printer
                  </button>
                  <button
                    onClick={() => handleCleanPrintActiveReport(activeReport)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Clean Print (New Tab)
                  </button>
                  <button
                    onClick={() => {
                      setStatementPrintModalOpen(false);
                      setSelectedHistoricalReport(null);
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Printable Body Sheet */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0" id="printable-statement-sheet">
                
                {/* Statement Letterhead Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">PUNJAB HOMEOPATHIC CLINIC (PHC)</h1>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">Comprehensive Financial Audit & Revenue Statement</p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 text-left border border-slate-200 p-3 rounded-lg text-xxs font-semibold">
                    <div>
                      <p className="text-slate-400 uppercase text-[8px] font-black">Report Ref ID</p>
                      <p className="font-mono text-slate-800 font-bold">{activeReport._id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase text-[8px] font-black">Audit Period</p>
                      <p className="font-bold text-slate-800 capitalize">{activeReport.datePreset}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase text-[8px] font-black">Statement Date</p>
                      <p className="font-mono font-bold text-slate-800">{activeReport.reportDate}</p>
                    </div>
                  </div>
                </div>

                {/* 1. MORNING SHIFT SECTION */}
                <div className="space-y-4">
                  <div className="bg-orange-50/70 border-l-4 border-orange-500 p-2.5 flex justify-between items-center print:border-l-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-950">1. MORNING SHIFT REVENUE LOGS (08:00 - 14:00)</span>
                    <span className="text-[10px] font-black text-orange-900">Total Logs: {morningItems.length}</span>
                  </div>

                  {morningItems.length === 0 ? (
                    <p className="text-xxs italic text-slate-400 pl-4">No transactions logged for the Morning Shift during this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Store Sales */}
                      {morningSales.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">A. Store Medicine Sales</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Vch No</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {morningSales.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Store Sales:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {morningSales.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Appointments */}
                      {morningApps.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">B. OPD Appointments Consultation</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Appt ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee Charged</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {morningApps.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Appointments:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {morningApps.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Clinical Medicines */}
                      {morningClinical.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">C. Doctors Clinical Formulations</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Visit ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {morningClinical.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Clinical Medicines:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {morningClinical.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* File Payments */}
                      {morningFile.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">D. Cards & File Registrations</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Ref ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {morningFile.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal File Payments:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {morningFile.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Total Morning Shift Card */}
                      <div className="flex justify-end pt-2">
                        <div className="bg-slate-50 border border-slate-300 p-2 rounded text-right w-64">
                          <span className="text-[9px] font-black text-slate-500 uppercase block">MORNING SHIFT TOTAL REVENUE</span>
                          <span className="font-mono text-xs font-black text-slate-950">Rs. {morningItems.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. EVENING SHIFT SECTION */}
                <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
                  <div className="bg-indigo-50/70 border-l-4 border-indigo-500 p-2.5 flex justify-between items-center print:border-l-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-950">2. EVENING SHIFT REVENUE LOGS (17:00 - 21:00)</span>
                    <span className="text-[10px] font-black text-indigo-900">Total Logs: {eveningItems.length}</span>
                  </div>

                  {eveningItems.length === 0 ? (
                    <p className="text-xxs italic text-slate-400 pl-4">No transactions logged for the Evening Shift during this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Store Sales */}
                      {eveningSales.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">A. Store Medicine Sales</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Vch No</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {eveningSales.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Store Sales:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {eveningSales.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Appointments */}
                      {eveningApps.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">B. OPD Appointments Consultation</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Appt ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee Charged</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {eveningApps.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Appointments:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {eveningApps.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Clinical Medicines */}
                      {eveningClinical.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">C. Doctors Clinical Formulations</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Visit ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {eveningClinical.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal Clinical Medicines:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {eveningClinical.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* File Payments */}
                      {eveningFile.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wide">D. Cards & File Registrations</h4>
                          <table className="min-w-full text-[9px] text-slate-700">
                            <thead>
                              <tr className="border-b border-slate-300 font-bold text-left text-slate-500">
                                <th className="py-1">Ref ID</th>
                                <th className="py-1">Patient Account</th>
                                <th className="py-1">Details</th>
                                <th className="py-1 text-right">Fee</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {eveningFile.map((item: any) => (
                                <tr key={item.id}>
                                  <td className="py-1 font-mono">{item.id}</td>
                                  <td className="py-1">{item.patientName} ({item.patientId})</td>
                                  <td className="py-1 italic text-slate-400">{item.details}</td>
                                  <td className="py-1 text-right font-mono font-bold">Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="font-bold border-t border-slate-200">
                                <td colSpan={3} className="py-1 text-right">Subtotal File Payments:</td>
                                <td className="py-1 text-right font-mono text-slate-900">Rs. {eveningFile.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Total Evening Shift Card */}
                      <div className="flex justify-end pt-2">
                        <div className="bg-slate-50 border border-slate-300 p-2 rounded text-right w-64">
                          <span className="text-[9px] font-black text-slate-500 uppercase block">EVENING SHIFT TOTAL REVENUE</span>
                          <span className="font-mono text-xs font-black text-slate-950">Rs. {eveningItems.reduce((s: any, i: any) => s + i.amount, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONSOLIDATED STATEMENT SUMMARY */}
                <div className="border-t border-slate-900 pt-6 space-y-4">
                  <h3 className="text-xxs font-black uppercase tracking-wider text-slate-950">3. CONSOLIDATED GRAND RECOVERY SUMMARY</h3>
                  <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-300 rounded-lg text-center">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Total Store Sales</span>
                      <span className="font-mono text-xs font-bold text-slate-800">Rs. {(activeReport.summary?.storeSalesTotal || 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-slate-400 block">Count: {activeReport.summary?.storeSalesCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Total OPD Fees</span>
                      <span className="font-mono text-xs font-bold text-slate-800">Rs. {(activeReport.summary?.appointmentsTotal || 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-slate-400 block">Count: {activeReport.summary?.appointmentsCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Total Clinical Meds</span>
                      <span className="font-mono text-xs font-bold text-slate-800">Rs. {(activeReport.summary?.clinicalTotal || 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-slate-400 block">Count: {activeReport.summary?.clinicalCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-500 block">Total File Charges</span>
                      <span className="font-mono text-xs font-bold text-slate-800">Rs. {(activeReport.summary?.filePaymentsTotal || 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-slate-400 block">Count: {activeReport.summary?.filePaymentsCount || 0}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 text-white p-4 rounded-xl border border-slate-950">
                    <span className="text-xxs font-black uppercase tracking-wider text-slate-300">CONSOLIDATED GRAND TOTAL CASH COLLECTED</span>
                    <span className="font-mono text-sm font-black">Rs. {(activeReport.summary?.grandTotal || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* SIGNATURE SECTIONS */}
                <div className="grid grid-cols-3 gap-8 pt-12 mt-12 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <div className="border-t border-slate-300 pt-2">
                    <p>PREPARED BY (PHARMACIST/ACCOUNTANT)</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>AUDITED & CERTIFIED BY</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>APPROVED & POSTED BY (ADMINISTRATOR)</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* DAILY COLLECTION CUSTOM PERIOD POP UP MODAL */}
      {dailyCollectionPrintOpen && !dailyCollectionReportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Printer className="w-4 h-4 text-purple-600 mr-2" />
                Select Custom Period Range
              </h3>
              <button 
                onClick={() => setDailyCollectionPrintOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xxs text-slate-500">
              Specify the start and end dates to generate the Daily Collection Report grid-view (Morning and Evening Shifts).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dailyCollectionStartDate}
                  onChange={(e) => setDailyCollectionStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={dailyCollectionEndDate}
                  onChange={(e) => setDailyCollectionEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  const data = generateDailyCollectionReport(dailyCollectionStartDate, dailyCollectionEndDate);
                  setDailyCollectionReportData(data);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xxs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Generate & Print Grid-View
              </button>
              <button
                onClick={() => setDailyCollectionPrintOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xxs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY COLLECTION REPORT PRINT MODAL (Supports PDF & Grid Format) */}
      {dailyCollectionReportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            
            {/* Modal Control Bar (Hidden on print) */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between print:hidden bg-slate-50 rounded-t-2xl gap-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Payment Collection & Audit Report Preview
                </span>
                <p className="text-[10px] text-slate-400">Review collection details grouped by Date and Shift matching requested PDF format.</p>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-lg border border-slate-300/60">
                <button
                  onClick={() => setDailyCollectionReportFormat('pdf')}
                  className={`px-3 py-1 rounded-md text-xxs font-black uppercase transition cursor-pointer flex items-center ${
                    dailyCollectionReportFormat === 'pdf' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  PDF Report Format
                </button>
                <button
                  onClick={() => setDailyCollectionReportFormat('grid')}
                  className={`px-3 py-1 rounded-md text-xxs font-black uppercase transition cursor-pointer flex items-center ${
                    dailyCollectionReportFormat === 'grid' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3 h-3 mr-1" />
                  Grid-View Summary
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCleanPrintDailyCollectionReport(dailyCollectionReportData, dailyCollectionReportFormat)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Send to Printer / Save PDF
                </button>
                <button
                  onClick={() => {
                    setDailyCollectionReportData(null);
                    setDailyCollectionPrintOpen(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* VIEW 1: PDF REPORT FORMAT (Matching requested screenshots) */}
            {dailyCollectionReportFormat === 'pdf' ? (
              <div className="flex-1 overflow-y-auto p-8 space-y-4 print:overflow-visible print:p-0 bg-white font-sans text-slate-900" id="printable-payment-collection-pdf">
                
                {/* Clinic Header */}
                <div className="text-center space-y-0.5">
                  <h1 className="text-base font-black tracking-wide uppercase text-slate-950">
                    Punjab Homoeopathic Clinic
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-700">
                    39-Shalimar Road, Garhi Shahu, Lahore-39
                  </p>
                </div>

                <div className="border-t-2 border-slate-950 my-2"></div>

                {/* Report Title Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-950">
                    Payment Collection Report
                  </h2>
                  <div className="flex justify-center items-center space-x-8 text-xs font-bold text-slate-800 pt-0.5">
                    <span>From: <span className="underline ml-1 font-extrabold">{formatReportDate(dailyCollectionReportData.startDate)}</span></span>
                    <span>To: <span className="underline ml-1 font-extrabold">{formatReportDate(dailyCollectionReportData.endDate)}</span></span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-950 my-2"></div>

                {/* Main PDF Table */}
                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-950 text-slate-950 font-black uppercase text-[11px] bg-slate-50 print:bg-transparent text-left">
                        <th className="py-2 px-2 w-[22%]">Date & Shift</th>
                        <th className="py-2 px-2 w-[16%] text-center">Patients Visited</th>
                        <th className="py-2 px-2 w-[16%] text-center">No of Patients</th>
                        <th className="py-2 px-2 w-[31%] text-left">Payment Description</th>
                        <th className="py-2 px-2 w-[15%] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                      {dailyCollectionReportData.pdfRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold italic">
                            No collection records found for the selected custom period.
                          </td>
                        </tr>
                      ) : (
                        dailyCollectionReportData.pdfRows.map((dateBlock: any, dateIdx: number) => (
                          <React.Fragment key={dateBlock.rawDate || dateIdx}>
                            {dateBlock.shiftBlocks.map((shiftBlock: any, shiftIdx: number) => (
                              <React.Fragment key={shiftIdx}>
                                {shiftBlock.items.map((item: any, itemIdx: number) => (
                                  <tr key={itemIdx} className="hover:bg-slate-50/50">
                                    <td className="py-1 px-2 font-bold text-slate-950">
                                      {itemIdx === 0 ? `${dateBlock.date} ${shiftBlock.shiftLabel}` : ''}
                                    </td>
                                    <td className="py-1 px-2 text-center font-bold text-slate-950">
                                      {itemIdx === 0 ? shiftBlock.visitedCount : ''}
                                    </td>
                                    <td className="py-1 px-2 text-center font-mono font-semibold">
                                      {item.count || '-'}
                                    </td>
                                    <td className="py-1 px-2 text-left text-slate-900">
                                      {item.description}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-semibold">
                                      {item.amount.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}

                                {/* Shift Total Row */}
                                <tr className="bg-slate-50/60 font-bold">
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1 px-2"></td>
                                  <td className="py-1.5 px-2 text-left font-bold text-slate-950">
                                    Shift Total
                                  </td>
                                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 border-t border-slate-300">
                                    {shiftBlock.shiftTotal.toLocaleString()}
                                  </td>
                                </tr>
                              </React.Fragment>
                            ))}

                            {/* Today Closing Row */}
                            <tr className="border-b-2 border-slate-900 font-extrabold bg-slate-100/70">
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2"></td>
                              <td className="py-2 px-2 text-left text-slate-950 uppercase tracking-wide">
                                Today Closing
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-950 font-black border-t-2 border-slate-900">
                                {dateBlock.todayClosing.toLocaleString()}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Bar */}
                <div className="border-t-2 border-b-2 border-slate-950 py-3 my-4 flex justify-between items-center text-sm font-black">
                  <span className="uppercase tracking-widest text-slate-950">Grand Total</span>
                  <span className="font-mono text-base text-slate-950">{dailyCollectionReportData.pdfGrandTotal.toLocaleString()}</span>
                </div>

                {/* PDF Document Footer */}
                <div className="pt-4 flex justify-between items-center text-[10px] font-bold text-slate-600 border-t border-slate-300">
                  <span>
                    Print Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>User: {currentUser?.FullName || currentUser?.LoginName || 'AMAN'}</span>
                </div>

              </div>
            ) : (
              /* VIEW 2: GRID-VIEW TABLE (Existing grid layout) */
              <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0 bg-white" id="printable-daily-collection-sheet">
                
                {/* Report Title Header */}
                <div className="text-center space-y-1">
                  <h1 className="text-base font-black tracking-wide text-slate-950 uppercase">Punjab Homeopathic Clinic</h1>
                  <h2 className="text-sm font-bold text-slate-900">Daily Collection Report (Clinic & Store)</h2>
                  <div className="flex justify-center items-center space-x-4 text-xxs font-semibold text-slate-700 pt-1">
                    <span>From: <span className="font-bold underline">{formatReportDate(dailyCollectionReportData.startDate)}</span></span>
                    <span>To: <span className="font-bold underline">{formatReportDate(dailyCollectionReportData.endDate)}</span></span>
                  </div>
                </div>

                {/* Main Grid-View Table */}
                <div className="overflow-x-auto pt-2">
                  <table className="min-w-full border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      {/* Shift Header Row */}
                      <tr className="bg-white">
                        <th rowSpan={2} className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-900 bg-slate-50">
                          Date
                        </th>
                        <th colSpan={6} className="border border-blue-500 px-2 py-1 text-center font-black text-blue-700 uppercase tracking-wide">
                          Morning
                        </th>
                        <th colSpan={6} className="border border-blue-500 px-2 py-1 text-center font-black text-blue-700 uppercase tracking-wide">
                          Evening
                        </th>
                        <th rowSpan={2} className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-900 bg-slate-50">
                          Total
                        </th>
                      </tr>
                      {/* Columns Header Row */}
                      <tr className="bg-slate-50 text-slate-700 font-bold">
                        {/* Morning cols */}
                        <th className="border border-slate-400 px-1.5 py-1 text-center">App</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">C.med</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Cards</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">File</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Store</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center bg-blue-50 text-blue-900">Total</th>
                        {/* Evening cols */}
                        <th className="border border-slate-400 px-1.5 py-1 text-center">App</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">C.med</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Cards</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">File</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center">Store</th>
                        <th className="border border-slate-400 px-1.5 py-1 text-center bg-blue-50 text-blue-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyCollectionReportData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="border border-slate-400 px-4 py-8 text-center text-slate-400 font-bold italic">
                            No transaction records found for the selected custom period.
                          </td>
                        </tr>
                      ) : (
                        dailyCollectionReportData.rows.map((row: any) => (
                          <tr key={row.date} className="hover:bg-slate-50 font-mono text-slate-800">
                            <td className="border border-slate-400 px-2 py-1 text-center font-sans font-bold">
                              {(() => {
                                const pts = row.date.split('-');
                                if (pts.length === 3) {
                                  return `${pts[2]}-${pts[1]}-${pts[0].substring(2)}`;
                                }
                                return row.date;
                              })()}
                            </td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.app || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.cmed || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.cards || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.file || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.morning.store || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right bg-blue-50/40 font-bold text-slate-950">{row.morning.total || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.app || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.cmed || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.cards || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.file || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right">{row.evening.store || '-'}</td>
                            <td className="border border-slate-400 px-1.5 py-1 text-right bg-blue-50/40 font-bold text-slate-950">{row.evening.total || '-'}</td>
                            <td className="border border-slate-400 px-2 py-1 text-right font-sans font-black bg-slate-50 text-slate-950">
                              {row.dayTotal.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {/* BOTTOM SUMMARY TOTALS ROW */}
                      {dailyCollectionReportData.rows.length > 0 && (
                        <tr className="bg-slate-50 font-sans font-extrabold text-slate-950 border-t-2 border-slate-900">
                          <td className="border border-slate-400 px-2 py-1.5 text-center uppercase tracking-wide text-[9px]">
                            Total
                          </td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px] bg-blue-50 text-blue-900">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px]">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-1.5 py-1.5 text-right font-mono text-[9px] bg-blue-50 text-blue-900">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-2 py-1.5 text-right font-sans font-black bg-blue-100 text-blue-950 text-[9.5px]">
                            {dailyCollectionReportData.grandTotals.total.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* LOWER ROW: Summary 1 and Summary 2 */}
                <div className="grid grid-cols-2 gap-8 pt-4 print:grid print:grid-cols-2 print:gap-8 bg-white">
                  <div className="space-y-2">
                    <h3 className="text-xxs font-black uppercase text-slate-900 tracking-wider">Summary 1</h3>
                    <table className="min-w-full border border-slate-400 text-xxs text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                          <th className="border border-slate-400 px-3 py-1.5">Category</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Morning</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Evening</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right bg-slate-50">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-mono text-slate-800">
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">App</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.app || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.app || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">C.med</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.cmed || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.cmed || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Cards</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.cards || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.cards || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">File</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.file || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.file || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Store</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.store || '-'}</td>
                        </tr>
                        <tr className="bg-slate-50 font-sans font-black border-t border-slate-900 text-slate-950">
                          <td className="border border-slate-400 px-3 py-1.5 uppercase">Total</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono bg-blue-50 text-blue-900">{dailyCollectionReportData.grandTotals.total || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xxs font-black uppercase text-slate-900 tracking-wider">Summary 2</h3>
                    <table className="min-w-full border border-slate-400 text-xxs text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                          <th className="border border-slate-400 px-3 py-1.5">Grouping</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Morning</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right">Evening</th>
                          <th className="border border-slate-400 px-3 py-1.5 text-right bg-slate-50">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-mono text-slate-800">
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">App & C.med</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.morningTotals.app + dailyCollectionReportData.morningTotals.cmed) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.eveningTotals.app + dailyCollectionReportData.eveningTotals.cmed) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{(dailyCollectionReportData.grandTotals.app + dailyCollectionReportData.grandTotals.cmed) || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Cards & File</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.morningTotals.cards + dailyCollectionReportData.morningTotals.file) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{(dailyCollectionReportData.eveningTotals.cards + dailyCollectionReportData.eveningTotals.file) || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{(dailyCollectionReportData.grandTotals.cards + dailyCollectionReportData.grandTotals.file) || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 px-3 py-1.5 font-sans font-bold">Store</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.morningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right">{dailyCollectionReportData.eveningTotals.store || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-sans font-extrabold bg-slate-50">{dailyCollectionReportData.grandTotals.store || '-'}</td>
                        </tr>
                        <tr className="bg-slate-50 font-sans font-black border-t border-slate-900 text-slate-950">
                          <td className="border border-slate-400 px-3 py-1.5 uppercase">Total</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.morningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono">{dailyCollectionReportData.eveningTotals.total || '-'}</td>
                          <td className="border border-slate-400 px-3 py-1.5 text-right font-mono bg-blue-50 text-blue-900">{dailyCollectionReportData.grandTotals.total || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Printable Document Signature Section */}
                <div className="grid grid-cols-3 gap-8 pt-12 mt-12 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <div className="border-t border-slate-300 pt-2">
                    <p>PREPARED BY (ACCOUNTANT)</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>AUDITED BY</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p>APPROVED BY</p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Processed Retail Invoices Print Statement Modal */}
      {invoicesPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            
            {/* Modal Top Control Bar (Hidden on print) */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Processed Retail Invoices Statement
                </span>
                <p className="text-[10px] text-slate-500">
                  Print preview for {filteredInvoices.length} retail checkout invoices ({datePreset.toUpperCase()})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCleanPrintInvoicesReport}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl shadow-xs flex items-center transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Now
                </button>
                <button
                  onClick={() => setInvoicesPrintModalOpen(false)}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Statement Sheet */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0 bg-white" id="printable-invoices-sheet">
              {/* Statement Header */}
              <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                <div className="flex items-center justify-center space-x-1.5">
                  <Award className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-black text-slate-950 tracking-widest uppercase">PUNJAB HOMEOPATHIC CLINIC & EMR SYSTEM</h3>
                </div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-widest">
                  PROCESSED RETAIL INVOICES STATEMENT
                </h2>
                <div className="flex items-center justify-center space-x-4 text-[10px] font-bold text-slate-600">
                  <span>Period: <strong className="text-slate-900">{startDate}</strong> to <strong className="text-slate-900">{endDate}</strong></span>
                  <span>•</span>
                  <span>Preset: <strong className="uppercase text-slate-900">{datePreset}</strong></span>
                  <span>•</span>
                  <span>Printed: <strong>{new Date().toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Total Invoices</span>
                  <span className="text-base font-black font-mono text-slate-900">{filteredInvoices.length}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Total Discounts</span>
                  <span className="text-base font-black font-mono text-amber-600">Rs. {totalDiscounts.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[9px] font-extrabold uppercase text-emerald-700 block">Net Revenue Mapped</span>
                  <span className="text-base font-black font-mono text-emerald-900">Rs. {totalNetSales.toLocaleString()}</span>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-left">Invoice No</th>
                      <th className="px-3 py-2 text-left">Billing Date</th>
                      <th className="px-3 py-2 text-left">Patient Account</th>
                      <th className="px-3 py-2 text-left">OPD Shift</th>
                      <th className="px-3 py-2 text-right">Gross Amount</th>
                      <th className="px-3 py-2 text-right">Discount</th>
                      <th className="px-3 py-2 text-right">Net Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.InvoiceNo}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{inv.InvoiceNo}</td>
                        <td className="px-3 py-2 font-medium text-slate-600">{inv.InvoiceDate}</td>
                        <td className="px-3 py-2 text-slate-900">{getPatientName(inv.PatientID)} ({inv.PatientID})</td>
                        <td className="px-3 py-2 font-bold uppercase text-[10px]">
                          {inv.shift === 2 ? 'Evening' : 'Morning'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">Rs. {inv.GAmount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono text-amber-600">-Rs. {inv.Discount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono font-black text-slate-950">Rs. {inv.NetAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-900">
                      <td colSpan={4} className="px-3 py-2 text-right uppercase tracking-wider">Total Cumulative Revenue:</td>
                      <td className="px-3 py-2 text-right font-mono">Rs. {totalGrossSales.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono text-amber-700">-Rs. {totalDiscounts.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono font-black text-emerald-800 text-sm">Rs. {totalNetSales.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Printable Document Signature Section */}
              <div className="grid grid-cols-3 gap-8 pt-8 mt-8 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  <p>PREPARED BY (ACCOUNTANT)</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>AUDITED BY</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>APPROVED BY</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Grid-View Audit Print Statement Modal */}
      {gridPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            
            {/* Modal Top Control Bar (Hidden on print) */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Audit Grid-View Transactions Statement
                </span>
                <p className="text-[10px] text-slate-500">
                  A4 Print preview for {filteredGridItems.length} audit records ({datePreset.toUpperCase()} | Shift: {selectedShiftFilter.toUpperCase()} | Category: {selectedCategoryFilter.toUpperCase()})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTriggerPrint}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl shadow-xs flex items-center transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Now
                </button>
                <button
                  onClick={handleCleanPrintGridViewReport}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase rounded-xl shadow-xs flex items-center transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Clean Print (New Tab)
                </button>
                <button
                  onClick={() => setGridPrintModalOpen(false)}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Statement Sheet */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible print:p-0 bg-white" id="printable-grid-audit-sheet">
              {/* Statement Header */}
              <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                <div className="flex items-center justify-center space-x-1.5">
                  <Award className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-black text-slate-950 tracking-widest uppercase">PUNJAB HOMEOPATHIC CLINIC & EMR SYSTEM</h3>
                </div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-widest">
                  AUDIT GRID-VIEW TRANSACTIONS REPORT
                </h2>
                <div className="flex items-center justify-center space-x-4 text-[10px] font-bold text-slate-600">
                  <span>Period: <strong className="text-slate-900">{startDate}</strong> to <strong className="text-slate-900">{endDate}</strong></span>
                  <span>•</span>
                  <span>Preset: <strong className="uppercase text-slate-900">{datePreset}</strong></span>
                  <span>•</span>
                  <span>Shift: <strong className="uppercase text-slate-900">{selectedShiftFilter}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="uppercase text-slate-900">{selectedCategoryFilter.replace('_', ' ')}</strong></span>
                  <span>•</span>
                  <span>Printed: <strong>{new Date().toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Total Matched Records</span>
                  <span className="text-base font-black font-mono text-slate-900">{filteredGridItems.length}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Store Sales Subtotal</span>
                  <span className="text-base font-black font-mono text-emerald-700">
                    Rs. {filteredGridItems.filter(i => i.type === 'Store Sale').reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Consultation Subtotal</span>
                  <span className="text-base font-black font-mono text-blue-700">
                    Rs. {filteredGridItems.filter(i => i.type === 'Appointment').reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <span className="text-[9px] font-extrabold uppercase text-purple-800 block">Total Audited Revenue</span>
                  <span className="text-base font-black font-mono text-purple-950">
                    Rs. {filteredGridItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Invoices & Transactions Audit Grid Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100 font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2 text-left">Tx Log ID</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Patient Account</th>
                      <th className="px-3 py-2 text-left">Shift</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Narrative / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredGridItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{item.id}</td>
                        <td className="px-3 py-2 font-medium text-slate-600">{item.date}</td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-[10px] text-slate-900">{item.type}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-900">{item.patientName} ({item.patientId})</td>
                        <td className="px-3 py-2 font-bold uppercase text-[10px]">{item.shift}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-950">Rs. {item.amount.toLocaleString()}</td>
                        <td className="px-3 py-2 text-slate-500 italic text-[11px]">{item.details}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-900">
                      <td colSpan={5} className="px-3 py-2 text-right uppercase tracking-wider">Total Cumulative Audited Value:</td>
                      <td className="px-3 py-2 text-right font-mono font-black text-purple-950 text-sm">
                        Rs. {filteredGridItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Printable Document Signature Section */}
              <div className="grid grid-cols-3 gap-8 pt-8 mt-8 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  <p>PREPARED BY (ACCOUNTANT)</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>AUDITED BY</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>APPROVED BY</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* VENDOR ACCOUNT STATEMENT PRINT MODAL */}
      {vendorPrintModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            {/* Modal Control Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Vendor Account Statement Printable Preview
                </span>
                <p className="text-[10px] text-slate-400">Official statement for {selectedVendor.VendorName}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTriggerPrint}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Statement
                </button>
                <button
                  onClick={() => setVendorPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-900" id="vendor-printable-sheet">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-950">SUPPLIER ACCOUNT STATEMENT</h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">HealthCare ERP & Accounts Payable Ledger</p>
                <p className="text-[10px] text-slate-500 font-mono">Statement Date: {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              {/* Vendor Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Supplier Details</p>
                  <p className="font-extrabold text-sm text-slate-950">{selectedVendor.VendorName}</p>
                  <p className="text-slate-600">Supplier ID: <span className="font-mono font-bold text-slate-800">{selectedVendor.VendorID || 'N/A'}</span></p>
                  <p className="text-slate-600">Contact: {selectedVendor.ContactPerson || 'N/A'} ({selectedVendor.Phone || 'N/A'})</p>
                  <p className="text-slate-600">Address: {selectedVendor.Address || 'N/A'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Statement Summary</p>
                  <p className="text-slate-700">Total Purchases (GRN): <span className="font-mono font-bold text-slate-900">Rs. {vendorStatement.totalInvoiced.toLocaleString()}</span></p>
                  <p className="text-slate-700">Total Payments Cleared: <span className="font-mono font-bold text-emerald-700">Rs. {vendorStatement.totalPaid.toLocaleString()}</span></p>
                  <div className="pt-2 border-t border-slate-300">
                    <p className="text-xs font-black uppercase text-slate-500">Current Outstanding Payable</p>
                    <p className="text-lg font-mono font-black text-amber-700">Rs. {vendorStatement.closingBalance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Statement Rows Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Ref / Voucher #</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit (Paid)</th>
                      <th className="p-2.5 text-right">Credit (Bill)</th>
                      <th className="p-2.5 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {vendorStatement.statementRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-mono text-slate-700">{formatReportDate(row.date)}</td>
                        <td className="p-2.5 font-bold text-slate-900">{row.type}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-800">{row.refNo}</td>
                        <td className="p-2.5 text-slate-700">{row.description}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                          {row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900">
                          Rs. {row.runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-900 text-slate-950">
                      <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider">Total / Balance Due:</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">Rs. {vendorStatement.totalPaid.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-amber-700">Rs. {vendorStatement.totalInvoiced.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-slate-950 font-black">Rs. {vendorStatement.closingBalance.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  <p>ACCOUNTS OFFICER</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>STORE RECEIVER</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>SUPPLIER CONFIRMATION SIGN</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CASH FLOW FORECAST PRINT MODAL */}
      {cashFlowPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col h-[90vh] print:h-auto print:border-0 print:shadow-none animate-fadeIn">
            {/* Modal Controls */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Cash Flow Forecast Printable Statement
                </span>
                <p className="text-[10px] text-slate-400">{forecastHorizonDays}-Day Liquidity Projection Report</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTriggerPrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xxs font-black uppercase tracking-wider transition flex items-center shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Report
                </button>
                <button
                  onClick={() => setCashFlowPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6 print:p-0 print:overflow-visible text-slate-900" id="cashflow-printable-sheet">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-950">CASH FLOW FORECAST & LIQUIDITY STATEMENT</h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Punjab Homeopathic Clinic & Pharmacy Accounts</p>
                <p className="text-[10px] text-slate-500 font-mono">Projection Horizon: {forecastHorizonDays} Days • Date Generated: {new Date().toLocaleDateString('en-GB')}</p>
              </div>

              {/* Forecast Parameters Summary */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-center">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Daily Pharm Inflow</p>
                  <p className="font-extrabold text-slate-900 font-mono">Rs. {cashForecast.dailyPharm.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Daily Clinic Inflow</p>
                  <p className="font-extrabold text-slate-900 font-mono">Rs. {cashForecast.dailyClinic.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Total Daily Inflow</p>
                  <p className="font-extrabold text-emerald-700 font-mono">Rs. {cashForecast.totalDailyInflow.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Default GRN Terms</p>
                  <p className="font-extrabold text-amber-700 font-mono">{defaultGrnTerms} Days</p>
                </div>
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-3 gap-4 border-y border-slate-200 py-3 text-xs">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500">Projected Total Receipts</p>
                  <p className="text-base font-black text-emerald-700 font-mono">Rs. {cashForecast.totalProjectedInflow.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500">Scheduled Supplier Payables</p>
                  <p className="text-base font-black text-amber-700 font-mono">Rs. {cashForecast.totalProjectedOutflow.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500">Projected Ending Cash</p>
                  <p className="text-base font-black text-slate-950 font-mono">Rs. {cashForecast.projectedEndingCash.toLocaleString()}</p>
                </div>
              </div>

              {/* Upcoming GRNs Schedule */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-900">Upcoming Supplier Obligations</h3>
                <table className="w-full text-left text-xs font-sans border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9px] font-black">
                      <th className="p-2">Supplier</th>
                      <th className="p-2">GRN ID</th>
                      <th className="p-2">GRN Date</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2 text-right">Total Bill</th>
                      <th className="p-2 text-right">Net Due</th>
                      <th className="p-2 text-center">Due Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cashForecast.grnCommitments.map((c, gi) => (
                      <tr key={gi}>
                        <td className="p-2 font-bold text-slate-900">{c.vendorName}</td>
                        <td className="p-2 font-mono text-slate-700">{c.grnId}</td>
                        <td className="p-2 font-mono text-slate-600">{formatReportDate(c.grnDate.toISOString())}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{formatReportDate(c.dueDate.toISOString())}</td>
                        <td className="p-2 text-right font-mono">Rs. {c.grnCost.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-700">Rs. {c.netDue.toLocaleString()}</td>
                        <td className="p-2 text-center font-bold text-[10px]">
                          {c.daysUntilDue < 0 ? `Overdue (${Math.abs(c.daysUntilDue)}d)` : `In ${c.daysUntilDue}d`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 pt-8 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
                <div className="border-t border-slate-300 pt-2">
                  <p>FINANCIAL ANALYST</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>ACCOUNTS MANAGER</p>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <p>CHIEF MEDICAL DIRECTOR</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD VENDOR PAYMENT VOUCHER */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Coins className="w-5 h-5 text-emerald-600 mr-2" />
                Record Vendor Payment Voucher
              </h3>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Selected Vendor</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-extrabold text-slate-800 flex justify-between">
                  <span>{selectedVendor?.VendorName || 'N/A'}</span>
                  <span className="font-mono text-amber-700">Bal: Rs. {(selectedVendor?.Balance || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={vendorPaymentForm.date}
                  onChange={(e) => setVendorPaymentForm({ ...vendorPaymentForm, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={vendorPaymentForm.amount}
                  onChange={(e) => setVendorPaymentForm({ ...vendorPaymentForm, amount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Payment Method / Channel</label>
                <select
                  value={vendorPaymentForm.method}
                  onChange={(e) => setVendorPaymentForm({ ...vendorPaymentForm, method: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Cash">Cash Voucher</option>
                  <option value="Bank">Bank Transfer / Online</option>
                  <option value="Cheque">Cheque Clearing</option>
                  <option value="Pay Order">Pay Order / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Description / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Settlement for GRN-9082 via Meezan Bank..."
                  value={vendorPaymentForm.description}
                  onChange={(e) => setVendorPaymentForm({ ...vendorPaymentForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 pt-3">
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordVendorPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm transition cursor-pointer flex items-center space-x-1"
              >
                <Coins className="w-4 h-4 mr-1" />
                <span>Post Payment Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW VENDOR / SUPPLIER */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                Add New Vendor / Supplier
              </h3>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Vendor / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Pfizer Pakistan Ltd"
                  value={newVendorForm.name}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ali Raza"
                    value={newVendorForm.contact}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contact: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={newVendorForm.phone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tax / NTN No</label>
                  <input
                    type="text"
                    placeholder="e.g. 1234567-8"
                    value={newVendorForm.taxId}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, taxId: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Opening Balance (Rs.)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newVendorForm.balance}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, balance: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Business Address</label>
                <input
                  type="text"
                  placeholder="Industrial Area, Karachi"
                  value={newVendorForm.address}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 pt-3">
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewVendor}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-lg shadow-sm transition cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Save Vendor Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
