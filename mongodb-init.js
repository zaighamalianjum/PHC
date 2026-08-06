// ==========================================================================================
// 🍃 punjab Clinic & Pharmacy POS - Production MongoDB Database Initialization Script
// Purpose: Automatically provisions all 22 collections, constructs query performance indexes,
//          and populates rich, realistic Pakistan-themed dummy datasets for every single module.
// Execution: run "node mongodb-init.js" or "npx tsx mongodb-init.js"
// ==========================================================================================

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/PharmacyPOSDB';

async function initializeDatabase() {
  console.log('🏁 Starting MongoDB Production Architecture Provisioning...');
  console.log(`🔗 Target Connection String: ${MONGODB_URI.replace(/\/\/[^@]*@/, '//***:***@')}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    console.log(`✅ Safe Connection Established! Database Selected: "${db.databaseName}"`);

    // ======================================================================================
    // 🧱 STEP 1: CONSTRUCT COLLECTIONS & INDEXES
    // ======================================================================================
    const collectionsToSetup = [
      { name: 'users', indexes: [{ key: { UserID: 1 }, unique: true }, { key: { LoginName: 1 }, unique: true }] },
      { name: 'patients', indexes: [{ key: { PatientID: 1 }, unique: true }, { key: { PatientName: 'text' } }] },
      { name: 'items', indexes: [{ key: { ItemID: 1 }, unique: true }, { key: { ItemName: 1 } }] },
      { name: 'cities', indexes: [{ key: { CityID: 1 }, unique: true }] },
      { name: 'appointments', indexes: [{ key: { AppointmentID: 1 }, unique: true }, { key: { PatientID: 1 } }] },
      { name: 'tokens', indexes: [{ key: { TokenNo: 1, TokenDate: 1, Shift: 1 }, unique: true }] },
      { name: 'visits', indexes: [{ key: { VisitID: 1 }, unique: true }, { key: { PatientID: 1 } }] },
      { name: 'visit_medicines', indexes: [{ key: { VisitID: 1, ItemID: 1 } }] },
      { name: 'lab_tests', indexes: [{ key: { TID: 1 }, unique: true }] },
      { name: 'med_certs', indexes: [{ key: { CertificateID: 1 }, unique: true }] },
      { name: 'sbp_certs', indexes: [{ key: { CertificateID: 1 }, unique: true }] },
      { name: 'invoice_headers', indexes: [{ key: { InvoiceNo: 1 }, unique: true }, { key: { PatientID: 1 } }] },
      { name: 'invoice_details', indexes: [{ key: { InvoiceNo: 1, ItemID: 1 } }] },
      { name: 'sales_returns', indexes: [{ key: { SRInvoiceNo: 1 }, unique: true }] },
      { name: 'grns', indexes: [{ key: { VchNo: 1 }, unique: true }] },
      { name: 'grn_details', indexes: [{ key: { VchNo: 1, ItemID: 1 } }] },
      { name: 'accounts', indexes: [{ key: { TLID: 1 }, unique: true }] },
      { name: 'vouchers', indexes: [{ key: { VchNo: 1 }, unique: true }] },
      { name: 'voucher_details', indexes: [{ key: { VchNo: 1, TLID: 1 } }] },
      { name: 'config', indexes: [{ key: { ConfigID: 1 }, unique: true }] },
      { name: 'sms', indexes: [] },
      { name: 'clinic', indexes: [] },
      { name: 'fl_accounts', indexes: [{ key: { FLID: 1 }, unique: true }] },
      { name: 'sl_accounts', indexes: [{ key: { SLID: 1 }, unique: true }] },
      { name: 'ac_ledger', indexes: [{ key: { ACLedgerID: 1 }, unique: true }] },
      { name: 'nhc_patient_history', indexes: [] },
      { name: 'financial_grid_reports', indexes: [] },
      { name: 'suppliers', indexes: [{ key: { SID: 1 }, unique: true }] }
    ];

    for (const col of collectionsToSetup) {
      // Create collection explicitly to ensure it exists
      const currentCollections = await db.listCollections({ name: col.name }).toArray();
      if (currentCollections.length === 0) {
        await db.createCollection(col.name);
        console.log(`📦 Created Collection: "${col.name}"`);
      } else {
        console.log(`ℹ️ Collection "${col.name}" already exists.`);
      }

      // Create indexes
      for (const idx of col.indexes) {
        try {
          await db.collection(col.name).createIndex(idx.key, { unique: idx.unique || false });
        } catch (idxErr) {
          console.warn(`⚠️ Warning creating index on "${col.name}":`, idxErr.message);
        }
      }
    }

    console.log('✅ Collection indexing completed successfully.');

    // ======================================================================================
    // 💾 STEP 2: SEED DUMMY DATA FOR PRODUCTION PLAYGROUND
    // ======================================================================================
    console.log('🌱 Populating high-fidelity seeds into collections...');

    // 1. Seed Cities
    const cityCount = await db.collection('cities').countDocuments();
    if (cityCount === 0) {
      await db.collection('cities').insertMany([
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
      ]);
      console.log('✔️ Seeded: "cities" metadata.');
    }

    // 2. Seed Users
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      await db.collection('users').insertMany([
        { UserID: 'USR-001', LoginName: 'admin', FullName: 'Dr. Zaigham Ali Anjum', PasswordHash: '123456', Role: 'Administrator', AssignedShift: 'Both' },
        { UserID: 'USR-002', LoginName: 'doctor', FullName: 'Dr. Amna Malik', PasswordHash: 'doctor123', Role: 'Doctor', AssignedShift: 1 },
        { UserID: 'USR-003', LoginName: 'pharmacist', FullName: 'M. Kashif Qadri', PasswordHash: 'pharmacy123', Role: 'Pharmacist', AssignedShift: 'Both' },
        { UserID: 'USR-004', LoginName: 'reception', FullName: 'Ayesha Bibi', PasswordHash: 'rec123', Role: 'Receptionist', AssignedShift: 1 },
        { UserID: 'USR-005', LoginName: 'accountant', FullName: 'Naveed Ahmad Sheikh', PasswordHash: 'acct123', Role: 'Accountant', AssignedShift: 'Both' }
      ]);
      console.log('✔️ Seeded: "users" credentials.');
    }

    // 3. Seed Patients
    const patientCount = await db.collection('patients').countDocuments();
    if (patientCount === 0) {
      await db.collection('patients').insertMany([
        {
          PatientID: 'PAT-001',
          PatientName: 'Zubair Ahmad Qureshi',
          Father_husband: 'Muhammad Ishaq',
          AgeYears: 42,
          Sex: 'Male',
          MaritalStatus: 'Married',
          Occupation: 'Government Servant',
          Address: 'House 42, Block C, Model Town',
          CityID: 1,
          Country: 'Pakistan',
          PhoneMobile: '0300-4567891',
          PhoneRes: '042-35851234',
          Email: 'zubair.qureshi@gmail.com',
          RegistrationDate: new Date('2026-06-15T09:30:00')
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
          CityID: 2,
          Country: 'Pakistan',
          PhoneMobile: '0321-7654321',
          PhoneRes: '041-8812345',
          Email: 'saima.tariq@yahoo.com',
          RegistrationDate: new Date('2026-06-20T17:15:00')
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
          CityID: 10,
          Country: 'Pakistan',
          PhoneMobile: '0333-5511223',
          PhoneOff: '051-9201234',
          Email: 'haris.ali@sbp.org.pk',
          RegistrationDate: new Date('2026-07-01T10:00:00')
        }
      ]);
      console.log('✔️ Seeded: "patients" directories.');
    }

    // 4. Seed Medicines / Items
    const itemCount = await db.collection('items').countDocuments();
    if (itemCount === 0) {
      await db.collection('items').insertMany([
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
      ]);
      console.log('✔️ Seeded: "items" medical formulas.');
    }

    // 5. Seed Lab Tests
    const labTestCount = await db.collection('lab_tests').countDocuments();
    if (labTestCount === 0) {
      await db.collection('lab_tests').insertMany([
        { TID: 'TST-001', TestName: 'Complete Blood Count (CBC)', Cost: 650 },
        { TID: 'TST-002', TestName: 'Blood Sugar Fasting / Random', Cost: 150 },
        { TID: 'TST-003', TestName: 'Urine Routine Examination', Cost: 300 },
        { TID: 'TST-004', TestName: 'Liver Function Tests (LFTs)', Cost: 1200 },
        { TID: 'TST-005', TestName: 'Renal Function Tests (RFTs)', Cost: 950 },
        { TID: 'TST-006', TestName: 'Lipid Profile', Cost: 1400 },
        { TID: 'TST-007', TestName: 'Hepatitis B & C Screening', Cost: 1100 },
        { TID: 'TST-008', TestName: 'Typhoid Dot Test', Cost: 750 }
      ]);
      console.log('✔️ Seeded: "lab_tests" diagnostic menu.');
    }

    // 6. Seed Accounting Ledger Chart of Accounts
    const acctsCount = await db.collection('accounts').countDocuments();
    if (acctsCount === 0) {
      await db.collection('accounts').insertMany([
        // Assets (100000 range)
        { FLID: 1, SLID: 101, TLID: 101001, TLName: 'Clinic Cash In Hand Account', AcBalance: 45000 },
        { FLID: 1, SLID: 101, TLID: 101002, TLName: 'Pharmacy Store Cash In Hand', AcBalance: 120000 },
        { FLID: 1, SLID: 101, TLID: 101003, TLName: 'OPD Appointment Registration Cash', AcBalance: 15000 },
        { FLID: 1, SLID: 102, TLID: 102001, TLName: 'Meezan Bank Ltd (A/C: 029381)', AcBalance: 850000 },
        { FLID: 1, SLID: 103, TLID: 103001, TLName: 'Pharmacy Medicine Stock Assets', AcBalance: 320000 },
        // Liabilities (200000 range)
        { FLID: 2, SLID: 201, TLID: 201001, TLName: 'Standard Supplier Accounts Payable', AcBalance: 65000 },
        // Equity (300000 range)
        { FLID: 3, SLID: 301, TLID: 301001, TLName: 'Dr. Zaigham Initial Capital', AcBalance: 1000000 },
        // Revenue (400000 range)
        { FLID: 4, SLID: 401, TLID: 401001, TLName: 'OPD Doctor Consultation Revenue', AcBalance: 240000 },
        { FLID: 4, SLID: 402, TLID: 402001, TLName: 'Pharmacy Store Sales Revenue', AcBalance: 185000 },
        // Expenses (500000 range)
        { FLID: 5, SLID: 501, TLID: 501001, TLName: 'Staff Salaries Expense Account', AcBalance: 110000 },
        { FLID: 5, SLID: 501, TLID: 501002, TLName: 'Pharmacy Sales Discounts Given', AcBalance: 4500 },
        { FLID: 5, SLID: 501, TLID: 501003, TLName: 'Pharmacy Sales Returns Expense', AcBalance: 1200 },
        { FLID: 5, SLID: 501, TLID: 501004, TLName: 'Pharmacy Returns Discount Reversal', AcBalance: 0 }
      ]);
      console.log('✔️ Seeded: "accounts" Chart of Accounts.');
    }

    // 7. Seed System Configurations
    const configCount = await db.collection('config').countDocuments();
    if (configCount === 0) {
      await db.collection('config').insertOne({
        ConfigID: 0,
        ClinicCIH_: 101001,
        StoreCIH_: 101002,
        StoreSale_: 402001,
        StoreDisc_: 501002,
        StoreSR_: 501003,
        StoreSRdisc_: 501004,
        AppCIH_: 101003,
        AppSale_: 401001
      });
      console.log('✔️ Seeded: "config" system properties.');
    }

    // 8. Seed Default Clinic & SMS Brand configs
    const clinicSettingsCount = await db.collection('clinic').countDocuments();
    if (clinicSettingsCount === 0) {
      await db.collection('clinic').insertOne({
        ClinicName: 'Punjab Clinic & Dental Surgery',
        ClinicLogoText: 'PC',
        DoctorName: 'Dr. Zaigham Ali Anjum',
        DoctorSignatureText: 'MBBS, FCPS - Medical Director',
        ClinicAddress: 'Main Boulevard, Near Shell Pump, Lahore',
        PhoneMobile: '0300-1234567',
        OPDFee: 1500
      });
      console.log('✔️ Seeded: "clinic" branding settings.');
    }

    const smsCount = await db.collection('sms').countDocuments();
    if (smsCount === 0) {
      await db.collection('sms').insertOne({
        Provider: 'twilio',
        Enabled: false,
        ApiUrl: 'https://api.twilio.com/2010-04-01/Accounts',
        ApiKey: 'AC-DOCK-KEY-EXAMPLE',
        SenderID: 'PK-CLINIC',
        BookingTemplate: 'Dear {name}, your appointment is confirmed for {date} in Shift {shift}. Token No is {token}.',
        RepeatTemplate: 'Dear {name}, it is time for your follow-up checkup. Please book online or call us.'
      });
      console.log('✔️ Seeded: "sms" gateway integration configurations.');
    }

    // 9. Seed Appointments & Tokens (Only if empty)
    const apptCount = await db.collection('appointments').countDocuments();
    if (apptCount === 0) {
      console.log('ℹ️ "appointments" collection is ready.');
    }
    const tokenCount = await db.collection('tokens').countDocuments();
    if (tokenCount === 0) {
      console.log('ℹ️ "tokens" collection is ready.');
    }

    // 11. Seed Suppliers Registry
    const suppliersCount = await db.collection('suppliers').countDocuments();
    if (suppliersCount === 0) {
      await db.collection('suppliers').insertMany([
        { SID: 'SUP-001', SupplierName: 'Standipharm Pakistan Ltd', Phone: '042-35112233', Address: 'Industrial Area, Kot Lakhpat, Lahore' },
        { SID: 'SUP-002', SupplierName: 'Getz Pharma Pakistan', Phone: '021-111111555', Address: 'Korangi Industrial Area, Karachi' },
        { SID: 'SUP-003', SupplierName: 'GSK Pakistan', Phone: '021-32315431', Address: 'Dockyard Road, West Wharf, Karachi' },
        { SID: 'SUP-004', SupplierName: 'Searle Company Limited', Phone: '042-35789123', Address: 'Gulberg III, Lahore' }
      ]);
      console.log('✔️ Seeded: "suppliers" registry.');
    }

    // 12. Seed Level-1 Accounts (fl_accounts)
    const flCount = await db.collection('fl_accounts').countDocuments();
    if (flCount === 0) {
      await db.collection('fl_accounts').insertMany([
        { FLID: 1, FLName: 'Assets' },
        { FLID: 2, FLName: 'Liabilities' },
        { FLID: 3, FLName: 'Equity' },
        { FLID: 4, FLName: 'Revenue' },
        { FLID: 5, FLName: 'Expenses' }
      ]);
      console.log('✔️ Seeded: "fl_accounts" Level-1 CoA.');
    }

    // 13. Seed Level-2 Accounts (sl_accounts)
    const slCount = await db.collection('sl_accounts').countDocuments();
    if (slCount === 0) {
      await db.collection('sl_accounts').insertMany([
        { FLID: 1, SLID: 101, SLName: 'Cash & Bank Balances' },
        { FLID: 1, SLID: 102, SLName: 'Receivables & Advances' },
        { FLID: 1, SLID: 103, SLName: 'Inventory Accounts' },
        { FLID: 2, SLID: 201, SLName: 'Accounts Payable' },
        { FLID: 2, SLID: 202, SLName: 'Accrued Liabilities' },
        { FLID: 3, SLID: 301, SLName: 'Capital Accounts' },
        { FLID: 4, SLID: 401, SLName: 'Clinical Services Income' },
        { FLID: 4, SLID: 402, SLName: 'Pharmacy Sales Income' },
        { FLID: 5, SLID: 501, SLName: 'Pharmacy Costs & Discounts' },
        { FLID: 5, SLID: 502, SLName: 'Operating & Admin Expenses' }
      ]);
      console.log('✔️ Seeded: "sl_accounts" Level-2 CoA.');
    }

    console.log('⭐ ALL MODULE COLLECTIONS SUCCESSFULLY INITIALIZED AND SEEDED IN MONGODB!');
    console.log('💡 TIP: You can now query these collections inside MongoDB Compass or Mongo Shell!');

  } catch (err) {
    console.error('❌ Database initialization script crashed!');
    console.error(err);
  } finally {
    await client.close();
    console.log('🔌 Connection closed safely.');
  }
}

initializeDatabase();
