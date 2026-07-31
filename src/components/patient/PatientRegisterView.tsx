import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Search,
  Phone,
  MapPin,
  Pencil,
  CalendarPlus,
  UserPlus
} from 'lucide-react';
import { Patient, City, NhcPatientHistory } from '../../types';

interface PatientRegisterViewProps {
  editingPatientId: string;
  handleCancelEditPatient: () => void;
  errorMsg: string;
  successMsg: string;
  handleRegisterPatient: (e: React.FormEvent) => void;
  patientName: string;
  setPatientName: (val: string) => void;
  fatherHusband: string;
  setFatherHusband: (val: string) => void;
  ageYears: number;
  setAgeYears: (val: number) => void;
  sex: 'Male' | 'Female' | 'Other';
  setSex: (val: 'Male' | 'Female' | 'Other') => void;
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  setMaritalStatus: (val: 'Single' | 'Married' | 'Widowed' | 'Divorced') => void;
  occupation: string;
  setOccupation: (val: string) => void;
  mobilePhone: string;
  setMobilePhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  cityId: number;
  setCityId: (val: number) => void;
  cities: City[];
  canAdd: boolean;
  canEditPatient: boolean;
  canBookAppointment: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  fetchNhcArchive: (queryVal: string) => void;
  isSearchingArchive: boolean;
  filteredPatients: Patient[];
  filteredNhcPatients: NhcPatientHistory[];
  handleStartEditPatient: (p: Patient) => void;
  setSelectedPatientId: (id: string) => void;
  setActiveSubTab: (tab: any) => void;
  handleImportNhcPatientToRegister: (nhc: NhcPatientHistory) => void;
  getResolvedNhcPatientName: (nhc: any) => string;
}

export default function PatientRegisterView({
  editingPatientId,
  handleCancelEditPatient,
  errorMsg,
  successMsg,
  handleRegisterPatient,
  patientName,
  setPatientName,
  fatherHusband,
  setFatherHusband,
  ageYears,
  setAgeYears,
  sex,
  setSex,
  maritalStatus,
  setMaritalStatus,
  occupation,
  setOccupation,
  mobilePhone,
  setMobilePhone,
  email,
  setEmail,
  address,
  setAddress,
  cityId,
  setCityId,
  cities,
  canAdd,
  canEditPatient,
  canBookAppointment,
  searchTerm,
  setSearchTerm,
  fetchNhcArchive,
  isSearchingArchive,
  filteredPatients,
  filteredNhcPatients,
  handleStartEditPatient,
  setSelectedPatientId,
  setActiveSubTab,
  handleImportNhcPatientToRegister,
  getResolvedNhcPatientName
}: PatientRegisterViewProps) {
  return (
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
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (val.trim().length >= 1) {
                  fetchNhcArchive(val);
                }
              }}
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
          <span className="text-[10px] text-emerald-600 font-semibold animate-pulse block mb-2">Searching PHC Archive...</span>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
          {filteredPatients.length === 0 && filteredNhcPatients.length === 0 ? (
            <p className="text-xs text-slate-400 text-center font-semibold py-8">No matching records found.</p>
          ) : (
            <>
              {/* Active Clinic Patients */}
              {filteredPatients.map((p, idx) => {
                const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                return (
                  <div key={`act-reg-${p.PatientID}-${idx}`} className="pt-3 first:pt-0 flex flex-col space-y-1.5 text-xs text-slate-700">
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
              {filteredNhcPatients.map((p, idx) => {
                const name = getResolvedNhcPatientName(p);
                return (
                  <div key={`nhc-reg-${p.PatientID}-${idx}`} className="pt-3 flex flex-col space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <strong className="text-slate-900 font-bold">{name}</strong>
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider scale-95">PHC Archive</span>
                        </div>
                        <p className="text-xxs font-mono text-slate-400 font-semibold mt-0.5">{p.PatientID}</p>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleImportNhcPatientToRegister(p)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded flex items-center transition cursor-pointer shadow-2xs"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        <span>Import & Register</span>
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
  );
}
