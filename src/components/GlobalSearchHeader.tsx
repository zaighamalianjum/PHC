import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  User,
  FileText,
  Calendar,
  Phone,
  ArrowRight,
  Receipt,
  Eye,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Clock,
  Activity
} from 'lucide-react';
import { Patient, InvoiceHeader, InvoiceDetail, Visit, Appointment, Token } from '../types';

interface GlobalSearchHeaderProps {
  patients: Patient[];
  invoices: InvoiceHeader[];
  invoiceDetails?: InvoiceDetail[];
  visits?: Visit[];
  appointments?: Appointment[];
  tokens?: Token[];
  onNavigateTab: (tabId: string, patientId?: string, subTab?: string) => void;
}

export default function GlobalSearchHeader({
  patients,
  invoices,
  invoiceDetails = [],
  visits = [],
  appointments = [],
  tokens = [],
  onNavigateTab
}: GlobalSearchHeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceHeader | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cleanTerm = searchTerm.trim().toLowerCase();

  // Search logic
  const matchedPatients = cleanTerm
    ? patients.filter(
        (p) =>
          p.PatientID.toLowerCase().includes(cleanTerm) ||
          p.PatientName.toLowerCase().includes(cleanTerm) ||
          (p.PhoneMobile && p.PhoneMobile.includes(cleanTerm)) ||
          (p.Father_husband && p.Father_husband.toLowerCase().includes(cleanTerm))
      ).slice(0, 6)
    : [];

  const matchedInvoices = cleanTerm
    ? invoices.filter(
        (inv) =>
          inv.InvoiceNo.toLowerCase().includes(cleanTerm) ||
          inv.PatientID.toLowerCase().includes(cleanTerm) ||
          (patients.find(p => p.PatientID === inv.PatientID)?.PatientName || '').toLowerCase().includes(cleanTerm)
      ).slice(0, 6)
    : [];

  const totalMatches = matchedPatients.length + matchedInvoices.length;

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setIsOpen(false);
  };

  const handleSelectInvoice = (inv: InvoiceHeader) => {
    setSelectedInvoice(inv);
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={containerRef} id="global-header-search-container">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="w-3 h-3 text-blue-300 absolute left-2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search Patient ID or Invoice #..."
          className="w-28 xs:w-36 sm:w-52 md:w-60 lg:w-64 pl-7 pr-6 py-1 bg-blue-950/70 text-white placeholder-blue-300/70 text-[10px] sm:text-[10.5px] rounded-md border border-blue-700/60 focus:outline-none focus:ring-1 focus:ring-emerald-400/80 focus:border-transparent transition shadow-inner"
          id="global-header-search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="absolute right-1.5 text-blue-300 hover:text-white transition cursor-pointer"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown Overlay Results */}
      {isOpen && cleanTerm.length > 0 && (
        <div className="absolute right-0 mt-2 w-[280px] xs:w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white px-3 py-2 text-xs font-bold flex justify-between items-center border-b border-slate-800">
            <span className="flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Search Results for &quot;{searchTerm}&quot;</span>
            </span>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono">
              {totalMatches} Found
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {totalMatches === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No records found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No Patient ID, Name, or Invoice # matching &quot;{searchTerm}&quot;
                </p>
              </div>
            ) : (
              <>
                {/* PATIENTS CATEGORY */}
                {matchedPatients.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-black tracking-wider uppercase text-blue-700 bg-blue-50/80 rounded mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-blue-600" />
                        <span>Patients ({matchedPatients.length})</span>
                      </span>
                      <span className="text-[9px] text-blue-500 font-normal">By ID, Name, Phone</span>
                    </div>

                    <div className="space-y-1">
                      {matchedPatients.map((p) => {
                        const activeTok = tokens.find(
                          (t) => t.PatientID === p.PatientID && t.Date === new Date().toISOString().split('T')[0]
                        );
                        return (
                          <div
                            key={`p-${p.PatientID}`}
                            onClick={() => handleSelectPatient(p)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {p.PatientID.slice(-3)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-600">
                                    {p.PatientName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                                    ({p.PatientID})
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                  <span>{p.Sex || 'N/A'}, {p.AgeYears || 0} yrs</span>
                                  {p.PhoneMobile && (
                                    <span className="flex items-center space-x-0.5 text-slate-400">
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>{p.PhoneMobile}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              {activeTok && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Tok #{activeTok.TokenNo}
                                </span>
                              )}
                              <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INVOICES CATEGORY */}
                {matchedInvoices.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-black tracking-wider uppercase text-emerald-800 bg-emerald-50/80 rounded mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Receipt className="w-3 h-3 text-emerald-600" />
                        <span>Pharmacy Invoices ({matchedInvoices.length})</span>
                      </span>
                      <span className="text-[9px] text-emerald-600 font-normal">By Invoice #, Patient ID</span>
                    </div>

                    <div className="space-y-1">
                      {matchedInvoices.map((inv) => {
                        const pat = patients.find((p) => p.PatientID === inv.PatientID);
                        return (
                          <div
                            key={`inv-${inv.InvoiceNo}`}
                            onClick={() => handleSelectInvoice(inv)}
                            className="p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-xs text-slate-800 font-mono group-hover:text-emerald-700">
                                    {inv.InvoiceNo}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium truncate">
                                    {pat?.PatientName || inv.PatientID || 'Walk-in'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                                  <span className="flex items-center space-x-0.5">
                                    <Calendar className="w-2.5 h-2.5" />
                                    <span>{inv.InvoiceDate}</span>
                                  </span>
                                  <span>• {inv.shift === 1 ? 'Morning' : 'Evening'} Shift</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-extrabold text-xs text-emerald-700 font-mono">
                                Rs. {(inv.NetAmount || 0).toLocaleString()}
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                {inv.Status === 2 ? 'Posted' : 'Draft'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* PATIENT QUICK VIEW MODAL */}
      {selectedPatient && (() => {
        const patVisits = (visits || []).filter(v => v.PatientID === selectedPatient.PatientID);
        const patAppointments = (appointments || []).filter(a => a.PatientID === selectedPatient.PatientID);
        const patTokens = (tokens || []).filter(t => t.PatientID === selectedPatient.PatientID);
        const patInvoices = invoices.filter(i => i.PatientID === selectedPatient.PatientID);

        const timelineEvents = [
          ...patVisits.map(v => ({
            id: `visit-${v.VisitID}`,
            date: v.VisitDate || '',
            title: `OPD Visit #${v.VisitID}`,
            subtitle: v.SymptomsDiagnosis ? `Diagnosis: ${v.SymptomsDiagnosis}` : 'Consultation Visit',
            details: v.MedicalReportResult || v.VisitRemarks,
            badge: 'OPD Visit',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold',
            rawDate: v.VisitDate ? new Date(v.VisitDate).getTime() : 0
          })),
          ...patAppointments.map(a => ({
            id: `appt-${a.AppointmentID}`,
            date: a.AppointmentDate || '',
            title: `Appointment #${a.AppointmentID}`,
            subtitle: `Shift: ${a.Shift === 1 ? 'Morning' : 'Evening'}`,
            details: a.Remarks || (a.Status === 4 ? 'Completed' : a.Status === 3 ? 'Cancelled' : 'Scheduled'),
            badge: 'Appointment',
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 font-bold',
            rawDate: a.AppointmentDate ? new Date(a.AppointmentDate).getTime() : 0
          })),
          ...patInvoices.map(i => ({
            id: `inv-${i.InvoiceNo}`,
            date: i.InvoiceDate || '',
            title: `Invoice #${i.InvoiceNo}`,
            subtitle: `Net Amount: Rs. ${(i.NetAmount || 0).toLocaleString()}`,
            details: `Gross: Rs. ${(i.GAmount || 0).toLocaleString()} • Discount: Rs. ${(i.Discount || 0).toLocaleString()}`,
            badge: 'Invoice',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
            rawDate: i.InvoiceDate ? new Date(i.InvoiceDate).getTime() : 0
          }))
        ].sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-blue-900 text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-800 text-emerald-300 font-black text-sm flex items-center justify-center border border-blue-700">
                    {selectedPatient.PatientID.slice(-3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{selectedPatient.PatientName}</h3>
                    <p className="text-[10px] text-blue-200 font-mono">ID: {selectedPatient.PatientID}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-blue-200 hover:text-white transition p-1 rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender / Age</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.Sex || 'N/A'}, {selectedPatient.AgeYears || 0} years</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mobile Phone</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.PhoneMobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Father / Husband</span>
                    <span className="font-semibold text-slate-800 font-medium">{selectedPatient.Father_husband || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registration Date</span>
                    <span className="font-semibold text-slate-800">{selectedPatient.RegistrationDate || 'N/A'}</span>
                  </div>
                  {selectedPatient.Address && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Address</span>
                      <span className="font-medium text-slate-700">{selectedPatient.Address}</span>
                    </div>
                  )}
                </div>

                {/* Patient Activity Summary */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recent Patient Activity</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="block text-slate-500 text-[9px]">OPD Visits</span>
                      <span className="font-extrabold text-blue-700 text-sm">
                        {patVisits.length}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="block text-slate-500 text-[9px]">Invoices</span>
                      <span className="font-extrabold text-emerald-700 text-sm">
                        {patInvoices.length}
                      </span>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <span className="block text-slate-500 text-[9px]">Appointments</span>
                      <span className="font-extrabold text-amber-700 text-sm">
                        {patAppointments.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient History Timeline */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Patient History Timeline</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{timelineEvents.length} records</span>
                  </h4>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {timelineEvents.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs">
                        No previous medical visit history found for this patient.
                      </div>
                    ) : (
                      timelineEvents.map((evt) => (
                        <div key={evt.id} className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] border ${evt.badgeColor}`}>
                                {evt.badge}
                              </span>
                              <span>{evt.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">{evt.date}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700">{evt.subtitle}</p>
                          {evt.details && (
                            <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                              {evt.details}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const patId = selectedPatient?.PatientID;
                      setSelectedPatient(null);
                      onNavigateTab('patients', patId, 'patient_visit');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Open Patient Visit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const patId = selectedPatient?.PatientID;
                      setSelectedPatient(null);
                      onNavigateTab('patients', patId);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Go to Patient Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* INVOICE QUICK VIEW MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
            {/* Header */}
            <div className="bg-emerald-900 text-white px-5 py-3.5 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center border border-emerald-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight font-mono">Invoice #{selectedInvoice.InvoiceNo}</h3>
                  <p className="text-[10px] text-emerald-200">Date: {selectedInvoice.InvoiceDate} • {selectedInvoice.shift === 1 ? 'Morning' : 'Evening'} Shift</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-emerald-200 hover:text-white transition p-1 rounded-lg hover:bg-emerald-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient ID</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedInvoice.PatientID || 'Walk-in'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient Name</span>
                  <span className="font-semibold text-slate-800">
                    {patients.find(p => p.PatientID === selectedInvoice.PatientID)?.PatientName || selectedInvoice.PatientID || 'Walk-in Patient'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gross Amount</span>
                  <span className="font-semibold text-slate-800 font-mono">Rs. {(selectedInvoice.GAmount || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Discount</span>
                  <span className="font-semibold text-rose-600 font-mono">Rs. {(selectedInvoice.Discount || 0).toLocaleString()}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-slate-700">Net Payable Amount</span>
                  <span className="text-base font-black text-emerald-700 font-mono">Rs. {(selectedInvoice.NetAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Billed Items Breakdown */}
              {invoiceDetails.filter(d => d.InvoiceNo === selectedInvoice.InvoiceNo).length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Line Items</h4>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {invoiceDetails
                      .filter(d => d.InvoiceNo === selectedInvoice.InvoiceNo)
                      .map((dt, idx) => (
                        <div key={`dt-${idx}`} className="p-2 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800 block">{dt.ItemID}</span>
                            <span className="text-[10px] text-slate-400">Qty: {dt.Qty} × Rs. {dt.Price}</span>
                          </div>
                          <span className="font-bold text-slate-700 font-mono">Rs. {dt.LineTotal}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    onNavigateTab('pharmacy');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Open Pharmacy POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
