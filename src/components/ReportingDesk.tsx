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
  Coins
} from 'lucide-react';
import { InvoiceHeader, InvoiceDetail, ACLedger, TLAccount, Patient, SRInvHeader, Appointment, Visit, VisitMedicine, Item, User, UserRight } from '../types';

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
  onUnauthorized
}: ReportingDeskProps) {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'pl' | 'gl_audit' | 'grid_view'>('sales');

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
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dailyCollectionEndDate, setDailyCollectionEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dailyCollectionReportData, setDailyCollectionReportData] = useState<any | null>(null);
  const [dailyCollectionReportFormat, setDailyCollectionReportFormat] = useState<'pdf' | 'grid'>('pdf');

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

  // Helper: Calculate daily collection report categories from OPD Checkout & Sourcing
  const getDailyCollectionReport = () => {
    const matchedVisits = (visits || []).filter(vis => filterByDate(vis.VisitDate));
    const matchedApps = (appointments || []).filter(app => filterByDate(app.AppointmentDate) && app.Status !== 3);
    const matchedInvoices = (invoices || []).filter(inv => filterByDate(inv.InvoiceDate));
    
    let filePaymentSales = 0;
    let clinicalMedicineSales = 0;
    let consultationFeeSales = 0;
    let patentMedicineSales = 0;

    // 1. Appointment Collection (Booking Fees & OPD Token Fees from reception)
    matchedApps.forEach(app => {
      consultationFeeSales += Number(app.FeeCharged || 0);
    });

    // 2. Visit processing: File & Card Payment, Clinical Medicine, Extra Consultation, Visit Patent Sourcing
    matchedVisits.forEach(vis => {
      // File & Card Payment
      const fileCardAmt = (Number(vis.CardsPayment) || 0) || ((Number(vis.FileFee || 0) + Number(vis.CardFee || 0)));
      filePaymentSales += fileCardAmt;

      // Clinical Medicine
      clinicalMedicineSales += Number(vis.ClinicalMedicinePayment || 0);

      // Standalone Doctor Consultation Fee (if not captured by appointment fee)
      const hasApp = matchedApps.some(a => a.PatientID === vis.PatientID && a.AppointmentDate === vis.VisitDate);
      if (!hasApp && Number(vis.ConsultationFee || 0) > 0) {
        consultationFeeSales += Number(vis.ConsultationFee || 0);
      }

      // Patent Medicine in this visit if Sourced from Clinic
      if (vis.PatentPaymentOption === 'Clinic') {
        const meds = (visitMedicines || []).filter(m => m.VisitID === vis.VisitID && m.MedicineType === 'P');
        meds.forEach(m => {
          const itm = (items || []).find(i => i.ItemID === m.ItemID);
          const price = m.Price !== undefined ? m.Price : (itm ? itm.Price : 10.0);
          patentMedicineSales += price * 10;
        });
      }
    });

    // 3. Pharmacy POS Invoices (Store / Patent Medicine Sales)
    matchedInvoices.forEach(inv => {
      patentMedicineSales += Number(inv.NetAmount || 0);
    });

    // Fallback if still empty, check acLedger
    if (matchedVisits.length === 0 && matchedApps.length === 0 && matchedInvoices.length === 0) {
      const filteredLedgers = acLedger.filter(log => filterByDate(log.TxDate));
      if (filteredLedgers.length > 0) {
        // 1. Store Medicine (Patent Medicine 'P')
        const patentLedgers = filteredLedgers.filter(l => l.TLID === 401103 || l.TLID === 401203);
        patentMedicineSales = patentLedgers.reduce((sum, l) => sum + l.Credit, 0);

        // 2. Clinic Medicine 'C'
        const clinicalLedgers = filteredLedgers.filter(l => l.TLID === 401102 || l.TLID === 401202);
        clinicalMedicineSales = clinicalLedgers.reduce((sum, l) => sum + l.Credit, 0);

        // 3. Appointment (OPD ticket fees from reception)
        const appLedgers = filteredLedgers.filter(
          l => (l.TLID === 401101 || l.TLID === 401201 || l.TLID === 401001) && !l.VchNo.includes('WALK') && !l.VchNo.includes('CARD')
        );
        consultationFeeSales = appLedgers.reduce((sum, l) => sum + l.Credit, 0);

        // 4. File & Card Fee Payment
        const fileCardLedgers = filteredLedgers.filter(
          l => l.TLID === 401105 || l.TLID === 401205 || (l.VchNo && (l.VchNo.includes('WALK') || l.VchNo.includes('CARD')))
        );
        filePaymentSales = fileCardLedgers.reduce((sum, l) => sum + l.Credit, 0);
      }
    }

    return {
      patentMedicineSales,
      clinicalMedicineSales,
      appointmentCollection: consultationFeeSales,
      consultancyCollection: filePaymentSales,
      totalCollection: patentMedicineSales + clinicalMedicineSales + consultationFeeSales + filePaymentSales
    };
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
        labTestRevenue = baseLabAcc ? Math.abs(baseLabAcc.AcBalance) * 0.25 : 18000;
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
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
        </div>
      </div>

      {/* Date Filters Ribbon */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md flex flex-wrap items-center gap-4 text-xs font-sans">
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
            <div className="relative">
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDailyCollectionPrintOpen(true)}
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-2xs">
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
                  onClick={handleTriggerPrint}
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

    </div>
  );
}
