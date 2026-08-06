import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Database, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  X, 
  Save, 
  Info,
  ChevronDown
} from 'lucide-react';

interface QueryHandlerDeskProps {
  bridgeUrl: string;
}

export default function QueryHandlerDesk({ bridgeUrl }: QueryHandlerDeskProps) {
  const collectionsList = [
    { id: 'patients', label: 'Patients (patients)', description: 'Patient registration profiles and demographics' },
    { id: 'appointments', label: 'Appointments (appointments)', description: 'Scheduled doctor clinical appointments' },
    { id: 'tokens', label: 'Queue Tokens (tokens)', description: 'Active patient shift tokens and statuses' },
    { id: 'visits', label: 'Clinical Visits (visits)', description: 'Deep clinical diagnoses and patient treatment histories' },
    { id: 'items', label: 'POS Items (items)', description: 'Pharmacy medicine inventory and pricing' },
    { id: 'accounts', label: 'Accounts (accounts)', description: 'Ledger account definitions & chart of accounts' },
    { id: 'vouchers', label: 'Vouchers (vouchers)', description: 'Journal & ledger financial transaction entries' },
    { id: 'lab_tests', label: 'Lab Tests (lab_tests)', description: 'Diagnostic tests and physical metrics' },
    { id: 'invoice_headers', label: 'Invoices (invoice_headers)', description: 'Sales receipts and billing checkout logs' },
    { id: 'sales_returns', label: 'POS Returns (sales_returns)', description: 'Returned pharmacy items and refunds' },
    { id: 'grns', label: 'Goods Received (grns)', description: 'Inventory purchases and supplier deliveries' },
    { id: 'nhc_patient_history', label: 'PHC History (nhc_patient_history)', description: 'Legacy patient archive and treatment histories' },
    { id: 'users', label: 'Users (users)', description: 'Authorized staff login and role credentials' },
    { id: 'clinic', label: 'Clinic Config (clinic)', description: 'Establishment details, timing, and clinic header' },
    { id: 'sms', label: 'SMS Settings (sms)', description: 'Messaging service credentials and notifications' },
    { id: 'version_control', label: 'Version Control (version_control)', description: 'System version logs and schema migrations' }
  ];

  const [selectedCollection, setSelectedCollection] = useState<string>('patients');
  const [customCollectionName, setCustomCollectionName] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Custom Raw Query mode
  const [useRawQuery, setUseRawQuery] = useState<boolean>(false);
  const [rawQueryString, setRawQueryString] = useState<string>('{}');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null); // null means adding a new record
  const [formFields, setFormFields] = useState<{ [key: string]: any }>({});
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldValue, setNewFieldValue] = useState<string>('');

  useEffect(() => {
    fetchRecords();
  }, [selectedCollection]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${bridgeUrl}/api/query/${selectedCollection}?limit=100`;
      if (useRawQuery && rawQueryString.trim()) {
        try {
          // Verify valid JSON
          JSON.parse(rawQueryString);
          url += `&q=${encodeURIComponent(rawQueryString)}`;
        } catch (e) {
          setError('Invalid query JSON formatting. Please enter a valid JSON object.');
          setLoading(false);
          return;
        }
      } else if (searchTerm.trim()) {
        url += `&q=${encodeURIComponent(searchTerm.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load data from server (Status ${res.status})`);
      }
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching collection records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Sanitize values
    const payload = { ...formFields };
    
    // Attempt to convert numeric strings to actual numbers where appropriate
    Object.keys(payload).forEach(key => {
      const val = payload[key];
      if (typeof val === 'string' && val.trim() !== '') {
        const num = Number(val);
        if (!isNaN(num) && key.toLowerCase().includes('id') === false && key.toLowerCase().includes('no') === false && key !== 'Phone' && key !== 'Mobile') {
          payload[key] = num;
        }
      }
    });

    try {
      let url = `${bridgeUrl}/api/query/${selectedCollection}`;
      let method = 'POST';

      if (editingRecord) {
        url += `/${editingRecord._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const resData = await res.json();
      if (resData.success) {
        setSuccess(editingRecord ? 'Record updated successfully!' : 'New record inserted and stored successfully!');
        setShowModal(false);
        fetchRecords();
      } else {
        throw new Error(resData.error || 'Failed to persist document change.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while storing document.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record? This action is permanent and directly updates the database.')) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${bridgeUrl}/api/query/${selectedCollection}/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setSuccess('Record deleted successfully from database.');
        fetchRecords();
        window.dispatchEvent(new CustomEvent('phc_db_updated'));
      } else {
        throw new Error(data.error || 'Failed to delete record.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting record.');
    }
  };

  const handleDropCollection = async (collName?: string) => {
    const targetColl = (collName || selectedCollection).trim();
    if (!targetColl) return alert('Please specify a collection/table name to delete.');
    
    if (!window.confirm(`⚠️ ARE YOU SURE? You are about to PERMANENTLY DELETE / DROP the database table "${targetColl}". All records inside it will be erased.`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${bridgeUrl}/api/query/${targetColl}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Database table/collection "${targetColl}" deleted successfully!`);
        setRecords([]);
        fetchRecords();
        window.dispatchEvent(new CustomEvent('phc_db_updated'));
      } else {
        throw new Error(data.error || 'Failed to delete table.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting database table.');
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    
    // Seed initial properties based on existing records schema, or general defaults
    const template: { [key: string]: any } = {};
    if (records.length > 0) {
      // Find the record with most keys to serve as template
      let maxKeysRecord = records[0];
      records.forEach(r => {
        if (Object.keys(r).length > Object.keys(maxKeysRecord).length) {
          maxKeysRecord = r;
        }
      });

      Object.keys(maxKeysRecord).forEach(key => {
        if (key !== '_id') {
          template[key] = '';
        }
      });
    } else {
      // General fallbacks based on selected collection
      template['_id'] = Math.random().toString(36).substring(2, 11);
      template['CreatedAt'] = new Date().toISOString();
    }

    setFormFields(template);
    setShowModal(true);
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    const copy = { ...record };
    // Keep _id out of the editable form state directly to avoid mutation
    delete copy._id;
    setFormFields(copy);
    setShowModal(true);
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormFields(prev => ({ ...prev, [key]: value }));
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    setFormFields(prev => ({ ...prev, [newFieldName.trim()]: newFieldValue }));
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleRemoveField = (key: string) => {
    setFormFields(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${selectedCollection}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Extract all distinct keys in current records to render table headers
  const getHeaders = () => {
    const headerSet = new Set<string>();
    records.forEach(r => {
      Object.keys(r).forEach(key => {
        if (key !== '_id') headerSet.add(key);
      });
    });
    return Array.from(headerSet).slice(0, 8); // Max 8 columns to keep table neat
  };

  const headers = getHeaders();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans p-6 overflow-y-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Unified DB Query Handler & Storage Console
              </h1>
              <p className="text-xs text-slate-400">
                Direct dynamic database query layer to view, insert, update and manage records across all clinic modules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportToJson}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg hover:shadow-indigo-600/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Document
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* GRID CONTROL MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* SIDEBAR: COLLECTIONS LIST */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800/60 rounded-xl border border-slate-800 p-4">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
              Select Database Collection
            </h2>
            <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
              {collectionsList.map((col) => {
                const isActive = selectedCollection === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => {
                      setSelectedCollection(col.id);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex flex-col space-y-0.5 ${
                      isActive 
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white font-medium' 
                        : 'bg-slate-800/30 border-transparent hover:bg-slate-850 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    <span className="font-semibold">{col.label}</span>
                    <span className="text-[10px] text-slate-400 leading-normal line-clamp-1">{col.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>Query Tip</span>
            </div>
            <p>
              This query engine connects directly to the underlying Mongo Database collection. Modifying fields here will synchronize client states in real-time.
            </p>
          </div>
        </div>

        {/* MAIN PANEL: RECORD MATRIX */}
        <div className="lg:col-span-3 space-y-4">
          {/* FILTER BAR */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search inputs */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setUseRawQuery(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchRecords()}
                placeholder="Search across primary text fields... (Press Enter to execute)"
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUseRawQuery(!useRawQuery);
                  if(!useRawQuery) {
                    setSearchTerm('');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  useRawQuery 
                    ? 'bg-indigo-600/15 border-indigo-500/60 text-indigo-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Advanced JSON Query
              </button>

              <button
                onClick={fetchRecords}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-indigo-600/10"
              >
                Fetch Results
              </button>
            </div>
          </div>

          {/* ADVANCED RAW JSON QUERY BOX */}
          {useRawQuery && (
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Raw MongoDB Query Filter (JSON)</span>
                <span className="text-[10px] text-slate-500">e.g. {"{"}"Role": "Doctor"{"}"} or {"{"}"InvoiceNo": "INV-001"{"}"}</span>
              </div>
              <textarea
                value={rawQueryString}
                onChange={(e) => setRawQueryString(e.target.value)}
                rows={3}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder='{"Role": "Doctor"}'
              />
            </div>
          )}

          {/* RECORDS TABLE */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/30 gap-3">
              <span className="text-xs font-semibold text-slate-300">
                Live Records found: <strong className="text-white text-sm">{records.length}</strong>
              </span>
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded font-mono">
                  Collection: {selectedCollection}
                </span>

                <button
                  type="button"
                  onClick={() => handleDropCollection(selectedCollection)}
                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded text-[11px] font-bold transition flex items-center gap-1"
                  title={`Delete entire ${selectedCollection} table from database`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Table</span>
                </button>
              </div>
            </div>

            {/* Quick Custom Table Drop Tool */}
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 shrink-0">
                Delete Custom Table:
              </span>
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <input
                  type="text"
                  value={customCollectionName}
                  onChange={(e) => setCustomCollectionName(e.target.value)}
                  placeholder="e.g. version_control"
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customCollectionName) return alert('Enter table name to delete (e.g. version_control)');
                    handleDropCollection(customCollectionName);
                    setCustomCollectionName('');
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition shrink-0"
                >
                  Delete
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Loading live MongoDB records...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                <Database className="w-8 h-8 text-slate-600" />
                <span className="font-semibold text-slate-300">No records found inside collection.</span>
                <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                  No records matched the current criteria. Click "Add Document" to store a custom record inside this database table.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3 pl-4">System ID (_id)</th>
                      {headers.map(head => (
                        <th key={head} className="p-3">{head}</th>
                      ))}
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
                    {records.map((rec) => {
                      const idVal = rec._id || Math.random().toString(36).substring(2, 6);
                      return (
                        <tr key={idVal} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 pl-4 font-mono text-[10px] text-indigo-400 font-bold max-w-[120px] truncate">
                            {idVal}
                          </td>
                          {headers.map(head => {
                            const val = rec[head];
                            let displayVal = '';
                            if (val === undefined || val === null) displayVal = '-';
                            else if (typeof val === 'object') displayVal = JSON.stringify(val);
                            else displayVal = String(val);

                            return (
                              <td key={head} className="p-3 max-w-[180px] truncate" title={displayVal}>
                                {displayVal}
                              </td>
                            );
                          })}
                          <td className="p-3 text-right pr-4 shrink-0">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openEditModal(rec)}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                                title="Edit Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(rec._id)}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT FORM MODAL (ADD & EDIT) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingRecord ? `Edit Document (${editingRecord._id})` : `Add Record to ${selectedCollection}`}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(formFields).map((key) => {
                  const val = formFields[key];
                  const isString = typeof val === 'string' || val === '';
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                          {key}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(key)}
                          className="text-[9px] text-rose-500 hover:underline hover:text-rose-400"
                        >
                          Remove Field
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder={`Enter ${key}...`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Field Builder */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Custom Property / Column</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Field Name (e.g. ContactNumber)"
                    className="flex-1 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Field Value (e.g. 03001234567)"
                    className="flex-1 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-lg transition"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-indigo-600/15"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
