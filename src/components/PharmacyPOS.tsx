/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Lock,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  Undo2,
  Truck,
  Check,
  Printer,
  History,
  Database,
  Edit,
  Tag,
  Stethoscope,
  Pill
} from 'lucide-react';
import {
  Patient,
  Item,
  Supplier,
  InvoiceHeader,
  InvoiceDetail,
  SRInvHeader,
  SRInvDetail,
  InvVchHeader,
  InvVchDetail,
  UserRight,
  Visit,
  VisitMedicine,
  Appointment,
  Token
} from '../types';

interface PharmacyPOSProps {
  patients: Patient[];
  items: Item[];
  onUpdateItemStock: (itemId: string, newStock: number) => void;
  setItems?: React.Dispatch<React.SetStateAction<Item[]>>;
  suppliers: Supplier[];
  setSuppliers?: React.Dispatch<React.SetStateAction<Supplier[]>>;
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  onAddInvoice: (inv: InvoiceHeader, details: InvoiceDetail[]) => void;
  onAddSalesReturn: (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => void;
  grns: InvVchHeader[];
  grnDetails: InvVchDetail[];
  onAddGRN: (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => void;
  onUpdateGRN?: (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => void;
  onVoidGRN?: (vchNo: string) => void;
  userRights: UserRight[];
  visits: Visit[];
  visitMedicines: VisitMedicine[];
  appointments?: Appointment[];
  tokens?: Token[];
  clinicSettings?: any;
}

export default function PharmacyPOS({
  patients,
  items,
  onUpdateItemStock,
  setItems,
  suppliers,
  setSuppliers,
  invoices,
  invoiceDetails,
  onAddInvoice,
  onAddSalesReturn,
  grns,
  grnDetails,
  onAddGRN,
  onUpdateGRN,
  onVoidGRN,
  userRights,
  visits,
  visitMedicines,
  appointments = [],
  tokens = [],
  clinicSettings
}: PharmacyPOSProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'store_sales' | 'return' | 'grn' | 'inventory_manager' | 'invoice_logs' | 'clinical_labels'>('checkout');

  // Inventory Manager State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [invSearchQuery, setInvSearchQuery] = useState('');
  
  // New/Edit Item Form State
  const [itemFormId, setItemFormId] = useState('');
  const [itemFormName, setItemFormName] = useState('');
  const [itemFormRetailPrice, setItemFormRetailPrice] = useState<number | ''>('');
  const [itemFormPurchasePrice, setItemFormPurchasePrice] = useState<number | ''>('');
  const [itemFormCStock, setItemFormCStock] = useState<number | ''>('');
  const [itemFormMinStock, setItemFormMinStock] = useState<number | ''>('');
  const [itemFormUnit, setItemFormUnit] = useState('Tab');
  const [itemFormMedicineType, setItemFormMedicineType] = useState<'C' | 'P'>('P');
  const [invSuccessMsg, setInvSuccessMsg] = useState('');
  const [invErrorMsg, setInvErrorMsg] = useState('');

  // Vendor / Supplier Management States
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormId, setSupplierFormId] = useState('');
  const [supplierFormName, setSupplierFormName] = useState('');
  const [supplierFormPhone, setSupplierFormPhone] = useState('');
  const [supplierFormAddress, setSupplierFormAddress] = useState('');
  const [vendorSuccessMsg, setVendorSuccessMsg] = useState('');
  const [vendorErrorMsg, setVendorErrorMsg] = useState('');

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierFormId('');
    setSupplierFormName('');
    setSupplierFormPhone('');
    setSupplierFormAddress('');
    setVendorSuccessMsg('');
    setVendorErrorMsg('');
  };

  const handleSelectEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierFormId(sup.SID);
    setSupplierFormName(sup.SupplierName);
    setSupplierFormPhone(sup.Phone);
    setSupplierFormAddress(sup.Address);
    setVendorSuccessMsg('');
    setVendorErrorMsg('');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setSuppliers) {
      setVendorErrorMsg('System error: setSuppliers state updater not provided.');
      return;
    }
    if (!supplierFormName.trim()) {
      setVendorErrorMsg('Supplier Name is required.');
      return;
    }

