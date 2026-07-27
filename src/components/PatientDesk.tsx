/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  Calendar,
  UserCheck,
  Ban,
  CreditCard,
  Search,
  CheckCircle2,
  Users,
  Volume2,
  Stethoscope,
  History,
  Pill,
  Copy,
  Printer,
  FileText,
  Plus,
  Edit3,
  Ticket,
  AlertCircle,
  X,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Tag,
  Pencil,
  FlaskConical,
  LayoutGrid,
  Table
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  City,
  UserRight,
  SmsSettings,
  NhcPatientHistory,
  ClinicSettings,
  Visit,
  VisitMedicine,
  Item,
  User,
  LabTest
} from '../types';

interface PatientDeskProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onUpdatePatient?: (p: Patient) => void;
  appointments: Appointment[];
  onAddAppointment: (app: Appointment) => void;
  onUpdateAppointment?: (app: Appointment) => void;
  onDeleteAppointment?: (appId: string) => void;
  onUpdateAppointmentStatus: (appId: string, status: 1 | 2 | 3 | 4) => void;
  tokens: Token[];
  onAddToken: (tok: Token) => void;
  onUpdateTokenStatus: (tokenNo: number, shift: 1 | 2, status: 1 | 2 | 3) => void;
  cities: City[];
  userRights: UserRight[];
  smsSettings?: SmsSettings;
  nhcPatients?: NhcPatientHistory[];
  clinicSettings?: ClinicSettings;
  visits?: Visit[];
  visitMedicines?: VisitMedicine[];
  onAddVisit?: (v: Visit, medicines: VisitMedicine[], testIds: string[]) => void;
  items?: Item[];
  currentUser?: User;
  labTests?: LabTest[];
}

