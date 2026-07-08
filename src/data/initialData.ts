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
  { ItemID: 'ITM-001', ItemName: 'Panadol 500mg (Paracetamol)', Price: 3.5, PurchasePrice: 2.8, CStock: 1200, MinStock: 200, Unit: 'Tab' },
  { ItemID: 'ITM-002', ItemName: 'Augmentin 625mg (Co-Amoxiclav)', Price: 45.0, PurchasePrice: 38.0, CStock: 450, MinStock: 50, Unit: 'Tab' },
  { ItemID: 'ITM-003', ItemName: 'Lofnac 50mg (Diclofenac Sodium)', Price: 8.0, PurchasePrice: 6.2, CStock: 800, MinStock: 100, Unit: 'Tab' },
  { ItemID: 'ITM-004', ItemName: 'Arinac Forte (Ibuprofen / Pseudoephedrine)', Price: 12.0, PurchasePrice: 9.5, CStock: 600, MinStock: 100, Unit: 'Tab' },
  { ItemID: 'ITM-005', ItemName: 'Surbex-Z (Multivitamins & Zinc)', Price: 15.0, PurchasePrice: 12.0, CStock: 350, MinStock: 50, Unit: 'Tab' },
  { ItemID: 'ITM-006', ItemName: 'Gravinate Syrup 120ml', Price: 95.0, PurchasePrice: 80.0, CStock: 85, MinStock: 20, Unit: 'Syrup' },
  { ItemID: 'ITM-007', ItemName: 'Amoxil 250mg Suspension', Price: 135.0, PurchasePrice: 115.0, CStock: 60, MinStock: 15, Unit: 'Syrup' },
  { ItemID: 'ITM-008', ItemName: 'Ponstan 250mg (Mefenamic Acid)', Price: 4.5, PurchasePrice: 3.6, CStock: 1000, MinStock: 150, Unit: 'Tab' },
  { ItemID: 'ITM-009', ItemName: 'Risek 40mg Cap (Omeprazole)', Price: 32.0, PurchasePrice: 26.0, CStock: 500, MinStock: 100, Unit: 'Cap' },
  { ItemID: 'ITM-010', ItemName: 'Ventolin Inhaler', Price: 260.0, PurchasePrice: 220.0, CStock: 40, MinStock: 10, Unit: 'Inhaler' }
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
  { FLID: 1, SLID: 101, TLID: 101001, TLName: 'Dr. Cash-in-Hand (Morning Shift)', AcBalance: 45000 },
  { FLID: 1, SLID: 101, TLID: 101002, TLName: 'Dr. Cash-in-Hand (Evening Shift)', AcBalance: 125000 },
  { FLID: 1, SLID: 101, TLID: 101003, TLName: 'Appointment Cash Desk', AcBalance: 15000 },
  { FLID: 1, SLID: 101, TLID: 101004, TLName: 'Bank Al-Falah (Current Account)', AcBalance: 450000 },
  // Receivables (SLID 102)
  { FLID: 1, SLID: 102, TLID: 102001, TLName: 'SBP Panel Employee Receivables', AcBalance: 68000 },
  // Inventory (SLID 103)
  { FLID: 1, SLID: 103, TLID: 103001, TLName: 'Pharmacy Pharmacy Stock Ledger', AcBalance: 245000 },
  
  // Accounts Payable (SLID 201)
  { FLID: 2, SLID: 201, TLID: 201001, TLName: 'Payable to Standipharm Pakistan', AcBalance: -15000 },
  { FLID: 2, SLID: 201, TLID: 201002, TLName: 'Payable to Getz Pharma', AcBalance: -28000 },
  
  // Capital Accounts (SLID 301)
  { FLID: 3, SLID: 301, TLID: 301001, TLName: 'Owner Capital Equity Account', AcBalance: -800000 },

  // Clinical Income (SLID 401)
  { FLID: 4, SLID: 401, TLID: 401001, TLName: 'Appointment OPD Ticket Revenue', AcBalance: -35000 },
  { FLID: 4, SLID: 401, TLID: 401002, TLName: 'Lab & Diagnostics Revenue', AcBalance: -18000 },
  
  // Shift-based Revenue Accounts
  { FLID: 4, SLID: 401, TLID: 401101, TLName: 'Morning Shift: Appointment Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401102, TLName: 'Morning Shift: Clinical Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401103, TLName: 'Morning Shift: Patent Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401104, TLName: 'Morning Shift: Store Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401201, TLName: 'Evening Shift: Appointment Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401202, TLName: 'Evening Shift: Clinical Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401203, TLName: 'Evening Shift: Patent Medicine Revenue', AcBalance: 0 },
  { FLID: 4, SLID: 401, TLID: 401204, TLName: 'Evening Shift: Store Medicine Revenue', AcBalance: 0 },

  // Pharmacy Sales (SLID 402)
  { FLID: 4, SLID: 402, TLID: 402001, TLName: 'Pharmacy Store Cash Sales', AcBalance: -185000 },

  // Costs & Discounts (SLID 501)
  { FLID: 5, SLID: 501, TLID: 501001, TLName: 'Pharmacy Cost of Goods Sold (COGS)', AcBalance: 110000 },
  { FLID: 5, SLID: 501, TLID: 501002, TLName: 'Pharmacy Customer Discounts Allowed', AcBalance: 7500 },
  { FLID: 5, SLID: 501, TLID: 501003, TLName: 'Pharmacy Sales Return Debit A/C', AcBalance: 4000 },
  { FLID: 5, SLID: 501, TLID: 501004, TLName: 'Pharmacy Sales Return Disc Reversal', AcBalance: -500 },

  // Operating Expenses (SLID 502)
  { FLID: 5, SLID: 502, TLID: 502001, TLName: 'Clinic Rent & Lease Expense', AcBalance: 30000 },
  { FLID: 5, SLID: 502, TLID: 502002, TLName: 'Electricity & Water Utility Bills', AcBalance: 12000 },
  { FLID: 5, SLID: 502, TLID: 502003, TLName: 'Doctor Consultation Sharing Pay', AcBalance: 15000 }
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
  { UserID: 'USR-01', LoginName: 'admin', FullName: 'Dr. Zaigham Ali Anjum', PasswordHash: 'admin123', Role: 'Administrator', AssignedShift: 'Both' },
  { UserID: 'USR-02', LoginName: 'doctor_morn', FullName: 'Dr. Amjad Malik (Morning)', PasswordHash: 'doc123', Role: 'Doctor', AssignedShift: 1 },
  { UserID: 'USR-02b', LoginName: 'doctor_eve', FullName: 'Dr. Zaigham Ali (Evening)', PasswordHash: 'doc123', Role: 'Doctor', AssignedShift: 2 },
  { UserID: 'USR-03', LoginName: 'reception', FullName: 'Kashif Mehmood', PasswordHash: 'rec123', Role: 'Receptionist', AssignedShift: 1 },
  { UserID: 'USR-04', LoginName: 'pharmacy', FullName: 'Sana Fatima (R.Ph)', PasswordHash: 'ph123', Role: 'Pharmacist', AssignedShift: 'Both' },
  { UserID: 'USR-05', LoginName: 'accounts', FullName: 'Muhammad Salman', PasswordHash: 'acc123', Role: 'Accountant', AssignedShift: 'Both' }
];

