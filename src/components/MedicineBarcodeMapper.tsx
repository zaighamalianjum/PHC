import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Upload,
  Search,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCw,
  Zap,
  Building2,
  FileText,
  Tag,
  ArrowRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { Item, BarcodeMapping } from '../types';
import ItemQRScannerModal from './ItemQRScannerModal';

interface MedicineBarcodeMapperProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  onMappingAdded?: (mapping: BarcodeMapping) => void;
  currentUser?: any;
}

export default function MedicineBarcodeMapper({
  items,
  setItems,
  onMappingAdded,
  currentUser
}: MedicineBarcodeMapperProps) {
  const [mappings, setMappings] = useState<BarcodeMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [vendorName, setVendorName] = useState('BM Private Limited');
  const [notes, setNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Table Search Filter
  const [tableSearch, setTableSearch] = useState('');

  // Test Simulator State
  const [testBarcodeInput, setTestBarcodeInput] = useState('');
  const [testResult, setTestResult] = useState<{ found: boolean; item?: Item; mapping?: BarcodeMapping } | null>(null);

  // Fetch Mappings from MongoDB backend
  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/barcode-mappings');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          setMappings(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch barcode mappings from MongoDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  // Filtered items for form dropdown search
  const filteredItems = items.filter((itm) => {
    const q = itemSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      itm.ItemID.toLowerCase().includes(q) ||
      itm.ItemName.toLowerCase().includes(q) ||
      (itm.VendorBarcode && itm.VendorBarcode.toLowerCase().includes(q))
    );
  });

  const selectedItemObj = items.find((i) => i.ItemID === selectedItemId);

  // Handle Save Barcode Association
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode) {
      setErrorMsg('Please enter or scan a barcode/QR code.');
      return;
    }

    if (!selectedItemId) {
      setErrorMsg('Please select an inventory Medicine ItemID to associate.');
      return;
    }

    const matchedItem = items.find((i) => i.ItemID === selectedItemId);

    const payload: BarcodeMapping = {
      Barcode: cleanBarcode,
      ItemID: selectedItemId,
      ItemName: matchedItem?.ItemName || '',
      VendorName: vendorName.trim() || 'BM Private Limited',
      Notes: notes.trim(),
      CreatedBy: currentUser?.FullName || 'Pharmacist'
    };

    try {
      setIsLoading(true);
      const res = await fetch('/api/barcode-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save barcode mapping.');
      }

      // Update local items state so VendorBarcode reflects immediately
      setItems((prevItems) =>
        prevItems.map((itm) =>
          itm.ItemID === selectedItemId ? { ...itm, VendorBarcode: cleanBarcode } : itm
        )
      );

      setSuccessMsg(`✅ Success! Barcode "${cleanBarcode}" mapped to "${matchedItem?.ItemName}" in MongoDB.`);
      
      // Refresh list
      await fetchMappings();

      if (onMappingAdded) {
        onMappingAdded(payload);
      }

      // Reset form
      setBarcodeInput('');
      setSelectedItemId('');
      setItemSearchQuery('');
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving barcode association.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Barcode Mapping
  const handleDeleteMapping = async (barcodeToDelete: string, itemId?: string) => {
    if (!window.confirm(`Are you sure you want to remove barcode mapping "${barcodeToDelete}"?`)) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/barcode-mappings/${encodeURIComponent(barcodeToDelete)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMappings((prev) => prev.filter((m) => m.Barcode !== barcodeToDelete));

        // Clear VendorBarcode from items array if matched
        if (itemId) {
          setItems((prevItems) =>
            prevItems.map((itm) =>
              itm.ItemID === itemId ? { ...itm, VendorBarcode: undefined } : itm
            )
          );
        }

        setSuccessMsg(`Mapping for "${barcodeToDelete}" deleted.`);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to delete barcode mapping.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting barcode mapping.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR Scan Result from scanner/file modal
  const handleQRScanResult = (parsed: { itemId: string; itemName: string; rawText: string }) => {
    const raw = parsed.rawText || parsed.itemId;
    setBarcodeInput(raw);
    setIsScannerOpen(false);

    // Check if barcode is already mapped
    const existing = mappings.find((m) => m.Barcode.toLowerCase() === raw.toLowerCase());
    if (existing) {
      setSelectedItemId(existing.ItemID);
      setVendorName(existing.VendorName || 'BM Private Limited');
      setSuccessMsg(`Scanned existing barcode for ${existing.ItemName} (ID: ${existing.ItemID})!`);
    } else {
      setSuccessMsg(`QR Code "${raw}" captured! Select medicine item below to map.`);
    }
  };

  // Handle Test Scan Simulation
  const handleRunTestScan = (codeToTest: string) => {
    const trimmed = codeToTest.trim().toLowerCase();
    if (!trimmed) {
      setTestResult(null);
      return;
    }

    // 1. Check in mappings list
    const mapping = mappings.find((m) => m.Barcode.toLowerCase() === trimmed);
    if (mapping) {
      const item = items.find((i) => i.ItemID === mapping.ItemID);
      setTestResult({ found: true, item, mapping });
      return;
    }

    // 2. Check directly in items by VendorBarcode or ItemID
    const directItem = items.find(
      (i) =>
        (i.VendorBarcode && i.VendorBarcode.toLowerCase() === trimmed) ||
        i.ItemID.toLowerCase() === trimmed
    );

    if (directItem) {
      setTestResult({ found: true, item: directItem });
    } else {
      setTestResult({ found: false });
    }
  };

  // Filtered mappings for table display
  const displayMappings = mappings.filter((m) => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.Barcode.toLowerCase().includes(q) ||
      m.ItemID.toLowerCase().includes(q) ||
      (m.ItemName && m.ItemName.toLowerCase().includes(q)) ||
      (m.VendorName && m.VendorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl shadow-md border border-emerald-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <QrCode className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xxs font-black uppercase tracking-wider flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
                MongoDB Lookup Collection
              </span>
              <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-xxs font-extrabold uppercase">
                Vendor QR Mapping
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center">
              <QrCode className="w-7 h-7 mr-2 text-emerald-400" />
              Medicine Barcode & QR Code Mapper
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl font-medium leading-relaxed">
              Scan manufacturer QR codes (such as <strong>BM Private Limited</strong> medicine packages) once, associate them with an inventory <strong>ItemID</strong>, and save to MongoDB. Next time a pharmacist scans that box at POS checkout or Store Sales, the app automatically pulls the medicine into the invoice!
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={fetchMappings}
              disabled={isLoading}
              className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync MongoDB</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              <span>Scan QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700 text-xs font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-black cursor-pointer">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add / Map New Barcode */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <Link2 className="w-4 h-4 text-emerald-600 mr-2" />
                Map Vendor Barcode / QR Code
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                1-Time Setup
              </span>
            </div>

            <form onSubmit={handleSaveMapping} className="space-y-4">
              {/* Barcode Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center">
                    <QrCode className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    Vendor Package Barcode / QR Code *
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-emerald-600" />
                    <span>Scan QR / Upload</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Scan package QR or type code (e.g., BM-DROP-42 or 890123)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Upload QR image or enter code"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Tip: Upload QR image or use hardware scanner for BM Private Limited medicine box QR code.
                </p>
              </div>

              {/* Select ItemID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Package className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  Select Inventory Medicine ItemID *
                </label>

                {/* Filter input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search medicine by name or ID..."
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                >
                  <option value="">-- Choose Medicine ItemID ({filteredItems.length} available) --</option>
                  {filteredItems.map((itm) => (
                    <option key={itm.ItemID} value={itm.ItemID}>
                      [{itm.ItemID}] {itm.ItemName} ({itm.Unit}) - Stock: {itm.CStock} - Rs. {itm.Price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Item Preview Card */}
              {selectedItemObj && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-extrabold text-emerald-950">
                    <span>{selectedItemObj.ItemName}</span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded text-xxs uppercase font-black">
                      {selectedItemObj.ItemID}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800">
                    <span>Retail Price: <strong>Rs. {selectedItemObj.Price}</strong></span>
                    <span>Current Stock: <strong>{selectedItemObj.CStock} {selectedItemObj.Unit}</strong></span>
                  </div>
                </div>
              )}

              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  Vendor / Manufacturer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. BM Private Limited"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <FileText className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  Notes / Batch Details (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard 30ml drops pack QR code..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save Barcode Association to MongoDB</span>
              </button>
            </form>
          </div>

          {/* Instant Test Simulator */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 text-white rounded-2xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
              <Zap className="w-4 h-4 mr-1.5 text-amber-400" />
              Instant Scan Simulator Test
            </h3>
            <p className="text-[11px] text-slate-300">
              Test any scanned code or QR text here to verify if it successfully resolves to a medicine in MongoDB.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan or type QR code to test..."
                value={testBarcodeInput}
                onChange={(e) => {
                  setTestBarcodeInput(e.target.value);
                  handleRunTestScan(e.target.value);
                }}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleRunTestScan(testBarcodeInput)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Test
              </button>
            </div>

            {testResult && (
              <div className="mt-2 p-3 rounded-xl text-xs border">
                {testResult.found ? (
                  <div className="bg-emerald-950/80 border-emerald-500/50 text-emerald-200 p-2.5 rounded-lg space-y-1">
                    <div className="flex items-center space-x-1.5 text-emerald-300 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>MATCH FOUND!</span>
                    </div>
                    <div className="font-bold text-white text-sm">
                      {testResult.item?.ItemName || testResult.mapping?.ItemName}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300">
                      <span>ItemID: <strong className="text-emerald-300">{testResult.item?.ItemID || testResult.mapping?.ItemID}</strong></span>
                      <span>Price: <strong>Rs. {testResult.item?.Price}</strong></span>
                      <span>Stock: <strong>{testResult.item?.CStock}</strong></span>
                    </div>
                    <p className="text-[10px] text-emerald-400 pt-1 border-t border-emerald-900">
                      ⚡ Ready! Scanning this barcode at POS Checkout will automatically add 1x <strong>{testResult.item?.ItemName}</strong> to basket.
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-950/80 border-rose-500/50 text-rose-200 p-2.5 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>No medicine matched in MongoDB for code "{testBarcodeInput}". Map it above to enable auto-add!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Table: Active Barcode Mappings in MongoDB */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            {/* Table Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                  <Tag className="w-4 h-4 text-emerald-600 mr-2" />
                  MongoDB Barcode Lookup Table
                </h3>
                <p className="text-xs text-slate-500">
                  Total {mappings.length} mapped vendor QR codes stored in database
                </p>
              </div>

              {/* Table Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search barcode, ItemID, or name..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto flex-1 min-h-[350px]">
              {isLoading && mappings.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
                  <p className="text-xs font-bold">Loading barcode lookup records from MongoDB...</p>
                </div>
              ) : displayMappings.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <QrCode className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No Barcode Associations Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Use the form on the left to scan a BM Private Limited medicine box QR code and link it to an ItemID.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Vendor / QR Code</th>
                      <th className="px-4 py-3">Associated Medicine</th>
                      <th className="px-4 py-3">Item ID</th>
                      <th className="px-4 py-3">Linked Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayMappings.map((m) => {
                      const matchedItem = items.find((i) => i.ItemID === m.ItemID);
                      return (
                        <tr key={m.Barcode} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs inline-block">
                                {m.Barcode}
                              </span>
                              <div className="text-[10px] font-extrabold text-emerald-700 flex items-center">
                                <Building2 className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                                {m.VendorName || 'BM Private Limited'}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-extrabold text-slate-900">
                            <div>{m.ItemName || matchedItem?.ItemName || 'N/A'}</div>
                            {matchedItem && (
                              <div className="text-[10px] text-slate-500 font-normal">
                                Stock: {matchedItem.CStock} {matchedItem.Unit} • Price: Rs. {matchedItem.Price}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-black text-xxs">
                              {m.ItemID}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            {m.LinkedAt ? new Date(m.LinkedAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="px-4 py-3 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setTestBarcodeInput(m.Barcode);
                                handleRunTestScan(m.Barcode);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xxs font-bold transition cursor-pointer"
                              title="Test Scan"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(m.Barcode, m.ItemID)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xxs font-bold transition cursor-pointer"
                              title="Delete Mapping"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <ItemQRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleQRScanResult}
          onScanResult={handleQRScanResult}
        />
      )}
    </div>
  );
}
