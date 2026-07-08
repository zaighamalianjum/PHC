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
  History
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
  suppliers: Supplier[];
  invoices: InvoiceHeader[];
  invoiceDetails: InvoiceDetail[];
  onAddInvoice: (inv: InvoiceHeader, details: InvoiceDetail[]) => void;
  onAddSalesReturn: (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => void;
  grns: InvVchHeader[];
  grnDetails: InvVchDetail[];
  onAddGRN: (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => void;
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
  suppliers,
  invoices,
  invoiceDetails,
  onAddInvoice,
  onAddSalesReturn,
  grns,
  grnDetails,
  onAddGRN,
  userRights,
  visits,
  visitMedicines,
  appointments = [],
  tokens = [],
  clinicSettings
}: PharmacyPOSProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'return' | 'grn'>('checkout');

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

  // Rights verification
  const currentRight = userRights.find((r) => r.MenuID === 'pharmacy');
  const canAdd = currentRight ? currentRight.AddRec : false;
  const canPost = currentRight ? currentRight.PostRec : false;

  // Active Billing Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billingShift, setBillingShift] = useState<1 | 2>(1);
  const [discountInput, setDiscountInput] = useState<number>(0);
  
  // Basket list of checkout items
  const [checkoutBasket, setCheckoutBasket] = useState<{ ItemID: string; Qty: number; Price: number; MedicineType?: 'C' | 'P' | 'S' }[]>([]);
  // Row scratchpad inputs
  const [rowItemId, setRowItemId] = useState('');
  const [rowQty, setRowQty] = useState<number>(1);
  const [stockValidationError, setStockValidationError] = useState('');

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
    return hasVisit || hasVisitedAppt || hasVisitedToken;
  });

  // Load the prescribed medicines for the selected patient
  const selectedPatientVisits = visits.filter((v) => v.PatientID === selectedPatientId);
  const latestVisit = selectedPatientVisits.length > 0 ? selectedPatientVisits[selectedPatientVisits.length - 1] : null;
  const prescribedMedicinesList = latestVisit 
    ? visitMedicines.filter((vm) => vm.VisitID === latestVisit.VisitID)
    : [];

  // Add individual prescribed item to the basket
  const handleAddPrescribedToBasket = (prescription: VisitMedicine) => {
    const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
    if (!selectedItem) {
      alert(`Medicine ID ${prescription.ItemID} not found in the inventory system.`);
      return;
    }

    // Verify stock
    const existingBasketQty = checkoutBasket.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
    const qtyToAdd = 1; // Default: dispense 1 unit (or could be custom dosage)
    const totalRequired = existingBasketQty + qtyToAdd;

    if (totalRequired > selectedItem.CStock) {
      setStockValidationError(
        `Critical Alert: Insufficient stock for ${selectedItem.ItemName}. Current stock is only ${selectedItem.CStock} ${selectedItem.Unit}s.`
      );
      return;
    }

    setStockValidationError('');

    const existsIndex = checkoutBasket.findIndex((b) => b.ItemID === prescription.ItemID);
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += qtyToAdd;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: prescription.ItemID, Qty: qtyToAdd, Price: selectedItem.Price, MedicineType: prescription.MedicineType || 'S' }
      ]);
    }
  };

  // Add all prescribed items to basket at once
  const handleAddAllPrescribedToBasket = (prescribedList: VisitMedicine[]) => {
    const newBasketItems = [...checkoutBasket];
    let errors: string[] = [];

    prescribedList.forEach((prescription) => {
      const selectedItem = items.find((i) => i.ItemID === prescription.ItemID);
      if (!selectedItem) return;

      const existingBasketQty = newBasketItems.find((b) => b.ItemID === prescription.ItemID)?.Qty || 0;
      const qtyToAdd = 1;
      const totalRequired = existingBasketQty + qtyToAdd;

      if (totalRequired > selectedItem.CStock) {
        errors.push(selectedItem.ItemName);
        return;
      }

      const existsIndex = newBasketItems.findIndex((b) => b.ItemID === prescription.ItemID);
      if (existsIndex >= 0) {
        newBasketItems[existsIndex].Qty += qtyToAdd;
      } else {
        newBasketItems.push({
          ItemID: prescription.ItemID,
          Qty: qtyToAdd,
          Price: selectedItem.Price,
          MedicineType: prescription.MedicineType || 'S'
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
    if (existsIndex >= 0) {
      const updated = [...checkoutBasket];
      updated[existsIndex].Qty += rowQty;
      setCheckoutBasket(updated);
    } else {
      setCheckoutBasket([
        ...checkoutBasket,
        { ItemID: rowItemId, Qty: rowQty, Price: selectedItem.Price, MedicineType: 'S' }
      ]);
    }

    // Reset scratchpad
    setRowItemId('');
    setRowQty(1);
  };

  const handleRemoveFromBasket = (itemId: string) => {
    setCheckoutBasket(checkoutBasket.filter((b) => b.ItemID !== itemId));
  };

  // Checkout and finalize invoice posting
  const handleCheckoutInvoice = (postRecord: boolean) => {
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }
    if (checkoutBasket.length === 0) {
      alert('Checkout basket is empty.');
      return;
    }
    if (postRecord && !canPost) {
      alert('Unauthorized: Your role does not possess GL Posting rights (PostRec).');
      return;
    }

    const nextInvoiceNo = `INV-PH-${String(invoices.length + 1).padStart(4, '0')}`;
    
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
      PatientID: selectedPatientId,
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
    
    setBillingSuccess(`Invoice ${nextInvoiceNo} checked out! Status: ${postRecord ? 'POSTED & DEBITED TO CASH (Read-Only)' : 'DRAFT'}.`);
    
    // Set print bill data first so they can print immediately!
    setPrintBillData({
      patient: patients.find(p => p.PatientID === selectedPatientId) || null,
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
      const invoiceNoMatch = inv.InvoiceNo.toLowerCase().includes(q);
      const patientNameMatch = (patients.find((p) => p.PatientID === inv.PatientID)?.PatientName || 'Walk-in Customer').toLowerCase().includes(q);
      const patientIdMatch = inv.PatientID.toLowerCase().includes(q);
      
      const medicinesMatch = invoiceDetails
        .filter((d) => d.InvoiceNo === inv.InvoiceNo)
        .some((d) => {
          const item = items.find((itm) => itm.ItemID === d.ItemID);
          return item?.ItemName.toLowerCase().includes(q) || d.ItemID.toLowerCase().includes(q);
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
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('checkout')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSubTab === 'checkout' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Pharmacy POS Billing</span>
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
        </div>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      {activeSubTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="pos-billing-tab">
          
          {/* POS Bill Builder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 flex items-center border-b border-slate-100 pb-3">
              <ShoppingCart className="w-4 h-4 text-emerald-500 mr-2" />
              Dynamic Pharmacy Cash Checkout Terminal
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Customer / Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Patient --</option>
                  {checkedPatients.map((p) => {
                    const tokenNo = getPatientTokenNo(p.PatientID);
                    return (
                      <option key={p.PatientID} value={p.PatientID}>
                        {p.PatientName} ({p.PatientID}){tokenNo ? ` - Token: #${tokenNo}` : ''}
                      </option>
                    );
                  })}
                </select>
                {checkedPatients.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">
                    ⚠️ No patients have been checked by a Doctor yet. Complete a check on EMR Desk first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase">Operational Shift</label>
                <select
                  value={billingShift}
                  onChange={(e) => setBillingShift(parseInt(e.target.value) as any)}
                  className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value={1}>Morning Shift (1)</option>
                  <option value={2}>Evening Shift (2)</option>
                </select>
              </div>
            </div>

            {/* Doctor's Prescription Loadout Section */}
            {selectedPatientId && (
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-500 rounded-md text-white shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Doctor's Prescribed Medicines (Rx)</h4>
                      {latestVisit && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Prescribed on {new Date().toLocaleDateString()} • Diagnosis: <span className="font-semibold text-slate-700">{latestVisit.SymptomsDiagnosis}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {prescribedMedicinesList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddAllPrescribedToBasket(prescribedMedicinesList)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center transition shadow-sm self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add All Prescribed
                    </button>
                  )}
                </div>

                {prescribedMedicinesList.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium py-1">
                    ℹ️ No medications are listed in the doctor's prescription for this patient visit.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-blue-100 text-slate-400 uppercase text-xxs font-bold">
                          <th className="py-2 font-bold">Medicine</th>
                          <th className="py-2 text-center font-bold">Type</th>
                          <th className="py-2 font-bold text-center font-mono">Dosage</th>
                          <th className="py-2 font-bold">Instructions</th>
                          <th className="py-2 text-right font-bold">Stock Status</th>
                          <th className="py-2 text-right font-bold">Rate</th>
                          <th className="py-2 text-right font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-50/50">
                        {prescribedMedicinesList.map((med, idx) => {
                          const item = items.find((i) => i.ItemID === med.ItemID);
                          const isC = med.MedicineType === 'C';
                          return (
                            <tr key={idx} className="hover:bg-blue-50/30">
                              <td className="py-2.5">
                                <span className="font-bold text-slate-900">{item ? item.ItemName : 'Custom Compound'}</span>
                                <span className="text-[10px] text-slate-400 font-mono block">Code: {med.ItemID}</span>
                              </td>
                              <td className="py-2.5 text-center">
                                {isC ? (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full inline-block">
                                    Clinical ('C')
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full inline-block">
                                    Patent ('P')
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-center font-semibold text-slate-700 font-mono">
                                {med.Dosage}
                              </td>
                              <td className="py-2.5 text-slate-600 max-w-xs truncate" title={med.MedicineDetail}>
                                {med.MedicineDetail}
                              </td>
                              <td className="py-2.5 text-right font-semibold">
                                {item ? (
                                  <span className={`text-[10px] ${item.CStock > item.MinStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.CStock} {item.Unit}s
                                  </span>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                              <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                                Rs. {item ? item.Price.toFixed(1) : '0.0'}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleAddPrescribedToBasket(med)}
                                  disabled={item && item.CStock <= 0}
                                  className="p-1 px-2.5 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-700 hover:text-blue-800 text-[10px] font-bold rounded-md flex items-center inline-flex transition"
                                >
                                  <Plus className="w-3 h-3 mr-0.5" />
                                  Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* In-Grid Item selector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5">
              <span className="text-xxs font-bold text-slate-400 uppercase">Add Products to Ticket</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xxs font-bold text-slate-500 uppercase">Search Stock Item</label>
                  <select
                    value={rowItemId}
                    onChange={(e) => setRowItemId(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 bg-white rounded-lg p-2 focus:outline-none"
                  >
                    <option value="">-- Choose Pharmaceutical Item --</option>
                    {items.map((itm) => (
                      <option key={itm.ItemID} value={itm.ItemID}>
                        {itm.ItemName} - Rs. {itm.Price} [Stock: {itm.CStock}]
                      </option>
                    ))}
                  </select>
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
                    <th className="py-2.5 text-right font-bold">Retail Rate</th>
                    <th className="py-2.5 text-right font-bold">Line Total</th>
                    <th className="py-2.5 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checkoutBasket.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-semibold">Checkout basket is currently empty.</td>
                    </tr>
                  ) : (
                    checkoutBasket.map((b) => {
                      const item = items.find((i) => i.ItemID === b.ItemID);
                      const total = b.Qty * b.Price;
                      return (
                        <tr key={b.ItemID} className="hover:bg-slate-50/50">
                          <td className="py-2 font-mono text-xxs font-bold text-slate-400">{b.ItemID}</td>
                          <td className="py-2 font-bold text-slate-800">{item ? item.ItemName : 'Unknown'}</td>
                          <td className="py-2 text-center font-bold font-mono">{b.Qty}</td>
                          <td className="py-2 text-right font-mono text-slate-600">Rs. {b.Price}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-900">Rs. {total.toLocaleString()}</td>
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
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[480px]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Ticket Checkout Checkout</h3>
              
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between font-semibold">
                  <span>Gross Total (GAmount):</span>
                  <span className="font-mono text-slate-900 font-bold">Rs. {gAmount.toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Apply Discount (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    max={gAmount}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(Math.min(gAmount, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Net Amount Paid:</span>
                  <strong className="text-lg font-bold text-emerald-600 font-mono">Rs. {netAmount.toLocaleString()}</strong>
                </div>
              </div>

              {/* Account distribution preview */}
              <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xxs text-slate-500 space-y-1.5 font-medium">
                <span className="font-bold text-slate-400 uppercase">Expected Double-Entry Distribution:</span>
                <div className="flex justify-between">
                  <span>Debit StoreCIH_ Cash Account:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {netAmount.toLocaleString()}</span>
                </div>
                {discountInput > 0 && (
                  <div className="flex justify-between">
                    <span>Debit StoreDisc_ Discount:</span>
                    <span className="text-slate-800 font-bold font-mono">Rs. {discountInput.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Credit StoreSale_ Revenue:</span>
                  <span className="text-slate-800 font-bold font-mono">Rs. {gAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCheckoutInvoice(false)}
                  disabled={!canAdd}
                  className="py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Save Draft Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (checkoutBasket.length === 0) {
                      alert('Cannot print empty bill. Please add items to ticket.');
                      return;
                    }
                    setPrintBillData({
                      patient: patients.find(p => p.PatientID === selectedPatientId) || null,
                      basket: [...checkoutBasket],
                      discount: discountInput,
                      netAmount: netAmount,
                      shift: billingShift,
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
                onClick={() => handleCheckoutInvoice(true)}
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

          {/* History of Patient Received Medicine with Reprint Option */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4" id="today-receipts-history">
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
                                .map((d) => {
                                  const item = items.find((itm) => itm.ItemID === d.ItemID);
                                  return (
                                    <span key={d.ItemID} className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200 transition">
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
                  <select
                    required
                    value={grnSupplierId}
                    onChange={(e) => setGrnSupplierId(e.target.value)}
                    className="mt-1 w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.SID} value={sup.SID}>
                        {sup.SupplierName} ({sup.SID})
                      </option>
                    ))}
                  </select>
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
                      {items.map((i) => (
                        <option key={i.ItemID} value={i.ItemID}>
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

              <button
                type="submit"
                disabled={!canPost}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition ${
                  canPost ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                Post Inward GRN & Capitalize Inventory
              </button>
            </form>
          </div>

          {/* Suppliers directory */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Active Suppliers Directory</h3>
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
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
                      return (
                        <div key={idx} className="flex justify-between items-start pt-1.5 first:pt-0 font-medium text-slate-700">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 text-xxs">{item ? item.ItemName : b.ItemID}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {b.Qty} unit(s) x Rs. {b.Price.toFixed(1)}
                            </p>
                          </div>
                          <span className="font-mono text-slate-900 font-bold">
                            Rs. {(b.Qty * b.Price).toLocaleString()}
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
                    Thank you for choosing Punjab Clinic Pharmacy. Get well soon!
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
