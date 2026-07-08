/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  INITIAL_CITIES,
  INITIAL_ITEMS,
  INITIAL_SUPPLIERS,
  INITIAL_LAB_TESTS,
  INITIAL_FL_ACCOUNTS,
  INITIAL_SL_ACCOUNTS,
  INITIAL_TL_ACCOUNTS,
  INITIAL_CONFIG,
  INITIAL_USERS,
  ROLE_RIGHTS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_TOKENS
} from './data/initialData';

import {
  Patient,
  Appointment,
  Token,
  Item,
  Supplier,
  LabTest,
  Visit,
  VisitMedicine,
  MedicalCertificate,
  MedicalCertificateSBP,
  InvoiceHeader,
  InvoiceDetail,
  SRInvHeader,
  SRInvDetail,
  InvVchHeader,
  InvVchDetail,
  InvLedger,
  FLAccount,
  SLAccount,
  TLAccount,
  Config,
  VchHeader,
  VchDetail,
  ACLedger,
  User,
  UserRight
} from './types';

import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  BookOpen,
  UploadCloud,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, restricted: false },
  { id: 'patients', label: 'Patient Intake & Queue', icon: Users, restricted: true },
  { id: 'emr', label: 'Clinical EMR Desk', icon: FileText, restricted: true },
  { id: 'pharmacy', label: 'Pharmacy POS & Inventory', icon: ShoppingCart, restricted: true },
  { id: 'accounts', label: 'Double-Entry Accounting', icon: BookOpen, restricted: true },
  { id: 'uploads', label: 'Excel Upload & Barcode', icon: UploadCloud, restricted: true },
  { id: 'reports', label: 'Financial Audit & P&L', icon: BarChart3, restricted: true },
  { id: 'settings', label: 'Clinic Setup & Users', icon: Settings, restricted: true }
];

import Dashboard from './components/Dashboard';
import PatientDesk from './components/PatientDesk';
import EMRDesk from './components/EMRDesk';
import PharmacyPOS from './components/PharmacyPOS';
import AccountingDesk from './components/AccountingDesk';
import UploadingDesk from './components/UploadingDesk';
import SettingsDesk from './components/SettingsDesk';
import ReportingDesk from './components/ReportingDesk';
import LoginDesk from './components/LoginDesk';
import { ClinicSettings, SmsSettings, SqlServerSettings } from './types';

