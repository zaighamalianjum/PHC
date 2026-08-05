/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  City,
  Patient,
  Item,
  Supplier,
  LabTest,
  FLAccount,
  SLAccount,
  TLAccount,
  Config,
  User,
  UserRight,
  Appointment,
  Token
} from '../types';

export const INITIAL_CITIES: City[] = [
  { CityID: 1, CityName: 'Lahore' },
  { CityID: 2, CityName: 'Faisalabad' },
  { CityID: 3, CityName: 'Rawalpindi' },
  { CityID: 4, CityName: 'Multan' },
  { CityID: 5, CityName: 'Gujranwala' },
  { CityID: 6, CityName: 'Sialkot' },
  { CityID: 7, CityName: 'Sargodha' },
  { CityID: 8, CityName: 'Bahawalpur' },
  { CityID: 9, CityName: 'Sahiwal' },
  { CityID: 10, CityName: 'Islamabad' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { SID: 'SUP-001', SupplierName: 'Standipharm Pakistan Ltd', Phone: '042-35112233', Address: 'Industrial Area, Kot Lakhpat, Lahore' },
  { SID: 'SUP-002', SupplierName: 'Getz Pharma Pakistan', Phone: '021-111111555', Address: 'Korangi Industrial Area, Karachi' },
  { SID: 'SUP-003', SupplierName: 'GSK Pakistan', Phone: '021-32315431', Address: 'Dockyard Road, West Wharf, Karachi' },
  { SID: 'SUP-004', SupplierName: 'Searle Company Limited', Phone: '042-35789123', Address: 'Gulberg III, Lahore' }
];

export const INITIAL_ITEMS: Item[] = [
  { ItemID: 'ITM-001', ItemName: 'BM 1 Drops (Hypertension / Heart)', Price: 180.0, PurchasePrice: 140.0, CStock: 8, MinStock: 10, Unit: 'BM Drops', ReorderQty: 10 },
  { ItemID: 'ITM-002', ItemName: 'BM 12 Drops (Stomach / Gastric)', Price: 180.0, PurchasePrice: 140.0, CStock: 5, MinStock: 10, Unit: 'BM Drops', ReorderQty: 10 },
  { ItemID: 'ITM-003', ItemName: 'Acid Phos Q (Mother Tincture)', Price: 250.0, PurchasePrice: 190.0, CStock: 3, MinStock: 5, Unit: 'Q D DROPS', ReorderQty: 2 },
  { ItemID: 'ITM-004', ItemName: 'Berberis Vulg Q (Kidney & Liver)', Price: 280.0, PurchasePrice: 210.0, CStock: 2, MinStock: 5, Unit: 'Q D DROPS', ReorderQty: 6 },
  { ItemID: 'ITM-005', ItemName: 'Acid Phos 30', Price: 120.0, PurchasePrice: 90.0, CStock: 4, MinStock: 10, Unit: 'Potency 30', ReorderQty: 3 },
  { ItemID: 'ITM-006', ItemName: 'Arnica Mont 30 (Injury / Pain)', Price: 120.0, PurchasePrice: 90.0, CStock: 2, MinStock: 10, Unit: 'Potency 30', ReorderQty: 10 },
  { ItemID: 'ITM-007', ItemName: 'Acid Phos 200', Price: 150.0, PurchasePrice: 110.0, CStock: 3, MinStock: 5, Unit: 'Potency 200', ReorderQty: 2 },
  { ItemID: 'ITM-008', ItemName: 'Arnica Mont 200', Price: 150.0, PurchasePrice: 110.0, CStock: 1, MinStock: 5, Unit: 'Potency 200', ReorderQty: 6 },
  { ItemID: 'ITM-009', ItemName: 'Phosmet Plus Syp', Price: 220.0, PurchasePrice: 170.0, CStock: 6, MinStock: 10, Unit: 'Syrup', ReorderQty: 12 },
  { ItemID: 'ITM-010', ItemName: 'Cardiac Care Drop', Price: 310.0, PurchasePrice: 240.0, CStock: 4, MinStock: 10, Unit: 'Drops', ReorderQty: 20 },
  { ItemID: 'ITM-011', ItemName: 'Panadol 500mg (Paracetamol)', Price: 3.5, PurchasePrice: 2.8, CStock: 1200, MinStock: 200, Unit: 'Tab' },
  { ItemID: 'ITM-012', ItemName: 'Augmentin 625mg (Co-Amoxiclav)', Price: 45.0, PurchasePrice: 38.0, CStock: 450, MinStock: 50, Unit: 'Tab' },
  { ItemID: 'ITM-013', ItemName: 'Risek 40mg Cap (Omeprazole)', Price: 32.0, PurchasePrice: 26.0, CStock: 500, MinStock: 100, Unit: 'Cap' }
];

export const INITIAL_LAB_TESTS: LabTest[] = [
  { TID: 'TST-001', TestName: 'Complete Blood Count (CBC)', Cost: 650 },
  { TID: 'TST-002', TestName: 'Blood Sugar Fasting / Random', Cost: 250 },
  { TID: 'TST-003', TestName: 'Liver Function Test (LFT)', Cost: 1800 },
  { TID: 'TST-004', TestName: 'Renal Function Test (RFT) / Kidney Profile', Cost: 1200 },
  { TID: 'TST-005', TestName: 'Lipid Profile (Cholesterol, HDL, LDL)', Cost: 1500 },
  { TID: 'TST-006', TestName: 'Urine Routine Examination (Urine RE)', Cost: 350 },
  { TID: 'TST-007', TestName: 'Chest X-Ray (PA View)', Cost: 900 },
  { TID: 'TST-008', TestName: 'Electrocardiogram (ECG)', Cost: 800 }
];

// First level: FLID (1 digit)
export const INITIAL_FL_ACCOUNTS: FLAccount[] = [
  { FLID: 1, FLName: 'Assets' },
  { FLID: 2, FLName: 'Liabilities' },
  { FLID: 3, FLName: 'Equity' },
  { FLID: 4, FLName: 'Revenue' },
  { FLID: 5, FLName: 'Expenses' }
];

// Second level: SLID (3 digits, starts with FLID)
export const INITIAL_SL_ACCOUNTS: SLAccount[] = [
  // Assets (FLID 1)
  { FLID: 1, SLID: 101, SLName: 'Cash & Bank Balances' },
  { FLID: 1, SLID: 102, SLName: 'Receivables & Advances' },
  { FLID: 1, SLID: 103, SLName: 'Inventory Accounts' },
  // Liabilities (FLID 2)
  { FLID: 2, SLID: 201, SLName: 'Accounts Payable' },
  { FLID: 2, SLID: 202, SLName: 'Accrued Liabilities' },
  // Equity (FLID 3)
  { FLID: 3, SLID: 301, SLName: 'Capital Accounts' },
  // Revenue (FLID 4)
  { FLID: 4, SLID: 401, SLName: 'Clinical Services Income' },
  { FLID: 4, SLID: 402, SLName: 'Pharmacy Sales Income' },
  // Expenses (FLID 5)
  { FLID: 5, SLID: 501, SLName: 'Pharmacy Costs & Discounts' },
  { FLID: 5, SLID: 502, SLName: 'Operating & Admin Expenses' }
];

// Third level: TLID (6 digits, starts with SLID)
export const INITIAL_TL_ACCOUNTS: TLAccount[] = [
  // Cash & Bank (SLID 101)
  { FLID: 1, SLID: 101, TLID: 101001, TLName: 'Cash-in-Hand (Morning Shift)', AcBalance: 0 },
  { FLID: 1, SLID: 101, TLID: 101002, TLName: 'Cash-in-Hand (Evening Shift)', AcBalance: 0 },
  { FLID: 1, SLID: 101, TLID: 101003, TLName: 'Appointment Cash Desk', AcBalance: 0 },
  { FLID: 1, SLID: 101, TLID: 101004, TLName: 'Main Bank Current Account', AcBalance: 0 },
  // Receivables (SLID 102)
  { FLID: 1, SLID: 102, TLID: 102001, TLName: 'Corporate & Panel Receivables', AcBalance: 0 },
  // Inventory (SLID 103)
  { FLID: 1, SLID: 103, TLID: 103001, TLName: 'Pharmacy Stock Ledger', AcBalance: 0 },
  
  // Accounts Payable (SLID 201)
  { FLID: 2, SLID: 201, TLID: 201001, TLName: 'Accounts Payable (Primary Suppliers)', AcBalance: 0 },
  { FLID: 2, SLID: 201, TLID: 201002, TLName: 'Accounts Payable (Secondary Suppliers)', AcBalance: 0 },
  
  // Capital Accounts (SLID 301)
  { FLID: 3, SLID: 301, TLID: 301001, TLName: 'Owner Capital Equity Account', AcBalance: 0 },

  // Clinical Income (SLID 401)
  { FLID: 4, SLID: 401, TLID: 401001, TLName: 'Appointment OPD Ticket Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401002, TLName: 'Lab & Diagnostics Revenue', AcBalance: 0 },
  
  // Shift-based Revenue Accounts
  { FLID: 4, SLID: 401, TLID: 401101, TLName: 'Morning Shift: Appointment Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401102, TLName: 'Morning Shift: Clinical Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401103, TLName: 'Morning Shift: Patent Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401104, TLName: 'Morning Shift: Store Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401105, TLName: 'Morning Shift: File & Card Fee Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401201, TLName: 'Evening Shift: Appointment Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401202, TLName: 'Evening Shift: Clinical Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401203, TLName: 'Evening Shift: Patent Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401204, TLName: 'Evening Shift: Store Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401205, TLName: 'Evening Shift: File & Card Fee Revenue', AcBalance: 0 },

  // Pharmacy Sales (SLID 402)
  { FLID: 4, SLID: 402, TLID: 402001, TLName: 'Pharmacy Store Cash Sales', AcBalance: 0 },

  // Costs & Discounts (SLID 501)
  { FLID: 5, SLID: 501, TLID: 501001, TLName: 'Pharmacy Cost of Goods Sold (COGS)', AcBalance: 0 },
  { FLID: 5, SLID: 501, TLID: 501002, TLName: 'Pharmacy Customer Discounts Allowed', AcBalance: 0 },
  { FLID: 5, SLID: 501, TLID: 501003, TLName: 'Pharmacy Sales Return Debit A/C', AcBalance: 0 },
  { FLID: 5, SLID: 501, TLID: 501004, TLName: 'Pharmacy Sales Return Disc Reversal', AcBalance: 0 },

  // Operating Expenses (SLID 502)
  { FLID: 5, SLID: 502, TLID: 502001, TLName: 'Clinic Rent & Lease Expense', AcBalance: 0 },
  { FLID: 5, SLID: 502, TLID: 502002, TLName: 'Electricity & Water Utility Bills', AcBalance: 0 },
  { FLID: 5, SLID: 502, TLID: 502003, TLName: 'Doctor Consultation Sharing Pay', AcBalance: 0 }
];

export const INITIAL_CONFIG: Config = {
  ConfigID: 0,
  ClinicCIH_: 101001,  // Clinic Cash in Hand
  StoreCIH_: 101002,   // Pharmacy Cash in Hand
  StoreSale_: 402001,  // Pharmacy Revenue
  StoreDisc_: 501002,  // Customer Discounts Allowed
  StoreSR_: 501003,    // Sales Returns
  StoreSRdisc_: 501004, // Sales Return Discount Reversal
  AppCIH_: 101003,     // Appointment Desk Cash
  AppSale_: 401001     // Appointment OPD Ticket Revenue
};

export const INITIAL_USERS: User[] = [
  { UserID: 'USR-01', LoginName: 'admin', FullName: 'Dr. Zaigham Ali Anjum', PasswordHash: 'admin123', Role: 'Administrator', AssignedShift: 'Both', MobileNumber: '0300-1234567', CNIC: '35201-1234567-1', NickName: 'Zaigham' },
  { UserID: 'USR-02', LoginName: 'doctor_morn', FullName: 'Dr. Amjad Malik (Morning)', PasswordHash: 'doc123', Role: 'Doctor', AssignedShift: 1 },
  { UserID: 'USR-02b', LoginName: 'doctor_eve', FullName: 'Dr. Zaigham Ali (Evening)', PasswordHash: 'doc123', Role: 'Doctor', AssignedShift: 2 },
  { 
    UserID: 'USR-03', 
    LoginName: 'reception', 
    FullName: 'Kashif Mehmood', 
    PasswordHash: 'rec123', 
    Role: 'Receptionist', 
    AssignedShift: 1,
    Permissions: {
      canViewDashboard: false,
      canViewPatientDesk: true,
      canViewEMRDesk: false,
      canViewPharmacyPOS: false,
      canViewAccountingDesk: false,
      canViewReportingDesk: false,
      canViewUploadingDesk: false,
      canViewSettingsDesk: false,
      canViewQueryHandlerDesk: false,
      canViewNhcHistoryDesk: false,

      // Default Reception Access: ONLY Waiting Queue, Token Issue, and Appointment
      canAccessWaitingQueue: true,
      canAccessTokenIssue: true,
      canAccessAppointmentsDesk: true,

      // Disabled by default for Receptionist
      canAccessPatientRegistration: false,
      canAccessPatientVisitDesk: false,
      canAccessGridView: false,
      canAccessLargeScreenDisplay: false,

      canAddPatient: true,
      canEditPatient: true,
      canIssueToken: true,
      canBookAppointment: true,
      canCancelAppointment: false,
      canDeleteToken: false,
      canCallServeToken: true,
      canEditStockLevel: false,

      canPrintPrescription: false,
      canPrintLabAdvice: false,
      canPrintVisitSlip: true,
      canPrintTokenSlip: true,
      canPrintPOSInvoice: false,
      canPrintVouchers: false,
      canPrintFinancialReports: false,
      canExportCSVExcel: false
    }
  },
  { 
    UserID: 'USR-04', 
    LoginName: 'pharmacy', 
    FullName: 'Store User', 
    PasswordHash: 'ph123', 
    Role: 'Pharmacist', 
    AssignedShift: 'Both',
    Permissions: {
      canViewDashboard: false,
      canViewPatientDesk: false,
      canViewEMRDesk: false,
      canViewPharmacyPOS: true,
      canViewAccountingDesk: false,
      canViewReportingDesk: false,
      canViewUploadingDesk: false,
      canViewSettingsDesk: false,
      canViewQueryHandlerDesk: false,
      canViewNhcHistoryDesk: false,

      // Default Pharmacist CANNOT edit current stock levels
      canEditStockLevel: false,
      canPrintPOSInvoice: true,
      canExportCSVExcel: true
    }
  },
  { UserID: 'USR-05', LoginName: 'accounts', FullName: 'Muhammad Salman', PasswordHash: 'acc123', Role: 'Accountant', AssignedShift: 'Both' }
];

// User permissions for each user role
export const ROLE_RIGHTS: Record<User['Role'], UserRight[]> = {
  Administrator: [
    { MenuID: 'patients', MenuName: 'Patients', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'pharmacy', MenuName: 'Store & Dispensary', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'inventory', MenuName: 'Stock & Inventory Control', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'reports', MenuName: 'Financials', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'uploads', MenuName: 'Uploading', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'settings', MenuName: 'Clinic Setup & Settings', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'queries', MenuName: 'Query Handler & Audit', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'nhc_history', MenuName: 'Patient Record', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true }
  ],
  Doctor: [
    { MenuID: 'patients', MenuName: 'Patients', Status: true, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: true, ExportRec: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: true, AddRec: true, PostRec: true, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'pharmacy', MenuName: 'Store & Dispensary', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'inventory', MenuName: 'Stock & Inventory Control', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'reports', MenuName: 'Financials', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'uploads', MenuName: 'Uploading', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'settings', MenuName: 'Clinic Setup & Settings', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'queries', MenuName: 'Query Handler & Audit', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'nhc_history', MenuName: 'Patient Record', Status: true, AddRec: true, PostRec: true, CancelPosted: false, PrintRec: true, ExportRec: true }
  ],
  Receptionist: [
    { MenuID: 'patients', MenuName: 'Patients', Status: true, AddRec: true, PostRec: true, CancelPosted: false, PrintRec: true, ExportRec: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'pharmacy', MenuName: 'Store & Dispensary', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'inventory', MenuName: 'Stock & Inventory Control', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'reports', MenuName: 'Financials', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'uploads', MenuName: 'Uploading', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'settings', MenuName: 'Clinic Setup & Settings', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'queries', MenuName: 'Query Handler & Audit', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'nhc_history', MenuName: 'Patient Record', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false }
  ],
  Pharmacist: [
    { MenuID: 'patients', MenuName: 'Patients', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'pharmacy', MenuName: 'Store & Dispensary', Status: true, AddRec: true, PostRec: true, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'inventory', MenuName: 'Stock & Inventory Control', Status: true, AddRec: true, PostRec: false, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'reports', MenuName: 'Financials', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'uploads', MenuName: 'Uploading', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'settings', MenuName: 'Clinic Setup & Settings', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'queries', MenuName: 'Query Handler & Audit', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'nhc_history', MenuName: 'Patient Record', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false }
  ],
  Accountant: [
    { MenuID: 'patients', MenuName: 'Patients', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'pharmacy', MenuName: 'Store & Dispensary', Status: true, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'inventory', MenuName: 'Stock & Inventory Control', Status: true, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: true, AddRec: true, PostRec: true, CancelPosted: true, PrintRec: true, ExportRec: true },
    { MenuID: 'reports', MenuName: 'Financials', Status: true, AddRec: true, PostRec: true, CancelPosted: false, PrintRec: true, ExportRec: true },
    { MenuID: 'uploads', MenuName: 'Uploading', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'settings', MenuName: 'Clinic Setup & Settings', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'queries', MenuName: 'Query Handler & Audit', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false },
    { MenuID: 'nhc_history', MenuName: 'Patient Record', Status: false, AddRec: false, PostRec: false, CancelPosted: false, PrintRec: false, ExportRec: false }
  ]
};

export const INITIAL_PATIENTS: Patient[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_TOKENS: Token[] = [];

