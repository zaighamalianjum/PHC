/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Lock,
  Edit3,
  Search,
  CheckCircle,
  FileBadge,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Item,
  LabTest,
  Visit,
  VisitMedicine,
  MedicalCertificate,
  MedicalCertificateSBP,
  UserRight,
  ClinicSettings,
  City
} from '../types';

interface EMRDeskProps {
  patients: Patient[];
  appointments: Appointment[];
  items: Item[];
  labTests: LabTest[];
  visits: Visit[];
  onAddVisit: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  medicalCertificates: MedicalCertificate[];
  onAddCertificate: (c: MedicalCertificate) => void;
  sbpCertificates: MedicalCertificateSBP[];
  onAddSbpCertificate: (c: MedicalCertificateSBP) => void;
  userRights: UserRight[];
  clinicSettings?: ClinicSettings;
  cities?: City[];
}

export default function EMRDesk({
  patients,
  appointments = [],
  items,
  labTests,
  visits,
  onAddVisit,
  medicalCertificates,
  onAddCertificate,
  sbpCertificates,
  onAddSbpCertificate,
  userRights,
  clinicSettings,
  cities = []
}: EMRDeskProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'consult' | 'certs' | 'sbp'>('consult');

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'emr');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Selected patient for active consultation session
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Visit Clinical Textareas
  const [symptomsDiagnosis, setSymptomsDiagnosis] = useState('');
  const [medicalReportResult, setMedicalReportResult] = useState('');
  const [labTestAdvice, setLabTestAdvice] = useState('');
  const [patientAdvice, setPatientAdvice] = useState('');
  const [visitRemarks, setVisitRemarks] = useState('');
  const [visitStatus, setVisitStatus] = useState<1 | 2>(1); // 1 = Draft, 2 = Posted/Locked

  // Medicine Search & Autocomplete
  const [medSearch, setMedSearch] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);

  // Lab test / Diagnostics Search & Autocomplete
  const [diagSearch, setDiagSearch] = useState('');
  const [showDiagResults, setShowDiagResults] = useState(false);

  // Print Preview Modal States
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{
    patient: Patient | null;
    visitID: string;
    visitDate: string;
    symptomsDiagnosis: string;
    medicalReportResult: string;
    patientAdvice: string;
    visitRemarks: string;
    prescribedMedicines: { ItemID: string; MedicineDetail: string; Dosage: string; MedicineType: 'C' | 'P'; Price?: number }[];
    selectedLabTests: string[];
    consultationFee?: number;
    consultationPaymentOption?: string;
    patentPaymentOption?: string;
    clinicalPaymentOption?: string;
  } | null>(null);

  // Prescription Grid
  const [prescribedMedicines, setPrescribedMedicines] = useState<Omit<VisitMedicine, 'VisitID'>[]>([]);
  // Row scratchpad
  const [rowMedicineId, setRowMedicineId] = useState('');
  const [rowDetail, setRowDetail] = useState('');
  const [rowDosage, setRowDosage] = useState('1-0-1');
  const [rowType, setRowType] = useState<'C' | 'P'>('P'); // P = Patent
  const [rowPrice, setRowPrice] = useState<number>(15); // Default Custom Price for Clinical Compounded 'C'

  // Lab diagnostics advice multiselect
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);

  // Certificate forms
  const [sufferingFrom, setSufferingFrom] = useState('');
  const [durationFrom, setDurationFrom] = useState('2026-07-03');
  const [durationTo, setDurationTo] = useState('2026-07-06');
  
  // SBP Certificate forms
  const [sbpDesignation, setSbpDesignation] = useState('Assistant Director');
  const [sbpConsultFee, setSbpConsultFee] = useState(1500);
  const [sbpTreatmentDays, setSbpTreatmentDays] = useState(3);
  const [sbpReceiptType, setSbpReceiptType] = useState<1 | 2>(2); // Default to 2 = SBP

  // Custom Consultation Fees and Payment Sourcing States
  const [consultationFee, setConsultationFee] = useState(1500);
  const [consultationPaymentOption, setConsultationPaymentOption] = useState('Paid - Cash');
  const [patentPaymentOption, setPatentPaymentOption] = useState('Clinic');
  const [clinicalPaymentOption, setClinicalPaymentOption] = useState('Clinic');
  const [printFilter, setPrintFilter] = useState<'all' | 'P' | 'C'>('all');

  // Disease search, tags & pre-packaged categories state
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('');
  
  // Patient Lookup Modal
  const [patientLookupModalOpen, setPatientLookupModalOpen] = useState(false);
  const [patientLookupSearch, setPatientLookupSearch] = useState('');
  const [lookupPatientId, setLookupPatientId] = useState('');

  // Patient History Printing States
  const [printLayoutType, setPrintLayoutType] = useState<'slip' | 'history'>('slip');
  const [historyPrintPatient, setHistoryPrintPatient] = useState<Patient | null>(null);
  const [historyPrintVisits, setHistoryPrintVisits] = useState<Visit[]>([]);

  const DISEASE_PRESETS = [
    { label: '🌡️ Fever', keyword: 'fever' },
    { label: '🗣️ Throat Infection', keyword: 'throat' },
    { label: '🩺 Kidneys', keyword: 'kidney' },
    { label: '💊 Pain Relief', keyword: 'pain' },
    { label: '🧪 Acidity/Gastric', keyword: 'gastric' }
  ];

  const MEDICINE_CATEGORIES: { [key: string]: string } = {
    'ITM-001': 'Antipyretic / Analgesic (Paracetamol)',
    'ITM-002': 'Broad-Spectrum Antibiotic (Co-Amoxiclav)',
    'ITM-003': 'NSAID Painkiller (Diclofenac Sodium)',
    'ITM-004': 'Sympathomimetic Decongestant (Ibuprofen / Pseudoephedrine)',
    'ITM-005': 'Multivitamin Supplement (Zinc + Vitamin B-Complex)',
    'ITM-006': 'Antiemetic Anti-nausea Syrup (Dimenhydrinate)',
    'ITM-007': 'Antibacterial Pediatric Suspension (Amoxicillin)',
    'ITM-008': 'NSAID Anti-inflammatory (Mefenamic Acid)',
    'ITM-009': 'Proton Pump Inhibitor (Omeprazole Acid-reducer)',
    'ITM-010': 'Bronchodilator Asthma Inhaler (Salbutamol Sulfate)'
  };

  // Pre-populate consultation ticket fee if active receptionist-booked appointment exists
  useEffect(() => {
    if (selectedPatientId) {
      const activeApp = appointments.find(a => a.PatientID === selectedPatientId && a.Status !== 3 && a.Status !== 4);
      if (activeApp) {
        setConsultationFee(activeApp.FeeCharged || 1500);
      } else {
        setConsultationFee(1500);
      }
    }
  }, [selectedPatientId, appointments]);

  // Success flags
  const [saveSuccess, setSaveSuccess] = useState('');
  const [certSuccess, setCertSuccess] = useState('');

  // Selected visit lookup for history / read-only viewing
  const [activeVisitLookupId, setActiveVisitLookupId] = useState('');

  // Auto populate SBP cost calculations
  const [autoSbpMedCost, setAutoSbpMedCost] = useState(0);

  // Recalculate medicine costs whenever prescribed medicines list changes
  useEffect(() => {
    let costSum = 0;
    prescribedMedicines.forEach((pm) => {
      if (pm.MedicineType === 'P') {
        const item = items.find((itm) => itm.ItemID === pm.ItemID);
        if (item) {
          // Assume nominal prescription dose quantity of e.g. 10 units for the claims form
          costSum += item.Price * 10;
        }
      }
    });
    setAutoSbpMedCost(costSum);
  }, [prescribedMedicines, items]);

  // Handle patient selection change to load previous medical history
  useEffect(() => {
    const previousVisit = visits.find((v) => v.PatientID === selectedPatientId && v.Status === 2);
    if (previousVisit) {
      // Just for preview of historical medical summary
    }
  }, [selectedPatientId, visits]);

  // Handler: Add row to prescription list
  const handleAddPrescriptionRow = () => {
    if (!rowMedicineId) return;
    const isDuplicate = prescribedMedicines.some((m) => m.ItemID === rowMedicineId);
    if (isDuplicate) {
      alert('This medicine is already added in the current prescription draft grid.');
      return;
    }

    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        ItemID: rowMedicineId,
        MedicineDetail: rowDetail || 'Take after meals',
        Dosage: rowDosage,
        MedicineType: rowType,
        Price: rowType === 'C' ? rowPrice : undefined
      }
    ]);

    // Reset row scratchpad
    setRowMedicineId('');
    setRowDetail('');
    setRowDosage('1-0-1');
    setRowType('P');
    setRowPrice(15);
  };

  const handleRemovePrescriptionRow = (index: number) => {
    setPrescribedMedicines(prescribedMedicines.filter((_, idx) => idx !== index));
  };

  // Handler: Add diagnostic lab check
  const toggleLabCheck = (testId: string) => {
    if (selectedLabTests.includes(testId)) {
      setSelectedLabTests(selectedLabTests.filter((id) => id !== testId));
    } else {
      setSelectedLabTests([...selectedLabTests, testId]);
    }
  };

  // Save consultation visit
  const handleSaveVisit = (postRecord: boolean) => {
    if (!selectedPatientId) {
      alert('Please select a patient first.');
      return;
    }
    if (!symptomsDiagnosis.trim()) {
      alert('Symptoms & Diagnosis summary is required.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const newVisitID = `VIS-${String(visits.length + 1).padStart(3, '0')}`;
    const newVisit: Visit = {
      VisitID: newVisitID,
      PatientID: selectedPatientId,
      VisitDate: new Date().toISOString().split('T')[0],
      SymptomsDiagnosis: symptomsDiagnosis,
      MedicalReportResult: medicalReportResult || 'Standard review completed',
      LabTestAdvice: labTestAdvice || selectedLabTests.map((tid) => labTests.find((t) => t.TID === tid)?.TestName).join(', ') || 'N/A',
      PatientAdvice: patientAdvice || 'Rest and follow prescription dosage',
      VisitRemarks: visitRemarks || 'OPD clinical desk consultation',
      Status: postRecord ? 2 : 1, // 1=Draft, 2=Posted (Read only)
      ConsultationFee: consultationFee,
      ConsultationPaymentOption: consultationPaymentOption,
      PatentPaymentOption: patentPaymentOption,
      ClinicalPaymentOption: clinicalPaymentOption
    };

    const medicinesToSave: VisitMedicine[] = prescribedMedicines.map((m) => ({
      ...m,
      VisitID: newVisitID
    }));

    onAddVisit(newVisit, medicinesToSave, selectedLabTests);
    setSaveSuccess(`Clinical Consultation File ${newVisitID} successfully ${postRecord ? 'FINALIZED, SAVED & PRINT SLIP READY' : 'saved as DRAFT'}.`);
    
    // Set print preview data and open print modal if posted
    if (postRecord) {
      setPrintLayoutType('slip');
      setPrintFilter('all');
      const activePatient = patients.find(p => p.PatientID === selectedPatientId) || null;
      setPrintData({
        patient: activePatient,
        visitID: newVisitID,
        visitDate: newVisit.VisitDate,
        symptomsDiagnosis: newVisit.SymptomsDiagnosis,
        medicalReportResult: newVisit.MedicalReportResult,
        patientAdvice: newVisit.PatientAdvice,
        visitRemarks: newVisit.VisitRemarks,
        prescribedMedicines: medicinesToSave.map(m => ({
          ItemID: m.ItemID,
          MedicineDetail: m.MedicineDetail,
          Dosage: m.Dosage,
          MedicineType: m.MedicineType,
          Price: m.Price
        })),
        selectedLabTests: [...selectedLabTests],
        consultationFee: consultationFee,
        consultationPaymentOption: consultationPaymentOption,
        patentPaymentOption: patentPaymentOption,
        clinicalPaymentOption: clinicalPaymentOption
      });
      setPrintModalOpen(true);
    }

    // Clear forms if finalized
    if (postRecord) {
      setSymptomsDiagnosis('');
      setMedicalReportResult('');
      setLabTestAdvice('');
      setPatientAdvice('');
      setVisitRemarks('');
      setPrescribedMedicines([]);
      setSelectedLabTests([]);
      setMedSearch('');
      setDiagSearch('');
    }

    setTimeout(() => setSaveSuccess(''), 6000);
  };

  // Save Leave Certificate
  const handleSaveCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Select patient first.');
      return;
    }
    if (!sufferingFrom.trim()) {
      alert('Please enter clinical diagnostics suffix (Suffering From).');
      return;
    }

    const certId = `CERT-STD-${String(medicalCertificates.length + 1).padStart(3, '0')}`;
    const newCert: MedicalCertificate = {
      CertificateID: certId,
      VisitID: 'VIS-ACTIVE',
      PatientID: selectedPatientId,
      SufferingFrom: sufferingFrom,
      DurationFrom: durationFrom,
      DurationTo: durationTo,
      DateIssued: new Date().toISOString().split('T')[0]
    };

    onAddCertificate(newCert);
    setCertSuccess(`Standard Leave Certificate issued successfully under ID: ${certId}`);
    setSufferingFrom('');
    setTimeout(() => setCertSuccess(''), 6000);
  };

  // Save SBP Specialized Certificate
  const handleSaveSbpCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Select patient first.');
      return;
    }
    const pat = patients.find((p) => p.PatientID === selectedPatientId);
    if (!pat) return;

    const certId = `CERT-SBP-${String(sbpCertificates.length + 1).padStart(3, '0')}`;
    
    // Create SBP medicines details
    const mcsbpMeds = prescribedMedicines.map((pm) => {
      const itm = items.find((i) => i.ItemID === pm.ItemID);
      return {
        ItemID: pm.ItemID,
        Qty: 10, // Claims nominal dosage count
        Price: itm ? itm.Price : 0
      };
    });

    const newSbpCert: MedicalCertificateSBP = {
      CertificateID: certId,
      VisitID: 'VIS-ACTIVE',
      PatientID: selectedPatientId,
      EmployeeName: pat.PatientName,
      Designation: sbpDesignation,
      ConsultantFee: sbpConsultFee,
      CostofMedicines: autoSbpMedCost,
      TreatmentForDays: sbpTreatmentDays,
      receipttype: sbpReceiptType,
      DateIssued: new Date().toISOString().split('T')[0],
      Medicines: mcsbpMeds
    };

    onAddSbpCertificate(newSbpCert);
    setCertSuccess(`Specialized State Bank of Pakistan (SBP) Claim Certificate issued under ID: ${certId}`);
    setTimeout(() => setCertSuccess(''), 6000);
  };

  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Unknown';
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="emr-clinical-desk">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-5.5 h-5.5 text-blue-600 mr-2" />
            Electronic Medical Records (EMR) & Clinical Desk
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Diagnose patients, prescribe clinical compounds, and generate SBP panel forms</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('consult')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'consult' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Clinical Consultation</span>
          </button>
          <button
            onClick={() => setActiveSubTab('certs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'certs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBadge className="w-3.5 h-3.5" />
            <span>Leave Certificates</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sbp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'sbp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBadge className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>SBP Panel Refund</span>
          </button>
        </div>
      </div>

      {/* Main Container based on Sub-tab */}
      {activeSubTab === 'consult' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="emr-consult-container">
          
          {/* Active Consultation Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-950 flex items-center">
                <Edit3 className="w-4 h-4 text-emerald-500 mr-2" />
                Active Medical Assessment Draft
              </h3>
              
              {visitStatus === 2 && (
                <span className="text-xxs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center">
                  <Lock className="w-3 h-3 mr-1" />
                  READ ONLY LOCK
                </span>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {saveSuccess}
              </div>
            )}

            {/* Patient Selector and Lookup Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div className="md:col-span-3">
                <label className="block text-xxs font-bold text-slate-500 uppercase">Consulting Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-slate-700"
                >
                  <option value="">-- Click to select active patient queue --</option>
                  {patients
                    .filter((p) => {
                      const bookedIds = Array.from(new Set(appointments.filter(a => a.Status !== 3).map(a => a.PatientID)));
                      return bookedIds.includes(p.PatientID);
                    })
                    .map((p) => (
                      <option key={p.PatientID} value={p.PatientID}>
                        {p.PatientName} ({p.PatientID}) - Age: {p.AgeYears}y, Sex: {p.Sex}
                      </option>
                    ))
                  }
                </select>
                {patients.filter((p) => Array.from(new Set(appointments.filter(a => a.Status !== 3).map(a => a.PatientID))).includes(p.PatientID)).length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ No patients currently have active receptionist-booked appointments. Please book an appointment first.</p>
                )}
              </div>

              <div className="md:col-span-1 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPatientLookupSearch('');
                    setLookupPatientId(selectedPatientId); // Default to active consulting patient if selected
                    setPatientLookupModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xxs font-extrabold rounded-lg flex items-center justify-center transition shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  <span>🔍 Database Lookup</span>
                </button>
              </div>
            </div>

            {/* Assessment Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Symptoms & Clinical Diagnosis *</label>
                <textarea
                  placeholder="Summarize complaints, temperature, BP, and final diagnostics..."
                  rows={3}
                  required
                  value={symptomsDiagnosis}
                  onChange={(e) => setSymptomsDiagnosis(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Medical Reports & Test Results</label>
                <textarea
                  placeholder="Record physical examinations, external report findings..."
                  rows={3}
                  value={medicalReportResult}
                  onChange={(e) => setMedicalReportResult(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Patient Advice & Lifestyle Warnings</label>
                <textarea
                  placeholder="Advice on diet, rest hours, warning symptoms..."
                  rows={2}
                  value={patientAdvice}
                  onChange={(e) => setPatientAdvice(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Internal Consultation Remarks</label>
                <textarea
                  placeholder="Confidential follow-up timelines, corporate comments..."
                  rows={2}
                  value={visitRemarks}
                  onChange={(e) => setVisitRemarks(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Prescription Grid with Disease Locator Side Box Grid Wrapper */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (col-span-2): Active Inserter & Current Prescribed Items list */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Prescription Grid (Medicines Inserter)</h4>
                
                {/* Medicine Grid Inserter Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end">
                  <div className="relative md:col-span-2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Search Pharmaceutical Item</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Type name or code to search medicine..."
                        value={medSearch}
                        onChange={(e) => {
                          setMedSearch(e.target.value);
                          setShowMedResults(true);
                        }}
                        onFocus={() => setShowMedResults(true)}
                        onBlur={() => setTimeout(() => setShowMedResults(false), 250)}
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    
                    {/* Selected Medicine status tag */}
                    {rowMedicineId && (
                      <div className="mt-1.5 flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        <span>Selected: {items.find(i => i.ItemID === rowMedicineId)?.ItemName} [Stock: {items.find(i => i.ItemID === rowMedicineId)?.CStock}]</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRowMedicineId('');
                            setMedSearch('');
                          }}
                          className="text-red-500 hover:text-red-700 underline font-semibold ml-2"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {showMedResults && medSearch.trim().length > 0 && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {items
                          .filter((itm) =>
                            itm.ItemName.toLowerCase().includes(medSearch.toLowerCase()) ||
                            itm.ItemID.toLowerCase().includes(medSearch.toLowerCase())
                          )
                          .map((itm) => (
                            <div
                              key={itm.ItemID}
                              onMouseDown={() => {
                                setRowMedicineId(itm.ItemID);
                                setMedSearch(itm.ItemName);
                                setShowMedResults(false);
                              }}
                              className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{itm.ItemName}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({itm.ItemID})</span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${itm.CStock > itm.MinStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                Stock: {itm.CStock}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Dosage Formula</label>
                    <input
                      type="text"
                      placeholder="e.g. 1-0-1, 1 Daily"
                      value={rowDosage}
                      onChange={(e) => setRowDosage(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionRow}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Insert Row</span>
                    </button>
                  </div>
                </div>

                {/* Sub-inputs of row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2 border-b border-slate-200">
                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Detailed Medicine Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Take once daily after breakfast for 5 days"
                      value={rowDetail}
                      onChange={(e) => setRowDetail(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Compounding Type</label>
                    <div className="mt-2 flex space-x-4">
                      <label className="inline-flex items-center text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="medType"
                          value="P"
                          checked={rowType === 'P'}
                          onChange={() => setRowType('P')}
                          className="mr-1.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        Patent / Pre-packaged ('P')
                      </label>
                      <label className="inline-flex items-center text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="medType"
                          value="C"
                          checked={rowType === 'C'}
                          onChange={() => setRowType('C')}
                          className="mr-1.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        Clinical / Compounded ('C')
                      </label>
                    </div>
                  </div>

                  <div>
                    {rowType === 'C' ? (
                      <div className="animate-fadeIn">
                        <label className="block text-xxs font-bold text-blue-600 uppercase">Custom Price (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Decided by Doctor"
                          value={rowPrice}
                          onChange={(e) => setRowPrice(parseFloat(e.target.value) || 0)}
                          className="mt-1 w-full text-xs font-bold border border-blue-200 bg-blue-50/40 text-blue-900 rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[10px] mt-6 italic font-semibold">
                        Price auto-loaded from pharmacist inventory.
                      </div>
                    )}
                  </div>
                </div>

                {/* List of currently prescribed medicines */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                        <th className="py-2 font-bold">Medicine ID</th>
                        <th className="py-2 font-bold">Product Name</th>
                        <th className="py-2 font-bold">Instruction</th>
                        <th className="py-2 font-bold text-center">Dosage</th>
                        <th className="py-2 font-bold text-center">Type</th>
                        <th className="py-2 text-right font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescribedMedicines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 font-medium">No medicines added yet to prescription grid.</td>
                        </tr>
                      ) : (
                        prescribedMedicines.map((med, idx) => {
                          const itm = items.find((i) => i.ItemID === med.ItemID);
                          return (
                            <tr key={idx} className="hover:bg-slate-100/50">
                              <td className="py-2 font-mono text-xxs font-bold">{med.ItemID}</td>
                              <td className="py-2 font-bold text-slate-900">
                                <div>
                                  <span className="font-bold">{itm ? itm.ItemName : 'Unknown'}</span>
                                  <span className="block text-[9px] text-blue-600 font-semibold font-sans mt-0.5">
                                    Category: {MEDICINE_CATEGORIES[med.ItemID] || (med.MedicineType === 'C' ? 'In-house compounded clinical formula' : 'Pre-packaged medication')}
                                  </span>
                                  <span className="block text-[9px] text-emerald-700 font-bold mt-0.5">
                                    Rate: {med.MedicineType === 'C' ? `Rs. ${med.Price?.toFixed(2)} (Doctor Decided)` : `Rs. ${itm ? itm.Price.toFixed(2) : '0.00'} (Pharmacist Inventory)`}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 text-slate-500 font-semibold">{med.MedicineDetail}</td>
                              <td className="py-2 text-center font-bold font-mono">{med.Dosage}</td>
                              <td className="py-2 text-center">
                                <span className={`text-xxs font-bold px-1.5 py-0.2 rounded ${
                                  med.MedicineType === 'C' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {med.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                                </span>
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrescriptionRow(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
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

              {/* Right Column (col-span-1): Disease Locator Side Box */}
              <div className="lg:col-span-1 border border-blue-100 rounded-xl p-4 space-y-4 bg-white shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-blue-950 flex items-center">
                      <Sparkles className="w-4 h-4 text-amber-500 mr-1.5 shrink-0" />
                      Symptom & Disease Smart Medicine Locator
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Filter & tap to select Patent / Pre-packaged ('P') medicines</p>
                  </div>

                  {/* Disease Search Box */}
                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Search by Disease / Indication</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Type Fever, Throat, Kidney..."
                        value={diseaseSearch}
                        onChange={(e) => {
                          setDiseaseSearch(e.target.value);
                          setSelectedDiseaseFilter(''); // Clear preset selection on typing
                        }}
                        className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Preset Disease Buttons */}
                  <div className="flex flex-wrap gap-1">
                    {DISEASE_PRESETS.map((p) => {
                      const isSelected = selectedDiseaseFilter === p.keyword;
                      return (
                        <button
                          key={p.keyword}
                          type="button"
                          onClick={() => {
                            setSelectedDiseaseFilter(isSelected ? '' : p.keyword);
                            setDiseaseSearch(''); // Clear search on preset toggle
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-extrabold transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Medicine List */}
                  <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1 divide-y divide-slate-100">
                    {(() => {
                      const query = (diseaseSearch || selectedDiseaseFilter).toLowerCase().trim();
                      const filteredPatentOnly = items.filter((itm) => {
                        const name = itm.ItemName.toLowerCase();
                        const cat = (MEDICINE_CATEGORIES[itm.ItemID] || '').toLowerCase();
                        
                        if (query) {
                          if (name.includes(query) || cat.includes(query)) return true;
                          
                          // Preset rules
                          if (query === 'fever' && (itm.ItemID === 'ITM-001' || itm.ItemID === 'ITM-004' || itm.ItemID === 'ITM-008')) return true;
                          if (query === 'throat' && (itm.ItemID === 'ITM-002' || itm.ItemID === 'ITM-007' || itm.ItemID === 'ITM-010')) return true;
                          if (query === 'kidney' && (itm.ItemID === 'ITM-003' || itm.ItemID === 'ITM-009')) return true;
                          if (query === 'pain' && (itm.ItemID === 'ITM-001' || itm.ItemID === 'ITM-003' || itm.ItemID === 'ITM-008')) return true;
                          if (query === 'gastric' && itm.ItemID === 'ITM-009') return true;
                          
                          return false;
                        }
                        return true; // Show all patent if no filter
                      });

                      if (filteredPatentOnly.length === 0) {
                        return <p className="text-xxs text-slate-400 italic text-center py-6">No matching Patent ('P') medicines found.</p>;
                      }

                      return filteredPatentOnly.map((itm) => {
                        const catLabel = MEDICINE_CATEGORIES[itm.ItemID] || "Pre-packaged Patent ('P') Formula";
                        const isSelected = rowMedicineId === itm.ItemID;
                        return (
                          <div
                            key={itm.ItemID}
                            onClick={() => {
                              setRowMedicineId(itm.ItemID);
                              setMedSearch(itm.ItemName);
                              setRowType('P');
                            }}
                            className={`p-2.5 rounded-lg border text-xxs text-left flex flex-col space-y-1 cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                                : 'border-slate-150 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-900">{itm.ItemName}</span>
                              <span className="font-mono text-[9px] text-slate-400 font-bold shrink-0">{itm.ItemID}</span>
                            </div>
                            
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[9px] text-blue-700 font-extrabold bg-blue-50/80 px-1.5 py-0.2 rounded">
                                {catLabel}
                              </span>
                              <span className="font-bold font-mono text-[9px] text-emerald-700">Rs. {itm.Price.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Sourcing Knowledge Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] space-y-1 mt-2">
                  <strong className="text-amber-900 font-bold block uppercase tracking-wider text-[9px]">📍 Medicine Sourcing Guide</strong>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-950">Patent / Pre-packaged ('P'):</strong> Ready-made drugs. Purchased from inside or outside chemist stores.
                  </p>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-950">Clinical / Compounded ('C'):</strong> Custom-formulated liquid, syrup, or ointment prepared inside the clinic store.
                  </p>
                </div>
              </div>

            </div>

            {/* Laboratory Advisory Search Box Grid */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900">Diagnostics Advisory Panel (`VisitLabTest`)</h4>
                <span className="text-[10px] text-slate-400 font-semibold">{selectedLabTests.length} tests advised</span>
              </div>
              
              <div className="relative">
                <label className="block text-xxs font-bold text-slate-500 uppercase">Search Diagnostics & Labs</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type to search diagnostics (e.g. CBC, Lipid Profile, Chest X-Ray)..."
                    value={diagSearch}
                    onChange={(e) => {
                      setDiagSearch(e.target.value);
                      setShowDiagResults(true);
                    }}
                    onFocus={() => setShowDiagResults(true)}
                    onBlur={() => setTimeout(() => setShowDiagResults(false), 250)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                {showDiagResults && diagSearch.trim().length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
                    {labTests
                      .filter((t) =>
                        t.TestName.toLowerCase().includes(diagSearch.toLowerCase()) ||
                        t.TID.toLowerCase().includes(diagSearch.toLowerCase())
                      )
                      .map((test) => {
                        const isAdded = selectedLabTests.includes(test.TID);
                        return (
                          <div
                            key={test.TID}
                            onMouseDown={() => {
                              if (!isAdded) {
                                setSelectedLabTests([...selectedLabTests, test.TID]);
                              }
                              setDiagSearch('');
                              setShowDiagResults(false);
                            }}
                            className={`p-2.5 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center ${isAdded ? 'opacity-40 bg-slate-50' : ''}`}
                          >
                            <div>
                              <span className="font-bold text-slate-900">{test.TestName}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({test.TID})</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">Rs. {test.Cost}</span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Advised Checklist Row list */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advised Checklist ({selectedLabTests.length})</span>
                {selectedLabTests.length === 0 ? (
                  <p className="text-xxs text-slate-400 italic">No diagnostics advised. Use the search field above to append lab tests.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-fadeIn">
                    {selectedLabTests.map((tid) => {
                      const test = labTests.find((t) => t.TID === tid);
                      if (!test) return null;
                      return (
                        <div key={tid} className="flex items-center justify-between p-2 rounded-lg border border-emerald-100 bg-emerald-50/50 text-slate-800 text-xxs font-semibold">
                          <div className="min-w-0 pr-1">
                            <p className="font-bold text-slate-900 truncate">{test.TestName}</p>
                            <p className="text-[9px] font-mono text-emerald-700 mt-0.5">Rs. {test.Cost}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedLabTests(selectedLabTests.filter((id) => id !== tid))}
                            className="text-red-500 hover:text-red-700 font-bold text-xs p-1 hover:bg-white rounded transition"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Checkout & Medicine Sourcing Setup */}
            <div className="border border-slate-200 rounded-xl p-5 bg-blue-50/20 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-150 pb-2.5">
                <FileText className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-950">OPD Checkout, Payments & Sourcing Options</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* (A) Booking / Appointment / Consultancy Payment */}
                <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    (A) Booking / Appointment / Consultancy Fee
                  </span>
                  <div>
                    <label className="block text-xxs font-bold text-slate-500">Consultancy Fee Amount (Rs.)</label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(parseInt(e.target.value) || 0)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-slate-50 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-slate-500">Consultancy Payment Option</label>
                    <select
                      value={consultationPaymentOption}
                      onChange={(e) => setConsultationPaymentOption(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Paid - Cash">Paid - Cash (Direct counter receipt)</option>
                      <option value="Paid - Online/Card">Paid - Online / Credit Card</option>
                      <option value="Unpaid - Billed on Credit">Unpaid - To be billed at cashier</option>
                      <option value="SBP Panel Claim">SBP Panel Corporate Claim</option>
                    </select>
                  </div>
                  {appointments.find(a => a.PatientID === selectedPatientId && a.Status !== 3 && a.Status !== 4) && (
                    <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                      ✓ Active Receptionist Booking Linked: {appointments.find(a => a.PatientID === selectedPatientId && a.Status !== 3 && a.Status !== 4)?.AppointmentID}
                    </p>
                  )}
                </div>

                {/* (B) Separate P Medicines Payment Options */}
                <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    (B) Prescribed Medicines Billing Setup
                  </span>
                  <div>
                    <label className="block text-xxs font-bold text-slate-500">
                      Patent / Pre-packaged ('P') Medicine
                    </label>
                    <select
                      value={patentPaymentOption}
                      onChange={(e) => setPatentPaymentOption(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="Clinic">Dispense from Punjab Clinic Pharmacy (In-house Stock)</option>
                      <option value="Outside">Outside Store Purchase (Insist / Unstocked - Printable Slip)</option>
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                      Select "Outside Store" to generate separate printable Outside 'P' Slip.
                    </p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2.5">
                    <span className="block text-[9px] font-bold text-indigo-800 uppercase tracking-wide">In-house Compounding Policy</span>
                    <p className="text-[10px] text-indigo-950 font-medium mt-1">
                      Clinical / Compounded ('C') Medicines are <strong>always in-house medicines</strong> and will be compound-dispensed directly at the Punjab Clinic Pharmacy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => handleSaveVisit(false)}
                disabled={!canAdd}
                className={`px-5 py-2 rounded-lg text-xs font-semibold border ${
                  canAdd
                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveVisit(true)}
                disabled={!canAdd || !canPost}
                className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-md flex items-center justify-center transition ${
                  canAdd && canPost
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-4 h-4 mr-1.5 shrink-0 animate-pulse" />
                <span>Print & Save Consult</span>
              </button>
            </div>
          </div>

          {/* Consultation History Sidebar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[650px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <Search className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
              EMR Consult Directory
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 divide-y divide-slate-100">
              {visits.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-8">No historical clinical records recorded.</p>
              ) : (
                visits.map((vis) => (
                  <div
                    key={vis.VisitID}
                    onClick={() => setActiveVisitLookupId(activeVisitLookupId === vis.VisitID ? '' : vis.VisitID)}
                    className={`pt-3 first:pt-0 cursor-pointer group flex flex-col space-y-1.5 text-xs text-slate-700 transition ${
                      activeVisitLookupId === vis.VisitID ? 'bg-slate-50 p-2.5 rounded-lg border border-slate-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900 font-bold group-hover:text-emerald-600 transition">
                          {getPatientName(vis.PatientID)}
                        </strong>
                        <p className="text-xxs font-mono text-slate-400 font-semibold mt-0.5">{vis.VisitID}</p>
                      </div>
                      <span className={`text-xxs font-bold px-1.5 py-0.2 rounded uppercase ${
                        vis.Status === 2 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {vis.Status === 2 ? 'GL Posted' : 'Draft'}
                      </span>
                    </div>

                    <div className="text-xxs text-slate-500 font-medium">
                      <span>Assessed: <strong>{vis.VisitDate}</strong></span>
                    </div>

                    {/* Expand details view */}
                    {activeVisitLookupId === vis.VisitID && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 text-xxs animate-fadeIn">
                        <div>
                          <p className="font-bold uppercase text-slate-400">Diagnosis Summary</p>
                          <p className="text-slate-800 mt-1 italic font-semibold">"{vis.SymptomsDiagnosis}"</p>
                        </div>
                        {vis.MedicalReportResult && (
                          <div>
                            <p className="font-bold uppercase text-slate-400">Medical Examination</p>
                            <p className="text-slate-700 mt-1 font-semibold">{vis.MedicalReportResult}</p>
                          </div>
                        )}
                        {vis.LabTestAdvice && (
                          <div>
                            <p className="font-bold uppercase text-slate-400">Diagnostics Advised</p>
                            <p className="text-slate-700 mt-1 font-semibold">{vis.LabTestAdvice}</p>
                          </div>
                        )}
                        {vis.PatientAdvice && (
                          <div>
                            <p className="font-bold uppercase text-slate-400">Treatment Advice</p>
                            <p className="text-emerald-700 mt-1 font-semibold">{vis.PatientAdvice}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrintLayoutType('slip');
                              const activePatient = patients.find(p => p.PatientID === vis.PatientID) || null;
                              setPrintData({
                                patient: activePatient,
                                visitID: vis.VisitID,
                                visitDate: vis.VisitDate,
                                symptomsDiagnosis: vis.SymptomsDiagnosis,
                                medicalReportResult: vis.MedicalReportResult,
                                patientAdvice: vis.PatientAdvice,
                                visitRemarks: vis.VisitRemarks,
                                prescribedMedicines: [], // Historical medicines reference
                                selectedLabTests: []
                              });
                              setPrintModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center transition"
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Print Slip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Standard Leave Certificate Tab */}
      {activeSubTab === 'certs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="emr-certs-container">
          
          {/* Certificate Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <FileBadge className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
              Standard Sick Leave Rest Certificate
            </h3>

            {certSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {certSuccess}
              </div>
            )}

            <form onSubmit={handleSaveCertificate} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Select Target Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.PatientID} value={p.PatientID}>
                      {p.PatientName} ({p.PatientID})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Diagnosed Medical Ailment (Suffering From) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Typhoid Fever, Lumbar Spasm, Severe Post-Viral Asthenia"
                  value={sufferingFrom}
                  onChange={(e) => setSufferingFrom(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Leave Duration From</label>
                  <input
                    type="date"
                    required
                    value={durationFrom}
                    onChange={(e) => setDurationFrom(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Leave Duration To</label>
                  <input
                    type="date"
                    required
                    value={durationTo}
                    onChange={(e) => setDurationTo(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!canAdd}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition ${
                  canAdd ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                Generate & Record Leave Certificate
              </button>
            </form>
          </div>

          {/* Certificate View Logs / Print Simulator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Issued Certificate Register</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {medicalCertificates.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-16">No sick leave certificates generated yet.</p>
              ) : (
                medicalCertificates.map((cert) => (
                  <div key={cert.CertificateID} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 relative overflow-hidden">
                    
                    {/* Header card decor */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xxs font-mono font-bold text-slate-400">{cert.CertificateID}</span>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">PATIENT: {getPatientName(cert.PatientID)}</h4>
                      </div>
                      <button
                        onClick={() => alert(`Certificate ${cert.CertificateID} sent to Punjabi Health Dept. Queue Printer!`)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                        title="Print Certificate"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xxs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                      <p>This is to certify that the above employee is diagnosed with <strong className="text-slate-950 font-bold">"{cert.SufferingFrom}"</strong>.</p>
                      <p className="mt-1">He/She has been advised absolute physical rest from <strong className="text-slate-950">{cert.DurationFrom}</strong> to <strong className="text-slate-950">{cert.DurationTo}</strong>.</p>
                    </div>

                    <div className="text-xxs text-slate-400 font-semibold flex justify-between">
                      <span>Issued on: {cert.DateIssued}</span>
                      <span>Authorized Signature: Dr. A. Malik</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Specialized State Bank of Pakistan Certificate Form */}
      {activeSubTab === 'sbp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="emr-sbp-container">
          
          {/* SBP Refund Claims Input Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <FileBadge className="w-4.5 h-4.5 text-blue-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-950">Specialized SBP Panel Corporate Refund Form</h3>
            </div>

            {certSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {certSuccess}
              </div>
            )}

            <form onSubmit={handleSaveSbpCertificate} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Target State Bank Employee *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Corporate Account --</option>
                  {patients.map((p) => (
                    <option key={p.PatientID} value={p.PatientID}>
                      {p.PatientName} ({p.PatientID}) - {p.Occupation}
                    </option>
                  ))}
                </select>
                <span className="text-xxs text-slate-400 font-semibold mt-1 block">Selected patient's medicines and clinic visits details will map to corporate claim sheets.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Designation / Cadre</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Director, Analyst"
                    value={sbpDesignation}
                    onChange={(e) => setSbpDesignation(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Consultant Fee claimed (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={sbpConsultFee}
                    onChange={(e) => setSbpConsultFee(parseInt(e.target.value) || 1500)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Treatment Period (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={sbpTreatmentDays}
                    onChange={(e) => setSbpTreatmentDays(parseInt(e.target.value) || 3)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Receipt Type Code</label>
                  <select
                    value={sbpReceiptType}
                    onChange={(e) => setSbpReceiptType(parseInt(e.target.value) as any)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={1}>1 = General Employee Reimbursement</option>
                    <option value={2}>2 = SBP Panel Directed Invoice</option>
                  </select>
                </div>
              </div>

              {/* Live Medicine Cost Estimator warning */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xxs text-slate-700 space-y-2">
                <span className="font-bold text-blue-900 uppercase">Automatic Medicines Expense claim computation:</span>
                <p>We detected <strong className="text-blue-950 font-bold">{prescribedMedicines.filter(m => m.MedicineType === 'P').length} patent medicine line items</strong> in the clinical prescription grid tab.</p>
                <p className="mt-1 flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                  <span className="font-bold text-slate-500 font-sans">Accumulated Claims SBP Medicine refund sum:</span>
                  <strong className="text-emerald-700 font-mono text-xs">Rs. {autoSbpMedCost.toLocaleString()}</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={!canAdd}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition ${
                  canAdd ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                Publish State Bank Claim Form
              </button>
            </form>
          </div>

          {/* SBP Claim Registry list */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">SBP Specialized Panel Claims Register</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {sbpCertificates.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-16">No specialized SBP medical certificates submitted.</p>
              ) : (
                sbpCertificates.map((cert) => (
                  <div key={cert.CertificateID} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50 relative overflow-hidden text-xxs">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xxs font-mono font-bold text-blue-500">{cert.CertificateID}</span>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">{cert.EmployeeName}</h4>
                        <p className="text-xxs text-slate-400 font-semibold mt-0.5">Designation: {cert.Designation}</p>
                      </div>
                      <span className="text-xxs font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded uppercase">
                        {cert.receipttype === 2 ? 'SBP Claim Form' : 'General Claim'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2 text-slate-600">
                      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-1.5 font-semibold">
                        <span>Consultant fee claimed:</span>
                        <span className="text-right text-slate-950 font-mono">Rs. {cert.ConsultantFee.toLocaleString()}</span>
                        <span>Medicines refund claimed:</span>
                        <span className="text-right text-slate-950 font-mono">Rs. {cert.CostofMedicines.toLocaleString()}</span>
                        <span>Treatment days:</span>
                        <span className="text-right text-slate-950">{cert.TreatmentForDays} Days</span>
                      </div>

                      {/* Display Medicines detail sub-grid MCSBPMedicineDetail */}
                      <div>
                        <p className="font-bold uppercase text-slate-400 text-xxs mb-1.5">MCSBPMedicineDetail sub-grid:</p>
                        {cert.Medicines.length === 0 ? (
                          <p className="italic text-slate-400 text-xxs">No patent pharmaceuticals associated with SBP claims.</p>
                        ) : (
                          <div className="space-y-1 divide-y divide-slate-100 font-medium text-slate-500">
                            {cert.Medicines.map((m, idx) => {
                              const name = items.find((i) => i.ItemID === m.ItemID)?.ItemName || m.ItemID;
                              return (
                                <div key={idx} className="flex justify-between pt-1 first:pt-0">
                                  <span className="truncate max-w-[200px]">{name} (x{m.Qty})</span>
                                  <span className="font-mono text-slate-800">Rs. {(m.Price * m.Qty).toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-slate-400 font-semibold">
                      <span>Date Issued: {cert.DateIssued}</span>
                      <span>Verifier: SBP Desk, Punjab CMS</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Checkup Clinic Slip Print-Preview Modal Overlay */}
      {printModalOpen && (printData || historyPrintPatient) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
            
            {/* Fail-safe Dynamic Print Style Injector */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-clinic-slip, #printable-clinic-slip * {
                  visibility: visible !important;
                }
                #printable-clinic-slip {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 1.5rem !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            ` }} />

            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50 rounded-t-2xl print:hidden shrink-0 gap-4">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-600 animate-pulse" />
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {printLayoutType === 'history' ? 'Cumulative Patient Clinical Ledger' : 'Clinic Slip Ready to Print'}
                  </span>
                  <span className="text-xxs text-slate-500 font-semibold">
                    {printLayoutType === 'history' ? 'Press print to obtain patient previous medical history sheet' : 'Select layout to format and print the prescription'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {printLayoutType === 'history' ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xxs rounded-lg flex items-center shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print History Summary
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintFilter('all');
                        setTimeout(() => window.print(), 100);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xxs flex items-center shadow-sm transition cursor-pointer ${
                        printFilter === 'all'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Print Full Slip (Both)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintFilter('P');
                        setTimeout(() => window.print(), 100);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xxs flex items-center shadow-sm transition cursor-pointer ${
                        printFilter === 'P'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Print Outside 'P' Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrintFilter('C');
                        setTimeout(() => window.print(), 100);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xxs flex items-center shadow-sm transition cursor-pointer ${
                        printFilter === 'C'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Print Compounded 'C' Slip
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xxs rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 overflow-y-auto flex-1 print:p-4 print:overflow-visible text-left" id="printable-clinic-slip">
              {printLayoutType === 'history' && historyPrintPatient ? (
                <>
                  {/* Slip Header */}
                  <div className="text-center border-b-2 border-double border-slate-300 pb-3 mb-5">
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                      {clinicSettings?.ClinicName || 'Punjab Clinic & Medical System'}
                    </h2>
                    <p className="text-[10px] font-bold text-blue-800 tracking-wider uppercase mt-0.5">
                      Cumulative Patient Medical History Ledger
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {clinicSettings?.ClinicAddress || 'Saddar Bazar, Lahore Cantt, Punjab'} | Phone: {clinicSettings?.PhoneMobile || '+92-42-36612345'}
                    </p>
                  </div>

                  {/* Demographics Card Profile */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3.5 mb-5 text-[10px] font-medium text-slate-600 print:bg-white print:border-slate-300 print:rounded-lg">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Patient Name</p>
                      <p className="text-slate-950 font-extrabold text-xs mt-0.5 uppercase">{historyPrintPatient.PatientName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Patient ID</p>
                      <p className="text-slate-950 font-bold font-mono text-xs mt-0.5">{historyPrintPatient.PatientID}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Father / Husband</p>
                      <p className="text-slate-950 font-extrabold mt-0.5 uppercase">{historyPrintPatient.Father_husband}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Age / Sex</p>
                      <p className="text-slate-950 font-extrabold mt-0.5 uppercase">{historyPrintPatient.AgeYears} Years / {historyPrintPatient.Sex}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Mobile Number</p>
                      <p className="text-slate-950 font-mono mt-0.5">{historyPrintPatient.PhoneMobile}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Resident Location</p>
                      <p className="text-slate-950 font-bold mt-0.5 uppercase">
                        {cities.find(c => c.CityID === historyPrintPatient.CityID)?.CityName || 'N/A'}, Pakistan
                      </p>
                    </div>
                  </div>

                  {/* Consultation History Records list */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-xs text-slate-900 border-b border-slate-200 pb-1 flex items-center font-serif">
                      🩺 Chronological OPD Consultations ({historyPrintVisits.length} Visits)
                    </h3>
                    
                    {historyPrintVisits.length === 0 ? (
                      <p className="text-xxs text-slate-400 italic py-4 text-center">No previous clinical history registered for this patient profile.</p>
                    ) : (
                      <div className="space-y-4">
                        {historyPrintVisits.map((v, i) => (
                          <div key={v.VisitID} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3 text-[10px] print:break-inside-avoid">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 bg-slate-50 p-2 rounded-lg print:bg-slate-50/50">
                              <div>
                                <span className="font-bold text-slate-800">Consultation #{historyPrintVisits.length - i}</span>
                                <span className="text-slate-400 mx-2">|</span>
                                <span className="font-mono text-slate-500 font-bold">{v.VisitID}</span>
                              </div>
                              <span className="font-extrabold text-blue-800">{v.VisitDate}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-medium">
                              <div>
                                <span className="text-slate-400 block uppercase font-bold text-[8px]">Symptomology & Diagnosis</span>
                                <p className="text-slate-900 mt-0.5 italic font-semibold">"{v.SymptomsDiagnosis}"</p>
                              </div>
                              {v.MedicalReportResult && (
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold text-[8px]">Physical Exam Findings</span>
                                  <p className="text-slate-800 mt-0.5 font-semibold">{v.MedicalReportResult}</p>
                                </div>
                              )}
                            </div>

                            {v.LabTestAdvice && (
                              <div className="bg-slate-50/30 p-2 rounded-lg border border-slate-150">
                                <span className="text-slate-400 block uppercase font-bold text-[8px]">Diagnostics & Laboratory Advice</span>
                                <p className="text-slate-800 mt-0.5 font-bold font-mono">{v.LabTestAdvice}</p>
                              </div>
                            )}

                            {v.PatientAdvice && (
                              <div className="bg-emerald-50/20 p-2 rounded-lg border border-emerald-100">
                                <span className="text-emerald-700 block uppercase font-bold text-[8px]">Patient Treatment Directives</span>
                                <p className="text-emerald-900 mt-0.5 font-semibold">{v.PatientAdvice}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Signature block */}
                  <div className="flex justify-between items-end border-t border-slate-250 pt-6 mt-10 text-[9px] font-semibold text-slate-400">
                    <div>
                      <p>{clinicSettings?.ClinicName || 'Punjab Clinic Management System'}</p>
                      <p className="font-mono text-[8px] mt-0.5">Verification Ledger Hash: HIS-{historyPrintPatient.PatientID}</p>
                    </div>
                    <div className="text-center w-48 border-t border-slate-400 pt-1 text-slate-800">
                      <p className="font-bold uppercase tracking-wider">{clinicSettings?.DoctorName || 'Consultant Physician'}</p>
                      <p className="text-[8px] text-slate-400">{clinicSettings?.DoctorSignatureText || 'Doctor Signature / Seal'}</p>
                    </div>
                  </div>
                </>
              ) : printData ? (
                (() => {
                  const filteredMeds = printData.prescribedMedicines.filter((med) => {
                    if (printFilter === 'P') return med.MedicineType === 'P';
                    if (printFilter === 'C') return med.MedicineType === 'C';
                    return true;
                  });
                  return (
                    <>
                    {/* Slip Header */}
                    <div className="text-center border-b-2 border-double border-slate-300 pb-3 mb-5">
                      <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                        {clinicSettings?.ClinicName || 'Punjab Clinic & Medical System'}
                      </h2>
                      <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-0.5">
                        {printFilter === 'all' && 'Comprehensive Family Care & Advanced OPD Consultations'}
                        {printFilter === 'P' && 'Outside Patient Prescription Slip (Pre-packaged \'/P\')'}
                        {printFilter === 'C' && 'Internal Pharmacy Compounding Request (Clinical \'/C\')'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {clinicSettings?.ClinicAddress || 'Saddar Bazar, Lahore Cantt, Punjab'} | Phone: {clinicSettings?.PhoneMobile || '+92-42-36612345'}
                      </p>
                    </div>

                    {/* Sourcing Banners & Instruction Logs */}
                    {printFilter === 'P' && (
                      <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xxs font-semibold animate-fadeIn print:bg-white print:border-slate-300 print:text-slate-900">
                        <p className="uppercase text-[9px] tracking-wider mb-1 text-amber-800 font-extrabold flex items-center">
                          ⚠️ OUTSIDE PATENT STORE PURCHASE PERMIT (Pre-packaged 'P' Medicines Only)
                        </p>
                        <p className="leading-relaxed font-medium">
                          This slip certifies that the prescribed Pre-packaged Patent ('P') medicines listed below are either not in stock at Punjab Clinic Pharmacy or the patient insists on external purchase. The patient is authorized to obtain these pre-packaged items from any external licensed chemist store.
                        </p>
                      </div>
                    )}

                    {printFilter === 'C' && (
                      <div className="mb-5 p-3.5 bg-indigo-50 border border-indigo-300 rounded-xl text-indigo-900 text-xxs font-semibold animate-fadeIn print:bg-white print:border-slate-300 print:text-slate-900">
                        <p className="uppercase text-[9px] tracking-wider mb-1 text-indigo-800 font-extrabold flex items-center">
                          🔬 INTERNAL PHARMACY COMPOUNDING REQUEST (Clinical 'C' Formulation Only)
                        </p>
                        <p className="leading-relaxed font-medium">
                          This slip is an internal formulation order for custom Compounded Clinical ('C') medicines. The patient is directed to go to the internal Punjab Clinic pharmacy store and hand over this slip to our compounding pharmacist for immediate preparation.
                        </p>
                      </div>
                    )}

                    {/* Patient Demographics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3.5 mb-5 text-[10px] font-medium text-slate-600 print:bg-white print:border-slate-300 print:rounded-lg">
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Patient Name</p>
                        <p className="text-slate-950 font-extrabold text-xs mt-0.5 uppercase">{printData.patient?.PatientName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Patient ID</p>
                        <p className="text-slate-950 font-bold font-mono text-xs mt-0.5">{printData.patient?.PatientID || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Age / Sex</p>
                        <p className="text-slate-950 font-extrabold mt-0.5 uppercase">{printData.patient?.AgeYears} Years / {printData.patient?.Sex}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
                        <p className="text-slate-950 font-mono mt-0.5">{printData.patient?.PhoneMobile || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Slip / Visit ID</p>
                        <p className="text-slate-950 font-bold font-mono mt-0.5">{printData.visitID}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Checkup Date</p>
                        <p className="text-slate-950 font-mono mt-0.5">{printData.visitDate}</p>
                      </div>
                    </div>

                    {/* Assessment Textareas */}
                    {printFilter !== 'P' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        {/* Symptoms & Clinical Diagnosis */}
                        <div className="space-y-1 bg-slate-50/40 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-250">
                          <h3 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center">
                            <FileText className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                            Symptoms & Clinical Diagnosis
                          </h3>
                          <p className="text-xs text-slate-900 font-semibold whitespace-pre-line mt-1">{printData.symptomsDiagnosis}</p>
                        </div>

                        {/* Medical Reports & Test Results */}
                        {printData.medicalReportResult && (
                          <div className="space-y-1 bg-slate-50/40 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-250">
                            <h3 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center">
                              <CheckCircle className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                              Medical Examination & Vitals
                            </h3>
                            <p className="text-xs text-slate-800 whitespace-pre-line mt-1">{printData.medicalReportResult}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rx Prescription Grid */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-white mb-5 print:border-slate-300">
                      <h3 className="font-extrabold text-xs text-slate-950 tracking-wider mb-2.5 pb-1 border-b border-slate-100 flex items-center font-serif">
                        <span className="text-emerald-700 text-sm mr-1 font-extrabold">Rx</span> Prescribed Medicines ({filteredMeds.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[9px]">
                              <th className="py-1.5 font-bold">Pharmaceutical Name</th>
                              <th className="py-1.5 text-center font-bold">Type</th>
                              <th className="py-1.5 text-center font-bold">Dosage Formula</th>
                              {printFilter !== 'P' && <th className="py-1.5 text-right font-bold">Unit Rate (Rs.)</th>}
                              {printFilter !== 'P' && <th className="py-1.5 text-right font-bold">Est. Cost (10 U)</th>}
                              <th className="py-1.5 text-right font-bold">Advisory Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {filteredMeds.length === 0 ? (
                              <tr>
                                <td colSpan={printFilter === 'P' ? 4 : 6} className="py-3 text-center text-slate-400 italic font-semibold">
                                  No specified items for this filter layout.
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                let totalEstCost = 0;
                                const renderedRows = filteredMeds.map((med, idx) => {
                                  const itm = items.find((i) => i.ItemID === med.ItemID);
                                  const unitRate = med.Price !== undefined ? med.Price : (itm ? itm.Price : (med.MedicineType === 'C' ? 15.0 : 10.0));
                                  const itemEstCost = unitRate * 10;
                                  totalEstCost += itemEstCost;
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/40">
                                      <td className="py-1.5 font-bold text-slate-900">{itm ? itm.ItemName : med.ItemID}</td>
                                      <td className="py-1.5 text-center">
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                          med.MedicineType === 'C' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                        }`}>
                                          {med.MedicineType === 'C' ? 'Compounded (C)' : 'Patent (P)'}
                                        </span>
                                      </td>
                                      <td className="py-1.5 text-center font-bold text-slate-950 font-mono">{med.Dosage}</td>
                                      {printFilter !== 'P' && <td className="py-1.5 text-right font-mono text-slate-900 font-semibold">Rs. {unitRate.toFixed(2)}</td>}
                                      {printFilter !== 'P' && <td className="py-1.5 text-right font-mono text-slate-900 font-bold">Rs. {itemEstCost.toFixed(2)}</td>}
                                      <td className="py-1.5 text-right text-slate-600 font-semibold">{med.MedicineDetail}</td>
                                    </tr>
                                  );
                                });

                                return (
                                  <>
                                    {renderedRows}
                                    {/* Subtotal row */}
                                    {printFilter !== 'P' && (
                                      <tr className="border-t border-slate-300 bg-slate-50/30 font-bold">
                                        <td colSpan={4} className="py-2 text-right text-slate-500 text-[9px] uppercase">Prescription Medicines Subtotal:</td>
                                        <td className="py-2 text-right font-mono text-emerald-800 font-extrabold text-[10px]">Rs. {totalEstCost.toFixed(2)}</td>
                                        <td></td>
                                      </tr>
                                    )}
                                    {/* Overall Ticket Summary on Print Slip */}
                                    {printFilter !== 'P' && (
                                      <tr className="border-t-2 border-slate-300 bg-emerald-50/20 font-bold">
                                        <td colSpan={4} className="py-2 text-right text-slate-600 text-[9px] uppercase">
                                          Total Ticket Est. (Fee + Medicines):
                                        </td>
                                        <td className="py-2 text-right font-mono text-emerald-900 font-extrabold text-[11px]">
                                          Rs. {((printData?.consultationFee || 1500) + totalEstCost).toFixed(2)}
                                        </td>
                                        <td className="py-2 text-right text-[8px] text-slate-400 font-semibold">
                                          Fee: Rs. {printData?.consultationFee || 1500} ({printData?.consultationPaymentOption || 'Paid'})
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Lab Panel & Patient Advice */}
                    {printFilter !== 'P' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Diagnostics Advisory Panel */}
                        <div className="space-y-1 bg-slate-50/40 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-250">
                          <h3 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center">
                            <Search className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                            Diagnostics Advisory Panel (`VisitLabTest`)
                          </h3>
                          {printData.selectedLabTests.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic mt-1.5">No clinical laboratory tests advised.</p>
                          ) : (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {printData.selectedLabTests.map((tid) => {
                                const test = labTests.find((t) => t.TID === tid);
                                return (
                                  <span key={tid} className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100 print:bg-white print:border-slate-300">
                                    {test ? test.TestName : tid}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Patient Advice & Lifestyle Warnings */}
                        {printData.patientAdvice && (
                          <div className="space-y-1 bg-slate-50/40 p-3 rounded-lg border border-slate-100 print:bg-white print:border-slate-250">
                            <h3 className="font-bold text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1 flex items-center">
                              <FileBadge className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                              Patient Advice & Lifestyle Warnings
                            </h3>
                            <p className="text-[10px] text-emerald-800 font-semibold whitespace-pre-line mt-1">{printData.patientAdvice}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Consultation Remarks */}
                    {printFilter !== 'P' && printData.visitRemarks && (
                      <div className="mb-6 p-3 rounded-lg border border-indigo-100 bg-indigo-50/10 text-[10px] print:border-slate-300 print:bg-white">
                        <span className="font-bold text-indigo-900 uppercase block mb-0.5 tracking-wider">Internal Remarks / Notes:</span>
                        <p className="text-slate-600 italic font-semibold">"{printData.visitRemarks}"</p>
                      </div>
                    )}

                    {/* Clinic Sign-Off */}
                    <div className="flex justify-between items-end border-t border-slate-250 pt-6 mt-10 text-[9px] font-semibold text-slate-400">
                      <div>
                        <p>{clinicSettings?.ClinicName || 'Punjab Clinic Management System'}</p>
                        <p className="font-mono text-[8px] mt-0.5">Verification Signature Hash: CRV-{printData.visitID}</p>
                      </div>
                      <div className="text-center w-48 border-t border-slate-400 pt-1 text-slate-800">
                        <p className="font-bold uppercase tracking-wider">{clinicSettings?.DoctorName || 'Consultant Physician'}</p>
                        <p className="text-[8px] text-slate-400">{clinicSettings?.DoctorSignatureText || 'Doctor Signature / Seal'}</p>
                      </div>
                    </div>
                  </>
                );
              })() ) : null}
            </div>

          </div>
        </div>
      )}

      {/* Patient Database Lookup & Health History Modal */}
      {patientLookupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9998] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col animate-fadeIn text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Punjab Clinic Patient Database Lookup</h3>
                  <p className="text-xxs text-slate-500 font-semibold">Search patient records, view demographic profile, and print cumulative health histories</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPatientLookupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[450px]">
              
              {/* Left Column (md:col-span-4): Patient Directory List */}
              <div className="md:col-span-4 space-y-3 border-r border-slate-100 pr-4 flex flex-col">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Search Patient Database</label>
                  <input
                    type="text"
                    placeholder="Search by ID, name, phone..."
                    value={patientLookupSearch}
                    onChange={(e) => setPatientLookupSearch(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                  {patients
                    .filter(p => {
                      const q = patientLookupSearch.toLowerCase().trim();
                      if (!q) return true;
                      return p.PatientName.toLowerCase().includes(q) ||
                             p.PatientID.toLowerCase().includes(q) ||
                             p.PhoneMobile.includes(q);
                    })
                    .map((p) => {
                      const isSelected = lookupPatientId === p.PatientID;
                      return (
                        <div
                          key={p.PatientID}
                          onClick={() => setLookupPatientId(p.PatientID)}
                          className={`p-2.5 rounded-lg border text-xxs cursor-pointer transition text-left flex flex-col space-y-0.5 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/40 font-bold'
                              : 'border-slate-150 hover:bg-slate-50 bg-slate-50/20'
                          }`}
                        >
                          <span className="font-bold text-slate-950 text-xs">{p.PatientName}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{p.PatientID} | {p.PhoneMobile}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column (md:col-span-8): Active Demographics & Chronological History */}
              <div className="md:col-span-8 space-y-4 flex flex-col max-h-[450px] overflow-y-auto pr-1 text-left">
                {(() => {
                  const pat = patients.find(p => p.PatientID === lookupPatientId);
                  if (!pat) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 space-y-2">
                        <Search className="w-8 h-8 opacity-40 text-slate-500" />
                        <p className="text-xs font-semibold italic">Select a patient from the left panel to examine medical history records.</p>
                      </div>
                    );
                  }

                  const patientVisits = visits.filter(v => v.PatientID === pat.PatientID);

                  return (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Demographic profile */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xxs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Demographic Card Profile</h4>
                          <button
                            type="button"
                            onClick={() => {
                              // Trigger previous clinical history print
                              setPrintLayoutType('history');
                              setHistoryPrintPatient(pat);
                              setHistoryPrintVisits(patientVisits);
                              setPrintModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg flex items-center shadow-md shadow-blue-500/10 cursor-pointer transition"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print Previous History
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-medium text-slate-600">
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Patient Name</span>
                            <strong className="text-slate-900 font-extrabold text-xs">{pat.PatientName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Patient ID</span>
                            <strong className="text-slate-900 font-extrabold text-xs font-mono">{pat.PatientID}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Father/Husband</span>
                            <strong className="text-slate-900">{pat.Father_husband}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Age / Sex</span>
                            <strong className="text-slate-900">{pat.AgeYears}y / {pat.Sex}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Mobile Phone</span>
                            <strong className="text-slate-900 font-mono">{pat.PhoneMobile}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">City Residence</span>
                            <strong className="text-slate-900">
                              {cities.find(c => c.CityID === pat.CityID)?.CityName || 'N/A'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Clinical Consultations List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1.5 flex items-center">
                          📋 Chronological Health Journal ({patientVisits.length} Records)
                        </h4>

                        {patientVisits.length === 0 ? (
                          <p className="text-xxs text-slate-400 italic py-6 text-center bg-slate-50/50 rounded-xl border border-slate-100">No clinical visits recorded in our archives for this patient.</p>
                        ) : (
                          <div className="space-y-3">
                            {patientVisits.map((v, idx) => (
                              <div key={v.VisitID} className="border border-slate-150 rounded-xl p-3 bg-white space-y-2.5 shadow-sm">
                                <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-md text-[10px]">
                                  <strong className="text-slate-800">Visit {patientVisits.length - idx} (ID: {v.VisitID})</strong>
                                  <strong className="text-blue-700">{v.VisitDate}</strong>
                                </div>

                                <div className="space-y-1.5 text-xxs font-medium text-slate-600">
                                  <div>
                                    <span className="text-slate-400 uppercase font-bold text-[8px] block">Diagnosis Summarized:</span>
                                    <p className="text-slate-900 font-semibold italic mt-0.5">"{v.SymptomsDiagnosis}"</p>
                                  </div>
                                  {v.MedicalReportResult && (
                                    <div>
                                      <span className="text-slate-400 uppercase font-bold text-[8px] block">Physical Exam Findings:</span>
                                      <p className="text-slate-800 font-semibold mt-0.5">{v.MedicalReportResult}</p>
                                    </div>
                                  )}
                                  {v.LabTestAdvice && (
                                    <div>
                                      <span className="text-slate-400 uppercase font-bold text-[8px] block">Laboratory Advice:</span>
                                      <p className="text-slate-800 font-semibold mt-0.5 font-mono">{v.LabTestAdvice}</p>
                                    </div>
                                  )}
                                  {v.PatientAdvice && (
                                    <div>
                                      <span className="text-slate-400 uppercase font-bold text-[8px] block">Treatment Advice:</span>
                                      <p className="text-emerald-700 font-semibold mt-0.5">{v.PatientAdvice}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <span className="text-[10px] text-slate-400 font-semibold">Registered Patient Record Portal</span>
              <button
                type="button"
                onClick={() => setPatientLookupModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close Portal
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
