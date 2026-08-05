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
  Check,
  Sparkles,
  Search
} from 'lucide-react';
import { Item, LabTest, MongoDbSettings, NhcPatientHistory, SmartLocatorMedicine } from '../types';

interface UploadingDeskProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  labTests: LabTest[];
  // Since we want to update the master labTests, we'll pass down the setter from App.tsx as well!
  setLabTests: React.Dispatch<React.SetStateAction<LabTest[]>>;
  mongoDbSettings: MongoDbSettings;
  nhcPatients?: NhcPatientHistory[];
  setNhcPatients?: React.Dispatch<React.SetStateAction<NhcPatientHistory[]>>;
  smartLocatorMedicines: SmartLocatorMedicine[];
  setSmartLocatorMedicines: React.Dispatch<React.SetStateAction<SmartLocatorMedicine[]>>;
}

export default function UploadingDesk({
  items,
  setItems,
  labTests,
  setLabTests,
  mongoDbSettings,
  nhcPatients,
  setNhcPatients,
  smartLocatorMedicines,
  setSmartLocatorMedicines
}: UploadingDeskProps) {
  const [activeUploadTab, setActiveUploadTab] = useState<'medicines' | 'labtests' | 'nhcpatienthistory' | 'barcode' | 'smartlocator'>('medicines');
  
  // Paste inputs
  const [medicinePasteText, setMedicinePasteText] = useState('');
  const [labTestPasteText, setLabTestPasteText] = useState('');
  const [nhcPasteText, setNhcPasteText] = useState('');
  
  // Previews
  const [medicinePreview, setMedicinePreview] = useState<Item[]>([]);
  const [labTestPreview, setLabTestPreview] = useState<LabTest[]>([]);
  const [nhcPreview, setNhcPreview] = useState<NhcPatientHistory[]>([]);
  const [medPreviewCategoryFilter, setMedPreviewCategoryFilter] = useState<string>('ALL');
  const [dragActiveMed, setDragActiveMed] = useState(false);
  const fileInputMedRef = React.useRef<HTMLInputElement>(null);
  
  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeQty, setBarcodeQty] = useState(1);
  const [barcodeLog, setBarcodeLog] = useState<{ id: string; timestamp: string; item: string; barcode: string; qty: number; newStock: number }[]>([]);

  // NHC File Uploader states
  const [isUploadingNhc, setIsUploadingNhc] = useState(false);
  const [uploadProgressTextNhc, setUploadProgressTextNhc] = useState('');
  const [uploadModeNhc, setUploadModeNhc] = useState<'wipe' | 'merge'>('wipe');
  const [dragActiveNhc, setDragActiveNhc] = useState(false);
  const fileInputNhcRef = React.useRef<HTMLInputElement>(null);

  // Smart Locator States
  const fileInputSmartRef = React.useRef<HTMLInputElement>(null);
  const [smartLocatorPasteText, setSmartLocatorPasteText] = useState('');
  const [smartLocatorPreview, setSmartLocatorPreview] = useState<SmartLocatorMedicine[]>([]);
  const [uploadModeSmart, setUploadModeSmart] = useState<'wipe' | 'merge'>('wipe');
  const [dragActiveSmart, setDragActiveSmart] = useState(false);
  const [smartLocatorSearch, setSmartLocatorSearch] = useState('');

  // Handle processing of pasted text
  const handleSmartLocatorProcess = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = parseSmartLocatorMedicines(smartLocatorPasteText);
      if (res.length === 0) {
        setErrorMsg('Could not find any valid smart locator row. Copy-paste columns: Symptoms, MedicineName, Dosage, Composition.');
        return;
      }
      setSmartLocatorPreview(res);
      setSuccessMsg(`Successfully parsed ${res.length} smart locator records. Please review the table preview below.`);
    } catch (e: any) {
      setErrorMsg(`Error parsing data: ${e.message}`);
    }
  };

  const parseSmartLocatorMedicines = (text: string): SmartLocatorMedicine[] => {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const parsed: SmartLocatorMedicine[] = [];
    
    let startIndex = 0;
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('symptom') || firstLine.includes('medicine') || firstLine.includes('dosage') || firstLine.includes('composition')) {
        startIndex = 1;
      }
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      let cols = line.split('\t');
      if (cols.length < 2) cols = line.split(',');
      if (cols.length < 2) cols = line.split(';');
      
      if (cols.length >= 2) {
        const symptoms = cols[0]?.trim() || '';
        const medicineName = cols[1]?.trim() || '';
        const dosage = cols[2]?.trim() || '';
        const composition = cols[3]?.trim() || '';
        
        if (symptoms || medicineName) {
          parsed.push({
            Symptoms: symptoms,
            MedicineName: medicineName,
            Dosage: dosage,
            Composition: composition
          });
        }
      }
    }
    return parsed;
  };

  const handleSmartFileRead = (file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setErrorMsg('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) spreadsheet.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        import('xlsx').then((XLSX) => {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rawData.length === 0) {
            setErrorMsg('The Excel sheet appears to be empty.');
            return;
          }

          const headers = rawData[0].map(h => String(h || '').toLowerCase().trim());
          const symptomsIndex = headers.findIndex(h => h.includes('symptom') || h.includes('indication') || h.includes('disease'));
          const medicineIndex = headers.findIndex(h => h.includes('medicinename') || h.includes('medicine name') || h.includes('medicine') || h === 'name');
          const dosageIndex = headers.findIndex(h => h.includes('dosage') || h.includes('dose') || h.includes('frequency'));
          const compositionIndex = headers.findIndex(h => h.includes('composition') || h.includes('formula') || h.includes('ingredient'));

          const startRow = (symptomsIndex >= 0 || medicineIndex >= 0 || dosageIndex >= 0 || compositionIndex >= 0) ? 1 : 0;
          
          const symIdx = symptomsIndex >= 0 ? symptomsIndex : 0;
          const medIdx = medicineIndex >= 0 ? medicineIndex : 1;
          const dosIdx = dosageIndex >= 0 ? dosageIndex : 2;
          const compIdx = compositionIndex >= 0 ? compositionIndex : 3;

          const parsed: SmartLocatorMedicine[] = [];
          for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            
            const symptoms = String(row[symIdx] || '').trim();
            const medicineName = String(row[medIdx] || '').trim();
            const dosage = String(row[dosIdx] || '').trim();
            const composition = String(row[compIdx] || '').trim();
            
            if (symptoms || medicineName) {
              parsed.push({
                Symptoms: symptoms,
                MedicineName: medicineName,
                Dosage: dosage,
                Composition: composition
              });
            }
          }

          if (parsed.length === 0) {
            setErrorMsg('Could not extract any symptoms or medicine rows. Check column headers.');
          } else {
            setSmartLocatorPreview(parsed);
            setSuccessMsg(`Loaded ${parsed.length} rows from ${file.name}. Review below and click Save!`);
          }
        });
      } catch (err: any) {
        setErrorMsg(`Excel Parse Error: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragSmart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveSmart(true);
    } else if (e.type === 'dragleave') {
      setDragActiveSmart(false);
    }
  };

  const handleDropSmart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSmart(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSmartFileRead(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChangeSmart = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSmartFileRead(e.target.files[0]);
    }
  };

  const handleSmartLocatorSave = (append: boolean) => {
    if (smartLocatorPreview.length === 0) return;

    let updatedList: SmartLocatorMedicine[] = [];
    setSmartLocatorMedicines(prev => {
      let updated: SmartLocatorMedicine[] = [];
      if (!append) {
        updated = [...smartLocatorPreview];
      } else {
        const existingKeys = new Set(prev.map(p => `${p.MedicineName.toLowerCase()}::${p.Symptoms.toLowerCase()}`));
        const newItems = smartLocatorPreview.filter(n => !existingKeys.has(`${n.MedicineName.toLowerCase()}::${n.Symptoms.toLowerCase()}`));
        updated = [...prev, ...newItems];
      }
      updatedList = updated;
      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/smart-locator/bulk?wipe=${!append}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(append ? smartLocatorPreview : updatedList)
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        return res.json();
      })
      .then(() => {
        console.log('Successfully synchronized smart locator database with MongoDB.');
      })
      .catch(err => {
        console.error('Failed to sync smart locator data to MongoDB:', err.message);
        setErrorMsg(`Smart locator updated locally but MongoDB sync failed: ${err.message}`);
      });
    }

    if (!append) {
      setSuccessMsg(`Smart Locator DB successfully overwritten with ${smartLocatorPreview.length} records!`);
    } else {
      setSuccessMsg(`Smart Locator DB updated successfully! Merged ${smartLocatorPreview.length} records into the existing database.`);
    }

    setSmartLocatorPreview([]);
    setSmartLocatorPasteText('');
  };

  // Medicine Category Normalizer
  const normalizeCategory = (input: string, itemName: string = ''): string => {
    const clean = (input || '').trim().toLowerCase();
    const cleanName = (itemName || '').trim().toLowerCase();

    if (clean.includes('bm') || clean.includes('b.m')) return 'BM Drops';
    if (clean.includes('mother') || clean.includes('tincture') || clean.includes('q d') || clean.includes('q.d') || clean === 'q') return 'Q D DROPS';
    if (clean.includes('potency 30') || clean === '30' || clean === 'p30' || clean.includes('potency30')) return 'Potency 30';
    if (clean.includes('potency 200') || clean === '200' || clean === 'p200' || clean.includes('potency200')) return 'Potency 200';
    if (clean.includes('syrup') || clean.includes('syp')) return 'Syrup';
    if (clean === 'drop' || clean === 'drops') return 'Drops';
    if (clean.includes('tab')) return 'Tab';
    if (clean.includes('cap')) return 'Cap';
    if (clean.includes('inj')) return 'Injection';
    if (clean.includes('oint') || clean.includes('cream')) return 'Ointment';

    if (input && input.trim()) return input.trim();

    // Fallback smart inference from item name
    if (cleanName.includes('bm drops') || cleanName.includes('bm-')) return 'BM Drops';
    if (cleanName.includes(' q') || cleanName.includes(' mother') || cleanName.endsWith(' q')) return 'Q D DROPS';
    if (cleanName.includes(' 30') || cleanName.endsWith('30') || cleanName.includes(' 30c')) return 'Potency 30';
    if (cleanName.includes(' 200') || cleanName.endsWith('200') || cleanName.includes(' 200c')) return 'Potency 200';
    if (cleanName.includes('syrup') || cleanName.includes('syp')) return 'Syrup';
    if (cleanName.includes('drop')) return 'Drops';
    if (cleanName.includes('tab') || cleanName.includes('500mg')) return 'Tab';
    if (cleanName.includes('cap')) return 'Cap';

    return 'Tab';
  };

  // Parser: Comma, Tab or Semicolon Separated text
  const parseMedicineData = (text: string): Item[] => {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const parsed: Item[] = [];
    
    // Header check
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('itemid') || firstLine.includes('itemname') || firstLine.includes('id') || firstLine.includes('name') || firstLine.includes('retail') || firstLine.includes('price')) {
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
        const itemid = cols[0]?.trim() || `ITM-${Math.floor(1000 + Math.random() * 9000)}`;
        const name = cols[1]?.trim() || 'Unnamed Medicine';
        const price = parseFloat(cols[2]?.trim() || '0') || 10;
        const purchasePrice = parseFloat(cols[3]?.trim() || '0') || (price > 0 ? price * 0.8 : 8);
        const cStock = parseInt(cols[4]?.trim() || '0', 10) || 0;
        const minStock = parseInt(cols[5]?.trim() || '0', 10) || 10;
        const rawUnit = cols[6]?.trim() || '';
        const unit = normalizeCategory(rawUnit, name);
        const rawType = cols[7]?.trim().toUpperCase() || 'P';
        const medType: 'C' | 'P' = (rawType.startsWith('C') || rawType === 'CLINICAL') ? 'C' : 'P';
        const reqQtyVal = cols[8]?.trim();
        const reorderQty = reqQtyVal ? parseInt(reqQtyVal, 10) : Math.max(minStock * 2 - cStock, 10);
        
        parsed.push({
          ItemID: itemid,
          ItemName: name,
          Price: price,
          PurchasePrice: purchasePrice,
          CStock: cStock,
          MinStock: minStock,
          Unit: unit,
          MedicineType: medType,
          ReorderQty: reorderQty
        });
      }
    }
    return parsed;
  };

  const handleMedicineFileRead = (file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setErrorMsg('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) spreadsheet.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        import('xlsx').then((XLSX) => {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rawData.length === 0) {
            setErrorMsg('The Excel sheet appears to be empty.');
            return;
          }

          const headers = rawData[0].map(h => String(h || '').toLowerCase().trim());
          const idIdx = headers.findIndex(h => h.includes('itemid') || h === 'id' || h.includes('code'));
          const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('medicine') || h.includes('item') || h.includes('description'));
          const priceIdx = headers.findIndex(h => h.includes('retail') || h.includes('price') || h.includes('mrp') || h.includes('sale'));
          const costIdx = headers.findIndex(h => h.includes('purchase') || h.includes('cost') || h.includes('buy'));
          const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty') || h.includes('quantity') || h.includes('cstock'));
          const minStockIdx = headers.findIndex(h => h.includes('min') || h.includes('reorder level'));
          const unitIdx = headers.findIndex(h => h.includes('unit') || h.includes('category') || h.includes('type') || h.includes('form') || h.includes('potency'));
          const medTypeIdx = headers.findIndex(h => h.includes('medicinetype') || h.includes('type') || h.includes('class'));
          const reqQtyIdx = headers.findIndex(h => h.includes('reorderqty') || h.includes('po req') || h.includes('required'));

          const startRow = (nameIdx >= 0 || idIdx >= 0 || priceIdx >= 0) ? 1 : 0;
          
          const iIdx = idIdx >= 0 ? idIdx : 0;
          const nIdx = nameIdx >= 0 ? nameIdx : 1;
          const pIdx = priceIdx >= 0 ? priceIdx : 2;
          const cIdx = costIdx >= 0 ? costIdx : 3;
          const sIdx = stockIdx >= 0 ? stockIdx : 4;
          const mIdx = minStockIdx >= 0 ? minStockIdx : 5;
          const uIdx = unitIdx >= 0 ? unitIdx : 6;
          const tIdx = medTypeIdx >= 0 ? medTypeIdx : 7;
          const rIdx = reqQtyIdx >= 0 ? reqQtyIdx : 8;

          const parsed: Item[] = [];
          for (let i = startRow; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            
            const rawId = String(row[iIdx] || '').trim();
            const itemid = rawId || `ITM-${Math.floor(1000 + Math.random() * 9000)}`;
            const name = String(row[nIdx] || '').trim();
            if (!name) continue;
            
            const price = parseFloat(String(row[pIdx] || '0')) || 10;
            const purchasePrice = parseFloat(String(row[cIdx] || '0')) || (price > 0 ? price * 0.8 : 8);
            const cStock = parseInt(String(row[sIdx] || '0'), 10) || 0;
            const minStock = parseInt(String(row[mIdx] || '10'), 10) || 10;
            const rawUnit = String(row[uIdx] || '').trim();
            const unit = normalizeCategory(rawUnit, name);
            const rawType = String(row[tIdx] || '').trim().toUpperCase();
            const medType: 'C' | 'P' = (rawType.startsWith('C') || rawType === 'CLINICAL') ? 'C' : 'P';
            const reqVal = String(row[rIdx] || '').trim();
            const reorderQty = reqVal ? parseInt(reqVal, 10) : Math.max(minStock * 2 - cStock, 10);

            parsed.push({
              ItemID: itemid,
              ItemName: name,
              Price: price,
              PurchasePrice: purchasePrice,
              CStock: cStock,
              MinStock: minStock,
              Unit: unit,
              MedicineType: medType,
              ReorderQty: reorderQty
            });
          }

          if (parsed.length === 0) {
            setErrorMsg('Could not extract any valid medicine rows. Ensure Excel sheet has medicine names and prices.');
          } else {
            setMedicinePreview(parsed);
            setSuccessMsg(`Successfully parsed ${parsed.length} medicines from ${file.name}! Review category-wise below and click Save.`);
          }
        });
      } catch (err: any) {
        setErrorMsg(`Excel Parse Error: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
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
        setErrorMsg('Could not find any valid row. Copy-paste columns: ItemID, ItemName, RetailPrice, PurchasePrice, Stock, MinStock, Unit/Category (BM Drops, Q D DROPS, Potency 30, Potency 200, Syrup, Drops, Tab, Cap), MedicineType (C=Clinical, P=Patent), PO Req Qty.');
        return;
      }
      setMedicinePreview(res);
      setSuccessMsg(`Successfully parsed ${res.length} medicines. Review category-wise below and save to MongoDB database.`);
    } catch (e: any) {
      setErrorMsg(`Error parsing data: ${e.message}`);
    }
  };

  const handleMedicineSave = (append: boolean) => {
    if (medicinePreview.length === 0) return;
    
    let updatedList: Item[] = [];
    setItems((prev) => {
      let updated = [...prev];
      if (!append) {
        medicinePreview.forEach(newItem => {
          const idx = updated.findIndex(u => 
            u.ItemID.toLowerCase() === newItem.ItemID.toLowerCase() ||
            u.ItemName.toLowerCase() === newItem.ItemName.toLowerCase()
          );
          if (idx > -1) {
            updated[idx] = newItem;
          } else {
            updated.push(newItem);
          }
        });
      } else {
        medicinePreview.forEach(newItem => {
          const idx = updated.findIndex(u => 
            u.ItemID.toLowerCase() === newItem.ItemID.toLowerCase() ||
            u.ItemName.toLowerCase() === newItem.ItemName.toLowerCase()
          );
          if (idx > -1) {
            updated[idx] = {
              ...newItem,
              CStock: updated[idx].CStock + newItem.CStock
            };
          } else {
            updated.push(newItem);
          }
        });
      }
      
      localStorage.setItem('cms_items', JSON.stringify(updated));
      updatedList = updated;
      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/items/bulk?wipe=${!append}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicinePreview)
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Successfully synchronized items catalog with MongoDB:', data);
        setSuccessMsg(`Master Medicines DB updated & synchronized in MongoDB! Stored ${medicinePreview.length} items category-wise.`);
      })
      .catch(err => {
        console.error('Failed to sync updated items catalog to MongoDB:', err.message);
        setErrorMsg(`Items saved locally but MongoDB synchronization failed: ${err.message}`);
      });
    } else {
      setSuccessMsg(`Master Medicines DB updated with ${medicinePreview.length} items!`);
    }

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
    
    let updatedList: LabTest[] = [];
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
      updatedList = updated;
      return updated;
    });

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/lab-tests/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        return res.json();
      })
      .then(() => {
        console.log('Successfully synchronized updated lab tests catalog with MongoDB.');
      })
      .catch(err => {
        console.error('Failed to sync updated lab tests to MongoDB:', err.message);
        setErrorMsg(`Lab tests saved locally but MongoDB synchronization failed: ${err.message}`);
      });
    }

    setSuccessMsg(`Master Diagnostics DB updated successfully with ${labTestPreview.length} test codes!`);
    setLabTestPreview([]);
    setLabTestPasteText('');
  };

  const parseNhcPatientHistoryData = (text: string): NhcPatientHistory[] => {
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const parsed: NhcPatientHistory[] = [];
    
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('patientid') || firstLine.includes('patientname') || firstLine.includes('id') || firstLine.includes('name')) {
      startIndex = 1; // skip header line
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      let cols = line.split('\t');
      if (cols.length < 2) cols = line.split(',');
      if (cols.length < 2) cols = line.split(';');
      
      if (cols.length >= 2) {
        const pId = cols[0]?.trim() || `NHC-${Math.floor(1000 + Math.random() * 9000)}`;
        const name = cols[1]?.trim() || 'Unnamed Patient';
        const guardian = cols[2]?.trim() || '';
        const ageVal = cols[3]?.trim();
        const age = ageVal ? parseInt(ageVal, 10) : undefined;
        const sex = cols[4]?.trim() || 'Male';
        const phone = cols[5]?.trim() || '';
        const visitDate = cols[6]?.trim() || new Date().toISOString().split('T')[0];
        const symptoms = cols[7]?.trim() || '';
        const condition = cols[8]?.trim() || '';
        const labs = cols[9]?.trim() || '';
        const medDetail = cols[10]?.trim() || '';
        const dosage = cols[11]?.trim() || '';
        const medType = cols[12]?.trim() || '';
        
        parsed.push({
          PatientID: pId,
          PatientName: name,
          Father_husband: guardian,
          AgeYears: age !== undefined && !isNaN(age) ? age : undefined,
          Sex: sex,
          PhoneMobile: phone,
          VisitDate: visitDate,
          Symptoms: symptoms,
          Diagnosis: symptoms,
          MedicalCondition: condition,
          PrescribedMedicines: medDetail ? `${medDetail} [${dosage || '1 Daily'}] (${medType || 'P'})` : '',
          LabTests: labs,
          RegistrationDate: visitDate,
          MedicineDetail: medDetail,
          Dosage: dosage,
          MedicineType: medType
        });
      }
    }
    return parsed;
  };

  const handleNhcProcess = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = parseNhcPatientHistoryData(nhcPasteText);
      if (res.length === 0) {
        setErrorMsg('Could not find any valid row. Copy-paste columns: PatientID, PatientName, Father/Husband, AgeYears, Sex, PhoneMobile, VisitDate, Symptoms, MedicalCondition, LabTests.');
        return;
      }
      setNhcPreview(res);
      setSuccessMsg(`Successfully parsed ${res.length} patient history records. Please review the table preview below.`);
    } catch (e: any) {
      setErrorMsg(`Error parsing data: ${e.message}`);
    }
  };

  const handleNhcSave = () => {
    if (nhcPreview.length === 0) return;
    
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/nhc-patient-history/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nhcPreview)
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      return res.json();
    })
    .then((data) => {
      setSuccessMsg(`Database updated successfully with ${nhcPreview.length} patient history records!`);
      
      // Merge newly uploaded records into the global react state
      if (setNhcPatients) {
        setNhcPatients(prev => {
          const merged = [...prev];
          nhcPreview.forEach(newRec => {
            const index = merged.findIndex(r => 
              r.PatientID === newRec.PatientID && 
              (r.VisitDate || r.RegistrationDate || 'N/A') === (newRec.VisitDate || newRec.RegistrationDate || 'N/A') && 
              (r.MedicineDetail || '') === (newRec.MedicineDetail || '')
            );
            if (index > -1) {
              merged[index] = { ...merged[index], ...newRec };
            } else {
              merged.push(newRec);
            }
          });
          return merged;
        });
      }

      setNhcPreview([]);
      setNhcPasteText('');
    })
    .catch(err => {
      console.error('Failed to sync patient history to MongoDB:', err.message);
      setErrorMsg(`Failed to save records: ${err.message}`);
    });
  };

  const loadSampleNhcData = () => {
    const sample = `PatientID\tPatientName\tGuardian\tAgeYears\tSex\tPhone\tVisitDate\tSymptoms\tCondition\tLabAdvice\tMedicineDetail\tDosage\tMedicineType
NHC-1001\tMuhammad Ali\tAhmad\t45\tMale\t03001234567\t2026-07-10\tFever & Cough\tPneumonia\tCBC, Chest X-Ray\tPanadol 500mg\t1+1+1\tP
NHC-1002\tFatima Bibi\tSajid\t32\tFemale\t03129876543\t2026-07-11\tJoint Pain\tArthritis\tRA Factor\tLofnac 50mg\t1+0+1\tC
NHC-1003\tZainab Khan\tIrfan\t12\tFemale\t03451122334\t2026-07-12\tSore Throat\tTonsillitis\tThroat Swab\tAugmentin 625mg\t1+0+1\tP`;
    setNhcPasteText(sample);
  };

  const handleDragNhc = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveNhc(true);
    } else if (e.type === "dragleave") {
      setDragActiveNhc(false);
    }
  };

  const handleDropNhc = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveNhc(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleNhcFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChangeNhc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNhcFileUpload(e.target.files[0]);
    }
  };

  const handleNhcFileUpload = (file: File) => {
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setErrorMsg('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) spreadsheet.');
      return;
    }

    setIsUploadingNhc(true);
    setErrorMsg('');
    setSuccessMsg('');
    setUploadProgressTextNhc('Establishing data stream connection and transferring file...');

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;

    fetch(`${bridgeUrl}/api/nhc-patient-history/upload-file?wipe=${uploadModeNhc === 'wipe'}`, {
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
          const count = Number(data?.totalCount ?? data?.count ?? 0);
          setSuccessMsg(
            `Data processed successfully! Imported ${count.toLocaleString()} clinical history rows into the database using [${data.mode === 'wipe-insert' ? 'Wipe & Re-index' : 'Smart Merge'}] mode.`
          );
          if (setNhcPatients && Array.isArray(data.preview || data.data)) {
            setNhcPatients(data.preview || data.data);
          }
        } else {
          throw new Error(data.error || 'Unknown parsing failure.');
        }
      })
      .catch(err => {
        console.error('File upload failed:', err);
        setErrorMsg(`Failed to upload or parse patient history file: ${err.message}`);
      })
      .finally(() => {
        setIsUploadingNhc(false);
        setUploadProgressTextNhc('');
        if (fileInputNhcRef.current) fileInputNhcRef.current.value = '';
      });
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

    if (mongoDbSettings.SyncEnabled) {
      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/items/${matchedItem.ItemID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...matchedItem, CStock: updatedStock })
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        console.log('Successfully synchronized barcode stock level change with MongoDB.');
      })
      .catch(err => {
        console.error('Failed to sync barcode stock update to MongoDB:', err.message);
      });
    }

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
      <div className="flex justify-end items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
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
              setActiveUploadTab('nhcpatienthistory');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeUploadTab === 'nhcpatienthistory' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk Excel/CSV Importer
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
          <button
            onClick={() => {
              setActiveUploadTab('smartlocator');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeUploadTab === 'smartlocator' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />
            <span>Smart Locator Upload</span>
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
          
          {/* Paste & Excel Upload Card */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Paste or Upload Excel Medicines</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Import Homeopathic & Allopathic medicine lists category-wise directly into MongoDB.</p>
              </div>
            </div>

            {/* Excel File Dropzone / File Picker */}
            <div
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveMed(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveMed(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveMed(false); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation(); setDragActiveMed(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleMedicineFileRead(e.dataTransfer.files[0]);
                }
              }}
              className={`p-3.5 border-2 border-dashed rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                dragActiveMed ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
              onClick={() => fileInputMedRef.current?.click()}
            >
              <input
                ref={fileInputMedRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleMedicineFileRead(e.target.files[0]);
                  }
                }}
              />
              <FileSpreadsheet className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs font-bold text-slate-700">Drop Excel (.xlsx, .csv) File Here</span>
              <p className="text-[10px] text-slate-400">or click to browse from device</p>
            </div>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink-0 mx-2 text-[10px] text-slate-400 uppercase font-bold">or copy-paste text below</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Template Sample */}
            <div className="bg-slate-50 p-3 rounded border border-slate-150 font-mono text-[9px] text-slate-600 space-y-1">
              <span className="font-extrabold text-indigo-600 block">EXPECTED COLUMN STRUCTURE:</span>
              <p className="border-b border-slate-200 pb-1 text-indigo-700 font-bold">ItemID [TAB] ItemName [TAB] RetailPrice [TAB] PurchasePrice [TAB] Stock [TAB] MinStock [TAB] Category/Unit [TAB] Type [TAB] PO Req Qty</p>
              <p className="text-slate-500 font-semibold">ITM-001   BM 1 Drops          150.00   110.00   45   10   BM Drops     P   30</p>
              <p className="text-slate-500 font-semibold">ITM-002   Acid Phos 30        120.00   85.00    20   10   Potency 30   P   25</p>
              <p className="text-slate-500 font-semibold">ITM-003   Avena Sat Q         180.00   130.00   15   10   Q D DROPS    P   20</p>
              <p className="text-slate-500 font-semibold">ITM-004   Arn M 200           140.00   100.00   30   10   Potency 200  P   15</p>
              <p className="text-slate-500 font-semibold">ITM-005   Acefyl Cough Syp    110.00   80.00    50   10   Syrup        P   40</p>
            </div>

            <textarea
              value={medicinePasteText}
              onChange={(e) => setMedicinePasteText(e.target.value)}
              placeholder="Paste raw Excel data here..."
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />

            <button
              onClick={handleMedicineProcess}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Validate & Parse Paste Data</span>
            </button>
          </div>

          {/* Preview grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bulk Import Preview ({medicinePreview.length} Items)</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Review category-wise items before saving to MongoDB database.</p>
              </div>
              
              {medicinePreview.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleMedicineSave(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Merge Stock & Save
                  </button>
                  <button
                    onClick={() => handleMedicineSave(false)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-bold rounded flex items-center shadow-xs transition"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save & Update Database
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Pills in Preview */}
            {medicinePreview.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-slate-100 shrink-0">
                {['ALL', 'BM Drops', 'Q D DROPS', 'Potency 30', 'Potency 200', 'Syrup', 'Drops', 'Tab', 'Cap'].map((cat) => {
                  const count = cat === 'ALL' 
                    ? medicinePreview.length 
                    : medicinePreview.filter(i => (i.Unit || '').toLowerCase() === cat.toLowerCase()).length;
                  if (cat !== 'ALL' && count === 0) return null;

                  return (
                    <button
                      key={cat}
                      onClick={() => setMedPreviewCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition ${
                        medPreviewCategoryFilter === cat 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`px-1 py-0.2 rounded-full text-[9px] ${
                        medPreviewCategoryFilter === cat ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Preview table */}
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              {medicinePreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
                  <Database className="w-10 h-10 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold">No Records Parsed</span>
                  <p className="text-[10px] max-w-xs text-slate-400">Upload an Excel spreadsheet or copy-paste text in the left panel to populate the category preview grid.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-xxs">
                  <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                    <tr>
                      <th className="px-2.5 py-2">Item Code</th>
                      <th className="px-2.5 py-2">Item Description</th>
                      <th className="px-2.5 py-2">Category</th>
                      <th className="px-2.5 py-2 text-right">Retail</th>
                      <th className="px-2.5 py-2 text-right">Cost</th>
                      <th className="px-2.5 py-2 text-right">Stock</th>
                      <th className="px-2.5 py-2 text-right">PO Req Qty</th>
                      <th className="px-2.5 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {medicinePreview
                      .filter(itm => medPreviewCategoryFilter === 'ALL' || (itm.Unit || '').toLowerCase() === medPreviewCategoryFilter.toLowerCase())
                      .map((itm, index) => {
                        const unitLabel = itm.Unit || 'Tab';
                        let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                        if (unitLabel.includes('BM')) badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
                        else if (unitLabel.includes('Q D')) badgeBg = 'bg-purple-50 text-purple-800 border-purple-200';
                        else if (unitLabel.includes('30')) badgeBg = 'bg-blue-50 text-blue-800 border-blue-200';
                        else if (unitLabel.includes('200')) badgeBg = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                        else if (unitLabel.includes('Syrup')) badgeBg = 'bg-pink-50 text-pink-800 border-pink-200';
                        else if (unitLabel.includes('Drops')) badgeBg = 'bg-teal-50 text-teal-800 border-teal-200';

                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-2.5 py-1.5 font-mono font-bold text-slate-700">{itm.ItemID}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-slate-900">{itm.ItemName}</td>
                            <td className="px-2.5 py-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${badgeBg}`}>
                                {unitLabel}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-slate-600">Rs. {itm.Price.toFixed(2)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-slate-600">Rs. {itm.PurchasePrice.toFixed(2)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-slate-900 font-bold">{itm.CStock}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-indigo-700 font-bold">{itm.ReorderQty ?? Math.max(itm.MinStock * 2 - itm.CStock, 10)}</td>
                            <td className="px-2.5 py-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                itm.MedicineType === 'C'
                                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              }`}>
                                {itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                              </span>
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
                        <td className="px-3 py-2 text-right font-mono text-slate-600">Rs. {(tst.Cost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Uploading PHC Patient History Section */}
      {activeUploadTab === 'nhcpatienthistory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bulk Excel/CSV Importer file dropzone */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bulk Excel/CSV Importer</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Copy-paste columns directly from your Excel sheet or .csv file.</p>
              </div>
            </div>

            {/* Import Strategy */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Import Strategy</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModeNhc('wipe')}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    uploadModeNhc === 'wipe'
                      ? 'border-indigo-600 bg-indigo-50/45 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <span className="text-xxs font-black">Wipe & Re-index</span>
                  <span className="text-[8px] text-slate-400 font-medium">Drop old table & insert</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModeNhc('merge')}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    uploadModeNhc === 'merge'
                      ? 'border-indigo-600 bg-indigo-50/45 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <span className="text-xxs font-black">Smart Merge</span>
                  <span className="text-[8px] text-slate-400 font-medium">Incremental upsert by ID</span>
                </button>
              </div>
            </div>

            {/* Dropzone Container */}
            <div className="flex-1 flex flex-col">
              <div
                onDragEnter={handleDragNhc}
                onDragOver={handleDragNhc}
                onDragLeave={handleDragNhc}
                onDrop={handleDropNhc}
                onClick={() => fileInputNhcRef.current?.click()}
                className={`flex-1 min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-150 ${
                  dragActiveNhc
                    ? 'border-indigo-600 bg-indigo-50/15'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputNhcRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileInputChangeNhc}
                  className="hidden"
                />

                {isUploadingNhc ? (
                  <div className="space-y-3 flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-400 opacity-75"></div>
                      <Database className="w-8 h-8 text-indigo-600 animate-bounce relative z-10" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800 animate-pulse block">Database Processing Active</span>
                      <p className="text-[10px] text-slate-500 max-w-xs">{uploadProgressTextNhc}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-700 block">Drag & drop your patient history file here</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Supports Excel (.xlsx, .xls) and CSV (.csv) formats</span>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-extrabold text-xxs rounded-lg shadow-2xs transition cursor-pointer"
                    >
                      Select File From Device
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">PHC History Stage Preview</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Please review the mapped clinical structures before committing to database.</p>
              </div>
              {nhcPreview.length > 0 && (
                <button
                  onClick={handleNhcSave}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition shadow-xs hover:shadow-indigo-100 cursor-pointer animate-bounce"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Save Records ({nhcPreview.length})</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto border border-slate-150 rounded-lg bg-slate-50/40">
              {nhcPreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 space-y-1.5">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                  <span className="text-xxs font-bold uppercase tracking-wider text-slate-500">No Records Staged</span>
                  <p className="text-[9px] max-w-xs text-slate-400">Upload your Excel sheet or .csv file above to automatically parse and load clinical history preview records.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xxs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Guardian</th>
                      <th className="p-3">Age/Sex</th>
                      <th className="p-3">Visit Date</th>
                      <th className="p-3">Symptoms & Cond.</th>
                      <th className="p-3">Meds & Dosage</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {nhcPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-indigo-600 font-bold whitespace-nowrap">{item.PatientID}</td>
                        <td className="p-3 font-bold text-slate-700">{item.PatientName}</td>
                        <td className="p-3 text-slate-500">{item.Father_husband || '—'}</td>
                        <td className="p-3 text-slate-600">
                          {item.AgeYears ? `${item.AgeYears}y` : '—'} / <span className="capitalize">{item.Sex || '—'}</span>
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{item.VisitDate || '—'}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[120px]" title={item.Symptoms}>
                          {item.Symptoms || '—'} {item.MedicalCondition ? `(${item.MedicalCondition})` : ''}
                        </td>
                        <td className="p-3 text-slate-600 truncate max-w-[130px]">
                          {item.MedicineDetail ? (
                            <div>
                              <span className="font-bold text-slate-800 block">{item.MedicineDetail}</span>
                              {item.Dosage && <span className="text-slate-400 font-mono text-[9px] block">Dosage: {item.Dosage}</span>}
                              {item.MedicineType && (
                                <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase mt-0.5 inline-block ${
                                  item.MedicineType === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {item.MedicineType === 'C' ? 'Clinical (C)' : item.MedicineType === 'P' ? 'Patent (P)' : item.MedicineType}
                                </span>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setNhcPreview(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Remove from staging"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
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
                  {items.slice(0, 5).map((itm, idx) => (
                    <button
                      type="button"
                      key={`${itm.ItemID}-${idx}`}
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

      {activeUploadTab === 'smartlocator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          
          {/* Paste card & File uploader (Left: 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 1: Paste Excel List */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Paste Excel Smart Locator List</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Copy columns from Excel sheet (or .csv) and paste them directly into this area.</p>
              </div>

              {/* Template Sample */}
              <div className="bg-slate-50 p-3 rounded border border-slate-150 font-mono text-[9px] text-slate-600 space-y-1">
                <span className="font-extrabold text-indigo-600 block">EXPECTED COLUMN STRUCTURE:</span>
                <p className="border-b border-slate-200 pb-1">Symptoms [TAB] MedicineName [TAB] Dosage [TAB] Composition</p>
                <p className="text-slate-400">fever, body pain, headache	Panadol 500mg Tab	1-1-1	Paracetamol 500mg</p>
                <p className="text-slate-400">cough, throat congestion	Amoxil 500mg Cap	1-0-1	Amoxicillin 500mg</p>
                <p className="text-slate-400">stomach acidity, heartburn	Risek 20mg Cap	1-0-0	Omeprazole 20mg</p>
              </div>

              <textarea
                value={smartLocatorPasteText}
                onChange={(e) => setSmartLocatorPasteText(e.target.value)}
                placeholder="Paste raw data here from your excel spreadsheet..."
                rows={10}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />

              <button
                onClick={handleSmartLocatorProcess}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Validate & Preview Rows</span>
              </button>
            </div>

            {/* Card 2: Drag & Drop File Stream */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block">Excel File Stream Uploader</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Drag and drop or select an Excel/CSV file with columns: Symptoms, MedicineName, Dosage, Composition.</p>
              </div>

              <div
                onDragEnter={handleDragSmart}
                onDragOver={handleDragSmart}
                onDragLeave={handleDragSmart}
                onDrop={handleDropSmart}
                onClick={() => fileInputSmartRef.current?.click()}
                className={`min-h-[140px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-150 ${
                  dragActiveSmart
                    ? 'border-indigo-600 bg-indigo-50/15'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputSmartRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileInputChangeSmart}
                  className="hidden"
                />
                <div className="p-2.5 bg-indigo-50 rounded-full mb-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600 animate-bounce" />
                </div>
                <span className="text-xs font-bold text-slate-700">Drag & Drop Excel File here</span>
                <span className="text-[10px] text-slate-400 block mt-1">Supports Excel (.xlsx, .xls) and CSV (.csv) formats</span>
              </div>
            </div>

          </div>

          {/* Dynamic Preview or Database View (Right: 7 columns) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            
            {smartLocatorPreview.length > 0 ? (
              // Bulk Import Preview Mode
              <>
                <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center shrink-0">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bulk Import Preview ({smartLocatorPreview.length} rows)</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Review smart locator mapping before saving to local database.</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSmartLocatorSave(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Merge & Add Records
                    </button>
                    <button
                      onClick={() => handleSmartLocatorSave(false)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-bold rounded flex items-center shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Replace Existing DB
                    </button>
                    <button
                      onClick={() => {
                        setSmartLocatorPreview([]);
                        setSuccessMsg('');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded flex items-center cursor-pointer border border-slate-250"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-100 text-xxs">
                    <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                      <tr>
                        <th className="px-3 py-2 w-1/3">Symptoms / Indications</th>
                        <th className="px-3 py-2">Medicine Name</th>
                        <th className="px-3 py-2">Dosage</th>
                        <th className="px-3 py-2">Composition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {smartLocatorPreview.map((itm, index) => (
                        <tr key={index} className="hover:bg-slate-55">
                          <td className="px-3 py-2 font-medium text-slate-900 leading-normal">{itm.Symptoms}</td>
                          <td className="px-3 py-2 font-extrabold text-indigo-700">{itm.MedicineName}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{itm.Dosage || '—'}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono italic">{itm.Composition || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              // Database view mode when no active preview
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2 shrink-0">
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Smart Locator Medicine Database</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Currently loaded smart locator definitions ({smartLocatorMedicines.length} rows).</p>
                  </div>
                  
                  {/* Clear All Button */}
                  {smartLocatorMedicines.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete all smart locator medicines?")) {
                          setSmartLocatorMedicines([]);
                          setSuccessMsg("Successfully cleared all smart locator records.");
                          if (mongoDbSettings.SyncEnabled) {
                            const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
                            fetch(`${bridgeUrl}/api/smart-locator/all`, { method: 'DELETE' })
                            .then(res => {
                              if (!res.ok) throw new Error(`HTTP status ${res.status}`);
                              return res.json();
                            })
                            .then(() => {
                              console.log('Cleared smart locator table in MongoDB.');
                            })
                            .catch(err => {
                              console.error('Failed to clear smart locator table in MongoDB:', err.message);
                            });
                          }
                        }
                      }}
                      className="text-xxs font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-100 flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Search Database */}
                <div className="relative mb-3 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search symptoms, medicines, composition..."
                    value={smartLocatorSearch}
                    onChange={(e) => setSmartLocatorSearch(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Database List */}
                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
                  {(() => {
                    const filtered = smartLocatorMedicines.filter(m => {
                      if (!smartLocatorSearch.trim()) return true;
                      const q = smartLocatorSearch.toLowerCase();
                      return m.Symptoms.toLowerCase().includes(q) ||
                             m.MedicineName.toLowerCase().includes(q) ||
                             m.Composition.toLowerCase().includes(q) ||
                             m.Dosage.toLowerCase().includes(q);
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-1.5">
                          <Sparkles className="w-8 h-8 text-slate-300 animate-pulse" />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Records Loaded</span>
                          <p className="text-[10px] max-w-xs text-slate-400">
                            Validate paste data on the left panel or upload an Excel file to build your symptom index.
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((m, idx) => (
                      <div key={idx} className="p-3 hover:bg-slate-50 flex justify-between items-start text-xxs">
                        <div className="space-y-1 pr-3 leading-relaxed">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/30">
                              {m.MedicineName}
                            </span>
                            {m.Dosage && (
                              <span className="text-slate-500 font-bold font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded">
                                {m.Dosage}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-850">
                            <strong className="text-slate-400 font-bold font-sans">Symptoms: </strong>
                            {m.Symptoms}
                          </div>
                          {m.Composition && (
                            <div className="text-[9px] text-slate-500 font-mono">
                              <strong className="text-slate-400 font-bold font-sans">Comp: </strong>
                              {m.Composition}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSmartLocatorMedicines(prev => prev.filter((_, i) => i !== smartLocatorMedicines.indexOf(m)));
                            setSuccessMsg(`Deleted smart locator entry: ${m.MedicineName}`);
                            if (mongoDbSettings.SyncEnabled) {
                              const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
                              fetch(`${bridgeUrl}/api/smart-locator`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ Symptoms: m.Symptoms, MedicineName: m.MedicineName })
                              })
                              .then(res => {
                                if (!res.ok) throw new Error(`HTTP status ${res.status}`);
                                return res.json();
                              })
                              .then(() => {
                                console.log('Successfully deleted smart locator entry from MongoDB.');
                              })
                              .catch(err => {
                                console.error('Failed to delete smart locator entry from MongoDB:', err.message);
                              });
                            }
                          }}
                          className="text-slate-300 hover:text-rose-600 transition p-1 cursor-pointer shrink-0"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
