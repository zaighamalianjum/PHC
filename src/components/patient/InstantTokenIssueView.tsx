import React from 'react';
import {
  Ticket,
  UserPlus,
  CheckCircle2,
  Search,
  Phone,
  MapPin,
  UserCheck,
  ListOrdered
} from 'lucide-react';
import { Token, Patient, NhcPatientHistory, City } from '../../types';

interface InstantTokenIssueViewProps {
  tokens: Token[];
  patients: Patient[];
  nhcPatients: NhcPatientHistory[];
  nhcArchiveList: NhcPatientHistory[];
  cities: City[];
  appDate: string;
  shift?: number;
  canIssueToken?: boolean;
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  setOpdTokenModalPatient: (pat: Patient | null) => void;
  setTokenIssueMode: (mode: 'existing' | 'new_patient') => void;
  setExistingFee?: (val: any) => void;
  setAppError: (err: string) => void;
  setIsOpdTokenModalOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  fetchNhcArchive: (queryVal: string) => void;
  isSearchingArchive: boolean;
  filteredPatients: Patient[];
  filteredNhcPatients: NhcPatientHistory[];
  onAddPatient: (pat: Patient) => void;
  handleStartEditPatient?: (pat: Patient) => void;
  setActiveSubTab?: (tab: any) => void;
}

export default function InstantTokenIssueView({
  tokens,
  patients,
  cities,
  appDate,
  selectedPatientId,
  setSelectedPatientId,
  setOpdTokenModalPatient,
  setTokenIssueMode,
  setExistingFee,
  setAppError,
  setIsOpdTokenModalOpen,
  searchTerm,
  setSearchTerm,
  fetchNhcArchive,
  isSearchingArchive,
  filteredPatients,
  filteredNhcPatients,
  onAddPatient
}: InstantTokenIssueViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="patients-view-token-issue">
      {/* Left Column (2 cols): Patient Database Search Engine & Lookup */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Ticket className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPatientId('');
                setOpdTokenModalPatient(null);
                setTokenIssueMode('new_patient');
                setAppError('');
                setIsOpdTokenModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register New Patient Token</span>
            </button>
            {selectedPatientId && (
              <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Selected: {patients.find(p => p.PatientID === selectedPatientId)?.PatientName || selectedPatientId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active & PHC archive by name, ID or mobile phone..."
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
          <span className="text-[10px] text-slate-400">Click "Select for Token" on any record below to open OPD Token Issue popup</span>
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
              {filteredPatients.map((p, idx) => {
                const city = cities.find((c) => c.CityID === p.CityID)?.CityName || 'Other';
                const isSelected = selectedPatientId === p.PatientID;
                const existingTodayToken = (tokens || []).find(t => t.PatientID === p.PatientID && t.Date === appDate);
                
                return (
                  <div 
                    key={`act-tok-${p.PatientID}-${idx}`} 
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
                          onClick={() => {
                            setSelectedPatientId(p.PatientID);
                            setOpdTokenModalPatient(p);
                            setTokenIssueMode('existing');
                            setExistingFee?.('');
                            setAppError('');
                            setIsOpdTokenModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Select for Token</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* PHC Archive Patients */}
              {filteredNhcPatients.map((p, idx) => {
                const isSelected = selectedPatientId === p.PatientID;
                return (
                  <div 
                    key={`nhc-tok-${p.PatientID}-${idx}`} 
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
                          setOpdTokenModalPatient(newPatient);
                          setTokenIssueMode('existing');
                          setExistingFee?.('');
                          setAppError('');
                          setIsOpdTokenModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Import Archive & Select for Token</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Right Column (1 col): Issued Tokens Summary Box for Today */}
      <div className="space-y-4">
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
  );
}