// User permissions for each user role
export const ROLE_RIGHTS: Record<User['Role'], UserRight[]> = {
  Administrator: [
    { MenuID: 'patients', MenuName: 'Patient Intake & Queue', Status: true, AddRec: true, PostRec: true, CancelPosted: true },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: true, AddRec: true, PostRec: true, CancelPosted: true },
    { MenuID: 'pharmacy', MenuName: 'Pharmacy POS & Inventory', Status: true, AddRec: true, PostRec: true, CancelPosted: true },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: true, AddRec: true, PostRec: true, CancelPosted: true }
  ],
  Doctor: [
    { MenuID: 'patients', MenuName: 'Patient Intake & Queue', Status: true, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: true, AddRec: true, PostRec: true, CancelPosted: false },
    { MenuID: 'pharmacy', MenuName: 'Pharmacy POS & Inventory', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false }
  ],
  Receptionist: [
    { MenuID: 'patients', MenuName: 'Patient Intake & Queue', Status: true, AddRec: true, PostRec: true, CancelPosted: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'pharmacy', MenuName: 'Pharmacy POS & Inventory', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false }
  ],
  Pharmacist: [
    { MenuID: 'patients', MenuName: 'Patient Intake & Queue', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'pharmacy', MenuName: 'Pharmacy POS & Inventory', Status: true, AddRec: true, PostRec: true, CancelPosted: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: false, AddRec: false, PostRec: false, CancelPosted: false }
  ],
  Accountant: [
    { MenuID: 'patients', MenuName: 'Patient Intake & Queue', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'emr', MenuName: 'EMR & Clinical Desk', Status: false, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'pharmacy', MenuName: 'Pharmacy POS & Inventory', Status: true, AddRec: false, PostRec: false, CancelPosted: false },
    { MenuID: 'accounts', MenuName: 'Double-Entry Accounting', Status: true, AddRec: true, PostRec: true, CancelPosted: true }
  ]
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    PatientID: 'PAT-001',
    PatientName: 'Zubair Ahmad Qureshi',
    Father_husband: 'Muhammad Ishaq',
    AgeYears: 42,
    Sex: 'Male',
    MaritalStatus: 'Married',
    Occupation: 'Government Servant',
    Address: 'House 42, Block C, Model Town',
    CityID: 1, // Lahore
    Country: 'Pakistan',
    PhoneMobile: '0300-4567891',
    PhoneRes: '042-35851234',
    Email: 'zubair.qureshi@gmail.com',
    RegistrationDate: '2026-06-15T09:30:00'
  },
  {
    PatientID: 'PAT-002',
    PatientName: 'Saima Parveen',
    Father_husband: 'Tariq Mahmood',
    AgeYears: 29,
    Sex: 'Female',
    MaritalStatus: 'Married',
    Occupation: 'Housewife',
    Address: 'St 4, Mohallah Sharifpura',
    CityID: 2, // Faisalabad
    Country: 'Pakistan',
    PhoneMobile: '0321-7654321',
    PhoneRes: '041-8812345',
    Email: 'saima.tariq@yahoo.com',
    RegistrationDate: '2026-06-20T17:15:00'
  },
  {
    PatientID: 'PAT-003',
    PatientName: 'Haris Ali SBP',
    Father_husband: 'Liaqat Ali',
    AgeYears: 35,
    Sex: 'Male',
    MaritalStatus: 'Single',
    Occupation: 'SBP Officer',
    Address: 'State Bank Officers Colony, G-9',
    CityID: 10, // Islamabad
    Country: 'Pakistan',
    PhoneMobile: '0333-5511223',
    PhoneOff: '051-9201234',
    Email: 'haris.ali@sbp.org.pk',
    RegistrationDate: '2026-07-01T10:00:00'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    AppointmentID: 'APP-001',
    PatientID: 'PAT-001',
    AppointmentDate: '2026-07-03',
    Shift: 1, // Morning
    Status: 4, // Payment Posted
    Remarks: 'Regular follow-up for hypertension',
    FeeCharged: 1500
  },
  {
    AppointmentID: 'APP-002',
    PatientID: 'PAT-002',
    AppointmentDate: '2026-07-03',
    Shift: 1, // Morning
    Status: 2, // Visited
    Remarks: 'Post-viral checkup and general weakness',
    FeeCharged: 1500
  },
  {
    AppointmentID: 'APP-003',
    PatientID: 'PAT-003',
    AppointmentDate: '2026-07-03',
    Shift: 2, // Evening
    Status: 1, // New
    Remarks: 'SBP Employee medical clearance assessment',
    FeeCharged: 1500
  }
];

export const INITIAL_TOKENS: Token[] = [
  { TokenNo: 1, PatientID: 'PAT-001', Shift: 1, Status: 2, Date: '2026-07-03' },
  { TokenNo: 2, PatientID: 'PAT-002', Shift: 1, Status: 2, Date: '2026-07-03' }
];