export default function App() {
  // Users List State (backed up by local storage)
  const [usersList, setUsersList] = useState<User[]>(() => {
    const cached = localStorage.getItem('cms_users');
    return cached ? JSON.parse(cached) : INITIAL_USERS;
  });

  // Current Active Applet Session State
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const cachedUser = localStorage.getItem('cms_current_user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {}
    }
    const cachedUsersList = localStorage.getItem('cms_users');
    const uList = cachedUsersList ? JSON.parse(cachedUsersList) : INITIAL_USERS;
    return uList[0]; // Default: Admin
  });

  useEffect(() => {
    localStorage.setItem('cms_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Clinic setup settings
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => {
    const cached = localStorage.getItem('cms_clinic_settings');
    if (cached) return JSON.parse(cached);
    return {
      ClinicName: 'Punjab Clinic',
      ClinicLogoText: 'P',
      DoctorName: 'Dr. Amjad Malik',
      DoctorSignatureText: 'Dr. Amjad Malik, MBBS, FCPS',
      ClinicAddress: 'Saddar Bazar, Lahore Cantt',
      PhoneMobile: '+92-42-36612345',
      OPDFee: 1500
    };
  });

  // SMS Service settings
  const [smsSettings, setSmsSettings] = useState<SmsSettings>(() => {
    const cached = localStorage.getItem('cms_sms_settings');
    if (cached) return JSON.parse(cached);
    return {
      Provider: 'twilio',
      Enabled: true,
      ApiUrl: 'https://api.twilio.com/2010-04-01/Accounts/AC72680cf793/Messages.json',
      ApiKey: 'SG.twilio_secret_token_placeholder_key',
      SenderID: 'PUNJAB_CL',
      BookingTemplate: 'Dear {PATIENT}, your OPD Token No. {TOKEN} for {SHIFT} Shift is booked successfully at Punjab Clinic for {DATE}. Ref ID: {APPID}.',
      RepeatTemplate: 'Dear {PATIENT}, your Follow-up OPD Token No. {TOKEN} ({SHIFT} Shift) is booked at Punjab Clinic for {DATE}. Ref ID: {APPID}.'
    };
  });

  // SQL Server settings
  const [sqlServerSettings, setSqlServerSettings] = useState<SqlServerSettings>(() => {
    const cached = localStorage.getItem('cms_sql_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      // If cached settings correspond to local SQL, discard and reset to remote
      if (parsed.ServerAddress === 'DBSERVER' || parsed.ServerAddress === 'DBSERVER\\SQLEXPRESS' || parsed.BridgeUrl) {
        localStorage.removeItem('cms_sql_settings');
      } else {
        return parsed;
      }
    }
    return {
      ServerAddress: 'punjab-clinic-mssql.database.windows.net',
      Port: 1433,
      DatabaseName: 'punjab_clinic_db',
      Username: 'sa_punjab_admin',
      PasswordHash: 'P@kistan123_Secure',
      IntegratedSecurity: false,
      SyncEnabled: true,
      ConnectionString: 'Server=tcp:punjab-clinic-mssql.database.windows.net,1433;Initial Catalog=punjab_clinic_db;Persist Security Info=False;User ID=sa_punjab_admin;Password=P@kistan123_Secure;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;'
    };
  });

  // Authentication validation state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cms_is_authenticated') === 'true';
  });


  // Master Database States (backed up by client side localStorage for robust persistence)
  const [patients, setPatients] = useState<Patient[]>(() => {
    const cached = localStorage.getItem('cms_patients');
    return cached ? JSON.parse(cached) : INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const cached = localStorage.getItem('cms_appointments');
    return cached ? JSON.parse(cached) : INITIAL_APPOINTMENTS;
  });

  const [tokens, setTokens] = useState<Token[]>(() => {
    const cached = localStorage.getItem('cms_tokens');
    return cached ? JSON.parse(cached) : INITIAL_TOKENS;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const cached = localStorage.getItem('cms_items');
    return cached ? JSON.parse(cached) : INITIAL_ITEMS;
  });

  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [labTests, setLabTests] = useState<LabTest[]>(() => {
    const cached = localStorage.getItem('cms_lab_tests');
    return cached ? JSON.parse(cached) : INITIAL_LAB_TESTS;
  });

  useEffect(() => {
    localStorage.setItem('cms_lab_tests', JSON.stringify(labTests));
  }, [labTests]);

  const [visits, setVisits] = useState<Visit[]>(() => {
    const cached = localStorage.getItem('cms_visits');
    return cached ? JSON.parse(cached) : [];
  });

  const [visitMedicines, setVisitMedicines] = useState<VisitMedicine[]>(() => {
    const cached = localStorage.getItem('cms_visit_medicines');
    return cached ? JSON.parse(cached) : [];
  });

  const [medicalCertificates, setMedicalCertificates] = useState<MedicalCertificate[]>(() => {
    const cached = localStorage.getItem('cms_med_certs');
    return cached ? JSON.parse(cached) : [];
  });

  const [sbpCertificates, setSbpCertificates] = useState<MedicalCertificateSBP[]>(() => {
    const cached = localStorage.getItem('cms_sbp_certs');
    return cached ? JSON.parse(cached) : [];
  });

  const [invoices, setInvoices] = useState<InvoiceHeader[]>(() => {
    const cached = localStorage.getItem('cms_invoices');
    return cached ? JSON.parse(cached) : [];
  });

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>(() => {
    const cached = localStorage.getItem('cms_invoice_details');
    return cached ? JSON.parse(cached) : [];
  });

  const [salesReturns, setSalesReturns] = useState<SRInvHeader[]>(() => {
    const cached = localStorage.getItem('cms_sales_returns');
    return cached ? JSON.parse(cached) : [];
  });

  const [grns, setGrns] = useState<InvVchHeader[]>(() => {
    const cached = localStorage.getItem('cms_grns');
    return cached ? JSON.parse(cached) : [];
  });

  const [grnDetails, setGrnDetails] = useState<InvVchDetail[]>(() => {
    const cached = localStorage.getItem('cms_grn_details');
    return cached ? JSON.parse(cached) : [];
  });

  const [invLedger, setInvLedger] = useState<InvLedger[]>(() => {
    const cached = localStorage.getItem('cms_inv_ledger');
    return cached ? JSON.parse(cached) : [];
  });

  const [tlAccounts, setTlAccounts] = useState<TLAccount[]>(() => {
    const cached = localStorage.getItem('cms_tl_accounts');
    return cached ? JSON.parse(cached) : INITIAL_TL_ACCOUNTS;
  });

  const [vouchers, setVouchers] = useState<VchHeader[]>(() => {
    const cached = localStorage.getItem('cms_vouchers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as VchHeader[];
        const unique: VchHeader[] = [];
        const seen = new Set<string>();
        for (const v of parsed) {
          if (v && v.VchNo && !seen.has(v.VchNo)) {
            seen.add(v.VchNo);
            unique.push(v);
          }
        }
        return unique;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [voucherDetails, setVoucherDetails] = useState<VchDetail[]>(() => {
    const cached = localStorage.getItem('cms_voucher_details');
    return cached ? JSON.parse(cached) : [];
  });

  const [acLedger, setAcLedger] = useState<ACLedger[]>(() => {
    const cached = localStorage.getItem('cms_ac_ledger');
    return cached ? JSON.parse(cached) : [];
  });

  // Save states to local storage on mutation
  useEffect(() => {
    localStorage.setItem('cms_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('cms_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('cms_tokens', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('cms_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('cms_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('cms_visit_medicines', JSON.stringify(visitMedicines));
  }, [visitMedicines]);

  useEffect(() => {
    localStorage.setItem('cms_med_certs', JSON.stringify(medicalCertificates));
  }, [medicalCertificates]);

  useEffect(() => {
    localStorage.setItem('cms_sbp_certs', JSON.stringify(sbpCertificates));
  }, [sbpCertificates]);

  useEffect(() => {
    localStorage.setItem('cms_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('cms_invoice_details', JSON.stringify(invoiceDetails));
  }, [invoiceDetails]);

  useEffect(() => {
    localStorage.setItem('cms_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('cms_grns', JSON.stringify(grns));
  }, [grns]);

  useEffect(() => {
    localStorage.setItem('cms_grn_details', JSON.stringify(grnDetails));
  }, [grnDetails]);

  useEffect(() => {
    localStorage.setItem('cms_inv_ledger', JSON.stringify(invLedger));
  }, [invLedger]);

  useEffect(() => {
    localStorage.setItem('cms_tl_accounts', JSON.stringify(tlAccounts));
  }, [tlAccounts]);

  useEffect(() => {
    localStorage.setItem('cms_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('cms_voucher_details', JSON.stringify(voucherDetails));
  }, [voucherDetails]);

  useEffect(() => {
    localStorage.setItem('cms_ac_ledger', JSON.stringify(acLedger));
  }, [acLedger]);

  useEffect(() => {
    localStorage.setItem('cms_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('cms_clinic_settings', JSON.stringify(clinicSettings));
  }, [clinicSettings]);

  // Active User Rights Matrix helper
  const currentUserRights = ROLE_RIGHTS[currentUser.Role];

  // Check if a tab is accessible based on permissions
  const isAccessible = (menuId: string) => {
    if (menuId === 'settings') return currentUser.Role === 'Administrator';
    if (menuId === 'uploads') return currentUser.Role === 'Administrator';
    if (menuId === 'reports') return currentUser.Role === 'Administrator' || currentUser.Role === 'Accountant';

    const right = currentUserRights.find((r) => r.MenuID === menuId);
    return right ? right.Status : false;
  };

  // -------------------------------------------------------------
  // CORE DB MUTATORS & AUTOMATED DOUBLE-ENTRY ENGINES
  // -------------------------------------------------------------

  // Add Patient Intake file
  const handleAddPatient = (newPatient: Patient) => {
    setPatients((prev) => [...prev, newPatient]);
  };

  // Book OPD Consultation Appointment
  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [...prev, newApp]);
  };

  // Queue tokens waiting list
  const handleAddToken = (newToken: Token) => {
    setTokens((prev) => [...prev, newToken]);
  };

  // Helper: Update third level account live balance algebraically
  const updateAccountBalanceAlgebraically = (tlid: number, debitAmt: number, creditAmt: number, currentAccountsList: TLAccount[]) => {
    return currentAccountsList.map((acc) => {
      if (acc.TLID === tlid) {
        // Assets (Prefix 1) & Expenses (Prefix 5): Debit increases, Credit decreases balance
        // Liabilities (Prefix 2), Equity (Prefix 3), Revenue (Prefix 4): Credit increases, Debit decreases balance
        const firstDigit = Math.floor(tlid / 100000);
        let delta = 0;
        if (firstDigit === 1 || firstDigit === 5) {
          delta = debitAmt - creditAmt;
        } else {
          delta = creditAmt - debitAmt;
        }
        return {
          ...acc,
          AcBalance: acc.AcBalance + delta
        };
      }
      return acc;
    });
  };

  // Helper: Append voucher details into GL General Ledger Log
  const createLedgerPostingLog = (vchNo: string, tlid: number, debit: number, credit: number, remarks: string, currentBalance: number) => {
    const nextLogId = `GL-POST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const firstDigit = Math.floor(tlid / 100000);
    let updatedBalance = currentBalance;
    if (firstDigit === 1 || firstDigit === 5) {
      updatedBalance += (debit - credit);
    } else {
      updatedBalance += (credit - debit);
    }

    return {
      ACLedgerID: nextLogId,
      VchNo: vchNo,
      TLID: tlid,
      TxDate: new Date().toISOString().split('T')[0],
      Debit: debit,
      Credit: credit,
      Remarks: remarks,
      BalanceAfter: updatedBalance
    };
  };

  // Update Appointment queue workflows
  const handleUpdateAppointmentStatus = (appId: string, status: 1 | 2 | 3 | 4) => {
    // 1. Find the target appointment to see if its status is changing to 4 and if it's not already 4
    const targetApp = appointments.find(a => a.AppointmentID === appId);
    if (!targetApp) return;

    // Check if we are transitioning to status 4
    const isTransitioningToPaid = status === 4 && targetApp.Status !== 4;

    // 2. Update appointments list
    setAppointments((prevApps) =>
      prevApps.map((app) => (app.AppointmentID === appId ? { ...app, Status: status } : app))
    );

    // 3. Trigger financial postings outside of the setAppointments updater callback!
    if (isTransitioningToPaid) {
      const opdRate = targetApp.FeeCharged;
      const nextVchNo = `CRV-OPD-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const shift = targetApp.Shift || 1;

      // Shift-based Doctor Cash and Revenue Account mapping
      const targetCashTLID = shift === 1 ? 101001 : 101002;
      const targetRevTLID = shift === 1 ? 401101 : 401201;

      // 1. Save voucher header
      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `OPD Consultation Fee collected. Patient ID: ${targetApp.PatientID}, Shift: ${shift}`
      };

      // 2. Debit cash and Credit Revenue details
      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: opdRate,
        Credit: 0,
        Description: `OPD Consultation Ticket cash collected`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetRevTLID,
        Debit: 0,
        Credit: opdRate,
        Description: `OPD Ticket Revenue posted`
      };

      setVouchers((prevVch) => {
        // Double check to make sure nextVchNo is unique to prevent duplicate key issue in edge cases
        let finalVchNo = nextVchNo;
        let suffixNum = 1;
        while (prevVch.some(v => v.VchNo === finalVchNo)) {
          finalVchNo = `${nextVchNo}-${suffixNum++}`;
        }
        newVchHeader.VchNo = finalVchNo;
        detailDebit.VchNo = finalVchNo;
        detailCredit.VchNo = finalVchNo;
        return [...prevVch, newVchHeader];
      });

      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      // 3. Update Chart of Accounts balances live
      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, opdRate, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(targetRevTLID, 0, opdRate, updated);
        
        // 4. Record transactions in ACLedger
        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === targetRevTLID)?.AcBalance || 0;

        // Since newVchHeader.VchNo is updated dynamically, we must use the correct final VchNo
        const finalVchNo = newVchHeader.VchNo;
        const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, opdRate, 0, `OPD Ticket Payment Received (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(finalVchNo, targetRevTLID, 0, opdRate, `OPD Consultation Revenue Mapped (Shift ${shift})`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });
    }
  };

  const handleUpdateTokenStatus = (tokenNo: number, shift: 1 | 2, status: 1 | 2 | 3) => {
    setTokens((prev) =>
      prev.map((t) => (t.TokenNo === tokenNo && t.Shift === shift ? { ...t, Status: status } : t))
    );
  };

  // EMR Doctor Consult Assessment
  const handleAddVisit = (newVisit: Visit, medicines: VisitMedicine[], testIds: string[]) => {
    setVisits((prev) => [...prev, newVisit]);
    setVisitMedicines((prev) => [...prev, ...medicines]);

    const assocToken = tokens.find(t => t.PatientID === newVisit.PatientID && t.Status === 2);
    const shift = assocToken ? assocToken.Shift : (currentUser.AssignedShift !== 'Both' && typeof currentUser.AssignedShift === 'number' ? currentUser.AssignedShift : 1);
    const targetCashTLID = shift === 1 ? 101001 : 101002;
    const targetRevTLID = shift === 1 ? 401101 : 401201;

    // Process Consultation Fee Payments & Update Appointment status
    if (newVisit.Status === 2) {
      const targetApp = appointments.find(a => a.PatientID === newVisit.PatientID && a.Status !== 3 && a.Status !== 4);
      const isPaid = newVisit.ConsultationPaymentOption === 'Paid - Cash' || newVisit.ConsultationPaymentOption === 'Paid - Online/Card';
      
      if (targetApp) {
        handleUpdateAppointmentStatus(targetApp.AppointmentID, isPaid ? 4 : 2);
      } else if (isPaid && newVisit.ConsultationFee && newVisit.ConsultationFee > 0) {
        const opdRate = newVisit.ConsultationFee;
        const nextVchNo = `CRV-OPD-WALK-${String(vouchers.length + 1).padStart(4, '0')}`;
        const journalDate = new Date().toISOString().split('T')[0];

        const newVchHeader: VchHeader = {
          VchNo: nextVchNo,
          VchDate: journalDate,
          VchType: 'CRV',
          Status: 2, // Posted
          Remarks: `OPD Walk-in Consultation Fee collected. Patient ID: ${newVisit.PatientID}, Shift: ${shift}`
        };

        const detailDebit: VchDetail = {
          VchNo: nextVchNo,
          TLID: targetCashTLID,
          Debit: opdRate,
          Credit: 0,
          Description: `Walk-in Consultation Ticket cash collected`
        };

        const detailCredit: VchDetail = {
          VchNo: nextVchNo,
          TLID: targetRevTLID,
          Debit: 0,
          Credit: opdRate,
          Description: `Walk-in OPD Ticket Revenue posted`
        };

        setVouchers((prevVch) => {
          let finalVchNo = nextVchNo;
          let suffixNum = 1;
          while (prevVch.some(v => v.VchNo === finalVchNo)) {
            finalVchNo = `${nextVchNo}-${suffixNum++}`;
          }
          newVchHeader.VchNo = finalVchNo;
          detailDebit.VchNo = finalVchNo;
          detailCredit.VchNo = finalVchNo;
          return [...prevVch, newVchHeader];
        });

        setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

        setTlAccounts((prevAccs) => {
          let updated = updateAccountBalanceAlgebraically(targetCashTLID, opdRate, 0, prevAccs);
          updated = updateAccountBalanceAlgebraically(targetRevTLID, 0, opdRate, updated);

          const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
          const accCreditBal = prevAccs.find(a => a.TLID === targetRevTLID)?.AcBalance || 0;

          const finalVchNo = newVchHeader.VchNo;
          const logDebit = createLedgerPostingLog(finalVchNo, targetCashTLID, opdRate, 0, `OPD Walk-in Ticket Paid (Shift ${shift})`, accDebitBal);
          const logCredit = createLedgerPostingLog(finalVchNo, targetRevTLID, 0, opdRate, `OPD Walk-in Consultation Revenue (Shift ${shift})`, accCreditBal);

          setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

          return updated;
        });
      }
    }

    // If visit is posted/finalized (Status = 2) and diagnostic lab checks exist
    if (newVisit.Status === 2 && testIds.length > 0) {
      // Calculate total diagnostics cost
      const labCostSum = testIds.reduce((sum, tid) => {
        const test = labTests.find((t) => t.TID === tid);
        return sum + (test ? test.Cost : 0);
      }, 0);

      const nextVchNo = `CRV-LAB-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];

      // 1. Create financial cash receipt voucher
      const newVchHeader: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `Advised Lab test billing. Visit ID: ${newVisit.VisitID}, Shift: ${shift}`
      };

      // 2. Debit Doctor Cash (for shift) and Credit Lab Revenue (401002)
      const detailDebit: VchDetail = {
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: labCostSum,
        Credit: 0,
        Description: `Lab tests fees collection`
      };

      const detailCredit: VchDetail = {
        VchNo: nextVchNo,
        TLID: 401002, // Lab & Diagnostics Revenue
        Debit: 0,
        Credit: labCostSum,
        Description: `Diagnostics test revenue mapped`
      };

      setVouchers((prevVch) => [...prevVch, newVchHeader]);
      setVoucherDetails((prevDet) => [...prevDet, detailDebit, detailCredit]);

      // 3. Update Chart of Accounts balances live
      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, labCostSum, 0, prevAccs);
        updated = updateAccountBalanceAlgebraically(401002, 0, labCostSum, updated);
        
        // 4. Record transactions in ACLedger
        const accDebitBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const accCreditBal = prevAccs.find(a => a.TLID === 401002)?.AcBalance || 0;

        const logDebit = createLedgerPostingLog(nextVchNo, targetCashTLID, labCostSum, 0, `Advised Lab tests collection (Shift ${shift})`, accDebitBal);
        const logCredit = createLedgerPostingLog(nextVchNo, 401002, 0, labCostSum, `Diagnostics test revenue balance`, accCreditBal);

        setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

        return updated;
      });
    }
  };

  const handleAddCertificate = (newCert: MedicalCertificate) => {
    setMedicalCertificates((prev) => [...prev, newCert]);
  };

  const handleAddSbpCertificate = (newSbpCert: MedicalCertificateSBP) => {
    setSbpCertificates((prev) => [...prev, newSbpCert]);
  };

  // Pharmacy Point of Sale Checkout
  const handleAddInvoice = (newHeader: InvoiceHeader, details: InvoiceDetail[]) => {
    setInvoices((prev) => [...prev, newHeader]);
    setInvoiceDetails((prev) => [...prev, ...details]);

    // If checkout is posted (Status = 2)
    if (newHeader.Status === 2) {
      
      // 1. Deduct CStock in items and write InvLedger transactions
      let cogsSum = 0;
      setItems((prevItems) => {
        return prevItems.map((itm) => {
          const matchedDetails = details.find((d) => d.ItemID === itm.ItemID);
          if (matchedDetails) {
            const updatedStock = itm.CStock - matchedDetails.Qty;
            cogsSum += itm.PurchasePrice * matchedDetails.Qty;

            // Log ledger movement
            const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const newLedgerRow: InvLedger = {
              LedgerID: nextLedgerId,
              ItemID: itm.ItemID,
              DocType: 'INV',
              DocNo: newHeader.InvoiceNo,
              TxDate: newHeader.InvoiceDate,
              QtyIn: 0,
              QtyOut: matchedDetails.Qty,
              Balance: updatedStock
            };
            setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

            return { ...itm, CStock: updatedStock };
          }
          return itm;
        });
      });

      // 2. Financial Double-Entry Postings
      const nextVchNo = `CRV-PH-${String(vouchers.length + 1).padStart(4, '0')}`;
      const journalDate = new Date().toISOString().split('T')[0];
      const shift = newHeader.shift || 1;

      // Shift-based Doctor Cash account
      const targetCashTLID = shift === 1 ? 101001 : 101002;

      let clinicalSum = 0;
      let patentSum = 0;
      let storeSum = 0;

      details.forEach((d) => {
        const type = d.MedicineType || 'S';
        if (type === 'C') {
          clinicalSum += d.LineTotal;
        } else if (type === 'P') {
          patentSum += d.LineTotal;
        } else {
          storeSum += d.LineTotal;
        }
      });

      const clinicalTLID = shift === 1 ? 401102 : 401202;
      const patentTLID = shift === 1 ? 401103 : 401203;
      const storeTLID = shift === 1 ? 401104 : 401204;

      const vchHdr: VchHeader = {
        VchNo: nextVchNo,
        VchDate: journalDate,
        VchType: 'CRV',
        Status: 2, // Posted
        Remarks: `Pharmacy Checkout invoice. Ref: ${newHeader.InvoiceNo}, Shift: ${shift}`
      };

      const detailsRows: VchDetail[] = [];
      detailsRows.push({
        VchNo: nextVchNo,
        TLID: targetCashTLID,
        Debit: newHeader.NetAmount,
        Credit: 0,
        Description: `Pharmacy cash receipt checkout (Shift ${shift})`
      });

      if (newHeader.Discount > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: INITIAL_CONFIG.StoreDisc_,
          Debit: newHeader.Discount,
          Credit: 0,
          Description: `Pharmacy customer discount allowed`
        });
      }

      if (clinicalSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: clinicalTLID,
          Debit: 0,
          Credit: clinicalSum,
          Description: `Clinical medicine sales revenue (Shift ${shift})`
        });
      }

      if (patentSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: patentTLID,
          Debit: 0,
          Credit: patentSum,
          Description: `Patent medicine sales revenue (Shift ${shift})`
        });
      }

      if (storeSum > 0) {
        detailsRows.push({
          VchNo: nextVchNo,
          TLID: storeTLID,
          Debit: 0,
          Credit: storeSum,
          Description: `Store medicine sales revenue (Shift ${shift})`
        });
      }

      // perpetual inventory values
      detailsRows.push({
        VchNo: nextVchNo,
        TLID: 501001, // Cost of Goods Sold
        Debit: cogsSum,
        Credit: 0,
        Description: `Pharmacy perpetual COGS clearance`
      });

      detailsRows.push({
        VchNo: nextVchNo,
        TLID: 103001, // Stock Inventory Asset
        Debit: 0,
        Credit: cogsSum,
        Description: `Pharmacy inventory asset clearance`
      });

      setVouchers((prevVch) => [...prevVch, vchHdr]);
      setVoucherDetails((prevDet) => [...prevDet, ...detailsRows]);

      // 3. Update Chart of Accounts balances live
      setTlAccounts((prevAccs) => {
        let updated = updateAccountBalanceAlgebraically(targetCashTLID, newHeader.NetAmount, 0, prevAccs);
        if (newHeader.Discount > 0) {
          updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreDisc_, newHeader.Discount, 0, updated);
        }
        if (clinicalSum > 0) {
          updated = updateAccountBalanceAlgebraically(clinicalTLID, 0, clinicalSum, updated);
        }
        if (patentSum > 0) {
          updated = updateAccountBalanceAlgebraically(patentTLID, 0, patentSum, updated);
        }
        if (storeSum > 0) {
          updated = updateAccountBalanceAlgebraically(storeTLID, 0, storeSum, updated);
        }
        
        // perpetual inventory balances
        updated = updateAccountBalanceAlgebraically(501001, cogsSum, 0, updated);
        updated = updateAccountBalanceAlgebraically(103001, 0, cogsSum, updated);

        // 4. Record transactions in ACLedger
        const storeCashBal = prevAccs.find(a => a.TLID === targetCashTLID)?.AcBalance || 0;
        const discountBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreDisc_)?.AcBalance || 0;
        const clinicalBal = prevAccs.find(a => a.TLID === clinicalTLID)?.AcBalance || 0;
        const patentBal = prevAccs.find(a => a.TLID === patentTLID)?.AcBalance || 0;
        const storeBal = prevAccs.find(a => a.TLID === storeTLID)?.AcBalance || 0;
        const cogsBal = prevAccs.find(a => a.TLID === 501001)?.AcBalance || 0;
        const stockBal = prevAccs.find(a => a.TLID === 103001)?.AcBalance || 0;

        const logs: ACLedger[] = [];
        logs.push(createLedgerPostingLog(nextVchNo, targetCashTLID, newHeader.NetAmount, 0, `Store cash sales receipt (Shift ${shift})`, storeCashBal));
        if (newHeader.Discount > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreDisc_, newHeader.Discount, 0, `Store sales discount debit`, discountBal));
        }
        if (clinicalSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, clinicalTLID, 0, clinicalSum, `Clinical medicine revenue credit`, clinicalBal));
        }
        if (patentSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, patentTLID, 0, patentSum, `Patent medicine revenue credit`, patentBal));
        }
        if (storeSum > 0) {
          logs.push(createLedgerPostingLog(nextVchNo, storeTLID, 0, storeSum, `Store medicine revenue credit`, storeBal));
        }
        logs.push(createLedgerPostingLog(nextVchNo, 501001, cogsSum, 0, `Perpetual COGS clearance debit`, cogsBal));
        logs.push(createLedgerPostingLog(nextVchNo, 103001, 0, cogsSum, `Perpetual Inventory asset credit`, stockBal));

        setAcLedger((prevLogs) => [...prevLogs, ...logs]);

        return updated;
      });
    }
  };

  // Pharmacy Sales Returns Reversal
  const handleAddSalesReturn = (srHeader: SRInvHeader, srDetails: SRInvDetail[]) => {
    setSalesReturns((prev) => [...prev, srHeader]);

    // Reinstate stock & write InvLedger transactions
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matchedDetails = srDetails.find((d) => d.ItemID === itm.ItemID);
        if (matchedDetails) {
          const updatedStock = itm.CStock + matchedDetails.QtyReturned;

          const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const newLedgerRow: InvLedger = {
            LedgerID: nextLedgerId,
            ItemID: itm.ItemID,
            DocType: 'SR',
            DocNo: srHeader.SRInvoiceNo,
            TxDate: srHeader.ReturnDate,
            QtyIn: matchedDetails.QtyReturned,
            QtyOut: 0,
            Balance: updatedStock
          };
          setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

          return { ...itm, CStock: updatedStock };
        }
        return itm;
      });
    });

    // Accounting posting: Debit Sales Returns (StoreSR_ = 501003) & Credit Pharmacy Cash (StoreCIH_ = 101002)
    const nextVchNo = `CPV-SR-${String(vouchers.length + 1).padStart(4, '0')}`;
    const journalDate = new Date().toISOString().split('T')[0];

    const vchHdr: VchHeader = {
      VchNo: nextVchNo,
      VchDate: journalDate,
      VchType: 'CPV',
      Status: 2, // Posted
      Remarks: `Pharmacy Sales Return reversal. Original Ref: ${srHeader.OriginalInvoiceNo}`
    };

    const dRowDebit: VchDetail = {
      VchNo: nextVchNo,
      TLID: INITIAL_CONFIG.StoreSR_,
      Debit: srHeader.NetPaid,
      Credit: 0,
      Description: `Pharmacy Sales Return reversal debit`
    };

    const dRowCredit: VchDetail = {
      VchNo: nextVchNo,
      TLID: INITIAL_CONFIG.StoreCIH_,
      Debit: 0,
      Credit: srHeader.NetPaid,
      Description: `Pharmacy refund paid credit`
    };

    setVouchers((prevVch) => [...prevVch, vchHdr]);
    setVoucherDetails((prevDet) => [...prevDet, dRowDebit, dRowCredit]);

    // COA update
    setTlAccounts((prevAccs) => {
      let updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreSR_, srHeader.NetPaid, 0, prevAccs);
      updated = updateAccountBalanceAlgebraically(INITIAL_CONFIG.StoreCIH_, 0, srHeader.NetPaid, updated);
      
      const srBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreSR_)?.AcBalance || 0;
      const cashBal = prevAccs.find(a => a.TLID === INITIAL_CONFIG.StoreCIH_)?.AcBalance || 0;

      const logDebit = createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreSR_, srHeader.NetPaid, 0, `Sales return debit`, srBal);
      const logCredit = createLedgerPostingLog(nextVchNo, INITIAL_CONFIG.StoreCIH_, 0, srHeader.NetPaid, `Sales return cash refund paid`, cashBal);

      setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

      return updated;
    });
  };

  // Supplier GRN Inward
  const handleAddGRN = (vchHeader: InvVchHeader, vchDetails: InvVchDetail[]) => {
    setGrns((prev) => [...prev, vchHeader]);
    setGrnDetails((prev) => [...prev, ...vchDetails]);

    // Capitalize inventory levels & logs InvLedger
    let grnTotalCostSum = 0;
    setItems((prevItems) => {
      return prevItems.map((itm) => {
        const matchedDetails = vchDetails.find((d) => d.ItemID === itm.ItemID);
        if (matchedDetails) {
          const updatedStock = itm.CStock + matchedDetails.QtyIn;
          grnTotalCostSum += (matchedDetails.QtyIn * matchedDetails.PurchaseRate);

          const nextLedgerId = `LEDG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          const newLedgerRow: InvLedger = {
            LedgerID: nextLedgerId,
            ItemID: itm.ItemID,
            DocType: 'GRN',
            DocNo: vchHeader.VchNo,
            TxDate: vchHeader.VchDate,
            QtyIn: matchedDetails.QtyIn,
            QtyOut: 0,
            Balance: updatedStock
          };
          setInvLedger((prevLedg) => [...prevLedg, newLedgerRow]);

          return { ...itm, CStock: updatedStock, PurchasePrice: matchedDetails.PurchaseRate };
        }
        return itm;
      });
    });

    // Accounting postings: Debit Stock Inventory (103001) & Credit Supplier accounts payable (e.g. SUP-001 Standipharm = 201001)
    const nextVchNo = `JV-GRN-${String(vouchers.length + 1).padStart(4, '0')}`;
    const journalDate = new Date().toISOString().split('T')[0];

    // Determine target supplier payable account code mapping (SUP-001 Standipharm = 201001, SUP-002 Getz = 201002, others defaults 201001)
    const payableAccountID = vchHeader.SID === 'SUP-002' ? 201002 : 201001;

    const vchHdr: VchHeader = {
      VchNo: nextVchNo,
      VchDate: journalDate,
      VchType: 'JV',
      Status: 2, // Posted
      Remarks: `Supplier Goods Inward GRN. Supplier Ref: ${vchHeader.SID}`
    };

    const dRowDebit: VchDetail = {
      VchNo: nextVchNo,
      TLID: 103001, // Stock Inventory Account
      Debit: grnTotalCostSum,
      Credit: 0,
      Description: `GRN inventory asset capitalization`
    };

    const dRowCredit: VchDetail = {
      VchNo: nextVchNo,
      TLID: payableAccountID,
      Debit: 0,
      Credit: grnTotalCostSum,
      Description: `GRN Accounts Payable to supplier`
    };

    setVouchers((prevVch) => [...prevVch, vchHdr]);
    setVoucherDetails((prevDet) => [...prevDet, dRowDebit, dRowCredit]);

    // COA update
    setTlAccounts((prevAccs) => {
      let updated = updateAccountBalanceAlgebraically(103001, grnTotalCostSum, 0, prevAccs);
      updated = updateAccountBalanceAlgebraically(payableAccountID, 0, grnTotalCostSum, updated);
      
      const stockBal = prevAccs.find(a => a.TLID === 103001)?.AcBalance || 0;
      const APBal = prevAccs.find(a => a.TLID === payableAccountID)?.AcBalance || 0;

      const logDebit = createLedgerPostingLog(nextVchNo, 103001, grnTotalCostSum, 0, `GRN asset capitalization debit`, stockBal);
      const logCredit = createLedgerPostingLog(nextVchNo, payableAccountID, 0, grnTotalCostSum, `Accounts Payable supplier credit`, APBal);

      setAcLedger((prevLogs) => [...prevLogs, logDebit, logCredit]);

      return updated;
    });
  };

  // Direct Double Entry Voucher Management
  const handleAddVoucher = (newVch: VchHeader, details: VchDetail[]) => {
    setVouchers((prev) => [...prev, newVch]);
    setVoucherDetails((prev) => [...prev, ...details]);

    // Apply journal lines updates directly into Chart of Accounts
    setTlAccounts((prevAccs) => {
      let updated = [...prevAccs];
      
      details.forEach((line) => {
        updated = updateAccountBalanceAlgebraically(line.TLID, line.Debit, line.Credit, updated);
        
        // Log transaction in GL
        const currentBal = prevAccs.find(a => a.TLID === line.TLID)?.AcBalance || 0;
        const logLine = createLedgerPostingLog(newVch.VchNo, line.TLID, line.Debit, line.Credit, line.Description || newVch.Remarks, currentBal);
        
        setAcLedger((prevLogs) => [...prevLogs, logLine]);
      });

      return updated;
    });
  };

  const handleUpdateItemStock = (itemId: string, newStock: number) => {
    setItems((prev) => prev.map((i) => (i.ItemID === itemId ? { ...i, CStock: newStock } : i)));
  };

  const handleUpdateAccountBalance = (tlid: number, balanceAmt: number) => {
    setTlAccounts((prev) => prev.map((a) => (a.TLID === tlid ? { ...a, AcBalance: balanceAmt } : a)));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('cms_current_user', JSON.stringify(user));
    localStorage.setItem('cms_is_authenticated', 'true');
    // Auto route to corresponding desk based on staff user role
    if (user.Role === 'Doctor') {
      setActiveTab('emr');
    } else if (user.Role === 'Pharmacist') {
      setActiveTab('pharmacy');
    } else if (user.Role === 'Accountant') {
      setActiveTab('accounts');
    } else if (user.Role === 'Receptionist') {
      setActiveTab('patients');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cms_is_authenticated');
    localStorage.removeItem('cms_current_user');
  };


  // Filter lists based on assigned shift (1=Morning, 2=Evening, Both)
  const activeShiftFilter = currentUser.AssignedShift;

  const filteredAppointments = appointments.filter(app => {
    if (activeShiftFilter === 1) return app.Shift === 1;
    if (activeShiftFilter === 2) return app.Shift === 2;
    return true;
  });

  const filteredTokens = tokens.filter(tok => {
    if (activeShiftFilter === 1) return tok.Shift === 1;
    if (activeShiftFilter === 2) return tok.Shift === 2;
    return true;
  });

  const filteredInvoices = invoices.filter(inv => {
    if (activeShiftFilter === 1) return inv.shift === 1;
    if (activeShiftFilter === 2) return inv.shift === 2;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <LoginDesk
        usersList={usersList}
        onLoginSuccess={handleLoginSuccess}
        clinicName={clinicSettings.ClinicName}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased" id="punjab-cms-app">
      {/* Main workspace container with Bento theme layout */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative overflow-hidden h-screen" id="main-workspace">
        
        {/* Bento Header */}
        <header className="h-16 bg-blue-900 text-white flex items-center justify-between px-6 shadow-md shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-900 font-bold text-xl shadow-sm">
              {clinicSettings.ClinicLogoText || 'P'}
            </div>
            <h1 className="text-sm md:text-base lg:text-lg font-semibold tracking-tight">
              {clinicSettings.ClinicName} <span className="text-blue-300 font-light text-xs ml-1 bg-blue-800 px-2 py-0.5 rounded">CMS v4.2</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4 lg:space-x-6 text-sm">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-medium uppercase tracking-wider text-[9px] text-blue-200">Active Shift Filter</span>
              <span className="font-bold text-xs text-emerald-300">
                {currentUser.AssignedShift === 1 ? 'Morning (08:00 - 14:00)' : currentUser.AssignedShift === 2 ? 'Evening (17:00 - 21:00)' : 'Both Shifts'}
              </span>
            </div>
            <div className="hidden md:block h-8 w-[1px] bg-blue-700"></div>
            <div className="flex items-center space-x-2 bg-blue-800 px-3 py-1.5 rounded-full text-xs border border-blue-700">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium italic text-xxs">Terminal: T-01</span>
            </div>
            <div className="flex items-center space-x-2 border-l border-blue-700 pl-4 lg:pl-6">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-white flex items-center justify-center font-bold text-xs text-blue-300 uppercase">
                {currentUser.FullName.charAt(0)}
              </div>
              <span className="font-medium text-xs hidden sm:inline">{currentUser.FullName}</span>
            </div>
          </div>
        </header>

        {/* Upper Navigation Tabs Row */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-col lg:flex-row lg:items-center justify-between shadow-sm shrink-0 gap-3">
          <div className="flex-1 min-w-0 flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none pr-4">
            {MENU_ITEMS.filter((item) => {
              // Hide dashboard if staff is logged in (restrict to Administrator only)
              if (currentUser.Role !== 'Administrator' && item.id === 'dashboard') {
                return false;
              }
              return !item.restricted || isAccessible(item.id);
            }).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xxs font-bold uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  id={`nav-btn-${item.id}`}
                >
                  <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Swapper Dropdown inside Tab Bar */}
          <div className="flex items-center space-x-3 shrink-0 ml-0 lg:ml-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 lg:pt-0 pl-0 lg:pl-4">
            <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Role Swap:</span>
            </div>
            
            <select
              value={currentUser.UserID}
              onChange={(e) => {
                const selected = usersList.find((u) => u.UserID === e.target.value);
                if (selected) {
                  setCurrentUser(selected);
                  
                  // Validate authorizations for new switched user
                  const isAdmin = selected.Role === 'Administrator';
                  const isAccountant = selected.Role === 'Accountant';
                  const canAccessReports = isAdmin || isAccountant;
                  
                  if (activeTab === 'settings' && !isAdmin) {
                    setActiveTab('dashboard');
                  } else if (activeTab === 'uploads' && !isAdmin) {
                    setActiveTab('dashboard');
                  } else if (activeTab === 'reports' && !canAccessReports) {
                    setActiveTab('dashboard');
                  } else if (selected.Role === 'Doctor' && (activeTab === 'patients' || activeTab === 'accounts')) {
                    setActiveTab('emr');
                  } else if (selected.Role === 'Pharmacist' && (activeTab === 'emr' || activeTab === 'accounts')) {
                    setActiveTab('pharmacy');
                  } else if (selected.Role === 'Accountant' && activeTab === 'patients') {
                    setActiveTab('accounts');
                  } else if (selected.Role === 'Receptionist' && (activeTab === 'emr' || activeTab === 'accounts')) {
                    setActiveTab('patients');
                  }
                }
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xxs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              id="upper-role-selector"
            >
              {usersList.map((usr) => (
                <option key={usr.UserID} value={usr.UserID}>
                  {usr.FullName} ({usr.Role})
                </option>
              ))}
            </select>

            <button
              onClick={handleLogout}
              className="bg-slate-50 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-slate-500 text-xxs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span className="uppercase tracking-wider text-[10px]">Exit</span>
            </button>
          </div>
        </div>

        {/* Viewport for Active Tabs */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-100">
          {activeTab === 'dashboard' && (
            <Dashboard
              patients={patients}
              appointments={filteredAppointments}
              tokens={filteredTokens}
              items={items}
              accounts={tlAccounts}
              config={INITIAL_CONFIG}
              vouchers={vouchers}
            />
          )}

          {activeTab === 'patients' && currentUserRights.find(r => r.MenuID === 'patients')?.Status && (
            <PatientDesk
              patients={patients}
              onAddPatient={handleAddPatient}
              appointments={filteredAppointments}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              tokens={filteredTokens}
              onAddToken={handleAddToken}
              onUpdateTokenStatus={handleUpdateTokenStatus}
              cities={INITIAL_CITIES}
              userRights={currentUserRights}
              smsSettings={smsSettings}
            />
          )}

          {activeTab === 'emr' && currentUserRights.find(r => r.MenuID === 'emr')?.Status && (
            <EMRDesk
              patients={patients}
              appointments={filteredAppointments}
              items={items}
              labTests={labTests}
              visits={visits}
              onAddVisit={handleAddVisit}
              medicalCertificates={medicalCertificates}
              onAddCertificate={handleAddCertificate}
              sbpCertificates={sbpCertificates}
              onAddSbpCertificate={handleAddSbpCertificate}
              userRights={currentUserRights}
              clinicSettings={clinicSettings}
              cities={INITIAL_CITIES}
            />
          )}

          {activeTab === 'pharmacy' && currentUserRights.find(r => r.MenuID === 'pharmacy')?.Status && (
            <PharmacyPOS
              patients={patients}
              items={items}
              onUpdateItemStock={handleUpdateItemStock}
              suppliers={INITIAL_SUPPLIERS}
              invoices={filteredInvoices}
              invoiceDetails={invoiceDetails}
              onAddInvoice={handleAddInvoice}
              onAddSalesReturn={handleAddSalesReturn}
              grns={grns}
              grnDetails={grnDetails}
              onAddGRN={handleAddGRN}
              userRights={currentUserRights}
              visits={visits}
              visitMedicines={visitMedicines}
              appointments={appointments}
              tokens={tokens}
              clinicSettings={clinicSettings}
            />
          )}

          {activeTab === 'accounts' && currentUserRights.find(r => r.MenuID === 'accounts')?.Status && (
            <AccountingDesk
              flAccounts={INITIAL_FL_ACCOUNTS}
              slAccounts={INITIAL_SL_ACCOUNTS}
              tlAccounts={tlAccounts}
              onUpdateAccountBalance={handleUpdateAccountBalance}
              vouchers={vouchers}
              voucherDetails={voucherDetails}
              onAddVoucher={handleAddVoucher}
              acLedger={acLedger}
              userRights={currentUserRights}
            />
          )}

          {activeTab === 'uploads' && currentUser.Role === 'Administrator' && (
            <UploadingDesk
              items={items}
              setItems={setItems}
              labTests={labTests}
              setLabTests={setLabTests}
            />
          )}

          {activeTab === 'reports' && (currentUser.Role === 'Administrator' || currentUser.Role === 'Accountant') && (
            <ReportingDesk
              invoices={invoices}
              invoiceDetails={invoiceDetails}
              salesReturns={salesReturns}
              acLedger={acLedger}
              tlAccounts={tlAccounts}
              patients={patients}
              appointments={appointments}
            />
          )}

          {activeTab === 'settings' && currentUser.Role === 'Administrator' && (
            <SettingsDesk
              clinicSettings={clinicSettings}
              setClinicSettings={setClinicSettings}
              usersList={usersList}
              setUsersList={setUsersList}
              currentUser={currentUser}
              smsSettings={smsSettings}
              setSmsSettings={setSmsSettings}
              sqlServerSettings={sqlServerSettings}
              setSqlServerSettings={setSqlServerSettings}
            />
          )}
        </div>

        {/* Bento Footer */}
        <footer className="h-8 bg-slate-200/60 border-t border-slate-300 px-6 flex items-center justify-between shrink-0 text-slate-600">
          <div className="flex space-x-4 text-[10px] font-medium uppercase tracking-tight italic">
            <span>Config Mapping: CIH: 0101-01</span>
            <span>Rev: 0401-02</span>
            <span>Disc: 0501-10</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] text-slate-500 hidden sm:inline">System Ready: Stable Connection to MSSQL SERVER Instance PCMS-PROD</span>
            <div className="hidden sm:block h-3 w-[1px] bg-slate-300"></div>
            <span className="text-[10px] font-bold text-blue-900">Licensed to: {clinicSettings.ClinicName}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
