/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Lock,
  Edit3,
  Search,
  CheckCircle,
  Check,
  FileBadge,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  History,
  FlaskConical,
  Pill,
  Tag,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  UserX,
  UserPlus,
  CreditCard,
  Building
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
  City,
  NhcPatientHistory,
  MongoDbSettings,
  SmartLocatorMedicine
} from '../types';

interface EMRDeskProps {
  patients: Patient[];
  appointments: Appointment[];
  items: Item[];
  labTests: LabTest[];
  visits: Visit[];
  visitMedicines?: VisitMedicine[];
  onAddVisit: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  onUpdateVisit?: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  medicalCertificates: MedicalCertificate[];
  onAddCertificate: (c: MedicalCertificate) => void;
  sbpCertificates: MedicalCertificateSBP[];
  onAddSbpCertificate: (c: MedicalCertificateSBP) => void;
  userRights: UserRight[];
  clinicSettings?: ClinicSettings;
  cities?: City[];
  nhcPatients?: NhcPatientHistory[];
  mongoDbSettings?: MongoDbSettings;
  onAddPatient?: (p: Patient) => void;
  onUpdatePatient?: (p: Patient) => void;
  smartLocatorMedicines?: SmartLocatorMedicine[];
}

function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—') return dateStr || 'N/A';
  try {
    const cleanStr = dateStr.trim();
    if (cleanStr.length <= 10) return cleanStr;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return cleanStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

export default function EMRDesk({
  patients,
  appointments = [],
  items,
  labTests,
  visits,
  visitMedicines = [],
  onAddVisit,
  onUpdateVisit,
  medicalCertificates,
  onAddCertificate,
  sbpCertificates,
  onAddSbpCertificate,
  userRights,
  clinicSettings,
  cities = [],
  nhcPatients = [],
  mongoDbSettings,
  onAddPatient,
  onUpdatePatient,
  smartLocatorMedicines = []
}: EMRDeskProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'certs' | 'sbp'>('certs');
  const skipResetRef = useRef(false);
  const medSearchInputRef = useRef<HTMLInputElement>(null);

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'emr');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Selected patient for active consultation session
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Track previous/current patient in session
  const [previousPatientId, setPreviousPatientId] = useState<string>('');
  const [lastId, setLastId] = useState<string>('');
  useEffect(() => {
    if (selectedPatientId && selectedPatientId !== lastId) {
      if (lastId) {
        setPreviousPatientId(lastId);
      }
      setLastId(selectedPatientId);
    }
  }, [selectedPatientId, lastId]);

  // Edit patient modal states
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
  const [editPatientName, setEditPatientName] = useState('');
  const [editPatientFather, setEditPatientFather] = useState('');
  const [editPatientAge, setEditPatientAge] = useState<number>(30);
  const [editPatientSex, setEditPatientSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editPatientPhone, setEditPatientPhone] = useState('');
  const [editPatientAddress, setEditPatientAddress] = useState('');
  const [editPatientCityId, setEditPatientCityId] = useState<number>(1);

  // Initialize edit fields
  const handleOpenEditPatient = () => {
    const pat = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId));
    if (pat) {
      setEditPatientName(pat.PatientName || '');
      setEditPatientFather(pat.Father_husband || '');
      setEditPatientAge(pat.AgeYears || 30);
      setEditPatientSex((pat.Sex === 'Male' || pat.Sex === 'Female' || pat.Sex === 'Other') ? pat.Sex : 'Male');
      setEditPatientPhone(pat.PhoneMobile || '');
      setEditPatientAddress(pat.Address || '');
      setEditPatientCityId(pat.CityID || 1);
      setEditPatientModalOpen(true);
    } else {
      alert('Patient not found.');
    }
  };

  const handleSavePatientEdit = () => {
    if (!editPatientName.trim()) {
      alert('Patient name is required.');
      return;
    }
    const pat = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId));
    if (pat && onUpdatePatient) {
      const updated: Patient = {
        ...pat,
        PatientName: editPatientName,
        Father_husband: editPatientFather,
        AgeYears: editPatientAge,
        Sex: editPatientSex,
        PhoneMobile: editPatientPhone,
        Address: editPatientAddress,
        CityID: editPatientCityId
      };
      onUpdatePatient(updated);
      setEditPatientModalOpen(false);
      // Update patient search text to match the edited name
      setPatientSearch(`${updated.PatientName} (${updated.PatientID})`);
      setSaveSuccess('Patient demographic profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  // Helper to cross-reference patient IDs if patient has been converted/registered/imported
  const getMatchingPatientIds = (targetId: string): string[] => {
    if (!targetId) return [];
    const matchedIds = new Set<string>([targetId]);
    
    const pSelected = patients.find(p => p.PatientID === targetId) ||
                      (localNhcPatients || []).find(p => p.PatientID === targetId) ||
                      (nhcPatients || []).find(p => p.PatientID === targetId);
                      
    if (pSelected) {
      const name = pSelected.PatientName?.trim().toLowerCase();
      const phone = String(pSelected.PhoneMobile || '').trim().replace(/[^0-9]/g, '');
      
      if (name) {
        patients.forEach(p => {
          if (p.PatientName?.trim().toLowerCase() === name) {
            matchedIds.add(p.PatientID);
          } else if (phone && phone.length >= 7 && String(p.PhoneMobile || '').trim().replace(/[^0-9]/g, '') === phone) {
            matchedIds.add(p.PatientID);
          }
        });
        (localNhcPatients || []).forEach(p => {
          if (p.PatientName?.trim().toLowerCase() === name) {
            matchedIds.add(p.PatientID);
          } else if (phone && phone.length >= 7 && String(p.PhoneMobile || '').trim().replace(/[^0-9]/g, '') === phone) {
            matchedIds.add(p.PatientID);
          }
        });
        (nhcPatients || []).forEach(p => {
          if (p.PatientName?.trim().toLowerCase() === name) {
            matchedIds.add(p.PatientID);
          } else if (phone && phone.length >= 7 && String(p.PhoneMobile || '').trim().replace(/[^0-9]/g, '') === phone) {
            matchedIds.add(p.PatientID);
          }
        });
      }
    }
    return Array.from(matchedIds);
  };
  
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
  const [matchingRowIndex, setMatchingRowIndex] = useState<number | null>(null);
  const [rowSearchTerm, setRowSearchTerm] = useState('');

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
    cardsPayment?: string;
    clinicalMedicinePayment?: string;
    patentPaymentOption?: string;
    clinicalPaymentOption?: string;
  } | null>(null);

  // Prescription Grid
  const [prescribedMedicines, setPrescribedMedicines] = useState<Omit<VisitMedicine, 'VisitID'>[]>([]);
  // Row scratchpad
  const [rowMedicineId, setRowMedicineId] = useState('');
  const [rowDetail, setRowDetail] = useState('');
  const [rowDosage, setRowDosage] = useState('');
  const [rowType, setRowType] = useState<'C' | 'P' | null>(null); // Starts as null to enforce choosing type first
  const [rowPrice, setRowPrice] = useState<number>(15); // Default Custom Price for Clinical Compounded 'C'
  const [rowExpireDate, setRowExpireDate] = useState('');
  const [rowNotes50, setRowNotes50] = useState('');
  const [rowQtyOfTab, setRowQtyOfTab] = useState<number>(30);
  const [commonClinicalExpireDate, setCommonClinicalExpireDate] = useState<string>('');

  // Helper to distinguish Clinical vs Patent items in inventory
  const isClinicalItem = (itemId: string): boolean => {
    const found = (items || []).find(itm => itm.ItemID === itemId);
    if (found && found.MedicineType) {
      return found.MedicineType === 'C';
    }
    // Explicitly classify odd items or specific item IDs as Clinical compounding formulation salts
    const clinicalIds = ['ITM-003', 'ITM-005', 'ITM-006', 'ITM-008', 'ITM-010'];
    return clinicalIds.includes(itemId);
  };

  // Sync common expiry date to all clinical medicines in the grid when changed
  useEffect(() => {
    if (commonClinicalExpireDate) {
      setPrescribedMedicines(prev => prev.map(m => m.MedicineType === 'C' ? { ...m, ExpireDate: commonClinicalExpireDate } : m));
    }
  }, [commonClinicalExpireDate]);

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
  const [consultationFee, setConsultationFee] = useState<number | ''>('');
  const [consultationPaymentOption, setConsultationPaymentOption] = useState('Paid - Cash');
  const [cardsPayment, setCardsPayment] = useState('');
  const [clinicalMedicinePayment, setClinicalMedicinePayment] = useState('');
  const [patentPaymentOption, setPatentPaymentOption] = useState('Clinic');
  const [clinicalPaymentOption, setClinicalPaymentOption] = useState('Clinic');
  const [printFilter, setPrintFilter] = useState<'all' | 'P' | 'C'>('all');
  const [isCurrentVisitSaved, setIsCurrentVisitSaved] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState('');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Disease search, tags & pre-packaged categories state
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('');
  const [locatorTab, setLocatorTab] = useState<'excel' | 'preset'>('excel');
  
  // Patient Lookup Modal
  const [patientLookupModalOpen, setPatientLookupModalOpen] = useState(false);
  const [locatorModalOpen, setLocatorModalOpen] = useState(false);
  const [labTestsModalOpen, setLabTestsModalOpen] = useState(false);
  const [patientLookupSearch, setPatientLookupSearch] = useState('');
  const [lookupPatientId, setLookupPatientId] = useState('');

  // Expiry Date picker states for repeated medicines
  const [repeatDatePickerOpen, setRepeatDatePickerOpen] = useState(false);
  const [repeatSelectedExpiryDate, setRepeatSelectedExpiryDate] = useState('');
  const [pendingRepeatMeds, setPendingRepeatMeds] = useState<any[]>([]);
  const [pendingSymptomsDiagnosis, setPendingSymptomsDiagnosis] = useState('');
  const [repeatMedSearch, setRepeatMedSearch] = useState('');
  const [showRepeatMedResults, setShowRepeatMedResults] = useState(false);

  // Patient Registration Modal states
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regFatherHusband, setRegFatherHusband] = useState('');
  const [regAge, setRegAge] = useState<number>(30);
  const [regSex, setRegSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regMaritalStatus, setRegMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Single');
  const [regOccupation, setRegOccupation] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCityId, setRegCityId] = useState<number>(1);
  const [regMobilePhone, setRegMobilePhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Local state for NHC patients to reflect live database updates
  const [localNhcPatients, setLocalNhcPatients] = useState<NhcPatientHistory[]>([]);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  // Helper function for extremely robust, multi-word, normalized patient search
  const matchPatientRecord = (p: { PatientName?: string, PatientID?: string, PhoneMobile?: string | number }, query: string): boolean => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return true;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    
    const name = String(p.PatientName || '').toLowerCase();
    const id = String(p.PatientID || '').toLowerCase();
    const phone = String(p.PhoneMobile || '').toLowerCase();
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanId = id.replace(/[^0-9a-zA-Z]/g, '');

    return terms.every(term => {
      const cleanTerm = term.replace(/[^0-9a-zA-Z]/g, '');
      
      if (name.includes(term)) return true;
      if (id.includes(term)) return true;
      if (phone.includes(term)) return true;
      
      if (cleanTerm) {
        if (cleanId.includes(cleanTerm)) return true;
        if (cleanPhone.includes(cleanTerm)) return true;
      }
      
      return false;
    });
  };

  const fetchLookupPatients = (queryVal: string) => {
    const trimmed = queryVal.trim();
    if (!trimmed) {
      setLocalNhcPatients([]);
      return;
    }
    setIsLookupLoading(true);
    const bridgeUrl = mongoDbSettings?.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(trimmed)}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setLocalNhcPatients(data);
        }
      })
      .catch(e => console.warn('Could not load filtered NHC patient history in EMRDesk:', e.message))
      .finally(() => {
        setIsLookupLoading(false);
      });
  };

  useEffect(() => {
    // When the modal opens, we start with empty local state to prevent browser hanging.
    if (patientLookupModalOpen) {
      setLocalNhcPatients([]);
      setIsLookupLoading(false);
    }
  }, [patientLookupModalOpen]);

  // Patient History Printing States
  const [printLayoutType, setPrintLayoutType] = useState<'slip' | 'history' | 'lab' | 'label'>('slip');
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
      setConsultationFee('');
    }
  }, [selectedPatientId]);

  // Success flags
  const [saveSuccess, setSaveSuccess] = useState('');
  const [certSuccess, setCertSuccess] = useState('');

  // Selected visit lookup for history / read-only viewing
  const [activeVisitLookupId, setActiveVisitLookupId] = useState('');

  // Selected visit date filter state
  const [emrSelectedVisitDate, setEmrSelectedVisitDate] = useState('All');

  // Reset selected visit date filter and form states whenever patient changes
  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      if (selectedPatientId) {
        setHistoryModalOpen(true);
      }
      return;
    }
    setEmrSelectedVisitDate('All');
    setSymptomsDiagnosis('');
    setMedicalReportResult('');
    setLabTestAdvice('');
    setPatientAdvice('');
    setVisitRemarks('');
    setPrescribedMedicines([]);
    setSelectedLabTests([]);
    setMedSearch('');
    setDiagSearch('');
    setCardsPayment('');
    setClinicalMedicinePayment('');
    setIsCurrentVisitSaved(false);
    setPrintData(null);
    if (selectedPatientId) {
      setHistoryModalOpen(true);
    }
  }, [selectedPatientId]);

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

  // Handle patient selection change to load previous medical history and auto-fetch their NHC history from backend
  useEffect(() => {
    if (!selectedPatientId) return;
    
    // Auto-fetch this patient's NHC clinical records if they exist
    const bridgeUrl = mongoDbSettings?.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(selectedPatientId)}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLocalNhcPatients(prev => {
            const existingIds = new Set(prev.map(p => String(p._id || '')));
            const newRecords = data.filter(d => !existingIds.has(String(d._id || '')));
            return [...prev, ...newRecords];
          });
        }
      })
      .catch(e => console.warn('Could not load NHC patient history for selected patient:', e.message));

    const previousVisit = visits.find((v) => String(v.PatientID) === String(selectedPatientId) && v.Status === 2);
    if (previousVisit) {
      // Just for preview of historical medical summary
    }
  }, [selectedPatientId, visits, mongoDbSettings]);

  // Synchronize patient search input text with selected patient ID
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => String(pat.PatientID) === String(selectedPatientId)) ||
                (localNhcPatients || []).find(pat => String(pat.PatientID) === String(selectedPatientId));
      if (p) {
        setPatientSearch(`${p.PatientName} (${p.PatientID})`);
      } else {
        setPatientSearch('');
      }
    } else {
      setPatientSearch('');
    }
  }, [selectedPatientId, patients, localNhcPatients]);

  // Handler: Add row to prescription list
  const handleAddPrescriptionRow = () => {
    if (!rowType) {
      alert('Please select Medicine Type (Clinical or Patent) first.');
      return;
    }
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
        Dosage: rowDosage.toUpperCase().trim(),
        MedicineType: rowType,
        Price: rowType === 'C' ? 0 : undefined,
        ExpireDate: rowType === 'C' ? commonClinicalExpireDate : undefined,
        Qty: rowType === 'C' ? rowQtyOfTab : undefined
      }
    ]);

    // Reset row scratchpad (retain selected rowType so the doctor can add multiple of the same type sequentially)
    setRowMedicineId('');
    setMedSearch('');
    setRowDetail('');
    setRowDosage('');
    setRowQtyOfTab(30);

    // Focus search box for next medicine
    setTimeout(() => {
      medSearchInputRef.current?.focus();
    }, 50);
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

  // Smart helper to search and match medicine names with current Pharmacy POS & Inventory medicines
  const matchMedicineToInventory = (medName: string, itemsList: Item[]): Item | null => {
    if (!medName) return null;
    const cleanName = medName.toLowerCase().trim();

    // 1. Direct case-insensitive match
    let matched = itemsList.find(i => i.ItemName.toLowerCase().trim() === cleanName);
    if (matched) return matched;

    // 2. ID match
    matched = itemsList.find(i => i.ItemID.toLowerCase().trim() === cleanName);
    if (matched) return matched;

    // Helper to sanitize common prefixes, suffixes, dosage forms
    const sanitize = (name: string) => {
      return name
        .toLowerCase()
        .replace(/\b(tab|capsule|cap|syr|syrup|inj|injection|susp|suspension|drops|tbl|mg|ml|mcg|g|gm|amp|vial|tablet)\b\.?/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const cleanSanitized = sanitize(cleanName);

    // 3. Sanitized exact match
    if (cleanSanitized) {
      matched = itemsList.find(i => sanitize(i.ItemName) === cleanSanitized);
      if (matched) return matched;

      // 4. Substring overlap match (e.g. inventory item "Panadol" matches previous "Tab. Panadol 500mg" or vice versa)
      matched = itemsList.find(i => {
        const itemSanitized = sanitize(i.ItemName);
        if (!itemSanitized) return false;
        return cleanSanitized.includes(itemSanitized) || itemSanitized.includes(cleanSanitized);
      });
      if (matched) return matched;
    }

    // 5. Token word overlap matching
    const queryTokens = cleanName.split(/[\s,.\-/]+/).filter(t => t.length > 2 && !['tab', 'cap', 'syr', 'inj', 'susp', 'mg', 'ml'].includes(t));
    if (queryTokens.length > 0) {
      let bestMatch: Item | null = null;
      let maxOverlap = 0;

      itemsList.forEach(i => {
        const itemTokens = i.ItemName.toLowerCase().split(/[\s,.\-/]+/).filter(t => t.length > 2 && !['tab', 'cap', 'syr', 'inj', 'susp', 'mg', 'ml'].includes(t));
        const overlap = queryTokens.filter(t => itemTokens.includes(t)).length;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestMatch = i;
        }
      });

      if (maxOverlap >= 1 && bestMatch) {
        return bestMatch;
      }
    }

    return null;
  };

  // Helper to complete the prescription repeat operation
  const completeRepeatPrescription = (finalMedsList: any[], symptomsDiagnosisText: string, clinicalExpiryDate?: string) => {
    setPrescribedMedicines(prev => {
      const merged = [...prev];
      finalMedsList.forEach(m => {
        const mItemName = items.find(i => i.ItemID === m.ItemID)?.ItemName || m.MedicineDetail;
        
        const isDuplicate = merged.some(existing => {
          if (existing.ItemID !== 'CUSTOM' && m.ItemID !== 'CUSTOM') {
            return existing.ItemID === m.ItemID;
          }
          const existingName = items.find(i => i.ItemID === existing.ItemID)?.ItemName || existing.MedicineDetail;
          return existingName.toLowerCase().trim() === mItemName.toLowerCase().trim();
        });
        
        if (!isDuplicate) {
          const finalizedMed = { ...m };
          if (finalizedMed.MedicineType === 'C' && clinicalExpiryDate) {
            finalizedMed.ExpireDate = clinicalExpiryDate;
          }
          merged.push(finalizedMed);
        }
      });
      return merged;
    });

    if (symptomsDiagnosisText) {
      setSymptomsDiagnosis(symptomsDiagnosisText);
    }
    
    setSaveSuccess('Historical prescription copied to active assessment with smart inventory matching! Feel free to modify comments.');
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handleConfirmRepeat = (e: React.FormEvent) => {
    e.preventDefault();
    const hasClinical = pendingRepeatMeds.some(m => m.MedicineType === 'C');
    if (hasClinical && !repeatSelectedExpiryDate) {
      alert('Please select a valid expiry date for clinical compounding medicines.');
      return;
    }
    completeRepeatPrescription(pendingRepeatMeds, pendingSymptomsDiagnosis, hasClinical ? repeatSelectedExpiryDate : undefined);
    setRepeatDatePickerOpen(false);
    setPendingRepeatMeds([]);
    setPendingSymptomsDiagnosis('');
  };

  // Repeat previous medicine prescription helper
  const handleRepeatPrescription = (historyVisitId: string) => {
    let medsList: any[] = [];
    let sympDiag = '';

    if (historyVisitId.startsWith('NHC-')) {
      // Find the specific NHC records for this visit date
      const nhcByDate: { [date: string]: NhcPatientHistory[] } = {};
      (localNhcPatients || [])
        .filter(v => String(v.PatientID) === String(selectedPatientId))
        .forEach(v => {
          const date = v.VisitDate || v.RegistrationDate || 'N/A';
          if (!nhcByDate[date]) {
            nhcByDate[date] = [];
          }
          nhcByDate[date].push(v);
        });

      const datesList = Object.keys(nhcByDate);
      const indexStr = historyVisitId.split('-').pop() || '';
      const index = parseInt(indexStr, 10);
      const targetDate = datesList[index];
      const recordsForDate = nhcByDate[targetDate];
      
      if (recordsForDate && recordsForDate.length > 0) {
        recordsForDate.forEach(rec => {
          if (rec.MedicineDetail) {
            const matchedItem = matchMedicineToInventory(rec.MedicineDetail, items);
            medsList.push({
              ItemID: matchedItem ? matchedItem.ItemID : 'CUSTOM',
              MedicineDetail: matchedItem ? matchedItem.ItemName : rec.MedicineDetail,
              Dosage: rec.Dosage || '1 Daily',
              MedicineType: rec.MedicineType === 'C' ? 'C' : 'P',
              Price: rec.MedicineType === 'C' ? 0 : (matchedItem ? matchedItem.Price : 0)
            });
          } else if (rec.PrescribedMedicines && rec.PrescribedMedicines !== rec.MedicalCondition) {
            const parts = rec.PrescribedMedicines.split(',').map(p => p.trim()).filter(Boolean);
            parts.forEach((medName) => {
              const matchedItem = matchMedicineToInventory(medName, items);
              medsList.push({
                ItemID: matchedItem ? matchedItem.ItemID : 'CUSTOM',
                MedicineDetail: matchedItem ? matchedItem.ItemName : medName,
                Dosage: rec.Dosage || '1 Daily',
                MedicineType: rec.MedicineType === 'C' ? 'C' : 'P',
                Price: rec.MedicineType === 'C' ? 0 : (matchedItem ? matchedItem.Price : 0)
              });
            });
          }
        });

        if (medsList.length > 0) {
          // De-duplicate medsList by ItemID & MedicineDetail to be safe
          const uniqueMedsList: any[] = [];
          const seenMeds = new Set<string>();
          medsList.forEach(m => {
            const key = `${m.ItemID}-${m.MedicineDetail}`;
            if (!seenMeds.has(key)) {
              seenMeds.add(key);
              uniqueMedsList.push(m);
            }
          });
          medsList = uniqueMedsList;

          const directDiagList = recordsForDate.map(r => r.SymptomsDiagnosis || (r as any).Symptoms_Diagnosis || (r as any).symptoms_diagnosis || (r as any).symptomsdiagnosis).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
          if (directDiagList.length > 0) {
            sympDiag = directDiagList.join(' | ');
          } else {
            const symptomsList = recordsForDate.map(r => r.Symptoms).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
            const diagnosisList = recordsForDate.map(r => r.Diagnosis || r.MedicalCondition).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
            sympDiag = `Symptoms: ${symptomsList.join(', ') || 'None'} | Diagnosis/Condition: ${diagnosisList.join(', ') || 'None'}`;
          }
        } else {
          alert('No medicines found in this NHC visit to repeat.');
          return;
        }
      } else {
        alert('Historical NHC visit not found.');
        return;
      }
    } else {
      const previousMeds = visitMedicines.filter((m) => m.VisitID === historyVisitId);
      if (previousMeds.length > 0) {
        medsList = previousMeds.map((m) => {
          const matchedItem = items.find(i => i.ItemID === m.ItemID) || matchMedicineToInventory(m.MedicineDetail, items);
          return {
            ItemID: matchedItem ? matchedItem.ItemID : (m.ItemID || 'CUSTOM'),
            MedicineDetail: m.MedicineDetail, // Preserve original instructions
            Dosage: m.Dosage,
            MedicineType: m.MedicineType,
            Price: m.MedicineType === 'C' ? 0 : (matchedItem ? matchedItem.Price : (m.Price || 0)),
            ExpireDate: m.ExpireDate,
            Qty: m.MedicineType === 'C' ? (m.Qty || 30) : undefined
          };
        });

        const pastVisit = visits.find(v => v.VisitID === historyVisitId);
        if (pastVisit) {
          sympDiag = pastVisit.SymptomsDiagnosis;
        }
      } else {
        alert('No medicines found in this visit to repeat.');
        return;
      }
    }

    // Always open the repeat prescription editor modal to allow doctors to add, edit, or change medicines
    setPendingRepeatMeds(medsList);
    setPendingSymptomsDiagnosis(sympDiag);
    const today = new Date();
    const defaultDate = commonClinicalExpireDate || new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setRepeatSelectedExpiryDate(defaultDate);
    setRepeatDatePickerOpen(true);
  };

  // Retrieve an existing clinical visit for editing or update
  const handleRetrieveVisit = (v: Visit) => {
    // Enable skip reset flag so that switching patient ID doesn't wipe the form
    skipResetRef.current = true;
    
    // Set selected patient ID and search input text
    setSelectedPatientId(v.PatientID);
    
    const pat = patients.find(p => String(p.PatientID) === String(v.PatientID)) ||
                (localNhcPatients || []).find(p => String(p.PatientID) === String(v.PatientID)) ||
                (nhcPatients || []).find(p => String(p.PatientID) === String(v.PatientID));
    if (pat) {
      setPatientSearch(`${pat.PatientName} (${pat.PatientID})`);
    } else {
      setPatientSearch(v.PatientID);
    }

    // Populate assessment inputs
    setSymptomsDiagnosis(v.SymptomsDiagnosis || '');
    setMedicalReportResult(v.MedicalReportResult || '');
    setLabTestAdvice(v.LabTestAdvice || '');
    setPatientAdvice(v.PatientAdvice || '');
    setVisitRemarks(v.VisitRemarks || '');

    // Populate fees & sourcing choices
    let clinPay = v.ClinicalMedicinePayment || '';
    let cardPay = v.CardsPayment || (v as any).CardFee || '';
    let consFee: number | string = v.ConsultationFee !== undefined ? v.ConsultationFee : ((v as any).FileFee !== undefined ? (v as any).FileFee : '');

    if (v.VisitRemarks) {
      const rem = v.VisitRemarks;
      if (!clinPay || String(clinPay) === '0') {
        const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
        if (cPkr) clinPay = cPkr[1];
      }
      if (!consFee || String(consFee) === '0') {
        const fPkr = rem.match(/File PKR\s*(\d+)/);
        if (fPkr) consFee = fPkr[1];
      }
      if (!cardPay || String(cardPay) === '0') {
        const kPkr = rem.match(/Card PKR\s*(\d+)/);
        if (kPkr) cardPay = kPkr[1];
      }
    }

    setConsultationFee(consFee);
    setConsultationPaymentOption(v.ConsultationPaymentOption || 'Paid - Cash');
    setCardsPayment(cardPay);
    setClinicalMedicinePayment(clinPay);
    setPatentPaymentOption(v.PatentPaymentOption || 'Clinic');
    setClinicalPaymentOption(v.ClinicalPaymentOption || 'Clinic');

    // Populate medicines list
    const meds = visitMedicines.filter(m => m.VisitID === v.VisitID);
    setPrescribedMedicines(meds.map(m => ({
      ItemID: m.ItemID,
      Dosage: m.Dosage,
      MedicineType: m.MedicineType,
      MedicineDetail: m.MedicineDetail,
      Price: m.Price || 0,
      ExpireDate: m.ExpireDate || '—',
      Notes50: m.Notes50 || ''
    })));

    // Populate lab tests
    if (v.LabTestAdvice && v.LabTestAdvice !== 'N/A') {
      const names = v.LabTestAdvice.split(',').map(s => s.trim().toLowerCase());
      const testIds = labTests.filter(t => names.includes(t.TestName.toLowerCase())).map(t => t.TID);
      setSelectedLabTests(testIds);
    } else {
      setSelectedLabTests([]);
    }

    // Mark as editing this Visit ID
    setEditingVisitId(v.VisitID);
    setIsCurrentVisitSaved(false); // Enable fields & save buttons for update

    setSaveSuccess(`Retrieved visit ${v.VisitID} for ${pat?.PatientName || v.PatientID}. You can now make changes and save!`);
    setTimeout(() => setSaveSuccess(''), 5000);
  };

  const handleRegisterPatientEMR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegErrorMsg('Patient Name is mandatory.');
      return;
    }
    const cleanPhone = regMobilePhone.trim();
    if (!cleanPhone) {
      setRegErrorMsg('Mobile Phone number is mandatory.');
      return;
    }
    const phoneRegex = /^03\d{2}-\d{7}$|^03\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setRegErrorMsg('Invalid format. Please use Pakistani mobile format (e.g., 0300-1234567 or 03001234567).');
      return;
    }

    const newId = `PAT-${String(patients.length + 1).padStart(3, '0')}`;
    const newPatient: Patient = {
      PatientID: newId,
      PatientName: regName.trim(),
      Father_husband: regFatherHusband || 'N/A',
      AgeYears: regAge,
      Sex: regSex,
      MaritalStatus: regMaritalStatus,
      Occupation: regOccupation || 'N/A',
      Address: regAddress || 'N/A',
      CityID: regCityId,
      Country: 'Pakistan',
      PhoneMobile: cleanPhone,
      Email: regEmail || undefined,
      RegistrationDate: new Date().toISOString()
    };

    if (onAddPatient) {
      onAddPatient(newPatient);
      setRegSuccessMsg(`Patient ${regName} successfully registered with Patient ID: ${newId}`);
      setRegErrorMsg('');
      
      // Auto-select this newly registered patient in EMR for convenience
      setSelectedPatientId(newId);
      setPatientSearch(`${regName.trim()} (${newId})`);

      // Clear Form after brief timeout
      setRegName('');
      setRegFatherHusband('');
      setRegAge(30);
      setRegSex('Male');
      setRegMaritalStatus('Single');
      setRegOccupation('');
      setRegAddress('');
      setRegMobilePhone('');
      setRegEmail('');

      setTimeout(() => {
        setRegSuccessMsg('');
        setRegistrationModalOpen(false);
      }, 2000);
    } else {
      setRegErrorMsg('Registration function is not available.');
    }
  };

  // Print any saved clinical visit from the Today's Visits sidebar
  const handlePrintSavedVisit = (
    vis: Visit,
    layout: 'lab' | 'slip' | 'label',
    filter: 'all' | 'C' | 'P' | 'Outside' = 'all'
  ) => {
    const activePatient = patients.find(p => String(p.PatientID) === String(vis.PatientID)) ||
                          (localNhcPatients || []).find(p => String(p.PatientID) === String(vis.PatientID)) ||
                          (nhcPatients || []).find(p => String(p.PatientID) === String(vis.PatientID)) || null;

    const meds = visitMedicines.filter(m => m.VisitID === vis.VisitID);
    
    let testIds: string[] = [];
    if (vis.LabTestAdvice && vis.LabTestAdvice !== 'N/A') {
      const names = vis.LabTestAdvice.split(',').map(s => s.trim().toLowerCase());
      testIds = labTests.filter(t => names.includes(t.TestName.toLowerCase())).map(t => t.TID);
    }

    let clinPay = vis.ClinicalMedicinePayment || '';
    let cardPay = vis.CardsPayment || (vis as any).CardFee || '';
    let consFee: number | string = vis.ConsultationFee !== undefined ? vis.ConsultationFee : ((vis as any).FileFee !== undefined ? (vis as any).FileFee : 0);

    if (vis.VisitRemarks) {
      const rem = vis.VisitRemarks;
      if (!clinPay || String(clinPay) === '0') {
        const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
        if (cPkr) clinPay = cPkr[1];
      }
      if (!consFee || String(consFee) === '0') {
        const fPkr = rem.match(/File PKR\s*(\d+)/);
        if (fPkr) consFee = fPkr[1];
      }
      if (!cardPay || String(cardPay) === '0') {
        const kPkr = rem.match(/Card PKR\s*(\d+)/);
        if (kPkr) cardPay = kPkr[1];
      }
    }

    setPrintData({
      patient: activePatient,
      visitID: vis.VisitID,
      visitDate: vis.VisitDate,
      symptomsDiagnosis: vis.SymptomsDiagnosis || '',
      medicalReportResult: vis.MedicalReportResult || '',
      patientAdvice: vis.PatientAdvice || '',
      visitRemarks: vis.VisitRemarks || '',
      prescribedMedicines: meds.map(m => ({
        ItemID: m.ItemID,
        MedicineDetail: m.MedicineDetail,
        Dosage: m.Dosage,
        MedicineType: m.MedicineType,
        Price: m.Price || 0
      })),
      selectedLabTests: testIds,
      consultationFee: consFee,
      consultationPaymentOption: vis.ConsultationPaymentOption || 'Paid - Cash',
      cardsPayment: cardPay,
      clinicalMedicinePayment: clinPay,
      patentPaymentOption: vis.PatentPaymentOption || 'Clinic',
      clinicalPaymentOption: vis.ClinicalPaymentOption || 'Clinic'
    });

    setPrintLayoutType(layout);
    setPrintFilter(filter);
    setPrintModalOpen(true);
  };

  // Save consultation visit
  const handleSaveVisit = (postRecord: boolean, printMode?: 'lab' | 'patent' | 'label' | 'slip') => {
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

    const targetVisitID = editingVisitId || `VIS-${String(visits.length + 1).padStart(3, '0')}`;
    const targetVisitDate = editingVisitId 
      ? (visits.find((v) => v.VisitID === editingVisitId)?.VisitDate || new Date().toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    const newVisit: Visit = {
      VisitID: targetVisitID,
      PatientID: selectedPatientId,
      VisitDate: targetVisitDate,
      SymptomsDiagnosis: symptomsDiagnosis,
      MedicalReportResult: medicalReportResult || 'Standard review completed',
      LabTestAdvice: labTestAdvice || selectedLabTests.map((tid) => labTests.find((t) => t.TID === tid)?.TestName).join(', ') || 'N/A',
      PatientAdvice: patientAdvice || 'Rest and follow prescription dosage',
      VisitRemarks: visitRemarks || 'OPD clinical desk consultation',
      Status: postRecord ? 2 : 1, // 1=Draft, 2=Posted (Read only)
      ConsultationFee: consultationFee === '' ? 0 : Number(consultationFee),
      ConsultationPaymentOption: consultationPaymentOption,
      CardsPayment: cardsPayment,
      ClinicalMedicinePayment: clinicalMedicinePayment,
      PatentPaymentOption: patentPaymentOption,
      ClinicalPaymentOption: clinicalPaymentOption
    };

    const medicinesToSave: VisitMedicine[] = prescribedMedicines.map((m) => ({
      ...m,
      VisitID: targetVisitID
    }));

    if (editingVisitId && onUpdateVisit) {
      onUpdateVisit(newVisit, medicinesToSave, selectedLabTests);
      setEditingVisitId('');
    } else {
      onAddVisit(newVisit, medicinesToSave, selectedLabTests);
    }
    
    // Set print preview data and set saved state if posted
    if (postRecord) {
      setIsCurrentVisitSaved(true);
      setSaveSuccess(`Clinical Consultation File ${targetVisitID} successfully SAVED & FINALIZED. 4 Print options are now active.`);
      
      const activePatient = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                            (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                            (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) || null;
      setPrintData({
        patient: activePatient,
        visitID: targetVisitID,
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
        cardsPayment: cardsPayment,
        clinicalMedicinePayment: clinicalMedicinePayment,
        patentPaymentOption: patentPaymentOption,
        clinicalPaymentOption: clinicalPaymentOption
      });
    } else {
      setSaveSuccess(`Clinical Consultation File ${targetVisitID} successfully saved.`);
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
    const pat = patients.find((p) => p.PatientID === selectedPatientId) ||
                (localNhcPatients || []).find((p) => p.PatientID === selectedPatientId) ||
                (nhcPatients || []).find((p) => p.PatientID === selectedPatientId);
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
    const p = patients.find((pat) => pat.PatientID === id) ||
              (localNhcPatients || []).find((pat) => pat.PatientID === id) ||
              (nhcPatients || []).find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Unknown';
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 font-sans" id="emr-clinical-desk">
      
      {/* Left Side Navigation: Today's Visited Patients */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden" id="emr-today-visits-sidebar">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Today's Visited Patients
            </h3>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase">
            {new Date().toISOString().split('T')[0]}
          </span>
        </div>

        {/* List of Visits */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const todaysVisits = visits.filter(v => v.VisitDate === today);

            if (todaysVisits.length === 0) {
              return (
                <div className="text-center py-12 text-slate-400">
                  <UserX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-wider block">No visits today</span>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium px-4 leading-normal">
                    When you save a consultation visit, the patient will appear here for easy editing and printing.
                  </p>
                </div>
              );
            }

            return todaysVisits.map((vis) => {
              const activePatient = patients.find(p => String(p.PatientID) === String(vis.PatientID)) ||
                                    (localNhcPatients || []).find(p => String(p.PatientID) === String(vis.PatientID)) ||
                                    (nhcPatients || []).find(p => String(p.PatientID) === String(vis.PatientID));
              const isSelected = String(vis.PatientID) === String(selectedPatientId);

              return (
                <div
                  key={vis.VisitID}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                      : 'bg-white border-slate-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[8px] font-mono text-indigo-600 font-bold uppercase">{vis.VisitID}</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase leading-snug truncate">
                        {activePatient?.PatientName || vis.PatientID}
                      </h4>
                      <span className="font-mono text-[9px] text-slate-400 font-semibold">
                        MR# {vis.PatientID}
                      </span>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <span className="text-[8px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded font-mono">
                        {vis.VisitRemarks || 'OPD'}
                      </span>
                      <span className="text-[8px] font-black text-emerald-600">
                        Rs. {vis.ConsultationFee || 0}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 font-semibold line-clamp-1 border-t border-slate-100 pt-1.5 uppercase tracking-wide">
                    {vis.SymptomsDiagnosis || 'No Diagnosis Notes'}
                  </p>

                  <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-100/50">
                    <button
                      type="button"
                      onClick={() => handleRetrieveVisit(vis)}
                      className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-lg border border-emerald-200 transition cursor-pointer flex items-center justify-center"
                    >
                      <Edit3 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                      <span>Edit Visit</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handlePrintSavedVisit(vis, 'slip', 'all')}
                      className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-lg border border-indigo-250 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Quick Print Clinical Prescription Slip"
                    >
                      <Printer className="w-2.5 h-2.5 mr-1 text-indigo-600" />
                      <span>Print Rx</span>
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Right Content Frame */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-800 relative" id="emr-right-workspace">
        
        {isLookupLoading && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-150 flex flex-col items-center max-w-xs text-center space-y-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Searching Patients</h4>
                <p className="text-xxs text-slate-500 mt-1">Please wait while we query active patients and the NHC archive database...</p>
              </div>
            </div>
          </div>
        )}

        {/* Upper header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
              <FileText className="w-4.5 h-4.5 text-blue-600 mr-2" />
              Clinic EMR Form
            </h2>
          </div>

          {/* Sub Navigation */}
          <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveSubTab('certs')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'certs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5" />
              <span>Leave Certificates</span>
            </button>
            <button
              onClick={() => setActiveSubTab('sbp')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'sbp' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileBadge className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>SBP Panel Refund</span>
            </button>
          </div>
        </div>

      {/* Patient Assessment & History Sub-Tab */}
      {(false as boolean) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start font-sans" id="emr-assessment-container">
          
          {/* Column 1: Patient Assessment & Historical Visit Timeline */}
          <div className="xl:col-span-12 col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                <Edit3 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                Patient assessment & history
              </h3>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationModalOpen(true);
                    setRegErrorMsg('');
                    setRegSuccessMsg('');
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg flex items-center shadow-xs cursor-pointer transition uppercase tracking-wider"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Register New Patient
                </button>
                {visitStatus === 2 && (
                  <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center shrink-0">
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    READ ONLY LOCK
                  </span>
                )}
              </div>
            </div>

            {saveSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-700 text-xxs rounded-lg font-bold border border-emerald-100 shrink-0">
                {saveSuccess}
              </div>
            )}

            {/* Patient Selector and Lookup Panel */}
            <div className="space-y-2 shrink-0">
              <div className="relative">
                <label className="block text-xxs font-extrabold text-slate-500 uppercase">Consulting Patient *</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Search patient, ID, mobile, or active queue..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                      if (!e.target.value) {
                        setSelectedPatientId('');
                      }
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 250)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-bold text-slate-700"
                  />
                  {selectedPatientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientId('');
                        setPatientSearch('');
                      }}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {showPatientDropdown && (() => {
                  const q = patientSearch.toLowerCase().trim();
                  const activeMatched = patients.find(p => `${p.PatientName} (${p.PatientID})` === patientSearch);
                  const nhcMatched = (localNhcPatients || []).find(p => `${p.PatientName} (${p.PatientID})` === patientSearch);
                  if (activeMatched || nhcMatched) return null;

                  const bookedIds = Array.from(new Set(appointments.filter(a => a.Status !== 3 && a.Status !== 4).map(a => a.PatientID)));

                  const activeList = patients.filter(p => matchPatientRecord(p, q)).map(p => ({
                    ...p,
                    isNhc: false,
                    isBooked: bookedIds.includes(p.PatientID)
                  }));

                  // De-duplicate NHC patients by PatientID before filtering
                  const uniqueNhcPatsForDropdown: NhcPatientHistory[] = [];
                  const seenDropdownIds = new Set<string>();
                  (localNhcPatients || []).forEach(p => {
                    if (!seenDropdownIds.has(p.PatientID)) {
                      seenDropdownIds.add(p.PatientID);
                      uniqueNhcPatsForDropdown.push(p);
                    }
                  });

                  const nhcList = uniqueNhcPatsForDropdown.filter(p => {
                    const isAlreadyActive = patients.some(ap => ap.PatientID === p.PatientID);
                    if (isAlreadyActive) return false;
                    return matchPatientRecord(p, q);
                  }).map(p => ({
                    PatientID: p.PatientID,
                    PatientName: p.PatientName,
                    AgeYears: p.AgeYears,
                    Sex: p.Sex,
                    PhoneMobile: p.PhoneMobile,
                    isNhc: true,
                    isBooked: false
                  }));

                  const combined = [...activeList, ...nhcList];
                  combined.sort((a, b) => {
                    if (a.isBooked && !b.isBooked) return -1;
                    if (!a.isBooked && b.isBooked) return 1;
                    if (a.isNhc && !b.isNhc) return 1;
                    if (!a.isNhc && b.isNhc) return -1;
                    return 0;
                  });

                  const limitList = combined.slice(0, 8);
                  if (limitList.length === 0) return null;

                  return (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {limitList.map((p, idx) => (
                        <div
                          key={`emr-lim-${p.PatientID}-${idx}`}
                          onMouseDown={() => {
                            setSelectedPatientId(p.PatientID);
                            setPatientSearch(`${p.PatientName} (${p.PatientID})`);
                            setShowPatientDropdown(false);
                          }}
                          className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-[11px]"
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-900">{p.PatientName}</span>
                            <span className="font-mono text-slate-500 text-[9px]">
                              {p.PatientID} {p.PhoneMobile ? `| ${p.PhoneMobile}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {p.isBooked && (
                              <span className="text-[7px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded uppercase">
                                Queue
                              </span>
                            )}
                            {p.isNhc && (
                              <span className="text-[7px] bg-indigo-100 text-indigo-800 font-extrabold px-1 rounded uppercase">
                                NHC
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientLookupSearch('');
                    setLookupPatientId(selectedPatientId);
                    setPatientLookupModalOpen(true);
                  }}
                  className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xxs font-black rounded-lg flex items-center justify-center transition border border-blue-200 cursor-pointer"
                >
                  <Search className="w-3 h-3 mr-1" />
                  <span>🔍 Database Search & NHC Lookup</span>
                </button>
              </div>
            </div>

            {/* Assessment Textareas */}
            <div className="space-y-1.5 shrink-0">
              <label className="block text-xxs font-bold text-slate-500 uppercase">Symptoms & Clinical Diagnosis *</label>
              <textarea
                placeholder="Summarize patient complaints, temperature, BP, and final diagnostics comments..."
                rows={3}
                required
                value={symptomsDiagnosis}
                onChange={(e) => setSymptomsDiagnosis(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800 font-semibold"
              />
            </div>

            {/* Patient Visit Timeline & History trigger button and demographic card */}
            {selectedPatientId ? (() => {
              const activePatient = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                    (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                    (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId));
              if (!activePatient) return null;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shrink-0 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Active Patient</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase leading-tight">{activePatient.PatientName}</h4>
                      <span className="font-mono text-[9px] text-slate-500 font-bold">MR# {activePatient.PatientID}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black uppercase rounded shrink-0">Active Session</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] border-t border-slate-200/60 pt-2 font-medium text-slate-600">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">Age / Gender</span>
                      <span className="text-slate-800 font-bold">{(activePatient as any).AgeYears || (activePatient as any).Age || 'N/A'} Yrs / {activePatient.Sex}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">Mobile Number</span>
                      <span className="text-slate-800 font-bold font-mono">{activePatient.PhoneMobile || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider">Address Registry</span>
                      <span className="text-slate-800 font-bold uppercase truncate block">
                        {(activePatient as any).AddressDetail || (activePatient as any).Address || 'N/A'}, {(() => {
                          const cityId = (activePatient as any).ResidentCityID || (activePatient as any).CityID;
                          return cities.find(c => c.CityID === cityId)?.CityName || 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setHistoryModalOpen(true)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-lg flex items-center justify-center transition shadow-sm shadow-indigo-600/10 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 mr-1 text-indigo-100 shrink-0" />
                      <span>View History Timeline</span>
                    </button>
                    {isCurrentVisitSaved && (
                      <button
                        type="button"
                        onClick={handleOpenEditPatient}
                        className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm flex items-center justify-center transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit Demographics
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center text-slate-400 flex flex-col items-center justify-center space-y-1 h-32 shrink-0">
                <History className="w-6 h-6 text-slate-300" />
                <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-500">No Patient Selected</span>
                <p className="text-[9px] max-w-xs leading-relaxed font-semibold">
                  Search or select a patient to load active clinical diagnostics and history timeline.
                </p>
              </div>
            )}

            {selectedPatientId && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('consult')}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center transition cursor-pointer"
                >
                  <span>Proceed to Clinical Prescriptions & Consultation</span>
                  <ArrowRight className="w-4 h-4 ml-2 animate-pulse" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Clinical Consultation Sub-Tab */}
      {(false as boolean) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start font-sans" id="emr-consult-container">
          
          {/* Active Patient Demographics Banner */}
          <div className="xl:col-span-12 col-span-1">
            {(() => {
              const activePatient = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                    (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                    (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId));
              if (!selectedPatientId || !activePatient) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center text-amber-800 flex flex-col items-center justify-center space-y-3">
                    <ShieldAlert className="w-8 h-8 text-amber-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider">No Active Patient Selected</h4>
                    <p className="text-xs max-w-md font-semibold text-slate-650">
                      A clinical consultation requires an active patient. Please select or search for a patient on the Patient Assessment & History sub-tab first.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('assessment')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition shadow-md shadow-indigo-500/10 cursor-pointer flex items-center"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                      <span>Go to Patient Assessment & History</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                      {activePatient.PatientName ? activePatient.PatientName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Consulting Active Patient</span>
                      <h3 className="text-sm font-black text-slate-900 uppercase leading-none mt-1">{activePatient.PatientName}</h3>
                      <div className="flex items-center space-x-2 mt-1.5 font-semibold text-slate-500 text-[10px] leading-none">
                        <span className="font-mono">MR# {activePatient.PatientID}</span>
                        <span>•</span>
                        <span>{(activePatient as any).AgeYears || (activePatient as any).Age || 'N/A'} Yrs ({activePatient.Sex})</span>
                        <span>•</span>
                        <span className="font-mono">{activePatient.PhoneMobile || 'No Phone'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg text-left max-w-[280px]">
                      <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-wider">Symptoms Diagnosis Preview</span>
                      <span className="text-slate-700 text-xxs font-bold truncate block mt-0.5">
                        {symptomsDiagnosis || 'No assessment summary written yet'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('assessment')}
                      className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xxs font-black rounded-lg transition flex items-center cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit Assessment
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Column 2: Clinical Prescriptions & Diagnostics (Prescription Grid & Lab Advice) */}
          <div className="xl:col-span-7 lg:col-span-7 col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col min-h-[760px] max-h-[760px] overflow-hidden">
            
            {/* Prescription Grid (Medicines Inserter) */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 shrink-0">
                <h4 className="text-xs font-black text-slate-900 uppercase">Prescription Grid (Medicines Inserter)</h4>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocatorModalOpen(true)}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xxs font-extrabold transition cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                    <span>Smart Locator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabTestsModalOpen(true)}
                    className="flex items-center space-x-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xxs font-extrabold transition cursor-pointer shrink-0"
                  >
                    <FlaskConical className="w-3 h-3 text-indigo-200 shrink-0" />
                    <span>Lab Tests ({selectedLabTests.length})</span>
                  </button>
                </div>
              </div>

              {/* Step 1: Choose Medicine Type */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 shrink-0">
                <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Step 1: Choose Medicine Type *
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRowType('C');
                      setMedSearch('');
                      setRowMedicineId('');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border transition text-center flex items-center justify-center cursor-pointer ${
                      rowType === 'C'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
                    <span>Clinical compounding ('C')</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setRowType('P');
                      setMedSearch('');
                      setRowMedicineId('');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border transition text-center flex items-center justify-center cursor-pointer ${
                      rowType === 'P'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                    <span>Patent pre-packaged ('P')</span>
                  </button>
                </div>
              </div>


              {/* Medicine Grid Inserter Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start pt-2 shrink-0">
                <div className="relative md:col-span-2 space-y-1">
                  <label className="block text-xs font-black text-slate-700 uppercase flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span>Step 2: Search Medicine</span>
                    {rowMedicineId && (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-extrabold max-w-[180px] truncate leading-none">
                        Selected: {items.find(i => i.ItemID === rowMedicineId)?.ItemName}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      ref={medSearchInputRef}
                      type="text"
                      disabled={!rowType}
                      placeholder={
                        rowType === 'C'
                          ? "Search Clinical compounding medicines..."
                          : rowType === 'P'
                          ? "Search Patent medicines..."
                          : "⚠️ Select Medicine Type (Step 1) above first!"
                      }
                      value={medSearch}
                      onChange={(e) => {
                        setMedSearch(e.target.value);
                        setShowMedResults(true);
                      }}
                      onFocus={() => rowType && setShowMedResults(true)}
                      onBlur={() => setTimeout(() => setShowMedResults(false), 250)}
                      className={`w-full text-sm border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 font-semibold ${
                        !rowType
                          ? 'cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                          : rowType === 'C'
                          ? 'border-indigo-300 focus:ring-indigo-500 text-slate-850 bg-white'
                          : 'border-emerald-300 focus:ring-emerald-500 text-slate-850 bg-white'
                      }`}
                    />
                  </div>
 
                  {showMedResults && medSearch.trim().length > 0 && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100 text-left">
                      {items
                        .filter((itm) => {
                          const isC = isClinicalItem(itm.ItemID);
                          const matchesType = rowType === 'C' ? isC : !isC;
                          const matchesSearch = itm.ItemName.toLowerCase().includes(medSearch.toLowerCase()) ||
                                                itm.ItemID.toLowerCase().includes(medSearch.toLowerCase());
                          return matchesType && matchesSearch;
                        })
                        .map((itm, idx) => (
                          <div
                            key={`${itm.ItemID}-${idx}`}
                            onMouseDown={() => {
                              setRowMedicineId(itm.ItemID);
                              setMedSearch(itm.ItemName);
                              setShowMedResults(false);
                            }}
                            className="p-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center text-left"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{itm.ItemName}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({itm.ItemID})</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                isClinicalItem(itm.ItemID)
                                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              }`}>
                                {isClinicalItem(itm.ItemID) ? 'Clinical' : 'Patent'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-50 border border-slate-100 text-slate-600">
                                Stock: {itm.CStock}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {rowType === 'C' && rowMedicineId && (
                    <div className="mt-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-1.5 animate-fadeIn">
                      <label className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                        🧪 Clinical Medicine - Quantity of Tab
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 30"
                          value={rowQtyOfTab}
                          onChange={(e) => setRowQtyOfTab(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full text-xs font-bold border border-indigo-200 bg-white rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-mono text-indigo-900"
                        />
                        <span className="text-xs font-semibold text-indigo-600 shrink-0">Tabs</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-black text-slate-700 uppercase">Dosage Formula *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 1-0-1, 1 Daily (Take after meals)"
                    value={rowDosage}
                    onChange={(e) => setRowDosage(e.target.value.toUpperCase())}
                    className="w-full text-sm border border-slate-300 bg-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pb-2 pt-1 border-b border-slate-150 shrink-0 items-center">
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-xs font-black text-slate-700 uppercase">Medicine Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Take once daily after breakfast for 5 days"
                    value={rowDetail}
                    onChange={(e) => setRowDetail(e.target.value)}
                    className="w-full text-xs border border-slate-300 bg-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                  />
                  {rowType === 'C' && (
                    <div className="mt-2 bg-indigo-50 border border-indigo-150 p-2.5 rounded-xl flex flex-col gap-2 shrink-0 animate-fadeIn text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="block text-xs font-black text-indigo-700 uppercase">
                            Clinical Expiry Date *
                          </span>
                          <span className="text-[10px] text-indigo-500 font-bold">
                            Applies to all clinical compounding in this visit
                          </span>
                        </div>
                        <input
                          type="date"
                          required
                          value={commonClinicalExpireDate}
                          onChange={(e) => setCommonClinicalExpireDate(e.target.value)}
                          className="text-xs border border-indigo-200 bg-white rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-indigo-800 font-bold font-mono self-start sm:self-auto"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1 items-center pt-1.5 border-t border-indigo-100/60">
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mr-1">
                          Quick Weeks:
                        </span>
                        {[
                          { label: '1 Week', weeks: 1 },
                          { label: 'Two Week', weeks: 2 },
                          { label: 'Three Week', weeks: 3 },
                          { label: 'Four Week', weeks: 4 },
                        ].map((preset) => {
                          const target = new Date();
                          target.setDate(target.getDate() + (preset.weeks * 7));
                          const targetStr = target.toISOString().split('T')[0];
                          const isActive = commonClinicalExpireDate === targetStr;
                          return (
                            <button
                              key={preset.weeks}
                              type="button"
                              onClick={() => setCommonClinicalExpireDate(targetStr)}
                              className={`px-2 py-1 text-[10px] font-black rounded-md border transition cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100/50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5">
                  <button
                    type="button"
                    onClick={handleAddPrescriptionRow}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg flex items-center justify-center transition cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Insert Medication</span>
                  </button>
                </div>
              </div>

              {/* List of currently prescribed medicines */}
              <div className="flex-1 overflow-y-auto mt-2 pr-0.5 min-h-[140px] border border-slate-100 rounded-lg">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-black bg-slate-50 shrink-0 sticky top-0">
                      <th className="py-1.5 px-2 font-black">Item</th>
                      <th className="py-1.5 px-2 font-black text-center">Dosage</th>
                      <th className="py-1.5 px-2 font-black text-center">Type</th>
                      <th className="py-1.5 px-2 text-right font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescribedMedicines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic text-xxs font-semibold">
                          No medications added to active list.
                        </td>
                      </tr>
                    ) : (
                      prescribedMedicines.map((med, idx) => {
                        const itm = items.find((i) => i.ItemID === med.ItemID);
                        const isMatched = !!itm;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2">
                              {matchingRowIndex === idx ? (
                                <div className="relative max-w-xs" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="text"
                                      className="w-full text-xxs border border-indigo-300 rounded px-2 py-1 bg-white text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                      value={rowSearchTerm}
                                      onChange={(e) => setRowSearchTerm(e.target.value)}
                                      placeholder="Search active inventory..."
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          setMatchingRowIndex(null);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setMatchingRowIndex(null)}
                                      className="text-slate-400 hover:text-slate-600 px-1 text-xxs font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  
                                  {/* Dropdown Overlay */}
                                  <div className="absolute left-0 right-0 z-40 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                                    {items
                                      .filter((i) => {
                                        const isC = isClinicalItem(i.ItemID);
                                        const matchesType = med.MedicineType === 'C' ? isC : !isC;
                                        const matchesSearch = i.ItemName.toLowerCase().includes(rowSearchTerm.toLowerCase()) ||
                                                              i.ItemID.toLowerCase().includes(rowSearchTerm.toLowerCase());
                                        return matchesType && matchesSearch;
                                      })
                                      .map((i, subIdx) => (
                                        <div
                                          key={`${i.ItemID}-${subIdx}`}
                                          onClick={() => {
                                            const updated = [...prescribedMedicines];
                                            updated[idx] = {
                                              ...updated[idx],
                                              ItemID: i.ItemID,
                                              MedicineDetail: i.ItemName,
                                              Price: updated[idx].MedicineType === 'C' ? 0 : i.Price
                                            };
                                            setPrescribedMedicines(updated);
                                            setMatchingRowIndex(null);
                                          }}
                                          className="p-1.5 text-[10px] hover:bg-slate-50 cursor-pointer flex justify-between items-center text-left"
                                        >
                                          <div>
                                            <span className="font-bold text-slate-900">{i.ItemName}</span>
                                            <span className="text-[9px] text-slate-400 ml-1.5 font-mono">({i.ItemID})</span>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-[9px] text-emerald-600 font-bold">Rs. {i.Price}</div>
                                            <div className="text-[8px] text-slate-400 font-medium">Stock: {i.CStock}</div>
                                          </div>
                                        </div>
                                      ))}
                                    
                                    <div
                                      onClick={() => {
                                        const updated = [...prescribedMedicines];
                                        updated[idx] = {
                                          ...updated[idx],
                                          ItemID: 'CUSTOM'
                                        };
                                        setPrescribedMedicines(updated);
                                        setMatchingRowIndex(null);
                                      }}
                                      className="p-1.5 text-[10px] text-slate-500 italic text-center font-semibold hover:bg-slate-50 cursor-pointer"
                                    >
                                      Keep as Custom Free-text Medicine
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900">
                                      {isMatched ? itm.ItemName : med.MedicineDetail}
                                    </span>
                                    {isMatched ? (
                                      <span className="inline-flex items-center text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-100 uppercase">
                                        Inventory Matched
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center text-[8px] font-black text-amber-700 bg-amber-50 px-1 rounded border border-amber-100 uppercase">
                                        Custom / Unmatched
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-[9px] text-slate-400 mt-0.5 flex-wrap gap-y-1">
                                    <span className="font-mono">ID: {med.ItemID}</span>
                                    {isMatched && <span className="text-slate-300">|</span>}
                                    {isMatched && <span>Price: Rs. {itm.Price} | Stock: {itm.CStock}</span>}
                                    {med.MedicineType === 'C' && med.ExpireDate && (
                                      <>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-red-600 font-bold bg-red-50 px-1 rounded border border-red-100">Exp: {med.ExpireDate}</span>
                                      </>
                                    )}
                                    {med.MedicineType === 'C' && med.Qty && (
                                      <>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-indigo-700 font-extrabold bg-indigo-50 px-1 rounded border border-indigo-150">Qty: {med.Qty} Tab{med.Qty > 1 ? 's' : ''}</span>
                                      </>
                                    )}
                                    {med.Notes50 && (
                                      <>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-slate-600 italic bg-slate-100 px-1 rounded">Note: {med.Notes50}</span>
                                      </>
                                    )}
                                    <span className="text-slate-300">|</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMatchingRowIndex(idx);
                                        setRowSearchTerm(isMatched ? itm.ItemName : med.MedicineDetail);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 font-black flex items-center space-x-0.5 uppercase tracking-wider text-[8px] cursor-pointer"
                                    >
                                      <span>{isMatched ? 'Change Match' : 'Search & Match'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center font-bold font-mono text-xxs text-slate-800">{med.Dosage}</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                med.MedicineType === 'C' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {med.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemovePrescriptionRow(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
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

          </div>

          {/* Column 3: Checkout, Payments & Sourcing Options & Finalize Submit Actions */}
          <div className="xl:col-span-5 lg:col-span-5 col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col min-h-[760px] max-h-[760px] overflow-y-auto shrink-0">
            
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                OPD Checkout & Sourcing
              </h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Financials & Sourcing
              </span>
            </div>

            <div className="flex flex-col gap-4">

              {/* Sub-Column B: Sourcing & Consultation Fee */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
                <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Sourcing & Financial Details
                </span>

                <div className="space-y-3">
                  {/* Fee & Payment Inputs */}
                  {!isCurrentVisitSaved ? (
                    <div className="space-y-3">
                      {/* Consultation Fee (PKR) */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                          Consultation Fee (PKR) *
                        </label>
                        <div className="relative rounded-lg shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs font-black text-slate-400">PKR</span>
                          </div>
                          <input
                            type="text"
                            value={consultationFee}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setConsultationFee(val === '' ? '' : parseInt(val, 10));
                              }
                            }}
                            className="w-full text-right text-sm font-black border border-slate-300 bg-white rounded-lg pl-10 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                            placeholder="e.g. 1500"
                          />
                        </div>
                      </div>

                      {/* Payment of File */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                          Payment of File (PKR)
                        </label>
                        <div className="relative rounded-lg shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs font-black text-slate-400">PKR</span>
                          </div>
                          <input
                            type="text"
                            value={cardsPayment}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setCardsPayment(val);
                              }
                            }}
                            className="w-full text-right text-sm font-black border border-slate-300 bg-white rounded-lg pl-10 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                            placeholder="e.g. 500"
                          />
                        </div>
                      </div>

                      {/* Clinical Medicine */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                          Clinical Medicine Payment (PKR)
                        </label>
                        <div className="relative rounded-lg shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-xs font-black text-slate-400">PKR</span>
                          </div>
                          <input
                            type="text"
                            value={clinicalMedicinePayment}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setClinicalMedicinePayment(val);
                              }
                            }}
                            className="w-full text-right text-sm font-black border border-slate-300 bg-white rounded-lg pl-10 pr-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                            placeholder="e.g. 1000"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                        <span className="text-xxs font-bold text-slate-500 uppercase">Consultation Fee Paid</span>
                        <span className="text-xs font-black text-slate-900">PKR {consultationFee || 0}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                        <span className="text-xxs font-bold text-slate-500 uppercase">Payment of File</span>
                        <span className="text-xs font-black text-slate-900">PKR {cardsPayment || 0}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center">
                        <span className="text-xxs font-bold text-slate-500 uppercase">Clinical Medicine Payment</span>
                        <span className="text-xs font-black text-slate-900">PKR {clinicalMedicinePayment || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Active Booking Linked */}
                  {appointments.find(a => a.PatientID === selectedPatientId && a.Status !== 3 && a.Status !== 4) && (
                    <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-100 font-semibold flex items-center">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
                      <span>Active Booking Linked: {appointments.find(a => a.PatientID === selectedPatientId && a.Status !== 3 && a.Status !== 4)?.AppointmentID}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Sub-Column C: Actions & Print Options */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5">
                <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Finalize & Documentation
                </span>

                <div className="space-y-2.5">
                  {!isCurrentVisitSaved ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSaveVisit(false)}
                        disabled={!canAdd}
                        className={`w-full py-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center cursor-pointer ${
                          canAdd
                            ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Save Consult Draft
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveVisit(true)}
                        disabled={!canAdd || !canPost}
                        className={`w-full py-3 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center transition cursor-pointer ${
                          canAdd && canPost
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15'
                            : 'bg-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Printer className="w-4 h-4 mr-1.5 shrink-0 animate-pulse" />
                        <span>Save & Post Assessment</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        {/* a. Print Lab Test */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintLayoutType('lab');
                            setPrintFilter('all');
                            setPrintModalOpen(true);
                          }}
                          title="Print Lab Test"
                          className="p-2 rounded-xl text-[10px] font-black text-white shadow-sm flex flex-col items-center justify-center text-center transition cursor-pointer min-h-[44px] bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                        >
                          <FlaskConical className="w-3.5 h-3.5 mb-1 text-blue-100" />
                          <span>Print Lab Test</span>
                        </button>

                        {/* b. Print Prescription of Patent Medicine only */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintLayoutType('slip');
                            setPrintFilter('P');
                            setPrintModalOpen(true);
                          }}
                          title="Print Prescription of Patent Medicine only"
                          className="p-2 rounded-xl text-[10px] font-black text-white shadow-sm flex flex-col items-center justify-center text-center transition cursor-pointer min-h-[44px] bg-amber-600 hover:bg-amber-700 shadow-amber-600/10"
                        >
                          <Pill className="w-3.5 h-3.5 mb-1 text-amber-100" />
                          <span>Print Patent Rx</span>
                        </button>

                        {/* c. Print Medicine Label */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintLayoutType('label');
                            setPrintFilter('C');
                            setPrintModalOpen(true);
                          }}
                          title="Print small size paper of Clinical Medicine to paste on Box of Clinical Medicine"
                          className="p-2 rounded-xl text-[10px] font-black text-white shadow-sm flex flex-col items-center justify-center text-center transition cursor-pointer min-h-[44px] bg-purple-600 hover:bg-purple-700 shadow-purple-600/10"
                        >
                          <Tag className="w-3.5 h-3.5 mb-1 text-purple-100" />
                          <span>Print Box Label</span>
                        </button>

                        {/* d. Patient Visit Slip */}
                        <button
                          type="button"
                          onClick={() => {
                            setPrintLayoutType('slip');
                            setPrintFilter('all');
                            setPrintModalOpen(true);
                          }}
                          title="Visit slip including all details of current visit"
                          className="p-2 rounded-xl text-[10px] font-black text-white shadow-sm flex flex-col items-center justify-center text-center transition cursor-pointer min-h-[44px] bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15"
                        >
                          <ClipboardList className="w-3.5 h-3.5 mb-1 text-emerald-100 animate-pulse" />
                          <span>Patient Visit Slip</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // Reset forms
                          setSymptomsDiagnosis('');
                          setMedicalReportResult('');
                          setLabTestAdvice('');
                          setPatientAdvice('');
                          setVisitRemarks('');
                          setPrescribedMedicines([]);
                          setSelectedLabTests([]);
                          setMedSearch('');
                          setDiagSearch('');
                          setCardsPayment('');
                          setClinicalMedicinePayment('');
                          setIsCurrentVisitSaved(false);
                          setPrintData(null);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition text-center cursor-pointer flex items-center justify-center"
                      >
                        Start New Consultation
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                  {patients.map((p, idx) => (
                    <option key={`emr-opt1-${p.PatientID}-${idx}`} value={p.PatientID}>
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
                  {patients.map((p, idx) => (
                    <option key={`emr-opt2-${p.PatientID}-${idx}`} value={p.PatientID}>
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
                    type="text"
                    required
                    value={sbpConsultFee}
                    onChange={(e) => setSbpConsultFee(parseInt(e.target.value) || 1500)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
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
                @page {
                  size: A4;
                  margin: 15mm;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  background-color: white !important;
                  color: black !important;
                }
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
                  padding: 0 !important;
                  margin: 0 !important;
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
                    {printLayoutType === 'history' && 'Cumulative Patient Clinical Ledger'}
                    {printLayoutType === 'slip' && 'Clinic Slip Ready to Print'}
                    {printLayoutType === 'lab' && 'Laboratory Diagnostic Slip Ready'}
                    {printLayoutType === 'label' && 'Clinical Medicine Box Label Ready'}
                  </span>
                  <span className="text-xxs text-slate-500 font-semibold">
                    {printLayoutType === 'history' && 'Press print to obtain patient previous medical history sheet'}
                    {printLayoutType === 'slip' && 'Select layout to format and print the prescription'}
                    {printLayoutType === 'lab' && 'Press print to generate the laboratory recommendation slip'}
                    {printLayoutType === 'label' && 'Press print to generate small box label of compounding medicine'}
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
                ) : printLayoutType === 'lab' ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xxs rounded-lg flex items-center shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print Lab Slip
                  </button>
                ) : printLayoutType === 'label' ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xxs rounded-lg flex items-center shadow-md shadow-purple-500/10 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print Box Label
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
                      {clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}
                    </h2>
                    <p className="text-[10px] font-bold text-blue-800 tracking-wider uppercase mt-0.5">
                      Cumulative Patient Medical History Ledger
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'} | Phone: {clinicSettings?.PhoneMobile || '+92-300-4208323'}
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
                              <span className="font-extrabold text-blue-800">{formatShortDate(v.VisitDate)}</span>
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
                      <p>{clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}</p>
                      <p className="font-mono text-[8px] mt-0.5">Verification Ledger Hash: HIS-{historyPrintPatient.PatientID}</p>
                    </div>
                    <div className="text-center w-64 border-t border-slate-400 pt-1 text-slate-800">
                      <p className="font-bold uppercase tracking-wider">{clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'}</p>
                      <p className="text-[8px] text-slate-500">{clinicSettings?.DoctorSignatureText || 'Registered Homeopathic Medical Practitioner No: 48776'}</p>
                    </div>
                  </div>
                </>
              ) : printData ? (
                (() => {
                  if (printLayoutType === 'lab') {
                    // Lab test only print template
                    return (
                      <>
                        {/* Slip Header */}
                        <div className="text-center border-b-2 border-double border-slate-300 pb-3 mb-5">
                          <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase font-sans">
                            {clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}
                          </h2>
                          <p className="text-[10px] font-bold text-blue-700 tracking-wider uppercase mt-0.5">
                            🔬 LABORATORY & DIAGNOSTIC REQUISITION SLIP
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'} | Phone: {clinicSettings?.PhoneMobile || '+92-300-4208323'}
                          </p>
                        </div>

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

                        {/* Lab Test list */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white mb-5 print:border-slate-300">
                          <h3 className="font-extrabold text-xs text-slate-950 tracking-wider mb-4 pb-1 border-b border-slate-200 flex items-center uppercase font-serif">
                            🔬 Advised Laboratory & Diagnostic Tests
                          </h3>
                          {printData.selectedLabTests.length === 0 ? (
                            <p className="text-xs text-slate-400 italic font-semibold">No laboratory tests advised.</p>
                          ) : (
                            <ul className="space-y-3 font-mono text-xs font-bold text-slate-900">
                              {printData.selectedLabTests.map((tid, index) => {
                                const test = labTests.find((t) => t.TID === tid);
                                return (
                                  <li key={tid} className="flex items-center space-x-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 font-mono text-[10px] bg-slate-200/60 px-2 py-0.5 rounded">0{index + 1}</span>
                                    <span>{test ? test.TestName : tid}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {/* Indication / Notes */}
                        {printData.symptomsDiagnosis && (
                          <div className="mb-6 p-3 rounded-lg border border-slate-100 bg-slate-50/20 text-[10px] print:border-slate-300 print:bg-white">
                            <span className="font-bold text-slate-400 uppercase block mb-1 tracking-wider text-[8px]">Clinical Indication & Diagnosis:</span>
                            <p className="text-slate-800 font-semibold italic">"{printData.symptomsDiagnosis}"</p>
                          </div>
                        )}

                        {/* Clinic Sign-Off */}
                        <div className="flex justify-between items-end border-t border-slate-250 pt-6 mt-10 text-[9px] font-semibold text-slate-400">
                          <div>
                            <p>{clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}</p>
                            <p className="font-mono text-[8px] mt-0.5">Verification Signature Hash: CRL-{printData.visitID}</p>
                          </div>
                          <div className="text-center w-64 border-t border-slate-400 pt-1 text-slate-800">
                            <p className="font-bold uppercase tracking-wider">{clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'}</p>
                            <p className="text-[8px] text-slate-500">{clinicSettings?.DoctorSignatureText || 'Registered Homeopathic Medical Practitioner No: 48776'}</p>
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (printLayoutType === 'label') {
                    // Small size clinical medicine box label
                    const clinicalMeds = printData.prescribedMedicines.filter(m => m.MedicineType === 'C');
                    return (
                      <div className="max-w-sm mx-auto border-2 border-dashed border-slate-400 p-5 rounded-2xl bg-white text-slate-800 font-sans shadow-sm print:border-slate-400 print:shadow-none my-4">
                        <div className="text-center border-b border-slate-200 pb-2.5 mb-3">
                          <h4 className="text-sm font-black tracking-wider text-slate-950 uppercase">
                            {clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}
                          </h4>
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mt-1">
                            🔬 compounded formulation label
                          </span>
                        </div>

                        {/* Patient Info */}
                        <div className="space-y-1 text-[10px] border-b border-slate-150 pb-2.5 mb-3 font-medium">
                          <p className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase">Patient:</span>
                            <span className="text-slate-950 font-black uppercase">{printData.patient?.PatientName}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase">Patient ID:</span>
                            <span className="text-slate-950 font-mono font-bold">{printData.patient?.PatientID}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-slate-400 font-bold uppercase">Date:</span>
                            <span className="text-slate-950 font-mono font-bold">{printData.visitDate}</span>
                          </p>
                        </div>

                        {/* Compounded Medicines */}
                        <div className="space-y-2 mb-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Rx Instructions / Usage:</span>
                          {clinicalMeds.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic py-2 text-center">No Compounded ('C') medicines prescribed.</p>
                          ) : (
                            clinicalMeds.map((med, idx) => {
                              return (
                                <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-left">
                                  <p className="text-xs font-extrabold text-slate-950">{med.Dosage}</p>
                                  {med.MedicineDetail && (
                                    <p className="text-[10px] text-slate-500 italic font-bold mt-1">{med.MedicineDetail}</p>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer Instructions */}
                        <div className="border-t border-slate-200 pt-2.5 text-[9px] text-slate-500 text-center leading-relaxed font-semibold">
                          <p>Keep in a cool, dry place away from sunlight.</p>
                          <p className="mt-1 text-[8px] text-slate-400 uppercase tracking-widest">Formulated Internally by Compounding Pharmacist</p>
                        </div>
                      </div>
                    );
                  }

                  // Standard slip layout
                  const filteredMeds = printData.prescribedMedicines.filter((med) => {
                    if (printFilter === 'P') return med.MedicineType === 'P';
                    if (printFilter === 'C') return med.MedicineType === 'C';
                    return true;
                  });
                  return (
                    <>
                    {/* Professional PHC Letterhead (A4 optimized) */}
                    <div className="border-b-4 border-emerald-800 pb-4 mb-6">
                      <div className="flex justify-between items-start">
                        {/* Left Side: PHC Logo & Clinic Name */}
                        <div className="flex items-center space-x-4">
                          {/* Beautiful PHC Medical Emblem Logo */}
                          <div className="w-14 h-14 bg-emerald-800 rounded-xl flex flex-col items-center justify-center text-white border-2 border-emerald-600 shadow-md shrink-0">
                            <span className="text-base font-black tracking-tighter leading-none">PHC</span>
                            <span className="text-[6px] font-black uppercase tracking-widest mt-0.5 opacity-90">Punjab</span>
                          </div>
                          <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase font-sans leading-none">
                              {clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}
                            </h2>
                            <p className="text-[9px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                              {printFilter === 'all' && 'Comprehensive Family Care & Advanced OPD Consultations'}
                              {printFilter === 'P' && 'Outside Patient Prescription Slip (Pre-packaged \'/P\')'}
                              {printFilter === 'C' && 'Internal Pharmacy Compounding Request (Clinical \'/C\')'}
                            </p>
                            <p className="text-[8px] text-slate-500 font-medium mt-0.5">
                              Reg No: 48776 | D.H.M.S (Pak)
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Contact / Address Details */}
                        <div className="text-right text-[9px] text-slate-600 font-medium leading-relaxed">
                          <p className="font-extrabold text-slate-900 uppercase">{clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic (PHC)'}</p>
                          <p className="text-slate-500">{clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'}</p>
                          <p className="text-slate-500">Phone: {clinicSettings?.PhoneMobile || '+92-300-4208323'}</p>
                          <p className="text-slate-500">Email: punjabhomeopathic@gmail.com</p>
                        </div>
                      </div>
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
                                const renderedRows = filteredMeds.map((med, idx) => {
                                const itm = items.find((i) => i.ItemID === med.ItemID);
                                const isC = med.MedicineType === 'C';
                                const patentPrice = med.Price !== undefined ? med.Price : (itm ? itm.Price : 0);
                                const nameDisplay = isC
                                  ? (itm ? itm.ItemName : med.ItemID)
                                  : (() => {
                                      const nameStr = itm ? itm.ItemName : med.ItemID;
                                      return `${nameStr} (Rs. ${patentPrice.toFixed(2)})`;
                                    })();

                                return (
                                  <tr key={idx} className="hover:bg-slate-50/40">
                                    <td className="py-1.5 font-bold text-slate-900">
                                      <div>{nameDisplay}</div>
                                      {med.MedicineType === 'C' && med.Qty && (
                                        <div className="text-[8px] text-indigo-700 font-extrabold mt-0.5">
                                          Qty: {med.Qty} Tab{med.Qty > 1 ? 's' : ''}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-1.5 text-center">
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                        med.MedicineType === 'C' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                      }`}>
                                        {med.MedicineType === 'C' ? 'Compounded (C)' : 'Patent (P)'}
                                      </span>
                                    </td>
                                    <td className="py-1.5 text-center font-bold text-slate-950 font-mono">{med.Dosage}</td>
                                    {printFilter !== 'P' && (
                                      <td className="py-1.5 text-right font-mono text-slate-900 font-semibold">
                                        {isC ? '—' : patentPrice.toFixed(2)}
                                      </td>
                                    )}
                                    {printFilter !== 'P' && (
                                      <td className="py-1.5 text-right font-mono text-slate-900 font-bold">
                                        {isC ? '—' : (patentPrice * 10).toFixed(2)}
                                      </td>
                                    )}
                                    <td className="py-1.5 text-right text-slate-600 font-semibold">{med.MedicineDetail}</td>
                                  </tr>
                                );
                                });

                                return (
                                  <>
                                    {renderedRows}
                                  </>
                                );
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Official Checkout Payment Receipt (Shown on Clinical & Comprehensive, but excluded from Patent 'P' Slips per clinical layout request) */}
                    {printFilter !== 'P' && (
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 mb-5 print:bg-white print:border-slate-300">
                        <h4 className="font-extrabold text-[10px] text-slate-800 tracking-wider mb-3 pb-1 border-b border-slate-200 flex items-center uppercase font-serif">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-700 mr-1.5 shrink-0" />
                          Official OPD Checkout & Payment Receipt (Punjab Health Clinic)
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white border border-slate-250 p-2.5 rounded-xl shadow-xs print:border-slate-300">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Consultation Fee</span>
                            <span className="text-xs font-black text-slate-950 mt-1 block">Rs. {(Number(printData?.consultationFee) || 0).toFixed(2)}</span>
                            <span className="text-[7px] text-emerald-700 font-extrabold uppercase mt-0.5 block">{printData?.consultationPaymentOption || 'Paid'}</span>
                          </div>
                          <div className="bg-white border border-slate-250 p-2.5 rounded-xl shadow-xs print:border-slate-300">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Payment of File</span>
                            <span className="text-xs font-black text-slate-950 mt-1 block">Rs. {Number(printData?.cardsPayment || 0).toFixed(2)}</span>
                            <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5 block">Registration Fee</span>
                          </div>
                          <div className="bg-white border border-slate-250 p-2.5 rounded-xl shadow-xs print:border-slate-300">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Clinical Medicine</span>
                            <span className="text-xs font-black text-slate-950 mt-1 block">Rs. {Number(printData?.clinicalMedicinePayment || 0).toFixed(2)}</span>
                            <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-0.5 block">Compounded Drugs</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 bg-emerald-800 text-white rounded-lg p-2.5 flex justify-between items-center text-[10px] font-bold print:bg-emerald-800 print:text-white">
                          <span className="uppercase tracking-wider">Total Received Amount (In Cash / Card):</span>
                          <span className="font-mono text-xs font-black">
                            Rs. {(
                              (Number(printData?.consultationFee) || 0) +
                              Number(printData?.cardsPayment || 0) + 
                              Number(printData?.clinicalMedicinePayment || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

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
                        <p>{clinicSettings?.ClinicName || 'Punjab Homeopathic Clinic'}</p>
                        <p className="font-mono text-[8px] mt-0.5">Verification Signature Hash: CRV-{printData.visitID}</p>
                      </div>
                      <div className="text-center w-64 border-t border-slate-400 pt-1 text-slate-800">
                        <p className="font-bold uppercase tracking-wider">{clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)'}</p>
                        <p className="text-[8px] text-slate-500">{clinicSettings?.DoctorSignatureText || 'Registered Homeopathic Medical Practitioner No: 48776'}</p>
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
                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Search Patient Database</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Search by ID, name, phone..."
                      value={patientLookupSearch}
                      onChange={(e) => setPatientLookupSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchLookupPatients(patientLookupSearch);
                        }
                      }}
                      className="w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fetchLookupPatients(patientLookupSearch)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xxs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                  {isLookupLoading && (
                    <span className="text-[10px] text-blue-600 font-semibold animate-pulse block">Searching database...</span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                  {(() => {
                    const q = patientLookupSearch.toLowerCase().trim();
                    if (!q) {
                      return (
                        <div className="text-center py-6 px-4">
                          <p className="text-xxs text-slate-400 font-medium">
                            Type a patient name, ID, or phone number, then click <strong>Search</strong> or press <strong>Enter</strong> to query active and NHC archived patients.
                          </p>
                        </div>
                      );
                    }

                    const activeFiltered = patients.filter(p => matchPatientRecord(p, q));

                    // De-duplicate NHC patients by PatientID before filtering
                    const uniqueNhcPatsForLookup: NhcPatientHistory[] = [];
                    const seenLookupIds = new Set<string>();
                    (localNhcPatients || []).forEach(p => {
                      if (!seenLookupIds.has(p.PatientID)) {
                        seenLookupIds.add(p.PatientID);
                        uniqueNhcPatsForLookup.push(p);
                      }
                    });

                    const nhcFiltered = uniqueNhcPatsForLookup.filter(p => {
                      const matches = matchPatientRecord(p, q);
                      const isAlreadyActive = patients.some(ap => ap.PatientID === p.PatientID);
                      return matches && !isAlreadyActive;
                    });

                    const combined = [
                      ...activeFiltered.map(p => ({ ...p, isNhcArchive: false })),
                      ...nhcFiltered.map(p => ({
                        PatientID: p.PatientID,
                        PatientName: p.PatientName,
                        Father_husband: p.Father_husband || '',
                        AgeYears: p.AgeYears || 0,
                        Sex: p.Sex || '',
                        PhoneMobile: p.PhoneMobile || '',
                        Address: p.Address || '',
                        CityID: 1,
                        Country: 'Pakistan',
                        RegistrationDate: p.RegistrationDate || '',
                        isNhcArchive: true,
                        Symptoms: p.Symptoms,
                        Diagnosis: p.Diagnosis,
                        MedicalCondition: p.MedicalCondition,
                        PrescribedMedicines: p.PrescribedMedicines,
                        LabTests: p.LabTests,
                        VisitDate: p.VisitDate
                      }))
                    ];

                    if (combined.length === 0) {
                      return <p className="text-xxs text-slate-400 italic py-4 text-center">No matching records found.</p>;
                    }

                    return combined.map((p, idx) => {
                      const isSelected = lookupPatientId === p.PatientID;
                      return (
                        <div
                          key={`emr-lkp-${p.PatientID}-${idx}`}
                          onClick={() => setLookupPatientId(p.PatientID)}
                          className={`p-2.5 rounded-lg border text-xxs cursor-pointer transition text-left flex flex-col space-y-1 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/40 font-bold'
                              : 'border-slate-150 hover:bg-slate-50 bg-slate-50/20'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-950 text-xs">{p.PatientName}</span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                              p.isNhcArchive ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {p.isNhcArchive ? 'NHC' : 'Active'}
                            </span>
                          </div>
                          <span className="font-mono text-slate-400 text-[10px]">{p.PatientID} | {p.PhoneMobile || 'No Phone'}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right Column (md:col-span-8): Active Demographics & Chronological History */}
              <div className="md:col-span-8 space-y-4 flex flex-col max-h-[450px] overflow-y-auto pr-1 text-left">
                {(() => {
                  const pat = patients.find(p => p.PatientID === lookupPatientId) || 
                              (localNhcPatients || []).find(p => p.PatientID === lookupPatientId);
                  if (!pat) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 space-y-2">
                        <Search className="w-8 h-8 opacity-40 text-slate-500" />
                        <p className="text-xs font-semibold italic">Select a patient from the left panel to examine medical history records.</p>
                      </div>
                    );
                  }

                  const isNhcArchiveOnly = !patients.some(p => p.PatientID === pat.PatientID);
                  
                  const lookupMatchedIds = getMatchingPatientIds(pat.PatientID);
                  const localVisitsForLookup = visits.filter(v => lookupMatchedIds.includes(v.PatientID));
                  
                  const nhcByDateForLookup: { [date: string]: NhcPatientHistory[] } = {};
                  (localNhcPatients || [])
                    .filter(v => lookupMatchedIds.includes(v.PatientID))
                    .forEach(v => {
                      const date = v.VisitDate || v.RegistrationDate || 'N/A';
                      if (!nhcByDateForLookup[date]) {
                        nhcByDateForLookup[date] = [];
                      }
                      nhcByDateForLookup[date].push(v);
                    });

                  const nhcVisitsMappedForLookup = Object.keys(nhcByDateForLookup).map((date, idx) => {
                    const recordsForDate = nhcByDateForLookup[date];
                    const meds: string[] = [];
                    
                    recordsForDate.forEach(rec => {
                      if (rec.MedicineDetail) {
                        const dosage = rec.Dosage ? ` - ${rec.Dosage}` : '';
                        meds.push(`${rec.MedicineDetail}${dosage}`);
                      } else if (rec.PrescribedMedicines && rec.PrescribedMedicines !== rec.MedicalCondition) {
                        const parts = rec.PrescribedMedicines.split(',').map(p => p.trim()).filter(Boolean);
                        parts.forEach((medName) => {
                          meds.push(medName);
                        });
                      }
                    });

                    const directDiagList = recordsForDate.map(r => r.SymptomsDiagnosis || (r as any).Symptoms_Diagnosis || (r as any).symptoms_diagnosis || (r as any).symptomsdiagnosis).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                    const finalSymptomsDiag = directDiagList.length > 0 
                      ? directDiagList.join(' | ') 
                      : (() => {
                          const symptomsList = recordsForDate.map(r => r.Symptoms).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                          const diagnosisList = recordsForDate.map(r => r.Diagnosis || r.MedicalCondition).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                          return `Symptoms: ${symptomsList.join(', ') || 'None'} | Diagnosis/Condition: ${diagnosisList.join(', ') || 'None'}`;
                        })();
                    const labsList = recordsForDate.map(r => r.LabTests).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);

                    return {
                      VisitID: `NHC-${pat.PatientID}-${idx}`,
                      PatientID: pat.PatientID,
                      VisitDate: date,
                      SymptomsDiagnosis: finalSymptomsDiag,
                      MedicalReportResult: 'Archived NHC Clinical History',
                      LabTestAdvice: labsList.join(', ') || '',
                      PatientAdvice: meds.join(', ') || 'N/A',
                      VisitRemarks: 'Archived NHC Clinical History',
                      VisitStatus: 2,
                      ConsultationFee: 0,
                      ClinicalPaymentOption: 'N/A',
                      PatentPaymentOption: 'N/A',
                      ConsultationPaymentOption: 'N/A',
                      IsNhc: true
                    } as unknown as Visit;
                  });

                  const patientVisits = [...localVisitsForLookup, ...nhcVisitsMappedForLookup];
                  patientVisits.sort((a, b) => String(b.VisitDate || '').localeCompare(String(a.VisitDate || '')));

                  return (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Demographic profile */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xxs">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-xs text-slate-900 uppercase">Demographic Card Profile</h4>
                            {isNhcArchiveOnly && (
                              <span className="text-[8px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded uppercase">NHC ARCHIVE</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {isNhcArchiveOnly && onAddPatient && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newPatient: Patient = {
                                    PatientID: pat.PatientID,
                                    PatientName: pat.PatientName,
                                    Father_husband: pat.Father_husband || 'N/A',
                                    AgeYears: pat.AgeYears || 30,
                                    Sex: (pat.Sex === 'Male' || pat.Sex === 'Female' || pat.Sex === 'Other') ? pat.Sex : 'Male',
                                    MaritalStatus: 'Single',
                                    Occupation: 'N/A',
                                    Address: pat.Address || 'N/A',
                                    CityID: 1,
                                    Country: 'Pakistan',
                                    PhoneMobile: pat.PhoneMobile || '03000000000',
                                    RegistrationDate: pat.RegistrationDate || new Date().toISOString()
                                  };
                                  onAddPatient(newPatient);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg flex items-center shadow-md shadow-emerald-500/10 cursor-pointer transition"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Import Patient
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isNhcArchiveOnly && onAddPatient) {
                                  const newPatient: Patient = {
                                    PatientID: pat.PatientID,
                                    PatientName: pat.PatientName,
                                    Father_husband: pat.Father_husband || 'N/A',
                                    AgeYears: pat.AgeYears || 30,
                                    Sex: (pat.Sex === 'Male' || pat.Sex === 'Female' || pat.Sex === 'Other') ? pat.Sex : 'Male',
                                    MaritalStatus: 'Single',
                                    Occupation: 'N/A',
                                    Address: pat.Address || 'N/A',
                                    CityID: 1,
                                    Country: 'Pakistan',
                                    PhoneMobile: pat.PhoneMobile || '03000000000',
                                    RegistrationDate: pat.RegistrationDate || new Date().toISOString()
                                  };
                                  onAddPatient(newPatient);
                                }
                                setSelectedPatientId(pat.PatientID);
                                setPatientSearch(`${pat.PatientName} (${pat.PatientID})`);
                                setPatientLookupModalOpen(false);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center shadow-md shadow-indigo-500/10 cursor-pointer transition"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Select for EMR
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrintLayoutType('history');
                                setHistoryPrintPatient(pat);
                                setHistoryPrintVisits(patientVisits);
                                setPrintModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg flex items-center shadow-md shadow-blue-500/10 cursor-pointer transition"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              Print History
                            </button>
                          </div>
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
                            <strong className="text-slate-900">{pat.Father_husband || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Age / Sex</span>
                            <strong className="text-slate-900">{pat.AgeYears || 'N/A'}y / {pat.Sex || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">Mobile Phone</span>
                            <strong className="text-slate-900 font-mono">{pat.PhoneMobile || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase font-bold text-[8px]">City Residence</span>
                            <strong className="text-slate-900">
                              {cities.find(c => c.CityID === (pat as any).CityID)?.CityName || 'N/A'}
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
                            {patientVisits.map((v, idx) => {
                              const isNhc = (v as any).IsNhc;
                              return (
                                <div key={v.VisitID} className={`border rounded-xl p-3 bg-white space-y-2.5 shadow-sm ${
                                  isNhc ? 'border-indigo-150' : 'border-slate-150'
                                }`}>
                                  <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-md text-[10px]">
                                    <div className="flex items-center space-x-1.5">
                                      <strong className="text-slate-800">Visit {patientVisits.length - idx} (ID: {v.VisitID})</strong>
                                      {isNhc && (
                                        <span className="text-[8px] bg-purple-100 text-purple-800 font-extrabold px-1 rounded uppercase">
                                          NHC
                                        </span>
                                      )}
                                    </div>
                                    <strong className="text-blue-700">{formatShortDate(v.VisitDate)}</strong>
                                  </div>

                                  <div className="space-y-1.5 text-xxs font-medium text-slate-600">
                                    <div>
                                      <span className="text-slate-400 uppercase font-bold text-[8px] block">Diagnosis Summarized:</span>
                                      <p className="text-slate-900 font-semibold italic mt-0.5">"{v.SymptomsDiagnosis}"</p>
                                    </div>
                                    {v.MedicalReportResult && (
                                      <div>
                                        <span className="text-slate-400 uppercase font-bold text-[8px] block">Physical Exam Findings / Source:</span>
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
                                        <span className="text-slate-400 uppercase font-bold text-[8px] block">Treatment Advice / Prescribed Medicines:</span>
                                        <p className="text-emerald-700 font-semibold mt-0.5">{v.PatientAdvice}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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

      {/* Symptom & Disease Smart Medicine Locator Modal */}
      {locatorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Smart Medicine Locator</h3>
                  <p className="text-xxs text-slate-500 font-semibold mt-0.5">Filter & select Patent / Pre-packaged ('P') medicines</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocatorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              {/* Segmented Control / Tabs */}
              <div className="flex border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocatorTab('excel');
                    setDiseaseSearch('');
                    setSelectedDiseaseFilter('');
                  }}
                  className={`flex-1 py-1.5 text-center text-xxs font-black uppercase tracking-wider transition cursor-pointer ${
                    locatorTab === 'excel'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Symptoms Excel Locator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocatorTab('preset');
                    setDiseaseSearch('');
                    setSelectedDiseaseFilter('');
                  }}
                  className={`flex-1 py-1.5 text-center text-xxs font-black uppercase tracking-wider transition cursor-pointer ${
                    locatorTab === 'preset'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Standard Preset Tags
                </button>
              </div>

              {/* Disease Search Box */}
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">
                  {locatorTab === 'excel' ? 'Search Uploaded Symptom Directory' : 'Search by Disease / Indication / Symptom'}
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={locatorTab === 'excel' ? "Type symptoms like fever, cough, chest, stomach..." : "Search Fever, Throat, Kidney, Cough, Pain..."}
                    value={diseaseSearch}
                    onChange={(e) => {
                      setDiseaseSearch(e.target.value);
                      setSelectedDiseaseFilter(''); // Clear preset selection on typing
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Preset Disease Buttons (only in preset tab) */}
              {locatorTab === 'preset' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">Quick Preset Tags</span>
                  <div className="flex flex-wrap gap-1.5">
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
                          className={`px-3 py-1.5 rounded-lg text-xxs font-extrabold transition cursor-pointer ${
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
                </div>
              )}

              {/* Medicine List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                
                {locatorTab === 'excel' ? (
                  <>
                    <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Matching Excel Medicines ({
                        (() => {
                          const query = diseaseSearch.toLowerCase().trim();
                          return smartLocatorMedicines.filter(m => {
                            if (!query) return true;
                            return m.Symptoms.toLowerCase().includes(query) ||
                                   m.MedicineName.toLowerCase().includes(query) ||
                                   m.Composition.toLowerCase().includes(query) ||
                                   m.Dosage.toLowerCase().includes(query);
                          }).length;
                        })()
                      })
                    </span>

                    <div className="overflow-y-auto max-h-[250px] space-y-2 pr-1 divide-y divide-slate-100">
                      {(() => {
                        const query = diseaseSearch.toLowerCase().trim();
                        const filtered = smartLocatorMedicines.filter(m => {
                          if (!query) return true;
                          return m.Symptoms.toLowerCase().includes(query) ||
                                 m.MedicineName.toLowerCase().includes(query) ||
                                 m.Composition.toLowerCase().includes(query) ||
                                 m.Dosage.toLowerCase().includes(query);
                        });

                        if (filtered.length === 0) {
                          return <p className="text-xxs text-slate-400 italic text-center py-8">No matching smart medicines found. Try another symptom term or upload more records in the Bulk Uploader tab.</p>;
                        }

                        return filtered.map((m, idx) => {
                          // Find matching item in inventory by name case-insensitively
                          const matchedItem = items.find(i => {
                            const cleanItemName = i.ItemName.trim().toLowerCase();
                            const cleanMedName = m.MedicineName.trim().toLowerCase();
                            return cleanItemName === cleanMedName || cleanItemName.includes(cleanMedName) || cleanMedName.includes(cleanItemName);
                          });

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (matchedItem) {
                                  const isC = isClinicalItem(matchedItem.ItemID);
                                  setRowMedicineId(matchedItem.ItemID);
                                  setMedSearch(matchedItem.ItemName);
                                  setRowType(isC ? 'C' : 'P');
                                  if (m.Dosage) setRowDosage(m.Dosage);
                                  if (m.Composition) setRowDetail(m.Composition);
                                  setLocatorModalOpen(false); // Close locator popup on click selection
                                } else {
                                  alert(`The medicine "${m.MedicineName}" is not in your current Pharmacy Inventory.\n\nPlease add this medicine to your inventory list in the Excel Bulk Uploader tab, or select an in-stock alternative.`);
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-xxs text-left flex flex-col space-y-1 transition ${
                                matchedItem
                                  ? 'border-indigo-100 bg-indigo-50/5 hover:bg-indigo-50/20 hover:border-indigo-400 cursor-pointer'
                                  : 'border-slate-100 bg-slate-50/10 opacity-70 hover:opacity-100 hover:border-rose-300 cursor-pointer'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900 text-xs flex items-center flex-wrap gap-1">
                                  <span>{m.MedicineName}</span>
                                  {matchedItem ? (
                                    <span className="px-1 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 font-extrabold rounded border border-emerald-200">
                                      IN PHARMACY ({matchedItem.ItemID})
                                    </span>
                                  ) : (
                                    <span className="px-1 py-0.5 text-[8px] bg-rose-100 text-rose-800 font-extrabold rounded border border-rose-200">
                                      UNLISTED
                                    </span>
                                  )}
                                </span>
                                {m.Dosage && (
                                  <span className="font-mono text-[9px] text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">
                                    {m.Dosage}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-[10px] text-slate-800 leading-normal">
                                <strong className="text-slate-400 font-bold">Symptoms: </strong>
                                {m.Symptoms}
                              </div>

                              {m.Composition && (
                                <div className="text-[9px] text-slate-500 font-mono">
                                  <strong className="text-slate-400 font-bold font-sans">Comp: </strong>
                                  {m.Composition}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Matching Preset Medicines ({
                        (() => {
                          const query = (diseaseSearch || selectedDiseaseFilter).toLowerCase().trim();
                          return items.filter((itm) => {
                            const name = itm.ItemName.toLowerCase();
                            const cat = (MEDICINE_CATEGORIES[itm.ItemID] || '').toLowerCase();
                            if (query) {
                              if (name.includes(query) || cat.includes(query)) return true;
                              if (query === 'fever' && (itm.ItemID === 'ITM-001' || itm.ItemID === 'ITM-004' || itm.ItemID === 'ITM-008')) return true;
                              if (query === 'throat' && (itm.ItemID === 'ITM-002' || itm.ItemID === 'ITM-007' || itm.ItemID === 'ITM-010')) return true;
                              if (query === 'kidney' && (itm.ItemID === 'ITM-003' || itm.ItemID === 'ITM-009')) return true;
                              if (query === 'pain' && (itm.ItemID === 'ITM-001' || itm.ItemID === 'ITM-003' || itm.ItemID === 'ITM-008')) return true;
                              if (query === 'gastric' && itm.ItemID === 'ITM-009') return true;
                              return false;
                            }
                            return true;
                          }).length;
                        })()
                      })
                    </span>
                    
                    <div className="overflow-y-auto max-h-[250px] space-y-2 pr-1 divide-y divide-slate-100">
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
                          return <p className="text-xxs text-slate-400 italic text-center py-8">No matching medicines found.</p>;
                        }

                        return filteredPatentOnly.map((itm, idx) => {
                          const catLabel = MEDICINE_CATEGORIES[itm.ItemID] || "Pre-packaged Patent ('P') Formula";
                          const isSelected = rowMedicineId === itm.ItemID;
                          return (
                            <div
                              key={`${itm.ItemID}-${idx}`}
                              onClick={() => {
                                const isC = isClinicalItem(itm.ItemID);
                                setRowMedicineId(itm.ItemID);
                                setMedSearch(itm.ItemName);
                                setRowType(isC ? 'C' : 'P');
                                setLocatorModalOpen(false); // Close locator popup on click selection
                              }}
                              className={`p-2.5 rounded-lg border text-xxs text-left flex flex-col space-y-1 cursor-pointer transition ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                                  : 'border-slate-150 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900 text-xs">{itm.ItemName}</span>
                                <span className="font-mono text-[9px] text-slate-400 font-bold shrink-0">{itm.ItemID}</span>
                              </div>
                              
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[9px] text-blue-700 font-bold bg-blue-50/80 px-2 py-0.5 rounded">
                                  {catLabel}
                                </span>
                                <span className="font-bold font-mono text-xs text-emerald-700">Rs. {itm.Price.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <span className="text-[10px] text-slate-400 font-semibold">Smart Medicine Recommendation Engine</span>
              <button
                type="button"
                onClick={() => setLocatorModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Close Locator
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Diagnostics Advisory (Lab Tests) Modal */}
      {labTestsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Diagnostics Advisory (Lab Tests)</h3>
                  <p className="text-xxs text-slate-500 font-bold mt-0.5">Recommend laboratory clinical trials & tests for patient</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLabTestsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Selected Tests Summary Bar */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xxs font-black text-slate-500 uppercase tracking-wider">Advised Lab Tests ({selectedLabTests.length})</span>
                  {selectedLabTests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedLabTests([])}
                      className="text-[9px] font-black text-red-600 hover:text-red-800 uppercase tracking-widest bg-red-50 border border-red-100 px-1.5 py-0.5 rounded"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedLabTests.length === 0 ? (
                    <span className="text-xxs text-slate-400 italic font-semibold">No lab tests selected yet. Choose from the repository below.</span>
                  ) : (
                    selectedLabTests.map((tid) => {
                      const test = labTests.find((t) => t.TID === tid);
                      if (!test) return null;
                      return (
                        <div key={tid} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-bold shadow-xs">
                          <span className="truncate max-w-[200px]">{test.TestName}</span>
                          <span className="text-[10px] text-indigo-400 font-mono">(Rs. {test.Cost})</span>
                          <button
                            type="button"
                            onClick={() => setSelectedLabTests(selectedLabTests.filter((id) => id !== tid))}
                            className="text-red-500 hover:text-red-700 font-black text-xs ml-1 bg-white hover:bg-red-50 w-4 h-4 rounded-full flex items-center justify-center transition border border-indigo-100"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Lab Test Search Input */}
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Search Lab Tests Repository</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search CBC, Liver Profile, Kidney Function, Thyroid, Glucose, HBA1C..."
                    value={diagSearch}
                    onChange={(e) => setDiagSearch(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Lab Tests Grid/List */}
              <div className="space-y-2 pt-2">
                <span className="block text-xxs font-black text-slate-400 uppercase tracking-wider">
                  Available Lab Diagnostics ({
                    labTests.filter((t) => {
                      const q = diagSearch.toLowerCase().trim();
                      return !q || t.TestName.toLowerCase().includes(q) || t.TID.toLowerCase().includes(q);
                    }).length
                  })
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[220px] pr-1">
                  {(() => {
                    const q = diagSearch.toLowerCase().trim();
                    const filtered = labTests.filter((t) => {
                      return !q || t.TestName.toLowerCase().includes(q) || t.TID.toLowerCase().includes(q);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic font-semibold bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                          No matching laboratory diagnostic trials found.
                        </div>
                      );
                    }

                    return filtered.map((test) => {
                      const isSelected = selectedLabTests.includes(test.TID);
                      return (
                        <div
                          key={test.TID}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLabTests(selectedLabTests.filter(id => id !== test.TID));
                            } else {
                              setSelectedLabTests([...selectedLabTests, test.TID]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition select-none ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                              : 'border-slate-150 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 truncate pr-2">
                            <span className="font-extrabold text-slate-900 text-xs block truncate">{test.TestName}</span>
                            <span className="font-mono text-[9px] text-slate-400 font-bold block">{test.TID}</span>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                            <span className="font-bold font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Rs. {test.Cost}</span>
                            {isSelected ? (
                              <span className="text-[8px] font-black text-indigo-700 uppercase tracking-wider">Advised ✓</span>
                            ) : (
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Select +</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Laboratory Diagnostics advisory panel</span>
              <button
                type="button"
                onClick={() => setLabTestsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg transition cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Done & Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Patient Demographics Modal */}
      {editPatientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col animate-fadeIn text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Patient Demographic Card</h3>
                  <p className="text-xxs text-slate-500 font-semibold">Update medical record registry attributes for the current session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditPatientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Patient Name *</label>
                  <input
                    type="text"
                    value={editPatientName}
                    onChange={(e) => setEditPatientName(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                  />
                </div>

                {/* Father / Husband Name */}
                <div className="space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Father / Husband *</label>
                  <input
                    type="text"
                    value={editPatientFather}
                    onChange={(e) => setEditPatientFather(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="text"
                    value={editPatientPhone}
                    onChange={(e) => setEditPatientPhone(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-mono"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Age (Years) *</label>
                  <input
                    type="number"
                    value={editPatientAge}
                    onChange={(e) => setEditPatientAge(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-mono"
                  />
                </div>

                {/* Sex */}
                <div className="space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Sex *</label>
                  <select
                    value={editPatientSex}
                    onChange={(e) => setEditPatientSex(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Resident Location */}
                <div className="space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Resident City *</label>
                  <select
                    value={editPatientCityId}
                    onChange={(e) => setEditPatientCityId(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                  >
                    {cities.map((c) => (
                      <option key={c.CityID} value={c.CityID}>{c.CityName}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Address Details</label>
                  <input
                    type="text"
                    value={editPatientAddress}
                    onChange={(e) => setEditPatientAddress(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setEditPatientModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePatientEdit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center shadow-md shadow-emerald-600/10"
              >
                <Check className="w-4 h-4 mr-1.5 shrink-0" />
                <span>Save Demographic Changes</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Patient History Timeline Popup Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn text-left">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wide">
                    {(() => {
                      const activePatient = patients.find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                            (localNhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId)) ||
                                            (nhcPatients || []).find(p => String(p.PatientID) === String(selectedPatientId));
                      return activePatient ? `History Timeline: ${activePatient.PatientName}` : 'Patient History Timeline';
                    })()}
                  </h3>
                  <span className="font-mono text-xxs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded-full">
                    MR# {selectedPatientId}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Filter controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-xxs font-black text-slate-500 uppercase tracking-wider">
                    Select Clinical Visit Date:
                  </span>
                </div>
                <select
                  value={emrSelectedVisitDate}
                  onChange={(e) => setEmrSelectedVisitDate(e.target.value)}
                  className="text-xs font-bold font-mono bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Visits ({(() => {
                    const matchedIds = getMatchingPatientIds(selectedPatientId);
                    const localCount = visits.filter(v => matchedIds.includes(v.PatientID)).length;
                    const nhcRecs = (localNhcPatients || []).filter(v => matchedIds.includes(v.PatientID));
                    const uniqueNhcDates = Array.from(new Set(nhcRecs.map(r => r.VisitDate || r.RegistrationDate || 'N/A'))).filter(Boolean);
                    return localCount + uniqueNhcDates.length;
                  })()})</option>
                  {(() => {
                    const matchedIds = getMatchingPatientIds(selectedPatientId);
                    const localDates = visits.filter(v => matchedIds.includes(v.PatientID)).map(v => v.VisitDate);
                    const nhcDates = (localNhcPatients || []).filter(v => matchedIds.includes(v.PatientID)).map(v => v.VisitDate || v.RegistrationDate);
                    const allDates = Array.from(new Set([...localDates, ...nhcDates])).filter(Boolean) as string[];
                    allDates.sort((a, b) => b.localeCompare(a));
                    return allDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* Timeline list */}
              <div className="space-y-3.5">
                {(() => {
                  const matchedIds = getMatchingPatientIds(selectedPatientId);
                  const localVisitsMapped = visits
                    .filter(v => matchedIds.includes(v.PatientID))
                    .map(v => ({
                      id: v.VisitID,
                      VisitID: v.VisitID,
                      VisitDate: v.VisitDate,
                      SymptomsDiagnosis: v.SymptomsDiagnosis,
                      LabTestAdvice: v.LabTestAdvice,
                      IsNhc: false,
                      Medicines: visitMedicines
                        .filter(m => m.VisitID === v.VisitID)
                        .map(m => ({
                          ItemID: m.ItemID,
                          ItemName: items.find(i => i.ItemID === m.ItemID)?.ItemName || m.ItemID,
                          Dosage: m.Dosage,
                          MedicineType: m.MedicineType,
                          MedicineDetail: m.MedicineDetail,
                          Price: m.Price || 0,
                          ExpireDate: m.ExpireDate || '—',
                          Notes50: m.Notes50 || ''
                        }))
                    }));

                  const nhcByDate: { [date: string]: NhcPatientHistory[] } = {};
                  (localNhcPatients || [])
                    .filter(v => matchedIds.includes(v.PatientID))
                    .forEach(v => {
                      const date = v.VisitDate || v.RegistrationDate || 'N/A';
                      if (!nhcByDate[date]) {
                        nhcByDate[date] = [];
                      }
                      nhcByDate[date].push(v);
                    });

                  const nhcVisitsMapped = Object.keys(nhcByDate).map((date, idx) => {
                    const recordsForDate = nhcByDate[date];
                    const meds: any[] = [];
                    
                    recordsForDate.forEach(rec => {
                      if (rec.MedicineDetail) {
                        const matchedItem = items.find(i => i.ItemName.toLowerCase() === rec.MedicineDetail.toLowerCase());
                        meds.push({
                          ItemID: matchedItem?.ItemID || `NHC-${idx}`,
                          ItemName: rec.MedicineDetail,
                          Dosage: rec.Dosage || '1 Daily',
                          MedicineType: rec.MedicineType === 'C' ? 'C' : 'P',
                          MedicineDetail: rec.MedicineDetail,
                          Price: matchedItem?.Price || 0,
                          ExpireDate: '—',
                          Notes50: (rec as any).Notes50 || ''
                        });
                      } else if (rec.PrescribedMedicines && rec.PrescribedMedicines !== rec.MedicalCondition) {
                        const matchedItem = items.find(i => i.ItemName.toLowerCase() === rec.PrescribedMedicines.toLowerCase());
                        meds.push({
                          ItemID: matchedItem?.ItemID || `NHC-${idx}`,
                          ItemName: rec.PrescribedMedicines,
                          Dosage: rec.Dosage || '1 Daily',
                          MedicineType: rec.MedicineType === 'C' ? 'C' : 'P',
                          MedicineDetail: rec.PrescribedMedicines,
                          Price: matchedItem?.Price || 0,
                          ExpireDate: '—',
                          Notes50: (rec as any).Notes50 || ''
                        });
                      }
                    });

                    const directDiagList = recordsForDate.map(r => r.SymptomsDiagnosis || (r as any).Symptoms_Diagnosis || (r as any).symptoms_diagnosis || (r as any).symptomsdiagnosis).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                    const finalSymptomsDiag = directDiagList.length > 0 
                      ? directDiagList.join(' | ') 
                      : (() => {
                          const symptomsList = recordsForDate.map(r => r.Symptoms).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                          const diagnosisList = recordsForDate.map(r => r.Diagnosis || r.MedicalCondition).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);
                          return `Symptoms: ${symptomsList.join(', ') || 'None'} | Diagnosis/Condition: ${diagnosisList.join(', ') || 'None'}`;
                        })();
                    const labsList = recordsForDate.map(r => r.LabTests).filter(Boolean).filter((v, i, self) => self.indexOf(v) === i);

                    return {
                      id: `NHC-${selectedPatientId}-${idx}`,
                      VisitID: `NHC-${selectedPatientId}-${idx}`,
                      VisitDate: date,
                      SymptomsDiagnosis: finalSymptomsDiag,
                      LabTestAdvice: labsList.join(', ') || '',
                      IsNhc: true,
                      Medicines: meds
                    };
                  });

                  const combinedVisits = [...localVisitsMapped, ...nhcVisitsMapped];

                  const filteredVisits = emrSelectedVisitDate === 'All'
                    ? combinedVisits
                    : combinedVisits.filter(v => v.VisitDate === emrSelectedVisitDate);

                  if (filteredVisits.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 italic font-semibold text-xs bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        {emrSelectedVisitDate === 'All'
                          ? 'No past visits on file for this patient.'
                          : `No records found for visit date ${emrSelectedVisitDate}`}
                      </div>
                    );
                  }

                  return filteredVisits.map((vis) => {
                    const isExpanded = activeVisitLookupId === vis.VisitID || (emrSelectedVisitDate !== 'All' && filteredVisits.length === 1);
                    const clinicalMeds = vis.Medicines.filter(m => m.MedicineType === 'C');
                    const patentMeds = vis.Medicines.filter(m => m.MedicineType === 'P');

                    return (
                      <div
                        key={vis.id}
                        className={`rounded-xl border text-xs transition-all duration-200 ${
                          isExpanded
                            ? 'border-indigo-300 bg-white shadow-md'
                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                        }`}
                      >
                        <div
                          onClick={() => setActiveVisitLookupId(isExpanded ? '' : vis.VisitID)}
                          className="p-3 cursor-pointer flex justify-between items-center bg-slate-50/50 rounded-t-xl"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="font-extrabold text-slate-800 text-sm">{formatShortDate(vis.VisitDate)}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">({vis.VisitID})</span>
                            {vis.IsNhc ? (
                              <span className="text-[8px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
                                NHC
                              </span>
                            ) : (
                              <span className="text-[8px] bg-teal-100 text-teal-800 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
                                Local
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-xs font-black shrink-0 ml-2">{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 space-y-3.5 text-xs text-left animate-fadeIn">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Diagnosis Comments:</span>
                              <p className="text-slate-700 italic mt-0.5 leading-relaxed font-semibold text-xs">"{vis.SymptomsDiagnosis}"</p>
                            </div>

                            {vis.LabTestAdvice && vis.LabTestAdvice !== 'N/A' && (
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Lab Advised:</span>
                                <p className="font-extrabold font-mono text-indigo-900 mt-0.5 text-xs bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md inline-block">{vis.LabTestAdvice}</p>
                              </div>
                            )}

                            {(clinicalMeds.length > 0 || patentMeds.length > 0) ? (
                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Prescription:</span>
                                
                                {clinicalMeds.length > 0 && (
                                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2.5 text-xs">
                                    <span className="text-[9px] font-black text-amber-800 uppercase block mb-1">Clinical Compounded ('C')</span>
                                    {clinicalMeds.map((m, idx) => (
                                      <div key={idx} className="flex justify-between font-bold text-slate-700 border-b border-amber-100/40 py-1 last:border-b-0">
                                        <span>• {m.ItemName}</span>
                                        <span className="font-mono text-slate-500">[{m.Dosage}]</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {patentMeds.length > 0 && (
                                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2.5 text-xs">
                                    <span className="text-[9px] font-black text-emerald-800 uppercase block mb-1">Patent Pre-packaged ('P')</span>
                                    {patentMeds.map((m, idx) => (
                                      <div key={idx} className="flex justify-between font-bold text-slate-700 border-b border-emerald-100/40 py-1 last:border-b-0">
                                        <span>• {m.ItemName}</span>
                                        <span className="font-mono text-slate-500">[{m.Dosage}]</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  handleRepeatPrescription(vis.VisitID);
                                  setHistoryModalOpen(false);
                                }}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xxs rounded-lg flex items-center transition cursor-pointer shadow-md shadow-blue-500/15"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse mr-1.5" />
                                Repeat Medicines
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Close Timeline
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Patient Registration Modal (Registration Form) */}
      {registrationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col animate-fadeIn text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">New Patient Registration Form</h3>
                  <p className="text-xxs text-slate-500 font-semibold">Create a new medical record registry card inside EMR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleRegisterPatientEMR} className="flex flex-col">
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {regErrorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xxs rounded-lg font-bold border border-red-100">
                    {regErrorMsg}
                  </div>
                )}
                {regSuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xxs rounded-lg font-bold border border-emerald-100 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />
                    {regSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zubair Ahmad Qureshi"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                    />
                  </div>

                  {/* Father / Husband Name */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Father / Husband Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Ishaq"
                      value={regFatherHusband}
                      onChange={(e) => setRegFatherHusband(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="125"
                      value={regAge}
                      onChange={(e) => setRegAge(parseInt(e.target.value) || 0)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-mono"
                    />
                  </div>

                  {/* Gender / Sex */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Gender / Sex</label>
                    <select
                      value={regSex}
                      onChange={(e) => setRegSex(e.target.value as any)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Marital Status</label>
                    <select
                      value={regMaritalStatus}
                      onChange={(e) => setRegMaritalStatus(e.target.value as any)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>

                  {/* Occupation */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Occupation</label>
                    <input
                      type="text"
                      placeholder="e.g. SBP Employee, Student"
                      value={regOccupation}
                      onChange={(e) => setRegOccupation(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                    />
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0300-1234567"
                      value={regMobilePhone}
                      onChange={(e) => setRegMobilePhone(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 font-mono"
                    />
                    <span className="text-[9px] text-slate-400 font-medium block">Format: 03xx-xxxxxxx</span>
                  </div>

                  {/* Email Address */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@domain.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                    />
                  </div>

                  {/* Residential Address */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Residential Address</label>
                    <input
                      type="text"
                      placeholder="House No, Street, Town Name"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800 uppercase"
                    />
                  </div>

                  {/* Resident Location */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">City ID (Punjab Province)</label>
                    <select
                      value={regCityId}
                      onChange={(e) => setRegCityId(parseInt(e.target.value) || 1)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-800"
                    >
                      {cities && cities.map((c) => (
                        <option key={c.CityID} value={c.CityID}>{c.CityName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-black text-slate-600 uppercase tracking-wider">Country</label>
                    <input
                      type="text"
                      readOnly
                      value="Pakistan"
                      className="w-full text-xs border border-slate-200 bg-slate-50 text-slate-400 font-semibold rounded-lg px-3 py-2 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setRegistrationModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center shadow-md shadow-emerald-600/10"
                >
                  <Check className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Register Intake File</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Repeat Medicine Expiry Date Picker Modal */}
      {repeatDatePickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-fadeIn text-left">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Repeat Prescription & Medicine Editor</h3>
                  <p className="text-xxs text-slate-500 font-semibold">Verify, edit, add, or remove patent & clinical compounding medicines to repeat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRepeatDatePickerOpen(false);
                  setPendingRepeatMeds([]);
                  setRepeatMedSearch('');
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-200/50 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmRepeat} className="flex flex-col p-5 space-y-4 overflow-y-auto">
              
              {/* Medicine Add Search Bar */}
              <div className="space-y-1.5 relative">
                <label className="block text-xxs font-black text-indigo-900 uppercase tracking-wider">
                  🔍 Search & Add Medicine to Repeating List (Clinical or Patent)
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type to search and add both clinical compounding & patent medicines from inventory..."
                    value={repeatMedSearch}
                    onChange={(e) => {
                      setRepeatMedSearch(e.target.value);
                      setShowRepeatMedResults(true);
                    }}
                    onFocus={() => setShowRepeatMedResults(true)}
                    onBlur={() => setTimeout(() => setShowRepeatMedResults(false), 250)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
                  />
                </div>

                {showRepeatMedResults && repeatMedSearch.trim().length > 0 && (
                  <div className="absolute z-[11000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-left">
                    {(() => {
                      const filtered = items.filter(itm => 
                        itm.ItemName.toLowerCase().includes(repeatMedSearch.toLowerCase()) ||
                        itm.ItemID.toLowerCase().includes(repeatMedSearch.toLowerCase())
                      );

                      return (
                        <>
                          {filtered.map((itm, idx) => {
                            const isC = isClinicalItem(itm.ItemID);
                            return (
                              <div
                                key={`${itm.ItemID}-${idx}`}
                                onMouseDown={() => {
                                  const exists = pendingRepeatMeds.some(m => m.ItemID === itm.ItemID);
                                  if (exists) {
                                    alert(`${itm.ItemName} is already added in the repeating list.`);
                                  } else {
                                    setPendingRepeatMeds(prev => [
                                      ...prev,
                                      {
                                        ItemID: itm.ItemID,
                                        MedicineDetail: itm.ItemName,
                                        Dosage: '1-0-1',
                                        MedicineType: isC ? 'C' : 'P',
                                        Price: itm.Price || 0,
                                        Qty: isC ? 30 : undefined
                                      }
                                    ]);
                                  }
                                  setRepeatMedSearch('');
                                  setShowRepeatMedResults(false);
                                }}
                                className="p-2.5 text-xs hover:bg-slate-50 cursor-pointer flex justify-between items-center text-left"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{itm.ItemName}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({itm.ItemID})</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                    isC
                                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                      : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                  }`}>
                                    {isC ? 'Clinical' : 'Patent'}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-slate-700 font-mono">
                                    PKR Rs. {itm.Price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          <div
                            onMouseDown={() => {
                              setPendingRepeatMeds(prev => [
                                ...prev,
                                {
                                  ItemID: 'CUSTOM',
                                  MedicineDetail: repeatMedSearch.trim(),
                                  Dosage: '1 DAILY',
                                  MedicineType: 'P',
                                  Price: 0,
                                  Qty: undefined
                                }
                              ]);
                              setRepeatMedSearch('');
                              setShowRepeatMedResults(false);
                            }}
                            className="p-2.5 text-xs hover:bg-indigo-50 text-indigo-700 cursor-pointer flex items-center justify-between font-bold"
                          >
                            <span>Add custom medicine: "{repeatMedSearch.trim()}"</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">Custom (P)</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Medicines List Editor */}
              <div className="space-y-2">
                <span className="block text-xxs font-black text-indigo-900 uppercase tracking-wider">
                  💊 Review, Edit or Change Repeating Medicines
                </span>

                {pendingRepeatMeds.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic bg-slate-50">
                    No medicines in the repeating draft. Use the search bar above to search and add patent or clinical medicines.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                    {pendingRepeatMeds.map((m, idx) => {
                      const matchedItem = items.find(i => i.ItemID === m.ItemID);
                      const inventoryName = matchedItem ? matchedItem.ItemName : '';
                      const itemPrice = matchedItem ? matchedItem.Price : (m.Price || 0);

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          {/* Medicine Name Info & Detail Edit */}
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="font-extrabold text-slate-900 uppercase">
                                {inventoryName || m.MedicineDetail}
                              </span>
                              {m.ItemID === 'CUSTOM' && (
                                <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded font-extrabold font-mono leading-none">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              required
                              value={m.MedicineDetail}
                              placeholder="Specifications, e.g. formulas or notes"
                              onChange={(e) => {
                                const val = e.target.value;
                                setPendingRepeatMeds(prev => prev.map((item, i) => i === idx ? { ...item, MedicineDetail: val } : item));
                              }}
                              className="w-full text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 focus:bg-white"
                            />
                          </div>

                          {/* Controls Row */}
                          <div className="flex items-center flex-wrap gap-3">
                            
                            {/* Dosage Input */}
                            <div className="w-[220px]">
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Dosage Formula (Large)</label>
                              <input
                                type="text"
                                required
                                value={m.Dosage || ''}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setPendingRepeatMeds(prev => prev.map((item, i) => i === idx ? { ...item, Dosage: val } : item));
                                }}
                                className="w-full text-sm font-extrabold border border-slate-300 bg-slate-50 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-center text-indigo-900 shadow-xs"
                                placeholder="1-0-1 (MORNING-NOON-NIGHT)"
                              />
                            </div>

                            {/* Qty field */}
                            <div className="w-[100px]">
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Quantity</label>
                              {m.MedicineType === 'C' ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={m.Qty || ''}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 0);
                                      setPendingRepeatMeds(prev => prev.map((item, i) => i === idx ? { ...item, Qty: val } : item));
                                    }}
                                    className="w-full text-xs font-black border border-slate-200 bg-slate-50 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono text-center text-indigo-900"
                                  />
                                  <span className="text-[9px] text-slate-500 font-extrabold font-mono">Tabs</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 block py-1.5 italic font-semibold">N/A</span>
                              )}
                            </div>

                            {/* Remove button */}
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingRepeatMeds(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Remove medicine"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expiry Date (Clinical Expiry - conditionally displayed if any clinical medicine exists) */}
              {pendingRepeatMeds.some(m => m.MedicineType === 'C') && (
                <div className="space-y-1 bg-indigo-50 border border-indigo-150 p-3.5 rounded-xl animate-fadeIn">
                  <label className="block text-xxs font-black text-indigo-900 uppercase tracking-wider">
                    🧪 Clinical Compounding Expiry Date *
                  </label>
                  <span className="text-[10px] text-indigo-500 font-semibold block mb-1.5">
                    Select the expiry date applying to clinical compounding in this visit (or select week-wise below)
                  </span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="date"
                      required
                      value={repeatSelectedExpiryDate}
                      onChange={(e) => setRepeatSelectedExpiryDate(e.target.value)}
                      className="w-full sm:w-1/3 text-xs font-semibold border border-indigo-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-indigo-850 font-mono"
                    />
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block mr-1 sm:w-full">
                        Quick Select Week Preset:
                      </span>
                      {[
                        { label: '1 Week', weeks: 1 },
                        { label: 'Two Week', weeks: 2 },
                        { label: 'Three Week', weeks: 3 },
                        { label: 'Four Week', weeks: 4 },
                      ].map((preset) => {
                        const target = new Date();
                        target.setDate(target.getDate() + (preset.weeks * 7));
                        const targetStr = target.toISOString().split('T')[0];
                        const isActive = repeatSelectedExpiryDate === targetStr;
                        return (
                          <button
                            key={preset.weeks}
                            type="button"
                            onClick={() => setRepeatSelectedExpiryDate(targetStr)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100/50'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setRepeatDatePickerOpen(false);
                    setPendingRepeatMeds([]);
                    setRepeatMedSearch('');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pendingRepeatMeds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center shadow-md shadow-indigo-600/10"
                >
                  <Check className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Confirm & Repeat ({pendingRepeatMeds.length})</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}
