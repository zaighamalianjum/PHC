/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  RefreshCw, 
  User, 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  HeartPulse, 
  Layers, 
  Database,
  ArrowRight,
  DatabaseBackup,
  UserCheck,
  Plus,
  X,
  Edit,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Info,
  AlertTriangle,
  Activity,
  UserMinus,
  Settings
} from 'lucide-react';
import { NhcPatientHistory, MongoDbSettings } from '../types';
import * as XLSX from 'xlsx';

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

interface NhcPatientHistoryDeskProps {
  mongoDbSettings: MongoDbSettings;
  setNhcPatients?: React.Dispatch<React.SetStateAction<NhcPatientHistory[]>>;
}

export default function NhcPatientHistoryDesk({ mongoDbSettings, setNhcPatients }: NhcPatientHistoryDeskProps) {
  const [historyList, setHistoryList] = useState<NhcPatientHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<NhcPatientHistory | null>(null);
  
  // File upload state variables
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadMode, setUploadMode] = useState<'wipe' | 'merge'>('wipe');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Filters
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [ageFilter, setAgeFilter] = useState<string>('All');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [labFilter, setLabFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  // Manual record drawer / Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editorRecord, setEditorRecord] = useState<Partial<NhcPatientHistory>>({});
  const [editorError, setEditorError] = useState('');

  // Handle high-speed Excel/CSV stream file upload
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setErrorMsg('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) spreadsheet.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgressText('Establishing data stream connection and transferring file...');

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;

    // Stream raw file to backend directly
    fetch(`${bridgeUrl}/api/nhc-patient-history/upload-file?wipe=${uploadMode === 'wipe'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.error || `HTTP Status ${res.status}`);
          }).catch(() => {
            throw new Error(`HTTP Status ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setSuccessMsg(
            `Data processed successfully! Imported ${data.totalCount.toLocaleString()} clinical history rows into the database using [${data.mode === 'wipe-insert' ? 'Wipe & Re-index' : 'Smart Merge'}] mode.`
          );
          fetchRecords();
        } else {
          throw new Error(data.error || 'Unknown parsing failure.');
        }
      })
      .catch(err => {
        console.error('File upload failed:', err);
        setErrorMsg(`Failed to upload or parse patient history file: ${err.message}`);
      })
      .finally(() => {
        setIsUploading(false);
        setUploadProgressText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const [hasSearched, setHasSearched] = useState(false);

  // Fetch existing records from MongoDB with optional search query
  const fetchRecords = (queryVal: string = '') => {
    const trimmed = queryVal.trim();
    if (!trimmed) {
      setHistoryList([]);
      setHasSearched(false);
      if (setNhcPatients) {
        setNhcPatients([]);
      }
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(true);
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history?q=${encodeURIComponent(trimmed)}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setHistoryList(data);
          if (setNhcPatients) {
            setNhcPatients(data);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch NHC patient history:', err.message);
        setErrorMsg('Could not fetch existing NHC patient history from database. Make sure the server is online.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    // To prevent browser performance lag, we do NOT load everything on mount.
    setHistoryList([]);
  }, [mongoDbSettings.BridgeUrl]);



  // Purge/Clear database collection
  const handleClearHistory = () => {
    if (!window.confirm('Are you absolutely sure you want to completely wipe out all NHC Patient History? This action is permanent and cannot be undone.')) {
      return;
    }
    setIsLoading(true);
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        setHistoryList([]);
        setSuccessMsg('NHC Patient History database purged successfully.');
        setSelectedRecord(null);
      })
      .catch(err => {
        setErrorMsg(`Failed to purge history database: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Open Editor for adding or editing patient
  const handleOpenAddForm = () => {
    setIsEditing(true);
    setEditorRecord({
      PatientID: `NHC-${Math.floor(1000 + Math.random() * 9000)}`,
      PatientName: '',
      AgeYears: undefined,
      Sex: 'Male',
      PhoneMobile: '',
      Address: '',
      Father_husband: '',
      MedicalCondition: '',
      Symptoms: '',
      Diagnosis: '',
      VisitDate: new Date().toISOString().split('T')[0],
      PrescribedMedicines: '',
      LabTests: '',
      Allergies: '',
      BloodGroup: '',
      RegistrationDate: new Date().toISOString().split('T')[0]
    });
    setEditorError('');
  };

  const handleOpenEditForm = (rec: NhcPatientHistory) => {
    setIsEditing(true);
    setEditorRecord({ ...rec });
    setEditorError('');
  };

  // Save/Submit Form directly to DB
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorRecord.PatientName?.trim()) {
      setEditorError('Patient Name is a required field.');
      return;
    }

    setIsLoading(true);
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;

    // Send single record as a 1-item array to reuse bulkupsert
    fetch(`${bridgeUrl}/api/nhc-patient-history/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([editorRecord])
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSuccessMsg(`Patient profile for "${editorRecord.PatientName}" updated successfully.`);
        setIsEditing(false);
        fetchRecords();
        setSelectedRecord(editorRecord as NhcPatientHistory);
      })
      .catch(err => {
        setEditorError(`Database update failed: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Advanced Filtering & Sorting Logic
  const filteredList = historyList.filter(rec => {
    // 1. Text Search Matching - Extremely robust, multi-word, normalized search
    const normalizedQuery = searchTerm.toLowerCase().trim();
    let matchesSearch = true;
    if (normalizedQuery) {
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      const name = String(rec.PatientName || '').toLowerCase();
      const id = String(rec.PatientID || '').toLowerCase();
      const phone = String(rec.PhoneMobile || '').toLowerCase();
      const father = String(rec.Father_husband || '').toLowerCase();
      const condition = String(rec.MedicalCondition || '').toLowerCase();
      const diag = String(rec.Diagnosis || '').toLowerCase();
      const symptoms = String(rec.Symptoms || '').toLowerCase();

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const cleanId = id.replace(/[^0-9a-zA-Z]/g, '');

      matchesSearch = terms.every(term => {
        const cleanTerm = term.replace(/[^0-9a-zA-Z]/g, '');

        if (name.includes(term)) return true;
        if (id.includes(term)) return true;
        if (phone.includes(term)) return true;
        if (father.includes(term)) return true;
        if (condition.includes(term)) return true;
        if (diag.includes(term)) return true;
        if (symptoms.includes(term)) return true;

        if (cleanTerm) {
          if (cleanId.includes(cleanTerm)) return true;
          if (cleanPhone.includes(cleanTerm)) return true;
        }

        return false;
      });
    }

    // 2. Gender Filter
    const matchesGender = genderFilter === 'All' || 
      (rec.Sex && String(rec.Sex).toLowerCase() === genderFilter.toLowerCase());

    // 3. Age Filter
    let matchesAge = true;
    if (ageFilter !== 'All') {
      const age = rec.AgeYears;
      if (age === undefined) {
        matchesAge = false;
      } else if (ageFilter === 'Pediatric') {
        matchesAge = age < 12;
      } else if (ageFilter === 'Adolescent') {
        matchesAge = age >= 12 && age <= 18;
      } else if (ageFilter === 'Adult') {
        matchesAge = age > 18 && age < 60;
      } else if (ageFilter === 'Senior') {
        matchesAge = age >= 60;
      }
    }

    // 4. Condition Presence Filter
    let matchesCondition = true;
    if (conditionFilter === 'Chronic') {
      matchesCondition = !!rec.MedicalCondition && rec.MedicalCondition.trim().length > 0;
    } else if (conditionFilter === 'Normal') {
      matchesCondition = !rec.MedicalCondition || rec.MedicalCondition.trim().length === 0;
    }

    // 5. Lab Tests Presence Filter
    let matchesLab = true;
    if (labFilter === 'HasLab') {
      matchesLab = !!rec.LabTests && rec.LabTests.trim().length > 0;
    } else if (labFilter === 'NoLab') {
      matchesLab = !rec.LabTests || rec.LabTests.trim().length === 0;
    }

    return matchesSearch && matchesGender && matchesAge && matchesCondition && matchesLab;
  }).sort((a, b) => {
    // Sorting Logic
    if (sortBy === 'name-asc') {
      return a.PatientName.localeCompare(b.PatientName);
    } else if (sortBy === 'name-desc') {
      return b.PatientName.localeCompare(a.PatientName);
    } else if (sortBy === 'id-asc') {
      return a.PatientID.localeCompare(b.PatientID);
    } else if (sortBy === 'id-desc') {
      return b.PatientID.localeCompare(a.PatientID);
    } else if (sortBy === 'date-newest') {
      return (b.VisitDate || '').localeCompare(a.VisitDate || '');
    } else if (sortBy === 'date-oldest') {
      return (a.VisitDate || '').localeCompare(b.VisitDate || '');
    }
    return 0;
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50 relative" id="nhc-patient-history-root">
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-150 flex flex-col items-center max-w-xs text-center space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">Searching Patient Records</h4>
              <p className="text-xxs text-slate-500 mt-1">Please wait while we query and load records from the secure patient archive...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Body Panel: Excel Upload & Patient Table */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 lg:border-r lg:border-slate-200">
        
        {/* Workspace Title Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <DatabaseBackup className="w-6 h-6 text-indigo-600 shrink-0" />
              PHC Patient History Workstation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Consolidated clinic management workflow to parse spreadsheet archives and securely sync clinical records.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Patient Record</span>
            </button>
            
            {historyList.length > 0 && (
              <button
                onClick={handleClearHistory}
                id="clear-nhc-history-btn"
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl border border-rose-200/60 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Wipe Database</span>
              </button>
            )}
          </div>
        </div>



        {/* Global Notifications */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs shadow-xs animate-fadeIn shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold block text-slate-800">Operation Successful</span>
              <p>{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-xs animate-fadeIn shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold block text-slate-800">Alert / Error Encountered</span>
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg('')} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* INTERACTIVE DATA CONSOLE */}
        {/* ========================================================== */}
        <div className="flex-1 min-h-[400px] bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col">
          
          {/* Advanced Filtering & Query Control Panel */}
          <div className="space-y-4 border-b border-slate-100 pb-4 mb-4 shrink-0">
            
            {/* Main Text Search Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchRecords(searchTerm);
                    }
                  }}
                  placeholder="Query clinical archive by Patient Name, ID, Symptom, or Diagnosis..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 text-slate-800"
                  id="nhc-patient-search"
                />
              </div>
              <button
                type="button"
                onClick={() => fetchRecords(searchTerm)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" /> Search Database
              </button>
              <div className="flex items-center gap-2 text-xxs font-extrabold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-150 whitespace-nowrap shrink-0">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                Loaded: {filteredList.length} Profiles
              </div>
            </div>

            {/* Quick Filter Selects */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Gender */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Filter className="w-2.5 h-2.5" /> Gender
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Age Categories */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <User className="w-2.5 h-2.5" /> Age Group
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Ages</option>
                  <option value="Pediatric">Pediatric (&lt;12)</option>
                  <option value="Adolescent">Adolescent (12-18)</option>
                  <option value="Adult">Adult (19-59)</option>
                  <option value="Senior">Senior (60+)</option>
                </select>
              </div>

              {/* Medical Condition */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <HeartPulse className="w-2.5 h-2.5" /> Conditions
                </label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Conditions</option>
                  <option value="Chronic">Chronic / Recorded</option>
                  <option value="Normal">Normal / Healthy</option>
                </select>
              </div>

              {/* Lab Test Advice */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Activity className="w-2.5 h-2.5" /> Lab Advice
                </label>
                <select
                  value={labFilter}
                  onChange={(e) => setLabFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Records</option>
                  <option value="HasLab">Has Lab Advice</option>
                  <option value="NoLab">No Labs Mapped</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Layers className="w-2.5 h-2.5" /> Sort Order
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-1.5 text-xxs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="name-asc">Alphabetical (A-Z)</option>
                  <option value="name-desc">Alphabetical (Z-A)</option>
                  <option value="id-asc">Patient ID (Asc)</option>
                  <option value="id-desc">Patient ID (Desc)</option>
                  <option value="date-newest">Last Visit (Newest)</option>
                  <option value="date-oldest">Last Visit (Oldest)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Grid View of Database Patient Records */}
          <div className="flex-1 overflow-y-auto">
            {!hasSearched && historyList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Search className="w-12 h-12 text-indigo-200" />
                <div>
                  <span className="text-xs font-bold text-slate-600 block">Query-Only Patient Archive</span>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1 mx-auto">
                    To prevent browser performance lag, please enter a patient name, ID, phone number, diagnosis, or symptom above and click <strong>Search Database</strong>.
                  </p>
                </div>
              </div>
            ) : historyList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-indigo-200" />
                <div>
                  <span className="text-xs font-bold text-slate-600 block">Production Database is Empty</span>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-1 mx-auto">
                    No clinical patient files are present. Drop or browse a clinical spreadsheet above or add records manually.
                  </p>
                </div>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs space-y-2">
                <UserMinus className="w-8 h-8 text-slate-300" />
                <span>No historical profiles matches your active filter matrix.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {(() => {
                  const seenIds = new Set<string>();
                  const uniqueFiltered = filteredList.filter(rec => {
                    if (seenIds.has(rec.PatientID)) return false;
                    seenIds.add(rec.PatientID);
                    return true;
                  });
                  return uniqueFiltered.map((rec) => {
                    const isSelected = selectedRecord?.PatientID === rec.PatientID;
                    return (
                      <div
                        key={rec.PatientID}
                        onClick={() => { setSelectedRecord(rec); setIsEditing(false); }}
                      className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-left flex flex-col justify-between ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/25 ring-1 ring-indigo-500/80 shadow-xs' 
                          : 'border-slate-150 hover:border-slate-300 bg-white hover:bg-slate-50/50 hover:shadow-xs'
                      }`}
                      id={`nhc-patient-card-${rec.PatientID}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-mono font-black text-slate-400 tracking-wider">
                            ID: {rec.PatientID}
                          </span>
                          {rec.MedicalCondition && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[8px] rounded-full uppercase tracking-wider truncate max-w-[120px]">
                              {rec.MedicalCondition}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800">{rec.PatientName}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                          {rec.AgeYears !== undefined && <span>Age: <strong>{rec.AgeYears}y</strong></span>}
                          {rec.Sex && <span className="capitalize">Sex: <strong>{rec.Sex}</strong></span>}
                          {rec.PhoneMobile && <span className="text-slate-400">📞 {rec.PhoneMobile}</span>}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[180px] italic">
                          {rec.Address ? rec.Address : 'No Address Listed'}
                        </span>
                        <span className="text-indigo-600 font-extrabold flex items-center gap-0.5 shrink-0">
                          Inspect Profile <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* RIGHT WORKSPACE: DETAILED VIEWER, RECORD ADDER, & PROFILE EDITOR */}
      {/* ========================================================== */}
      <div className="w-full lg:w-100 bg-slate-50 p-6 flex flex-col h-full overflow-y-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200">
        
        {/* State A: DIRECT EDIT / ADD RECORD FORM WRAPPER */}
        {isEditing ? (
          <form onSubmit={handleSaveForm} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">
                {editorRecord._id ? 'Modify Patient Record' : 'Record New Legacy Patient'}
              </span>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editorError && (
              <div className="bg-rose-50 border border-rose-150 p-2.5 rounded-lg text-rose-800 text-[10px] flex items-center gap-1.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editorError}</span>
              </div>
            )}

            <div className="space-y-3 text-xxs">
              
              {/* Patient ID and Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Patient ID *</label>
                  <input
                    type="text"
                    required
                    value={editorRecord.PatientID || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, PatientID: e.target.value }))}
                    placeholder="e.g. NHC-1001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={editorRecord.PatientName || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, PatientName: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Father / Husband Name */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Father / Husband Name</label>
                <input
                  type="text"
                  value={editorRecord.Father_husband || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, Father_husband: e.target.value }))}
                  placeholder="Guardian/Spouse Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Age and Sex and Blood */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Age Years</label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    value={editorRecord.AgeYears === undefined ? '' : editorRecord.AgeYears}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      setEditorRecord(prev => ({ ...prev, AgeYears: isNaN(val as number) ? undefined : val }));
                    }}
                    placeholder="Age"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Sex</label>
                  <select
                    value={editorRecord.Sex || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, Sex: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Blood Group</label>
                  <input
                    type="text"
                    value={editorRecord.BloodGroup || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, BloodGroup: e.target.value }))}
                    placeholder="A+, O-, etc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact Phone & Registration Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Phone Mobile</label>
                  <input
                    type="text"
                    value={editorRecord.PhoneMobile || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, PhoneMobile: e.target.value }))}
                    placeholder="Contact info"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Visit Date</label>
                  <input
                    type="date"
                    value={editorRecord.VisitDate || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, VisitDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Residential Address</label>
                <input
                  type="text"
                  value={editorRecord.Address || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, Address: e.target.value }))}
                  placeholder="Address details"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Symptoms / Complaints */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Symptoms / Complaints</label>
                <textarea
                  value={editorRecord.Symptoms || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, Symptoms: e.target.value }))}
                  placeholder="Describe patient complaints..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Symptoms & Diagnosis (Direct Field) */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Symptoms & Clinical Diagnosis (Direct Column)</label>
                <textarea
                  value={editorRecord.SymptomsDiagnosis || (editorRecord as any).Symptoms_Diagnosis || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, SymptomsDiagnosis: e.target.value }))}
                  placeholder="Direct symptoms and clinical diagnosis description from legacy database..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Medical Condition / Diagnosis */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Medical Condition</label>
                  <input
                    type="text"
                    value={editorRecord.MedicalCondition || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, MedicalCondition: e.target.value }))}
                    placeholder="e.g. Hypertension"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Diagnosis</label>
                  <input
                    type="text"
                    value={editorRecord.Diagnosis || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, Diagnosis: e.target.value }))}
                    placeholder="Clinical findings"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Prescribed Medicines */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Prescribed Medicines</label>
                <textarea
                  value={editorRecord.PrescribedMedicines || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, PrescribedMedicines: e.target.value }))}
                  placeholder="Rx medicines logs..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Lab Test Advice & Medical Report Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Advised Lab Investigations</label>
                  <input
                    type="text"
                    value={editorRecord.LabTests || editorRecord.LabTestAdvice || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, LabTests: e.target.value, LabTestAdvice: e.target.value }))}
                    placeholder="CBC, LFTs, Serum Creatinine, etc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-extrabold block uppercase">Medical Report Result (MedicalReportResult)</label>
                  <input
                    type="text"
                    value={editorRecord.MedicalReportResult || ''}
                    onChange={(e) => setEditorRecord(prev => ({ ...prev, MedicalReportResult: e.target.value }))}
                    placeholder="Medical report findings..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Allergies / Alert */}
              <div className="space-y-1">
                <label className="text-slate-400 font-extrabold block uppercase">Allergies / Special Alert</label>
                <input
                  type="text"
                  value={editorRecord.Allergies || ''}
                  onChange={(e) => setEditorRecord(prev => ({ ...prev, Allergies: e.target.value }))}
                  placeholder="Drug allergies or warnings..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>Save Record</span>
              </button>
            </div>
          </form>
        ) : selectedRecord ? (
          /* State B: DETAILED PROFILE VIEW CARD */
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6 text-left animate-fadeIn">
            
            {/* Detailed Header */}
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0">
                  {selectedRecord.PatientName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-mono font-black text-indigo-500 block">PATIENT PROFILE</span>
                  <h3 className="text-sm font-black text-slate-800 truncate">{selectedRecord.PatientName}</h3>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">ID: {selectedRecord.PatientID}</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenEditForm(selectedRecord)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-150 transition"
                title="Edit Patient Record"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Select Visit Date Dropdown */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 space-y-1.5">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">
                Select Visit Date
              </span>
              <select
                value={selectedRecord.VisitDate || selectedRecord.RegistrationDate || 'N/A'}
                onChange={(e) => {
                  const dateVal = e.target.value;
                  const match = historyList.find(r => 
                    r.PatientID === selectedRecord.PatientID && 
                    (r.VisitDate === dateVal || r.RegistrationDate === dateVal || (!r.VisitDate && !r.RegistrationDate && dateVal === 'N/A'))
                  );
                  if (match) {
                    setSelectedRecord(match);
                  }
                }}
                className="w-full bg-white border border-indigo-200 text-indigo-950 rounded-lg p-2 font-black font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                {(() => {
                  const recs = historyList.filter(r => r.PatientID === selectedRecord.PatientID);
                  const uniqueDates = Array.from(new Set(recs.map(r => r.VisitDate || r.RegistrationDate || 'N/A'))).filter(Boolean) as string[];
                  uniqueDates.sort((a, b) => b.localeCompare(a));
                  return uniqueDates.map(d => (
                    <option key={d} value={d}>
                      {formatShortDate(d)}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Personal Data Block */}
            <div className="space-y-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Personal Demographics
              </span>
              <div className="grid grid-cols-1 gap-2.5 text-xxs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Guardian/Spouse: <strong>{selectedRecord.Father_husband || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Phone Number: <strong>{selectedRecord.PhoneMobile || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">Home Address: <strong>{selectedRecord.Address || '—'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Registration: <strong>{formatShortDate(selectedRecord.RegistrationDate) || '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* Clinical Record Block */}
            <div className="space-y-3.5">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Clinical Details & History
              </span>
              <div className="space-y-3 text-xxs">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">Medical Condition / Chronic:</span>
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 text-slate-800 font-medium font-mono text-[10px]">
                    {selectedRecord.MedicalCondition || 'None'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">Symptoms / Complaints:</span>
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 text-slate-800 font-medium">
                    {selectedRecord.Symptoms || 'No symptoms specified.'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">Clinical Diagnosis:</span>
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 text-slate-800 font-medium">
                    {selectedRecord.Diagnosis || 'No active diagnosis recorded.'}
                  </div>
                </div>

                {(selectedRecord.SymptomsDiagnosis || (selectedRecord as any).Symptoms_Diagnosis || (selectedRecord as any).symptoms_diagnosis || (selectedRecord as any).symptomsdiagnosis) && (
                  <div className="space-y-1">
                    <span className="text-slate-400 block font-bold">Symptoms & Clinical Diagnosis (Database field):</span>
                    <div className="bg-emerald-50/50 border border-emerald-150 rounded-lg p-2 text-slate-800 font-semibold italic">
                      {selectedRecord.SymptomsDiagnosis || (selectedRecord as any).Symptoms_Diagnosis || (selectedRecord as any).symptoms_diagnosis || (selectedRecord as any).symptomsdiagnosis}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-slate-400 block font-bold">Prescribed Medicines (Rx):</span>
                  {(() => {
                    const records = historyList.filter(r => r.PatientID === selectedRecord.PatientID);
                    const groups: { [date: string]: NhcPatientHistory[] } = {};
                    records.forEach(r => {
                      const date = r.VisitDate || r.RegistrationDate || 'N/A';
                      if (!groups[date]) groups[date] = [];
                      groups[date].push(r);
                    });

                    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

                    if (sortedDates.length === 0) {
                      return (
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-2.5 text-emerald-900 font-bold font-mono text-[10px]">
                          No prescription history on file.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {sortedDates.map(date => {
                          const dateRecs = groups[date];
                          const clinical = dateRecs.filter(r => r.MedicineType === 'C' && r.MedicineDetail);
                          const patent = dateRecs.filter(r => r.MedicineType === 'P' && r.MedicineDetail);
                          
                          return (
                            <div key={date} className="bg-white border border-slate-150 rounded-lg p-2.5 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <span className="font-extrabold text-slate-700 font-mono text-[9px]">{formatShortDate(date)}</span>
                                <span className="text-[7px] font-black uppercase px-1 bg-slate-150 text-slate-500 rounded border border-slate-200">
                                  {dateRecs.length} item(s)
                                </span>
                              </div>
                              
                              {clinical.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                    Clinical Compounded ('C')
                                  </span>
                                  <div className="space-y-1 mt-1">
                                    {clinical.map((m, i) => (
                                      <div key={i} className="grid grid-cols-2 gap-1.5 bg-amber-50/50 border border-amber-200/80 rounded-md p-1.5 text-[9px]">
                                        <div className="bg-white border border-amber-100 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Clinical Medicine</span>
                                          <span className="font-bold text-slate-900">{m.MedicineDetail}</span>
                                        </div>
                                        <div className="bg-white border border-amber-100 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Dosage / Usage</span>
                                          <span className="font-mono font-bold text-amber-800">{m.Dosage || '1 Daily'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {patent.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black text-emerald-800 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                    Patent Pre-packaged ('P')
                                  </span>
                                  <div className="space-y-1 mt-1">
                                    {patent.map((m, i) => (
                                      <div key={i} className="grid grid-cols-2 gap-1.5 bg-emerald-50/50 border border-emerald-200/80 rounded-md p-1.5 text-[9px]">
                                        <div className="bg-white border border-emerald-100 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Patent Medicine</span>
                                          <span className="font-bold text-slate-900">{m.MedicineDetail}</span>
                                        </div>
                                        <div className="bg-white border border-emerald-100 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Dosage / Usage</span>
                                          <span className="font-mono font-bold text-emerald-800">{m.Dosage || '1 Daily'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Fallback for raw PrescribedMedicines string */}
                              {clinical.length === 0 && patent.length === 0 && dateRecs.some(r => r.PrescribedMedicines) && (
                                <div className="space-y-1">
                                  {dateRecs.filter(r => r.PrescribedMedicines).map((r, i) => {
                                    const raw = r.PrescribedMedicines || '';
                                    const parts = raw.includes(' - ') ? raw.split(' - ') : [raw, 'As directed'];
                                    return (
                                      <div key={i} className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-[9px]">
                                        <div className="bg-white border border-slate-200 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Prescribed Medicine</span>
                                          <span className="font-bold text-slate-900">{parts[0]}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded p-1">
                                          <span className="text-[7px] text-slate-400 font-extrabold uppercase block">Dosage / Usage</span>
                                          <span className="font-mono font-bold text-slate-800">{parts.slice(1).join(' - ') || 'As directed'}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {clinical.length === 0 && patent.length === 0 && !dateRecs.some(r => r.PrescribedMedicines) && (
                                <span className="text-slate-400 italic text-[9px]">No specific medicine lines mapped.</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">Advised Lab Investigations & Medical Report Results:</span>
                  <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-2.5 text-blue-900 font-bold text-[10px] space-y-2">
                    <div>
                      <span className="text-slate-500 font-bold uppercase text-[8px] tracking-wider block mb-0.5">Advised Lab Tests:</span>
                      <p className="font-mono text-slate-800">{selectedRecord.LabTests || selectedRecord.LabTestAdvice || 'No advised lab tests.'}</p>
                    </div>
                    {(() => {
                      const records = historyList.filter(r => r.PatientID === selectedRecord.PatientID);
                      const reportResults = Array.from(new Set(
                        [selectedRecord.MedicalReportResult, ...records.map(r => r.MedicalReportResult)]
                          .map(m => m ? m.trim() : '')
                          .filter(m => m && m !== 'N/A')
                      ));
                      if (reportResults.length > 0) {
                        return (
                          <div className="pt-2 border-t border-blue-200/60">
                            <span className="text-indigo-900 font-extrabold uppercase text-[8px] tracking-wider block mb-0.5">
                              Medical Report Result (nhc_Patient_history):
                            </span>
                            <div className="bg-white border border-indigo-100 rounded-md p-2 text-indigo-950 font-semibold text-[10px] whitespace-pre-wrap">
                              {reportResults.join('\n\n')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block font-bold">Allergies / Warnings:</span>
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-2 font-bold font-mono text-[10px]">
                    {selectedRecord.Allergies || 'None'}
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* State C: CLINIC EMPTY DETAILED STATE PLACEHOLDER */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <UserCheck className="w-12 h-12 text-slate-300" />
            <span className="text-xs font-bold text-slate-600">Select a Patient Profile</span>
            <p className="text-[10px] max-w-xs text-slate-400 mx-auto">
              Click on any patient profile in the archive matrix to inspect their deep clinical diagnostic history, spouse relation, and prescriptions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
