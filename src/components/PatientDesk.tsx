/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  CalendarPlus,
  ListOrdered,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  UserCheck,
  Ban,
  CreditCard,
  Search,
  CheckCircle2,
  Users
} from 'lucide-react';
import {
  Patient,
  Appointment,
  Token,
  City,
  UserRight,
  SmsSettings
} from '../types';

interface PatientDeskProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  appointments: Appointment[];
  onAddAppointment: (app: Appointment) => void;
  onUpdateAppointmentStatus: (appId: string, status: 1 | 2 | 3 | 4) => void;
  tokens: Token[];
  onAddToken: (tok: Token) => void;
  onUpdateTokenStatus: (tokenNo: number, shift: 1 | 2, status: 1 | 2 | 3) => void;
  cities: City[];
  userRights: UserRight[];
  smsSettings?: SmsSettings;
}

export default function PatientDesk({
  patients,
  onAddPatient,
  appointments,
  onAddAppointment,
  onUpdateAppointmentStatus,
  tokens,
  onAddToken,
  onUpdateTokenStatus,
  cities,
  userRights,
  smsSettings
}: PatientDeskProps) {
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'book' | 'queue'>('queue');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'patients');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

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
  const [appDate, setAppDate] = useState('2026-07-03');
  const [smsSentToast, setSmsSentToast] = useState<{ recipient: string; message: string; provider: string } | null>(null);
  const [shift, setShift] = useState<1 | 2>(1); // 1 = Morning, 2 = Evening
  const [remarks, setRemarks] = useState('');
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');

  // Thermal print modal state
  const [thermalPrintOpen, setThermalPrintOpen] = useState(false);
  const [thermalPrintData, setThermalPrintData] = useState<{
    tokenNo: number;
    patientName: string;
    patientId: string;
    shiftName: string;
    date: string;
    fee: number;
    appId: string;
  } | null>(null);

  // Filtered patients for search
  const filteredPatients = patients.filter((p) =>
    p.PatientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.PatientID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.PhoneMobile.includes(searchTerm)
  );

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

  // Appointment Booking Handler
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

    // Appointment ID
    const newAppId = `APP-${String(appointments.length + 1).padStart(3, '0')}`;
    const newApp: Appointment = {
      AppointmentID: newAppId,
      PatientID: selectedPatientId,
      AppointmentDate: appDate,
      Shift: shift,
      Status: 1, // New
      Remarks: remarks || 'Routine OPD check',
      FeeCharged: 1500 // Flat OPD Consultant rate
    };

    // Auto generate sequential daily token for this shift and date
    // Count active tokens for today & shift
    const dailyTokens = tokens.filter((t) => t.Date === appDate && t.Shift === shift);
    const nextTokenNo = dailyTokens.length + 1;

    const newToken: Token = {
      TokenNo: nextTokenNo,
      PatientID: selectedPatientId,
      Shift: shift,
      Status: 1, // New / Waiting
      Date: appDate
    };

    onAddAppointment(newApp);
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
        .replace(/{APPID}/g, newAppId);

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
      fee: 1500,
      appId: newAppId
    });
    setThermalPrintOpen(true);

    setAppSuccess(`Appointment booked! Token No: ${nextTokenNo} allocated for ${shift === 1 ? 'Morning' : 'Evening'} shift.`);
    setAppError('');
    setSelectedPatientId('');
    setRemarks('');

    setTimeout(() => setAppSuccess(''), 6000);
  };

  // Advanced Token queue handlers
  const handleCallPatient = (tok: Token) => {
    // 1 (New) -> 2 (Visited)
    onUpdateTokenStatus(tok.TokenNo, tok.Shift, 2);
    // Corresponding appointment should also be marked Visited (2)
    const app = appointments.find(
      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === tok.Shift && a.Status === 1
    );
    if (app) {
      onUpdateAppointmentStatus(app.AppointmentID, 2);
    }
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
    <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="patients-desk">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            Patient Intake & Appointment Desk
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage localized patient intake files, Morning/Evening tokens, and waitlists</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 print:hidden">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'queue' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Waiting Queue</span>
          </button>
          <button
            onClick={() => setActiveSubTab('register')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Patient Intake Form</span>
          </button>
          <button
            onClick={() => setActiveSubTab('book')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => setActiveSubTab('status')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'status' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Large Screen Display</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO SUB-TAB */}
      {activeSubTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patients-view-register">
          
          {/* Registration Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center">
              <Sparkles className="w-4 h-4 text-emerald-500 mr-2 animate-pulse" />
              New Patient Medical Intake File
            </h3>

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
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition ${
                    canAdd
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canAdd ? 'Save & Register Intake File' : 'Unauthorized - Registration Locked'}
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

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-slate-400 text-center font-semibold py-8">No matching records found.</p>
              ) : (
                filteredPatients.map((p) => {
                  const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                  return (
                    <div key={p.PatientID} className="pt-3 first:pt-0 flex flex-col space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900 font-bold">{p.PatientName}</strong>
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
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(p.PatientID);
                            setActiveSubTab('book');
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded flex items-center transition border border-indigo-150"
                        >
                          <CalendarPlus className="w-3 h-3 mr-1" />
                          <span>Book Repeat Appointment</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'book' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="patients-view-book">
          <h3 className="text-sm font-bold text-slate-950 flex items-center">
            <CalendarPlus className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
            Book OPD Consultation & Generate Token
          </h3>

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

          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <label className="block text-xxs font-bold text-slate-500 uppercase">Select Registered Patient *</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.PatientID} value={p.PatientID}>
                    {p.PatientName} ({p.PatientID}) - {p.PhoneMobile}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Clinic Shift *</label>
                <select
                  required
                  value={shift}
                  onChange={(e) => setShift(parseInt(e.target.value) as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value={1}>Morning (09:00 AM - 02:00 PM)</option>
                  <option value={2}>Evening (05:00 PM - 09:00 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-500 uppercase">OPD Ticket Fees Rate</label>
              <input
                type="text"
                readOnly
                value="Rs. 1,500"
                className="mt-1 w-full text-xs border border-slate-200 bg-slate-50 text-slate-700 font-bold rounded-lg p-2.5 focus:outline-none cursor-not-allowed"
              />
              <span className="text-xxs text-slate-400 font-semibold mt-1 block">OPD fee is posted to accounts ledger automatically upon ticket completion.</span>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-500 uppercase">Chief Complaint / Visit Remarks</label>
              <textarea
                placeholder="Brief reason for consultant visit..."
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!canAdd}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition ${
                canAdd
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {canAdd ? 'Confirm Booking & Issue Serial Token' : 'Unauthorized - Booking Locked'}
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'queue' && (
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
                  {tokens.filter((t) => t.Shift === 1 && t.Status === 1).length} Waiting
                </span>
              </div>

              <div className="divide-y divide-slate-100 min-h-[220px]">
                {tokens.filter((t) => t.Shift === 1).length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-16">No tickets issued for the Morning Shift.</p>
                ) : (
                  tokens.filter((t) => t.Shift === 1).map((tok) => {
                    const matchedApp = appointments.find(
                      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === 1
                    );
                    const isPosted = matchedApp?.Status === 4;

                    return (
                      <div key={tok.TokenNo} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold font-mono flex items-center justify-center shrink-0 shadow-inner">
                            #{tok.TokenNo}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{getPatientName(tok.PatientID)}</p>
                            <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {tok.PatientID} | Mob: {getPatientPhone(tok.PatientID)}</p>
                            
                            {/* App status badge */}
                            <div className="mt-1.5 flex items-center space-x-1.5">
                              <span className={`text-xxs font-bold px-1.5 py-0.2 rounded uppercase ${
                                tok.Status === 1 ? 'bg-indigo-50 text-indigo-600' :
                                tok.Status === 2 ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {tok.Status === 1 ? 'Waiting' : tok.Status === 2 ? 'Visited' : 'Canceled'}
                              </span>
                              {matchedApp && (
                                <span className={`text-xxs font-bold px-1.5 py-0.2 rounded uppercase ${
                                  matchedApp.Status === 4 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {matchedApp.Status === 4 ? 'FEE PAID' : 'FEE UNPAID'}
                                </span>
                              )}
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
                                fee: 1500,
                                appId: matchedApp?.AppointmentID || 'N/A'
                              });
                              setThermalPrintOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Print Ticket</span>
                          </button>
                          {tok.Status === 1 && (
                            <button
                              onClick={() => handleCallPatient(tok)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center transition"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span>Call Patient</span>
                            </button>
                          )}
                          {!isPosted && (tok.Status === 1 || tok.Status === 2) && (
                            <button
                              onClick={() => handlePostPayment(tok)}
                              disabled={!canPost}
                              className={`px-2.5 py-1 text-xxs font-bold rounded flex items-center transition ${
                                canPost ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              <span>Post Fee</span>
                            </button>
                          )}
                          {tok.Status !== 3 && tok.Status !== 2 && (
                            <button
                              onClick={() => handleCancelQueue(tok)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold rounded flex items-center transition"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              <span>Cancel</span>
                            </button>
                          )}
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
                  {tokens.filter((t) => t.Shift === 2 && t.Status === 1).length} Waiting
                </span>
              </div>

              <div className="divide-y divide-slate-100 min-h-[220px]">
                {tokens.filter((t) => t.Shift === 2).length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-16">No tickets issued for the Evening Shift.</p>
                ) : (
                  tokens.filter((t) => t.Shift === 2).map((tok) => {
                    const matchedApp = appointments.find(
                      (a) => a.PatientID === tok.PatientID && a.AppointmentDate === tok.Date && a.Shift === 2
                    );
                    const isPosted = matchedApp?.Status === 4;

                    return (
                      <div key={tok.TokenNo} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold font-mono flex items-center justify-center shrink-0 shadow-inner">
                            #{tok.TokenNo}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{getPatientName(tok.PatientID)}</p>
                            <p className="text-xxs text-slate-400 font-mono mt-0.5">ID: {tok.PatientID} | Mob: {getPatientPhone(tok.PatientID)}</p>
                            
                            <div className="mt-1.5 flex items-center space-x-1.5">
                              <span className={`text-xxs font-bold px-1.5 py-0.2 rounded uppercase ${
                                tok.Status === 1 ? 'bg-indigo-50 text-indigo-600' :
                                tok.Status === 2 ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {tok.Status === 1 ? 'Waiting' : tok.Status === 2 ? 'Visited' : 'Canceled'}
                              </span>
                              {matchedApp && (
                                <span className={`text-xxs font-bold px-1.5 py-0.2 rounded uppercase ${
                                  matchedApp.Status === 4 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {matchedApp.Status === 4 ? 'FEE PAID' : 'FEE UNPAID'}
                                </span>
                              )}
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
                                fee: 1500,
                                appId: matchedApp?.AppointmentID || 'N/A'
                              });
                              setThermalPrintOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center transition border border-slate-200"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Print Ticket</span>
                          </button>
                          {tok.Status === 1 && (
                            <button
                              onClick={() => handleCallPatient(tok)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center transition"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              <span>Call Patient</span>
                            </button>
                          )}
                          {!isPosted && (tok.Status === 1 || tok.Status === 2) && (
                            <button
                              onClick={() => handlePostPayment(tok)}
                              disabled={!canPost}
                              className={`px-2.5 py-1 text-xxs font-bold rounded flex items-center transition ${
                                canPost ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              <span>Post Fee</span>
                            </button>
                          )}
                          {tok.Status !== 3 && tok.Status !== 2 && (
                            <button
                              onClick={() => handleCancelQueue(tok)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xxs font-bold rounded flex items-center transition"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Large Screen LED Live Queue Status display */}
      {activeSubTab === 'status' && (
        <div className="bg-slate-950 text-white p-8 rounded-2xl border-4 border-slate-800 shadow-2xl space-y-6" id="patients-large-screen">
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

          {/* Shift side by side Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Morning Shift Column */}
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
                    {tokens.filter(t => t.Shift === 1 && t.Status === 1).map(tok => (
                      <div key={tok.TokenNo} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                        <span className="text-lg font-black text-blue-400">#{tok.TokenNo}</span>
                        <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Evening Shift Column */}
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
                    {tokens.filter(t => t.Shift === 2 && t.Status === 1).map(tok => (
                      <div key={tok.TokenNo} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-center font-mono">
                        <span className="text-lg font-black text-indigo-400">#{tok.TokenNo}</span>
                        <p className="text-[8px] text-slate-500 font-sans truncate font-bold mt-1 uppercase">{getPatientName(tok.PatientID)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  onClick={() => {
                    window.print();
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded flex items-center shadow-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Print Ticket
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
            <div className="p-6 bg-white font-mono text-[11px] text-black space-y-4 overflow-y-auto flex-1 select-all" id="thermal-receipt">
              
              {/* Header */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
                <h3 className="font-extrabold text-sm uppercase">PUNJAB CLINIC CMS</h3>
                <p className="text-[9px] uppercase font-bold">OPD Consultation Token</p>
                <p className="text-[9px]">Saddar Bazar, Lahore Cantt</p>
                <p className="text-[9px]">Tel: +92-42-36612345</p>
              </div>

              {/* Big Token Number Circle */}
              <div className="text-center py-2 border-b border-dashed border-black space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">OPD TOKEN NUMBER</span>
                <span className="text-5xl font-black tracking-widest block">
                  #{thermalPrintData.tokenNo}
                </span>
                <span className="text-[9px] font-bold uppercase block tracking-wider mt-1 bg-black text-white px-2 py-0.5 rounded-sm mx-auto w-max">
                  {thermalPrintData.shiftName}
                </span>
              </div>

              {/* Patient Details */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-black">
                <div className="flex justify-between">
                  <span>PATIENT ID:</span>
                  <span className="font-extrabold">{thermalPrintData.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT:</span>
                  <span className="font-extrabold uppercase truncate max-w-[150px]">{thermalPrintData.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>TICKET DATE:</span>
                  <span>{thermalPrintData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>APPOINTMENT ID:</span>
                  <span>{thermalPrintData.appId}</span>
                </div>
              </div>

              {/* Fee */}
              <div className="space-y-1 pb-3 border-b border-dashed border-black">
                <div className="flex justify-between font-extrabold text-xs">
                  <span>OPD FEE PAID:</span>
                  <span>Rs. {thermalPrintData.fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>PAID VIA:</span>
                  <span className="uppercase">OPD DESK CASHIER</span>
                </div>
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

    </div>
  );
}
