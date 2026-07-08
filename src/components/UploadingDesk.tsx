/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  FileSpreadsheet, 
  Barcode, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check 
} from 'lucide-react';
import { Item, LabTest } from '../types';

interface UploadingDeskProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  labTests: LabTest[];
  // Since we want to update the master labTests, we'll pass down the setter from App.tsx as well!
  setLabTests: React.Dispatch<React.SetStateAction<LabTest[]>>;
}

export default function UploadingDesk({
  items,
  setItems,
  labTests,
  setLabTests
}: UploadingDeskProps) {
  const [activeUploadTab, setActiveUploadTab] = useState<'medicines' | 'labtests' | 'barcode'>('medicines');
  
  // Paste inputs
  const [medicinePasteText, setMedicinePasteText] = useState('');
  const [labTestPasteText, setLabTestPasteText] = useState('');
  
  // Previews
  const [medicinePreview, setMedicinePreview] = useState<Item[]>([]);
  const [labTestPreview, setLabTestPreview] = useState<LabTest[]>([]);
  
  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [barcodeLog, setBarcodeLog] = useState<{ id: string; timestamp: string; item: string; barcode: string; qty: number; newStock: number }[]>([]);

  // Parser: Comma, Tab or Semicolon Separated text
  const parseMedicineData = (text: string): Item[] => {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const parsed: Item[] = [];
    
    // Header check
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('itemid') || firstLine.includes('itemname') || firstLine.includes('id') || firstLine.includes('name')) {
      startIndex = 1; // skip header line
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Split by tab, comma, or semicolon
      let cols = line.split('\t');
      if (cols.length < 2) cols = line.split(',');
      if (cols.length < 2) cols = line.split(';');
      
      if (cols.length >= 2) {
        const itemid = cols[0]?.trim() || `ITM-${Math.floor(100 + Math.random() * 900)}`;
        const name = cols[1]?.trim() || 'Unnamed Medicine';
        const price = parseFloat(cols[2]?.trim() || '0') || 10;
        const purchasePrice = parseFloat(cols[3]?.trim() || '0') || (price * 0.8);
        const cStock = parseInt(cols[4]?.trim() || '0', 10) || 0;
        const minStock = parseInt(cols[5]?.trim() || '0', 10) || 10;
        const unit = cols[6]?.trim() || 'Tab';
        
        parsed.push({
          ItemID: itemid,
          ItemName: name,
          Price: price,
          PurchasePrice: purchasePrice,
          CStock: cStock,
          MinStock: minStock,
          Unit: unit
        });
      }
    }
    return parsed;
  };

  const parseLabTestData = (text: string): LabTest[] => {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const parsed: LabTest[] = [];
    
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('tid') || firstLine.includes('testname') || firstLine.includes('id') || firstLine.includes('name')) {
      startIndex = 1;
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      let cols = line.split('\t');
      if (cols.length < 2) cols = line.split(',');
      if (cols.length < 2) cols = line.split(';');
      
      if (cols.length >= 2) {
        const tid = cols[0]?.trim() || `TST-${Math.floor(100 + Math.random() * 900)}`;
        const name = cols[1]?.trim() || 'Unnamed Lab Test';
        const cost = parseFloat(cols[2]?.trim() || '0') || 500;
        
        parsed.push({
          TID: tid,
          TestName: name,
          Cost: cost
        });
      }
    }
    return parsed;
  };

  const handleMedicineProcess = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = parseMedicineData(medicinePasteText);
      if (res.length === 0) {
        setErrorMsg('Could not find any valid row. Copy-paste columns: ItemID, ItemName, RetailPrice, PurchasePrice, CurrentStock, MinStock, Unit.');
        return;
      }
      setMedicinePreview(res);
      setSuccessMsg(`Successfully parsed ${res.length} medicines. Please review the table preview below.`);
    } catch (e: any) {
      setErrorMsg(`Error parsing data: ${e.message}`);
    }
  };

  const handleMedicineSave = (append: boolean) => {
    if (medicinePreview.length === 0) return;
    
    setItems((prev) => {
      let updated = [...prev];
      if (!append) {
        // Overwrite but keep any that might not be in uploader, or full overwrite?
        // Let's do a smart merge/replace. If ItemID matches, overwrite. If not, append.
        medicinePreview.forEach(newItem => {
          const idx = updated.findIndex(u => u.ItemID.toLowerCase() === newItem.ItemID.toLowerCase());
          if (idx > -1) {
            updated[idx] = newItem;
          } else {
            updated.push(newItem);
          }
        });
      } else {
        // Simple merge
        medicinePreview.forEach(newItem => {
          const idx = updated.findIndex(u => u.ItemID.toLowerCase() === newItem.ItemID.toLowerCase());
          if (idx > -1) {
            updated[idx] = {
              ...newItem,
              CStock: updated[idx].CStock + newItem.CStock // Add stock together
            };
          } else {
            updated.push(newItem);
          }
        });
      }
      
      // Save to localStorage
      localStorage.setItem('cms_items', JSON.stringify(updated));
      return updated;
    });

    setSuccessMsg(`Master Medicines DB updated successfully with ${medicinePreview.length} items!`);
    setMedicinePreview([]);
    setMedicinePasteText('');
  };

  const handleLabTestProcess = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = parseLabTestData(labTestPasteText);
      if (res.length === 0) {
        setErrorMsg('Could not find any valid row. Copy-paste columns: TID, TestName, Cost.');
        return;
      }
      setLabTestPreview(res);
      setSuccessMsg(`Successfully parsed ${res.length} tests. Please review the table preview below.`);
    } catch (e: any) {
      setErrorMsg(`Error parsing data: ${e.message}`);
    }
  };

  const handleLabTestSave = () => {
    if (labTestPreview.length === 0) return;
    
    setLabTests((prev) => {
      const updated = [...prev];
      labTestPreview.forEach(newTest => {
        const idx = updated.findIndex(u => u.TID.toLowerCase() === newTest.TID.toLowerCase());
        if (idx > -1) {
          updated[idx] = newTest;
        } else {
          updated.push(newTest);
        }
      });
      localStorage.setItem('cms_lab_tests', JSON.stringify(updated));
      return updated;
    });

    setSuccessMsg(`Master Diagnostics DB updated successfully with ${labTestPreview.length} test codes!`);
    setLabTestPreview([]);
    setLabTestPasteText('');
  };

  // Barcode entry stock incrementing
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    const term = barcodeInput.trim();
    if (!term) return;

    // Search for item by Barcode/ItemID or Name exactly
    const matchedItem = items.find(
      (itm) => itm.ItemID.toLowerCase() === term.toLowerCase() || 
               itm.ItemName.toLowerCase().includes(term.toLowerCase())
    );

    if (!matchedItem) {
      setErrorMsg(`No medicine found matching Barcode/Code: "${term}"`);
      return;
    }

    const updatedStock = matchedItem.CStock + barcodeQty;
    
    setItems((prev) => {
      const updated = prev.map((itm) => 
        itm.ItemID === matchedItem.ItemID ? { ...itm, CStock: updatedStock } : itm
      );
      localStorage.setItem('cms_items', JSON.stringify(updated));
      return updated;
    });

    // Record in audit log
    const logEntry = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      item: matchedItem.ItemName,
      barcode: matchedItem.ItemID,
      qty: barcodeQty,
      newStock: updatedStock
    };

    setBarcodeLog((prev) => [logEntry, ...prev]);
    setSuccessMsg(`Barcode Stock update processed! ${matchedItem.ItemName} stock increased from ${matchedItem.CStock} to ${updatedStock}.`);
    setBarcodeInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" id="uploading-desk-root">
      
      {/* Tab bar header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <FileSpreadsheet className="w-5 h-5 text-indigo-500 mr-2" />
            Excel Bulk Uploader & Barcode Inventory Deck
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seamless Excel copy-paste importing of medicines & tests. Record regular stock updates via Barcode reader simulation.
          </p>
        </div>
        
        {/* Navigation subtabs */}
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              setActiveUploadTab('medicines');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeUploadTab === 'medicines' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medicine Inventory Upload
          </button>
          <button
            onClick={() => {
              setActiveUploadTab('labtests');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeUploadTab === 'labtests' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Diagnostics Upload
          </button>
          <button
            onClick={() => {
              setActiveUploadTab('barcode');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeUploadTab === 'barcode' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-3.5 h-3.5 mr-1" />
            <span>Barcode Stock Entry</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg flex items-start space-x-2 text-emerald-800 text-xs shadow-xs animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg flex items-start space-x-2 text-rose-800 text-xs shadow-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Uploading Medicine Section */}
      {activeUploadTab === 'medicines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Paste card */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Paste Excel Medicine List</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Copy columns from Excel sheet (or .csv) and paste them directly into this area.</p>
            </div>

            {/* Template Sample */}
            <div className="bg-slate-50 p-3 rounded border border-slate-150 font-mono text-[9px] text-slate-600 space-y-1">
              <span className="font-extrabold text-indigo-600 block">EXPECTED COLUMN STRUCTURE:</span>
              <p className="border-b border-slate-200 pb-1">ItemID [TAB] ItemName [TAB] RetailPrice [TAB] PurchasePrice [TAB] Stock [TAB] MinStock [TAB] Unit</p>
              <p className="text-slate-400">ITM-011   Amoxil 500mg Cap   15.50   12.00   600   100   Cap</p>
              <p className="text-slate-400">ITM-012   Entamizole Tab     9.00    7.20    450   50    Tab</p>
            </div>

            <textarea
              value={medicinePasteText}
              onChange={(e) => setMedicinePasteText(e.target.value)}
              placeholder="Paste raw data here from your excel spreadsheet..."
              rows={10}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />

            <button
              onClick={handleMedicineProcess}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Validate & Preview Rows</span>
            </button>
          </div>

          {/* Preview grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[460px]">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bulk Import Preview</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Review items before writing to database.</p>
              </div>
              
              {medicinePreview.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleMedicineSave(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Merge & Add Stock
                  </button>
                  <button
                    onClick={() => handleMedicineSave(false)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-bold rounded flex items-center"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Replace Existing DB
                  </button>
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              {medicinePreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
                  <Database className="w-10 h-10 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold">No Records Parsed</span>
                  <p className="text-[10px] max-w-xs text-slate-400">Validate paste data in the left panel to populate the preview grid.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-xxs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                    <tr>
                      <th className="px-3 py-2">Item Code</th>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-right">Retail</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-right">Initial Stock</th>
                      <th className="px-3 py-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {medicinePreview.map((itm, index) => (
                      <tr key={index} className="hover:bg-slate-55">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{itm.ItemID}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{itm.ItemName}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">Rs. {itm.Price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">Rs. {itm.PurchasePrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-900 font-bold">{itm.CStock}</td>
                        <td className="px-3 py-2 text-slate-500 font-bold">{itm.Unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uploading Diagnostic / Lab Tests Section */}
      {activeUploadTab === 'labtests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Paste card */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Paste Excel Diagnostics List</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Copy columns from Excel sheet (or .csv) and paste them directly into this area.</p>
            </div>

            {/* Template Sample */}
            <div className="bg-slate-50 p-3 rounded border border-slate-150 font-mono text-[9px] text-slate-600 space-y-1">
              <span className="font-extrabold text-indigo-600 block">EXPECTED COLUMN STRUCTURE:</span>
              <p className="border-b border-slate-200 pb-1">TID [TAB] TestName [TAB] Cost</p>
              <p className="text-slate-400">TST-009   Ultrasound Abdomen   1500</p>
              <p className="text-slate-400">TST-010   Thyroid Profile T3 T4 TSH   2200</p>
            </div>

            <textarea
              value={labTestPasteText}
              onChange={(e) => setLabTestPasteText(e.target.value)}
              placeholder="Paste raw test data here from your excel sheet..."
              rows={10}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />

            <button
              onClick={handleLabTestProcess}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Validate & Preview Rows</span>
            </button>
          </div>

          {/* Preview grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[460px]">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Lab Test Import Preview</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Review items before writing to database.</p>
              </div>
              
              {labTestPreview.length > 0 && (
                <button
                  onClick={handleLabTestSave}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-bold rounded flex items-center shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Apply & Save Test Catalog
                </button>
              )}
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              {labTestPreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
                  <Database className="w-10 h-10 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold">No Diagnostic Records Parsed</span>
                  <p className="text-[10px] max-w-xs text-slate-400">Validate paste data in the left panel to populate the preview grid.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-xxs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                    <tr>
                      <th className="px-3 py-2">Test Code</th>
                      <th className="px-3 py-2">Diagnostic Investigation Name</th>
                      <th className="px-3 py-2 text-right">Standard Fee/Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {labTestPreview.map((tst, index) => (
                      <tr key={index} className="hover:bg-slate-55">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{tst.TID}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{tst.TestName}</td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">Rs. {tst.Cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode stock updating section */}
      {activeUploadTab === 'barcode' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Barcode scanner console */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-lg space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">Barcode Simulator Console</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Simulate scanning a box of medicine by typing its item code or barcode.</p>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Scan or Enter Barcode / Code</label>
                <div className="relative">
                  <Barcode className="absolute left-3.5 top-3 w-5 h-5 text-indigo-400 shrink-0" />
                  <input
                    type="text"
                    required
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Type e.g., ITM-001 or Panadol..."
                    className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-indigo-300 placeholder:text-slate-600 rounded-lg py-3 pl-11 pr-4 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-1.5 mt-2">
                  {items.slice(0, 5).map((itm) => (
                    <button
                      type="button"
                      key={itm.ItemID}
                      onClick={() => setBarcodeInput(itm.ItemID)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-[10px] font-mono rounded text-slate-300"
                    >
                      {itm.ItemID}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Inward Quantity (Increment)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={barcodeQty}
                  onChange={(e) => setBarcodeQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white rounded-lg py-3 px-4 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4 text-white shrink-0 animate-spin" />
                <span>Transmit & Append Stock</span>
              </button>
            </form>
          </div>

          {/* Audit trail Log */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[400px]">
            <div className="border-b border-slate-100 pb-2 mb-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Barcode Stock Logs</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time audit trail of processed scans in this session.</p>
            </div>

            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              {barcodeLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-1.5">
                  <Barcode className="w-8 h-8 text-slate-300" />
                  <span className="text-xxs font-bold uppercase tracking-wider text-slate-500">Waiting for Barcode Signals...</span>
                  <p className="text-[9px] max-w-xs text-slate-400">Scanned barcode events will log here sequentially.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {barcodeLog.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50 flex justify-between items-center text-xxs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-slate-100 text-slate-700 font-mono font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                            {log.barcode}
                          </span>
                          <span className="font-extrabold text-slate-900 text-[11px]">{log.item}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Scan ID: {log.id} • Transmitted at {log.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 block">+{log.qty} Units</span>
                        <span className="text-[9px] text-slate-500 font-mono">Closing Stock: {log.newStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