export default function PatientDesk({
  patients,
  onAddPatient,
  onUpdatePatient,
  appointments,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdateAppointmentStatus,
  tokens,
  onAddToken,
  onUpdateTokenStatus,
  cities,
  userRights,
  smsSettings,
  nhcPatients = [],
  clinicSettings,
  visits = [],
  visitMedicines = [],
  onAddVisit,
  items = [],
  currentUser,
  labTests = []
}: PatientDeskProps) {
  // Access Control Permissions for Patient Intake & Queue Desk
  const perms = currentUser?.Permissions || {};
  const isAdministrator = currentUser?.Role === 'Administrator';

  const canAccessQueue = isAdministrator || perms.canAccessWaitingQueue !== false;
  const canAccessRegister = isAdministrator || perms.canAccessPatientRegistration !== false;
  const canAccessTokenIssue = isAdministrator || perms.canAccessTokenIssue !== false;
  const canAccessPatientVisit = isAdministrator || perms.canAccessPatientVisitDesk !== false;
  const canAccessAppointments = isAdministrator || perms.canAccessAppointmentsDesk !== false;
  const canAccessLargeScreen = isAdministrator || perms.canAccessLargeScreenDisplay !== false;

  const currentRight = userRights.find((r) => r.MenuID === 'patients');
  const rawCanAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  const canAddPatient = isAdministrator || (perms.canAddPatient !== false && rawCanAdd);
  const canEditPatient = isAdministrator || perms.canEditPatient !== false;
  const canIssueToken = isAdministrator || perms.canIssueToken !== false;
  const canBookAppointment = isAdministrator || perms.canBookAppointment !== false;
  const canCancelAppointment = isAdministrator || perms.canCancelAppointment !== false;
  const canCallServeToken = isAdministrator || perms.canCallServeToken !== false;

  // Sub-tabs state initialized to queue
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'token_issue' | 'book' | 'queue' | 'patient_visit' | 'status'>('queue');
  const [fullscreenShift, setFullscreenShift] = useState<'both' | 'morning' | 'evening'>('both');
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);

  // Auto-switch sub-tab if active one is restricted
  useEffect(() => {
    if (activeSubTab === 'queue' && !canAccessQueue) {
      if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'register' && !canAccessRegister) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'token_issue' && !canAccessTokenIssue) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'patient_visit' && !canAccessPatientVisit) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessAppointments) setActiveSubTab('book');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'book' && !canAccessAppointments) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessLargeScreen) setActiveSubTab('status');
    } else if (activeSubTab === 'status' && !canAccessLargeScreen) {
      if (canAccessQueue) setActiveSubTab('queue');
      else if (canAccessRegister) setActiveSubTab('register');
      else if (canAccessTokenIssue) setActiveSubTab('token_issue');
      else if (canAccessPatientVisit) setActiveSubTab('patient_visit');
      else if (canAccessAppointments) setActiveSubTab('book');
    }
  }, [activeSubTab, canAccessQueue, canAccessRegister, canAccessTokenIssue, canAccessPatientVisit, canAccessAppointments, canAccessLargeScreen]);

  // Backward compatible alias
  const canAdd = canAddPatient;

  // Search filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for Patient Intake
  const [patientName, setPatientName] = useState('');
  const [fatherHusband, setFatherHusband] = useState('');
  const [ageYears, setAgeYears] = useState<number>(30);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Single');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number>(1); // Default Lahore
  const [mobilePhone, setMobilePhone] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for Appointments
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appDate, setAppDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [futureBookingModal, setFutureBookingModal] = useState<{
    isOpen: boolean;
    patientName: string;
    patientId: string;
    phoneMobile?: string;
    date: string;
    shift: number;
  } | null>(null);
  const [smsSentToast, setSmsSentToast] = useState<{ recipient: string; message: string; provider: string } | null>(null);
  const [shift, setShift] = useState<1 | 2>(1); // 1 = Morning, 2 = Evening
  const [remarks, setRemarks] = useState('');
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');

  // Patient Visit Sub-Tab States
  const [pvPatientSearch, setPvPatientSearch] = useState('');
  const [pvSelectedPatientId, setPvSelectedPatientId] = useState('');
  const [pvVisitDate, setPvVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pvSymptomsDiagnosis, setPvSymptomsDiagnosis] = useState('');

  // Structured Excel Sheet Grid items for Clinical & Patent Medicines
  const [pvClinicalItems, setPvClinicalItems] = useState<Array<{ id: string; medicineName: string; dosage: string }>>([
    { id: '1', medicineName: '', dosage: '' }
  ]);
  const [pvPatientItems, setPvPatientItems] = useState<Array<{ id: string; medicineName: string; dosage: string }>>([
    { id: '1', medicineName: '', dosage: '' }
  ]);

  const addClinicalItem = () => {
    setPvClinicalItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), medicineName: '', dosage: '' }
    ]);
  };

  const removeClinicalItem = (id: string) => {
    setPvClinicalItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateClinicalItem = (id: string, field: 'medicineName' | 'dosage', value: string) => {
    setPvClinicalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addPatientItem = () => {
    setPvPatientItems((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), medicineName: '', dosage: '' }
    ]);
  };

  const removePatientItem = (id: string) => {
    setPvPatientItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updatePatientItem = (id: string, field: 'medicineName' | 'dosage', value: string) => {
    setPvPatientItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const [pvClinicalMedicineExpireDate, setPvClinicalMedicineExpireDate] = useState('');

  const setExpireDateByWeeks = (weeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setPvClinicalMedicineExpireDate(`${year}-${month}-${day}`);
  };

  const getWeeksLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const exp = new Date(dateStr);
    const now = new Date();
    exp.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Expired / Today';
    const weeks = Math.round(diffDays / 7);
    if (weeks === 1) return '1 Week';
    if (weeks > 1) return `${weeks} Weeks`;
    return `${diffDays} Days`;
  };

  const [pvMedicalReportResult, setPvMedicalReportResult] = useState('');
  const [pvRemarks, setPvRemarks] = useState('');
  const [pvLabTestAdvice, setPvLabTestAdvice] = useState('');
  const [pvLabTestSearch, setPvLabTestSearch] = useState('');
  const [pvLabTestDropdownOpen, setPvLabTestDropdownOpen] = useState(false);

  const filteredCatalogLabTests = useMemo(() => {
    if (!labTests || labTests.length === 0) return [];
    const term = pvLabTestSearch.trim().toLowerCase();
    if (!term) return labTests.slice(0, 12);
    return labTests.filter(t => 
      t.TestName?.toLowerCase().includes(term) || 
      t.TID?.toLowerCase().includes(term)
    );
  }, [labTests, pvLabTestSearch]);

  const handleSelectLabTestAdvice = (test: LabTest) => {
    setPvLabTestAdvice(prev => {
      const current = prev.trim();
      if (!current || current === 'None' || current === 'N/A') {
        return test.TestName;
      }
      const existing = current.split(',').map(s => s.trim().toLowerCase());
      if (existing.includes(test.TestName.toLowerCase())) {
        return current;
      }
      return `${current}, ${test.TestName}`;
    });
    setPvLabTestSearch('');
    setPvLabTestDropdownOpen(false);
  };

  const handleRemoveLabTestAdviceItem = (testNameToRemove: string) => {
    setPvLabTestAdvice(prev => {
      const items = prev.split(',').map(s => s.trim()).filter(Boolean);
      const updated = items.filter(s => s.toLowerCase() !== testNameToRemove.toLowerCase());
      return updated.join(', ');
    });
  };

  // Derived strings for backwards compatibility & unified saving / printing
  const pvClinicalMedicine = pvClinicalItems.map((i) => i.medicineName).filter(Boolean).join('\n');
  const pvClinicalDosage = pvClinicalItems.map((i) => i.dosage).filter(Boolean).join('\n');
  const pvPatientMedicine = pvPatientItems.map((i) => i.medicineName).filter(Boolean).join('\n');
  const pvPatientDosage = pvPatientItems.map((i) => i.dosage).filter(Boolean).join('\n');

  const clinicalMedicineDosage = pvClinicalItems
    .filter((item) => item.medicineName.trim() || item.dosage.trim())
    .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
    .join('\n');

  const patientMedicineDosage = pvPatientItems
    .filter((item) => item.medicineName.trim() || item.dosage.trim())
    .map((item) => (item.dosage.trim() ? `${item.medicineName.trim()} - ${item.dosage.trim()}` : item.medicineName.trim()))
    .join('\n');
  const [pvClinicalMedicinePkr, setPvClinicalMedicinePkr] = useState<number | string>('');
  const [pvFilePkr, setPvFilePkr] = useState<number | string>('');
  const [pvCardPkr, setPvCardPkr] = useState<number | string>('');
  const [pvSaveSuccess, setPvSaveSuccess] = useState('');
  const [pvSaveError, setPvSaveError] = useState('');
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [pvNhcHistory, setPvNhcHistory] = useState<NhcPatientHistory[]>([]);
  const [isFetchingPvHistory, setIsFetchingPvHistory] = useState(false);
  const [pvPrescriptionModalOpen, setPvPrescriptionModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS'>('A5_VISIT_SLIP');
  const [pvSelectedHistoryDate, setPvSelectedHistoryDate] = useState<string>('ALL');
  const [isSearchLoadingModal, setIsSearchLoadingModal] = useState<boolean>(false);
  const [historyAlertModalOpen, setHistoryAlertModalOpen] = useState<boolean>(false);
  const [hidePreviousHistory, setHidePreviousHistory] = useState<boolean>(false);

  // States for Token Issue for NEW Patient
  const [tokenIssueMode, setTokenIssueMode] = useState<'existing' | 'new_patient'>('existing');
  const [newPatName, setNewPatName] = useState('');
  const [newPatPhone, setNewPatPhone] = useState('');
  const [newPatFee, setNewPatFee] = useState<number | string>('');
  const [existingFee, setExistingFee] = useState<number | string>('');
  const [newPatRemarks, setNewPatRemarks] = useState('');

  // States for Appointments Grid View
  const [appDeskMode, setAppDeskMode] = useState<'schedule' | 'grid_view'>('grid_view');
  const [appGridDateFilter, setAppGridDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'past'>('all');
  const [appGridShiftFilter, setAppGridShiftFilter] = useState<'all' | '1' | '2'>('all');
  const [appGridSearch, setAppGridSearch] = useState('');

  // States for Excel Sheet Grid View & Modals
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Form states for Add / Edit Appointment
  const [formPatientId, setFormPatientId] = useState('');
  const [formPatientName, setFormPatientName] = useState('');
  const [formPhoneMobile, setFormPhoneMobile] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [formAppDate, setFormAppDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState<1 | 2>(1);
  const [formFeeCharged, setFormFeeCharged] = useState<number | string>(1500);
  const [formRemarks, setFormRemarks] = useState('');

  const handleOpenAddModal = () => {
    setFormPatientId('');
    setFormPatientName('');
    setFormPhoneMobile('');
    setPatientSearchQuery('');
    setFormAppDate(new Date().toISOString().split('T')[0]);
    setFormShift(1);
    setFormFeeCharged(1500);
    setFormRemarks('');
    setIsAddAppModalOpen(true);
  };

  const handleOpenEditModal = (app: Appointment) => {
    const pat = patients.find((p) => p.PatientID === app.PatientID);
    setEditingApp(app);
    setFormPatientId(app.PatientID);
    setFormPatientName(pat?.PatientName || app.PatientID);
    setFormPhoneMobile(pat?.PhoneMobile || '');
    setFormAppDate(app.AppointmentDate || new Date().toISOString().split('T')[0]);
    setFormShift(app.Shift || 1);
    setFormFeeCharged(app.FeeCharged || 1500);
    setFormRemarks(app.Remarks || '');
  };

  const handleDeleteAppointmentAction = (appId: string) => {
    const app = appointments.find((a) => a.AppointmentID === appId);
    const pat = patients.find((p) => p.PatientID === app?.PatientID);
    if (window.confirm(`Are you sure you want to delete the appointment for ${pat?.PatientName || app?.PatientID || appId}?`)) {
      if (onDeleteAppointment) {
        onDeleteAppointment(appId);
      }
      if (selectedAppId === appId) {
        setSelectedAppId(null);
      }
      setAppSuccess('Appointment record deleted successfully.');
      setTimeout(() => setAppSuccess(''), 3000);
    }
  };

  const handleSaveAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    let patId = formPatientId;

    if (!patId && formPatientName.trim()) {
      const nextPatNum = patients.length + 1;
      patId = `P-${new Date().getFullYear()}-${String(nextPatNum).padStart(4, '0')}`;
      const newPat: Patient = {
        PatientID: patId,
        PatientName: formPatientName.trim(),
        Father_husband: 'N/A',
        AgeYears: 0,
        Sex: 'Male',
        MaritalStatus: 'Single',
        Occupation: 'N/A',
        Address: 'N/A',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: formPhoneMobile.trim() || '03000000000',
        RegistrationDate: new Date().toISOString()
      };
      if (onAddPatient) {
        onAddPatient(newPat);
      }
    }

    if (!patId) {
      setAppError('Please select or enter a Patient Name.');
      return;
    }

    let nextAppNum = appointments.length + 1;
    let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    while (appointments.some((a) => a.AppointmentID === newAppId)) {
      nextAppNum++;
      newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
    }

    const newApp: Appointment = {
      AppointmentID: newAppId,
      PatientID: patId,
      AppointmentDate: formAppDate || new Date().toISOString().split('T')[0],
      Shift: formShift,
      FeeCharged: Number(formFeeCharged) || 1500,
      Remarks: formRemarks.trim() || 'Booked Appointment',
      Status: 1
    };

    onAddAppointment(newApp);
    setIsAddAppModalOpen(false);
    setSelectedAppId(newApp.AppointmentID);
    setAppError('');
    setAppSuccess('New appointment booked successfully!');
    setTimeout(() => setAppSuccess(''), 3000);
  };

  const handleSaveEditAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    if (formPatientId) {
      const pat = patients.find((p) => p.PatientID === formPatientId);
      if (pat && onUpdatePatient && formPhoneMobile && pat.PhoneMobile !== formPhoneMobile) {
        onUpdatePatient({
          ...pat,
          PhoneMobile: formPhoneMobile.trim()
        });
      }
    }

    const updatedApp: Appointment = {
      ...editingApp,
      AppointmentDate: formAppDate,
      Shift: formShift,
      FeeCharged: Number(formFeeCharged) || 1500,
      Remarks: formRemarks.trim()
    };

    if (onUpdateAppointment) {
      onUpdateAppointment(updatedApp);
    }
    setEditingApp(null);
    setAppError('');
    setAppSuccess('Appointment updated successfully!');
    setTimeout(() => setAppSuccess(''), 3000);
  };

  const handleIssueTokenForNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim()) {
      setAppError('Patient Name is required for registering new patient.');
      return;
    }

    const nextPatNum = patients.length + 1;
    const newPatId = `P-${new Date().getFullYear()}-${String(nextPatNum).padStart(4, '0')}`;
    
    const newPatient: Patient = {
      PatientID: newPatId,
      PatientName: newPatName.trim(),
      Father_husband: 'N/A (Quick Register)',
      AgeYears: 0,
      Sex: 'Male',
      MaritalStatus: 'Single',
      Occupation: 'N/A',
      Address: 'Address Pending (Quick Registration)',
      CityID: 1, // Lahore
      Country: 'Pakistan',
      PhoneMobile: newPatPhone.trim() || '03000000000',
      RegistrationDate: new Date().toISOString()
    };

    if (onAddPatient) {
      onAddPatient(newPatient);
    }

    setSelectedPatientId(newPatId);
    setNewPatName('');
    setNewPatPhone('');
    setNewPatFee('');
    setNewPatRemarks('');
    setAppError('');
    setAppSuccess(`New Patient ${newPatient.PatientName} (${newPatId}) registered successfully!`);
    setTimeout(() => setAppSuccess(''), 5000);
  };

  const handlePrintPreviousVisitPrescription = (group: any) => {
    if (!group) return;

    const cItems = (group.clinicalItems || [])
      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
      .map((i: any, idx: number) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

    const pItems = (group.patentItems || [])
      .filter((i: any) => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
      .map((i: any, idx: number) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

    const cExp = (group.clinicalItems || []).map((i: any) => i.expireDate).find(Boolean) || '';

    if (cItems.length > 0) setPvClinicalItems(cItems);
    else setPvClinicalItems([{ id: '1', medicineName: '', dosage: '' }]);

    if (pItems.length > 0) setPvPatientItems(pItems);
    else setPvPatientItems([{ id: '1', medicineName: '', dosage: '' }]);

    if (cExp) setPvClinicalMedicineExpireDate(cExp);

    if (group.symptoms) {
      setPvSymptomsDiagnosis(group.symptoms);
    }
    if (group.medicalReportResult && group.medicalReportResult !== 'N/A') {
      setPvMedicalReportResult(group.medicalReportResult);
    }
    if (group.labTestAdvice && group.labTestAdvice !== 'N/A') {
      setPvLabTestAdvice(group.labTestAdvice);
    }

    if (group.date) {
      setPvVisitDate(group.date);
    }

    setPvPrescriptionModalOpen(true);
    setPvSaveSuccess(`Loaded prescription from ${group.date} for re-printing.`);
    setTimeout(() => setPvSaveSuccess(''), 4000);
  };

  const handleOpenPrintModal = (docType: 'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS') => {
    if (!pvSelectedPatientId) {
      setPvSaveError('Please select a patient first to print.');
      return;
    }
    setPrintDocType(docType);
    setPvPrescriptionModalOpen(true);
  };

  // Thermal print modal state
  const [thermalPrintOpen, setThermalPrintOpen] = useState(false);
  const [thermalPrintData, setThermalPrintData] = useState<{
    tokenNo: number;
    patientName: string;
    patientId: string;
    shiftName: string;
    date: string;
    fee: number;
    feeNote?: string;
    appId: string;
    patientType: 'New Patient' | 'Old Patient';
    remarks?: string;
  } | null>(null);

  // Auto-trigger direct thermal print on token issue if direct printing is enabled
  const autoPrintFiredRef = useRef(false);
  useEffect(() => {
    if (thermalPrintOpen && thermalPrintData) {
      if (clinicSettings?.ThermalDirectPrint !== false) {
        if (!autoPrintFiredRef.current) {
          autoPrintFiredRef.current = true;
          handleCleanThermalTokenPrint();
          const closeTimer = setTimeout(() => {
            setThermalPrintOpen(false);
          }, 500);
          return () => clearTimeout(closeTimer);
        }
      }
    } else {
      autoPrintFiredRef.current = false;
    }
  }, [thermalPrintOpen, thermalPrintData, clinicSettings?.ThermalDirectPrint]);

  // Helper function to check if patient is New Patient or Old Patient
  const getPatientType = (patientId: string): 'New Patient' | 'Old Patient' => {
    if (!patientId) return 'New Patient';
    const pat = patients.find((p) => p.PatientID === patientId);
    if (!pat) return 'New Patient';

    const hasVisits = (visits || []).some((v) => v.PatientID === patientId);
    const hasNhc = (nhcPatients || []).some((n) => n.PatientID === patientId);
    const realToday = new Date().toISOString().split('T')[0];
    const hasPriorApp = (appointments || []).some(
      (a) => a.PatientID === patientId && a.AppointmentDate < realToday
    );

    return hasVisits || hasNhc || hasPriorApp ? 'Old Patient' : 'New Patient';
  };

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

  // Filtered patients for search
  const filteredPatients = patients.filter((p) => matchPatientRecord(p, searchTerm));

  const [nhcArchiveList, setNhcArchiveList] = useState<NhcPatientHistory[]>([]);
  const [isSearchingArchive, setIsSearchingArchive] = useState(false);

  const fetchNhcArchive = (queryVal: string) => {
    const trimmed = queryVal.trim();
    if (!trimmed) {
      setNhcArchiveList([]);
      return;
    }
    setIsSearchingArchive(true);
    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(trimmed)}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setNhcArchiveList(data);
        }
      })
      .catch(e => console.warn('Could not load filtered NHC patient history in PatientDesk:', e.message))
      .finally(() => {
        setIsSearchingArchive(false);
      });
  };

  // Filtered NHC archive patients
  const filteredNhcPatients = (() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    const uniqueMap = new Map<string, NhcPatientHistory>();
    nhcArchiveList.forEach((p) => {
      const matches = matchPatientRecord(p, term);
      const isAlreadyActive = patients.some(ap => ap.PatientID === p.PatientID);
      if (matches && !isAlreadyActive) {
        if (!uniqueMap.has(p.PatientID)) {
          uniqueMap.set(p.PatientID, p);
        }
      }
    });
    return Array.from(uniqueMap.values());
  })();

  // Combined dropdown list for Patient Visit including ONLY patients who have an issued token
  const pvPatientDropdownOptions = (() => {
    const list: { PatientID: string; PatientName: string; PhoneMobile?: string; tokenNo?: number; isNhc?: boolean }[] = [];
    const seenIds = new Set<string>();

    // Map patient ID to their token number
    const tokenMap = new Map<string, number>();
    (tokens || []).forEach(t => {
      if (t.PatientID) {
        tokenMap.set(t.PatientID, t.TokenNo);
      }
    });

    // Only include patients who have an issued token OR are currently selected
    patients.forEach(p => {
      const tokenNo = tokenMap.get(p.PatientID);
      const isSelected = p.PatientID === pvSelectedPatientId;
      if (tokenNo !== undefined || isSelected) {
        seenIds.add(p.PatientID);
        list.push({
          PatientID: p.PatientID,
          PatientName: p.PatientName,
          PhoneMobile: p.PhoneMobile,
          tokenNo: tokenNo,
          isNhc: false
        });
      }
    });

    const allNhc = [...(nhcPatients || []), ...nhcArchiveList];
    allNhc.forEach(nhc => {
      if (nhc.PatientID && !seenIds.has(nhc.PatientID)) {
        const tokenNo = tokenMap.get(nhc.PatientID);
        const isSelected = nhc.PatientID === pvSelectedPatientId;
        if (tokenNo !== undefined || isSelected) {
          seenIds.add(nhc.PatientID);
          list.push({
            PatientID: nhc.PatientID,
            PatientName: nhc.PatientName || 'NHC Record',
            PhoneMobile: nhc.PhoneMobile || '',
            tokenNo: tokenNo,
            isNhc: true
          });
        }
      }
    });

    // Sort options by Token Number ascending
    list.sort((a, b) => (a.tokenNo || 99999) - (b.tokenNo || 99999));

    const term = pvPatientSearch.trim().toLowerCase();
    if (!term) return list;

    const cleanNum = term.replace(/\D/g, '');

    return list.filter(p => {
      if (matchPatientRecord(p, term)) return true;
      if (p.tokenNo && (String(p.tokenNo) === term || (cleanNum && String(p.tokenNo) === cleanNum))) return true;
      return false;
    });
  })();

  const handleExecutePatientSearch = () => {
    setIsSearchLoadingModal(true);
    const query = pvPatientSearch.trim().toLowerCase();
    const cleanNum = query.replace(/\D/g, '');
    
    if (!query && !pvSelectedPatientId) {
      setTimeout(() => setIsSearchLoadingModal(false), 300);
      return;
    }

    let targetPatId = '';

    // 1. Search by Issued Token Number in active tokens
    if (cleanNum && tokens && tokens.length > 0) {
      const tokenMatch = tokens.find(t => 
        String(t.TokenNo) === cleanNum || 
        `token-${t.TokenNo}` === query || 
        `token ${t.TokenNo}` === query || 
        `tk-${t.TokenNo}` === query ||
        `#${t.TokenNo}` === query
      );
      if (tokenMatch) {
        targetPatId = tokenMatch.PatientID;
      }
    }

    // 2. Search exact match in local patients (ID or Mobile)
    if (!targetPatId) {
      const localExact = patients.find(p => String(p.PatientID || '').toLowerCase() === query || String(p.PhoneMobile || '') === query || String(p.PatientID || '').toLowerCase() === `pat-${cleanNum}`);
      if (localExact) {
        targetPatId = localExact.PatientID;
      }
    }

    // 3. Search in dropdown options
    if (!targetPatId) {
      const optMatch = pvPatientDropdownOptions.find(p => 
        String(p.PatientID || '').toLowerCase() === query || 
        matchPatientRecord(p, query) ||
        (p.tokenNo && String(p.tokenNo) === cleanNum)
      );
      if (optMatch) {
        targetPatId = optMatch.PatientID;
      }
    }

    const bridgeUrl = window.location.origin;
    const targetQuery = targetPatId || query || pvSelectedPatientId;

    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(targetQuery)}&limit=50`)
      .then(res => res.ok ? res.json() : [])
      .then((nhcResults: NhcPatientHistory[]) => {
        if (Array.isArray(nhcResults) && nhcResults.length > 0) {
          setNhcArchiveList(prev => {
            const map = new Map<string, NhcPatientHistory>();
            prev.forEach(item => map.set(item.PatientID, item));
            nhcResults.forEach(item => map.set(item.PatientID, item));
            return Array.from(map.values());
          });
        }

        if (!targetPatId) {
          const nhcExact = (nhcResults || []).find(p => String(p.PatientID || '').toLowerCase() === query || String(p.PhoneMobile || '') === query)
            || (nhcPatients || []).find(p => String(p.PatientID || '').toLowerCase() === query || String(p.PhoneMobile || '') === query);
          if (nhcExact) {
            targetPatId = nhcExact.PatientID;
          } else {
            const localMatches = patients.filter(p => matchPatientRecord(p, query));
            if (localMatches.length > 0) {
              targetPatId = localMatches[0].PatientID;
            } else {
              const nhcMatches = (nhcResults || []).filter(p => matchPatientRecord(p, query));
              if (nhcMatches.length > 0) {
                targetPatId = nhcMatches[0].PatientID;
              }
            }
          }
        }

        if (targetPatId) {
          setPvSelectedPatientId(targetPatId);
          loadPvPatientHistory(targetPatId, false);
        } else if (query) {
          loadPvPatientHistory(query, false);
        }
      })
      .catch((e) => {
        console.warn('Search query error in NHC history workstation:', e);
        if (targetPatId) {
          setPvSelectedPatientId(targetPatId);
          loadPvPatientHistory(targetPatId, false);
        }
      })
      .finally(() => {
        setTimeout(() => {
          setIsSearchLoadingModal(false);
        }, 500);
      });
  };

  const loadPvPatientHistory = (patId: any, autoTriggerPopup = false) => {
    const cleanId = typeof patId === 'string' ? patId.trim() : String(patId || '').trim();
    if (!cleanId) {
      setPvNhcHistory([]);
      return;
    }
    setIsFetchingPvHistory(true);
    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(cleanId)}&limit=50`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPvNhcHistory(data);
        }
        if (autoTriggerPopup) {
          setHistoryAlertModalOpen(true);
        }
      })
      .catch((e) => {
        console.warn('Could not fetch patient NHC history in Patient Visit:', e.message);
        const lowerId = cleanId.toLowerCase();
        const matched = (nhcPatients || []).filter((p) => {
          if (!p || !p.PatientID) return false;
          const pid = String(p.PatientID);
          return pid === cleanId || pid.toLowerCase().includes(lowerId);
        });
        setPvNhcHistory(matched);
        if (autoTriggerPopup) {
          setHistoryAlertModalOpen(true);
        }
      })
      .finally(() => {
        setIsFetchingPvHistory(false);
      });
  };

  const selectedPvPatient: Patient | undefined = patients.find((p) => p.PatientID === pvSelectedPatientId) || (() => {
    if (!pvSelectedPatientId) return undefined;
    const nhcMatch = (nhcPatients || []).find((p) => p.PatientID === pvSelectedPatientId) 
      || nhcArchiveList.find((p) => p.PatientID === pvSelectedPatientId)
      || pvNhcHistory.find((p) => p.PatientID === pvSelectedPatientId);
    if (nhcMatch) {
      const synthPatient: Patient = {
        PatientID: nhcMatch.PatientID,
        PatientName: nhcMatch.PatientName || 'NHC Archive Patient',
        Father_husband: nhcMatch.Father_husband || '',
        AgeYears: nhcMatch.AgeYears || 0,
        Sex: (nhcMatch.Sex as any) || 'Male',
        MaritalStatus: 'Single',
        Occupation: '',
        Address: nhcMatch.Address || '',
        CityID: 1,
        Country: 'Pakistan',
        PhoneMobile: nhcMatch.PhoneMobile || '',
        RegistrationDate: nhcMatch.RegistrationDate || new Date().toISOString().split('T')[0]
      };
      return synthPatient;
    }
    return undefined;
  })();

  const parseCleanVisitDate = (raw: any): string => {
    if (!raw || raw === 'N/A' || String(raw).trim() === '') {
      return pvVisitDate || new Date().toISOString().split('T')[0];
    }
    const str = String(raw).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  const combinedPreviousHistory = (() => {
    if (!pvSelectedPatientId) return [];

    const historyItems: {
      date: string;
      source: string;
      symptoms: string;
      clinicalMedication: string;
      patientMedication: string;
      medicalReportResult?: string;
      labTestAdvice?: string;
    }[] = [];

    // 1. From local EMR visits
    (visits || [])
      .filter((v) => v.PatientID === pvSelectedPatientId)
      .forEach((v) => {
        const vMeds = (visitMedicines || []).filter((m) => m.VisitID === v.VisitID);
        const clinicalList = vMeds.filter((m) => m.MedicineType === 'C').map((m) => `${m.ItemID} - ${m.Dosage} (${m.MedicineDetail})`).join('\n');
        const patentList = vMeds.filter((m) => m.MedicineType === 'P').map((m) => `${m.ItemID} - ${m.Dosage} (${m.MedicineDetail})`).join('\n');

        let cText = clinicalList;
        let pText = patentList;
        if (v.VisitRemarks && v.VisitRemarks.includes('Clinical:')) {
          const parts = v.VisitRemarks.split('|');
          const cPart = parts.find((p) => p.includes('Clinical:'));
          const pPart = parts.find((p) => p.includes('Patent:'));
          if (cPart) cText = cPart.replace('Clinical:', '').trim();
          if (pPart) pText = pPart.replace('Patent:', '').trim();
        }

        historyItems.push({
          date: parseCleanVisitDate(v.VisitDate),
          source: 'Clinical EMR Visit',
          symptoms: v.SymptomsDiagnosis || 'N/A',
          clinicalMedication: cText || 'None prescribed',
          patientMedication: pText || 'None prescribed',
          medicalReportResult: v.MedicalReportResult && v.MedicalReportResult !== 'N/A' ? v.MedicalReportResult : 'N/A',
          labTestAdvice: v.LabTestAdvice && v.LabTestAdvice !== 'N/A' ? v.LabTestAdvice : 'N/A'
        });
      });

    // 2. From NHC Patient History archive
    pvNhcHistory.forEach((nhc) => {
      const cMed = nhc.MedicineType === 'C' ? `${nhc.PrescribedMedicines || nhc.MedicineDetail || ''} ${nhc.Dosage || ''}`.trim() : '';
      const pMed = nhc.MedicineType === 'P' ? `${nhc.PrescribedMedicines || nhc.MedicineDetail || ''} ${nhc.Dosage || ''}`.trim() : '';
      const generalMed = nhc.PrescribedMedicines || nhc.MedicineDetail || '';
      const mrRes = nhc.MedicalReportResult || (nhc as any).medicalReportResult || (nhc as any).MedicalReportResult || 'N/A';
      const labAdv = nhc.LabTestAdvice || nhc.LabTests || 'N/A';

      const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;

      historyItems.push({
        date: parseCleanVisitDate(rawNhcDate),
        source: 'NHC Archive',
        symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.MedicalCondition || 'N/A',
        clinicalMedication: cMed || (nhc.MedicineType === 'C' ? generalMed : 'None recorded'),
        patientMedication: pMed || (nhc.MedicineType !== 'C' ? generalMed : 'None recorded'),
        medicalReportResult: mrRes !== 'N/A' ? mrRes : 'N/A',
        labTestAdvice: labAdv !== 'N/A' ? labAdv : 'N/A'
      });
    });

    return historyItems;
  })();

  const patientVisitRecords = (() => {
    if (!pvSelectedPatientId) return [];

    const list: {
      id: string;
      date: string;
      symptoms: string;
      visitObj?: Visit;
      nhcObj?: NhcPatientHistory;
    }[] = [];

    const seenIds = new Set<string>();

    (visits || [])
      .filter((v) => v.PatientID === pvSelectedPatientId)
      .forEach((v) => {
        if (!seenIds.has(v.VisitID)) {
          seenIds.add(v.VisitID);
          list.push({
            id: v.VisitID,
            date: parseCleanVisitDate(v.VisitDate),
            symptoms: v.SymptomsDiagnosis || 'Routine Consultation',
            visitObj: v,
          });
        }
      });

    pvNhcHistory.forEach((nhc, idx) => {
      const vId = ('VisitID' in nhc && nhc.VisitID) ? nhc.VisitID : ('date' in nhc ? `NHC-${nhc.date}` : `NHC-${idx}`);
      if (!seenIds.has(vId)) {
        seenIds.add(vId);
        const rawNhcDate = nhc.VisitDate || nhc.RegistrationDate || nhc.Date || nhc.CreatedAt || nhc.date;
        list.push({
          id: vId,
          date: parseCleanVisitDate(rawNhcDate),
          symptoms: nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || nhc.symptoms || 'Routine Consultation',
          nhcObj: nhc,
        });
      }
    });

    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  })();

  const currentEditingVisitRecordIndex = editingVisitId && patientVisitRecords.length > 0
    ? patientVisitRecords.findIndex((r) => r.id === editingVisitId)
    : -1;

  const uniquePvVisitDates = Array.from(new Set(combinedPreviousHistory.map((item) => item.date)));

  const displayedPreviousHistory = combinedPreviousHistory.filter(
    (item) => !pvSelectedHistoryDate || pvSelectedHistoryDate === 'ALL' || item.date === pvSelectedHistoryDate
  );

  const { allClinicalMedText, allClinicalUsageText } = (() => {
    const items = displayedPreviousHistory.filter(
      (item) => item.clinicalMedication && item.clinicalMedication.trim() !== '' && item.clinicalMedication !== 'None prescribed' && item.clinicalMedication !== 'None recorded'
    );
    if (items.length === 0) {
      return { allClinicalMedText: 'No clinical medicines in history.', allClinicalUsageText: 'No clinical dosage in history.' };
    }
    const meds: string[] = [];
    const usages: string[] = [];
    items.forEach((item) => {
      const val = item.clinicalMedication || '';
      if (val.includes(' - ')) {
        const parts = val.split(' - ');
        meds.push(parts[0].trim());
        usages.push(parts.slice(1).join(' - ').trim());
      } else {
        meds.push(val.trim());
        usages.push('As directed');
      }
    });
    return {
      allClinicalMedText: meds.join('\n\n'),
      allClinicalUsageText: usages.join('\n\n')
    };
  })();

  const { allPatentMedText, allPatentUsageText } = (() => {
    const items = displayedPreviousHistory.filter(
      (item) => item.patientMedication && item.patientMedication.trim() !== '' && item.patientMedication !== 'None prescribed' && item.patientMedication !== 'None recorded'
    );
    if (items.length === 0) {
      return { allPatentMedText: 'No patent medicines in history.', allPatentUsageText: 'No patent dosage in history.' };
    }
    const meds: string[] = [];
    const usages: string[] = [];
    items.forEach((item) => {
      const val = item.patientMedication || '';
      if (val.includes(' - ')) {
        const parts = val.split(' - ');
        meds.push(parts[0].trim());
        usages.push(parts.slice(1).join(' - ').trim());
      } else {
        meds.push(val.trim());
        usages.push('As directed');
      }
    });
    return {
      allPatentMedText: meds.join('\n\n'),
      allPatentUsageText: usages.join('\n\n')
    };
  })();

  const allClinicalText = allClinicalMedText === 'No clinical medicines in history.'
    ? 'No clinical medicines in history.'
    : `${allClinicalMedText} - ${allClinicalUsageText}`;

  const allPatentText = allPatentMedText === 'No patent medicines in history.'
    ? 'No patent medicines in history.'
    : `${allPatentMedText} - ${allPatentUsageText}`;

  const allSymptomsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.symptoms).filter((s) => s && s !== 'N/A'))
  ).join(' | ');

  const allMedicalReportResultsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.medicalReportResult).filter((m) => m && m !== 'N/A'))
  ).join('\n\n');

  const allLabTestsText = Array.from(
    new Set(displayedPreviousHistory.map((item) => item.labTestAdvice).filter((l) => l && l !== 'N/A'))
  ).join(', ');

  const groupedRxByDate = (() => {
    if (!pvSelectedPatientId || displayedPreviousHistory.length === 0) return [];

    interface StructuredRxItem {
      medicineName: string;
      dosage: string;
      type: 'C' | 'P';
      expireDate?: string;
    }

    interface DateRxGroup {
      date: string;
      symptoms?: string;
      medicalReportResult?: string;
      labTestAdvice?: string;
      clinicalItems: StructuredRxItem[];
      patentItems: StructuredRxItem[];
      totalItems: number;
    }

    const groupsMap = new Map<string, DateRxGroup>();
    const filteredDates = Array.from(new Set(displayedPreviousHistory.map((item) => item.date)));

    filteredDates.forEach((dateStr) => {
      const clinicalItems: StructuredRxItem[] = [];
      const patentItems: StructuredRxItem[] = [];
      let dateSymptoms = '';
      let dateMedicalReportResult = '';
      let dateLabTestAdvice = '';

      // 1. From local EMR visits for this date
      const dateVisits = (visits || []).filter(
        (v) => v.PatientID === pvSelectedPatientId && (v.VisitDate ? v.VisitDate.split('T')[0] : 'N/A') === dateStr
      );

      dateVisits.forEach((v) => {
        if (v.SymptomsDiagnosis && v.SymptomsDiagnosis !== 'N/A') {
          dateSymptoms = v.SymptomsDiagnosis;
        }
        if (v.MedicalReportResult && v.MedicalReportResult !== 'N/A') {
          dateMedicalReportResult = v.MedicalReportResult;
        }
        if (v.LabTestAdvice && v.LabTestAdvice !== 'N/A') {
          dateLabTestAdvice = v.LabTestAdvice;
        }

        const vMeds = (visitMedicines || []).filter((m) => m.VisitID === v.VisitID);
        if (vMeds.length > 0) {
          vMeds.forEach((m) => {
            const medName = m.MedicineDetail || m.ItemID || 'Prescribed Medicine';
            const dosageStr = m.Dosage || 'As directed';
            if (m.MedicineType === 'C') {
              clinicalItems.push({
                medicineName: medName,
                dosage: dosageStr,
                type: 'C',
                expireDate: m.ExpireDate
              });
            } else {
              patentItems.push({
                medicineName: medName,
                dosage: dosageStr,
                type: 'P'
              });
            }
          });
        } else {
          let cText = '';
          let pText = '';
          if (v.VisitRemarks && v.VisitRemarks.includes('Clinical:')) {
            const parts = v.VisitRemarks.split('|');
            const cPart = parts.find((p) => p.includes('Clinical:'));
            const pPart = parts.find((p) => p.includes('Patent:'));
            if (cPart) cText = cPart.replace('Clinical:', '').trim();
            if (pPart) pText = pPart.replace('Patent:', '').trim();
          }
          if (!cText && 'clinicalMedication' in v && (v as any).clinicalMedication) cText = String((v as any).clinicalMedication);
          if (!pText && 'patientMedication' in v && (v as any).patientMedication) pText = String((v as any).patientMedication);

          if (cText && cText !== 'None prescribed' && cText !== 'None recorded') {
            const parts = cText.includes(' - ') ? cText.split(' - ') : [cText, 'As directed'];
            let exp = '';
            const expMatch = cText.match(/\(EXP:\s*([^)]+)\)/);
            if (expMatch) exp = expMatch[1].trim();

            clinicalItems.push({
              medicineName: parts[0].replace(/\(EXP:.*?\)/, '').trim(),
              dosage: parts.slice(1).join(' - ').trim() || 'As directed',
              type: 'C',
              expireDate: exp
            });
          }

          if (pText && pText !== 'None prescribed' && pText !== 'None recorded') {
            const lines = pText.split('\n').filter(Boolean);
            lines.forEach((line) => {
              const parts = line.includes(' - ') ? line.split(' - ') : [line, 'As directed'];
              patentItems.push({
                medicineName: parts[0].trim(),
                dosage: parts.slice(1).join(' - ').trim() || 'As directed',
                type: 'P'
              });
            });
          }
        }
      });

      // 2. From NHC archive for this date
      const dateNhc = pvNhcHistory.filter((nhc) => {
        const d = nhc.VisitDate ? nhc.VisitDate.split('T')[0] : (nhc.RegistrationDate ? nhc.RegistrationDate.split('T')[0] : (nhc.Date ? nhc.Date.split('T')[0] : (nhc.CreatedAt ? nhc.CreatedAt.split('T')[0] : 'N/A')));
        return d === dateStr;
      });

      dateNhc.forEach((nhc) => {
        if (!dateSymptoms && (nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms)) {
          dateSymptoms = nhc.SymptomsDiagnosis || nhc.Diagnosis || nhc.Symptoms || '';
        }

        const mr = nhc.MedicalReportResult || (nhc as any).medicalReportResult || (nhc as any).MedicalReportResult;
        if (!dateMedicalReportResult && mr && mr !== 'N/A') {
          dateMedicalReportResult = mr;
        }

        const la = nhc.LabTestAdvice || nhc.LabTests;
        if (!dateLabTestAdvice && la && la !== 'N/A') {
          dateLabTestAdvice = la;
        }

        const rawMed = nhc.MedicineDetail || nhc.PrescribedMedicines || '';
        let medName = rawMed;
        let dosage = nhc.Dosage || 'As directed';

        if (rawMed.includes(' - ')) {
          const parts = rawMed.split(' - ');
          medName = parts[0].trim();
          if (!nhc.Dosage) dosage = parts.slice(1).join(' - ').trim();
        }

        if (nhc.MedicineType === 'C') {
          clinicalItems.push({
            medicineName: medName || 'Clinical Compounded Medicine',
            dosage: dosage || 'As directed',
            type: 'C'
          });
        } else if (nhc.MedicineType === 'P') {
          patentItems.push({
            medicineName: medName || 'Patent Medicine',
            dosage: dosage || 'As directed',
            type: 'P'
          });
        } else if (rawMed) {
          patentItems.push({
            medicineName: medName || 'Prescribed Medicine',
            dosage: dosage || 'As directed',
            type: 'P'
          });
        }
      });

      // Filter duplicate items in date group
      const uniqueClinical = clinicalItems.filter(
        (item, index, self) => index === self.findIndex((t) => t.medicineName === item.medicineName && t.dosage === item.dosage)
      );
      const uniquePatent = patentItems.filter(
        (item, index, self) => index === self.findIndex((t) => t.medicineName === item.medicineName && t.dosage === item.dosage)
      );

      groupsMap.set(dateStr, {
        date: dateStr,
        symptoms: dateSymptoms,
        medicalReportResult: dateMedicalReportResult,
        labTestAdvice: dateLabTestAdvice,
        clinicalItems: uniqueClinical,
        patentItems: uniquePatent,
        totalItems: uniqueClinical.length + uniquePatent.length
      });
    });

    return Array.from(groupsMap.values());
  })();

  const handleCleanThermalTokenPrint = () => {
    const elem = document.getElementById('thermal-receipt');
    if (!elem) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=600,height=700');
    if (!printWin) {
      window.print();
      return;
    }

    const printerName = clinicSettings?.ThermalPrinterName || 'Thermal Printer';
    const basePaperWidth = clinicSettings?.ThermalPaperWidth || '60mm';
    const paperHeight = clinicSettings?.ThermalPaperHeight || 'auto';

    // Increase printing width by 2 inches
    const effectiveWidth = `calc(${basePaperWidth} + 2in)`;

    let pageCssSize = `${effectiveWidth} auto`;
    if (paperHeight && paperHeight !== 'auto') {
      pageCssSize = `${effectiveWidth} ${paperHeight}`;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OPD Token Ticket #${thermalPrintData?.tokenNo || ''} - ${printerName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: ${pageCssSize};
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: ${effectiveWidth};
              ${paperHeight && paperHeight !== 'auto' ? `height: ${paperHeight};` : ''}
              background: white !important;
              color: black !important;
              font-family: 'Courier New', Courier, monospace !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #thermal-receipt-container {
              width: ${effectiveWidth};
              ${paperHeight && paperHeight !== 'auto' ? `min-height: ${paperHeight}; height: ${paperHeight}; max-height: ${paperHeight};` : ''}
              margin: 0 auto;
              padding: 6px 4px;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="thermal-receipt-container">
            ${elem.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  try { window.close(); } catch(e) {}
                }, 300);
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleCleanPrintTab = (docType: 'A5_VISIT_SLIP' | 'A4_PRESCRIPTION' | 'A4_LAB_TESTS') => {
    const elem = document.getElementById('printable-patient-doc');
    if (!elem) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=1100');
    if (!printWin) {
      window.print();
      return;
    }

    const isA5 = docType === 'A5_VISIT_SLIP';
    const pageCss = isA5
      ? `@page { size: A5 portrait; margin: 4mm; }`
      : `@page { size: A4 portrait; margin: 6mm; }`;

    const titleStr = docType === 'A5_VISIT_SLIP'
      ? "Patient Visit Slip (A5 Portrait)"
      : docType === 'A4_LAB_TESTS'
      ? "Lab Test Advice (A4 Letterhead)"
      : "Prescription Letterhead (A4)";

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleStr} - Homeopathic Clinic</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            ${pageCss}
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #0f172a;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body { margin: 0; }
              #print-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="print-container" style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 12px;">
            ${elem.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.focus();
              window.print();
            }, 450);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleAddNewVisit = () => {
    setEditingVisitId(null);
    setPvVisitDate(new Date().toISOString().split('T')[0]);
    setPvSymptomsDiagnosis('');
    setPvClinicalItems([{ id: '1', medicineName: '', dosage: '' }]);
    setPvPatientItems([{ id: '1', medicineName: '', dosage: '' }]);
    setPvClinicalMedicineExpireDate('');
    setPvMedicalReportResult('');
    setPvLabTestAdvice('');
    setPvClinicalMedicinePkr('');
    setPvFilePkr('');
    setPvCardPkr('');
    setPvSaveSuccess('Ready to record new visit & prescription.');
    setPvSaveError('');
    setTimeout(() => setPvSaveSuccess(''), 3000);
  };

  const handleEditVisit = (visit: Visit | NhcPatientHistory) => {
    const vId = ('VisitID' in visit && visit.VisitID) ? visit.VisitID : ('date' in visit ? `NHC-${visit.date}` : `VIS-${Date.now()}`);
    setEditingVisitId(vId);

    if ('VisitDate' in visit && visit.VisitDate) {
      setPvVisitDate(visit.VisitDate.split('T')[0]);
    } else if ('date' in visit && visit.date) {
      setPvVisitDate(visit.date);
    }

    if ('SymptomsDiagnosis' in visit && visit.SymptomsDiagnosis) {
      setPvSymptomsDiagnosis(visit.SymptomsDiagnosis);
    } else if ('symptoms' in visit && visit.symptoms) {
      setPvSymptomsDiagnosis(visit.symptoms);
    }

    if ('MedicalReportResult' in visit && visit.MedicalReportResult && visit.MedicalReportResult !== 'N/A') {
      setPvMedicalReportResult(visit.MedicalReportResult);
    } else {
      setPvMedicalReportResult('');
    }

    if ('LabTestAdvice' in visit && visit.LabTestAdvice) {
      setPvLabTestAdvice(visit.LabTestAdvice);
    } else {
      setPvLabTestAdvice('');
    }

    let clinical = '';
    let patent = '';
    let expDate = '';

    const matchedVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'C');
    if (matchedVMeds.length > 0 && matchedVMeds[0].ExpireDate) {
      expDate = matchedVMeds[0].ExpireDate;
    }

    if ('clinicalMedication' in visit && visit.clinicalMedication) {
      clinical = String(visit.clinicalMedication);
    }
    if ('patientMedication' in visit && visit.patientMedication) {
      patent = String(visit.patientMedication);
    }

    if ('VisitRemarks' in visit && visit.VisitRemarks) {
      const rem = visit.VisitRemarks;
      if (rem.includes('Clinical:')) {
        const cMatch = rem.match(/Clinical:\s*([^|]+)/);
        if (cMatch && !clinical) clinical = cMatch[1].trim();
      }
      if (rem.includes('Patent:')) {
        const pMatch = rem.match(/Patent:\s*([^|]+)/);
        if (pMatch && !patent) patent = pMatch[1].trim();
      }
      if (rem.includes('Medical Reports:')) {
        const mrMatch = rem.match(/Medical Reports:\s*([^|]+)/);
        if (mrMatch && mrMatch[1].trim() !== 'N/A') setPvMedicalReportResult(mrMatch[1].trim());
      }
      if (rem.includes('Lab Tests:')) {
        const lMatch = rem.match(/Lab Tests:\s*([^|]+)/);
        if (lMatch) setPvLabTestAdvice(lMatch[1].trim());
      }
      if (!expDate) {
        const expMatch = rem.match(/\(EXP:\s*([^)]+)\)/);
        if (expMatch) expDate = expMatch[1].trim();
      }

      const cPkr = rem.match(/Clinical Meds PKR\s*(\d+)/);
      if (cPkr) setPvClinicalMedicinePkr(cPkr[1]);
      else setPvClinicalMedicinePkr('');

      const fPkr = rem.match(/File PKR\s*(\d+)/);
      if (fPkr) setPvFilePkr(fPkr[1]);
      else setPvFilePkr('');

      const kPkr = rem.match(/Card PKR\s*(\d+)/);
      if (kPkr) setPvCardPkr(kPkr[1]);
      else setPvCardPkr('');
    }

    const cItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
    const pItems: Array<{ id: string; medicineName: string; dosage: string }> = [];

    const matchedClinicalVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'C');
    const matchedPatentVMeds = visitMedicines.filter(vm => vm.VisitID === vId && vm.MedicineType === 'P');

    if (matchedClinicalVMeds.length > 0) {
      matchedClinicalVMeds.forEach((vm, idx) => {
        cItems.push({
          id: String(idx + 1),
          medicineName: vm.MedicineDetail || '',
          dosage: vm.Dosage || ''
        });
      });
    }
    if (matchedPatentVMeds.length > 0) {
      matchedPatentVMeds.forEach((vm, idx) => {
        pItems.push({
          id: String(idx + 1),
          medicineName: vm.MedicineDetail || '',
          dosage: vm.Dosage || ''
        });
      });
    }

    if (cItems.length === 0 && clinical) {
      const lines = clinical.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          cItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
        } else {
          cItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
        }
      });
    }

    if (pItems.length === 0 && patent) {
      const lines = patent.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          pItems.push({ id: String(idx + 1), medicineName: parts[0].trim(), dosage: parts.slice(1).join(' - ').trim() });
        } else {
          pItems.push({ id: String(idx + 1), medicineName: line.trim(), dosage: '' });
        }
      });
    }

    if (cItems.length === 0) cItems.push({ id: '1', medicineName: '', dosage: '' });
    if (pItems.length === 0) pItems.push({ id: '1', medicineName: '', dosage: '' });

    setPvClinicalItems(cItems);
    setPvPatientItems(pItems);
    setPvClinicalMedicineExpireDate(expDate);
    setPvSaveSuccess(`Loaded Visit record (${vId}) for editing.`);
    setTimeout(() => setPvSaveSuccess(''), 3000);
  };

  const handleSavePatientVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvSelectedPatientId) {
      setPvSaveError('Please select a patient first.');
      return;
    }

    const validClinical = pvClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
    const validPatent = pvPatientItems.filter((i) => i.medicineName.trim() || i.dosage.trim());

    if (validClinical.length === 0 && validPatent.length === 0) {
      setPvSaveError('Please enter at least one Clinical Medicine or Patient Medicine row.');
      return;
    }

    const totalPkr = (Number(pvClinicalMedicinePkr) || 0) + (Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0);
    const targetVisitId = editingVisitId || `VIS-${Date.now()}`;
    const clinicalTextWithExp = `${clinicalMedicineDosage.trim()}${pvClinicalMedicineExpireDate.trim() ? ` (EXP: ${pvClinicalMedicineExpireDate.trim()})` : ''}`;

    const newVisit: Visit = {
      VisitID: targetVisitId,
      PatientID: pvSelectedPatientId,
      VisitDate: pvVisitDate || new Date().toISOString().split('T')[0],
      SymptomsDiagnosis: pvSymptomsDiagnosis || 'Routine Consultation',
      MedicalReportResult: pvMedicalReportResult.trim() || 'N/A',
      LabTestAdvice: pvLabTestAdvice || 'None',
      PatientAdvice: pvLabTestAdvice || 'Take medicines regularly.',
      VisitRemarks: `Clinical: ${clinicalTextWithExp} | Patent: ${patientMedicineDosage} | Medical Reports: ${pvMedicalReportResult.trim() || 'N/A'} | Lab Tests: ${pvLabTestAdvice || 'None'} | Charges: Clinical Meds PKR ${pvClinicalMedicinePkr || 0}, File PKR ${pvFilePkr || 0}, Card PKR ${pvCardPkr || 0} (Total PKR ${totalPkr})`,
      Status: 2,
      ClinicalMedicinePayment: pvClinicalMedicinePkr || '0',
      FileFee: pvFilePkr || '0',
      CardFee: pvCardPkr || '0',
      CardsPayment: String((Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0))
    };

    const newVisitMedicines: VisitMedicine[] = [];

    // Save each clinical medicine row
    validClinical.forEach((item, idx) => {
      newVisitMedicines.push({
        VisitID: targetVisitId,
        ItemID: `CLIN-${idx + 1}`,
        MedicineType: 'C',
        MedicineDetail: item.medicineName.trim() || 'Clinical Compounding Medicine',
        Dosage: item.dosage.trim() || 'As directed',
        Qty: 1,
        ExpireDate: pvClinicalMedicineExpireDate.trim()
      });
    });

    // Save each patent medicine row
    validPatent.forEach((item, idx) => {
      newVisitMedicines.push({
        VisitID: targetVisitId,
        ItemID: `PAT-${idx + 1}`,
        MedicineType: 'P',
        MedicineDetail: item.medicineName.trim() || 'Commercial Medicine',
        Dosage: item.dosage.trim() || 'As directed',
        Qty: 1
      });
    });
    if (onAddVisit) {
      onAddVisit(newVisit, newVisitMedicines, []);
    }

    // Also update in pvNhcHistory so side navigation updates dynamically
    setPvNhcHistory(prev => {
      const idx = prev.findIndex(item => item.VisitID === targetVisitId);
      const newHistoryRecord: NhcPatientHistory = {
        PatientID: pvSelectedPatientId,
        PatientName: selectedPvPatient?.PatientName || '',
        VisitID: targetVisitId,
        date: pvVisitDate || new Date().toISOString().split('T')[0],
        symptoms: pvSymptomsDiagnosis || 'Routine Consultation',
        clinicalMedication: clinicalMedicineDosage,
        patientMedication: patientMedicineDosage,
        VisitRemarks: newVisit.VisitRemarks
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newHistoryRecord };
        return copy;
      }
      return [newHistoryRecord, ...prev];
    });

    setPvSaveSuccess(editingVisitId ? `Patient visit #${targetVisitId} updated successfully!` : `Patient visit & prescription recorded successfully for Patient ID: ${pvSelectedPatientId}!`);
    setPvSaveError('');
    setEditingVisitId(targetVisitId);
    setPvSelectedHistoryDate(pvVisitDate || new Date().toISOString().split('T')[0]);

    setTimeout(() => setPvSaveSuccess(''), 6000);
  };

  const handleStartEditPatient = (p: Patient) => {
    setEditingPatientId(p.PatientID);
    setPatientName(p.PatientName || '');
    setFatherHusband((p as any).Father_husband || p.Father_husband || '');
    setAgeYears(p.AgeYears || 0);
    setSex((p.Sex as any) || 'Male');
    setMaritalStatus((p.MaritalStatus as any) || 'Single');
    setOccupation(p.Occupation || '');
    setAddress(p.Address || '');
    setMobilePhone(p.PhoneMobile || '');
    setEmail(p.Email || '');
    setCityId(p.CityID || 1);
    setActiveSubTab('register');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCancelEditPatient = () => {
    setEditingPatientId(null);
    setPatientName('');
    setFatherHusband('');
    setAgeYears(30);
    setSex('Male');
    setMaritalStatus('Single');
    setOccupation('');
    setAddress('');
    setMobilePhone('');
    setEmail('');
    setCityId(1);
    setErrorMsg('');
  };

  const handleEditRecentVisitRecord = () => {
    if (!pvSelectedPatientId) {
      alert('Please select a patient first.');
      return;
    }
    if (patientVisitRecords.length === 0) {
      alert('No previous visit records found for this patient to edit. You can record a new visit below.');
      return;
    }
    const target = currentEditingVisitRecordIndex >= 0 ? patientVisitRecords[currentEditingVisitRecordIndex] : patientVisitRecords[0];
    const itemToEdit = target.visitObj || target.nhcObj;
    if (itemToEdit) {
      handleEditVisit(itemToEdit);
    }
  };

  const handleSelectPreviousVisitRecord = () => {
    if (!pvSelectedPatientId || patientVisitRecords.length === 0) return;

    let nextIdx = 0;
    if (currentEditingVisitRecordIndex >= 0) {
      nextIdx = currentEditingVisitRecordIndex + 1; // older visit record
    } else {
      nextIdx = 0; // latest visit record
    }

    if (nextIdx < patientVisitRecords.length) {
      const target = patientVisitRecords[nextIdx];
      const itemToEdit = target.visitObj || target.nhcObj;
      if (itemToEdit) {
        handleEditVisit(itemToEdit);
      }
    }
  };

  const handleSelectNextVisitRecord = () => {
    if (!pvSelectedPatientId || patientVisitRecords.length === 0) return;

    if (currentEditingVisitRecordIndex > 0) {
      const nextIdx = currentEditingVisitRecordIndex - 1; // newer visit record
      const target = patientVisitRecords[nextIdx];
      const itemToEdit = target.visitObj || target.nhcObj;
      if (itemToEdit) {
        handleEditVisit(itemToEdit);
      }
    } else if (currentEditingVisitRecordIndex === 0) {
      handleAddNewVisit();
    }
  };

  const handleSelectPreviousPatient = () => {
    if (pvPatientDropdownOptions.length === 0) return;
    const currIdx = pvPatientDropdownOptions.findIndex(p => p.PatientID === pvSelectedPatientId);
    if (currIdx > 0) {
      const prevPt = pvPatientDropdownOptions[currIdx - 1];
      setPvSelectedPatientId(prevPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(prevPt.PatientID, false);
    } else if (currIdx === -1 && pvPatientDropdownOptions.length > 0) {
      const firstPt = pvPatientDropdownOptions[0];
      setPvSelectedPatientId(firstPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(firstPt.PatientID, false);
    }
  };

  const handleSelectNextPatient = () => {
    if (pvPatientDropdownOptions.length === 0) return;
    const currIdx = pvPatientDropdownOptions.findIndex(p => p.PatientID === pvSelectedPatientId);
    if (currIdx >= 0 && currIdx < pvPatientDropdownOptions.length - 1) {
      const nextPt = pvPatientDropdownOptions[currIdx + 1];
      setPvSelectedPatientId(nextPt.PatientID);
      setPvSelectedHistoryDate('ALL');
      loadPvPatientHistory(nextPt.PatientID, false);
    }
  };

  const handlePrintPreviousRxDirect = () => {
    if (!pvSelectedPatientId || combinedPreviousHistory.length === 0 || groupedRxByDate.length === 0) {
      alert("No previous visit prescription records found for this patient.");
      return;
    }
    handlePrintPreviousVisitPrescription(groupedRxByDate[0]);
  };

  const handlePrintClinicalMedicineLabel = () => {
    if (!selectedPvPatient) {
      alert('Please select a patient first.');
      return;
    }

    const activeClinical = pvClinicalItems.filter(
      (i) => i.medicineName.trim() !== '' && i.medicineName !== 'None prescribed'
    );

    if (activeClinical.length === 0) {
      alert('No Clinical Medicines entered for current visit.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=650,height=900');
    if (!printWin) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print labels.');
      return;
    }

    const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
    const doctorName = clinicSettings?.DoctorName || 'Dr. Ejaz Ahmad, D.H.M.S (Pak)';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Medicine Usage Label (4x8 inch Roll)</title>
          <style>
            @page {
              size: 4in 8in;
              margin: 0;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              padding: 0.3in;
              width: 4in;
              height: 8in;
              box-sizing: border-box;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.3;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              text-align: center;
            }
            .clinic-title {
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .label-subtitle {
              font-size: 9px;
              font-weight: bold;
              color: #444;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .patient-info {
              font-size: 11px;
              font-weight: bold;
              margin: 10px 0;
              border: 1px solid #333;
              background: #f8fafc;
              padding: 8px;
              border-radius: 6px;
            }
            .patient-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .usage-box {
              border: 2px solid #000;
              background: #f1f5f9;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              margin: 12px 0;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .usage-title {
              font-size: 10px;
              font-weight: 900;
              background: #000;
              color: #fff;
              padding: 3px 8px;
              border-radius: 4px;
              display: inline-block;
              margin: 0 auto 10px auto;
              letter-spacing: 1px;
            }
            .med-item {
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #94a3b8;
            }
            .med-item:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .med-name {
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              color: #0f172a;
            }
            .med-dosage {
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
              color: #000;
              margin-top: 4px;
            }
            .footer {
              border-top: 2px solid #000;
              padding-top: 8px;
              font-size: 9px;
              text-align: center;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div>
            <div class="header">
              <div class="clinic-title">${clinicName}</div>
              <div class="label-subtitle">Usage of Clinical Medicine • Roll Sticker (4" x 8")</div>
            </div>
            <div class="patient-info">
              <div class="patient-line">
                <span>PATIENT: <strong>${selectedPvPatient.PatientName.toUpperCase()}</strong></span>
                <span>ID: ${selectedPvPatient.PatientID}</span>
              </div>
              <div class="patient-line" style="margin-bottom:0; font-size: 9px; color: #475569;">
                <span>DATE: ${pvVisitDate || new Date().toISOString().split('T')[0]}</span>
                <span>AGE/SEX: ${selectedPvPatient.AgeYears}Y / ${selectedPvPatient.Sex}</span>
              </div>
            </div>
            <div class="usage-box">
              <div class="usage-title">USAGE OF CLINICAL MEDICINE</div>
              ${activeClinical.map(item => `
                <div class="med-item">
                  <div class="med-name">${item.medicineName}</div>
                  <div class="med-dosage">${item.dosage || 'AS DIRECTED BY PHYSICIAN'}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="footer">
            Prescribed by: ${doctorName} &bull; Homeopathic Clinic Lahore &bull; Keep out of reach of children
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Patient Register Handler
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setErrorMsg('Unauthorized: Your role does not permit adding new patients.');
      return;
    }
    if (!patientName.trim()) {
      setErrorMsg('Patient Name is mandatory.');
      return;
    }
    // Validation for phone format Pakistani: e.g. 03xx-xxxxxxx or simply 11 digits
    const cleanPhone = mobilePhone.trim();
    if (!cleanPhone) {
      setErrorMsg('Mobile Phone number is mandatory.');
      return;
    }
    const phoneRegex = /^03\d{2}-\d{7}$|^03\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('Invalid format. Please use Pakistani mobile format (e.g., 0300-1234567 or 03001234567).');
      return;
    }

    if (editingPatientId) {
      const existingPatient = patients.find(p => p.PatientID === editingPatientId);
      const updatedPatient: Patient = {
        PatientID: editingPatientId,
        PatientName: patientName,
        Father_husband: fatherHusband || 'N/A',
        AgeYears: ageYears,
        Sex: sex,
        MaritalStatus: maritalStatus,
        Occupation: occupation || 'N/A',
        Address: address || 'N/A',
        CityID: cityId,
        Country: 'Pakistan',
        PhoneMobile: cleanPhone,
        Email: email || undefined,
        RegistrationDate: existingPatient?.RegistrationDate || new Date().toISOString()
      };

      if (onUpdatePatient) {
        onUpdatePatient(updatedPatient);
      } else {
        onAddPatient(updatedPatient);
      }

      setSuccessMsg(`Patient profile for ${patientName} (${editingPatientId}) updated successfully!`);
      setErrorMsg('');
      setEditingPatientId(null);
    } else {
      const newId = `PAT-${String(patients.length + 1).padStart(3, '0')}`;
      const newPatient: Patient = {
        PatientID: newId,
        PatientName: patientName,
        Father_husband: fatherHusband || 'N/A',
        AgeYears: ageYears,
        Sex: sex,
        MaritalStatus: maritalStatus,
        Occupation: occupation || 'N/A',
        Address: address || 'N/A',
        CityID: cityId,
        Country: 'Pakistan',
        PhoneMobile: cleanPhone,
        Email: email || undefined,
        RegistrationDate: new Date().toISOString()
      };

      onAddPatient(newPatient);
      setSuccessMsg(`Patient ${patientName} successfully registered with Patient ID: ${newId}`);
      setErrorMsg('');
    }
    
    // Clear Form
    setPatientName('');
    setFatherHusband('');
    setAgeYears(30);
    setSex('Male');
    setMaritalStatus('Single');
    setOccupation('');
    setAddress('');
    setMobilePhone('');
    setEmail('');

    setTimeout(() => setSuccessMsg(''), 6000);
  };

  // Appointment Booking & Token Issuance Handler
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setAppError('Unauthorized: Your role does not permit booking appointments.');
      return;
    }
    if (!selectedPatientId) {
      setAppError('Please select a registered patient.');
      return;
    }

    const patient = patients.find((p) => p.PatientID === selectedPatientId);
    if (!patient) {
      setAppError('Selected patient invalid.');
      return;
    }

    const realTodayStr = new Date().toISOString().split('T')[0];

    // Check if an appointment was ALREADY pre-booked for this patient on the selected appDate
    const existingPreBookedApp = appointments.find(
      (a) => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3
    );

    const feeVal = existingFee !== '' && !isNaN(Number(existingFee))
      ? Number(existingFee)
      : (clinicSettings?.OPDFee !== undefined ? clinicSettings.OPDFee : 1500);

    let activeAppId = '';

    // CASE 1: Future Advance Appointment Booking (appDate > today)
    if (appDate !== realTodayStr) {
      if (!existingPreBookedApp) {
        let nextAppNum = appointments.length + 1;
        let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
        while (appointments.some((a) => a.AppointmentID === newAppId)) {
          nextAppNum++;
          newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
        }
        const newApp: Appointment = {
          AppointmentID: newAppId,
          PatientID: selectedPatientId,
          AppointmentDate: appDate,
          Shift: shift,
          Status: 1, // New
          Remarks: remarks || 'Advance Appointment Booking',
          FeeCharged: feeVal
        };
        onAddAppointment(newApp);
        activeAppId = newAppId;
      } else {
        activeAppId = existingPreBookedApp.AppointmentID;
      }

      setAppError('');
      setFutureBookingModal({
        isOpen: true,
        patientName: patient.PatientName,
        patientId: patient.PatientID,
        phoneMobile: patient.PhoneMobile,
        date: appDate,
        shift: shift
      });
      setAppSuccess(`Advance appointment booked for ${patient.PatientName} on ${appDate}. Appointment Fee PKR ${existingPreBookedApp ? existingPreBookedApp.FeeCharged : feeVal} recorded/paid. Token will be issued when patient arrives on appointment date.`);
      setSelectedPatientId('');
      setRemarks('');
      setTimeout(() => setAppSuccess(''), 6000);
      return;
    }

    // CASE 2 & 3: Token Issuance on Appointment Date (appDate === realTodayStr)
    let tokenFeeToCharge = feeVal;
    let finalRemarks = remarks || 'Routine OPD check';
    let isPrepaidAppointment = false;

    if (existingPreBookedApp) {
      // Patient already booked and paid for this appointment in advance!
      activeAppId = existingPreBookedApp.AppointmentID;
      tokenFeeToCharge = 0; // PKR 0 today because fee was ALREADY paid at booking time
      isPrepaidAppointment = true;
      finalRemarks = remarks ? `${remarks} (Pre-booked - Fee Paid)` : `Pre-booked Appointment - Fee PKR ${existingPreBookedApp.FeeCharged || 1500} Paid on Booking`;
    } else {
      // Direct Walk-In Today: Create appointment record with today's fee
      let nextAppNum = appointments.length + 1;
      let newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
      while (appointments.some((a) => a.AppointmentID === newAppId)) {
        nextAppNum++;
        newAppId = `APP-${String(nextAppNum).padStart(3, '0')}`;
      }
      activeAppId = newAppId;
      const newApp: Appointment = {
        AppointmentID: newAppId,
        PatientID: selectedPatientId,
        AppointmentDate: appDate,
        Shift: shift,
        Status: 1, // New
        Remarks: finalRemarks,
        FeeCharged: tokenFeeToCharge
      };
      onAddAppointment(newApp);
    }

    // Auto generate sequential daily token for this shift and date
    const dailyTokens = tokens.filter((t) => t.Date === appDate && t.Shift === shift);
    const nextTokenNo = dailyTokens.length + 1;

    const newToken: Token = {
      TokenNo: nextTokenNo,
      PatientID: selectedPatientId,
      Shift: shift,
      Status: 1, // New / Waiting
      Date: appDate
    };

    onAddToken(newToken);

    // Automated SMS Sending engine
    if (smsSettings && smsSettings.Enabled) {
      const prevVisitsCount = appointments.filter((a) => a.PatientID === selectedPatientId).length;
      const isRepeat = prevVisitsCount > 0;
      const template = isRepeat ? smsSettings.RepeatTemplate : smsSettings.BookingTemplate;
      
      const parsedMessage = template
        .replace(/{PATIENT}/g, patient.PatientName)
        .replace(/{TOKEN}/g, String(nextTokenNo))
        .replace(/{SHIFT}/g, shift === 1 ? 'Morning' : 'Evening')
        .replace(/{DATE}/g, appDate)
        .replace(/{APPID}/g, activeAppId);

      setSmsSentToast({
        recipient: patient.PhoneMobile,
        message: parsedMessage,
        provider: smsSettings.Provider
      });

      console.log(`[AUTOMATED SMS DISPATCH] Sent to: ${patient.PhoneMobile} via provider [${smsSettings.Provider.toUpperCase()}] message: "${parsedMessage}"`);
    }

    // Load thermal ticket printing data and open popup
    setThermalPrintData({
      tokenNo: nextTokenNo,
      patientName: patient.PatientName,
      patientId: patient.PatientID,
      shiftName: shift === 1 ? 'MORNING (08:00 - 14:00)' : 'EVENING (14:00 - 20:00)',
      date: appDate,
      fee: tokenFeeToCharge,
      feeNote: isPrepaidAppointment ? `PREPAID (Fee PKR ${existingPreBookedApp?.FeeCharged || 1500} Paid on Booking)` : undefined,
      appId: activeAppId,
      patientType: getPatientType(patient.PatientID),
      remarks: finalRemarks
    });
    setThermalPrintOpen(true);

    if (isPrepaidAppointment) {
      setAppSuccess(`Pre-Booked Appointment Token No: ${nextTokenNo} allocated for ${shift === 1 ? 'Morning' : 'Evening'} shift. Fee: PKR 0 (Prepaid - PKR ${existingPreBookedApp?.FeeCharged || 1500} paid on booking).`);
    } else {
      setAppSuccess(`Appointment booked & Token No: ${nextTokenNo} allocated for ${shift === 1 ? 'Morning' : 'Evening'} shift. Fee: PKR ${tokenFeeToCharge} charged.`);
    }

    setAppError('');
    setSelectedPatientId('');
    setRemarks('');

    setTimeout(() => setAppSuccess(''), 6000);
  };

  // Advanced Token queue handlers
  const speakVoice = (tok: Token) => {
    if ('speechSynthesis' in window) {
      const name = getPatientName(tok.PatientID);
      const text = `Attention please, Token number ${tok.TokenNo}, patient ${name}, please proceed to the doctor's room.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // clear and slightly slower for readability
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCallPatient = (tok: Token) => {
    if (!canCallServeToken) {
      alert('Access Control Security: You do not have permission to Call or Serve patients in the queue.');
      return;
    }
    // 1 (New) -> 2 (Visited)
    onUpdateTokenStatus(tok.TokenNo, tok.Shift, 2);
    // Corresponding appointment should also be marked Visited (2)
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && a.Status === 1
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 2);
    }

    // Voice announcement speak
    speakVoice(tok);
  };

  const handlePostPayment = (tok: Token) => {
    if (!canPost) {
      alert('Security Protection: Accountant / Receptionist privileges with PostRec required.');
      return;
    }
    // Update appointment to Posted (4) which automatically fires dual-entry voucher
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && (a.Status === 1 || a.Status === 2)
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 4); // Payment Posted
      alert(`OPD Ticket Fee payment of Rs. 1,500 posted to general ledger. Cash debited to Appointment Desk Cash.`);
    }
  };

  const handleCancelQueue = (tok: Token) => {
    if (!canCallServeToken && !canCancelAppointment) {
      alert('Access Control Security: You do not have permission to Cancel queue tokens.');
      return;
    }
    onUpdateTokenStatus(tok.TokenNo, tok.Shift, 3); // Canceled
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && (a.Status === 1 || a.Status === 2)
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 3); // Canceled
    }
  };

  // Find Patient Details helper
  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Unknown';
  };

  const getPatientPhone = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PhoneMobile : 'N/A';
  };

  return (
    <div className="p-2.5 sm:p-3 space-y-2.5 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="patients-desk">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-blue-600 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center">
            Patient Intake & Appointment Desk
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium pl-2 border-l border-slate-200">
            Tokens, queue & intake
          </span>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 p-1 rounded-lg border border-slate-200 print:hidden shrink-0">
          {canAccessQueue && (
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'queue' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Waiting Queue</span>
            </button>
          )}
          {canAccessRegister && (
            <button
              onClick={() => setActiveSubTab('register')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration Form</span>
            </button>
          )}
          {canAccessTokenIssue && (
            <button
              onClick={() => setActiveSubTab('token_issue')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'token_issue' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Token Issue</span>
            </button>
          )}
          {canAccessPatientVisit && (
            <button
              onClick={() => setActiveSubTab('patient_visit')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'patient_visit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient Visit</span>
            </button>
          )}
          {canAccessAppointments && (
            <button
              onClick={() => setActiveSubTab('book')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'book' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>
          )}
          {canAccessLargeScreen && (
            <button
              onClick={() => setActiveSubTab('status')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'status' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Large Screen Display</span>
            </button>
          )}
        </div>
      </div>

      {/* Access Restriction Banner if ALL sub-tabs are disabled for user */}
      {!canAccessQueue && !canAccessRegister && !canAccessTokenIssue && !canAccessPatientVisit && !canAccessAppointments && !canAccessLargeScreen && (
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 text-rose-900 text-center space-y-3 my-6 animate-fadeIn">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-rose-950">Sub-Desk Access Restricted</h3>
            <p className="text-xs text-rose-800 mt-1 max-w-md mx-auto">
              Your account <strong>({currentUser?.FullName || currentUser?.LoginName})</strong> does not have permission to access any sub-modules inside Patient Intake & Appointment Desk.
            </p>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold italic">
            Contact your Administrator in Settings &gt; User Access Control to grant access.
          </p>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO SUB-TAB */}
      {activeSubTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patients-view-register">
          
          {/* Registration Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-950 flex items-center">
                <Sparkles className="w-4 h-4 text-emerald-500 mr-2 animate-pulse" />
                {editingPatientId ? `Edit Patient Profile (${editingPatientId})` : 'New Patient Registration Form'}
              </h3>
              {editingPatientId && (
                <button
                  type="button"
                  onClick={handleCancelEditPatient}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-200 cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zubair Ahmad Qureshi"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Father / Husband Name</label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ishaq"
                  value={fatherHusband}
                  onChange={(e) => setFatherHusband(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Age (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={ageYears}
                  onChange={(e) => setAgeYears(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Gender / Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Marital Status</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. SBP Employee, Business, Student"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Mobile Phone * (Pakistani format)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-1234567"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <span className="text-xxs text-slate-400 font-medium">Format: 03xx-xxxxxxx</span>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xxs font-bold text-slate-500 uppercase">Residential Address</label>
                <input
                  type="text"
                  placeholder="House No, Street, Town Name"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">City ID (Punjab Province)</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  {cities.map((city) => (
                    <option key={city.CityID} value={city.CityID}>
                      {city.CityName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Country</label>
                <input
                  type="text"
                  readOnly
                  value="Pakistan"
                  className="mt-1 w-full text-xs border border-slate-200 bg-slate-50 text-slate-400 font-semibold rounded-lg p-2 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={!canAdd}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition cursor-pointer ${
                    canAdd
                      ? editingPatientId
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canAdd
                    ? editingPatientId
                      ? `Update Patient Profile (${editingPatientId})`
                      : 'Save & Register Intake File'
                    : 'Unauthorized - Registration Locked'}
                </button>
              </div>
            </form>
          </div>

          {/* Master Lookup */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <Search className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
              Patient Database Lookup
            </h3>

            <div className="relative mb-4 flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchNhcArchive(searchTerm);
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchNhcArchive(searchTerm)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded-lg transition shrink-0 cursor-pointer"
              >
                Search PHC
              </button>
            </div>
            {isSearchingArchive && (
              <>
                <span className="text-[10px] text-emerald-600 font-semibold animate-pulse block mb-2">Searching PHC Archive...</span>
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-150 flex flex-col items-center max-w-xs text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Searching PHC Archive</h4>
                      <p className="text-xxs text-slate-500 mt-1">Please wait while we query legacy databases and treatment histories based on your search query...</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {filteredPatients.length === 0 && filteredNhcPatients.length === 0 ? (
                <p className="text-xs text-slate-400 text-center font-semibold py-8">No matching records found.</p>
              ) : (
                <>
                  {/* Active Clinic Patients */}
                  {filteredPatients.map((p) => {
                    const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                    return (
                      <div key={p.PatientID} className="pt-3 first:pt-0 flex flex-col space-y-1.5 text-xs text-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <strong className="text-slate-900 font-bold">{p.PatientName}</strong>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider scale-95">Active</span>
                            </div>
                            <p className="text-xxs font-mono text-slate-400 font-semibold mt-0.5">{p.PatientID}</p>
                          </div>
                          <span className="text-xxs bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded uppercase">
                            {p.Sex} ({p.AgeYears}y)
                          </span>
                        </div>
                        <div className="flex items-center text-xxs text-slate-500 font-medium">
                          <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                          <span>{p.PhoneMobile}</span>
                        </div>
                        <div className="flex items-center text-xxs text-slate-500 font-medium">
                          <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400" />
                          <span>{p.Address}, {city}</span>
                        </div>
                        <div className="pt-2 flex justify-end items-center space-x-1.5">
                          {canEditPatient && (
                            <button
                              type="button"
                              onClick={() => handleStartEditPatient(p)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center transition border border-amber-200 cursor-pointer shadow-2xs"
                              title="Edit Patient Registration Profile"
                            >
                              <Pencil className="w-3 h-3 mr-1 text-amber-600" />
                              <span>Edit Profile</span>
                            </button>
                          )}
                          {canBookAppointment && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(p.PatientID);
                                setActiveSubTab('book');
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded flex items-center transition border border-indigo-150 cursor-pointer shadow-2xs"
                            >
                              <CalendarPlus className="w-3 h-3 mr-1" />
                              <span>Book Repeat Appointment</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* PHC Archive Patients */}
                  {filteredNhcPatients.map((p) => {
                    return (
                      <div key={p.PatientID} className="pt-3 flex flex-col space-y-1.5 text-xs text-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <strong className="text-slate-900 font-bold">{p.PatientName}</strong>
                              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider scale-95">PHC Archive</span>
                            </div>
                            <p className="text-xxs font-mono text-slate-400 font-semibold mt-0.5">{p.PatientID}</p>
                          </div>
                          <span className="text-xxs bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded uppercase">
                            {p.Sex} ({p.AgeYears}y)
                          </span>
                        </div>
                        <div className="flex items-center text-xxs text-slate-500 font-medium">
                          <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                          <span>{p.PhoneMobile}</span>
                        </div>
                        <div className="flex items-center text-xxs text-slate-500 font-medium">
                          <UserCheck className="w-2.5 h-2.5 mr-1 text-slate-400" />
                          <span>Guardian/F_H: {p.Father_husband || 'N/A'}</span>
                        </div>
                        {p.MedicalCondition && (
                          <div className="text-[10px] bg-indigo-50/40 p-1.5 rounded text-indigo-800 italic">
                            Last medical cond: {p.MedicalCondition}
                          </div>
                        )}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const newPatient: Patient = {
                                PatientID: p.PatientID,
                                PatientName: p.PatientName,
                                Father_husband: p.Father_husband || 'N/A',
                                AgeYears: p.AgeYears || 30,
                                Sex: (p.Sex === 'Male' || p.Sex === 'Female' || p.Sex === 'Other') ? p.Sex : 'Male',
                                MaritalStatus: 'Single',
                                Occupation: 'N/A',
                                Address: p.Address || 'N/A',
                                CityID: 1, // Lahore
                                Country: 'Pakistan',
                                PhoneMobile: p.PhoneMobile || '03000000000',
                                RegistrationDate: p.RegistrationDate || new Date().toISOString()
                              };
                              onAddPatient(newPatient);
                              setSelectedPatientId(p.PatientID);
                              setActiveSubTab('book');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded flex items-center transition border border-emerald-150"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            <span>Import & Book Appointment</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TOKEN ISSUE SUB-TAB VIEW */}
      {activeSubTab === 'token_issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patients-view-token-issue">
          {/* Left Column (2 cols): Patient Database Search Engine & Lookup */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950 flex items-center">
                    Token Issue & Patient Search
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Search patient database by name, ID, or mobile number to issue token</p>
                </div>
              </div>

              {selectedPatientId && (
                <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selected: {patients.find(p => p.PatientID === selectedPatientId)?.PatientName || selectedPatientId}</span>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search active & PHC archive by name, ID or mobile phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchNhcArchive(searchTerm);
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium shadow-2xs"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchNhcArchive(searchTerm)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer flex items-center space-x-1.5 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search PHC Archive</span>
              </button>
            </div>

            {isSearchingArchive && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center space-x-2 animate-pulse">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">Querying legacy PHC database archive for "{searchTerm}"...</span>
              </div>
            )}

            {/* Results Counter Banner */}
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <span>
                Matching Records: <strong className="text-slate-800">{filteredPatients.length} Active</strong> + <strong className="text-indigo-800">{filteredNhcPatients.length} PHC Archive</strong>
              </span>
              <span className="text-[10px] text-slate-400">Click "Select for Token" on any record below</span>
            </div>

            {/* Search Results List */}
            <div className="max-h-[500px] overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {filteredPatients.length === 0 && filteredNhcPatients.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Search className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">No matching records found for "{searchTerm}"</p>
                  <p className="text-[11px] text-slate-400">Try searching by full or partial name, mobile number, or Patient ID.</p>
                </div>
              ) : (
                <>
                  {/* Active Clinic Patients */}
                  {filteredPatients.map((p) => {
                    const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                    const isSelected = selectedPatientId === p.PatientID;
                    const existingTodayToken = (tokens || []).find(t => t.PatientID === p.PatientID && t.Date === appDate);
                    
                    return (
                      <div 
                        key={p.PatientID} 
                        className={`pt-3 first:pt-0 p-3 rounded-xl border transition ${
                          isSelected ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <strong className="text-slate-900 font-bold text-sm">{p.PatientName}</strong>
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                              {existingTodayToken && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">
                                  Token #{existingTodayToken.TokenNo}
                                </span>
                              )}
                            </div>
                            <p className="text-xxs font-mono text-slate-500 font-semibold mt-0.5">
                              ID: {p.PatientID} {p.Father_husband && p.Father_husband !== 'N/A' ? `| S/O, W/O: ${p.Father_husband}` : ''}
                            </p>
                          </div>
                          <span className="text-xxs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                            {p.Sex} ({p.AgeYears} Yrs)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800">{p.PhoneMobile}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.Address}, {city}</span>
                          </div>
                        </div>

                        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400">Reg: {p.RegistrationDate ? p.RegistrationDate.split('T')[0] : 'N/A'}</span>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPatientId(p.PatientID)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>{isSelected ? 'Patient Selected' : 'Select for Token'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* PHC Archive Patients */}
                  {filteredNhcPatients.map((p) => {
                    const isSelected = selectedPatientId === p.PatientID;
                    return (
                      <div 
                        key={p.PatientID} 
                        className={`pt-3 p-3 rounded-xl border transition ${
                          isSelected ? 'bg-indigo-50/60 border-indigo-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <strong className="text-slate-900 font-bold text-sm">{p.PatientName}</strong>
                              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PHC Archive</span>
                            </div>
                            <p className="text-xxs font-mono text-slate-500 font-semibold mt-0.5">
                              ID: {p.PatientID} | Guardian: {p.Father_husband || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xxs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">
                            {p.Sex} ({p.AgeYears} Yrs)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-800">{p.PhoneMobile || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                            <span className="truncate">{p.Address || 'N/A'}</span>
                          </div>
                        </div>

                        {p.MedicalCondition && (
                          <div className="text-[10px] bg-indigo-50/60 p-1.5 rounded-lg text-indigo-900 italic mt-2">
                            Legacy Condition: {p.MedicalCondition}
                          </div>
                        )}

                        <div className="pt-3 flex items-center justify-between border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400">Legacy PHC File</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPatient: Patient = {
                                PatientID: p.PatientID,
                                PatientName: p.PatientName,
                                Father_husband: p.Father_husband || 'N/A',
                                AgeYears: p.AgeYears || 30,
                                Sex: (p.Sex === 'Male' || p.Sex === 'Female' || p.Sex === 'Other') ? p.Sex : 'Male',
                                MaritalStatus: 'Single',
                                Occupation: 'N/A',
                                Address: p.Address || 'N/A',
                                CityID: 1, // Lahore
                                Country: 'Pakistan',
                                PhoneMobile: p.PhoneMobile || '03000000000',
                                RegistrationDate: p.RegistrationDate || new Date().toISOString()
                              };
                              onAddPatient(newPatient);
                              setSelectedPatientId(p.PatientID);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Import Archive & Select</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Right Column (1 col): Token Issue Panel & Confirmation */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-950 flex items-center">
                  <Ticket className="w-4 h-4 text-emerald-600 mr-2" />
                  Issue OPD Token
                </h3>
              </div>

              {/* Mode Toggle: Existing Patient vs New Patient */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setTokenIssueMode('existing')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    tokenIssueMode === 'existing'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setTokenIssueMode('new_patient')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1 ${
                    tokenIssueMode === 'new_patient'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Register New Patient</span>
                </button>
              </div>

              {appError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
                  {appError}
                </div>
              )}
              {appSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                  {appSuccess}
                </div>
              )}

              {/* MODE 1: EXISTING PATIENT FORM */}
              {tokenIssueMode === 'existing' && (
                <>
                  {/* Selected Patient Box */}
                  {selectedPatientId ? (() => {
                    const pat = patients.find(p => p.PatientID === selectedPatientId);
                    return (
                      <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Selected Patient for Token</span>
                        <p className="text-sm font-black text-slate-900">{pat?.PatientName || selectedPatientId}</p>
                        <p className="text-xs text-slate-600">
                          ID: <span className="font-mono font-bold text-slate-800">{selectedPatientId}</span> | Mobile: <span className="font-mono">{pat?.PhoneMobile || 'N/A'}</span>
                        </p>
                      </div>
                    );
                  })() : (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                      <p className="font-bold">No Patient Selected</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">Please search and select a patient from the search engine on the left to issue a token.</p>
                    </div>
                  )}

                  <form onSubmit={handleBookAppointment} className="space-y-3">
                    <div>
                      <label className="block text-xxs font-bold text-slate-500 uppercase">Token Date</label>
                      <input
                        type="date"
                        required
                        value={appDate}
                        onChange={(e) => setAppDate(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-500 uppercase">Shift Selection</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setShift(1)}
                          className={`p-2.5 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                            shift === 1
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Morning Shift (1)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShift(2)}
                          className={`p-2.5 text-xs font-bold rounded-lg border transition text-center cursor-pointer ${
                            shift === 2
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Evening Shift (2)
                        </button>
                      </div>
                    </div>

                    {/* Pre-booked Appointment Check */}
                    {(() => {
                      const activePreBookedApp = selectedPatientId
                        ? appointments.find(a => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3)
                        : undefined;

                      if (activePreBookedApp) {
                        return (
                          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl space-y-1.5 shadow-xs">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Pre-Booked Appointment Detected</span>
                            </div>
                            <p className="text-xs text-emerald-900">
                              Appointment <strong className="font-mono text-emerald-950">{activePreBookedApp.AppointmentID}</strong> pre-booked for {appDate}.
                            </p>
                            <div className="bg-white/90 p-2 rounded-lg border border-emerald-200 text-xs flex justify-between items-center">
                              <span className="font-semibold text-slate-700">Fee Paid on Booking:</span>
                              <span className="font-mono font-black text-emerald-800">PKR {Number(activePreBookedApp.FeeCharged || 1500).toLocaleString()}</span>
                            </div>
                            <div className="bg-emerald-100/90 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-emerald-950 flex justify-between items-center">
                              <span>Fee Charged Today for Token:</span>
                              <span className="font-mono font-black text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300">PKR 0 (Prepaid)</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 uppercase">Appointment / OPD Fee Charged (PKR)</label>
                          <input
                            type="number"
                            placeholder="e.g. 1500"
                            value={existingFee}
                            onChange={(e) => setExistingFee(e.target.value)}
                            className="mt-1 w-full text-xs border border-slate-300 font-mono font-bold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-xxs font-bold text-slate-500 uppercase">Token Remarks / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Routine consultation, Follow up"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {(() => {
                      const activePreBookedApp = selectedPatientId
                        ? appointments.find(a => a.PatientID === selectedPatientId && a.AppointmentDate === appDate && a.Status !== 3)
                        : undefined;
                      const realTodayStr = new Date().toISOString().split('T')[0];
                      const isFuture = appDate !== realTodayStr;

                      return (
                        <button
                          type="submit"
                          disabled={!selectedPatientId || !canAdd || (isFuture ? !canBookAppointment : !canIssueToken)}
                          className={`w-full mt-2 py-3 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer ${
                            (!canIssueToken && !isFuture) || (!canBookAppointment && isFuture)
                              ? 'bg-slate-400 cursor-not-allowed'
                              : activePreBookedApp
                              ? 'bg-emerald-700 hover:bg-emerald-800'
                              : isFuture
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          <Ticket className="w-4 h-4" />
                          <span>
                            {(!canIssueToken && !isFuture) || (!canBookAppointment && isFuture)
                              ? 'Access Restricted - Permission Denied'
                              : activePreBookedApp
                              ? 'Issue Token (PKR 0 - Prepaid) & Print Slip'
                              : isFuture
                              ? 'Book Future Appointment & Record Fee'
                              : 'Issue Token & Print Slip'}
                          </span>
                        </button>
                      );
                    })()}
                  </form>
                </>
              )}

              {/* MODE 2: NEW PATIENT QUICK REGISTRATION FORM */}
              {tokenIssueMode === 'new_patient' && (
                <form onSubmit={handleIssueTokenForNewPatient} className="space-y-3 pt-1">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium space-y-0.5">
                    <p className="font-bold flex items-center text-emerald-950">
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                      Register New Patient
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Register a new patient profile. After registration, select them to issue an OPD token.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={newPatName}
                      onChange={(e) => setNewPatName(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Mobile Phone Number</label>
                    <input
                      type="text"
                      placeholder="03001234567"
                      value={newPatPhone}
                      onChange={(e) => setNewPatPhone(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Chief Complaint / Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Walk-in Consultation"
                      value={newPatRemarks}
                      onChange={(e) => setNewPatRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!canAdd}
                    className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Patient</span>
                  </button>
                </form>
              )}
            </div>

            {/* Issued Tokens Summary Box for Today */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center">
                  <ListOrdered className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                  Today's Tokens ({tokens.filter(t => t.Date === appDate).length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">{appDate}</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {tokens.filter(t => t.Date === appDate).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-3">No tokens issued for {appDate} yet.</p>
                ) : (
                  tokens.filter(t => t.Date === appDate).map((t) => {
                    const patName = patients.find(p => p.PatientID === t.PatientID)?.PatientName || t.PatientID;
                    return (
                      <div key={`tok-${t.TokenNo}-${t.Shift}`} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                              #{t.TokenNo}
                            </span>
                            <strong className="text-slate-900 font-bold text-xs">{patName}</strong>
                          </div>
                          <span className="text-[10px] text-slate-500">{t.Shift === 1 ? 'Morning' : 'Evening'} Shift</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          t.Status === 1 ? 'bg-amber-100 text-amber-800' :
                          t.Status === 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {t.Status === 1 ? 'Waiting' : t.Status === 2 ? 'Visited' : 'Closed'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT VISIT SUB-TAB VIEW */}
      {activeSubTab === 'patient_visit' && (
        <div className="space-y-3" id="patient-visit-subtab">
          
          {/* Combined Header & Patient Details Bar */}
          <div className="bg-white text-slate-800 p-2 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            {/* Top Row: Title, Search, Dropdown, Visit Date, Nav Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
              {/* Title */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 border border-emerald-100">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Patient Visit & Prescription Desk</h3>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Search Box + Search Button */}
                <div className="flex items-center space-x-1 shrink-0">
                  <div className="relative w-36 sm:w-44">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Token / Patient..."
                      value={pvPatientSearch}
                      onChange={(e) => setPvPatientSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExecutePatientSearch();
                        }
                      }}
                      className="w-full text-[11px] bg-slate-50 text-slate-800 border border-slate-200 rounded-md pl-7 pr-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExecutePatientSearch}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition flex items-center space-x-0.5 cursor-pointer shrink-0"
                  >
                    <Search className="w-3 h-3" />
                    <span>Search</span>
                  </button>
                </div>

                {/* Patient Dropdown */}
                <select
                  value={pvSelectedPatientId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPvSelectedPatientId(val);
                    setPvSelectedHistoryDate('ALL');
                    if (val) {
                      loadPvPatientHistory(val, false);
                    }
                  }}
                  className="text-[11px] bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[180px] sm:max-w-xs truncate"
                >
                  <option value="">-- Select Patient or Token --</option>
                  {pvPatientDropdownOptions.map((p) => (
                    <option key={p.PatientID} value={p.PatientID} className="bg-white text-slate-800">
                      {p.tokenNo ? `[Token #${p.tokenNo}] ` : ''}{p.PatientName} ({p.PatientID}) {p.PhoneMobile ? `- ${p.PhoneMobile}` : ''} {p.isNhc ? '[PHC Archive]' : ''}
                    </option>
                  ))}
                </select>

                {/* Visit Date Input */}
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Visit:</span>
                  <input
                    type="date"
                    required
                    value={pvVisitDate}
                    onChange={(e) => setPvVisitDate(e.target.value)}
                    className="text-[11px] bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold"
                  />
                </div>

                {/* Visit Record Navigation & Action Buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectPreviousVisitRecord}
                    disabled={!pvSelectedPatientId || patientVisitRecords.length === 0 || (currentEditingVisitRecordIndex >= 0 && currentEditingVisitRecordIndex >= patientVisitRecords.length - 1)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-[10px] font-bold rounded-md border border-slate-200 transition flex items-center space-x-0.5 cursor-pointer"
                    title="Previous (Older) Visit Record"
                  >
                    <ChevronLeft className="w-3 h-3 text-slate-500" />
                    <span>Prev Visit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectNextVisitRecord}
                    disabled={!pvSelectedPatientId || patientVisitRecords.length === 0 || (currentEditingVisitRecordIndex === -1 && patientVisitRecords.length === 0)}
                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-[10px] font-bold rounded-md border border-slate-200 transition flex items-center space-x-0.5 cursor-pointer"
                    title="Next (Newer) Visit Record"
                  >
                    <span>Next Visit</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>

                  {selectedPvPatient && (
                    <button
                      type="button"
                      onClick={handleEditRecentVisitRecord}
                      className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-250 text-[10px] font-bold rounded-md transition flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                      title="Edit Recent Patient Visit Record"
                    >
                      <Pencil className="w-3 h-3 text-amber-700" />
                      <span>
                        {currentEditingVisitRecordIndex >= 0
                          ? `Editing Record (${currentEditingVisitRecordIndex + 1}/${patientVisitRecords.length})`
                          : 'Edit Recent Visit'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePrintPreviousRxDirect}
                    disabled={!pvSelectedPatientId || combinedPreviousHistory.length === 0}
                    className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-250 disabled:opacity-40 text-[10px] font-bold rounded-md transition flex items-center space-x-0.5 cursor-pointer shadow-2xs"
                    title="Print Previous Patient Prescription (Rx)"
                  >
                    <Printer className="w-3 h-3 text-emerald-700" />
                    <span>Print Previous Rx</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Selected Patient Details Bar */}
            {selectedPvPatient ? (() => {
              const activeTok = (tokens || []).find(t => t.PatientID === selectedPvPatient.PatientID);
              return (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-500 shadow-2xs">
                      {selectedPvPatient.PatientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="font-extrabold text-xs text-slate-900">{selectedPvPatient.PatientName}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-md font-mono font-bold border border-emerald-200">
                          {selectedPvPatient.PatientID}
                        </span>
                        {activeTok && (
                          <span className="text-[10px] bg-amber-100 text-amber-950 font-black px-2 py-0.2 rounded-md font-mono flex items-center border border-amber-300">
                            <ListOrdered className="w-3 h-3 mr-0.5" />
                            Token #{activeTok.TokenNo} ({activeTok.Shift === 1 ? 'Morning' : 'Evening'})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Gender: <span className="font-bold text-slate-800">{selectedPvPatient.Sex}</span> | Age: <span className="font-bold text-slate-800">{selectedPvPatient.AgeYears} yrs</span> | Mobile: <span className="font-bold text-slate-800">{selectedPvPatient.PhoneMobile}</span> | Guardian: <span className="font-bold text-slate-800">{selectedPvPatient.Father_husband || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                    City: <span className="font-bold text-slate-800">{cities.find(c => c.CityID === selectedPvPatient.CityID)?.CityName || 'Lahore'}</span> | Reg: <span className="font-bold text-slate-800">{selectedPvPatient.RegistrationDate ? selectedPvPatient.RegistrationDate.split('T')[0] : 'N/A'}</span>
                  </div>
                </div>
              );
            })() : (
              <div className="text-[10px] text-slate-500 italic flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                <span>No patient selected. Please search or select a patient from the dropdown above.</span>
              </div>
            )}
          </div>

          {/* 2-COLUMN GRID LAYOUT FOR PREVIOUS HISTORY & CURRENT VISIT */}
          <div className={`grid grid-cols-1 ${hidePreviousHistory ? '' : 'lg:grid-cols-2'} gap-3 items-start`}>
            {/* BOX 1: PREVIOUS HISTORY (WITH VISIT DATE SEPARATE DROPDOWN) */}
            {hidePreviousHistory ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Previous History & Prescriptions</h3>
                    <p className="text-[10px] text-slate-500">Section hidden in side navigation bar</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {pvSelectedPatientId && (
                    <button
                      type="button"
                      onClick={() => setHistoryAlertModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title="Open Previous History Alert Popup"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Alert Popup</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setHidePreviousHistory(false)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show History</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Previous History & Prescriptions</h3>
                  <p className="text-[10px] text-slate-500">Select a visit date from the side navigation to inspect consultation history</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setHidePreviousHistory(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  title="Hide Previous History & Prescriptions"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  <span>Hide History</span>
                </button>

                {pvSelectedPatientId && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHistoryAlertModalOpen(true)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                      title="Open Previous History Alert Popup"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Popup Alert</span>
                    </button>

                    {uniquePvVisitDates.length > 0 && (
                      <select
                        value={pvSelectedHistoryDate || 'ALL'}
                        onChange={(e) => setPvSelectedHistoryDate(e.target.value)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-300 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none transition shadow-2xs"
                        title="Select Visit Date from Previous History"
                      >
                        <option value="ALL">Select Visit Date: All ({uniquePvVisitDates.length})</option>
                        {uniquePvVisitDates.map((d) => (
                          <option key={d} value={d}>
                            Visit Date: {d}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => loadPvPatientHistory(pvSelectedPatientId, true)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                      title="Reload PHC History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content of Previous History */}
            {!pvSelectedPatientId ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Search className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">No Patient Selected</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Please search or select a Patient ID above to view visit history.</p>
              </div>
            ) : isFetchingPvHistory ? (
              <div className="text-center py-6 bg-indigo-50/30 rounded-lg border border-indigo-100 flex flex-col items-center justify-center space-y-1">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-indigo-800">Fetching Previous PHC Patient History...</p>
              </div>
            ) : combinedPreviousHistory.length === 0 ? (
              <div className="text-center py-6 bg-amber-50/50 rounded-lg border border-amber-200/60 p-3">
                <p className="text-xs font-bold text-amber-800">No History Records Found for Patient</p>
                <p className="text-[10px] text-amber-600 mt-0.5">There are no previous consultation records for this patient.</p>
              </div>
            ) : (
              /* FULL-WIDTH HISTORY DETAILS LAYOUT */
              <div className="w-full space-y-2.5 min-h-[200px]">
                {displayedPreviousHistory.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50/50 rounded-lg border border-amber-200 p-3">
                    <p className="text-xs font-bold text-amber-800">No Records Found for Selected Date</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Please select another visit date from the top dropdown.</p>
                  </div>
                ) : (
                    <>
                      {allSymptomsText && (
                        <div className="text-[10px] text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
                          <strong className="font-bold text-slate-900">Diagnosis / Symptoms:</strong> {allSymptomsText}
                        </div>
                      )}

                      {(allLabTestsText || allMedicalReportResultsText) && (
                        <div className="text-[10px] bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-950 font-medium space-y-1.5 shadow-2xs">
                          <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200/80 pb-1">
                            <FileText className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Advised Lab Investigations & Medical Report Results:</span>
                          </div>
                          {allLabTestsText && (
                            <div>
                              <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Advised Lab Tests:</span>
                              <p className="font-mono text-slate-800 font-semibold">{allLabTestsText}</p>
                            </div>
                          )}
                          {allMedicalReportResultsText && (
                            <div className={allLabTestsText ? 'pt-1 border-t border-blue-200/60' : ''}>
                              <span className="text-indigo-900 font-extrabold uppercase text-[8px] tracking-wider block mb-0.5">
                                Medical Report Result (nhc_Patient_history):
                              </span>
                              <div className="bg-white border border-indigo-100 rounded-md p-2 text-indigo-950 font-semibold text-[10px] whitespace-pre-wrap">
                                {allMedicalReportResultsText}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        {groupedRxByDate.map((group) => (
                          <div key={group.date} className="border border-slate-300 rounded-xl bg-white p-2.5 space-y-2 shadow-2xs">
                            {/* Top Row: Date & Item Count Badge + Copy Date Rx Button */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-slate-900 text-xs font-mono flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Visit Date: {group.date}</span>
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  title="Edit this visit record in current visit form"
                                  onClick={() => {
                                    const vMatch = (visits || []).find(v => v.PatientID === pvSelectedPatientId && (v.VisitDate ? v.VisitDate.split('T')[0] : '') === group.date);
                                    const nhcMatch = pvNhcHistory.find(nhc => (nhc.VisitDate ? nhc.VisitDate.split('T')[0] : nhc.date) === group.date);
                                    if (vMatch) handleEditVisit(vMatch);
                                    else if (nhcMatch) handleEditVisit(nhcMatch);
                                    else {
                                      setEditingVisitId(`VIS-${group.date}`);
                                      setPvVisitDate(group.date);
                                      if (group.symptoms) setPvSymptomsDiagnosis(group.symptoms);
                                      if (group.medicalReportResult && group.medicalReportResult !== 'N/A') setPvMedicalReportResult(group.medicalReportResult);
                                      if (group.labTestAdvice && group.labTestAdvice !== 'N/A') setPvLabTestAdvice(group.labTestAdvice);
                                      const cItems = group.clinicalItems.map((i, idx) => ({ id: String(idx + 1), medicineName: i.medicineName, dosage: i.dosage }));
                                      const pItems = group.patentItems.map((i, idx) => ({ id: String(idx + 1), medicineName: i.medicineName, dosage: i.dosage }));
                                      if (cItems.length > 0) setPvClinicalItems(cItems);
                                      if (pItems.length > 0) setPvPatientItems(pItems);
                                      setPvSaveSuccess(`Visit record for ${group.date} loaded for editing.`);
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-250 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                  <Pencil className="w-2.5 h-2.5 text-amber-700" />
                                  <span>Edit Visit</span>
                                </button>
                                <button
                                  type="button"
                                  title="Copy this date's prescription to current visit"
                                  onClick={() => {
                                    const cItems = group.clinicalItems
                                      .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                      .map((i, idx) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                    const pItems = group.patentItems
                                      .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                      .map((i, idx) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                    const cExp = group.clinicalItems.map(i => i.expireDate).find(Boolean) || '';

                                    if (cItems.length > 0) setPvClinicalItems(cItems);
                                    if (pItems.length > 0) setPvPatientItems(pItems);
                                    if (cExp) setPvClinicalMedicineExpireDate(cExp);

                                    if (group.symptoms) {
                                      setPvSymptomsDiagnosis(group.symptoms);
                                    }
                                    if (group.medicalReportResult && group.medicalReportResult !== 'N/A') {
                                      setPvMedicalReportResult(group.medicalReportResult);
                                    }
                                    if (group.labTestAdvice && group.labTestAdvice !== 'N/A') {
                                      setPvLabTestAdvice(group.labTestAdvice);
                                    }

                                    setPvSaveSuccess(`Prescription from ${group.date} copied into current visit form!`);
                                    setTimeout(() => setPvSaveSuccess(''), 4000);
                                  }}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                  <Copy className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>Copy Rx</span>
                                </button>
                                <button
                                  type="button"
                                  title="Print this previous visit prescription"
                                  onClick={() => handlePrintPreviousVisitPrescription(group)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded flex items-center space-x-1 transition cursor-pointer"
                                >
                                  <Printer className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Print Rx</span>
                                </button>
                                <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                                  {group.totalItems} ITEM(S)
                                </span>
                              </div>
                            </div>

                            {/* CLINICAL COMPOUNDED ('C') EXCEL TABLE */}
                            {group.clinicalItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="inline-block bg-amber-100 text-amber-950 font-extrabold text-[9px] uppercase border border-amber-300 px-2 py-0.5 rounded">
                                  Clinical Compounded ('C')
                                </div>
                                <div className="overflow-x-auto border border-amber-300 rounded-lg bg-white shadow-2xs">
                                  <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                      <tr className="bg-amber-100/90 border-b border-amber-300 text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                        <th className="py-1 px-2 w-7 text-center border-r border-amber-200">#</th>
                                        <th className="py-1 px-2 border-r border-amber-200">Clinical Medicine Name</th>
                                        <th className="py-1 px-2">Dosage / Usage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100">
                                      {group.clinicalItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-amber-50/50">
                                          <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-amber-100 bg-amber-50/50">
                                            {idx + 1}
                                          </td>
                                          <td className="py-1 px-2 font-bold text-slate-900 border-r border-amber-100">
                                            {item.medicineName}
                                          </td>
                                          <td className="py-1 px-2 font-mono font-bold text-amber-900">
                                            {item.dosage} {item.expireDate ? `(EXP: ${item.expireDate})` : ''}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* PATENT PRE-PACKAGED ('P') EXCEL TABLE */}
                            {group.patentItems.length > 0 && (
                              <div className="space-y-1">
                                <div className="inline-block bg-emerald-100 text-emerald-950 font-extrabold text-[9px] uppercase border border-emerald-300 px-2 py-0.5 rounded">
                                  Patent Pre-Packaged ('P')
                                </div>
                                <div className="overflow-x-auto border border-emerald-300 rounded-lg bg-white shadow-2xs">
                                  <table className="w-full text-left border-collapse font-sans text-xs">
                                    <thead>
                                      <tr className="bg-emerald-100/90 border-b border-emerald-300 text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                                        <th className="py-1 px-2 w-7 text-center border-r border-emerald-200">#</th>
                                        <th className="py-1 px-2 border-r border-emerald-200">Patent Medicine Name</th>
                                        <th className="py-1 px-2">Dosage / Instructions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-100">
                                      {group.patentItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/50">
                                          <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-emerald-100 bg-emerald-50/50">
                                            {idx + 1}
                                          </td>
                                          <td className="py-1 px-2 font-bold text-slate-900 border-r border-emerald-100">
                                            {item.medicineName}
                                          </td>
                                          <td className="py-1 px-2 font-mono font-bold text-emerald-900">
                                            {item.dosage}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {group.clinicalItems.length === 0 && group.patentItems.length === 0 && (
                              <div className="bg-slate-50 p-2 rounded-lg text-center">
                                <p className="text-slate-400 italic text-[10px]">No structured medicine records found for this date.</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const copiedClinicalItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
                            const copiedPatentItems: Array<{ id: string; medicineName: string; dosage: string }> = [];
                            let cExp = '';

                            const mrResults: string[] = [];
                            const labAdvList: string[] = [];

                            groupedRxByDate.forEach((g) => {
                              if (g.medicalReportResult && g.medicalReportResult !== 'N/A') {
                                if (!mrResults.includes(g.medicalReportResult)) mrResults.push(g.medicalReportResult);
                              }
                              if (g.labTestAdvice && g.labTestAdvice !== 'N/A') {
                                if (!labAdvList.includes(g.labTestAdvice)) labAdvList.push(g.labTestAdvice);
                              }

                              g.clinicalItems.forEach((item) => {
                                if (item.medicineName && item.medicineName !== 'None prescribed' && item.medicineName !== 'None recorded') {
                                  const exists = copiedClinicalItems.some(i => i.medicineName.toLowerCase() === item.medicineName.toLowerCase());
                                  if (!exists) {
                                    copiedClinicalItems.push({
                                      id: String(Date.now() + Math.random()),
                                      medicineName: item.medicineName,
                                      dosage: item.dosage && item.dosage !== 'As directed' ? item.dosage : ''
                                    });
                                  }
                                }
                                if (item.expireDate && !cExp) cExp = item.expireDate;
                              });

                              g.patentItems.forEach((item) => {
                                if (item.medicineName && item.medicineName !== 'None prescribed' && item.medicineName !== 'None recorded') {
                                  const exists = copiedPatentItems.some(i => i.medicineName.toLowerCase() === item.medicineName.toLowerCase());
                                  if (!exists) {
                                    copiedPatentItems.push({
                                      id: String(Date.now() + Math.random()),
                                      medicineName: item.medicineName,
                                      dosage: item.dosage && item.dosage !== 'As directed' ? item.dosage : ''
                                    });
                                  }
                                }
                              });
                            });

                            if (copiedClinicalItems.length > 0) {
                              setPvClinicalItems(copiedClinicalItems);
                            }
                            if (copiedPatentItems.length > 0) {
                              setPvPatientItems(copiedPatentItems);
                            }
                            if (cExp) setPvClinicalMedicineExpireDate(cExp);

                            if (allSymptomsText) {
                              setPvSymptomsDiagnosis(allSymptomsText);
                            }
                            if (mrResults.length > 0) {
                              setPvMedicalReportResult(mrResults.join('\n\n'));
                            }
                            if (labAdvList.length > 0) {
                              setPvLabTestAdvice(labAdvList.join('\n\n'));
                            }
                            setPvSaveSuccess('Selected history medicines & dosages copied into current visit Excel grid!');
                            setTimeout(() => setPvSaveSuccess(''), 4000);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-white" />
                          <span>Copy Selected to Current Prescription</span>
                        </button>
                      </div>
                    </>
                  )}
              </div>
            )}
            </div>
          )}

          {/* BOX 2: CURRENT PATIENT VISIT */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Current Patient Visit & Prescriptions</span>
                    {editingVisitId ? (
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        Editing #{editingVisitId}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        New Visit Entry
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-500">Record consultation & write clinical / patient prescriptions</p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleAddNewVisit}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Visit</span>
                </button>
              </div>
            </div>

            {pvSaveSuccess && (
              <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                  <span>{pvSaveSuccess}</span>
                </div>
                {editingVisitId && (
                  <button
                    type="button"
                    onClick={handleAddNewVisit}
                    className="ml-2 text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded hover:bg-emerald-700 transition"
                  >
                    + Add New Visit
                  </button>
                )}
              </div>
            )}

            {pvSaveError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-200">
                {pvSaveError}
              </div>
            )}

            <form onSubmit={handleSavePatientVisit} className="space-y-2.5">
              {/* 3-COLUMN ROW: Chief Complaints, Medical Reports Results, and Lab Tests Advice */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Chief Complaints / Diagnosis / Symptoms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Chronic Headache, Acidity, High Blood Pressure"
                    value={pvSymptomsDiagnosis}
                    onChange={(e) => setPvSymptomsDiagnosis(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans text-slate-800 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-teal-800 uppercase mb-0.5 flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    Medical Reports Results
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Hb 12.5 g/dl, TLC 7800, LFT Normal, Ultrasound shows mild fatty liver..."
                    value={pvMedicalReportResult}
                    onChange={(e) => setPvMedicalReportResult(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-slate-50/50 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800 resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-purple-900 uppercase flex items-center">
                      <FlaskConical className="w-3.5 h-3.5 mr-1 text-purple-600" />
                      Lab Tests / Investigations Advice
                    </label>
                    {labTests && labTests.length > 0 && (
                      <span className="text-[9px] bg-purple-100 text-purple-900 font-extrabold px-2 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                        {labTests.length} Uploaded Diagnostics Master Tests
                      </span>
                    )}
                  </div>

                  {/* Searchable input for choosing tests uploaded from Diagnostics Upload */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 text-purple-600 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search & select uploaded lab test (e.g. CBC, LFT, Sugar, Ultrasound)..."
                        value={pvLabTestSearch}
                        onChange={(e) => {
                          setPvLabTestSearch(e.target.value);
                          setPvLabTestDropdownOpen(true);
                        }}
                        onFocus={() => setPvLabTestDropdownOpen(true)}
                        className="w-full text-xs pl-8 pr-8 py-1.5 border border-purple-300 bg-purple-50/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-slate-800 placeholder:text-purple-400"
                      />
                      {pvLabTestSearch && (
                        <button
                          type="button"
                          onClick={() => setPvLabTestSearch('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Dropdown List */}
                    {pvLabTestDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-purple-50">
                        <div className="p-1.5 bg-purple-100/80 text-[10px] font-extrabold text-purple-950 flex justify-between items-center sticky top-0 z-10 border-b border-purple-200">
                          <span className="flex items-center">
                            <FlaskConical className="w-3 h-3 mr-1 text-purple-700" />
                            Uploaded Diagnostics Catalog ({filteredCatalogLabTests.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setPvLabTestDropdownOpen(false)}
                            className="text-purple-700 hover:text-purple-950 text-[10px] font-extrabold bg-purple-200 hover:bg-purple-300 px-1.5 py-0.2 rounded cursor-pointer"
                          >
                            Close ✕
                          </button>
                        </div>
                        {filteredCatalogLabTests.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No matching lab test found in Diagnostics Master Upload. Type advice manually in box below.
                          </div>
                        ) : (
                          filteredCatalogLabTests.map((t) => {
                            const isAlreadyAdded = pvLabTestAdvice.toLowerCase().includes(t.TestName.toLowerCase());
                            return (
                              <button
                                key={t.TID}
                                type="button"
                                onClick={() => handleSelectLabTestAdvice(t)}
                                className={`w-full text-left p-2 hover:bg-purple-50 transition flex items-center justify-between text-xs cursor-pointer ${
                                  isAlreadyAdded ? 'bg-purple-50/60' : ''
                                }`}
                              >
                                <div>
                                  <span className="font-bold text-slate-900 block">{t.TestName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">Test ID: {t.TID}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {t.Cost ? (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                                      PKR {t.Cost}
                                    </span>
                                  ) : null}
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow-2xs ${
                                    isAlreadyAdded 
                                      ? 'bg-purple-200 text-purple-900' 
                                      : 'bg-purple-600 text-white hover:bg-purple-700'
                                  }`}>
                                    {isAlreadyAdded ? '✓ Added' : '+ Add Test'}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Test Chips */}
                  {pvLabTestAdvice && (
                    <div className="flex flex-wrap gap-1 py-1">
                      {pvLabTestAdvice.split(',').map(s => s.trim()).filter(Boolean).map((testItem, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-md shadow-2xs"
                        >
                          <span>{testItem}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLabTestAdviceItem(testItem)}
                            className="ml-1 text-purple-500 hover:text-purple-900 font-black p-0.5 focus:outline-none"
                            title="Remove test advice"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    placeholder="e.g. CBC, LFT, Blood Sugar Fasting, Serum Creatinine, Ultrasound Abdomen..."
                    value={pvLabTestAdvice}
                    onChange={(e) => setPvLabTestAdvice(e.target.value)}
                    className="w-full text-xs border border-purple-200 bg-purple-50/20 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono text-slate-800 resize-y"
                  />
                </div>
              </div>

              {/* SEPARATE EXCEL SHEET TABLES FOR CLINICAL MEDICINE & DOSAGE AND PATIENT MEDICINE & DOSAGE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* CLINICAL MEDICINE EXCEL GRID SECTION */}
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                    <label className="text-[11px] font-extrabold text-emerald-900 uppercase flex items-center">
                      <Pill className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                      1. Clinical Medicine (Excel Grid)
                    </label>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Compound Formula</span>
                  </div>

                  {/* Excel Sheet Table for Clinical Medicine */}
                  <div className="overflow-x-auto border border-emerald-300 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-100/80 border-b border-emerald-300 text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                          <th className="py-1.5 px-2 w-8 text-center border-r border-emerald-200">#</th>
                          <th className="py-1.5 px-2 border-r border-emerald-200">Clinical Medicine Name</th>
                          <th className="py-1.5 px-2 border-r border-emerald-200">Dosage / Usage</th>
                          <th className="py-1.5 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 text-xs font-sans">
                        {pvClinicalItems.map((item, index) => (
                          <tr key={item.id} className="hover:bg-emerald-50/50 transition">
                            <td className="py-1 px-1.5 text-center font-bold text-slate-400 text-[10px] border-r border-emerald-100 bg-slate-50/50">
                              {index + 1}
                            </td>
                            <td className="p-1 border-r border-emerald-100">
                              <input
                                type="text"
                                placeholder="e.g. Clinical Compounding Drops"
                                value={item.medicineName}
                                onChange={(e) => updateClinicalItem(item.id, 'medicineName', e.target.value)}
                                className="w-full text-xs font-semibold text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-1 border-r border-emerald-100">
                              <input
                                type="text"
                                placeholder="e.g. 10 drops 3 times daily"
                                value={item.dosage}
                                onChange={(e) => updateClinicalItem(item.id, 'dosage', e.target.value)}
                                className="w-full text-xs font-mono font-medium text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-emerald-400"
                              />
                            </td>
                            <td className="p-1 text-center">
                              {pvClinicalItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeClinicalItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={addClinicalItem}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Clinical Row</span>
                    </button>
                  </div>

                  {/* EXPIRE DATE & WEEKS BOX FOR CLINICAL MEDICINE */}
                  <div className="bg-white p-2 rounded-lg border border-emerald-300 space-y-1.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <label className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          Expire Date:
                        </label>
                        <input
                          type="date"
                          value={pvClinicalMedicineExpireDate}
                          onChange={(e) => setPvClinicalMedicineExpireDate(e.target.value)}
                          className="text-xs font-mono font-bold border border-emerald-400 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 shadow-2xs"
                        />
                        {pvClinicalMedicineExpireDate && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">
                            {getWeeksLabel(pvClinicalMedicineExpireDate)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-emerald-700 font-bold italic">
                        Prints on usage label
                      </span>
                    </div>

                    {/* QUICK WEEK SELECTION BUTTONS */}
                    <div className="flex items-center space-x-1.5 pt-1 border-t border-emerald-100">
                      <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-wide">Expire Weeks:</span>
                      {[1, 2, 3, 4].map((w) => {
                        const isSelected = getWeeksLabel(pvClinicalMedicineExpireDate) === (w === 1 ? '1 Week' : `${w} Weeks`);
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setExpireDateByWeeks(w)}
                            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                            title={`Set expire date to Week ${w} (${w * 7} days from today)`}
                          >
                            Week {w}
                          </button>
                        );
                      })}
                      {pvClinicalMedicineExpireDate && (
                        <button
                          type="button"
                          onClick={() => setPvClinicalMedicineExpireDate('')}
                          className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-800 font-bold ml-auto cursor-pointer"
                          title="Clear expire date"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* PATIENT MEDICINE EXCEL GRID SECTION */}
                <div className="bg-blue-50/40 p-2.5 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-1">
                    <label className="text-[11px] font-extrabold text-blue-900 uppercase flex items-center">
                      <Pill className="w-3.5 h-3.5 mr-1 text-blue-700" />
                      2. Patient Medicine (Excel Grid)
                    </label>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Patent / Commercial</span>
                  </div>

                  {/* Excel Sheet Table for Patient Medicine */}
                  <div className="overflow-x-auto border border-blue-300 rounded-lg bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-100/80 border-b border-blue-300 text-[10px] font-black text-blue-950 uppercase tracking-wider">
                          <th className="py-1.5 px-2 w-8 text-center border-r border-blue-200">#</th>
                          <th className="py-1.5 px-2 border-r border-blue-200">Patient Medicine Name</th>
                          <th className="py-1.5 px-2 border-r border-blue-200">Dosage / Instructions</th>
                          <th className="py-1.5 px-1 w-8 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100 text-xs font-sans">
                        {pvPatientItems.map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50/50 transition">
                            <td className="py-1 px-1.5 text-center font-bold text-slate-400 text-[10px] border-r border-blue-100 bg-slate-50/50">
                              {index + 1}
                            </td>
                            <td className="p-1 border-r border-blue-100">
                              <input
                                type="text"
                                placeholder="e.g. Syrup Cinarizine / Tab Paracetamol"
                                value={item.medicineName}
                                onChange={(e) => updatePatientItem(item.id, 'medicineName', e.target.value)}
                                className="w-full text-xs font-semibold text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-blue-400"
                              />
                            </td>
                            <td className="p-1 border-r border-blue-100">
                              <input
                                type="text"
                                placeholder="e.g. 1 tsp twice daily after meals"
                                value={item.dosage}
                                onChange={(e) => updatePatientItem(item.id, 'dosage', e.target.value)}
                                className="w-full text-xs font-mono font-medium text-slate-900 px-2 py-1 bg-transparent focus:bg-amber-50/30 focus:outline-none rounded border border-transparent focus:border-blue-400"
                              />
                            </td>
                            <td className="p-1 text-center">
                              {pvPatientItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePatientItem(item.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={addPatientItem}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Patient Row</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 SMALL SIMPLE EMPTY TEXTBOXES FOR CHARGES (PKR - MAX 4 DIGITS) */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase whitespace-nowrap">Clinical Medicine (PKR):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder=""
                      value={pvClinicalMedicinePkr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPvClinicalMedicinePkr(val);
                      }}
                      className="w-20 text-xs border border-slate-400 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase whitespace-nowrap">File (PKR):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder=""
                      value={pvFilePkr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPvFilePkr(val);
                      }}
                      className="w-20 text-xs border border-slate-400 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase whitespace-nowrap">Card (PKR):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder=""
                      value={pvCardPkr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPvCardPkr(val);
                      }}
                      className="w-20 text-xs border border-slate-400 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center font-bold text-slate-900 shadow-inner"
                    />
                  </div>

                  <div className="text-xs font-bold text-emerald-950 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-300 font-mono shadow-2xs">
                    Total: PKR {(Number(pvClinicalMedicinePkr) || 0) + (Number(pvFilePkr) || 0) + (Number(pvCardPkr) || 0)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end space-y-1.5 sm:space-y-0 sm:space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddNewVisit}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Add New Visit</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintClinicalMedicineLabel}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold rounded-lg border border-emerald-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                  title="Print 4x8 inch Clinical Medicine roll sticker label"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Print Clinical Label (4"x8" Roll)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A5_VISIT_SLIP')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold rounded-lg border border-amber-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Print Visit Slip (A5)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A4_PRESCRIPTION')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 text-xs font-bold rounded-lg border border-blue-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Print Prescription (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPrintModal('A4_LAB_TESTS')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-950 text-xs font-bold rounded-lg border border-teal-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                  <span>Print Lab Tests (A4)</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingVisitId ? 'Update Visit & Prescription' : 'Save Visit & Prescription'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
      )}

      {/* SEARCH LOADING MODAL POPUP */}
      {isSearchLoadingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-slate-200 flex flex-col items-center space-y-2.5 max-w-xs text-center animate-in fade-in zoom-in-95">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Searching Patient Records</h4>
              <p className="text-[10px] text-slate-500 mt-1">
                Searching database & PHC history for: <span className="font-semibold text-emerald-700">"{pvPatientSearch || pvSelectedPatientId || 'Patient'}"</span>...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT VISIT PRESCRIPTION PRINT MODAL */}
      {pvPrescriptionModalOpen && selectedPvPatient && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:overflow-visible">
          
          {/* Style tag for print paper dimensions */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-patient-doc, #printable-patient-doc * {
                visibility: visible !important;
              }
              #printable-patient-doc {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
              }
              @page {
                size: ${printDocType === 'A5_VISIT_SLIP' ? 'A5 portrait' : 'A4 portrait'};
                margin: 6mm;
              }
            }
          `}</style>

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:max-w-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Toolbar (hidden during print) */}
            <div className="bg-slate-900 text-white p-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs sm:text-sm">
                  Print Patient Document
                </h4>
                <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {selectedPvPatient.PatientName} ({selectedPvPatient.PatientID})
                </span>
              </div>

              {/* DOCUMENT TYPE SELECTOR TABS */}
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 space-x-1">
                <button
                  type="button"
                  onClick={() => setPrintDocType('A5_VISIT_SLIP')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center space-x-1 cursor-pointer ${
                    printDocType === 'A5_VISIT_SLIP'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Patient Visit Slip (A5 Portrait)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintDocType('A4_PRESCRIPTION')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center space-x-1 cursor-pointer ${
                    printDocType === 'A4_PRESCRIPTION'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Prescription Letterhead (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintDocType('A4_LAB_TESTS')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition flex items-center space-x-1 cursor-pointer ${
                    printDocType === 'A4_LAB_TESTS'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Lab Test Advice (A4)</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCleanPrintTab(printDocType)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1 cursor-pointer"
                  title="Open clean printable document in new tab with exact page sizing"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now ({printDocType === 'A5_VISIT_SLIP' ? 'A5 Portrait' : 'A4 Portrait'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPvPrescriptionModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* DOCUMENT PREVIEW CONTAINER */}
            <div className="p-4 sm:p-6 bg-slate-100 min-h-[480px] flex justify-center items-center print:p-0 print:bg-white print:min-h-0">
              <div id="printable-patient-doc" className="w-full bg-white shadow-md print:shadow-none">

                {/* ========================================================================= */}
                {/* OPTION 1: PATIENT VISIT SLIP (A5 SIZE - MATCHING IMAGE 2 EXACTLY) */}
                {/* ========================================================================= */}
                {printDocType === 'A5_VISIT_SLIP' && (
                  <div className="w-full max-w-[148mm] mx-auto p-3 sm:p-4 border border-slate-300 print:border-none text-slate-900 font-sans space-y-2">
                    
                    {/* Slip Header with PHC Logo on Left */}
                    <div className="relative border-b-2 border-teal-800 pb-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" className="w-9 h-9 object-contain shrink-0" />
                        <div className="text-center flex-1">
                          <h2 className="text-center text-sm font-black uppercase text-teal-950 tracking-wide">
                            {clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
                          </h2>
                          <p className="text-[9px] font-extrabold text-rose-700 tracking-wider uppercase">PATIENT VISIT SLIP</p>
                        </div>
                        <div className="w-9 h-9 shrink-0"></div>
                      </div>

                      <div className="mt-1 text-[11px] border-t border-slate-200 pt-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <p className="font-bold text-slate-900 text-xs">
                            Patient Name: <strong className="text-teal-950 uppercase">{selectedPvPatient.PatientName}</strong> &nbsp;
                            <span className="font-semibold text-slate-700 text-[10px]">
                              ({selectedPvPatient.AgeYears}Y / {selectedPvPatient.Sex} {selectedPvPatient.MaritalStatus || ''})
                            </span>
                          </p>
                          <p className="text-slate-700 font-mono text-[10px]">
                            Patient ID: <strong className="text-slate-950">{selectedPvPatient.PatientID}</strong>
                          </p>
                        </div>

                        {/* S/O, D/O, W/O BELOW PATIENT NAME */}
                        <div className="flex justify-between items-baseline pt-0.5 text-[10px]">
                          <p className="font-bold text-slate-800">
                            S/O, D/O, W/O: <span className="font-bold text-slate-950 uppercase">{(selectedPvPatient as any).Father_husband || selectedPvPatient.Father_husband || '____________________'}</span>
                          </p>
                          <div className="text-right font-mono flex items-center space-x-2">
                            <span className="font-bold text-slate-900">Visit Date: <span className="underline">{pvVisitDate}</span></span>
                            <span className="font-bold text-emerald-800">
                              Token #: <span className="bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300 font-bold">{tokens.find(t => t.PatientID === selectedPvPatient.PatientID)?.TokenNo || 1}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Symptoms / Diagnosis */}
                    <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1">
                      <span className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">Symptoms / Diagnosis:</span>
                      <p className="font-bold text-slate-900 uppercase leading-snug">
                        {pvSymptomsDiagnosis || 'N/A'}
                      </p>
                    </div>

                    {/* Medical Report Results */}
                    <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1">
                      <span className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">Medical Report Results:</span>
                      <p className="text-slate-800 font-mono text-[10px] italic whitespace-pre-wrap">
                        {pvMedicalReportResult || 'None Recorded'}
                      </p>
                    </div>

                    {/* Clinical Medicines Grid */}
                    <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1.5">
                      <div className="flex items-center justify-between text-emerald-900 font-bold uppercase text-[10px] tracking-wider">
                        <span className="flex items-center space-x-1">
                          <Pill className="w-3 h-3 text-emerald-700" />
                          <span>1. Clinical / Compounded Medicines</span>
                        </span>
                        {pvClinicalMedicineExpireDate && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-900 font-mono px-1.5 py-0.2 rounded font-bold">
                            EXP: {pvClinicalMedicineExpireDate}
                          </span>
                        )}
                      </div>
                      <div className="bg-emerald-50/30 p-1 rounded-md border border-emerald-200/80 font-mono text-[10px]">
                        {(() => {
                          const validItems = pvClinicalItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
                          if (validItems.length === 0) {
                            return <p className="text-slate-400 italic text-[10px] p-0.5">No clinical medicines prescribed</p>;
                          }
                          return (
                            <table className="w-full text-left border-collapse bg-white rounded border border-emerald-300 text-[10px] shadow-2xs">
                              <thead>
                                <tr className="bg-emerald-100/80 border-b border-emerald-300 text-[9px] font-black text-emerald-950 uppercase tracking-wider">
                                  <th className="py-0.5 px-1.5 w-6 text-center border-r border-emerald-200">#</th>
                                  <th className="py-0.5 px-1.5 border-r border-emerald-200">Clinical Medicine Name</th>
                                  <th className="py-0.5 px-1.5">Dosage / Usage</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-100">
                                {validItems.map((item, idx) => (
                                  <tr key={item.id || idx} className="hover:bg-emerald-50/30">
                                    <td className="py-0.5 px-1 text-center font-bold text-slate-500 text-[9px] border-r border-emerald-100 bg-emerald-50/50">
                                      {idx + 1}
                                    </td>
                                    <td className="py-0.5 px-1.5 font-bold text-slate-900 border-r border-emerald-100">
                                      {item.medicineName.trim() || 'Clinical Compounding Formula'}
                                    </td>
                                    <td className="py-0.5 px-1.5 font-semibold text-emerald-800">
                                      {item.dosage.trim() || 'As directed'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Patent Medicines Grid */}
                    <div className="space-y-0.5 text-[10px] border-b border-slate-200 pb-1.5">
                      <div className="flex items-center justify-between text-blue-900 font-bold uppercase text-[10px] tracking-wider">
                        <span className="flex items-center space-x-1">
                          <Pill className="w-3 h-3 text-blue-700" />
                          <span>2. Patent / Commercial Medicines</span>
                        </span>
                      </div>
                      <div className="bg-blue-50/30 p-1 rounded-md border border-blue-200/80 font-mono text-[10px]">
                        {(() => {
                          const validItems = pvPatientItems.filter((i) => i.medicineName.trim() || i.dosage.trim());
                          if (validItems.length === 0) {
                            return <p className="text-slate-400 italic text-[10px] p-0.5">No patent medicines prescribed</p>;
                          }
                          return (
                            <table className="w-full text-left border-collapse bg-white rounded border border-blue-300 text-[10px] shadow-2xs">
                              <thead>
                                <tr className="bg-blue-100/80 border-b border-blue-300 text-[9px] font-black text-blue-950 uppercase tracking-wider">
                                  <th className="py-0.5 px-1.5 w-6 text-center border-r border-blue-200">#</th>
                                  <th className="py-0.5 px-1.5 border-r border-blue-200">Patient Medicine Name</th>
                                  <th className="py-0.5 px-1.5">Dosage / Instructions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100">
                                {validItems.map((item, idx) => (
                                  <tr key={item.id || idx} className="hover:bg-blue-50/30">
                                    <td className="py-0.5 px-1 text-center font-bold text-slate-500 text-[9px] border-r border-blue-100 bg-blue-50/50">
                                      {idx + 1}
                                    </td>
                                    <td className="py-0.5 px-1.5 font-bold text-slate-900 border-r border-blue-100">
                                      {item.medicineName.trim() || 'Commercial Medicine'}
                                    </td>
                                    <td className="py-0.5 px-1.5 font-semibold text-blue-800">
                                      {item.dosage.trim() || 'As directed'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Advised Lab Investigations */}
                    <div className="text-[10px] border-b border-slate-200 pb-1 flex items-baseline gap-1">
                      <span className="font-bold uppercase text-[9px] text-slate-600 shrink-0">Advised Lab Investigations:</span>
                      <p className="font-mono text-slate-800 font-semibold">{pvLabTestAdvice || 'Routine Homeopathic Treatment'}</p>
                    </div>

                    {/* Charges / Remarks Footer */}
                    <div className="pt-1 border-t-2 border-slate-800 flex justify-between items-center text-[10px]">
                      <div className="font-mono text-[10px]">
                        <span className="font-bold uppercase text-slate-500 mr-1.5">Charges (PKR):</span>
                        <span>Clinical: <strong>{pvClinicalMedicinePkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span>File: <strong>{pvFilePkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span>Card: <strong>{pvCardPkr || 0}</strong></span> &nbsp;|&nbsp; 
                        <span className="text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                          Total: PKR {(Number(pvClinicalMedicinePkr)||0) + (Number(pvFilePkr)||0) + (Number(pvCardPkr)||0)}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[9px] italic">
                        Printed via PHC Clinical CMS
                      </div>
                    </div>

                  </div>
                )}


                {/* ========================================================================= */}
                {/* OPTION 2: PATIENT PRESCRIPTION LETTERHEAD (A4 SIZE - MATCHING IMAGE EXACTLY) */}
                {/* ========================================================================= */}
                {printDocType === 'A4_PRESCRIPTION' && (
                  <div className="w-full max-w-[210mm] mx-auto p-6 sm:p-8 border border-slate-300 print:border-none text-slate-900 font-sans space-y-3 min-h-[297mm] flex flex-col justify-between bg-white">
                    
                    <div className="space-y-3">
                      {/* Top Header Section with PHC Official Logo on Left & Clinic Title */}
                      <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2 gap-2">
                        {/* PHC Official Logo Left */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" className="w-20 h-20 object-contain" />
                        </div>

                        {/* Main Clinic Title */}
                        <div className="text-center flex-1 px-2">
                          <h1 className="font-serif uppercase tracking-tight flex flex-col items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-serif text-red-900 font-black tracking-tight">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</span>
                          </h1>
                          <p className="text-[10px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                          <div className="flex justify-center space-x-8 text-xs font-bold text-slate-800 mt-1">
                            <span>PHC Reg. # <span className="underline decoration-slate-800">R-00188</span></span>
                            <span>PHC License #: ___________________</span>
                          </div>
                        </div>

                        {/* Right Spacer for balanced centering */}
                        <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
                      </div>

                      {/* Patient Details Section */}
                      <div className="text-xs space-y-2 font-sans pt-1 border-b-2 border-teal-800 pb-2.5">
                        {/* ROW 1: Patient Name & Age/Sex & Visit Date */}
                        <div className="grid grid-cols-12 gap-2 items-baseline">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Patient Name:</span>
                            <span className="font-black text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 text-sm">
                              {selectedPvPatient.PatientName}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Age/Sex:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient.AgeYears}Y ({selectedPvPatient.Sex})
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Visit Date:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center font-mono">
                              {pvVisitDate}
                            </span>
                          </div>
                        </div>

                        {/* ROW 2: S/O, D/O, W/O (EXACTLY BELOW PATIENT NAME) & PID Ref # & Token # */}
                        <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">S/O, D/O, W/O:</span>
                            <span className="font-bold text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1">
                              {(selectedPvPatient as any).Father_husband || selectedPvPatient.Father_husband || '_________________________________'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">PID Ref #:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 pl-1">
                              {selectedPvPatient.PatientID}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Token #:</span>
                            <span className="font-mono font-bold text-emerald-800 border-b border-slate-400 flex-1 text-center">
                              #{tokens.find(t => t.PatientID === selectedPvPatient.PatientID)?.TokenNo || 1}
                            </span>
                          </div>
                        </div>

                        {/* ROW 3: Contact & Address */}
                        <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                          <div className="col-span-12 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Contact & Address:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 pl-1 truncate uppercase">
                              {selectedPvPatient.Address || cities.find(c => c.CityID === selectedPvPatient.CityID)?.CityName || 'LAHORE'} {selectedPvPatient.PhoneMobile ? `(Phone: ${selectedPvPatient.PhoneMobile})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prescription Main Body: Left Prescriptions + Right Vitals Sidebar */}
                      <div className="grid grid-cols-12 gap-4 pt-1 min-h-[480px]">
                        
                        {/* Left 8 columns: RX & Prescribed Medicines */}
                        <div className="col-span-8 space-y-3">
                          <div className="grid grid-cols-12 items-center border-b border-slate-200 pb-1">
                            <div className="col-span-2">
                              <span className="text-3xl font-serif italic font-black text-slate-950">Rx</span>
                            </div>
                            <div className="col-span-8 text-center">
                              <h3 className="text-center font-bold text-sm sm:text-base tracking-wider uppercase underline underline-offset-4 font-serif text-red-900">
                                PRESCRIPTION
                              </h3>
                            </div>
                            <div className="col-span-2"></div>
                          </div>

                          {/* Numbered Prescription Medicine Items (Name & Usage) */}
                          <div className="space-y-4 pt-1 text-xs font-sans">
                            {(() => {
                              const parsedItems: Array<{ name: string; usage: string }> = [];

                              const parseBlock = (medStr: string, dosageStr: string) => {
                                const m = medStr.trim();
                                const d = dosageStr.trim();

                                if (!m && !d) return;

                                if (m && !m.includes('\n') && d && !d.includes('\n')) {
                                  parsedItems.push({ name: m, usage: d });
                                  return;
                                }

                                const lines = `${m}\n${d}`.split('\n').map(l => l.trim()).filter(Boolean);
                                let currentItem: { name: string; usage: string } | null = null;

                                for (const line of lines) {
                                  const isNum = /^[0-9]+[\)\.]\s*/.test(line);
                                  const clean = line.replace(/^[0-9]+[\)\.]\s*/, '').trim();

                                  if (isNum) {
                                    if (currentItem) parsedItems.push(currentItem);
                                    if (clean.includes(' - ')) {
                                      const [n, ...u] = clean.split(' - ');
                                      currentItem = { name: n.trim(), usage: u.join(' - ').trim() };
                                    } else {
                                      currentItem = { name: clean, usage: '' };
                                    }
                                  } else if (line.includes(' - ')) {
                                    if (currentItem) parsedItems.push(currentItem);
                                    const [n, ...u] = line.split(' - ');
                                    currentItem = { name: n.trim(), usage: u.join(' - ').trim() };
                                  } else if (currentItem) {
                                    if (currentItem.usage) {
                                      currentItem.usage += ` / ${clean}`;
                                    } else {
                                      currentItem.usage = clean;
                                    }
                                  } else {
                                    currentItem = { name: clean, usage: '' };
                                  }
                                }
                                if (currentItem) parsedItems.push(currentItem);
                              };

                              // Requirement 4: In the A4 letterhead print, use Patent Medicine Prescription only
                              pvPatientItems.forEach((i) => {
                                if (i.medicineName.trim() || i.dosage.trim()) {
                                  parsedItems.push({ name: i.medicineName.trim(), usage: i.dosage.trim() });
                                }
                              });

                              if (parsedItems.length === 0) {
                                parseBlock(pvPatientMedicine, pvPatientDosage);
                              }

                              if (parsedItems.length === 0) {
                                return (
                                  <div className="pt-8 text-slate-300 italic text-center font-sans">
                                    Prescription area (Write medicines name and usage instructions here)
                                  </div>
                                );
                              }

                              return parsedItems.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                  <p className="font-bold text-slate-950 text-xs sm:text-sm uppercase flex items-baseline">
                                    <span className="w-6 text-slate-800 font-mono shrink-0">{idx + 1})</span>
                                    <span>{item.name}</span>
                                  </p>
                                  {item.usage && (
                                    <p className="pl-6 text-[11px] sm:text-xs font-semibold text-slate-700 font-mono uppercase tracking-tight">
                                      {item.usage}
                                    </p>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Right 4 columns: Sidebar for Vitals, Urdu Contacts & Pill Badges */}
                        <div className="col-span-4 border-l border-slate-300 pl-3 space-y-3 text-xs flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">Date:</span>
                                <strong className="text-slate-950 underline decoration-slate-300">{pvVisitDate}</strong>
                              </div>
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">Visit:</span>
                                <span className="text-slate-400">________</span>
                                <span className="text-slate-700 font-medium">Time:</span>
                                <span className="text-slate-400">________</span>
                              </div>
                              <div className="flex justify-between items-baseline border-b border-slate-200 pb-1">
                                <span className="text-slate-700 font-medium">B.P</span>
                                <span className="text-slate-400">____</span>
                                <span className="text-slate-700 font-medium">Pulse</span>
                                <span className="text-slate-400">____</span>
                                <span className="text-slate-700 font-medium">Weight</span>
                                <span className="text-slate-400">____</span>
                              </div>
                            </div>

                            <div className="pt-1 space-y-1">
                              <span className="font-bold text-slate-800 text-[11px] block">Allergies (Any)</span>
                              <div className="border-b border-slate-300 pb-0.5 text-slate-400 italic text-[10px]">____________________</div>
                            </div>

                            <div className="pt-1 space-y-1">
                              <span className="font-bold text-slate-800 text-[11px] block">Findings</span>
                              <div className="text-slate-900 font-semibold text-[11px] min-h-[40px]">
                                ________________________
                              </div>
                            </div>
                          </div>

                          {/* Right Sidebar Urdu Section with Bordered Pill Badges */}
                          <div className="pt-4 border-t border-slate-300 text-right space-y-3 text-[10px]">
                            
                            {/* Clinic Appointment */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-slate-700 font-bold">کلینک اپائنٹمنٹ اور دیگر معلومات کیلئے</p>
                              <div className="inline-block border-2 border-slate-900 text-slate-950 font-mono font-black text-xs px-3 py-0.5 rounded-full mt-0.5">
                                +92 300-4208323
                              </div>
                            </div>

                            {/* Address & Email */}
                            <div className="text-[10px] text-slate-700 pt-2 border-t border-slate-200 space-y-0.5">
                              <p className="font-semibold">10 شالیمار روڈ، گڑھی شاہو، لاہور-39</p>
                              <p className="font-mono">+92 42 3631 2924, 3630 2873</p>
                              <p className="font-mono text-slate-600 text-[9px]">punjabhomeopathic@gmail.com</p>
                            </div>

                          </div>

                        </div>

                      </div>
                    </div>

                    {/* Bottom Footer Section with 2 Doctors & Sunday Closed Banner */}
                    <div className="space-y-2 pt-2 border-t-2 border-slate-900 mt-auto">
                      <div className="grid grid-cols-12 gap-2 text-xs">
                        
                        {/* Doctor Details */}
                        <div className="col-span-12 space-y-0.5 text-[10px] text-center sm:text-left text-red-900">
                          <h5 className="font-black text-red-900 text-base italic font-serif">Dr. Ejaz Ahmad</h5>
                          <p className="text-red-900 font-bold text-xs">Consultant Homeopathic Medical Practitioner</p>
                          <p className="text-red-900 font-semibold text-xs">D.H.M.S (Pak)</p>
                          <p className="text-[10px] text-red-900 font-medium">Registered Homeopathic Medical Practitioner No: <strong className="text-red-900 font-bold">48776</strong></p>
                        </div>

                      </div>

                      {/* Footer Banner */}
                      <div className="grid grid-cols-12 items-center border border-slate-300 rounded overflow-hidden text-[11px] font-sans">
                        <div className="col-span-9 p-1.5 pl-3 italic font-serif text-slate-800 bg-white border-r border-slate-300">
                          Please don't forget to bring your prescription at your next visit.
                        </div>
                        <div className="col-span-3 p-1.5 text-center bg-slate-100 border-l border-slate-300 text-slate-950 font-black uppercase tracking-wider text-xs">
                          Sunday Closed
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ========================================================================= */}
                {/* OPTION 3: CLINICAL LABORATORY TEST ADVICE (A4 LETTERHEAD) */}
                {/* ========================================================================= */}
                {printDocType === 'A4_LAB_TESTS' && (
                  <div className="w-full max-w-[210mm] mx-auto p-6 sm:p-8 border border-slate-300 print:border-none text-slate-900 font-sans space-y-3 min-h-[297mm] flex flex-col justify-between bg-white">
                    <div className="space-y-3">
                      {/* Top Header Section with PHC Official Logo on Left & Clinic Title */}
                      <div className="flex items-center justify-between border-b-2 border-teal-800 pb-2 gap-2">
                        <div className="flex items-center space-x-2 shrink-0">
                          <img src={clinicSettings?.ClinicLogoImage || "/nhc_logo.svg"} alt="PHC Logo" className="w-20 h-20 object-contain" />
                        </div>
                        <div className="text-center flex-1 px-2">
                          <h1 className="font-serif uppercase tracking-tight flex flex-col items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-serif text-red-900 font-black tracking-tight">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}</span>
                          </h1>
                          <p className="text-[10px] font-extrabold text-rose-700 tracking-widest uppercase mt-0.5">HEALING NATURALLY. RESTORING BALANCE.</p>
                          <div className="flex justify-center space-x-8 text-xs font-bold text-slate-800 mt-1">
                            <span>PHC Reg. # <span className="underline decoration-slate-800">R-00188</span></span>
                            <span>PHC License #: ___________________</span>
                          </div>
                        </div>
                        <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
                      </div>

                      {/* Patient Details Section */}
                      <div className="text-xs space-y-2 font-sans pt-1 border-b-2 border-teal-800 pb-2.5">
                        <div className="grid grid-cols-12 gap-2 items-baseline">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Patient Name:</span>
                            <span className="font-black text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1 text-sm">
                              {selectedPvPatient?.PatientName || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Age/Sex:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center">
                              {selectedPvPatient?.AgeYears || 0}Y ({selectedPvPatient?.Sex || 'M'})
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Visit Date:</span>
                            <span className="font-semibold text-slate-900 border-b border-slate-400 flex-1 text-center font-mono">
                              {pvVisitDate}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-baseline pt-0.5">
                          <div className="col-span-6 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">S/O, D/O, W/O:</span>
                            <span className="font-bold text-slate-950 uppercase border-b border-slate-400 flex-1 pl-1">
                              {(selectedPvPatient as any)?.Father_husband || selectedPvPatient?.Father_husband || '_________________________________'}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">PID Ref #:</span>
                            <span className="font-mono font-bold text-slate-950 border-b border-slate-400 flex-1 pl-1">
                              {selectedPvPatient?.PatientID}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-baseline">
                            <span className="font-bold text-slate-900 shrink-0 mr-1.5">Token #:</span>
                            <span className="font-mono font-bold text-emerald-800 border-b border-slate-400 flex-1 text-center">
                              #{tokens.find(t => t.PatientID === selectedPvPatient?.PatientID)?.TokenNo || 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* LAB TEST ADVICE MAIN SECTION */}
                      <div className="pt-2 min-h-[460px] space-y-6">
                        <div className="text-center border-b border-slate-300 pb-2">
                          <h2 className="text-lg font-black font-serif uppercase tracking-widest text-teal-950 underline underline-offset-8">
                            CLINICAL LABORATORY TEST ADVICE
                          </h2>
                          <p className="text-xs text-slate-600 italic mt-1 font-sans">
                            Recommended Diagnostic Investigations & Clinical Pathology Advice
                          </p>
                        </div>

                        {/* Prescribed Lab Tests Table / List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center border-b border-teal-800/30 pb-1">
                            <FlaskConical className="w-4 h-4 mr-1.5 text-teal-700" />
                            Prescribed Diagnostic Tests:
                          </h4>

                          {pvLabTestAdvice && pvLabTestAdvice.trim() !== 'None' ? (
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              {pvLabTestAdvice.split('\n').map(l => l.trim()).filter(Boolean).map((testLine, idx) => (
                                <div key={idx} className="p-3 bg-teal-50/50 rounded-lg border border-teal-200/80 flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-3">
                                    <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="font-bold text-slate-900 text-sm">{testLine}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-teal-800 uppercase bg-teal-100 px-2 py-0.5 rounded">Advice</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-xs italic">
                              No specific lab test advice entered for this visit.
                            </div>
                          )}
                        </div>

                        {/* Sample Collection / Fasting Instructions */}
                        <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 text-xs space-y-1 mt-6">
                          <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">Instructions for Patient:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-amber-950 font-medium text-[11px]">
                            <li>Please get the test performed from an accredited diagnostic laboratory.</li>
                            <li>For fasting blood tests (e.g. Fasting Blood Glucose, Lipid Profile), ensure 10-12 hours overnight fasting.</li>
                            <li>Bring complete diagnostic reports on your next follow-up visit.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer Section with Doctor Signature & Stamp */}
                    <div className="space-y-3 pt-4 border-t-2 border-slate-900 mt-auto">
                      <div className="flex justify-between items-end text-xs">
                        <div className="space-y-0.5 text-[10px] text-red-900">
                          <h5 className="font-black text-red-900 text-base italic font-serif">Dr. Ejaz Ahmad</h5>
                          <p className="text-red-900 font-bold text-xs">Consultant Homeopathic Medical Practitioner</p>
                          <p className="text-red-900 font-semibold text-xs">D.H.M.S (Pak)</p>
                          <p className="text-[10px] text-red-900 font-medium">Registered Homeopathic Medical Practitioner No: <strong className="text-red-900 font-bold">48776</strong></p>
                        </div>

                        {/* Signature Line */}
                        <div className="text-center w-48 space-y-1">
                          <div className="h-12 border-b border-slate-800 flex items-end justify-center pb-1 font-serif italic text-slate-400 text-xs">
                            Doctor's Stamp & Signature
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Consultant Signature</span>
                        </div>
                      </div>

                      {/* Footer Banner */}
                      <div className="grid grid-cols-12 items-center border border-slate-300 rounded overflow-hidden text-[11px] font-sans">
                        <div className="col-span-9 p-1.5 pl-3 italic font-serif text-slate-800 bg-white border-r border-slate-300">
                          Please present this Lab Advice slip to the diagnostic collection center.
                        </div>
                        <div className="col-span-3 p-1.5 text-center bg-slate-100 border-l border-slate-300 text-slate-950 font-black uppercase tracking-wider text-xs">
                          PUNJAB CLINIC
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {activeSubTab === 'book' && (
        <div className="space-y-4" id="patients-view-book">
          {/* Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 flex items-center space-x-2">
                  <span>Booking Appointments Desk</span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Excel Sheet Grid View
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Spreadsheet-wise appointment register showing Patient Name, Mobile Number, and Appointment Fees.
                </p>
              </div>
            </div>

            {/* Search & Shift Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Patient Name, Mobile or App ID..."
                  value={appGridSearch}
                  onChange={(e) => setAppGridSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none w-64 bg-slate-50"
                />
              </div>

              <select
                value={appGridShiftFilter}
                onChange={(e) => setAppGridShiftFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-semibold focus:outline-none"
              >
                <option value="all">All Shifts</option>
                <option value="1">Morning Shift (1)</option>
                <option value="2">Evening Shift (2)</option>
              </select>
            </div>
          </div>

          {appError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100">
              {appError}
            </div>
          )}
          {appSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
              {appSuccess}
            </div>
          )}

          {/* EXCEL SHEET WISE GRID VIEW TABLE */}
          {(() => {
            const filteredApps = appointments.filter((app) => {
              if (appGridShiftFilter !== 'all' && String(app.Shift) !== appGridShiftFilter) return false;
              if (appGridSearch.trim()) {
                const q = appGridSearch.toLowerCase().trim();
                const pat = patients.find((p) => p.PatientID === app.PatientID);
                const matchName = pat?.PatientName?.toLowerCase().includes(q);
                const matchPid = app.PatientID?.toLowerCase().includes(q);
                const matchPhone = pat?.PhoneMobile?.includes(q);
                const matchAppId = app.AppointmentID?.toLowerCase().includes(q);
                if (!matchName && !matchPid && !matchPhone && !matchAppId) return false;
              }
              return true;
            });

            return (
              <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden space-y-0">
                {/* Excel Ribbon Header Bar */}
                <div className="bg-emerald-800 text-white px-4 py-2 flex items-center justify-between text-xs font-bold border-b border-emerald-900">
                  <div className="flex items-center space-x-2 font-mono">
                    <Table className="w-4 h-4 text-emerald-300" />
                    <span>APPOINTMENT_BOOKINGS_SHEET1.XLSX</span>
                  </div>
                  <div className="text-[11px] font-normal text-emerald-100">
                    Total Records: <strong className="text-white font-mono">{filteredApps.length}</strong>
                  </div>
                </div>

                {/* Table Sheet Container */}
                <div className="overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    {/* Excel Column Headers */}
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-12 bg-slate-200/80 font-mono text-slate-600">
                          #
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">
                          Appointment ID & Date
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[200px]">
                          Patient Name
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[140px]">
                          Mobile Number
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[150px] text-right">
                          Appointment Fees
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[120px] text-center">
                          Shift
                        </th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">
                          Remarks / Reason
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[100px] bg-slate-200/50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {filteredApps.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 bg-slate-50">
                            <p className="font-bold text-xs text-slate-600">No appointment records found in sheet.</p>
                            <p className="text-[11px] mt-1">Click the "Add New Appointment" button below to create a new appointment.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredApps.map((app, index) => {
                          const pat = patients.find((p) => p.PatientID === app.PatientID);
                          const isSelected = selectedAppId === app.AppointmentID;
                          const patientNameStr = pat?.PatientName || app.PatientID;
                          const mobileStr = pat?.PhoneMobile || 'N/A';
                          const feeVal = app.FeeCharged || 1500;

                          return (
                            <tr
                              key={`app-${app.AppointmentID}-${index}`}
                              onClick={() => setSelectedAppId(app.AppointmentID)}
                              className={`cursor-pointer transition hover:bg-emerald-50/50 ${
                                isSelected ? 'bg-emerald-100/70 border-y-2 border-emerald-500 font-semibold' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                              }`}
                            >
                              {/* Row Number */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500 bg-slate-100/50 text-[11px] font-bold">
                                {index + 1}
                              </td>

                              {/* Appointment ID & Date */}
                              <td className="py-2.5 px-3 border-r border-slate-200">
                                <div className="font-mono text-slate-900 font-bold">{app.AppointmentID}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{app.AppointmentDate || 'Today'}</div>
                              </td>

                              {/* Patient Name */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-950 text-xs">
                                <div>{patientNameStr}</div>
                                <div className="text-[10px] font-mono text-slate-500 font-normal">PID: {app.PatientID}</div>
                              </td>

                              {/* Mobile Number */}
                              <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-slate-800 text-xs">
                                {mobileStr}
                              </td>

                              {/* Appointment Fees */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-black text-emerald-900 text-xs">
                                PKR {Number(feeVal).toLocaleString()}
                              </td>

                              {/* Shift */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  app.Shift === 1 ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                }`}>
                                  {app.Shift === 1 ? 'Morning' : 'Evening'}
                                </span>
                              </td>

                              {/* Remarks */}
                              <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 text-xs italic truncate max-w-[200px]">
                                {app.Remarks || 'N/A'}
                              </td>

                              {/* Action Buttons */}
                              <td className="py-2.5 px-3 text-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(app)}
                                  title="Edit Appointment"
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointmentAction(app.AppointmentID)}
                                  title="Delete Appointment"
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition cursor-pointer"
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

                {/* BOTTOM ACTION BAR WITH ADD, EDIT, DELETE BUTTONS */}
                <div className="bg-slate-100 p-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 font-medium">
                    {selectedAppId ? (
                      <span className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Selected Row ID: <strong className="font-mono text-slate-900">{selectedAppId}</strong></span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Click any row in the grid above to select, edit, or delete</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* ADD BUTTON */}
                    <button
                      type="button"
                      disabled={!canBookAppointment}
                      onClick={handleOpenAddModal}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{canBookAppointment ? 'Add New Appointment' : 'Add Restricted'}</span>
                    </button>

                    {/* EDIT BUTTON */}
                    <button
                      type="button"
                      disabled={!selectedAppId || !canBookAppointment}
                      onClick={() => {
                        const target = appointments.find((a) => a.AppointmentID === selectedAppId);
                        if (target) handleOpenEditModal(target);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Selected</span>
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      disabled={!selectedAppId || !canCancelAppointment}
                      onClick={() => {
                        if (selectedAppId) handleDeleteAppointmentAction(selectedAppId);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADD APPOINTMENT MODAL */}
          {isAddAppModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-emerald-300" />
                    <span>Add New Patient Appointment</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddAppModalOpen(false)}
                    className="text-emerald-200 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddAppointment} className="p-5 space-y-4">
                  {/* PATIENT SELECTION / SEARCH SECTION */}
                  {!formPatientId ? (
                    <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xxs font-extrabold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                          <Search className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          <span>Search Previous PHC Patient History</span>
                        </label>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {patients.length} Registered Patients
                        </span>
                      </div>

                      {/* Search Box Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Type Patient Name, Patient ID (e.g. P-2026-0001), or Mobile..."
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium shadow-2xs"
                        />
                        {patientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPatientSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Matching Patients Search Results List */}
                      {(() => {
                        if (!patientSearchQuery.trim()) return null;

                        const q = patientSearchQuery.toLowerCase().trim();

                        // Combine active patients and PHC patient history records
                        const candidateMap = new Map<string, {
                          PatientID: string;
                          PatientName: string;
                          PhoneMobile?: string;
                          Father_husband?: string;
                          AgeYears?: number;
                          Sex?: string;
                          isNhcHistory: boolean;
                        }>();

                        patients.forEach(p => {
                          candidateMap.set(p.PatientID, {
                            PatientID: p.PatientID,
                            PatientName: p.PatientName,
                            PhoneMobile: p.PhoneMobile,
                            Father_husband: p.Father_husband,
                            AgeYears: p.AgeYears,
                            Sex: p.Sex,
                            isNhcHistory: false
                          });
                        });

                        const allNhcRecords = [...(nhcPatients || []), ...nhcArchiveList, ...pvNhcHistory];
                        allNhcRecords.forEach(nhc => {
                          if (nhc.PatientID && !candidateMap.has(nhc.PatientID)) {
                            candidateMap.set(nhc.PatientID, {
                              PatientID: nhc.PatientID,
                              PatientName: nhc.PatientName || 'NHC Archive Patient',
                              PhoneMobile: nhc.PhoneMobile || '',
                              Father_husband: nhc.Father_husband || '',
                              AgeYears: nhc.AgeYears || 0,
                              Sex: nhc.Sex || 'Male',
                              isNhcHistory: true
                            });
                          }
                        });

                        const candidates = Array.from(candidateMap.values());
                        const filtered = candidates.filter((p) => {
                          const matchName = p.PatientName?.toLowerCase().includes(q);
                          const matchId = p.PatientID?.toLowerCase().includes(q);
                          const matchPhone = p.PhoneMobile?.includes(q);
                          const matchGuardian = p.Father_husband?.toLowerCase().includes(q);
                          return matchName || matchId || matchPhone || matchGuardian;
                        });

                        return (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Matching Patients in PHC History ({filtered.length})</span>
                            </p>

                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                              {filtered.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs">
                                  No patient history record found matching "{patientSearchQuery}".
                                </div>
                              ) : (
                                filtered.map((p) => (
                                  <div
                                    key={p.PatientID}
                                    onClick={() => {
                                      setFormPatientId(p.PatientID);
                                      setFormPatientName(p.PatientName);
                                      setFormPhoneMobile(p.PhoneMobile || '');
                                      setPatientSearchQuery('');

                                      // If patient is from PHC History archive and not in active patients list, auto import
                                      if (p.isNhcHistory && !patients.some(ap => ap.PatientID === p.PatientID)) {
                                        const importedPat: Patient = {
                                          PatientID: p.PatientID,
                                          PatientName: p.PatientName,
                                          Father_husband: p.Father_husband || 'N/A',
                                          AgeYears: p.AgeYears || 0,
                                          Sex: (p.Sex as any) || 'Male',
                                          MaritalStatus: 'Single',
                                          Occupation: 'N/A',
                                          Address: 'N/A',
                                          CityID: 1,
                                          Country: 'Pakistan',
                                          PhoneMobile: p.PhoneMobile || '03000000000',
                                          RegistrationDate: new Date().toISOString()
                                        };
                                        if (onAddPatient) {
                                          onAddPatient(importedPat);
                                        }
                                      }
                                    }}
                                    className="p-2.5 hover:bg-emerald-50 transition cursor-pointer flex items-center justify-between group"
                                  >
                                    <div>
                                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-900 flex items-center space-x-1.5 flex-wrap">
                                        <span>{p.PatientName}</span>
                                        <span className="text-[10px] font-mono font-normal bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded group-hover:bg-emerald-200 group-hover:text-emerald-900">
                                          {p.PatientID}
                                        </span>
                                        {p.isNhcHistory && (
                                          <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                                            PHC History
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-3 mt-0.5">
                                        <span>Mobile: {p.PhoneMobile || 'N/A'}</span>
                                        {p.AgeYears ? <span>Age: {p.AgeYears}Y ({p.Sex || 'N/A'})</span> : null}
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg transition shadow-2xs flex items-center space-x-1">
                                      <span>Select & Import</span>
                                      <span>&rarr;</span>
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* OR ENTER NEW PATIENT MANUALLY */}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Or Enter New Patient Details (Walk-in / First Visit):
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Patient Name *</label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={formPatientName}
                              onChange={(e) => {
                                setFormPatientName(e.target.value);
                                setFormPatientId('');
                              }}
                              className="mt-0.5 w-full text-xs border border-slate-300 rounded-md p-1.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">Mobile Number *</label>
                            <input
                              type="text"
                              placeholder="03001234567"
                              value={formPhoneMobile}
                              onChange={(e) => setFormPhoneMobile(e.target.value)}
                              className="mt-0.5 w-full text-xs border border-slate-300 rounded-md p-1.5 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SELECTED PREVIOUS PATIENT CARD */
                    <div className="bg-emerald-50 border-2 border-emerald-500 p-3.5 rounded-xl text-xs flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-wider bg-emerald-200 px-2 py-0.5 rounded">
                            Selected Patient
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800">{formPatientId}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-950 text-sm mt-1">{formPatientName}</h4>
                        <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                          Mobile: <strong className="text-slate-900">{formPhoneMobile || 'N/A'}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormPatientId('');
                          setFormPatientName('');
                          setFormPhoneMobile('');
                        }}
                        className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                      >
                        Search / Reselect
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={formAppDate}
                        onChange={(e) => setFormAppDate(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Shift *</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(Number(e.target.value) as 1 | 2)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                      >
                        <option value={1}>Morning Shift</option>
                        <option value={2}>Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Fees (PKR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="1500"
                      value={formFeeCharged}
                      onChange={(e) => setFormFeeCharged(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Remarks / Chief Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Routine consultation, Follow up visit"
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddAppModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Confirm & Save Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT APPOINTMENT MODAL */}
          {editingApp && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-blue-800 text-white p-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-blue-300" />
                    <span>Edit Appointment ({editingApp.AppointmentID})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="text-blue-200 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditAppointment} className="p-5 space-y-4">
                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-xxs font-bold text-slate-500 uppercase">Patient Profile</p>
                    <p className="text-sm font-bold text-slate-900">{formPatientName}</p>
                    <p className="text-xs text-slate-600 font-mono">Patient ID: {editingApp.PatientID}</p>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="03001234567"
                      value={formPhoneMobile}
                      onChange={(e) => setFormPhoneMobile(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={formAppDate}
                        onChange={(e) => setFormAppDate(e.target.value)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase">Shift *</label>
                      <select
                        value={formShift}
                        onChange={(e) => setFormShift(Number(e.target.value) as 1 | 2)}
                        className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold"
                      >
                        <option value={1}>Morning Shift</option>
                        <option value={2}>Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Appointment Fees (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={formFeeCharged}
                      onChange={(e) => setFormFeeCharged(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono font-bold text-emerald-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-600 uppercase">Remarks / Chief Reason</label>
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={formRemarks}
                      onChange={(e) => setFormRemarks(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointmentAction(editingApp.AppointmentID)}
                      className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingApp(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                      >
                        Update Appointment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'queue' && (() => {
        const isTokenCompleted = (tok: Token) => {
          if (tok.Status === 2) return true;
          const realTodayStr = new Date().toISOString().split('T')[0];
          const tokDate = tok.Date || realTodayStr;
          const hasVisit = (visits || []).some(
            (v) => v.PatientID === tok.PatientID && (v.VisitDate ? v.VisitDate.split('T')[0] === tokDate : false)
          );
          const isAppCompleted = (appointments || []).some(
            (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tokDate && a.Status === 4
          );
          return hasVisit || isAppCompleted;
        };

        const morningWaiting = tokens.filter((t) => t.Shift === 1 && t.Status === 1 && !isTokenCompleted(t));
        const eveningWaiting = tokens.filter((t) => t.Shift === 2 && t.Status === 1 && !isTokenCompleted(t));
        const completedList = tokens.filter((t) => isTokenCompleted(t) || t.Status === 2);

        return (
          <div className="space-y-6 animate-fadeIn" id="patients-view-queue">
            
            {/* Waiting List Visual Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Morning Waitlist */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Morning Shift (Shift 1) Active Queue</h4>
                  </div>
                  <span className="text-xxs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {morningWaiting.length} Waiting
                  </span>
                </div>

                <div className="divide-y divide-slate-100 min-h-[200px]">
                  {morningWaiting.length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">No patients currently waiting in Morning Shift queue.</p>
                    </div>
                  ) : (
                    morningWaiting.map((tok, idx) => {
                      const matchedApp = appointments.find(
                        (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === 1
                      );

                      return (
                        <div key={`tok-m1-${tok.TokenNo}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold font-mono flex items-center justify-center shrink-0 shadow-inner">
                              #{tok.TokenNo}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{getPatientName(tok.PatientID)}</p>
                              <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {tok.PatientID} | Mob: {getPatientPhone(tok.PatientID)}</p>
                              
                              <div className="mt-1.5 flex items-center space-x-1.5">
                                <span className="text-xxs font-bold px-1.5 py-0.2 rounded uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Waiting for Consultation
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const pat = patients.find(p => p.PatientID === tok.PatientID);
                                setThermalPrintData({
                                  tokenNo: tok.TokenNo,
                                  patientName: pat ? pat.PatientName : 'Unknown',
                                  patientId: tok.PatientID,
                                  shiftName: 'MORNING SHIFT (08:00 - 14:00)',
                                  date: tok.Date,
                                  fee: matchedApp?.FeeCharged !== undefined ? matchedApp.FeeCharged : (clinicSettings?.OPDFee || 1500),
                                  appId: matchedApp?.AppointmentID || 'N/A',
                                  patientType: getPatientType(tok.PatientID)
                                });
                                setThermalPrintOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Print Ticket</span>
                            </button>
                            <button
                              onClick={() => handleCallPatient(tok)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center transition"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span>Call Patient</span>
                            </button>
                            <button
                              onClick={() => handleCancelQueue(tok)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold rounded flex items-center transition"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Evening Shift */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Evening Shift (Shift 2) Active Queue</h4>
                  </div>
                  <span className="text-xxs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    {eveningWaiting.length} Waiting
                  </span>
                </div>

                <div className="divide-y divide-slate-100 min-h-[200px]">
                  {eveningWaiting.length === 0 ? (
                    <div className="p-12 text-center">
                      <CheckCircle2 className="w-8 h-8 text-indigo-500/40 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">No patients currently waiting in Evening Shift queue.</p>
                    </div>
                  ) : (
                    eveningWaiting.map((tok, idx) => {
                      const matchedApp = appointments.find(
                        (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === 2
                      );

                      return (
                        <div key={`tok-e2-${tok.TokenNo}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3.5">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold font-mono flex items-center justify-center shrink-0 shadow-inner">
                              #{tok.TokenNo}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{getPatientName(tok.PatientID)}</p>
                              <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {tok.PatientID} | Mob: {getPatientPhone(tok.PatientID)}</p>
                              
                              <div className="mt-1.5 flex items-center space-x-1.5">
                                <span className="text-xxs font-bold px-1.5 py-0.2 rounded uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  Waiting for Consultation
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const pat = patients.find(p => p.PatientID === tok.PatientID);
                                setThermalPrintData({
                                  tokenNo: tok.TokenNo,
                                  patientName: pat ? pat.PatientName : 'Unknown',
                                  patientId: tok.PatientID,
                                  shiftName: 'EVENING SHIFT (14:00 - 20:00)',
                                  date: tok.Date,
                                  fee: matchedApp?.FeeCharged !== undefined ? matchedApp.FeeCharged : (clinicSettings?.OPDFee || 1500),
                                  appId: matchedApp?.AppointmentID || 'N/A',
                                  patientType: getPatientType(tok.PatientID)
                                });
                                setThermalPrintOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Print Ticket</span>
                            </button>
                            <button
                              onClick={() => handleCallPatient(tok)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center transition"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span>Call Patient</span>
                            </button>
                            <button
                              onClick={() => handleCancelQueue(tok)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold rounded flex items-center transition"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Dedicated Section: Completed Visits & Checked Patients */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-100 bg-emerald-50/70 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Completed Visits & Doctor Consultations</h4>
                    <p className="text-xxs text-slate-500 font-medium">Patients checked by doctor & issued prescriptions</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs">
                  {completedList.length} Completed Visit{completedList.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 min-h-[120px]">
                {completedList.length === 0 ? (
                  <div className="p-8 text-center">
                    <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">No completed visits recorded yet for today.</p>
                    <p className="text-xxs text-slate-400 mt-0.5">When doctor saves a visit assessment or prescription in EMR, patients automatically move to this completed list.</p>
                  </div>
                ) : (
                  completedList.map((tok, idx) => {
                    const matchedApp = appointments.find(
                      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date
                    );
                    const matchedVisit = (visits || []).find(
                      (v) => v.PatientID === tok.PatientID && (v.VisitDate ? v.VisitDate.split('T')[0] === tok.Date : false)
                    );

                    return (
                      <div key={`tok-comp-${tok.TokenNo}-${idx}`} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 hover:bg-slate-50/50 transition">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold font-mono flex items-center justify-center shrink-0 shadow-xs">
                            #{tok.TokenNo}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-slate-900 truncate">{getPatientName(tok.PatientID)}</p>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Checked & Prescribed</span>
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 font-mono mt-0.5">
                              ID: {tok.PatientID} | Mob: {getPatientPhone(tok.PatientID)} | Shift {tok.Shift === 1 ? 'Morning' : 'Evening'}
                            </p>
                            {matchedVisit && (
                              <p className="text-xxs font-medium text-slate-600 mt-1 truncate max-w-md bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <span className="font-bold text-emerald-700">Rx/Consultation: </span>
                                {matchedVisit.SymptomsDiagnosis || 'Prescription recorded'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubTab('patient_visit');
                              setPvPatientSearch(tok.PatientID);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xxs font-bold rounded flex items-center transition border border-emerald-200"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            <span>View Visit Record</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const pat = patients.find(p => p.PatientID === tok.PatientID);
                              setThermalPrintData({
                                tokenNo: tok.TokenNo,
                                patientName: pat ? pat.PatientName : 'Unknown',
                                patientId: tok.PatientID,
                                shiftName: tok.Shift === 1 ? 'MORNING SHIFT (08:00 - 14:00)' : 'EVENING SHIFT (14:00 - 20:00)',
                                date: tok.Date,
                                fee: matchedApp?.FeeCharged !== undefined ? matchedApp.FeeCharged : (clinicSettings?.OPDFee || 1500),
                                appId: matchedApp?.AppointmentID || 'N/A',
                                patientType: getPatientType(tok.PatientID)
                              });
                              setThermalPrintOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Print Ticket</span>
                          </button>
                          <button
                            onClick={() => speakVoice(tok)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xxs font-bold rounded flex items-center transition border border-blue-200"
                            title="Repeat the calling voice announcement"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            <span>Repeat Voice</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        );
      })()}

      {/* Large Screen LED Live Queue Status display */}
      {activeSubTab === 'status' && (
        <div className="space-y-4">
          {/* Quick controls panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">LCD Shift Filter:</span>
              <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
                <button
                  type="button"
                  onClick={() => setFullscreenShift('both')}
                  className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition ${fullscreenShift === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Both Shifts
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenShift('morning')}
                  className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition ${fullscreenShift === 'morning' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Morning Only
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenShift('evening')}
                  className={`px-3 py-1 text-xxs font-extrabold uppercase rounded transition ${fullscreenShift === 'evening' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Evening Only
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFullScreenMode(true);
                // Attempt native browser fullscreen on container
                const container = document.getElementById('patients-large-screen-container');
                if (container && container.requestFullscreen) {
                  container.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-lg flex items-center justify-center shadow-lg transition"
            >
              <Users className="w-4 h-4 mr-2" />
              Go Full LCD Screen Mode
            </button>
          </div>

          <div className="bg-slate-950 text-white p-8 rounded-2xl border-4 border-slate-800 shadow-2xl space-y-6 animate-fadeIn" id="patients-large-screen-container">
            {/* Header for TV screen */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-400 font-sans uppercase animate-pulse">PCMS OPD Live Queue Display</h1>
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase mt-1">Please watch the screen for your Token number. Kindly keep your receipts ready.</p>
              </div>
              <div className="text-right">
                <span className="text-sm md:text-lg font-mono font-bold bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-emerald-400">
                  Live Server Clock: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Shift Grid */}
            <div className="grid grid-cols-1 gap-8" style={{
              gridTemplateColumns: fullscreenShift === 'both' ? 'repeat(2, minmax(0, 1fr))' : '1fr'
            }}>
              {/* Morning Shift Column */}
              {(fullscreenShift === 'both' || fullscreenShift === 'morning') && (
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-base font-black tracking-wide text-amber-500 uppercase">Morning Shift (08:00 - 14:00)</span>
                    <span className="text-xxs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded">
                      {tokens.filter(t => t.Shift === 1 && t.Status === 1).length} Patients Remaining
                    </span>
                  </div>

                  {/* Currently Consulting */}
                  <div className="bg-slate-950 p-5 rounded-xl border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-[9px] tracking-widest px-3 py-1 uppercase">CURRENTLY IN ASSESSMENT</div>
                    {tokens.filter(t => t.Shift === 1 && t.Status === 2).length === 0 ? (
                      <div className="py-6">
                        <span className="text-2xl font-black text-slate-600 font-mono">-- NONE --</span>
                        <p className="text-xxs text-slate-500 font-semibold mt-1">Doctor ready for next token...</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <span className="text-5xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                          #{tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.TokenNo).pop()}
                        </span>
                        <span className="text-sm font-extrabold text-slate-200 uppercase block">
                          {getPatientName(tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Waiting Pool */}
                  <div className="space-y-3">
                    <span className="text-xxs font-black tracking-widest text-slate-400 uppercase">WAITING QUEUE (NEXT UP)</span>
                    {tokens.filter(t => t.Shift === 1 && t.Status === 1).length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center py-6">No patients in Morning waitlist.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5">
                        {tokens.filter(t => t.Shift === 1 && t.Status === 1).map((tok, idx) => (
                          <div key={`tok-w1-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                            <span className="text-lg font-black text-blue-400">#{tok.TokenNo}</span>
                            <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evening Shift Column */}
              {(fullscreenShift === 'both' || fullscreenShift === 'evening') && (
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-base font-black tracking-wide text-indigo-400 uppercase">Evening Shift (14:00 - 20:00)</span>
                    <span className="text-xxs bg-slate-800 text-slate-300 font-bold px-2.5 py-1 rounded">
                      {tokens.filter(t => t.Shift === 2 && t.Status === 1).length} Patients Remaining
                    </span>
                  </div>

                  {/* Currently Consulting */}
                  <div className="bg-slate-950 p-5 rounded-xl border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-[9px] tracking-widest px-3 py-1 uppercase">CURRENTLY IN ASSESSMENT</div>
                    {tokens.filter(t => t.Shift === 2 && t.Status === 2).length === 0 ? (
                      <div className="py-6">
                        <span className="text-2xl font-black text-slate-600 font-mono">-- NONE --</span>
                        <p className="text-xxs text-slate-500 font-semibold mt-1">Doctor ready for next token...</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-1">
                        <span className="text-5xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                          #{tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.TokenNo).pop()}
                        </span>
                        <span className="text-sm font-extrabold text-slate-200 uppercase block">
                          {getPatientName(tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Waiting Pool */}
                  <div className="space-y-3">
                    <span className="text-xxs font-black tracking-widest text-slate-400 uppercase">WAITING QUEUE (NEXT UP)</span>
                    {tokens.filter(t => t.Shift === 2 && t.Status === 1).length === 0 ? (
                      <p className="text-xs text-slate-500 font-semibold text-center py-6">No patients in Evening waitlist.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5">
                        {tokens.filter(t => t.Shift === 2 && t.Status === 1).map((tok, idx) => (
                          <div key={`tok-w2-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                            <span className="text-lg font-black text-indigo-400">#{tok.TokenNo}</span>
                            <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full LCD Screen Overlay Modal */}
      {isFullScreenMode && (
        <div className="fixed inset-0 bg-slate-950 text-white p-12 z-[99999] flex flex-col justify-between overflow-y-auto font-sans" id="full-lcd-screen">
          {/* Controls overlay in top corner */}
          <div className="absolute top-4 right-4 flex items-center space-x-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shadow-2xl z-[100000]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shift Filter:</span>
            <select
              value={fullscreenShift}
              onChange={(e) => setFullscreenShift(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xxs font-bold text-emerald-400 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="both">Both Shifts</option>
              <option value="morning">Morning Shift Only</option>
              <option value="evening">Evening Shift Only</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setIsFullScreenMode(false);
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-100 text-xxs font-black px-3.5 py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
            >
              Close Fullscreen
            </button>
          </div>

          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-emerald-400 font-sans uppercase animate-pulse">PCMS OPD Live Queue Display</h1>
              <p className="text-xs md:text-sm font-bold tracking-wide text-slate-400 uppercase mt-2">Please watch the screen for your Token number. Kindly keep your receipts ready.</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg md:text-2xl font-mono font-bold bg-slate-900 border border-slate-800 px-6 py-3 rounded-xl text-emerald-400">
                Live Server Clock: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="my-8 flex-1 grid grid-cols-1 gap-12" style={{
            gridTemplateColumns: fullscreenShift === 'both' ? 'repeat(2, minmax(0, 1fr))' : '1fr'
          }}>
            {/* Morning Shift Column */}
            {(fullscreenShift === 'both' || fullscreenShift === 'morning') && (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xl font-black tracking-wide text-amber-500 uppercase">Morning Shift (08:00 - 14:00)</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded">
                    {tokens.filter(t => t.Shift === 1 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                {/* Currently Consulting */}
                <div className="bg-slate-950 p-10 rounded-2xl border-4 border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden flex-1 min-h-[200px]">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-xs tracking-widest px-6 py-2 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 2).length === 0 ? (
                    <div className="py-12">
                      <span className="text-4xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-sm text-slate-500 font-semibold mt-2">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-3">
                      <span className="text-7xl md:text-8xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-200 uppercase block tracking-wider truncate max-w-full">
                        {getPatientName(tokens.filter(t => t.Shift === 1 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waiting Pool */}
                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 1 && t.Status === 1).length === 0 ? (
                    <p className="text-sm text-slate-500 font-semibold text-center py-6">No patients in Morning waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {tokens.filter(t => t.Shift === 1 && t.Status === 1).slice(0, 18).map((tok, idx) => (
                        <div key={`tok-fs1-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center font-mono">
                          <span className="text-xl md:text-2xl font-black text-blue-400 block">#{tok.TokenNo}</span>
                          <p className="text-[9px] text-slate-400 font-sans truncate font-bold mt-1.5 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evening Shift Column */}
            {(fullscreenShift === 'both' || fullscreenShift === 'evening') && (
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xl font-black tracking-wide text-indigo-400 uppercase">Evening Shift (14:00 - 20:00)</span>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded">
                    {tokens.filter(t => t.Shift === 2 && t.Status === 1).length} Patients Remaining
                  </span>
                </div>

                {/* Currently Consulting */}
                <div className="bg-slate-950 p-10 rounded-2xl border-4 border-emerald-500/50 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden flex-1 min-h-[200px]">
                  <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 font-black text-xs tracking-widest px-6 py-2 uppercase">CURRENTLY IN ASSESSMENT</div>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 2).length === 0 ? (
                    <div className="py-12">
                      <span className="text-4xl font-black text-slate-600 font-mono">-- NONE --</span>
                      <p className="text-sm text-slate-500 font-semibold mt-2">Doctor ready for next token...</p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-3">
                      <span className="text-7xl md:text-8xl font-black text-emerald-400 font-mono tracking-wider animate-bounce block">
                        #{tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.TokenNo).pop()}
                      </span>
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-200 uppercase block tracking-wider truncate max-w-full">
                        {getPatientName(tokens.filter(t => t.Shift === 2 && t.Status === 2).map(t => t.PatientID).pop() || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waiting Pool */}
                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase block">WAITING QUEUE (NEXT UP)</span>
                  {tokens.filter(t => t.Shift === 2 && t.Status === 1).length === 0 ? (
                    <p className="text-sm text-slate-500 font-semibold text-center py-6">No patients in Evening waitlist.</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                      {tokens.filter(t => t.Shift === 2 && t.Status === 1).slice(0, 18).map((tok, idx) => (
                        <div key={`tok-fs2-${tok.TokenNo}-${idx}`} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center font-mono">
                          <span className="text-xl md:text-2xl font-black text-indigo-400 block">#{tok.TokenNo}</span>
                          <p className="text-[9px] text-slate-400 font-sans truncate font-bold mt-1.5 uppercase">{getPatientName(tok.PatientID)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-slate-600 text-xxs font-bold tracking-widest border-t border-slate-900 pt-4 uppercase shrink-0">
            PHC Health Clinic CMS • Powered by AI Studio Build • Press Close to exit full LCD view
          </div>
        </div>
      )}

      {/* Thermal Printer Ticket Modal (Black & White high contrast, dashed separators, compact roll style) */}
      {thermalPrintOpen && thermalPrintData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:w-full print:rounded-none">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
              <span className="text-xs font-bold text-slate-700">OPD Thermal Ticket Issued</span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={handleCleanThermalTokenPrint}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded-lg flex items-center shadow-md transition cursor-pointer"
                  title={`Direct print thermal ticket (+2in width)`}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  <span>Print Ticket ({clinicSettings?.ThermalPrinterName || 'Thermal Printer'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThermalPrintOpen(false)}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xxs rounded"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Thermal Print Receipt Frame */}
            <div 
              className="p-6 bg-white font-mono text-[11px] text-black space-y-4 overflow-y-auto flex-1 select-all mx-auto" 
              id="thermal-receipt"
              style={{ width: `calc(${clinicSettings?.ThermalPaperWidth || '60mm'} + 2in)` }}
            >
              
              {/* Header */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
                <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest bg-white py-0.5 border border-black mb-1 rounded">
                  TICKET SIZE: {clinicSettings?.ThermalPaperWidth || '60mm'} (+2in PRINT WIDTH)
                </p>
                <h3 className="font-extrabold text-sm uppercase">{clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC (PHC)'}</h3>
                <p className="text-[9px] uppercase font-bold">OPD Consultation Token</p>
                <p className="text-[9px]">{clinicSettings?.ClinicAddress || '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan'}</p>
                <p className="text-[9px]">Tel: {clinicSettings?.PhoneMobile || '+92-300-4208323'}</p>
              </div>

              {/* Big Token Number Circle */}
              <div className="text-center py-2 border-b border-dashed border-black space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">OPD TOKEN NUMBER</span>
                <span className="text-5xl font-black tracking-widest block">
                  #{thermalPrintData.tokenNo}
                </span>
                <span className="text-[9px] font-bold uppercase block tracking-wider mt-1 bg-white text-black border border-black px-2 py-0.5 rounded-sm mx-auto w-max">
                  {thermalPrintData.shiftName}
                </span>
              </div>

              {/* Patient Details */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-black">
                <div className="flex justify-between items-center bg-white p-1 rounded border border-dashed border-black/30">
                  <span className="font-bold">PATIENT TYPE:</span>
                  <span className="font-black text-xs uppercase px-1.5 py-0.5 rounded border border-black bg-white text-black">
                    {thermalPrintData.patientType || 'New Patient'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT ID:</span>
                  <span className="font-extrabold">{thermalPrintData.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT NAME:</span>
                  <span className="font-extrabold uppercase truncate max-w-[150px]">{thermalPrintData.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>OPD FEE:</span>
                  <span className="font-extrabold">
                    {thermalPrintData.fee === 0 ? (
                      <span>PKR 0 (PREPAID)</span>
                    ) : (
                      `PKR ${thermalPrintData.fee !== undefined && thermalPrintData.fee !== null ? thermalPrintData.fee : (clinicSettings?.OPDFee || 1500)}`
                    )}
                  </span>
                </div>
                {thermalPrintData.feeNote && (
                  <div className="text-[9px] font-bold text-black italic text-right uppercase">
                    ★ {thermalPrintData.feeNote}
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TICKET DATE:</span>
                  <span>{thermalPrintData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>APPOINTMENT ID:</span>
                  <span>{thermalPrintData.appId}</span>
                </div>
                {thermalPrintData.remarks && (
                  <div className="flex justify-between">
                    <span>REMARKS:</span>
                    <span className="truncate max-w-[140px] font-semibold">{thermalPrintData.remarks}</span>
                  </div>
                )}
              </div>

              {/* Thermal Footnotes */}
              <div className="text-center space-y-1 text-[9px] pt-1">
                <p className="font-bold uppercase tracking-wider">Please wait for your call.</p>
                <p>Kindly keep this ticket with you.</p>
                <p className="mt-1 text-[8px] font-sans font-semibold text-slate-400">Software designed by AI Studio Build</p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Patient Previous Visit History Alert Popup Modal */}
      {historyAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                  <History className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Patient Previous Visit History & Prescriptions Alert</span>
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    {selectedPvPatient
                      ? (groupedRxByDate.length > 0 
                          ? `Found ${groupedRxByDate.length} previous visit date(s) for ${selectedPvPatient.PatientName}`
                          : `No previous visit history found for ${selectedPvPatient.PatientName}`)
                      : 'Search or select a patient to view previous history'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryAlertModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info Bar */}
            {selectedPvPatient && (
              <div className="bg-indigo-50/80 p-3 border-b border-indigo-100 flex flex-wrap items-center justify-between text-xs shrink-0 gap-2">
                <div>
                  <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block">Patient Profile</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedPvPatient.PatientName}</span>
                    <span className="font-mono text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-bold">
                      ID: {selectedPvPatient.PatientID}
                    </span>
                    {(() => {
                      const activeTok = (tokens || []).find(t => t.PatientID === selectedPvPatient.PatientID);
                      return activeTok ? (
                        <span className="font-mono text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                          Token #{activeTok.TokenNo}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <p>Age/Sex: <span className="font-bold text-slate-800">{selectedPvPatient.AgeYears} yrs / {selectedPvPatient.Sex}</span></p>
                  <p>Phone: <span className="font-mono font-bold text-slate-800">{selectedPvPatient.PhoneMobile || 'N/A'}</span></p>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {!selectedPvPatient ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Patient Selected</p>
                  <p className="text-xs text-slate-400 mt-1">Please enter a Token # or Patient ID in the search box to view previous visit history.</p>
                </div>
              ) : isFetchingPvHistory ? (
                <div className="text-center py-8 bg-indigo-50/40 rounded-xl border border-indigo-100 flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-indigo-900">Loading Patient Previous Visit History & Prescriptions...</p>
                </div>
              ) : groupedRxByDate.length > 0 ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">
                        Most Recent Visit Record ({groupedRxByDate[0]?.date || 'N/A'})
                      </p>
                      <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                        Displaying patient's latest visit record. Total recorded visits on profile: {groupedRxByDate.length}.
                      </p>
                    </div>
                  </div>

                  {(allLabTestsText || allMedicalReportResultsText) && (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-950 text-xs font-semibold space-y-1.5 shadow-2xs">
                      <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200 pb-1">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Advised Lab Investigations & Medical Report Results:</span>
                      </div>
                      {allLabTestsText && (
                        <div>
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Advised Lab Tests:</span>
                          <p className="font-mono text-slate-800 font-bold text-xs">{allLabTestsText}</p>
                        </div>
                      )}
                      {allMedicalReportResultsText && (
                        <div className={allLabTestsText ? 'pt-1.5 border-t border-blue-200/60' : ''}>
                          <span className="text-indigo-900 font-extrabold uppercase text-[9px] tracking-wider block mb-0.5">
                            Medical Report Result (nhc_Patient_history):
                          </span>
                          <div className="bg-white border border-indigo-100 rounded-lg p-2.5 text-indigo-950 font-semibold text-xs whitespace-pre-wrap">
                            {allMedicalReportResultsText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                    Recent Prescribed Medicines (Rx) Record:
                  </h4>

                  <div className="space-y-3">
                    {groupedRxByDate.slice(0, 1).map((group) => (
                      <div key={group.date} className="border border-slate-900 rounded-xl bg-white p-3 space-y-2.5 shadow-2xs">
                        {/* Top Row: Date & Item Count Badge + Copy & Print Rx Buttons */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 text-xs font-mono">Recent Visit Date: {group.date}</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handlePrintPreviousVisitPrescription(group);
                                setHistoryAlertModalOpen(false);
                              }}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Printer className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Print Rx</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cItems = group.clinicalItems
                                  .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                  .map((i, idx) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                const pItems = group.patentItems
                                  .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                                  .map((i, idx) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                                const cExp = group.clinicalItems.map(i => i.expireDate).find(Boolean) || '';

                                if (cItems.length > 0) setPvClinicalItems(cItems);
                                if (pItems.length > 0) setPvPatientItems(pItems);
                                if (cExp) setPvClinicalMedicineExpireDate(cExp);

                                if (group.symptoms) {
                                  setPvSymptomsDiagnosis(group.symptoms);
                                }
                                if (group.medicalReportResult && group.medicalReportResult !== 'N/A') {
                                  setPvMedicalReportResult(group.medicalReportResult);
                                }
                                if (group.labTestAdvice && group.labTestAdvice !== 'N/A') {
                                  setPvLabTestAdvice(group.labTestAdvice);
                                }

                                setPvSaveSuccess(`Prescription from ${group.date} copied into current visit form!`);
                                setHistoryAlertModalOpen(false);
                                setTimeout(() => setPvSaveSuccess(''), 4000);
                              }}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded flex items-center space-x-1 cursor-pointer transition"
                            >
                              <Copy className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Copy This Date Rx</span>
                            </button>
                            <span className="text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                              {group.totalItems} ITEM(S)
                            </span>
                          </div>
                        </div>

                        {group.symptoms && (
                          <div className="text-[10px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-medium">
                            <strong className="text-slate-900">Diagnosis / Symptoms:</strong> {group.symptoms}
                          </div>
                        )}

                        {(group.labTestAdvice && group.labTestAdvice !== 'N/A' || group.medicalReportResult && group.medicalReportResult !== 'N/A') && (
                          <div className="text-[10px] bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-950 font-medium space-y-1">
                            <div className="flex items-center space-x-1.5 font-bold text-blue-900 border-b border-blue-200/60 pb-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Advised Lab Investigations & Medical Report Results:</span>
                            </div>
                            {group.labTestAdvice && group.labTestAdvice !== 'N/A' && (
                              <div>
                                <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block">Advised Lab Tests:</span>
                                <p className="font-mono text-slate-800 font-semibold">{group.labTestAdvice}</p>
                              </div>
                            )}
                            {group.medicalReportResult && group.medicalReportResult !== 'N/A' && (
                              <div>
                                <span className="text-indigo-900 font-bold uppercase text-[8px] tracking-wider block">Medical Report Result (nhc_Patient_history):</span>
                                <div className="bg-white border border-indigo-100 rounded p-1.5 text-indigo-950 font-semibold text-[10px] whitespace-pre-wrap mt-0.5">
                                  {group.medicalReportResult}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CLINICAL COMPOUNDED ('C') EXCEL TABLE */}
                        {group.clinicalItems.length > 0 && (
                          <div className="space-y-1">
                            <div className="inline-block bg-amber-100 text-amber-950 font-extrabold text-[9px] uppercase border border-amber-300 px-2 py-0.5 rounded">
                              Clinical Compounded ('C')
                            </div>
                            <div className="overflow-x-auto border border-amber-300 rounded-lg bg-white shadow-2xs">
                              <table className="w-full text-left border-collapse font-sans text-xs">
                                <thead>
                                  <tr className="bg-amber-100/90 border-b border-amber-300 text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                    <th className="py-1 px-2 w-7 text-center border-r border-amber-200">#</th>
                                    <th className="py-1 px-2 border-r border-amber-200">Clinical Medicine Name</th>
                                    <th className="py-1 px-2">Dosage / Usage</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                  {group.clinicalItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-amber-50/50">
                                      <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-amber-100 bg-amber-50/50">
                                        {idx + 1}
                                      </td>
                                      <td className="py-1 px-2 font-bold text-slate-900 border-r border-amber-100">
                                        {item.medicineName}
                                      </td>
                                      <td className="py-1 px-2 font-mono font-bold text-amber-900">
                                        {item.dosage} {item.expireDate ? `(EXP: ${item.expireDate})` : ''}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* PATENT PRE-PACKAGED ('P') EXCEL TABLE */}
                        {group.patentItems.length > 0 && (
                          <div className="space-y-1">
                            <div className="inline-block bg-emerald-100 text-emerald-950 font-extrabold text-[9px] uppercase border border-emerald-300 px-2 py-0.5 rounded">
                              Patent Pre-Packaged ('P')
                            </div>
                            <div className="overflow-x-auto border border-emerald-300 rounded-lg bg-white shadow-2xs">
                              <table className="w-full text-left border-collapse font-sans text-xs">
                                <thead>
                                  <tr className="bg-emerald-100/90 border-b border-emerald-300 text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                                    <th className="py-1 px-2 w-7 text-center border-r border-emerald-200">#</th>
                                    <th className="py-1 px-2 border-r border-emerald-200">Patent Medicine Name</th>
                                    <th className="py-1 px-2">Dosage / Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100">
                                  {group.patentItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-emerald-50/50">
                                      <td className="py-1 px-1.5 text-center font-bold text-slate-500 text-[10px] border-r border-emerald-100 bg-emerald-50/50">
                                        {idx + 1}
                                      </td>
                                      <td className="py-1 px-2 font-bold text-slate-900 border-r border-emerald-100">
                                        {item.medicineName}
                                      </td>
                                      <td className="py-1 px-2 font-mono font-bold text-emerald-900">
                                        {item.dosage}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">New Patient / No Previous History</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No previous visit history or prescription records found for this patient. You can write a fresh prescription below.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              {groupedRxByDate.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const latestGroup = groupedRxByDate[0];
                    if (latestGroup) {
                      const cItems = latestGroup.clinicalItems
                        .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                        .map((i, idx) => ({ id: String(Date.now() + idx), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                      const pItems = latestGroup.patentItems
                        .filter(i => i.medicineName && i.medicineName !== 'None prescribed' && i.medicineName !== 'None recorded')
                        .map((i, idx) => ({ id: String(Date.now() + idx + 100), medicineName: i.medicineName, dosage: i.dosage && i.dosage !== 'As directed' ? i.dosage : '' }));

                      const cExp = latestGroup.clinicalItems.map(i => i.expireDate).find(Boolean) || '';

                      if (cItems.length > 0) setPvClinicalItems(cItems);
                      if (pItems.length > 0) setPvPatientItems(pItems);
                      if (cExp) setPvClinicalMedicineExpireDate(cExp);

                      if (latestGroup.symptoms) {
                        setPvSymptomsDiagnosis(latestGroup.symptoms);
                      }
                      if (latestGroup.medicalReportResult && latestGroup.medicalReportResult !== 'N/A') {
                        setPvMedicalReportResult(latestGroup.medicalReportResult);
                      }
                      if (latestGroup.labTestAdvice && latestGroup.labTestAdvice !== 'N/A') {
                        setPvLabTestAdvice(latestGroup.labTestAdvice);
                      }

                      setPvSaveSuccess(`Latest prescription (${latestGroup.date}) copied into current visit!`);
                      setTimeout(() => setPvSaveSuccess(''), 4000);
                    }
                    setHistoryAlertModalOpen(false);
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Recent Rx to Current Form</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setHistoryAlertModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center"
              >
                Close & Continue to Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Sent Live Toast Notification */}
      {smsSentToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 animate-slideIn flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Automated SMS Dispatched</span>
            </div>
            <button 
              onClick={() => setSmsSentToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-semibold text-slate-300">
            Sent to: <span className="font-mono text-emerald-300">{smsSentToast.recipient}</span> via <span className="underline font-bold capitalize">{smsSentToast.provider}</span>
          </p>
          <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-400 font-mono border border-slate-800 leading-normal">
            "{smsSentToast.message}"
          </div>
          <div className="text-[8px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/60">
            <span>Provider HTTP Code: 200 OK</span>
            <span>Ref: {Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
        </div>
      )}

      {/* Future Appointment Booking Confirmation Modal Popup */}
      {futureBookingModal && futureBookingModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center space-x-3 text-emerald-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Appointment Scheduled</h3>
                <p className="text-xxs text-emerald-700 font-semibold uppercase tracking-wider">Future Booking Confirmed</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-bold text-slate-900">{futureBookingModal.patientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Patient ID:</span>
                <span className="font-mono font-bold text-slate-800">{futureBookingModal.patientId}</span>
              </div>
              {futureBookingModal.phoneMobile && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mobile Phone:</span>
                  <span className="font-mono text-slate-800">{futureBookingModal.phoneMobile}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Appointment Date:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {futureBookingModal.date}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assigned Shift:</span>
                <span className="font-bold text-slate-800">
                  {futureBookingModal.shift === 1 ? 'Morning Shift (08:00 - 14:00)' : 'Evening Shift (14:00 - 20:00)'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xxs text-amber-900 font-medium flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Important Note:</strong> Because this appointment is scheduled for a future date (<strong>{futureBookingModal.date}</strong>), an OPD Token was <strong>NOT issued for today</strong>. The token will be issued when the patient arrives on their appointment date.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFutureBookingModal(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-md cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