    const sid = supplierFormId.trim() || `SUP-${Date.now().toString().slice(-4)}`;
    const newSupplier: Supplier = {
      SID: sid,
      SupplierName: supplierFormName.trim(),
      Phone: supplierFormPhone.trim(),
      Address: supplierFormAddress.trim()
    };

    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupplier)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSuppliers(prev => {
          const index = prev.findIndex(s => s.SID === newSupplier.SID);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newSupplier;
            return updated;
          } else {
            return [...prev, newSupplier];
          }
        });
        setVendorSuccessMsg(editingSupplier ? 'Supplier updated successfully!' : 'Supplier registered successfully!');
        setVendorErrorMsg('');
        if (!editingSupplier) {
          resetSupplierForm();
        } else {
          setEditingSupplier(newSupplier);
        }
      })
      .catch(err => {
        console.warn('Backend supplier sync failed, falling back to local only:', err.message);
        setSuppliers(prev => {
          const index = prev.findIndex(s => s.SID === newSupplier.SID);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newSupplier;
            return updated;
          } else {
            return [...prev, newSupplier];
          }
        });
        setVendorSuccessMsg(editingSupplier ? 'Supplier updated locally.' : 'Supplier registered locally.');
        setVendorErrorMsg('');
        if (!editingSupplier) {
          resetSupplierForm();
        } else {
          setEditingSupplier(newSupplier);
        }
      });
  };

  const handleDeleteSupplier = (sid: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    if (!setSuppliers) return;

    const bridgeUrl = window.location.origin;
    fetch(`${bridgeUrl}/api/suppliers/${sid}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(() => {
        setSuppliers(prev => prev.filter(s => s.SID !== sid));
        setVendorSuccessMsg('Supplier deleted successfully!');
        if (editingSupplier && editingSupplier.SID === sid) {
          resetSupplierForm();
        }
      })
      .catch(err => {
        console.warn('Backend supplier delete failed, falling back to local only:', err.message);
        setSuppliers(prev => prev.filter(s => s.SID !== sid));
        setVendorSuccessMsg('Supplier deleted locally.');
        if (editingSupplier && editingSupplier.SID === sid) {
          resetSupplierForm();
        }
      });
  };

  // Reset Item Form
  const resetItemForm = () => {
    setEditingItem(null);
    setItemFormId('');
    setItemFormName('');
    setItemFormRetailPrice('');
    setItemFormPurchasePrice('');
    setItemFormCStock('');
    setItemFormMinStock('');
    setItemFormUnit('Tab');
    setItemFormMedicineType('P');
    setInvErrorMsg('');
  };

  // Select Item for editing
  const handleSelectEditItem = (itm: Item) => {
    setEditingItem(itm);
    setItemFormId(itm.ItemID);
    setItemFormName(itm.ItemName);
    setItemFormRetailPrice(itm.Price);
    setItemFormPurchasePrice(itm.PurchasePrice);
    setItemFormCStock(itm.CStock);
    setItemFormMinStock(itm.MinStock);
    setItemFormUnit(itm.Unit || 'Tab');
    setItemFormMedicineType(itm.MedicineType || 'P');
    setInvErrorMsg('');
  };

  // Add/Update Item handler
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setItems) {
      setInvErrorMsg('System error: items state updater not provided.');
      return;
    }

    if (!itemFormId.trim()) {
      setInvErrorMsg('Item ID is required.');
      return;
    }
    if (!itemFormName.trim()) {
      setInvErrorMsg('Item Name is required.');
      return;
    }

    const rPrice = itemFormRetailPrice === '' ? 0 : Number(itemFormRetailPrice);
    const pPrice = itemFormPurchasePrice === '' ? 0 : Number(itemFormPurchasePrice);
    const stock = itemFormCStock === '' ? 0 : Number(itemFormCStock);
    const minS = itemFormMinStock === '' ? 0 : Number(itemFormMinStock);

    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(itm => {
        if (itm.ItemID === editingItem.ItemID) {
          return {
            ...itm,
            ItemID: itemFormId.trim(),
            ItemName: itemFormName.trim(),
            Price: rPrice,
            PurchasePrice: pPrice,
            CStock: stock,
            MinStock: minS,
            Unit: itemFormUnit,
            MedicineType: itemFormMedicineType
          };
        }
        return itm;
      }));
      setInvSuccessMsg(`Medicine "${itemFormName.trim()}" updated successfully!`);
      resetItemForm();
    } else {
      // Check if ItemID already exists
      const idExists = items.some(itm => itm.ItemID.toLowerCase() === itemFormId.trim().toLowerCase());
      if (idExists) {
        setInvErrorMsg(`Item ID "${itemFormId.trim()}" already exists in inventory!`);
        return;
      }

      // Add new item
      const newItem: Item = {
        ItemID: itemFormId.trim(),
        ItemName: itemFormName.trim(),
        Price: rPrice,
        PurchasePrice: pPrice,
        CStock: stock,
        MinStock: minS,
        Unit: itemFormUnit,
        MedicineType: itemFormMedicineType
      };

      setItems(prev => [...prev, newItem]);
      setInvSuccessMsg(`New medicine "${itemFormName.trim()}" added successfully!`);
      resetItemForm();
    }

    setTimeout(() => setInvSuccessMsg(''), 5000);
  };

  // Remove Item handler
  const handleRemoveItem = (itemId: string, itemName: string) => {
    if (!setItems) return;
    if (window.confirm(`Are you sure you want to delete "${itemName}" from the inventory list?`)) {
      setItems(prev => prev.filter(itm => itm.ItemID !== itemId));
      setInvSuccessMsg(`Medicine "${itemName}" removed from inventory successfully.`);
      setTimeout(() => setInvSuccessMsg(''), 5000);
      if (editingItem?.ItemID === itemId) {
        resetItemForm();
      }
    }
  };

  // Print states for pharmacy cash invoice bill
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printBillData, setPrintBillData] = useState<{
    patient: Patient | null;
    basket: { ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[];
    discount: number;
    netAmount: number;
    shift: 1 | 2;
    invoiceNo: string;
    invoiceDate: string;
  } | null>(null);

  // Low Stock Report States
  const [isLowStockReportModalOpen, setIsLowStockReportModalOpen] = useState(false);
  const [selectedReportCategory, setSelectedReportCategory] = useState<'ALL' | 'C' | 'P'>('ALL');

  // Clinical Medicine Label Print States
  const [labelPatientId, setLabelPatientId] = useState('');
  const [labelVisitId, setLabelVisitId] = useState('');
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [customLabelStates, setCustomLabelStates] = useState<{[medId: string]: { instructions: string; notes: string; qty: string; expiry: string }}>({});
  const [isLabelPrintModalOpen, setIsLabelPrintModalOpen] = useState(false);
  const [labelPrintData, setLabelPrintData] = useState<{
    patientName: string;
    patientAge: string;
    patientSex: string;
    visitDate: string;
    visitId: string;
    medicines: {
      name: string;
      instructions: string;
      notes: string;
      qty: string;
      expiry: string;
    }[];
  } | null>(null);

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'pharmacy');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Active Billing Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billingShift, setBillingShift] = useState<1 | 2>(1);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [showPatentSourcingModal, setShowPatentSourcingModal] = useState(false);
  const [patientSourcingOption, setPatientSourcingOption] = useState<'Clinic' | 'Outside'>('Clinic');
  
  // Store Medicine State
  const [storePatientId, setStorePatientId] = useState('');
  const [storeShift, setStoreShift] = useState<1 | 2>(1);
  const [storeDiscountInput, setStoreDiscountInput] = useState<number>(0);
  const [storeBasket, setStoreBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  const [storeRowItemId, setStoreRowItemId] = useState('');
  const [storeRowQty, setStoreRowQty] = useState<number>(1);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeSearchDropdownOpen, setStoreSearchDropdownOpen] = useState(false);
  const [storeValidationError, setStoreValidationError] = useState('');
  const [storeSuccessMsg, setStoreSuccessMsg] = useState('');
  
  // Basket list of checkout items
  const [checkoutBasket, setCheckoutBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  // Row scratchpad inputs
  const [rowItemId, setRowItemId] = useState('');
  const [rowQty, setRowQty] = useState<number>(1);
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posSearchDropdownOpen, setPosSearchDropdownOpen] = useState(false);
  const [stockValidationError, setStockValidationError] = useState('');

  // Compounding Formula Wizard State (for Clinical medicine type 'C')
  const [compoundingDose, setCompoundingDose] = useState<number>(1);
  const [compoundingDays, setCompoundingDays] = useState<number>(30);
  const [compoundingInstructions, setCompoundingInstructions] = useState<string>('Daily 1 after meal');

  // History list state for today's medicines
  const [showAllInvoicesInHistory, setShowAllInvoicesInHistory] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Helper to fetch the Token No of a patient
  const getPatientTokenNo = (patientId: string) => {
    // 1. Look for the token associated with this patient's latest visit
    const latestV = visits.slice().reverse().find((v) => v.PatientID === patientId);
    if (latestV?.TokenNo) {
      return latestV.TokenNo;
    }
    
    // 2. Look for the visited token in tokens list
    const token = tokens.slice().reverse().find((t) => t.PatientID === patientId && t.Status === 2);
    if (token) {
      return token.TokenNo;
    }

    // 3. Look for any active token
    const anyToken = tokens.slice().reverse().find((t) => t.PatientID === patientId);
    if (anyToken) {
      return anyToken.TokenNo;
    }

    return null;
  };

  // Filter patients: show only patients checked by Doctor
  const checkedPatients = patients.filter((p) => {
    const hasVisit = visits.some((v) => v.PatientID === p.PatientID);
    const hasVisitedAppt = appointments.some((a) => a.PatientID === p.PatientID && a.Status === 2);
    const hasVisitedToken = tokens.some((t) => t.PatientID === p.PatientID && t.Status === 2);
    // Exclude if pharmacy bill is posted (Status === 2)
    const hasPostedBill = invoices.some((inv) => inv.PatientID === p.PatientID && inv.Status === 2);
    return (hasVisit || hasVisitedAppt || hasVisitedToken) && !hasPostedBill;
  });

  // Helper to extract prescribed medicines from visitMedicines or fallback to visit.VisitRemarks text
  const getVisitMedicinesList = (v: Visit | null): VisitMedicine[] => {
    if (!v) return [];
    
    // 1. Direct match in visitMedicines state
    const directMeds = visitMedicines.filter((vm) => vm.VisitID === v.VisitID);
    if (directMeds.length > 0) {
      return directMeds;
    }

    // 2. Fallback: Parse VisitRemarks if available
    const parsedMeds: VisitMedicine[] = [];
    if (v.VisitRemarks) {
      const rem = v.VisitRemarks;
      
      // Parse Clinical
      if (rem.includes('Clinical:')) {
        const cMatch = rem.match(/Clinical:\s*([^|]+)/);
        if (cMatch && cMatch[1].trim() && cMatch[1].trim() !== 'None' && cMatch[1].trim() !== 'undefined') {
          let cText = cMatch[1].trim();
          let expDate = '';
          const expMatch = cText.match(/\(EXP:\s*([^)]+)\)/);
          if (expMatch) {
            expDate = expMatch[1].trim();
            cText = cText.replace(/\(EXP:\s*([^)]+)\)/, '').trim();
          }
          parsedMeds.push({
            VisitID: v.VisitID,
            ItemID: 'CLIN-COMPOUND',
            MedicineType: 'C',
            MedicineDetail: 'Clinical Compounding Medicine',
            Dosage: cText,
            Qty: 1,
            ExpireDate: expDate
          });
        }
      }

      // Parse Patent
      if (rem.includes('Patent:')) {
        const pMatch = rem.match(/Patent:\s*([^|]+)/);
        if (pMatch && pMatch[1].trim() && pMatch[1].trim() !== 'None' && pMatch[1].trim() !== 'undefined') {
          const pText = pMatch[1].trim();
          const lines = pText.split('\n').map(l => l.trim()).filter(Boolean);
          lines.forEach((line, idx) => {
            parsedMeds.push({
              VisitID: v.VisitID,
              ItemID: `PAT-${idx + 1}`,
              MedicineType: 'P',
              MedicineDetail: line,
              Dosage: line,
              Qty: 1
            });
          });
        }
      }
    }

    return parsedMeds;
  };

  const handleCleanLabelPrint = (presetSize: '4x8' | '8x5' | '4x3' = '4x8') => {
    const elem = document.getElementById('sticker-print-container');
    if (!elem) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=650,height=900');
    if (!printWin) {
      window.print();
      return;
    }

    let pageSizeCss = 'size: 4in 8in; margin: 0;';
    let stickerWidth = '4in';
    let stickerHeight = '8in';

    if (presetSize === '8x5') {
      pageSizeCss = 'size: 8in 5in; margin: 0;';
      stickerWidth = '8in';
      stickerHeight = '5in';
    } else if (presetSize === '4x3') {
      pageSizeCss = 'size: 4in 3in; margin: 0;';
      stickerWidth = '4in';
      stickerHeight = '3in';
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Clinical Label Sticker Print (${presetSize === '4x8' ? '4" x 8" Roll' : presetSize}) - Homoeopathic Clinic</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              ${pageSizeCss}
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: #0f172a;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .label-sticker-page {
              box-shadow: none !important;
              border: none !important;
              page-break-after: always;
              width: ${stickerWidth} !important;
              height: ${stickerHeight} !important;
              max-width: ${stickerWidth} !important;
              min-height: ${stickerHeight} !important;
              margin: 0 auto;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div style="padding: 12px; width: ${stickerWidth}; margin: 0 auto;">
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

  // Load the prescribed medicines for the selected patient
  const selectedPatientVisits = visits
    .filter((v) => v.PatientID === selectedPatientId)
    .sort((a, b) => {
      if (a.VisitDate !== b.VisitDate) {
        return a.VisitDate.localeCompare(b.VisitDate);
      }
      return a.VisitID.localeCompare(b.VisitID);
    });
  const latestVisit = selectedPatientVisits.length > 0 ? selectedPatientVisits[selectedPatientVisits.length - 1] : null;
  const prescribedMedicinesList = getVisitMedicinesList(latestVisit);

  // Add individual prescribed item to the basket
  const handleAddPrescribedToBasket = (prescription: VisitMedicine) => {
    const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
    if (!selectedItem) {
      const isCustom = prescription.ItemID === 'CUSTOM' || prescription.ItemID.startsWith('CLIN') || prescription.ItemID.startsWith('PAT') || prescription.MedicineType === 'C';
      if (isCustom) {
        const qtyToAdd = prescription.Qty || 1;
        const existsIndex = checkoutBasket.findIndex(
          (b) => b.ItemID === prescription.ItemID || b.ItemName === prescription.MedicineDetail
        );
        if (existsIndex >= 0) {
          const updated = [...checkoutBasket];
          updated[existsIndex].Qty += qtyToAdd;
          setCheckoutBasket(updated);
        } else {
          setCheckoutBasket([
            ...checkoutBasket,
            {
              ItemID: prescription.ItemID,
              Qty: qtyToAdd,
              Price: 0, // Since it is 'C' Clinical, rate is 0
              MedicineType: prescription.MedicineType || 'C',
              ItemName: prescription.MedicineDetail
            }
          ]);
        }
        return;
      }
      alert(`Medicine ID ${prescription.ItemID} not found in the inventory system.`);
      return;
    }

    // Verify stock
    const existingBasketQty = checkoutBasket.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
    const qtyToAdd = prescription.MedicineType === 'C' && prescription.Qty ? prescription.Qty : 1; // Default: dispense prescribed Qty or 1 unit
    const totalRequired = existingBasketQty + qtyToAdd;

    if (totalRequired > selectedItem.CStock) {
      setStockValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStockValidationError('');

    const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === prescription.ItemID);
    const itemPrice = (selectedItem.MedicineType === 'C' || prescription.MedicineType === 'C') ? 0 : selectedItem.Price;
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += qtyToAdd;
      updated[existsIndex].Price = itemPrice;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: prescription.ItemID, Qty: qtyToAdd, Price: itemPrice, MedicineType: prescription.MedicineType || selectedItem.MedicineType || 'S' }
      ]);
    }
  };

  // Add all prescribed items to basket at once
  const handleAddAllPrescribedToBasket = (prescribedList: VisitMedicine[]) => {
    const newBasketItems = [...checkoutBasket];
    let errors: string[] = [];

    prescribedList.forEach((prescription) => {
      const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
      if (!selectedItem) {
        const isCustom = prescription.ItemID === 'CUSTOM' || prescription.MedicineType === 'C';
        if (isCustom) {
          const qtyToAdd = prescription.Qty || 1;
          const existsIndex = newBasketItems.findIndex(
            (b) => b.ItemID === prescription.ItemID && b.ItemName === prescription.MedicineDetail
          );
          if (existsIndex >= 0) {
            newBasketItems[existsIndex].Qty += qtyToAdd;
          } else {
            newBasketItems.push({
              ItemID: prescription.ItemID,
              Qty: qtyToAdd,
              Price: 0, // Since it is 'C' Clinical, rate is 0
              MedicineType: prescription.MedicineType || 'C',
              ItemName: prescription.MedicineDetail
            });
          }
        }
        return;
      }

      const existingBasketQty = newBasketItems.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
      const qtyToAdd = prescription.MedicineType === 'C' && prescription.Qty ? prescription.Qty : 1;
      const totalRequired = existingBasketQty + qtyToAdd;

      if (totalRequired > selectedItem.CStock) {
        errors.push(selectedItem.ItemName);
        return;
      }

      const existsIndex = newBasketItems.findIndex((b) => b.ItemID === prescription.ItemID);
      const itemPrice = (selectedItem.MedicineType === 'C' || prescription.MedicineType === 'C') ? 0 : selectedItem.Price;
      if (existsIndex >= 0) {
        newBasketItems[existsIndex].Qty += qtyToAdd;
        newBasketItems[existsIndex].Price = itemPrice;
      } else {
        newBasketItems.push({
          ItemID: prescription.ItemID,
          Qty: qtyToAdd,
          Price: itemPrice,
          MedicineType: prescription.MedicineType || selectedItem.MedicineType || 'S'
        });
      }
    });

    setCheckoutBasket(newBasketItems);

    if (errors.length > 0) {
      setStockValidationError(
        `Stock warning: Could not add [${errors.join(', ')}] to ticket due to insufficient inventory.`
      );
    } else {
      setStockValidationError('');
    }
  };

  // Sales Returns Form
  const [lookupInvoiceNo, setLookupInvoiceNo] = useState('');
  const [matchedInvoice, setMatchedInvoice] = useState<InvoiceHeader | null>(null);
  const [returnBasket, setReturnBasket] = useState<{ ItemID: string; QtyReturned: number; PriceRef: number }[]>([]);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  // Supplier GRN Inward Form
  const [grnSupplierId, setGrnSupplierId] = useState('');
  const [grnRemarks, setGrnRemarks] = useState('');
  const [grnBasket, setGrnBasket] = useState<{ ItemID: string; QtyIn: number; PurchaseRate: number }[]>([]);
  // Row scratchpad inputs for GRN
  const [grnRowItemId, setGrnRowItemId] = useState('');
  const [grnRowQty, setGrnRowQty] = useState<number>(100);
  const [grnRowPrice, setGrnRowPrice] = useState<number>(10);
  const [grnSuccessMsg, setGrnSuccessMsg] = useState('');
  const [editingGrn, setEditingGrn] = useState<InvVchHeader | null>(null);
  const [grnRightTab, setGrnRightTab] = useState<'suppliers' | 'grn_history'>('suppliers');

  // Active View Checkout Invoice (for print or success simulation)
  const [activeInvoiceLookupId, setActiveInvoiceLookupId] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  // Grid checkout calculations
  const calculateTotals = () => {
    const gAmount = checkoutBasket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const netAmount = Math.max(0, gAmount - discountInput);
    return { gAmount, netAmount };
  };

  const { gAmount, netAmount } = calculateTotals();

  // Handle adding product to POS checkout basket
  const handleAddToBasket = () => {
    if (!rowItemId) return;
    const selectedItem = items.find((i) => i.ItemID === rowItemId);
    if (!selectedItem) return;

    // Check Stock validation!
    const existingBasketQty = checkoutBasket.find((b) => b.ItemID === rowItemId)?.Qty || 0;
    const totalRequired = existingBasketQty + rowQty;

    if (totalRequired > selectedItem.CStock) {
      setStockValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStockValidationError('');

    const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === rowItemId);
    const itemPrice = selectedItem.MedicineType === 'C' ? 0 : selectedItem.Price;
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += rowQty;
      updated[existsIndex].Price = itemPrice;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: rowItemId, Qty: rowQty, Price: itemPrice, MedicineType: selectedItem.MedicineType || 'S' }
      ]);
    }

    // Reset scratchpad
    setRowItemId('');
    setRowQty(1);
    setPosSearchQuery('');
    setPosSearchDropdownOpen(false);
    setCompoundingDose(1);
    setCompoundingDays(30);
    setCompoundingInstructions('Daily 1 after meal');
  };

  const handleRemoveFromBasket = (itemId: string) => {
    setCheckoutBasket(checkoutBasket.filter((b) => b.ItemID !== itemId));
  };

  // Checkout and finalize invoice posting
  const handleCheckoutInvoice = (postRecord: boolean) => {
    if (checkoutBasket.length === 0) {
      alert('Checkout basket is empty.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const nextInvoiceNo = `INV-PH-${String(invoices.length + 1).padStart(4, '0')}`;
    const effectivePatientId = selectedPatientId || 'CLINICAL-WALKIN';
    
    // Validate stock one final time before database entry
    for (const basketItem of checkoutBasket) {
      const dbItem = items.find((itm) => itm.ItemID === basketItem.ItemID);
      if (!dbItem || dbItem.CStock < basketItem.Qty) {
        alert(`Stock validation failed for ${dbItem ? dbItem.ItemName : basketItem.ItemID}. Aborting checkout.`);
        return;
      }
    }

    const newHeader: InvoiceHeader = {
      InvoiceNo: nextInvoiceNo,
      PatientID: effectivePatientId,
      InvoiceDate: new Date().toISOString().split('T')[0],
      GAmount: gAmount,
      Discount: discountInput,
      NetAmount: netAmount,
      shift: billingShift,
      Status: postRecord ? 2 : 1 // 1=New, 2=Posted
    };

    const newDetails: InvoiceDetail[] = checkoutBasket.map((b) => ({
      InvoiceNo: nextInvoiceNo,
      ItemID: b.ItemID,
      Qty: b.Qty,
      Price: b.Price,
      LineTotal: b.Qty * b.Price,
      MedicineType: b.MedicineType || 'S'
    }));

    // Trigger state change
    onAddInvoice(newHeader, newDetails);
    
    setBillingSuccess(`Clinical Dispense Invoice ${nextInvoiceNo} completed successfully!`);
    
    // Set print bill data first so they can print immediately!
    setPrintBillData({
      patient: patients.find(p => p.PatientID === effectivePatientId) || null,
      basket: [...checkoutBasket],
      discount: discountInput,
      netAmount: netAmount,
      shift: billingShift,
      invoiceNo: nextInvoiceNo,
      invoiceDate: newHeader.InvoiceDate
    });
    setPrintModalOpen(true);

    // Reset forms
    setCheckoutBasket([]);
    setDiscountInput(0);
    setSelectedPatientId('');

    setTimeout(() => setBillingSuccess(''), 6000);
  };

  // Store Patent Medicine Sales (Store Sales) Helpers & Actions
  const calculateStoreTotals = () => {
    const gAmount = storeBasket.reduce((sum, item) => sum + item.Qty * item.Price, 0);
    const netAmount = Math.max(0, gAmount - storeDiscountInput);
    return { storeGAmount: gAmount, storeNetAmount: netAmount };
  };

  const { storeGAmount, storeNetAmount } = calculateStoreTotals();

  const handleAddToStoreBasket = () => {
    if (!storeRowItemId) return;
    const selectedItem = items.find((i) => i.ItemID === storeRowItemId);
    if (!selectedItem) return;

    // Strict Restriction: ONLY allow Patent Medicines
    if (selectedItem.MedicineType === 'C') {
      setStoreValidationError(
        `Safety Restriction: "${selectedItem.ItemName}" is a Clinical Compounding medicine. These can only be dispensed via a doctor's prescription.`
      );
      return;
    }

    // Verify Stock
    const existingBasketQty = storeBasket.find((b) => b.ItemID === storeRowItemId)?.Qty || 0;
    const totalRequired = existingBasketQty + storeRowQty;

    if (totalRequired > selectedItem.CStock) {
      setStoreValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStoreValidationError('');

    const existsIndex = storeBasket.findIndex((b) => b.ItemID === storeRowItemId);
    if (existsIndex >= 0) {
      const updated = [...storeBasket];
      updated[existsIndex].Qty += storeRowQty;
      setStoreBasket(updated);
    } else {
      setStoreBasket([
        ...storeBasket,
        { ItemID: storeRowItemId, Qty: storeRowQty, Price: selectedItem.Price, MedicineType: 'P' }
      ]);
    }

    // Reset scratchpad
    setStoreRowItemId('');
    setStoreRowQty(1);
    setStoreSearchQuery('');
    setStoreSearchDropdownOpen(false);
  };

  const handleRemoveFromStoreBasket = (itemId: string) => {
    setStoreBasket(storeBasket.filter((b) => b.ItemID !== itemId));
  };

  const handleStoreCheckoutInvoice = (postRecord: boolean) => {
    if (storeBasket.length === 0) {
      alert('Store checkout basket is empty.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const nextInvoiceNo = `INV-PH-${String(invoices.length + 1).padStart(4, '0')}`;
    
    // Validate stock and medicine type one final time before database entry
    for (const basketItem of storeBasket) {
      const dbItem = items.find((itm) => itm.ItemID === basketItem.ItemID);
      if (!dbItem) {
        alert(`Product ID ${basketItem.ItemID} not found in the inventory system.`);
        return;
      }
      if (dbItem.CStock < basketItem.Qty) {
        alert(`Stock validation failed for ${dbItem.ItemName}. Aborting checkout.`);
        return;
      }
      if (dbItem.MedicineType === 'C') {
        alert(`Safety violation: "${dbItem.ItemName}" is a clinical compounding medicine and cannot be sold directly. Aborting.`);
        return;
      }
    }

    const newHeader: InvoiceHeader = {
      InvoiceNo: nextInvoiceNo,
      PatientID: storePatientId || '', // Empty means Walk-in Customer
      InvoiceDate: new Date().toISOString().split('T')[0],
      GAmount: storeGAmount,
      Discount: storeDiscountInput,
      NetAmount: storeNetAmount,
      shift: storeShift,
      Status: postRecord ? 2 : 1 // 1=Draft, 2=Posted
    };

    const newDetails: InvoiceDetail[] = storeBasket.map((b) => ({
      InvoiceNo: nextInvoiceNo,
      ItemID: b.ItemID,
      Qty: b.Qty,
      Price: b.Price,
      LineTotal: b.Qty * b.Price,
      MedicineType: 'P'
    }));

    // Trigger state change
    onAddInvoice(newHeader, newDetails);
    
    setStoreSuccessMsg(`Store Sale ${nextInvoiceNo} checked out! Status: ${postRecord ? 'POSTED & DEBITED TO CASH (Read-Only)' : 'DRAFT'}.`);
    
    // Set print bill data first so they can print immediately!
    setPrintBillData({
      patient: patients.find(p => p.PatientID === storePatientId) || null,
      basket: [...storeBasket],
      discount: storeDiscountInput,
      netAmount: storeNetAmount,
      shift: storeShift,
      invoiceNo: nextInvoiceNo,
      invoiceDate: newHeader.InvoiceDate
    });
    setPrintModalOpen(true);

    // Reset forms
    setStoreBasket([]);
    setStoreDiscountInput(0);
    setStorePatientId('');

    setTimeout(() => setStoreSuccessMsg(''), 6000);
  };

  // Lookup Invoice for Sales Returns
  const handleLookupInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = invoices.find((inv) => inv.InvoiceNo === lookupInvoiceNo.trim());
    if (!matched) {
      alert('No invoice found matching the entered reference.');
      setMatchedInvoice(null);
      return;
    }
    
    setMatchedInvoice(matched);
    
    // Pre-populate return basket with invoice details for editing
    const details = invoiceDetails.filter((d) => d.InvoiceNo === matched.InvoiceNo);
    const initialReturnRows = details.map((d) => ({
      ItemID: d.ItemID,
      QtyReturned: 0, // start at 0, user inputs how much to return
      PriceRef: d.Price
    }));
    setReturnBasket(initialReturnRows);
  };

  // Process Sales Return Post
  const handlePostSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedInvoice) return;
    if (!canPost) {
      alert('Security Protection: PostRec authorization required.');
      return;
    }

    const activeReturns = returnBasket.filter((r) => r.QtyReturned > 0);
    if (activeReturns.length === 0) {
      alert('Please specify quantity to return for at least one item.');
      return;
    }

    // Check that we aren't returning more than purchased
    const originalDetails = invoiceDetails.filter((d) => d.InvoiceNo === matchedInvoice.InvoiceNo);
    for (const rRow of activeReturns) {
      const origQty = originalDetails.find((od) => od.ItemID === rRow.ItemID)?.Qty || 0;
      if (rRow.QtyReturned > origQty) {
        alert(`Cannot return more than originally purchased quantity of ${origQty} units.`);
        return;
      }
    }

    const nextSRNo = `SR-${String(invoices.length + 2).padStart(4, '0')}`;
    const refundSum = activeReturns.reduce((sum, item) => sum + item.QtyReturned * item.PriceRef, 0);

    const srHeader: SRInvHeader = {
      SRInvoiceNo: nextSRNo,
      OriginalInvoiceNo: matchedInvoice.InvoiceNo,
      ReturnDate: new Date().toISOString().split('T')[0],
      shift: matchedInvoice.shift,
      NetPaid: refundSum,
      Remarks: returnRemarks || 'Pharmacy Sales Return reversal'
    };

    const srDetails: SRInvDetail[] = activeReturns.map((r) => ({
      SRInvoiceNo: nextSRNo,
      ItemID: r.ItemID,
      QtyReturned: r.QtyReturned,
      PriceRef: r.PriceRef,
      LineTotal: r.QtyReturned * r.PriceRef
    }));

    onAddSalesReturn(srHeader, srDetails);
    setReturnSuccess(`Sales Return ${nextSRNo} finalized. Stock reinstated. Rs. ${refundSum.toLocaleString()} refunded.`);
    
    // Clear return workspace
    setMatchedInvoice(null);
    setLookupInvoiceNo('');
    setReturnBasket([]);
    setReturnRemarks('');

    setTimeout(() => setReturnSuccess(''), 6000);
  };

  // GRN add row handler
  const handleAddToGrnBasket = () => {
    if (!grnRowItemId) return;
    const isDuplicate = grnBasket.some((b) => b.ItemID === grnRowItemId);
    if (isDuplicate) {
      alert('Product already exists in current GRN worksheet.');
      return;
    }

    setGrnBasket([
      ...grnBasket,
      { ItemID: grnRowItemId, QtyIn: grnRowQty, PurchaseRate: grnRowPrice }
    ]);

    setGrnRowItemId('');
  };

  // Process Goods Inward GRN
  const handlePostGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (grnBasket.length === 0) {
      alert('GRN basket is empty.');
      return;
    }
    if (!canPost) {
      alert('Unauthorized: Accountant/Admin PostRec right is required.');
      return;
    }

    if (editingGrn) {
      // Edit Mode
      const grnHeader: InvVchHeader = {
        ...editingGrn,
        SID: grnSupplierId,
        Remarks: grnRemarks || 'Supplier stock inward'
      };

      const grnDetailsList: InvVchDetail[] = grnBasket.map((b) => ({
        VchNo: editingGrn.VchNo,
        ItemID: b.ItemID,
        QtyIn: b.QtyIn,
        PurchaseRate: b.PurchaseRate
      }));

      if (onUpdateGRN) {
        onUpdateGRN(grnHeader, grnDetailsList);
      }
      setGrnSuccessMsg(`Inward GRN ${editingGrn.VchNo} modified successfully! Stocks recalculated.`);
      setEditingGrn(null);
    } else {
      // Add Mode
      const nextGrnNo = `GRN-${String(grns.length + 1).padStart(3, '0')}`;
      const grnHeader: InvVchHeader = {
        VchNo: nextGrnNo,
        SID: grnSupplierId,
        VchDate: new Date().toISOString().split('T')[0],
        Status: 2, // Posted
        Remarks: grnRemarks || 'Supplier stock inward'
      };

      const grnDetailsList: InvVchDetail[] = grnBasket.map((b) => ({
        VchNo: nextGrnNo,
        ItemID: b.ItemID,
        QtyIn: b.QtyIn,
        PurchaseRate: b.PurchaseRate
      }));

      onAddGRN(grnHeader, grnDetailsList);
      setGrnSuccessMsg(`Inward GRN ${nextGrnNo} posted successfully! Inventory levels increased.`);
    }
    
    // Reset GRN form
    setGrnBasket([]);
    setGrnSupplierId('');
    setGrnRemarks('');

    setTimeout(() => setGrnSuccessMsg(''), 6000);
  };

  // Filter invoices for today or all history
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredInvoices = invoices.filter((inv) => {
    // Date filter
    if (!showAllInvoicesInHistory && inv.InvoiceDate !== todayStr) {
      return false;
    }
    // Search query filter
    if (searchHistoryQuery.trim()) {
      const q = searchHistoryQuery.toLowerCase().trim();
      const invoiceNoMatch = String(inv.InvoiceNo || '').toLowerCase().includes(q);
      const patientNameMatch = String(patients.find((p) => p.PatientID === inv.PatientID)?.PatientName || 'Walk-in Customer').toLowerCase().includes(q);
      const patientIdMatch = String(inv.PatientID || '').toLowerCase().includes(q);
      
      const medicinesMatch = invoiceDetails
        .filter((d) => d.InvoiceNo === inv.InvoiceNo)
        .some((d) => {
          const item = items.find((itm) => itm.ItemID === d.ItemID);
          return String(item?.ItemName || '').toLowerCase().includes(q) || String(d.ItemID || '').toLowerCase().includes(q);
        });

      return invoiceNoMatch || patientNameMatch || patientIdMatch || medicinesMatch;
    }
    return true;
  }).sort((a, b) => b.InvoiceNo.localeCompare(a.InvoiceNo)); // Newest first

  const getPatientName = (id: string) => {
    const p = patients.find((pat) => pat.PatientID === id);
    return p ? p.PatientName : 'Walk-in Customer';
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800" id="pharmacy-pos">
      {/* Upper Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <ShoppingCart className="w-5.5 h-5.5 text-blue-600 mr-2" />
            Pharmacy POS & Inventory Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time point of sale, safety stock validations, supplier inwards, and return logs</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('checkout')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'checkout' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Clinical Medicine</span>
          </button>
          <button
            onClick={() => setActiveSubTab('store_sales')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'store_sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
            <span>Store Medicine</span>
          </button>
          <button
            onClick={() => setActiveSubTab('return')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'return' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Sales Returns</span>
          </button>
          <button
            onClick={() => setActiveSubTab('grn')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'grn' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Inventory GRN</span>
          </button>
          <button
            onClick={() => setActiveSubTab('inventory_manager')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'inventory_manager' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Stock Grid & Manager</span>
          </button>
          <button
            onClick={() => setActiveSubTab('invoice_logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'invoice_logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-500" />
            <span>Patient Dispatched Medicine & Invoice Logs</span>
          </button>
          <button
            onClick={() => setActiveSubTab('clinical_labels')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'clinical_labels' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>Clinic Medicine Label Printer</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      {activeSubTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-billing-tab">
          
          {/* POS Bill Builder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-500 mr-2" />
              Clinical Medicine
            </h3>

            {billingSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {billingSuccess}
              </div>
            )}

            {stockValidationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                {stockValidationError}
              </div>
            )}

            {/* Instruction Banner */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <span className="font-extrabold block text-xxs uppercase tracking-wider text-blue-700">📋 Clinical Medicine Dispensing Protocol:</span>
              <p className="font-medium text-xs text-blue-800 leading-relaxed">
                Select patient below to load Doctor's Prescribed Clinical Compounding Medicines coming from the Patient Visit sub-tab. Review prescription, compound/configure, print sticker label, and dispense to patient.
              </p>
            </div>

            {/* Patient Selection & Doctor Prescription Lookup */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xxs font-bold text-emerald-800 uppercase tracking-wider">
                    Select Patient / Lookup Prescription
                  </label>
                  <p className="text-[11px] text-emerald-700">
                    Loads Prescribed Clinical Compounding Medicines recorded in Patient Visit sub-tab.
                  </p>
                </div>
                {selectedPatientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setLabelPatientId(selectedPatientId);
                      if (latestVisit) setLabelVisitId(latestVisit.VisitID);
                      setActiveSubTab('clinical_labels');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition cursor-pointer self-start sm:self-auto shadow-xs"
                  >
                    <Tag className="w-3.5 h-3.5 mr-1" />
                    <span>Print Usage Label Stickers</span>
                  </button>
                )}
              </div>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-xs font-bold border border-emerald-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Patient / Token --</option>
                {patients.map((p) => {
                  const tokenNo = getPatientTokenNo(p.PatientID);
                  const pVisits = visits.filter(v => v.PatientID === p.PatientID);
                  const hasPrescription = pVisits.some(v => getVisitMedicinesList(v).length > 0);
                  return (
                    <option key={p.PatientID} value={p.PatientID}>
                      {p.PatientName} (ID: {p.PatientID}) {tokenNo ? `[Token #${tokenNo}]` : ''} {hasPrescription ? '• [Rx Prescribed]' : ''}
                    </option>
                  );
                })}
              </select>

              {/* Prescribed Medicines Box */}
              {selectedPatientId && (
                <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-2.5 mt-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center">
                      <Stethoscope className="w-4 h-4 text-emerald-600 mr-1.5" />
                      Doctor's Prescribed Medicines (Rx) for {patients.find(p => p.PatientID === selectedPatientId)?.PatientName}
                    </span>
                    {latestVisit && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                        Visit Date: {latestVisit.VisitDate}
                      </span>
                    )}
                  </div>

                  {prescribedMedicinesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No prescription items recorded for this patient's latest visit. You can search and dispense clinical medicines manually below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="divide-y divide-slate-100 max-h-[180px] overflow-y-auto pr-1">
                        {prescribedMedicinesList.map((pm, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 block truncate">
                                {pm.MedicineDetail || pm.ItemID}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                Dosage: {pm.Dosage || 'As directed'} • Type: {pm.MedicineType === 'C' ? 'Clinical Compounding' : 'Patent Medicine'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPrescribedToBasket(pm)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs rounded-lg transition shrink-0 cursor-pointer"
                            >
                              + Add to Basket
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          prescribedMedicinesList.forEach((pm) => handleAddPrescribedToBasket(pm));
                        }}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add All Prescribed Medicines to Dispense Basket</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-Grid Item selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
              <span className="text-xxs font-bold text-slate-400 uppercase">Search & Dispense Clinical Medicine</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Search Clinical Medicine</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search clinical medicine (by name or ID)..."
                      value={posSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPosSearchQuery(val);
                        setPosSearchDropdownOpen(true);
                        // find if there's an exact match, otherwise clear rowItemId
                        const exact = items.find(i => i.ItemName.toLowerCase() === val.toLowerCase());
                        if (exact) {
                          setRowItemId(exact.ItemID);
                        } else {
                          setRowItemId('');
                        }
                      }}
                      onFocus={() => setPosSearchDropdownOpen(true)}
                      onBlur={() => {
                        // Delay closing slightly so onMouseDown click registers
                        setTimeout(() => setPosSearchDropdownOpen(false), 200);
                      }}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 pr-8 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    
                    {posSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setPosSearchQuery('');
                          setRowItemId('');
                        }}
                        className="absolute right-2 top-[12px] text-slate-400 hover:text-slate-600"
                      >
                        <span className="text-xs font-bold font-mono">✕</span>
                      </button>
                    )}

                    {posSearchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                        {(() => {
                          const query = posSearchQuery.toLowerCase().trim();
                          const list = items.filter(itm => 
                            itm.ItemName.toLowerCase().includes(query) || 
                            itm.ItemID.toLowerCase().includes(query)
                          );
                          
                          if (list.length === 0) {
                            return <div className="p-3 text-xs text-slate-400 text-center">No matching pharmaceutical items found</div>;
                          }
                          
                          return list.slice(0, 15).map((itm, idx) => {
                            const isClinical = itm.MedicineType === 'C';
                            return (
                              <div
                                key={`${itm.ItemID}-${idx}`}
                                onMouseDown={() => {
                                  setRowItemId(itm.ItemID);
                                  setPosSearchQuery(itm.ItemName);
                                  setPosSearchDropdownOpen(false);
                                }}
                                className="p-2.5 hover:bg-blue-50 cursor-pointer text-left transition flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-semibold text-xs text-slate-800">{itm.ItemName}</span>
                                  <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({itm.ItemID})</span>
                                </div>
                                <div className="text-right text-xxs font-mono">
                                  {isClinical ? (
                                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Clinical Medicine</span>
                                  ) : (
                                    <span className="text-slate-600">Rs. {itm.Price}</span>
                                  )}
                                  <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Stock: {itm.CStock}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {rowItemId && (() => {
                    const sel = items.find(i => i.ItemID === rowItemId);
                    if (!sel) return null;
                    if (sel.MedicineType === 'C') {
                      return (
                        <div className="mt-1.5 space-y-2">
                          <div className="flex items-center justify-between text-xxs bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-md">
                            <span>Selected Ingredient: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                            <span>
                              <span className="text-emerald-700 font-bold">Clinical Medicine (Pre-Paid)</span>
                              <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                            </span>
                          </div>
                          
                          {/* Formula compounding inputs */}
                          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg space-y-2 text-xs">
                            <span className="text-xxs font-black text-emerald-700 uppercase tracking-wider block">🧪 Clinical Box Formula Compounding Wizard</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Dose per Day ({sel.Unit}s)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={compoundingDose}
                                  onChange={(e) => {
                                    const d = Math.max(1, parseInt(e.target.value) || 1);
                                    setCompoundingDose(d);
                                    setRowQty(d * compoundingDays);
                                  }}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Duration (Days)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={compoundingDays}
                                  onChange={(e) => {
                                    const days = Math.max(1, parseInt(e.target.value) || 1);
                                    setCompoundingDays(days);
                                    setRowQty(compoundingDose * days);
                                  }}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Formula / Take Notes</label>
                                <input
                                  type="text"
                                  value={compoundingInstructions}
                                  onChange={(e) => setCompoundingInstructions(e.target.value)}
                                  className="mt-1 w-full text-xs border border-emerald-200 bg-white rounded p-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                                  placeholder="e.g. 1 after meal daily"
                                />
                              </div>
                            </div>
                            
                            <div className="bg-white border border-emerald-150 p-2.5 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0 text-xxs text-slate-600 font-medium">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  Calculated Compounded Quantity: <strong className="text-emerald-700 text-xs font-mono">{compoundingDose * compoundingDays}</strong> {sel.Unit}s
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  Formula: {compoundingDose} {sel.Unit}(s) for {compoundingDays} Days ({compoundingInstructions})
                                </p>
                              </div>
                              <div className="text-right sm:border-l sm:pl-3 border-slate-150">
                                <p className="text-slate-500">
                                  Cost Price: <strong className="text-slate-700 font-mono">Rs. {(compoundingDose * compoundingDays * sel.PurchasePrice).toFixed(1)}</strong>
                                </p>
                                <p className="text-emerald-600 font-bold">
                                  Payment Status: <strong className="font-mono">Pre-Paid (Free Dispense)</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-1.5 flex items-center justify-between text-xxs bg-blue-50 border border-blue-100 text-blue-800 p-1.5 rounded-md font-medium">
                        <span>Selected Item: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                        <span>
                          <span>Price: <strong>Rs. {sel.Price}</strong></span>
                          <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={rowQty}
                      onChange={(e) => setRowQty(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToBasket}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition self-end"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Checkout basket list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                    <th className="py-2.5 font-bold">Item ID</th>
                    <th className="py-2.5 font-bold">Product</th>
                    <th className="py-2.5 text-center font-bold">Qty</th>
                    <th className="py-2.5 text-right font-bold">Dispense Rate</th>
                    <th className="py-2.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkoutBasket.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-semibold">Dispensing list is currently empty. Search and add clinical medicines above.</td>
                    </tr>
                  ) : (
                    checkoutBasket.map((b, idx) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      return (
                        <tr key={`${b.ItemID}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                          <td className="py-2 font-bold text-slate-800">{item ? item.ItemName : 'Unknown'}</td>
                          <td className="py-2 text-center font-bold font-mono">{b.Qty}</td>
                          <td className="py-2 text-right font-mono text-slate-600">
                            <span className="text-emerald-600 font-bold">Pre-paid (Rs. 0)</span>
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(b.ItemID)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Checkout Totals & Calculations Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Clinical Medicine Dispensing</h3>
              
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 space-y-1">
                  <span className="font-extrabold block text-xxs uppercase tracking-wider text-emerald-700">Payment Status:</span>
                  <p className="font-semibold text-xs text-emerald-800">
                    Doctor/Visit desk has already collected clinical medicine payment. No cash collection required.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Items to Dispense:</span>
                  <span className="font-mono text-emerald-600 font-bold">{checkoutBasket.length} item(s)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-4">
              <button
                type="button"
                onClick={() => handleCheckoutInvoice(true)}
                disabled={checkoutBasket.length === 0}
                className={`w-full py-3 rounded-lg text-xs font-bold text-white shadow-md transition flex items-center justify-center ${
                  checkoutBasket.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 mr-1 shrink-0" />
                <span>Dispense Clinical Medicine & Deduct Stock</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Patient Dispatched Medicine & Invoice Logs Tab */}
      {activeSubTab === 'invoice_logs' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn" id="today-receipts-history">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Patient Dispatched Medicine & Invoice Logs</h3>
                <p className="text-[11px] text-slate-500 font-medium">History of today's issued medicine bills with standard reprint function</p>
              </div>
            </div>

            {/* Toggle filters and Search bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Invoice / Patient..."
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="w-full sm:w-48 text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px] font-bold uppercase shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllInvoicesInHistory(false)}
                  className={`px-3 py-1 rounded-md transition ${!showAllInvoicesInHistory ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Today Only
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllInvoicesInHistory(true)}
                  className={`px-3 py-1 rounded-md transition ${showAllInvoicesInHistory ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  All History ({invoices.length})
                </button>
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                  <th className="py-2.5 font-bold">Invoice Ref</th>
                  <th className="py-2.5 font-bold">Patient / Customer</th>
                  <th className="py-2.5 font-bold">Shift & Date</th>
                  <th className="py-2.5 font-bold">Dispatched Medications (Rx)</th>
                  <th className="py-2.5 text-right font-bold">Net Total Paid</th>
                  <th className="py-2.5 text-center font-bold">Receipt actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold bg-slate-50/50 rounded-lg">
                      No patient dispatch receipts match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const patientName = getPatientName(inv.PatientID);
                    const isToday = inv.InvoiceDate === new Date().toISOString().split('T')[0];
                    return (
                      <tr key={inv.InvoiceNo} className="hover:bg-slate-50/50 group transition duration-150">
                        <td className="py-3 font-mono font-bold text-xs text-slate-900">
                          <span className="block">{inv.InvoiceNo}</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-1 ${inv.Status === 2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {inv.Status === 2 ? 'Posted' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800 block text-xs">{patientName}</span>
                          <span className="text-xxs text-slate-400 font-mono block">ID: {inv.PatientID}</span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${inv.shift === 1 ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                            {inv.shift === 1 ? 'Morning (1)' : 'Evening (2)'}
                          </span>
                          <span className="text-xxs text-slate-400 font-mono block mt-1">{inv.InvoiceDate} {isToday && '• Today'}</span>
                        </td>
                        <td className="py-3 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {invoiceDetails
                              .filter((d) => d.InvoiceNo === inv.InvoiceNo)
                              .map((d, idx) => {
                                const item = items.find((itm) => itm.ItemID === d.ItemID);
                                return (
                                  <span key={`${d.ItemID}-${idx}`} className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200 transition">
                                    {item ? item.ItemName : d.ItemID} <span className="text-[10px] text-slate-400 ml-1 font-mono">x{d.Qty}</span>
                                  </span>
                                );
                              })}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-sm text-slate-900">
                          Rs. {inv.NetAmount.toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const details = invoiceDetails.filter((d) => d.InvoiceNo === inv.InvoiceNo);
                              const basket = details.map((d) => ({
                                ItemID: d.ItemID,
                                Qty: d.Qty,
                                Price: d.Price
                              }));
                              setPrintBillData({
                                patient: patients.find((p) => p.PatientID === inv.PatientID) || null,
                                basket: basket,
                                discount: inv.Discount,
                                netAmount: inv.NetAmount,
                                shift: inv.shift,
                                invoiceNo: inv.InvoiceNo,
                                invoiceDate: inv.InvoiceDate
                              });
                              setPrintModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xxs font-extrabold uppercase rounded-lg transition-all flex items-center justify-center mx-auto cursor-pointer shadow-sm group-hover:scale-[1.02]"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print Receipt
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
      )}

      {/* Store Medicine Tab */}
      {activeSubTab === 'store_sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-store-sales-tab">
          
          {/* POS Bill Builder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-500 mr-2" />
              Store Medicine
            </h3>

            {storeSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {storeSuccessMsg}
              </div>
            )}

            {storeValidationError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                {storeValidationError}
              </div>
            )}

            {/* Safety Restriction Alert Box */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xxs text-amber-800 space-y-1">
              <span className="font-extrabold block uppercase tracking-wide">⚠️ Safety Policy & Restriction:</span>
              <p className="font-semibold leading-relaxed">
                Only <strong className="text-amber-950 underline font-extrabold">Patent Medicines</strong> can be sold directly to patients. Clinical compounding medicines (Type 'C') are strictly restricted and always require a doctor's prescription.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Customer / Patient Type</label>
                <select
                  value={storePatientId}
                  onChange={(e) => setStorePatientId(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Walk-in Customer (General POS) --</option>
                  {patients.map((p) => (
                    <option key={p.PatientID} value={p.PatientID}>
                      {p.PatientName} ({p.PatientID})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Operational Shift</label>
                <select
                  value={storeShift}
                  onChange={(e) => setStoreShift(parseInt(e.target.value) as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value={1}>Morning Shift (1)</option>
                  <option value={2}>Evening Shift (2)</option>
                </select>
              </div>
            </div>

            {/* In-Grid Item selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
              <span className="text-xxs font-bold text-slate-400 uppercase">Select Patent Medicine</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Search Patent Medicine</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type to search patent medicine (by name or ID)..."
                      value={storeSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStoreSearchQuery(val);
                        setStoreSearchDropdownOpen(true);
                        const exact = items.find(i => i.MedicineType !== 'C' && i.ItemName.toLowerCase() === val.toLowerCase());
                        if (exact) {
                          setStoreRowItemId(exact.ItemID);
                        } else {
                          setStoreRowItemId('');
                        }
                      }}
                      onFocus={() => setStoreSearchDropdownOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setStoreSearchDropdownOpen(false), 200);
                      }}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 pr-8 focus:outline-none focus:border-blue-500 font-medium"
                    />
                    
                    {storeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setStoreSearchQuery('');
                          setStoreRowItemId('');
                        }}
                        className="absolute right-2 top-[12px] text-slate-400 hover:text-slate-600"
                      >
                        <span className="text-xs font-bold font-mono">✕</span>
                      </button>
                    )}

                    {storeSearchDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                        {(() => {
                          const query = storeSearchQuery.toLowerCase().trim();
                          const list = items.filter(itm => 
                            itm.MedicineType !== 'C' && (
                              itm.ItemName.toLowerCase().includes(query) || 
                              itm.ItemID.toLowerCase().includes(query)
                            )
                          );
                          
                          if (list.length === 0) {
                            return <div className="p-3 text-xs text-slate-400 text-center">No matching patent medicines found</div>;
                          }
                          
                          return list.slice(0, 15).map((itm, idx) => (
                            <div
                              key={`${itm.ItemID}-${idx}`}
                              onMouseDown={() => {
                                setStoreRowItemId(itm.ItemID);
                                setStoreSearchQuery(itm.ItemName);
                                setStoreSearchDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-emerald-50 cursor-pointer text-left transition flex justify-between items-center"
                            >
                              <div>
                                <span className="font-semibold text-xs text-slate-800">{itm.ItemName}</span>
                                <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({itm.ItemID})</span>
                              </div>
                              <div className="text-right text-xxs font-mono">
                                <span className="text-slate-600 font-bold">Rs. {itm.Price}</span>
                                <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">Stock: {itm.CStock}</span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {storeRowItemId && (() => {
                    const sel = items.find(i => i.ItemID === storeRowItemId);
                    if (!sel) return null;
                    return (
                      <div className="mt-1.5 flex items-center justify-between text-xxs bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-md font-medium">
                        <span>Selected Patent Medicine: <strong>{sel.ItemName}</strong> ({sel.ItemID})</span>
                        <span>
                          <span>Price: <strong>Rs. {sel.Price}</strong></span>
                          <span className="ml-2">| Stock: <strong>{sel.CStock} {sel.Unit}s</strong></span>
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={storeRowQty}
                      onChange={(e) => setStoreRowQty(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToStoreBasket}
                    className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition self-end"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Checkout basket list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                    <th className="py-2.5 font-bold">Item ID</th>
                    <th className="py-2.5 font-bold">Product Name</th>
                    <th className="py-2.5 text-center font-bold">Qty</th>
                    <th className="py-2.5 text-right font-bold">Retail Rate</th>
                    <th className="py-2.5 text-right font-bold">Line Total</th>
                    <th className="py-2.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storeBasket.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-semibold">Store sales ticket basket is currently empty.</td>
                    </tr>
                  ) : (
                    storeBasket.map((b, idx) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      const total = b.Qty * b.Price;
                      return (
                        <tr key={`${b.ItemID}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                          <td className="py-2 font-bold text-slate-800">{item ? item.ItemName : 'Unknown'}</td>
                          <td className="py-2 text-center font-bold font-mono">{b.Qty}</td>
                          <td className="py-2 text-right font-mono text-slate-600">Rs. {b.Price}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-900">Rs. {total.toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromStoreBasket(b.ItemID)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Checkout Totals & Calculations Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[480px]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Store Ticket Checkout</h3>
              
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between font-semibold">
                  <span>Gross Total (GAmount):</span>
                  <span className="font-mono text-slate-900 font-bold">Rs. {storeGAmount.toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Apply Discount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    max={storeGAmount}
                    value={storeDiscountInput}
                    onChange={(e) => setStoreDiscountInput(Math.min(storeGAmount, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Net Amount Paid:</span>
                  <strong className="text-lg font-bold text-emerald-600 font-mono">Rs. {storeNetAmount.toLocaleString()}</strong>
                </div>
              </div>

              {/* Account distribution preview */}
              <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xxs text-slate-500 space-y-1.5 font-medium">
                <span className="font-bold text-slate-400 uppercase">Expected Double-Entry Distribution:</span>
                <div className="flex justify-between">
                  <span>Debit StoreCIH_ Cash Account:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {storeNetAmount.toLocaleString()}</span>
                </div>
                {storeDiscountInput > 0 && (
                  <div className="flex justify-between">
                    <span>Debit StoreDisc_ Discount:</span>
                    <span className="text-slate-800 font-bold font-mono">Rs. {storeDiscountInput.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Credit StoreSale_ Revenue:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {storeGAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStoreCheckoutInvoice(false)}
                  disabled={!canAdd}
                  className="py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Save Draft Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (storeBasket.length === 0) {
                      alert('Cannot print empty bill. Please add items to ticket.');
                      return;
                    }
                    setPrintBillData({
                      patient: patients.find(p => p.PatientID === storePatientId) || null,
                      basket: [...storeBasket],
                      discount: storeDiscountInput,
                      netAmount: storeNetAmount,
                      shift: storeShift,
                      invoiceNo: 'DRAFT',
                      invoiceDate: new Date().toISOString().split('T')[0]
                    });
                    setPrintModalOpen(true);
                  }}
                  className="py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5 shrink-0" />
                  <span>Print Active Bill</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleStoreCheckoutInvoice(true)}
                disabled={!canAdd || !canPost}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition flex items-center justify-center ${
                  canAdd && canPost
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 mr-1 shrink-0" />
                <span>Authorize & Post Invoice</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sales Returns Tab */}
      {activeSubTab === 'return' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn" id="pos-returns-tab">
          
          {/* Invoice lookup & return calculator */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <Undo2 className="w-4.5 h-4.5 text-emerald-500 mr-2" />
              Invoice Reversals / Returns Worksheet
            </h3>

            {returnSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {returnSuccess}
              </div>
            )}

            <form onSubmit={handleLookupInvoice} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter original Invoice No (e.g. INV-PH-0001)..."
                  value={lookupInvoiceNo}
                  onChange={(e) => setLookupInvoiceNo(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                Lookup Invoice
              </button>
            </form>

            {matchedInvoice && (
              <form onSubmit={handlePostSalesReturn} className="space-y-4 pt-2 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xxs font-medium text-slate-600">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Invoice Ref: {matchedInvoice.InvoiceNo}</span>
                    <span>Date: {matchedInvoice.InvoiceDate}</span>
                  </div>
                  <p>Original Customer: <strong className="text-slate-800 font-bold">{getPatientName(matchedInvoice.PatientID)}</strong></p>
                  <p>Gross: Rs. {matchedInvoice.GAmount} | Net Paid: Rs. {matchedInvoice.NetAmount} (Discount: Rs. {matchedInvoice.Discount})</p>
                </div>

                {/* Return rows table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl p-3 bg-slate-50/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                        <th className="py-2">Medicine ID</th>
                        <th className="py-2">Item</th>
                        <th className="py-2 text-center">Original Qty</th>
                        <th className="py-2 text-center">Qty to Return</th>
                        <th className="py-2 text-right">Refund Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnBasket.map((row, idx) => {
                        const originalQty = invoiceDetails.find(
                          (d) => d.InvoiceNo === matchedInvoice.InvoiceNo && d.ItemID === row.ItemID
                        )?.Qty || 0;
                        const name = items.find((i) => i.ItemID === row.ItemID)?.ItemName || row.ItemID;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 font-mono text-xxs font-semibold text-slate-400">{row.ItemID}</td>
                            <td className="py-2 font-bold text-slate-800 truncate max-w-[150px]">{name}</td>
                            <td className="py-2 text-center font-bold font-mono">{originalQty}</td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={originalQty}
                                value={row.QtyReturned}
                                onChange={(e) => {
                                  const updated = [...returnBasket];
                                  updated[idx].QtyReturned = Math.min(originalQty, parseInt(e.target.value) || 0);
                                  setReturnBasket(updated);
                                }}
                                className="w-12 text-center text-xs font-mono border border-slate-200 rounded bg-white p-1 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 text-right font-mono text-slate-600 font-bold">Rs. {row.PriceRef}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Return Reason / Internal remarks</label>
                  <textarea
                    placeholder="Enter return justification..."
                    required
                    rows={2}
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canPost}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition ${
                    canPost ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Finalize Sales Return & Credit Refund Cash
                </button>
              </form>
            )}
          </div>

          {/* Return ledger summary */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Reversal Transaction Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {invoices.filter((inv) => inv.Status === 2).length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-16">No posted invoices to reverse.</p>
              ) : (
                <p className="text-xxs text-slate-400 font-medium">Lookup returned items, check safety restock levels, or audit active cash box refunds here.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Supplier GRN Tab */}
      {activeSubTab === 'grn' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-grn-tab">
          
          {/* Supplier GRN Maker */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <Truck className="w-4.5 h-4.5 text-emerald-500 mr-2" />
              Goods Received Note (GRN) / Stock Inward
            </h3>

            {grnSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {grnSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePostGRN} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Select Supplier *</label>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <select
                      required
                      value={grnSupplierId}
                      onChange={(e) => setGrnSupplierId(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Choose Vendor --</option>
                      {suppliers.map((sup) => (
                        <option key={sup.SID} value={sup.SID}>
                          {sup.SupplierName} ({sup.SID})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsVendorModalOpen(true)}
                      title="Manage Suppliers (Grid-View / Add / Edit)"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-lg flex items-center justify-center transition cursor-pointer font-bold text-xs"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      <span>Edit Vendors</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Inward Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Received batch no 23450, fresh inventory expiry 2028"
                    value={grnRemarks}
                    onChange={(e) => setGrnRemarks(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* GRN Row Builder */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
                <span className="text-xxs font-bold text-slate-400 uppercase">Inward Stock Inserter Worksheet</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Product Item</label>
                    <select
                      value={grnRowItemId}
                      onChange={(e) => setGrnRowItemId(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none"
                    >
                      <option value="">-- Select Product --</option>
                      {items.map((i, idx) => (
                        <option key={`${i.ItemID}-${idx}`} value={i.ItemID}>
                          {i.ItemName} [Current: {i.CStock}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Qty Inward</label>
                    <input
                      type="number"
                      min="1"
                      value={grnRowQty}
                      onChange={(e) => setGrnRowQty(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Purchase Cost Rate (Rs.)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={grnRowPrice}
                      onChange={(e) => setGrnRowPrice(parseFloat(e.target.value) || 1)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-1.5 focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToGrnBasket}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold rounded flex items-center justify-center transition"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Insert Stock Inward Row</span>
                </button>
              </div>

              {/* Basket list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-xxs font-bold">
                      <th className="py-2">Item ID</th>
                      <th className="py-2">Product Name</th>
                      <th className="py-2 text-center">Inward Qty</th>
                      <th className="py-2 text-right">Purchase Rate</th>
                      <th className="py-2 text-right">Subtotal Cost</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grnBasket.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400 font-semibold">GRN sheet is empty. Add lines.</td>
                      </tr>
                    ) : (
                      grnBasket.map((b, idx) => {
                        const name = items.find((i) => i.ItemID === b.ItemID)?.ItemName || b.ItemID;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 font-medium">
                            <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                            <td className="py-2 font-bold text-slate-800">{name}</td>
                            <td className="py-2 text-center font-bold font-mono">{b.QtyIn}</td>
                            <td className="py-2 text-right font-mono">Rs. {b.PurchaseRate}</td>
                            <td className="py-2 text-right font-mono text-slate-900 font-bold">Rs. {(b.QtyIn * b.PurchaseRate).toLocaleString()}</td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => setGrnBasket(grnBasket.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 mt-4">
                <button
                  type="submit"
                  disabled={!canPost}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition ${
                    canPost ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {editingGrn ? `Update GRN ${editingGrn.VchNo} & Recalculate Stocks` : 'Post Inward GRN & Capitalize Inventory'}
                </button>
                {editingGrn && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGrn(null);
                      setGrnBasket([]);
                      setGrnSupplierId('');
                      setGrnRemarks('');
                      setGrnSuccessMsg('Edit mode cancelled.');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Cancel Edit (Reset Form)
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Suppliers directory & GRN History Tabbed Sidebar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[620px]">
            {/* Tab selection buttons */}
            <div className="flex space-x-2 border-b border-slate-100 pb-2 mb-3">
              <button
                type="button"
                onClick={() => setGrnRightTab('suppliers')}
                className={`flex-1 pb-1 text-xs font-bold border-b-2 transition ${
                  grnRightTab === 'suppliers' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Suppliers
              </button>
              <button
                type="button"
                onClick={() => setGrnRightTab('grn_history')}
                className={`flex-1 pb-1 text-xs font-bold border-b-2 transition ${
                  grnRightTab === 'grn_history' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                GRN History ({grns.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {grnRightTab === 'suppliers' ? (
                <div className="space-y-4">
                  {suppliers.map((sup) => (
                    <div key={sup.SID} className="text-xxs text-slate-600 space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="flex justify-between font-bold text-slate-900 text-xs">
                        <span>{sup.SupplierName}</span>
                        <span className="text-xxs font-mono text-emerald-600 font-bold">{sup.SID}</span>
                      </div>
                      <p className="font-semibold text-slate-500">Call: {sup.Phone}</p>
                      <p className="text-slate-400 font-semibold">{sup.Address}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {grns.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold text-center py-16">No inward GRNs posted yet.</p>
                  ) : (
                    [...grns].reverse().map((grn) => {
                      const supName = suppliers.find((s) => s.SID === grn.SID)?.SupplierName || grn.SID;
                      const details = grnDetails.filter((d) => d.VchNo === grn.VchNo);
                      const totalCost = details.reduce((sum, d) => sum + (d.QtyIn * d.PurchaseRate), 0);
                      
                      return (
                        <div key={grn.VchNo} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 flex items-center">
                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xxs font-mono mr-1.5 font-bold">
                                  {grn.VchNo}
                                </span>
                                {grn.VchDate}
                              </h4>
                              <p className="text-xxs text-slate-400 font-semibold mt-1">Vendor: {supName}</p>
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-900">
                              Rs. {totalCost.toLocaleString()}
                            </span>
                          </div>
                          {grn.Remarks && (
                            <p className="text-xxs text-slate-500 font-medium italic">"{grn.Remarks}"</p>
                          )}
                          <div className="flex justify-end space-x-2 border-t border-slate-100 pt-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGrn(grn);
                                setGrnSupplierId(grn.SID);
                                setGrnRemarks(grn.Remarks || '');
                                setGrnBasket(details.map(d => ({
                                  ItemID: d.ItemID,
                                  QtyIn: d.QtyIn,
                                  PurchaseRate: d.PurchaseRate
                                })));
                                setGrnSuccessMsg(`Loaded GRN ${grn.VchNo} into worksheet. You can adjust lines or vendor and re-post.`);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded text-xxs font-bold flex items-center transition"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to void GRN ${grn.VchNo}? This will subtract its quantities from medicine stocks and reverse its accounting ledger postings!`)) {
                                  if (onVoidGRN) {
                                    onVoidGRN(grn.VchNo);
                                    alert(`GRN ${grn.VchNo} has been voided successfully.`);
                                  }
                                }
                              }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded text-xxs font-bold flex items-center transition"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Void
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Stock Grid & Manager Tab */}
      {activeSubTab === 'inventory_manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-inventory-manager-tab">
          
          {/* Form Side - Left Column */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-indigo-600 mr-2" />
              {editingItem ? `Edit Medicine: ${editingItem.ItemID}` : 'Add New Medicine to Inventory'}
            </h3>

            {invSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-semibold border border-emerald-100">
                {invSuccessMsg}
              </div>
            )}

            {invErrorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-semibold border border-red-100 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                {invErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Item ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    placeholder="e.g. ITM-020"
                    value={itemFormId}
                    onChange={(e) => setItemFormId(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 font-mono disabled:bg-slate-50 disabled:text-slate-500 border-slate-200"
                  />
                  {!editingItem && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextId = `ITM-${String(items.length + 1).padStart(3, '0')}`;
                        setItemFormId(nextId);
                      }}
                      className="text-[9px] text-indigo-600 font-extrabold mt-1 hover:underline text-left block"
                    >
                      + Generate ID
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine Type</label>
                  <select
                    value={itemFormMedicineType}
                    onChange={(e) => setItemFormMedicineType(e.target.value as 'C' | 'P')}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-semibold"
                  >
                    <option value="P">Patent Medicine (/P)</option>
                    <option value="C">Clinical Compounding (/C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Medicine / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Panadol 500mg Tab"
                  value={itemFormName}
                  onChange={(e) => setItemFormName(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-semibold text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tab, Cap, Syrup, Gram"
                    value={itemFormUnit}
                    onChange={(e) => setItemFormUnit(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Minimum Threshold</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={itemFormMinStock}
                    onChange={(e) => setItemFormMinStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Purchase Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cost price"
                    value={itemFormPurchasePrice}
                    onChange={(e) => setItemFormPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Retail Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Sale price"
                    value={itemFormRetailPrice}
                    onChange={(e) => setItemFormRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Current Stock Level</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={itemFormCStock}
                  onChange={(e) => setItemFormCStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 border-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="submit"
                  disabled={!canAdd}
                  className={`flex-1 py-2 rounded-lg text-white font-bold transition shadow-sm ${
                    canAdd
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {editingItem ? 'Update Medicine' : 'Add to Inventory'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="px-3 py-2 border border-slate-250 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition text-center"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Grid Side - Right Columns */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Database className="w-4 h-4 text-emerald-600 mr-2" />
                    Real-time Medicine Inventory Grid-View
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Add, update parameters, remove, and filter Clinical vs Patent stocks.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsLowStockReportModalOpen(true)}
                  className="mt-2 sm:mt-0 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg flex items-center justify-center transition cursor-pointer font-bold text-xxs shrink-0"
                  title="Print Stock Shortage Report with Category Selection"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  <span>Low Stock Report</span>
                </button>
              </div>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item ID, name or unit..."
                  value={invSearchQuery}
                  onChange={(e) => setInvSearchQuery(e.target.value)}
                  className="w-full text-xs border rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 border-slate-250 bg-white"
                />
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl">
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Items</span>
                <span className="text-xs font-black text-slate-900 font-mono block mt-0.5">{items.length}</span>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 p-2 rounded-xl">
                <span className="text-[8px] font-extrabold text-rose-500 uppercase tracking-wider block">Low Stock</span>
                <span className="text-xs font-black text-rose-700 font-mono block mt-0.5">
                  {items.filter(itm => itm.CStock <= (itm.MinStock || 10)).length}
                </span>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 p-2 rounded-xl">
                <span className="text-[8px] font-extrabold text-indigo-500 uppercase tracking-wider block">Clinical (/C)</span>
                <span className="text-xs font-black text-indigo-700 font-mono block mt-0.5">
                  {items.filter(itm => itm.MedicineType === 'C').length}
                </span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl">
                <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-wider block">Patent (/P)</span>
                <span className="text-xs font-black text-emerald-700 font-mono block mt-0.5">
                  {items.filter(itm => itm.MedicineType !== 'C').length}
                </span>
              </div>
            </div>

            {/* Scrollable Grid View */}
            <div className="flex-1 overflow-x-auto max-h-[420px] border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xxs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] text-slate-400 font-black uppercase tracking-wider">
                    <th className="px-3 py-2">Item ID</th>
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Cost (Rs.)</th>
                    <th className="px-3 py-2 text-right">Retail (Rs.)</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.filter((itm) => {
                    if (!invSearchQuery.trim()) return true;
                    const query = invSearchQuery.toLowerCase();
                    return (
                      itm.ItemID.toLowerCase().includes(query) ||
                      itm.ItemName.toLowerCase().includes(query) ||
                      (itm.Unit || '').toLowerCase().includes(query)
                    );
                  }).map((itm, idx) => {
                    const isLowStock = itm.CStock <= (itm.MinStock || 10);
                    const isClinical = itm.MedicineType === 'C';
                    return (
                      <tr key={`${itm.ItemID}-${idx}`} className={`hover:bg-slate-50 transition ${editingItem?.ItemID === itm.ItemID ? 'bg-indigo-50/40' : ''}`}>
                        <td className="px-3 py-2.5 font-mono text-slate-600 font-bold">{itm.ItemID}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{itm.ItemName}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-semibold">{itm.Unit}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${
                            isClinical 
                              ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' 
                              : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                          }`}>
                            {isClinical ? 'Clinical' : 'Patent'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-500">Rs. {itm.PurchasePrice.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">Rs. {itm.Price.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-mono font-black px-1.5 py-0.5 rounded ${
                            isLowStock 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-slate-100 text-slate-900 border border-slate-150'
                          }`}>
                            {itm.CStock}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex justify-center items-center space-x-1">
                            <button
                              onClick={() => handleSelectEditItem(itm)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="Edit Medicine Parameter"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(itm.ItemID, itm.ItemName)}
                              disabled={!canAdd}
                              className={`p-1 rounded transition cursor-pointer ${
                                canAdd ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-300 cursor-not-allowed'
                              }`}
                              title="Remove from Inventory"
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
          </div>

        </div>
      )}

      {/* Clinic Medicine Label Printer Tab */}
      {activeSubTab === 'clinical_labels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-clinical-labels-tab">
          
          {/* Left Column: Patients & Visits List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center border-b border-slate-100 pb-2">
              <Search className="w-4 h-4 text-indigo-600 mr-2" />
              Patient & Visit Selection
            </h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Patient Name or ID..."
                value={labelSearchQuery}
                onChange={(e) => setLabelSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Patients List with Clinical Prescriptions */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Patients with Clinical compounding prescriptions
              </span>
              {(() => {
                const clinicalPatients = patients.filter(p => {
                  const pVisits = visits.filter(v => v.PatientID === p.PatientID);
                  const searchLower = labelSearchQuery.toLowerCase();
                  const matchesSearch = String(p.PatientName || '').toLowerCase().includes(searchLower) || String(p.PatientID || '').toLowerCase().includes(searchLower);
                  
                  if (labelSearchQuery.trim()) {
                    return matchesSearch;
                  }
                  
                  return pVisits.some(v => 
                    getVisitMedicinesList(v).some(vm => vm.MedicineType === 'C')
                  );
                });

                if (clinicalPatients.length === 0) {
                  return (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border border-dashed rounded-lg italic">
                      No matching patients found.
                    </div>
                  );
                }

                return clinicalPatients.map(p => {
                  const hasClinical = visits.filter(v => v.PatientID === p.PatientID).some(v => 
                    getVisitMedicinesList(v).some(vm => vm.MedicineType === 'C')
                  );

                  return (
                    <button
                      key={p.PatientID}
                      onClick={() => {
                        setLabelPatientId(p.PatientID);
                        // Auto-select latest visit if available
                        const pVisits = visits
                          .filter(v => v.PatientID === p.PatientID)
                          .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));
                        if (pVisits.length > 0) {
                          setLabelVisitId(pVisits[0].VisitID);
                        } else {
                          setLabelVisitId('');
                        }
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition cursor-pointer flex justify-between items-center ${
                        labelPatientId === p.PatientID
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold uppercase truncate">{p.PatientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">ID: {p.PatientID} • {p.AgeYears}Y • {p.Sex}</p>
                      </div>
                      {hasClinical && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 font-mono">
                          Clinical
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Visits List */}
            {labelPatientId && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Consultation Visit Date:
                </span>
                {(() => {
                  const pVisits = visits
                    .filter((v) => v.PatientID === labelPatientId)
                    .sort((a, b) => b.VisitDate.localeCompare(a.VisitDate));

                  if (pVisits.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic">No visit history found.</p>
                    );
                  }

                  return (
                    <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                      {pVisits.map((v) => {
                        const hasCompounding = getVisitMedicinesList(v).some(
                          (vm) => vm.MedicineType === 'C'
                        );
                        return (
                          <button
                            key={v.VisitID}
                            onClick={() => setLabelVisitId(v.VisitID)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer flex justify-between items-center ${
                              labelVisitId === v.VisitID
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10 font-bold'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold">{v.VisitDate}</p>
                              <p className="text-[9px] opacity-70 font-mono leading-none mt-0.5 truncate">Visit ID: {v.VisitID}</p>
                            </div>
                            {hasCompounding && (
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded shrink-0 font-mono ${
                                labelVisitId === v.VisitID
                                  ? 'bg-indigo-800 text-indigo-100'
                                  : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                              }`}>
                                🧪 Compounded
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* Right Column: Prescribed Clinical Medicines Label Configuration & Live Sticker Preview */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            
            {/* Header with Print-All option */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Tag className="w-4 h-4 text-indigo-600 mr-2" />
                Prescribed Clinical Compounding Medicines
              </h3>
              {(() => {
                const pat = patients.find(p => p.PatientID === labelPatientId);
                const vis = visits.find(v => v.VisitID === labelVisitId);
                const cMeds = getVisitMedicinesList(vis || null).filter(vm => vm.MedicineType === 'C');
                
                if (pat && vis && cMeds.length > 0) {
                  return (
                    <button
                      onClick={() => {
                        const labelsToPrint = cMeds.map(m => {
                          const matchedItem = items.find(i => i.ItemID === m.ItemID);
                          const name = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                          const instructions = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                          const notes = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                          const qty = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                          const expiry = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");
                          
                          return { name, instructions, notes, qty, expiry };
                        });

                        setLabelPrintData({
                          patientName: pat.PatientName,
                          patientAge: String(pat.AgeYears),
                          patientSex: pat.Sex,
                          visitDate: vis.VisitDate,
                          visitId: vis.VisitID,
                          medicines: labelsToPrint
                        });
                        setIsLabelPrintModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg flex items-center shadow-md shadow-indigo-600/10 self-start cursor-pointer transition"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print All ({cMeds.length}) Labels for This Visit
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Medicines List */}
            {(() => {
              if (!labelPatientId || !labelVisitId) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs">
                    Please select a Patient and a Visit Date from the left panel to load clinical compounding medicines.
                  </div>
                );
              }

              const pat = patients.find(p => p.PatientID === labelPatientId);
              const vis = visits.find(v => v.VisitID === labelVisitId);
              const clinicalMeds = getVisitMedicinesList(vis || null).filter(
                (vm) => vm.MedicineType === 'C'
              );

              if (clinicalMeds.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-400 italic text-xs bg-slate-50 border border-dashed rounded-xl">
                    No clinical compounding medicines (Type C) found in this visit. Only clinical compounded formula medicines require custom sticker label printing.
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  
                  {/* Selected Patient Mini Header */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-wrap justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Patient Name</span>
                      <span className="font-extrabold text-slate-900 uppercase">{pat?.PatientName}</span>
                      <span className="text-slate-500 block text-[10px]">ID: {pat?.PatientID} • {pat?.AgeYears} Years • {pat?.Sex}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Prescribed Date</span>
                      <span className="font-mono text-slate-800 font-bold">{vis?.VisitDate}</span>
                      <span className="text-[10px] text-indigo-600 font-bold block">Visit ID: {vis?.VisitID}</span>
                    </div>
                  </div>

                  {/* Individual Med Label Customizer & Preview Grid */}
                  <div className="space-y-6">
                    {clinicalMeds.map((m, idx) => {
                      const matchedItem = items.find((i) => i.ItemID === m.ItemID);
                      const medicineName = matchedItem ? matchedItem.ItemName : m.MedicineDetail;
                      
                      // Fallback-safe customized label state
                      const instructionsValue = customLabelStates[m.ItemID]?.instructions ?? m.Dosage;
                      const notesValue = customLabelStates[m.ItemID]?.notes ?? "Take as directed by the physician.";
                      const qtyValue = customLabelStates[m.ItemID]?.qty ?? String(m.Qty || 30);
                      const expiryValue = customLabelStates[m.ItemID]?.expiry ?? (m.ExpireDate || "No Expiry Specified");

                      const updateLabelState = (key: 'instructions' | 'notes' | 'qty' | 'expiry', val: string) => {
                        setCustomLabelStates(prev => {
                          const existing = prev[m.ItemID] || {
                            instructions: m.Dosage,
                            notes: "Take as directed by the physician.",
                            qty: String(m.Qty || 30),
                            expiry: m.ExpireDate || ""
                          };
                          return {
                            ...prev,
                            [m.ItemID]: {
                              ...existing,
                              [key]: val
                            }
                          };
                        });
                      };

                      return (
                        <div key={`${m.ItemID}-${idx}`} className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl flex flex-col xl:flex-row gap-5">
                          
                          {/* Label Settings/Configuration Panel */}
                          <div className="flex-1 space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                              <span className="font-extrabold text-slate-900 uppercase text-xs truncate max-w-[200px]">
                                {medicineName}
                              </span>
                              <span className="text-[8px] font-black bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded text-indigo-700 uppercase tracking-wider">
                                Clinical Compounded
                              </span>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Usage Instructions (Dosage)
                                </label>
                                <textarea
                                  rows={2}
                                  value={instructionsValue}
                                  onChange={(e) => updateLabelState('instructions', e.target.value)}
                                  placeholder="e.g. 1-0-1 (Take one tab morning and night)"
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Prescribed Quantity
                                </label>
                                <input
                                  type="text"
                                  value={qtyValue}
                                  onChange={(e) => updateLabelState('qty', e.target.value)}
                                  placeholder="e.g. 30 Tabs"
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Sticker Expiry Date
                                </label>
                                <input
                                  type="text"
                                  value={expiryValue}
                                  onChange={(e) => updateLabelState('expiry', e.target.value)}
                                  placeholder="e.g. 2026-08-11"
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white font-mono"
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                  Special Warnings / Notes
                                </label>
                                <input
                                  type="text"
                                  value={notesValue}
                                  onChange={(e) => updateLabelState('notes', e.target.value)}
                                  placeholder="e.g. Keep in a cool dry place, shake well"
                                  className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Live Sticker Preview Panel - 4" x 8" Roller Sticker Format */}
                          <div className="w-full xl:w-[280px] shrink-0 flex flex-col justify-between bg-white border-2 border-slate-300 rounded-xl shadow-xs relative overflow-hidden min-h-[360px] p-4 text-slate-900">
                            
                            {/* Clinic Header */}
                            <div className="text-center border-b border-slate-200 pb-2">
                              <span className="font-black text-xs text-slate-900 uppercase block tracking-tight">
                                PUNJAB HOMEOPATHIC CLINIC
                              </span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                                Clinical Medicine Label (4" x 8" Roll)
                              </span>
                            </div>

                            {/* Patient Info Bar */}
                            <div className="my-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] space-y-1">
                              <div className="flex justify-between font-extrabold text-slate-900">
                                <span className="truncate uppercase">PATIENT: {pat?.PatientName}</span>
                                <span className="font-mono text-[9px] shrink-0 ml-1">{pat?.AgeYears}Y • {pat?.Sex[0]}</span>
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                                <span>DATE: {vis?.VisitDate}</span>
                                <span>VISIT: {vis?.VisitID.slice(-4)}</span>
                              </div>
                            </div>

                            {/* Dedicated Usage of Clinical Medicine Section */}
                            <div className="border-2 border-slate-900 bg-slate-50 rounded-xl p-3 text-center my-1.5 flex-1 flex flex-col justify-center">
                              <span className="inline-block text-[8px] font-black text-slate-950 uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded mb-1.5">
                                USAGE OF CLINICAL MEDICINE
                              </span>
                              <span className="block font-extrabold text-[11px] text-slate-700 uppercase mb-1">
                                {medicineName}
                              </span>
                              <p className="text-xs font-black text-slate-950 uppercase leading-snug break-words tracking-tight py-1">
                                {instructionsValue || "10 DROPS 3 TIMES A DAY IN WATER BEFORE MEALS"}
                              </p>
                              {notesValue && (
                                <p className="text-[8px] font-bold text-slate-600 mt-1 italic border-t border-slate-200 pt-1">
                                  Note: {notesValue}
                                </p>
                              )}
                            </div>

                            {/* Expiry & Quantity Footer */}
                            <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-800 pt-2 border-t border-slate-200">
                              <span>QTY: {qtyValue}</span>
                              <span className="font-mono text-slate-900">EXP: {expiryValue || "N/A"}</span>
                            </div>

                            {/* Print Trigger Button */}
                            <div className="mt-3 pt-2 border-t border-slate-200">
                              <button
                                onClick={() => {
                                  setLabelPrintData({
                                    patientName: pat?.PatientName || "Unknown",
                                    patientAge: String(pat?.AgeYears || ""),
                                    patientSex: pat?.Sex || "Male",
                                    visitDate: vis?.VisitDate || "",
                                    visitId: vis?.VisitID || "",
                                    medicines: [{
                                      name: medicineName,
                                      instructions: instructionsValue,
                                      notes: notesValue,
                                      qty: qtyValue,
                                      expiry: expiryValue
                                    }]
                                  });
                                  setIsLabelPrintModalOpen(true);
                                }}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer"
                              >
                                <Printer className="w-3 h-3 mr-1" />
                                Print Label (4" x 8" Roll)
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* Clinical Medicine Sticker Label Print-Preview Modal Overlay */}
      {isLabelPrintModalOpen && labelPrintData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none animate-fadeIn">
            
            {/* Dynamic Sticker Print Style Injector */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: 4in 8in;
                  margin: 0;
                }
                body * {
                  visibility: hidden !important;
                }
                #sticker-print-container, #sticker-print-container * {
                  visibility: visible !important;
                }
                #sticker-print-container {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .label-sticker-page {
                  width: 4in !important;
                  height: 8in !important;
                  padding: 0.25in !important;
                  margin: 0 auto 0.4in auto !important;
                  border: 2px dashed #000000 !important;
                  border-radius: 8px !important;
                  box-sizing: border-box !important;
                  page-break-after: always !important;
                  page-break-inside: avoid !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  background-color: #ffffff !important;
                  color: #000000 !important;
                }
                .label-sticker-page:last-child {
                  page-break-after: avoid !important;
                  margin-bottom: 0 !important;
                }
              }
            ` }} />

            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-t-2xl print:hidden shrink-0">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Clinical Medicine Label Sticker Printer</span>
                  <span className="text-xxs text-slate-500 font-semibold">Configured for 4" Width x 8" Height Sticker Label Roller Printer</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCleanLabelPrint('4x8')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded-lg flex items-center shadow-md transition cursor-pointer"
                  title="Open clean printable sticker tab auto-fitted to 4 inch width x 8 inch height label roller paper"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Label (4" W x 8" H Roll)
                </button>
                <button
                  type="button"
                  onClick={() => handleCleanLabelPrint('8x5')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xxs rounded-lg border border-slate-300 transition cursor-pointer"
                  title="Alternative 8x5 inch wide paper"
                >
                  Print (8" x 5")
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLabelPrintModalOpen(false);
                    setLabelPrintData(null);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white" id="sticker-print-container">
              {labelPrintData.medicines.map((med, idx) => (
                <div key={idx} className="label-sticker-page bg-white border-2 border-slate-800 rounded-xl shadow-sm max-w-[4in] w-full min-h-[7.8in] mx-auto my-4 p-5 flex flex-col justify-between overflow-hidden text-slate-900">
                  
                  {/* Clinic Header */}
                  <div className="text-center border-b-2 border-slate-900 pb-3">
                    <h2 className="font-black text-base text-slate-950 uppercase tracking-tight">PUNJAB HOMEOPATHIC CLINIC</h2>
                    <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mt-0.5">10-Shalimar Road, Garhi Shahu Lahore • Tel: 042-36302450</p>
                  </div>

                  {/* Patient Meta Block */}
                  <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 my-2 space-y-1 text-xs">
                    <div className="flex justify-between font-black text-slate-950">
                      <span>PATIENT: <strong className="uppercase">{labelPrintData.patientName}</strong></span>
                      <span className="font-mono text-xs">{labelPrintData.patientAge}Y • {labelPrintData.patientSex[0]}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-mono font-bold">
                      <span>DATE: {labelPrintData.visitDate}</span>
                      <span>VISIT ID: {labelPrintData.visitId}</span>
                    </div>
                  </div>

                  {/* Prominent Clinical Medicine Usage Block */}
                  <div className="border-2 border-slate-950 bg-slate-50/80 rounded-xl p-4 text-center my-3 flex-1 flex flex-col justify-center space-y-3">
                    <div className="bg-slate-950 text-white font-black text-xs uppercase tracking-widest py-1 px-3 rounded-md mx-auto inline-block">
                      USAGE OF CLINICAL MEDICINE
                    </div>

                    <div>
                      <span className="text-xxs font-extrabold text-slate-500 uppercase tracking-wider block">Prescribed Medicine</span>
                      <p className="text-sm font-black text-slate-900 uppercase leading-snug">{med.name}</p>
                    </div>

                    <div className="border-t border-b border-slate-300 py-3 my-1">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block mb-1">DIRECTIONS / DOSAGE INSTRUCTIONS</span>
                      <p className="text-lg font-black text-slate-950 uppercase leading-tight tracking-tight break-words">
                        {med.instructions || "10 DROPS 3 TIMES A DAY IN WATER BEFORE MEALS"}
                      </p>
                    </div>

                    {med.notes && (
                      <div className="text-xxs font-extrabold text-slate-700 italic">
                        Special Note: {med.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="border-t-2 border-slate-900 pt-3 space-y-1">
                    <div className="flex justify-between items-center text-xs font-black text-slate-900">
                      <span>QTY PRESCRIBED: {med.qty}</span>
                      <span className="font-mono text-xs text-red-700 font-black">EXP DATE: {med.expiry}</span>
                    </div>
                    <div className="text-center text-[9px] font-bold text-slate-500 uppercase tracking-wider pt-1">
                      Prescribed by Dr. Ejaz Ahmad • Punjab Homeopathic Clinic Lahore
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Pharmacy Invoice Print-Preview Modal Overlay */}
      {printModalOpen && printBillData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
            
            {/* Fail-safe Dynamic Print Style Injector */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-pharmacy-bill, #printable-pharmacy-bill * {
                  visibility: visible !important;
                }
                #printable-pharmacy-bill {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 1.5rem !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            ` }} />

            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 rounded-t-2xl print:hidden shrink-0">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Pharmacy Cash Receipt</span>
                  <span className="text-xxs text-slate-500 font-semibold">Verify details and print computer-generated invoice</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xxs rounded-lg flex items-center shadow-md transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintModalOpen(false);
                    setPrintBillData(null);
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div className="flex-1 overflow-y-auto p-6" id="printable-pharmacy-bill">
              <div className="space-y-4 font-sans text-xs text-slate-800">
                
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-200 pb-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    {clinicSettings?.ClinicName || "PUNJAB CLINIC"}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Phone: {clinicSettings?.PhoneNo || "042-3111222"}
                  </p>
                  <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded-full text-xxs font-extrabold uppercase text-slate-700 tracking-wider">
                    PHARMACY CASH RECEIPT
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xxs border-b border-slate-100 pb-3 font-semibold text-slate-600">
                  <div>
                    <span className="text-slate-400 block font-normal uppercase">Invoice No:</span>
                    <strong className="text-slate-900 font-mono font-bold text-xs">{printBillData.invoiceNo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal uppercase">Date:</span>
                    <strong className="text-slate-900">{printBillData.invoiceDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal uppercase">Patient Customer:</span>
                    <strong className="text-slate-900 text-xs">
                      {printBillData.patient ? printBillData.patient.PatientName : "Walk-in Guest"}
                    </strong>
                    {printBillData.patient && (
                      <span className="text-[10px] text-slate-400 font-mono block">ID: {printBillData.patient.PatientID}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal uppercase">Operational Shift:</span>
                    <strong className="text-slate-900">
                      {printBillData.shift === 1 ? "Morning Shift (1)" : "Evening Shift (2)"}
                    </strong>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2.5">
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Billed Item Details</span>
                  <div className="space-y-1.5 divide-y divide-slate-100">
                    {printBillData.basket.map((b, idx) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      const isClinical = b.Price === 0 || b.MedicineType === 'C' || item?.MedicineType === 'C';
                      const pVisits = printBillData.patient 
                        ? visits.filter(v => v.PatientID === printBillData.patient.PatientID)
                        : [];
                      const latestPVisit = pVisits.length > 0 
                        ? pVisits[pVisits.length - 1]
                        : null;
                      const clinicalPayment = latestPVisit?.ClinicalMedicinePayment 
                        ? Number(latestPVisit.ClinicalMedicinePayment)
                        : 0;

                      return (
                        <div key={idx} className="flex justify-between items-start pt-1.5 first:pt-0 font-medium text-slate-700">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 text-xxs">{item ? item.ItemName : b.ItemID}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {isClinical ? (
                                <span className="text-emerald-600 font-bold">Clinical Medicine (Already paid to Doctor for Clinical Medicine)</span>
                              ) : (
                                `${b.Qty} unit(s) x Rs. ${b.Price.toFixed(1)}`
                              )}
                            </p>
                          </div>
                          <span className="font-mono text-slate-900 font-bold">
                            {isClinical ? (
                              <span className="text-emerald-600 font-bold">Rs. {clinicalPayment.toLocaleString()}</span>
                            ) : (
                              `Rs. ${(b.Qty * b.Price).toLocaleString()}`
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="border-t border-dashed border-slate-200 pt-3 mt-4 space-y-1.5 text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-xxs font-bold text-slate-400 uppercase">Gross Amount:</span>
                    <span className="font-mono text-slate-900">
                      Rs. {printBillData.basket.reduce((sum, item) => sum + item.Qty * item.Price, 0).toLocaleString()}
                    </span>
                  </div>
                  {printBillData.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-xxs font-bold uppercase">Discount Given:</span>
                      <span className="font-mono">- Rs. {printBillData.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                    <span className="font-bold text-slate-900 uppercase text-xxs">Net Amount Paid:</span>
                    <strong className="text-base font-extrabold text-emerald-600 font-mono">
                      Rs. {printBillData.netAmount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Footer and Signature block */}
                <div className="text-center pt-8 border-t border-slate-100 mt-6 space-y-4">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-4">
                    <div className="text-center">
                      <div className="h-8 border-b border-slate-200 w-24 mx-auto" />
                      <span className="mt-1 block">Duty Pharmacist</span>
                    </div>
                    <div className="text-center">
                      <div className="h-8 border-b border-slate-200 w-24 mx-auto" />
                      <span className="mt-1 block">Customer Copy</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Thank you for choosing PHC Clinic Pharmacy. Get well soon!
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic Vendor Directory & Grid-View Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans" id="vendor-directory-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Supplier & Vendor Registry</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Manage and register active pharmaceutical supply partners</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Split layout */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form to Add/Edit (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    {editingSupplier ? '✏️ Modify Vendor Specifications' : '➕ Register New Vendor'}
                  </h4>
                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition uppercase"
                    >
                      New Vendor
                    </button>
                  )}
                </div>

                {vendorSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xxs font-bold rounded-lg">
                    ✅ {vendorSuccessMsg}
                  </div>
                )}

                {vendorErrorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xxs font-bold rounded-lg">
                    ⚠️ {vendorErrorMsg}
                  </div>
                )}

                <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor/Supplier ID</label>
                    <input
                      type="text"
                      placeholder="e.g. SUP-005 (Auto-generated if empty)"
                      disabled={!!editingSupplier}
                      value={supplierFormId}
                      onChange={(e) => setSupplierFormId(e.target.value)}
                      className={`mt-1 w-full text-xs border rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono ${
                        editingSupplier ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-bold' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Novartis Pakistan"
                      value={supplierFormName}
                      onChange={(e) => setSupplierFormName(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 042-35112233"
                      value={supplierFormPhone}
                      onChange={(e) => setSupplierFormPhone(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-slate-500 uppercase">Corporate Address</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Plot 43-B, Industrial Area, Lahore"
                      value={supplierFormAddress}
                      onChange={(e) => setSupplierFormAddress(e.target.value)}
                      className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-emerald-600/10 transition text-xs cursor-pointer"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                  </button>

                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition text-xs cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </form>
              </div>

              {/* Right Column: Interactive Grid View (7 cols) */}
              <div className="md:col-span-7 flex flex-col h-[420px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Supplier Directory Grid-View ({suppliers.length})
                </h4>
                
                <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150 z-10">
                      <tr className="text-slate-400 uppercase text-xxs font-bold">
                        <th className="p-3">ID</th>
                        <th className="p-3">Vendor Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                            No vendors registered in directory.
                          </td>
                        </tr>
                      ) : (
                        suppliers.map((sup) => (
                          <tr key={sup.SID} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-xxs font-bold text-slate-400">{sup.SID}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block text-xs">{sup.SupplierName}</span>
                              <span className="text-[10px] text-slate-400 block max-w-xs truncate font-normal" title={sup.Address}>
                                {sup.Address || 'No Address'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600 text-[11px]">{sup.Phone || 'N/A'}</td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSelectEditSupplier(sup)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(sup.SID)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsVendorModalOpen(false);
                  resetSupplierForm();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Close Directory
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Pop-up modal for Patent Sourcing Decision */}
      {showPatentSourcingModal && selectedPatientId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-fadeIn font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleIn">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Patent Sourcing Selection</h3>
                <p className="text-xxs text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">
                  Patient ID: {selectedPatientId} • {patients.find(p => p.PatientID === selectedPatientId)?.PatientName}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please decide the sourcing logistics for any prescribed <strong className="text-slate-900">patent (brand-name) medicines</strong> for this patient.
              </p>

              <div className="grid grid-cols-1 gap-3 pt-1">
                {/* Option A: Clinic Stock */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Clinic');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Clinic';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Clinic'
                      ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Clinic' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Clinic' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Clinic Stock (Clinic Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Sourced and billed directly inside Punjab Health Clinic terminal.</span>
                  </div>
                </button>

                {/* Option B: Outside Rx */}
                <button
                  type="button"
                  onClick={() => {
                    setPatientSourcingOption('Outside');
                    // Modify the visit object directly in-place so all downstream modules update dynamically
                    if (latestVisit) {
                      latestVisit.PatentPaymentOption = 'Outside';
                    }
                    setShowPatentSourcingModal(false);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition duration-150 cursor-pointer ${
                    patientSourcingOption === 'Outside'
                      ? 'border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    patientSourcingOption === 'Outside' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {patientSourcingOption === 'Outside' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Outside Rx (External Sourced)</span>
                    <span className="block text-xxs text-slate-500 mt-0.5">Patent medicines are bought externally. Do not bill them here.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xxs font-bold text-slate-400 uppercase tracking-widest">
              <span>Selected: {patientSourcingOption === 'Clinic' ? 'Clinic Stock' : 'Outside Rx'}</span>
              <button
                type="button"
                onClick={() => setShowPatentSourcingModal(false)}
                className="px-4 py-2 bg-slate-950 text-white hover:bg-slate-800 text-xxs font-black uppercase rounded-lg transition"
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up modal to Select Medicine Category & Print Low Stock Report */}
      {isLowStockReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn font-sans print:absolute print:inset-0 print:bg-white print:p-0" id="low-stock-report-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:border-0 print:max-h-full print:w-full print:rounded-none">
            
            {/* Dynamic Print Style Injector for Low Stock Report */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-low-stock-report, #printable-low-stock-report * {
                  visibility: visible !important;
                }
                #printable-low-stock-report {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 1.5rem !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            ` }} />

            {/* Modal Header (Hidden during Print) */}
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 shrink-0 print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Generate Low Stock Report</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Select a medicine category to filter and print current critical stocks</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLowStockReportModalOpen(false);
                  setSelectedReportCategory('ALL');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Selection Screen (Hidden during Print) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 print:hidden">
              {/* Category Dropdown Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wide">
                  Select Medicine Category
                </label>
                <select
                  value={selectedReportCategory}
                  onChange={(e) => setSelectedReportCategory(e.target.value as 'ALL' | 'C' | 'P')}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 focus:ring-1 focus:ring-rose-500 focus:outline-none font-bold text-slate-800"
                >
                  <option value="ALL">All Pharmaceutical Categories (Clinical & Patent)</option>
                  <option value="P">Patent Medicine Only (/P)</option>
                  <option value="C">Clinical Compounding Only (/C)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
                  Only medicines with current stock level less than or equal to their configured minimum alert threshold will be included in the print layout.
                </p>
              </div>

              {/* Real-time Preview in Pop-up */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                    Report Preview ({items.filter(itm => {
                      const isLow = itm.CStock <= (itm.MinStock || 10);
                      if (!isLow) return false;
                      if (selectedReportCategory === 'ALL') return true;
                      if (selectedReportCategory === 'C') return itm.MedicineType === 'C';
                      if (selectedReportCategory === 'P') return itm.MedicineType !== 'C';
                      return true;
                    }).length} items found)
                  </h4>
                  <span className="text-xxs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    Below Threshold
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto bg-slate-50/50">
                  <table className="w-full text-left text-xxs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="p-2.5">Item ID</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Min Qty</th>
                        <th className="p-2.5 text-right text-rose-700">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-700 bg-white">
                      {items.filter(itm => {
                        const isLow = itm.CStock <= (itm.MinStock || 10);
                        if (!isLow) return false;
                        if (selectedReportCategory === 'ALL') return true;
                        if (selectedReportCategory === 'C') return itm.MedicineType === 'C';
                        if (selectedReportCategory === 'P') return itm.MedicineType !== 'C';
                        return true;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold bg-white">
                            🎉 Excellent! No items are currently low on stock in this category.
                          </td>
                        </tr>
                      ) : (
                        items.filter(itm => {
                          const isLow = itm.CStock <= (itm.MinStock || 10);
                          if (!isLow) return false;
                          if (selectedReportCategory === 'ALL') return true;
                          if (selectedReportCategory === 'C') return itm.MedicineType === 'C';
                          if (selectedReportCategory === 'P') return itm.MedicineType !== 'C';
                          return true;
                        }).map((itm, idx) => (
                          <tr key={`${itm.ItemID}-${idx}`} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-mono font-bold text-slate-400">{itm.ItemID}</td>
                            <td className="p-2.5 font-bold text-slate-900">{itm.ItemName}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                itm.MedicineType === 'C'
                                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                              }`}>
                                {itm.MedicineType === 'C' ? 'Clinical' : 'Patent'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500 font-semibold">{itm.MinStock || 10} {itm.Unit}s</td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600 bg-rose-50/30">{itm.CStock} {itm.Unit}s</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer (Hidden during Print) */}
            <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end space-x-2 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setIsLowStockReportModalOpen(false);
                  setSelectedReportCategory('ALL');
                }}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Close Panel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                disabled={items.filter(itm => {
                  const isLow = itm.CStock <= (itm.MinStock || 10);
                  if (!isLow) return false;
                  if (selectedReportCategory === 'ALL') return true;
                  if (selectedReportCategory === 'C') return itm.MedicineType === 'C';
                  if (selectedReportCategory === 'P') return itm.MedicineType !== 'C';
                  return true;
                }).length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-md hover:shadow-rose-600/10 transition flex items-center justify-center cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                <span>Print Stock Report</span>
              </button>
            </div>

            {/* Absolute Hidden-on-screen, Visible-on-print Layout Container */}
            <div className="hidden print:block p-8 font-sans text-xs text-slate-900 bg-white" id="printable-low-stock-report">
              <div className="space-y-6">
                
                {/* Clinic Header Block */}
                <div className="text-center border-b border-slate-300 pb-5">
                  <h1 className="text-lg font-black uppercase tracking-wide text-slate-950">
                    {clinicSettings?.ClinicName || "PUNJAB CLINIC"}
                  </h1>
                  <p className="text-xxs text-slate-600 font-semibold mt-0.5">
                    {clinicSettings?.Address || "Opposite State Bank, Mall Road, Lahore"}
                  </p>
                  <p className="text-xxs text-slate-600 font-semibold">
                    Phone: {clinicSettings?.PhoneNo || "042-3111222"}
                  </p>
                  
                  <div className="mt-4 inline-block border-2 border-slate-900 bg-slate-50 px-5 py-1.5 rounded-none text-xs font-black uppercase text-slate-900 tracking-widest font-mono">
                    PHARMACY LOW STOCK SHORTAGE REPORT
                  </div>
                </div>

                {/* Report Metadata Block */}
                <div className="grid grid-cols-2 gap-4 text-xxs font-semibold border-b border-slate-200 pb-4 text-slate-700">
                  <div>
                    <span className="text-slate-400 block font-normal uppercase tracking-wider">Report Category:</span>
                    <strong className="text-slate-900 text-[11px] uppercase">
                      {selectedReportCategory === 'ALL' && "All Pharmaceutical Items"}
                      {selectedReportCategory === 'C' && "Clinical Compounding (/C) Only"}
                      {selectedReportCategory === 'P' && "Patent Medicines (/P) Only"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal uppercase tracking-wider">Date & Time Generated:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">
                      {new Date().toLocaleString()} (PKT)
                    </strong>
                  </div>
                </div>

                {/* Main Items Listing Table */}
                <div className="space-y-3">
                  <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-widest">
                    Items Identified Below Safety Levels
                  </h3>
                  
                  <table className="w-full text-left text-xxs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 uppercase font-bold">
                        <th className="p-2 border-r border-slate-300 text-center w-12">S.No</th>
                        <th className="p-2 border-r border-slate-300 w-24">Item ID</th>
                        <th className="p-2 border-r border-slate-300">Medicine Name</th>
                        <th className="p-2 border-r border-slate-300 w-24">Category</th>
                        <th className="p-2 border-r border-slate-300 text-right w-24">Min Threshold</th>
                        <th className="p-2 text-right w-24 text-rose-700 font-bold">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-semibold text-slate-800">
                      {items.filter(itm => {
                        const isLow = itm.CStock <= (itm.MinStock || 10);
                        if (!isLow) return false;
                        if (selectedReportCategory === 'ALL') return true;
                        if (selectedReportCategory === 'C') return itm.MedicineType === 'C';
                        if (selectedReportCategory === 'P') return itm.MedicineType !== 'C';
                        return true;
                      }).map((itm, idx) => {
                        const isClinical = itm.MedicineType === 'C';
                        return (
                          <tr key={`${itm.ItemID}-${idx}`} className="bg-white">
                            <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-300 font-mono font-bold text-slate-600">{itm.ItemID}</td>
                            <td className="p-2 border-r border-slate-300 font-bold">{itm.ItemName}</td>
                            <td className="p-2 border-r border-slate-300 uppercase font-mono">
                              {isClinical ? "Clinical" : "Patent"}
                            </td>
                            <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-600">
                              {itm.MinStock || 10} {itm.Unit || 'Tab'}s
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-rose-700 bg-rose-50/20">
                              {itm.CStock} {itm.Unit || 'Tab'}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Audit Safety Warning Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-none text-[9px] text-slate-600 font-medium italic mt-8">
                  * Note: This document is an official real-time stock discrepancy summary generated directly from the Clinic Pharmacy ERP system. Items listed have crossed below their safety minimum stock thresholds and require urgent procurement inward GRN to prevent out-of-stock medical service disruption.
                </div>

                {/* Institutional Authorization Signatures Block */}
                <div className="grid grid-cols-3 gap-8 pt-16 text-center text-xxs font-bold text-slate-700">
                  <div className="border-t border-dashed border-slate-400 pt-3">
                    <p className="text-slate-900">PREPARED BY</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Pharmacy In-charge</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-3">
                    <p className="text-slate-900">VERIFIED BY</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Operations Auditor</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-3">
                    <p className="text-slate-900">AUTHORIZED CLINICAL SIGNATURE</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1">Medical Director</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
