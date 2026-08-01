/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  UserCheck, 
  Plus, 
  Trash2, 
  Save, 
  ShieldCheck, 
  Settings, 
  Lock, 
  Briefcase,
  MessageSquare,
  Database,
  Server,
  Wifi,
  Globe,
  Key,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Download,
  Image,
  Upload,
  Printer,
  FileText,
  Users,
  Shield,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  UserCog,
  Unlock,
  FolderLock,
  UserPlus,
  ListOrdered,
  Ticket,
  Stethoscope,
  CalendarPlus,
  LayoutGrid,
  Edit3,
  Calendar,
  Ban,
  Zap,
  Boxes
} from 'lucide-react';
import { User, ClinicSettings, SmsSettings, MongoDbSettings, UserRight } from '../types';
import { ROLE_RIGHTS } from '../data/initialData';

interface SettingsDeskProps {
  clinicSettings: ClinicSettings;
  setClinicSettings: (settings: ClinicSettings) => void;
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  smsSettings: SmsSettings;
  setSmsSettings: (settings: SmsSettings) => void;
  mongoDbSettings: MongoDbSettings;
  setMongoDbSettings: (settings: MongoDbSettings) => void;
}

export default function SettingsDesk({
  clinicSettings,
  setClinicSettings,
  usersList,
  setUsersList,
  currentUser,
  smsSettings,
  setSmsSettings,
  mongoDbSettings,
  setMongoDbSettings
}: SettingsDeskProps) {
  // Tabs: settings details vs user management vs access control
  const [activeSettingsTab, setActiveSettingsTab] = useState<'details' | 'printer' | 'users' | 'access' | 'sms' | 'mongodb' | 'maintenance'>('details');

  // Custom Access Management System State
  const [selectedAccessUserId, setSelectedAccessUserId] = useState<string>(usersList[0]?.UserID || 'USR-01');
  const selectedAccessUser = usersList.find(u => u.UserID === selectedAccessUserId) || usersList[0];

  // Default permission template
  const defaultPermissionTemplate: NonNullable<User['Permissions']> = {
    canViewDashboard: true,
    canViewPatientDesk: true,
    canViewEMRDesk: true,
    canViewPharmacyPOS: true,
    canViewAccountingDesk: true,
    canViewReportingDesk: true,
    canViewUploadingDesk: true,
    canViewSettingsDesk: true,
    canViewQueryHandlerDesk: true,
    canViewNhcHistoryDesk: true,

    canAccessWaitingQueue: true,
    canAccessPatientRegistration: true,
    canAccessTokenIssue: true,
    canAccessPatientVisitDesk: true,
    canAccessGridView: true,
    canAccessAppointmentsDesk: true,
    canAccessLargeScreenDisplay: true,

    canAddPatient: true,
    canEditPatient: true,
    canIssueToken: true,
    canBookAppointment: true,
    canCancelAppointment: true,
    canCallServeToken: true,
    canEditStockLevel: true,

    canPrintPrescription: true,
    canPrintLabAdvice: true,
    canPrintVisitSlip: true,
    canPrintTokenSlip: true,
    canPrintPOSInvoice: true,
    canPrintVouchers: true,
    canPrintFinancialReports: true,
    canExportCSVExcel: true
  };

  // Selected User's Permissions & Access Controls
  const [accessPermissions, setAccessPermissions] = useState<NonNullable<User['Permissions']>>(defaultPermissionTemplate);

  const [accessUserRights, setAccessUserRights] = useState<UserRight[]>(ROLE_RIGHTS['Administrator']);
  const [accessAllowedUserIDs, setAccessAllowedUserIDs] = useState<string[]>(['ALL']);

  // Synchronize state whenever selectedAccessUserId changes
  useEffect(() => {
    if (selectedAccessUser) {
      setAccessPermissions({
        ...defaultPermissionTemplate,
        ...(selectedAccessUser.Permissions || {})
      });
      setAccessUserRights(selectedAccessUser.UserRights || ROLE_RIGHTS[selectedAccessUser.Role] || ROLE_RIGHTS['Administrator']);
      setAccessAllowedUserIDs(selectedAccessUser.AllowedUserIDs || ['ALL']);
    }
  }, [selectedAccessUserId, usersList]);

  const handleToggleDeskPermission = (key: keyof NonNullable<User['Permissions']>) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleUserRight = (menuId: string, field: 'Status' | 'AddRec' | 'PostRec' | 'CancelPosted' | 'PrintRec' | 'ExportRec') => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessUserRights(prev => prev.map(r => {
      if (r.MenuID === menuId) {
        return { ...r, [field]: !r[field] };
      }
      return r;
    }));
  };

  const handleToggleTargetUserAccess = (targetUserId: string) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessAllowedUserIDs(prev => {
      const filtered = prev.filter(id => id !== 'ALL' && id !== '*');
      if (filtered.includes(targetUserId)) {
        const remaining = filtered.filter(id => id !== targetUserId);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...filtered, targetUserId];
      }
    });
  };

  const handleToggleWildcardAll = () => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    if (accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*')) {
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else {
      setAccessAllowedUserIDs(['ALL']);
    }
  };

  const handleApplyRolePreset = (role: User['Role']) => {
    if (selectedAccessUser?.Role === 'Administrator') return;
    setAccessUserRights(ROLE_RIGHTS[role] || ROLE_RIGHTS['Doctor']);
    if (role === 'Administrator') {
      setAccessPermissions({
        canViewDashboard: true,
        canViewPatientDesk: true,
        canViewEMRDesk: true,
        canViewPharmacyPOS: true,
        canViewAccountingDesk: true,
        canViewReportingDesk: true,
        canViewUploadingDesk: true,
        canViewSettingsDesk: true,
        canViewQueryHandlerDesk: true,
        canViewNhcHistoryDesk: true,
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: true,
        canAccessTokenIssue: true,
        canAccessPatientVisitDesk: true,
        canAccessGridView: true,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: true,
        canAddPatient: true,
        canEditPatient: true,
        canIssueToken: true,
        canBookAppointment: true,
        canCancelAppointment: true,
        canCallServeToken: true,
        canEditStockLevel: true,
        canPrintPrescription: true,
        canPrintLabAdvice: true,
        canPrintVisitSlip: true,
        canPrintTokenSlip: true,
        canPrintPOSInvoice: true,
        canPrintVouchers: true,
        canPrintFinancialReports: true,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs(['ALL']);
    } else if (role === 'Doctor') {
      setAccessPermissions({
        canViewDashboard: false,
        canViewPatientDesk: true,
        canViewEMRDesk: true,
        canViewPharmacyPOS: false,
        canViewAccountingDesk: false,
        canViewReportingDesk: false,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: true,
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: false,
        canAccessPatientVisitDesk: true,
        canAccessGridView: true,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: true,
        canAddPatient: false,
        canEditPatient: false,
        canIssueToken: false,
        canBookAppointment: true,
        canCancelAppointment: false,
        canCallServeToken: true,
        canEditStockLevel: false,
        canPrintPrescription: true,
        canPrintLabAdvice: true,
        canPrintVisitSlip: true,
        canPrintTokenSlip: false,
        canPrintPOSInvoice: false,
        canPrintVouchers: false,
        canPrintFinancialReports: false,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Receptionist') {
      setAccessPermissions({
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
        canAccessWaitingQueue: true,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: true,
        canAccessPatientVisitDesk: false,
        canAccessGridView: false,
        canAccessAppointmentsDesk: true,
        canAccessLargeScreenDisplay: false,
        canAddPatient: true,
        canEditPatient: true,
        canIssueToken: true,
        canBookAppointment: true,
        canCancelAppointment: false,
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
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Pharmacist') {
      setAccessPermissions({
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
        canAccessWaitingQueue: false,
        canAccessPatientRegistration: false,
        canAccessTokenIssue: false,
        canAccessPatientVisitDesk: false,
        canAccessGridView: false,
        canAccessAppointmentsDesk: false,
        canAccessLargeScreenDisplay: false,
        canAddPatient: false,
        canEditPatient: false,
        canIssueToken: false,
        canBookAppointment: false,
        canCancelAppointment: false,
        canCallServeToken: false,
        canEditStockLevel: false,
        canPrintPrescription: false,
        canPrintLabAdvice: false,
        canPrintVisitSlip: false,
        canPrintTokenSlip: false,
        canPrintPOSInvoice: true,
        canPrintVouchers: false,
        canPrintFinancialReports: false,
        canExportCSVExcel: true
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    } else if (role === 'Accountant') {
      setAccessPermissions({
        canViewDashboard: true,
        canViewPatientDesk: false,
        canViewEMRDesk: false,
        canViewPharmacyPOS: true,
        canViewAccountingDesk: true,
        canViewReportingDesk: true,
        canViewUploadingDesk: false,
        canViewSettingsDesk: false,
        canViewQueryHandlerDesk: false,
        canViewNhcHistoryDesk: false,
        canEditStockLevel: false
      });
      setAccessAllowedUserIDs([selectedAccessUserId]);
    }
  };

  const handleSaveAccessPermissions = () => {
    if (!selectedAccessUser) return;
    if (selectedAccessUser.Role === 'Administrator') {
      setErrorMsg('Administrator access profile is locked and cannot be modified. Admin accounts maintain full system permissions by default.');
      return;
    }
    setSuccessMsg('');
    setErrorMsg('');

    const updatedUser: User = {
      ...selectedAccessUser,
      Permissions: accessPermissions,
      UserRights: accessUserRights,
      AllowedUserIDs: accessAllowedUserIDs
    };

    setUsersList(prev => prev.map(u => u.UserID === selectedAccessUser.UserID ? updatedUser : u));

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/users/${selectedAccessUser.UserID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg(`Custom Access Rights & User-to-User permissions for "${selectedAccessUser.FullName}" saved to database successfully!`);
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync permissions to MongoDB: ${err.message}`);
      });
  };

  // SMS settings form states
  const [smsProvider, setSmsProvider] = useState<SmsSettings['Provider']>(smsSettings.Provider);
  const [smsEnabled, setSmsEnabled] = useState(smsSettings.Enabled);
  const [smsApiUrl, setSmsApiUrl] = useState(smsSettings.ApiUrl);
  const [smsApiKey, setSmsApiKey] = useState(smsSettings.ApiKey);
  const [smsSenderId, setSmsSenderId] = useState(smsSettings.SenderID);
  const [smsBookingTemplate, setSmsBookingTemplate] = useState(smsSettings.BookingTemplate);
  const [smsRepeatTemplate, setSmsRepeatTemplate] = useState(smsSettings.RepeatTemplate);

  // MongoDB connection form states
  const [mongoConnString, setMongoConnString] = useState(mongoDbSettings.ConnectionString);
  const [mongoDatabase, setMongoDatabase] = useState(mongoDbSettings.DatabaseName);
  const [mongoSync, setMongoSync] = useState(mongoDbSettings.SyncEnabled);
  const [mongoBridgeUrl, setMongoBridgeUrl] = useState(mongoDbSettings.BridgeUrl || (typeof window !== 'undefined' ? window.location.origin : ''));

  // Connection testing feedback states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);


  // Clinic state
  const [clinicName, setClinicName] = useState(clinicSettings.ClinicName);
  const [logoText, setLogoText] = useState(clinicSettings.ClinicLogoText);
  const [doctorName, setDoctorName] = useState(clinicSettings.DoctorName);
  const [signature, setSignature] = useState(clinicSettings.DoctorSignatureText);
  const [address, setAddress] = useState(clinicSettings.ClinicAddress);
  const [phone, setPhone] = useState(clinicSettings.PhoneMobile);
  const [opdFee, setOpdFee] = useState(clinicSettings.OPDFee);
  const [clinicLogoImage, setClinicLogoImage] = useState<string>(clinicSettings.ClinicLogoImage || '');
  const [letterHeadImage, setLetterHeadImage] = useState<string>(clinicSettings.LetterHeadImage || '');
  const [clinicalLabelImage, setClinicalLabelImage] = useState<string>(clinicSettings.ClinicalLabelImage || '');
  const [thermalPrinterName, setThermalPrinterName] = useState(clinicSettings.ThermalPrinterName || 'Thermal Printer');
  const [thermalPaperWidth, setThermalPaperWidth] = useState(clinicSettings.ThermalPaperWidth || '60mm');
  const [thermalPaperHeight, setThermalPaperHeight] = useState(clinicSettings.ThermalPaperHeight || 'auto');
  const [thermalDirectPrint, setThermalDirectPrint] = useState(clinicSettings.ThermalDirectPrint !== false);
  const [thermalWidthOffset, setThermalWidthOffset] = useState(clinicSettings.ThermalWidthOffset || '+0in');
  const [thermalFontSize, setThermalFontSize] = useState(clinicSettings.ThermalFontSize || '11px');
  const [thermalBadgeStyle, setThermalBadgeStyle] = useState<'white' | 'black' | 'outline'>(clinicSettings.ThermalBadgeStyle || 'white');
  const [thermalShowPrinterHeader, setThermalShowPrinterHeader] = useState(clinicSettings.ThermalShowPrinterHeader !== false);
  const [thermalMargin, setThermalMargin] = useState(clinicSettings.ThermalMargin || '0mm');
  const [thermalScale, setThermalScale] = useState(clinicSettings.ThermalScale || '100%');

  // User list states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // New user form state
  const [newLoginName, setNewLoginName] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<User['Role']>('Doctor');
  const [newShift, setNewShift] = useState<1 | 2 | 'Both'>('Both');

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<User['Role']>('Doctor');
  const [editShift, setEditShift] = useState<1 | 2 | 'Both'>('Both');

  const handleTestPrintSampleToken = () => {
    const elem = document.getElementById('sample-thermal-receipt-preview');
    if (!elem) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=600,height=700');
    if (!printWin) {
      window.print();
      return;
    }

    const basePaperWidth = thermalPaperWidth || '60mm';
    const widthOffset = thermalWidthOffset || '+0in';
    const effectiveWidth = widthOffset && widthOffset !== '+0in' ? `calc(${basePaperWidth} + ${widthOffset})` : basePaperWidth;
    const marginVal = thermalMargin || '0mm';
    const scaleVal = thermalScale || '100%';
    const scaleFactor = parseFloat(scaleVal) > 1 ? parseFloat(scaleVal) / 100 : (parseFloat(scaleVal) || 1);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test OPD Token Ticket - ${thermalPrinterName || 'Thermal Printer'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: ${effectiveWidth} auto;
              margin: ${marginVal};
            }
            html, body {
              margin: 0;
              padding: 0;
              width: ${effectiveWidth};
              background: white !important;
              color: black !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-weight: 900 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            *, p, span, div, h1, h2, h3, h4, strong, b {
              font-weight: 900 !important;
            }
            #thermal-receipt-container {
              width: ${effectiveWidth};
              margin: ${marginVal} auto;
              padding: 6px 4px;
              box-sizing: border-box;
              ${scaleVal && scaleVal !== '100%' ? `transform: scale(${scaleFactor}); transform-origin: top center;` : ''}
            }
          </style>
        </head>
        <body>
          <div id="thermal-receipt-container">
            ${elem.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  try { window.close(); } catch(e) {}
                }, 300);
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleSaveClinicSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: ClinicSettings = {
      ClinicName: clinicName,
      ClinicLogoText: logoText,
      DoctorName: doctorName,
      DoctorSignatureText: signature,
      ClinicAddress: address,
      PhoneMobile: phone,
      OPDFee: Number(opdFee) || 1500,
      ClinicLogoImage: clinicLogoImage,
      LetterHeadImage: letterHeadImage,
      ClinicalLabelImage: clinicalLabelImage,
      ThermalPrinterName: thermalPrinterName,
      ThermalPaperWidth: thermalPaperWidth,
      ThermalPaperHeight: thermalPaperHeight,
      ThermalDirectPrint: thermalDirectPrint,
      ThermalWidthOffset: thermalWidthOffset,
      ThermalFontSize: thermalFontSize,
      ThermalBadgeStyle: thermalBadgeStyle,
      ThermalShowPrinterHeader: thermalShowPrinterHeader,
      ThermalMargin: thermalMargin,
      ThermalScale: thermalScale
    };

    setClinicSettings(updated);
    
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/settings/clinic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('Clinic configurations saved and synchronized in MongoDB successfully!');
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync to MongoDB: ${err.message}`);
      });
  };

  const handleSaveSmsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: SmsSettings = {
      Provider: smsProvider,
      Enabled: smsEnabled,
      ApiUrl: smsApiUrl,
      ApiKey: smsApiKey,
      SenderID: smsSenderId,
      BookingTemplate: smsBookingTemplate,
      RepeatTemplate: smsRepeatTemplate
    };

    setSmsSettings(updated);
    
    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/settings/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('SMS integration parameters saved and synchronized in MongoDB successfully!');
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync to MongoDB: ${err.message}`);
      });
  };

  const handleSaveMongoDbSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: MongoDbSettings = {
      ConnectionString: mongoConnString,
      DatabaseName: mongoDatabase,
      SyncEnabled: mongoSync,
      BridgeUrl: mongoBridgeUrl
    };

    setMongoDbSettings(updated);
    localStorage.setItem('cms_mongodb_settings', JSON.stringify(updated));
    setSuccessMsg('MongoDB connection settings and collection parameters successfully synchronized!');
  };

  const handleTestMongoDbConnection = () => {
    setTestingConnection(true);
    setTestSuccess(null);
    setSuccessMsg('');
    setErrorMsg('');

    const bridgeUrl = mongoBridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/mongodb/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        connectionString: mongoConnString,
        databaseName: mongoDatabase
      })
    })
      .then(res => res.json())
      .then(data => {
        setTestingConnection(false);
        if (data.success) {
          setTestSuccess(true);
          setSuccessMsg(`MongoDB connection handshake verified successfully! Active connection established. Database "${data.database}" is active and contains ${data.collectionsCount} collections.`);
        } else {
          setTestSuccess(false);
          setErrorMsg(`MongoDB Connection failed: ${data.error}`);
        }
      })
      .catch(err => {
        setTestingConnection(false);
        setTestSuccess(false);
        setErrorMsg(`Failed to connect to API server: ${err.message}`);
      });
  };

  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const handleTriggerManualBackup = async () => {
    setDownloadingBackup(true);
    setBackupSuccess(null);
    setSuccessMsg('');
    setErrorMsg('');

    const bridgeUrl = mongoDbSettings.BridgeUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const dateStr = new Date().toISOString().split('T')[0];
    const targetDbName = mongoDatabase || 'PharmacyPOSDB';

    try {
      const response = await fetch(`${bridgeUrl}/api/mongodb/backup`);
      if (response.ok) {
        const jsonBlob = await response.blob();
        const url = window.URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mongodb_backup_${targetDbName}_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloadingBackup(false);
        const msg = `Manual MongoDB database backup successfully downloaded as "mongodb_backup_${targetDbName}_${dateStr}.json"!`;
        setBackupSuccess(msg);
        setSuccessMsg(msg);
        return;
      }
    } catch (e) {
      console.warn('API backup route failed or offline, aggregating local collections...', e);
    }

    try {
      const localBackup: Record<string, any> = {
        backupDate: new Date().toISOString(),
        system: "Punjab Homeopathic Clinic EMR & Pharmacy POS",
        databaseName: targetDbName,
        collections: {}
      };

      const keysToBackup = [
        'cms_patients',
        'cms_visits',
        'cms_tokens',
        'cms_medicines',
        'cms_pos_sales',
        'cms_users_list',
        'cms_clinic_settings',
        'cms_sms_settings',
        'cms_mongodb_settings',
        'cms_accounts',
        'cms_journal_vouchers',
        'cms_nhc_history',
        'cms_cities'
      ];

      keysToBackup.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            localBackup.collections[key.replace(/^cms_/, '')] = JSON.parse(raw);
          } catch (pErr) {
            localBackup.collections[key.replace(/^cms_/, '')] = raw;
          }
        }
      });

      const blob = new Blob([JSON.stringify(localBackup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mongodb_backup_${targetDbName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadingBackup(false);
      const msg = `Manual MongoDB database backup exported & downloaded as "mongodb_backup_${targetDbName}_${dateStr}.json"!`;
      setBackupSuccess(msg);
      setSuccessMsg(msg);
    } catch (err: any) {
      setDownloadingBackup(false);
      setErrorMsg(`Failed to export MongoDB backup: ${err.message}`);
    }
  };


  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newLoginName.trim() || !newFullName.trim() || !newPassword.trim()) {
      setErrorMsg('Please fill in all user login credentials.');
      return;
    }

    const exists = usersList.some(u => u.LoginName.toLowerCase() === newLoginName.trim().toLowerCase());
    if (exists) {
      setErrorMsg(`User with login name "${newLoginName}" already exists.`);
      return;
    }

    const newUser: User = {
      UserID: `USR-${Math.floor(100 + Math.random() * 900)}`,
      LoginName: newLoginName.trim(),
      FullName: newFullName.trim(),
      PasswordHash: newPassword,
      Role: newRole,
      AssignedShift: newShift
    };

    setUsersList(prev => [...prev, newUser]);

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg(`User profile for "${newUser.FullName}" created and saved to MongoDB successfully!`);
      })
      .catch(err => {
        setErrorMsg(`Saved locally, but failed to sync user to MongoDB: ${err.message}`);
      });

    setNewLoginName('');
    setNewFullName('');
    setNewPassword('');
    setNewRole('Doctor');
    setNewShift('Both');
  };

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.UserID);
    setEditFullName(user.FullName);
    setEditPassword(user.PasswordHash);
    setEditRole(user.Role);
    setEditShift(user.AssignedShift || 'Both');
  };

  const handleSaveEditUser = (userId: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!editFullName.trim() || !editPassword.trim()) {
      setErrorMsg('Full Name and Password cannot be blank.');
      return;
    }

    const targetUser = usersList.find(u => u.UserID === userId);
    if (!targetUser) return;

    const updatedUser = {
      ...targetUser,
      FullName: editFullName.trim(),
      PasswordHash: editPassword,
      Role: editRole,
      AssignedShift: editShift
    };

    setUsersList(prev => prev.map(u => u.UserID === userId ? updatedUser : u));

    const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
    fetch(`${bridgeUrl}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('User profile updated and saved to MongoDB successfully.');
      })
      .catch(err => {
        setErrorMsg(`Updated locally, but failed to sync to MongoDB: ${err.message}`);
      });

    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.UserID) {
      setErrorMsg('You cannot delete your own logged-in session account!');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user profile? This action cannot be reversed.')) {
      setUsersList(prev => prev.filter(u => u.UserID !== userId));

      const bridgeUrl = mongoDbSettings.BridgeUrl || window.location.origin;
      fetch(`${bridgeUrl}/api/users/${userId}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => {
          setSuccessMsg('User profile deleted from MongoDB successfully.');
        })
        .catch(err => {
          setErrorMsg(`Deleted locally, but failed to remove from MongoDB: ${err.message}`);
        });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" id="settings-desk-root">
      
      {/* Banner Title */}
      <div className="flex justify-end items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Tab Selector */}
        <div className="flex space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              setActiveSettingsTab('details');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeSettingsTab === 'details' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clinic Details
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('printer');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'printer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-indigo-300" />
            <span>Printer & Slip Setup</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('users');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            <span>Staff Accounts ({usersList.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('access');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'access' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-300" />
            <span>User Access Control</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('sms');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'sms' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-sky-500" />
            <span>SMS Config</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('mongodb');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'mongodb' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>MongoDB Sync</span>
          </button>
          <button
            onClick={() => {
              setActiveSettingsTab('maintenance');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'maintenance' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>System Maintenance</span>
          </button>
        </div>
      </div>

      {/* Message Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-emerald-800 text-xs font-semibold shadow-xs animate-fadeIn">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-lg text-rose-800 text-xs font-semibold shadow-xs animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* View 1: Clinic configuration */}
      {activeSettingsTab === 'details' && (
        <form onSubmit={handleSaveClinicSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Configure General Hospital & Clinic Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Name</label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Logo Text (Header Avatar)</label>
              <input
                type="text"
                required
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Consultant Doctor Name</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Doctor Signature Text (Prints on Prescription)</label>
              <input
                type="text"
                required
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Contact Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Clinic Contact Helpline</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-lg border border-indigo-100 flex items-center justify-between col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-indigo-950 text-xs block">Token Printer & Slip Customization</span>
                  <p className="text-[11px] text-indigo-700">
                    Adjust paper widths, direct printing dialog behavior, and font sizes in the dedicated tab.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('printer')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Open Printer Setup</span>
                <Sliders className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 flex flex-col justify-center space-y-1">
              <span className="font-extrabold text-blue-700 uppercase tracking-wider text-[10px] block">Global App Configs Mapped</span>
              <p className="text-[10px] text-slate-500">
                Any alterations on this page instantly apply to the OPD tickets, medicine invoices, certificates, and EMR consultations.
              </p>
            </div>
          </div>

          {/* Printing Media & Letter Head Upload Section */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Printing Media & Layout Templates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Card 1: Clinic Brand Logo Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-teal-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Clinic Brand Logo</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Header logo, login screen & visit slips</p>
                    </div>
                  </div>
                  {clinicLogoImage && (
                    <span className="text-[9px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload Clinic Emblem / Logo (PNG / SVG / JPEG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image file size should be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setClinicLogoImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>

                {clinicLogoImage ? (
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-50 rounded overflow-hidden p-2">
                      <img
                        src={clinicLogoImage}
                        alt="Clinic Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xxs">
                      <span className="text-slate-500 font-medium">Custom Logo Active</span>
                      <button
                        type="button"
                        onClick={() => setClinicLogoImage('')}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center px-2 py-0.5 bg-rose-50 rounded hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xxs italic">
                    No custom logo uploaded. Standard emblem is currently used.
                  </div>
                )}
              </div>

              {/* Card 2: Letter Head A4 Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">A4 Size Letter Head Image</h4>
                      <p className="text-[10px] text-slate-500 font-medium">For prescriptions, certificates, & receipts</p>
                    </div>
                  </div>
                  {letterHeadImage && (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                      Uploaded
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload A4 Letter Head (JPEG / PNG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image file size should be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLetterHeadImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>

                {letterHeadImage ? (
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-100 rounded overflow-hidden">
                      <img
                        src={letterHeadImage}
                        alt="A4 Letter Head Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xxs">
                      <span className="text-slate-500 font-medium">A4 Header / Footer Template Active</span>
                      <button
                        type="button"
                        onClick={() => setLetterHeadImage('')}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center px-2 py-0.5 bg-rose-50 rounded hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xxs italic">
                    No Letter Head image uploaded. Standard clinic text header will be printed.
                  </div>
                )}
              </div>

              {/* Card 2: Clinical Medicine Label Image Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Clinical Medicine Label Image</h4>
                      <p className="text-[10px] text-slate-500 font-medium">For clinical medicine bottle/box printer</p>
                    </div>
                  </div>
                  {clinicalLabelImage && (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                      Uploaded
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Upload Label Printer Graphic (JPEG / PNG)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Image file size should be less than 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setClinicalLabelImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                {clinicalLabelImage ? (
                  <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="h-32 w-full flex items-center justify-center bg-slate-100 rounded overflow-hidden">
                      <img
                        src={clinicalLabelImage}
                        alt="Clinical Label Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xxs">
                      <span className="text-slate-500 font-medium">Label Printer Layout Active</span>
                      <button
                        type="button"
                        onClick={() => setClinicalLabelImage('')}
                        className="text-rose-600 hover:text-rose-800 font-bold flex items-center px-2 py-0.5 bg-rose-50 rounded hover:bg-rose-100 transition"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xxs italic">
                    No Clinical Label image uploaded. Default text badge will be used on label prints.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition shadow-sm"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Apply Clinic Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* View: Thermal Printer & Token Slip Setup */}
      {activeSettingsTab === 'printer' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Thermal Printer & Token Slip Setup</h3>
                  <p className="text-xs text-slate-500">
                    Customize thermal slip widths, direct auto-printing preferences without preview dialogs, and text layouts.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestPrintSampleToken}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-700" />
                  <span>Test Print Sample Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveClinicSettings()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Printer Settings</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls Column */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Direct Print Toggle Card */}
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      <div>
                        <span className="font-extrabold text-slate-900 text-xs block">Direct Auto-Print Mode</span>
                        <span className="text-[11px] text-slate-600 block">Bypass print preview dialog box when issuing tokens</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={thermalDirectPrint}
                        onChange={(e) => setThermalDirectPrint(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-indigo-800 bg-white/80 p-2.5 rounded-lg border border-indigo-100 font-medium">
                    {thermalDirectPrint ? (
                      <span className="text-emerald-700 font-bold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                        Direct Print Enabled: Token ticket immediately prints and auto-closes without asking for print confirmation.
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold flex items-center">
                        <Eye className="w-3.5 h-3.5 mr-1 inline" />
                        Preview Enabled: Token ticket modal stays open on screen so receptionist can preview before pressing print.
                      </span>
                    )}
                  </p>
                </div>

                {/* Printer Device Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 text-xs block">Thermal Printer Device Name / Model</label>
                  <input
                    type="text"
                    value={thermalPrinterName}
                    onChange={(e) => setThermalPrinterName(e.target.value)}
                    placeholder="Thermal Printer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Device model identifier used on OPD token tickets</span>
                </div>

                {/* Grid for Roll Size, Width Offset, Margins & Scale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Thermal Roll Base Width</label>
                    <input
                      type="text"
                      value={thermalPaperWidth}
                      onChange={(e) => setThermalPaperWidth(e.target.value)}
                      placeholder="e.g. 60mm, 58mm, 80mm, 7in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Standard paper roll size loaded in printer (e.g., 60mm, 58mm, 80mm)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Extra Width Margin Expansion</label>
                    <input
                      type="text"
                      value={thermalWidthOffset}
                      onChange={(e) => setThermalWidthOffset(e.target.value)}
                      placeholder="e.g. +0in, +0.5in, +1in, 10px"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Fine-tune print border width margins (e.g., +0in, +0.5in, 10px)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Thermal Ticket Print Margins</label>
                    <input
                      type="text"
                      value={thermalMargin}
                      onChange={(e) => setThermalMargin(e.target.value)}
                      placeholder="e.g. 0mm, 2mm, 5px, 0.1in"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Page & ticket margin padding (e.g., 0mm, 2mm, 5px, 0.1in)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Print Scale Ratio (%)</label>
                    <input
                      type="text"
                      value={thermalScale}
                      onChange={(e) => setThermalScale(e.target.value)}
                      placeholder="e.g. 100%, 90%, 85%, 110%"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Print zoom / scale ratio textbox (e.g., 100%, 90%, 85%)</span>
                  </div>
                </div>

                {/* Font Size & Badge Styling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Slip Font Size</label>
                    <input
                      type="text"
                      value={thermalFontSize}
                      onChange={(e) => setThermalFontSize(e.target.value)}
                      placeholder="e.g. 11px, 10px, 12px, 14px"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Font size for ticket text (e.g., 10px, 11px, 12px, 14px)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 text-xs block">Shift / Badge Styling</label>
                    <select
                      value={thermalBadgeStyle}
                      onChange={(e) => setThermalBadgeStyle(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="white">Clean White Badge with Black Border</option>
                      <option value="black">Inverted Solid Black Badge</option>
                      <option value="outline">Dashed Outline Badge</option>
                    </select>
                  </div>
                </div>

                {/* Show Header Banner Toggle */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">Show Size & Printer Header Info</span>
                    <span className="text-[10px] text-slate-500">Prints device name & size label on top of receipt</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thermalShowPrinterHeader}
                      onChange={(e) => setThermalShowPrinterHeader(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

              </div>

              {/* Live Preview Column */}
              <div className="lg:col-span-5 bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    Live Ticket Preview
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Width: calc({thermalPaperWidth} {thermalWidthOffset !== '+0in' ? thermalWidthOffset : ''})
                  </span>
                </div>

                {/* Rendered Ticket Box */}
                <div className="p-4 bg-white rounded-lg border border-slate-300 shadow-xs overflow-y-auto max-h-[500px]">
                  <div
                    id="sample-thermal-receipt-preview"
                    className="mx-auto text-black font-black space-y-2 select-all bg-white font-sans"
                    style={{
                      width: thermalWidthOffset && thermalWidthOffset !== '+0in' ? `calc(${thermalPaperWidth} + ${thermalWidthOffset})` : thermalPaperWidth,
                      fontSize: thermalFontSize,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      padding: thermalMargin || '0mm',
                      transform: thermalScale && thermalScale !== '100%' ? `scale(${parseFloat(thermalScale) > 1 ? parseFloat(thermalScale)/100 : parseFloat(thermalScale) || 1})` : undefined,
                      transformOrigin: 'top center'
                    }}
                  >
                    {/* Optional Printer Header */}
                    {thermalShowPrinterHeader && (
                      <p className="text-[8px] font-black uppercase tracking-widest bg-white py-0.5 border-b border-black mb-1 text-center m-0 text-black">
                        PRINTER: {thermalPrinterName || 'THERMAL PRINTER'} ({thermalPaperWidth})
                      </p>
                    )}

                    {/* Top Header: Clinic Name, Document Type, Appointment Date, Doctor Info */}
                    <div className="text-center pt-1 pb-2.5 border-b border-dashed border-black space-y-2 m-0 font-black">
                      <h2 className="text-base font-black text-black tracking-wide uppercase leading-normal m-0">
                        {clinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
                      </h2>
                      
                      <div className="py-1">
                        <span className="text-xs font-black uppercase inline-block px-3 py-1 rounded-xs bg-black text-white tracking-widest">
                          APPOINTMENT PAYMENT
                        </span>
                      </div>

                      <div className="text-xs font-black text-black py-1.5 flex flex-col items-center justify-center border-t border-dotted border-black mt-1.5 space-y-0.5">
                        <span className="font-black uppercase tracking-widest text-[11px] block">APPOINTMENT DATE</span>
                        <span className="font-mono text-black font-black text-base underline decoration-2 tracking-widest block">
                          {new Date().toISOString().split('T')[0]}
                        </span>
                      </div>

                      <div className="text-xs font-black text-black pt-2 border-t border-dotted border-black mt-1.5 leading-relaxed space-y-1">
                        <div className="text-xs font-black text-black uppercase tracking-wide">Dr. Ejaz Ahmad, D.H.M.S (Pak)</div>
                        <div className="text-[10px] font-black text-black uppercase tracking-wide leading-normal">
                          Registered Homeopathic Medical Practitioner No: 48776
                        </div>
                      </div>
                    </div>

                    {/* Token Number & Patient ID Section */}
                    <div className="text-center py-3 border-b border-dashed border-black space-y-2 m-0 font-black">
                      <span className="text-xs font-black text-black uppercase tracking-widest block">OPD TOKEN NUMBER</span>
                      <span className="text-5xl font-black tracking-widest block leading-snug py-1 text-black font-mono">
                        #012
                      </span>
                      <span className="text-xl font-black tracking-wider block leading-snug text-black font-mono py-0.5">
                        PATIENT ID: PHC-10492
                      </span>
                      <span className={`text-xs font-black uppercase inline-block tracking-widest px-2.5 py-1 rounded-sm mt-1 ${
                        thermalBadgeStyle === 'black'
                          ? 'bg-black text-white border border-black font-black'
                          : thermalBadgeStyle === 'outline'
                          ? 'bg-transparent text-black border border-dashed border-black font-black'
                          : 'bg-white text-black border border-black font-black'
                      }`}>
                        BOTH SHIFTS
                      </span>
                    </div>

                    {/* Patient Details */}
                    <div className="space-y-2.5 py-3 border-b border-dashed border-black text-xs font-black text-black leading-relaxed">
                      <div className="flex justify-between items-center py-1">
                        <span className="font-black text-black uppercase tracking-wider">PATIENT TYPE:</span>
                        <span className={`font-black uppercase px-2.5 py-1 rounded border border-black text-xs tracking-wide ${
                          thermalBadgeStyle === 'black' ? 'bg-black text-white' : 'bg-white text-black'
                        }`}>
                          New Patient
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-black text-black uppercase tracking-wider">PATIENT ID:</span>
                        <span className="font-black text-black font-mono text-xs tracking-wider">PHC-10492</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="font-black text-black uppercase tracking-wider">PATIENT NAME:</span>
                        <span className="font-black text-black uppercase truncate max-w-[160px] text-xs tracking-wide">MUHAMMAD ALI</span>
                      </div>
                      <div className="flex justify-between py-1 items-center">
                        <span className="font-black text-black uppercase tracking-wider">OPD / APP FEE:</span>
                        <span className="font-black text-black font-mono text-xs tracking-wider">PKR {opdFee || 1500}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center space-y-1.5 text-xs pt-2.5 pb-1 font-black text-black leading-relaxed">
                      <p className="font-black uppercase tracking-widest text-black">Please wait for your call.</p>
                      <p className="text-xs font-black text-black uppercase tracking-wider">Kindly keep this ticket with you.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestPrintSampleToken}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Test Print Physical Receipt</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveClinicSettings()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center space-x-2 transition shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Thermal Printer & Slip Setup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Users credentials management */}
      {activeSettingsTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* New User Panel */}
          <form onSubmit={handleAddUser} className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Create Staff Profile</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Login ID (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., zaigham"
                  value={newLoginName}
                  onChange={(e) => setNewLoginName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Full Name & Credentials</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Zaigham Ali (Senior PM)"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Secure Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., pass123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">System Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as User['Role'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer focus:outline-none"
                >
                  <option value="Administrator">Administrator (All Access)</option>
                  <option value="Doctor">Doctor (EMR Consultations)</option>
                  <option value="Receptionist">Receptionist (OPD Booking & Cash)</option>
                  <option value="Pharmacist">Pharmacist (Store Inventory & POS)</option>
                  <option value="Accountant">Accountant (General Ledger & Double-Entry)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Assigned Doctor Shift Access</label>
                <select
                  value={newShift}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewShift(val === 'Both' ? 'Both' : Number(val) as 1 | 2);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer focus:outline-none"
                >
                  <option value="Both">Both Shifts (Unrestricted)</option>
                  <option value="1">Morning Only (08:00 - 14:00)</option>
                  <option value="2">Evening Only (14:00 - 20:00)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  *When assigned to a shift, this user's view will filter all dashboards, appointments, and token logs to only that shift.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition shadow-sm mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Profile</span>
            </button>
          </form>

          {/* Users List Grid */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
            <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">System Users Accounts</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Manage active logins, passwords, and access restrictions.</p>
              </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
              <table className="min-w-full divide-y divide-slate-100 text-xxs">
                <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[10px] font-semibold text-left">
                  <tr>
                    <th className="px-3 py-2.5">User</th>
                    <th className="px-3 py-2.5">Access Role</th>
                    <th className="px-3 py-2.5">Assigned Shift</th>
                    <th className="px-3 py-2.5">Password</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {usersList.map((usr) => {
                    const isEditing = editingUserId === usr.UserID;
                    return (
                      <tr key={usr.UserID} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="space-y-1">
                              <span className="font-mono text-slate-400 font-bold block">{usr.LoginName}</span>
                              <input
                                type="text"
                                required
                                value={editFullName}
                                onChange={(e) => setEditFullName(e.target.value)}
                                className="bg-slate-50 border border-slate-200 p-1 rounded font-bold w-36 text-xxs"
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-extrabold text-slate-900 block">{usr.FullName}</span>
                              <span className="font-mono text-slate-500">ID: {usr.LoginName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as User['Role'])}
                              className="bg-slate-50 border border-slate-200 p-1 rounded font-bold text-xxs"
                            >
                              <option value="Administrator">Administrator</option>
                              <option value="Doctor">Doctor</option>
                              <option value="Receptionist">Receptionist</option>
                              <option value="Pharmacist">Pharmacist</option>
                              <option value="Accountant">Accountant</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-150 uppercase">
                              {usr.Role}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-700">
                          {isEditing ? (
                            <select
                              value={editShift}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditShift(val === 'Both' ? 'Both' : Number(val) as 1 | 2);
                              }}
                              className="bg-slate-50 border border-slate-200 p-1 rounded text-xxs font-bold"
                            >
                              <option value="Both">Both Shifts</option>
                              <option value="1">Morning Only</option>
                              <option value="2">Evening Only</option>
                            </select>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-xxs ${
                              usr.AssignedShift === 1 
                                ? 'bg-amber-50 text-amber-700 border border-amber-150' 
                                : usr.AssignedShift === 2 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {usr.AssignedShift === 1 
                                ? 'Morning (08:00 - 14:00)' 
                                : usr.AssignedShift === 2 
                                ? 'Evening (14:00 - 20:00)' 
                                : 'Both Shifts'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              required
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="bg-slate-50 border border-slate-200 p-1 rounded font-mono w-24 text-xxs"
                            />
                          ) : (
                            <span className="font-mono text-slate-600">{usr.PasswordHash}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center space-x-1.5 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditUser(usr.UserID)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAccessUserId(usr.UserID);
                                    setActiveSettingsTab('access');
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded border border-purple-200 flex items-center space-x-1"
                                  title="Configure Desk Permissions & User-to-User Access Matrix"
                                >
                                  <Shield className="w-3 h-3 mr-0.5 text-purple-600" />
                                  <span>Rights</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(usr)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(usr.UserID)}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded"
                                >
                                  Delete
                                </button>
                              </>
                            )}
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

      {/* View: Custom Access Management System (User-to-User & Desk Permissions) */}
      {activeSettingsTab === 'access' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Card with User Selector & Quick Presets */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 rounded-2xl border border-purple-800/40 shadow-lg text-white space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-800/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-600/30 rounded-xl border border-purple-400/30">
                  <ShieldCheck className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                    <span>Custom Access Management System</span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 font-mono font-bold px-2 py-0.5 rounded-full border border-purple-400/30 uppercase">
                      Admin Control Center
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Define desk access switches, menu rights, and configure User-to-User peer details visibility restrictions.
                  </p>
                </div>
              </div>

              {/* Target Staff Member Selector Dropdown */}
              <div className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-xl border border-purple-500/30">
                <UserCog className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200 shrink-0">Configuring Staff:</span>
                <select
                  value={selectedAccessUserId}
                  onChange={(e) => setSelectedAccessUserId(e.target.value)}
                  className="bg-purple-950 text-white font-bold text-xs rounded-lg p-2 border border-purple-400/40 focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer"
                >
                  {usersList.map((usr) => (
                    <option key={usr.UserID} value={usr.UserID}>
                      {usr.FullName} ({usr.Role} • {usr.LoginName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Role Template Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-200">Quick Permission Templates:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Administrator')}
                  className={`px-2.5 py-1 bg-purple-800/50 hover:bg-purple-700/60 text-purple-100 text-xxs font-bold rounded-lg border border-purple-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Shield className="w-3 h-3 text-purple-300" />
                  <span>Admin (Full Control)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Doctor')}
                  className={`px-2.5 py-1 bg-teal-800/50 hover:bg-teal-700/60 text-teal-100 text-xxs font-bold rounded-lg border border-teal-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Briefcase className="w-3 h-3 text-teal-300" />
                  <span>Doctor (Clinical)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Receptionist')}
                  className={`px-2.5 py-1 bg-amber-800/50 hover:bg-amber-700/60 text-amber-100 text-xxs font-bold rounded-lg border border-amber-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Users className="w-3 h-3 text-amber-300" />
                  <span>Receptionist (OPD Queue)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Pharmacist')}
                  className={`px-2.5 py-1 bg-blue-800/50 hover:bg-blue-700/60 text-blue-100 text-xxs font-bold rounded-lg border border-blue-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <Building className="w-3 h-3 text-blue-300" />
                  <span>Pharmacist (Store POS)</span>
                </button>
                <button
                  type="button"
                  disabled={selectedAccessUser?.Role === 'Administrator'}
                  onClick={() => handleApplyRolePreset('Accountant')}
                  className={`px-2.5 py-1 bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-100 text-xxs font-bold rounded-lg border border-emerald-400/30 transition flex items-center space-x-1 ${
                    selectedAccessUser?.Role === 'Administrator' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <FileText className="w-3 h-3 text-emerald-300" />
                  <span>Accountant (Ledger)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Admin Lock Notice Banner */}
          {selectedAccessUser?.Role === 'Administrator' && (
            <div className="bg-amber-500/10 border border-amber-300/60 p-4 rounded-2xl text-amber-900 flex items-start space-x-3 text-xs shadow-2xs">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-950 text-sm">🔒 Administrator Access Control Locked (Self-Access Protected)</p>
                <p className="text-amber-900/90 mt-0.5">
                  Administrators have full system rights by default. The Administrator account access rights cannot be edited or restricted, but you can configure and control access rights for all other staff accounts (Doctors, Receptionists, Pharmacists, Accountants).
                </p>
                <p className="text-amber-900 mt-1 font-bold">
                  👉 Select a Doctor, Receptionist, Pharmacist, or Accountant from the "Configuring Staff" dropdown above to manage their permissions.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: User-to-User Access Control Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <FolderLock className="w-4 h-4 text-purple-600" />
                  <span>User-to-User Access Control Matrix (Peer Visibility)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decide specifically which target staff members <strong className="text-purple-900">{selectedAccessUser?.FullName}</strong> is authorized to view or access details, consultations, and audit profiles of.
                </p>
              </div>

              {/* Master Wildcard All Users Switch */}
              <button
                type="button"
                onClick={handleToggleWildcardAll}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer border ${
                  accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*')
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*') ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-purple-200" />
                    <span>Unrestricted: Can View ALL Users</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Restricted: Specific Target Users Only</span>
                  </>
                )}
              </button>
            </div>

            {/* Target User Peer Selection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {usersList.map((targetUsr) => {
                const isSelf = targetUsr.UserID === selectedAccessUser?.UserID;
                const isAllowedAll = accessAllowedUserIDs.includes('ALL') || accessAllowedUserIDs.includes('*');
                const isExplicitlyAllowed = accessAllowedUserIDs.includes(targetUsr.UserID) || (targetUsr.LoginName && accessAllowedUserIDs.includes(targetUsr.LoginName));
                const isChecked = isAllowedAll || isExplicitlyAllowed || isSelf;

                return (
                  <div
                    key={targetUsr.UserID}
                    onClick={() => {
                      if (!isSelf && !isAllowedAll) {
                        handleToggleTargetUserAccess(targetUsr.UserID);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelf 
                        ? 'bg-slate-50 border-slate-200 opacity-80 cursor-default'
                        : isChecked
                        ? 'bg-purple-50/70 border-purple-300 shadow-2xs cursor-pointer hover:bg-purple-50'
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100 cursor-pointer hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                        isChecked ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {targetUsr.FullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-slate-900 text-xs">{targetUsr.FullName}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase">
                              Self
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {targetUsr.Role} • Login: {targetUsr.LoginName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isChecked ? (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-lg border border-purple-200">
                          <Eye className="w-3 h-3 text-purple-700" />
                          <span>Allowed</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200">
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          <span>Restricted</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Module & Desk Visibility Switches */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Module & Desk Visibility Switches</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle main navigation bar desk tabs accessible for <strong className="text-slate-800">{selectedAccessUser?.FullName}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
              {[
                { key: 'canViewDashboard', label: 'Dashboard & Executive Stats (Admin Only)', icon: Shield, desc: 'Overall patient & income analytics (Restricted to Admin)' },
                { key: 'canViewPatientDesk', label: 'Patient Intake & OPD Queue', icon: Users, desc: 'Token booking, patient registration' },
                { key: 'canViewEMRDesk', label: 'EMR & Clinical Desk', icon: Briefcase, desc: 'Clinical consultations, prescriptions' },
                { key: 'canViewPharmacyPOS', label: 'Pharmacy POS & Medicine Inventory', icon: Building, desc: 'Medicine sales counter & GRN stock' },
                { key: 'canViewAccountingDesk', label: 'Double-Entry Accounting Desk', icon: FileText, desc: 'Chart of accounts & Journal Vouchers' },
                { key: 'canViewReportingDesk', label: 'Financial & Executive Reports', icon: Printer, desc: 'Ledgers, Income statement, Trial balance' },
                { key: 'canViewUploadingDesk', label: 'CSV Imports & Uploads Desk', icon: Upload, desc: 'Bulk medicine & patient data imports' },
                { key: 'canViewSettingsDesk', label: 'System Setup & Settings Desk', icon: Settings, desc: 'Clinic setup, SMS & access control' },
                { key: 'canViewQueryHandlerDesk', label: 'Query Handler & System Audit', icon: Database, desc: 'Database query & audit log inspection' },
                { key: 'canViewNhcHistoryDesk', label: 'NHC Patient Clinical History', icon: UserCheck, desc: 'Historical EMR & consultation logs' }
              ].map((item) => {
                const isEnabled = !!(accessPermissions as any)[item.key];
                return (
                  <label
                    key={item.key}
                    onClick={() => handleToggleDeskPermission(item.key as any)}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                      isEnabled 
                        ? 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center space-x-1.5 font-extrabold text-xs">
                        <item.icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                    </div>

                    <div className="mt-0.5 shrink-0">
                      <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 2.5: Patient Intake, Registration & Queue Granular Access Controls */}
          <div className="bg-white p-6 rounded-2xl border border-teal-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Patient Intake & Appointment Desk Granular Controls</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify exact sub-desk tabs and action permissions (Waiting Queue, Registration Form, Token Issue, Appointments) for <strong className="text-slate-800">{selectedAccessUser?.FullName}</strong>.
                </p>
              </div>
            </div>

            {/* Sub-Desk Tabs Permissions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Accessible Sub-Desk Tabs & Views:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { key: 'canAccessWaitingQueue', label: 'Waiting Queue Desk', icon: ListOrdered, desc: 'View OPD queue list & token status' },
                  { key: 'canAccessPatientRegistration', label: 'Registration Form', icon: UserPlus, desc: 'Register new patients & view directory' },
                  { key: 'canAccessTokenIssue', label: 'Token Issue Counter', icon: Ticket, desc: 'Generate & print OPD shift tokens' },
                  { key: 'canAccessPatientVisitDesk', label: 'Patient Clinical Visit', icon: Stethoscope, desc: 'Prescribe medicine & symptom details' },
                  { key: 'canAccessGridView', label: 'Patient Master Grid View', icon: LayoutGrid, desc: 'View comprehensive searchable patient master records grid' },
                  { key: 'canAccessAppointmentsDesk', label: 'Book Appointment & List', icon: CalendarPlus, desc: 'Schedule future patient appointments' },
                  { key: 'canAccessLargeScreenDisplay', label: 'Large Screen Queue Display', icon: Users, desc: 'Full-screen waiting queue for TV' }
                ].map((item) => {
                  const isEnabled = accessPermissions[item.key as keyof typeof accessPermissions] !== false;
                  return (
                    <label
                      key={item.key}
                      onClick={() => handleToggleDeskPermission(item.key as any)}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                        isEnabled 
                          ? 'bg-teal-50/70 border-teal-300 text-slate-900 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-1.5 font-extrabold text-xs">
                          <item.icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                      </div>

                      <div className="mt-0.5 shrink-0">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-teal-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Specific Action Permissions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block">Specific Action & Form Privileges:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { key: 'canAddPatient', label: 'Add / Save New Patient', icon: UserPlus, desc: 'Submit patient intake form' },
                  { key: 'canEditPatient', label: 'Edit Existing Patient', icon: Edit3, desc: 'Modify demographic & phone data' },
                  { key: 'canIssueToken', label: 'Issue / Generate Token', icon: Ticket, desc: 'Print & issue queue token tickets' },
                  { key: 'canCallServeToken', label: 'Call / Serve / Cancel Token', icon: CheckCircle2, desc: 'Update token status in waiting queue' },
                  { key: 'canBookAppointment', label: 'Book / Reschedule Appointment', icon: Calendar, desc: 'Schedule future appointments' },
                  { key: 'canCancelAppointment', label: 'Cancel / Delete Appointment', icon: Ban, desc: 'Remove appointments from system' },
                  { key: 'canEditStockLevel', label: 'Edit Current Stock Level', icon: Boxes, desc: 'Allow editing current medicine stock quantities & thresholds in Inventory' }
                ].map((item) => {
                  const isEnabled = accessPermissions[item.key as keyof typeof accessPermissions] !== false;
                  return (
                    <label
                      key={item.key}
                      onClick={() => handleToggleDeskPermission(item.key as any)}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                        isEnabled 
                          ? 'bg-purple-50/70 border-purple-300 text-slate-900 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-1.5 font-extrabold text-xs">
                          <item.icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-purple-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                      </div>

                      <div className="mt-0.5 shrink-0">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Printing & Document Generation Permissions (Admin Controlled) */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Printing & Document Export Privileges (Admin Master Control):</span>
                </span>
                <span className="text-[10px] text-slate-500 italic">Toggle printing rights for {selectedAccessUser?.FullName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { key: 'canPrintPrescription', label: 'A4 Prescription Letterhead', icon: Printer, desc: 'Print doctor prescription & advice' },
                  { key: 'canPrintLabAdvice', label: 'Lab Test Advice Slip', icon: Printer, desc: 'Print laboratory investigation advice' },
                  { key: 'canPrintVisitSlip', label: 'A5 Patient Visit Receipt', icon: Printer, desc: 'Print consultation visit receipt' },
                  { key: 'canPrintTokenSlip', label: 'OPD Queue Token Ticket', icon: Ticket, desc: 'Print thermal waiting token slip' },
                  { key: 'canPrintPOSInvoice', label: 'Pharmacy Sales Bill POS', icon: Printer, desc: 'Print medicine cash & credit bills' },
                  { key: 'canPrintVouchers', label: 'Accounting Vouchers', icon: Printer, desc: 'Print Cash Payment & Journal Vouchers' },
                  { key: 'canPrintFinancialReports', label: 'Financial & Grid Reports', icon: Printer, desc: 'Print P&L, Ledgers & Patients Grid' },
                  { key: 'canExportCSVExcel', label: 'CSV & Excel Data Export', icon: Upload, desc: 'Export system lists to CSV/Excel' }
                ].map((item) => {
                  const isEnabled = accessPermissions[item.key as keyof typeof accessPermissions] !== false;
                  return (
                    <label
                      key={item.key}
                      onClick={() => handleToggleDeskPermission(item.key as any)}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer select-none ${
                        isEnabled 
                          ? 'bg-amber-50/80 border-amber-300 text-slate-900 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center space-x-1.5 font-extrabold text-xs">
                          <item.icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                      </div>

                      <div className="mt-0.5 shrink-0">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${isEnabled ? 'bg-amber-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Action Level Permissions Matrix (Add, Post, Cancel, Print, Export Rights) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Action Level Menu Rights Matrix (Create, Post, Cancel, Print & Export)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control specific transaction privileges for each menu module for <strong className="text-slate-800">{selectedAccessUser?.FullName}</strong>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-4 py-3">Menu / Desk Module</th>
                    <th className="px-4 py-3 text-center">Menu Access</th>
                    <th className="px-4 py-3 text-center">Add Record</th>
                    <th className="px-4 py-3 text-center">Post Record</th>
                    <th className="px-4 py-3 text-center">Cancel / Void</th>
                    <th className="px-4 py-3 text-center">Print Slip/Doc</th>
                    <th className="px-4 py-3 text-center">Export Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {accessUserRights.map((right) => (
                    <tr key={right.MenuID} className="hover:bg-slate-50/80 transition font-medium">
                      <td className="px-4 py-3 text-slate-900 font-extrabold flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>{right.MenuName}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'Status')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.Status ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.Status ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>

                      {/* AddRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'AddRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.AddRec ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.AddRec ? 'Allowed' : 'Denied'}
                        </button>
                      </td>

                      {/* PostRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'PostRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.PostRec ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.PostRec ? 'Allowed' : 'Denied'}
                        </button>
                      </td>

                      {/* CancelPosted */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'CancelPosted')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.CancelPosted ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.CancelPosted ? 'Authorized' : 'Restricted'}
                        </button>
                      </td>

                      {/* PrintRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'PrintRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.PrintRec !== false ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.PrintRec !== false ? 'Print Allowed' : 'Print Locked'}
                        </button>
                      </td>

                      {/* ExportRec */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRight(right.MenuID, 'ExportRec')}
                          className={`px-3 py-1 rounded-lg text-xxs font-bold transition cursor-pointer border ${
                            right.ExportRec !== false ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {right.ExportRec !== false ? 'Export Allowed' : 'Export Locked'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Save Action Floating Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-bold block">
                  {selectedAccessUser?.Role === 'Administrator'
                    ? 'Administrator Access Locked (Full Privileges)'
                    : `Save Custom Access Profile for ${selectedAccessUser?.FullName}`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {selectedAccessUser?.Role === 'Administrator'
                    ? 'Admin accounts maintain full system permissions by default.'
                    : 'All modified desk permissions, action rights, and user visibility rules will instantly apply.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedAccessUser?.Role === 'Administrator'}
              onClick={handleSaveAccessPermissions}
              className={`w-full sm:w-auto px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 ${
                selectedAccessUser?.Role === 'Administrator'
                  ? 'bg-slate-700 opacity-60 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 cursor-pointer'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {selectedAccessUser?.Role === 'Administrator'
                  ? 'Admin Self-Access Profile Locked'
                  : 'Save & Apply Access Matrix'}
              </span>
            </button>
          </div>

        </div>
      )}

      {/* View 3: SMS Gateway settings */}
      {activeSettingsTab === 'sms' && (
        <form onSubmit={handleSaveSmsSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Configure Automated SMS Gateway Integration</span>
            </div>
            
            {/* Enabled Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={smsEnabled} 
                onChange={(e) => setSmsEnabled(e.target.checked)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xxs font-bold text-slate-700 uppercase">
                {smsEnabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1 text-slate-400" />
                SMS Service Provider
              </label>
              <select
                value={smsProvider}
                onChange={(e) => {
                  const p = e.target.value as any;
                  setSmsProvider(p);
                  // Auto-fill template URLs for easier config
                  if (p === 'twilio') {
                    setSmsApiUrl('https://api.twilio.com/2010-04-01/Accounts/AC72680cf793/Messages.json');
                  } else if (p === 'infobip') {
                    setSmsApiUrl('https://api.infobip.com/sms/2/text/advanced');
                  } else if (p === 'jazz') {
                    setSmsApiUrl('https://api.jazz.com.pk/sms/v1/send');
                  } else if (p === 'telenor') {
                    setSmsApiUrl('https://telenor-api.pk/corporate/v2/messages');
                  } else {
                    setSmsApiUrl('https://your-custom-gateway.com/api/send-sms');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="twilio">Twilio (US/Global)</option>
                <option value="infobip">Infobip (Global)</option>
                <option value="jazz">Mobilink Jazz Corporate (Pakistan Local Gateway)</option>
                <option value="telenor">Telenor Corporate SMS Gateway (Pakistan Local Gateway)</option>
                <option value="custom_webhook">Custom Webhook / REST Endpoint (JSON API)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                API Gateway URL
              </label>
              <input
                type="url"
                required
                value={smsApiUrl}
                onChange={(e) => setSmsApiUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <Key className="w-3.5 h-3.5 mr-1 text-slate-400" />
                API Key / Authorization Token
              </label>
              <input
                type="password"
                required
                value={smsApiKey}
                onChange={(e) => setSmsApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Sender Mask ID / Shortcode
              </label>
              <input
                type="text"
                required
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. PUNJAB_CL"
              />
            </div>

          </div>

          {/* Guidelines on place-holders */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 text-blue-900 text-xxs space-y-1 leading-normal">
            <p className="font-bold uppercase tracking-wider text-[9px] text-blue-800">Dynamic Template Parameters Supported:</p>
            <p>Customize dispatch copy using curly-bracket placeholders. The billing system automatically injects active data:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-mono font-bold text-slate-700">
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{PATIENT}"} : Patient Name</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{TOKEN}"} : Daily Serial Token</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{SHIFT}"} : Morning/Evening</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{DATE}"} : Booking Date</div>
              <div className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center">{"{APPID}"} : Appointment ID</div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Initial / Booking Appointment SMS Message Template</label>
              <textarea
                required
                rows={3}
                value={smsBookingTemplate}
                onChange={(e) => setSmsBookingTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none leading-normal"
                placeholder="Template message for new bookings..."
              />
              <span className="text-xxs text-slate-400 font-medium">Character length will trigger segmented multi-part SMS messages depending on GSM carrier rules.</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Repeat / Follow-Up Appointment SMS Message Template</label>
              <textarea
                required
                rows={3}
                value={smsRepeatTemplate}
                onChange={(e) => setSmsRepeatTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none leading-normal"
                placeholder="Template message for follow-ups..."
              />
              <span className="text-xxs text-slate-400 font-medium">Automatically triggered when repeat patients with existing profiles book an OPD slot.</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Apply & Save Gateway Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* View 4: MongoDB configuration */}
      {activeSettingsTab === 'mongodb' && (
        <div className="space-y-6 animate-fadeIn text-slate-800">

          <form onSubmit={handleSaveMongoDbSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">MongoDB Database Connection & Sync Center</span>
              </div>
              
              {/* Sync Enabled toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={mongoSync} 
                  onChange={(e) => setMongoSync(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xxs font-bold text-slate-700 uppercase">
                  {mongoSync ? 'Live Auto-Sync' : 'Manual Sync'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs pt-2">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block flex items-center">
                  <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  MongoDB Connection URI
                </label>
                <input
                  type="text"
                  required
                  value={mongoConnString}
                  onChange={(e) => setMongoConnString(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="mongodb://localhost:27017/PharmacyPOSDB"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Database Name</label>
                <input
                  type="text"
                  required
                  value={mongoDatabase}
                  onChange={(e) => setMongoDatabase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="PharmacyPOSDB"
                />
              </div>

            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">API / Bridge Server Endpoint</label>
              <input
                type="text"
                required
                value={mongoBridgeUrl}
                onChange={(e) => setMongoBridgeUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                placeholder={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
              />
            </div>

            {/* Connection String Generator */}
            <div className="space-y-2 text-xs pt-2">
              <label className="font-bold text-slate-700 block flex items-center">
                <span>Active MongoDB Connection Target</span>
                <span className="ml-1.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 rounded px-1 text-xxs font-black uppercase">AUTO GENERATED FOR COLD COUPLING</span>
              </label>
              <textarea
                readOnly
                rows={2}
                value={mongoConnString}
                className="w-full bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed cursor-not-allowed"
              />
              <p className="text-slate-400 text-xxs leading-normal font-semibold">
                This app connects directly to MongoDB via the native MongoDB driver. Database structure, collections (OPD consultations, patients, inventory), and initial accounting charts are built and populated automatically upon cold connection boot.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestMongoDbConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {testingConnection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{testingConnection ? 'Pinging MongoDB...' : 'Test Connection Handshake'}</span>
                </button>

                {testSuccess && !testingConnection && (
                  <div className="flex items-center text-emerald-600 text-xxs font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Handshake Verified</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>Apply & Save Connection Parameters</span>
              </button>
            </div>
          </form>

          {/* Manual MongoDB Backup & Export Panel */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 text-white rounded-xl p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">Manual MongoDB Database Backup & JSON Export</h4>
                    <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase tracking-wider">
                      Instant Download
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 leading-normal">
                    Trigger a manual snapshot of your MongoDB collections (Patients, Consultations, POS Sales, Inventory, Accounts) and download a complete JSON backup file.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerManualBackup}
                disabled={downloadingBackup}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center space-x-2.5 shadow-lg shadow-emerald-950/50 transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {downloadingBackup ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>{downloadingBackup ? 'Generating Backup...' : 'Trigger Manual Backup (.JSON)'}</span>
              </button>
            </div>

            {backupSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-lg animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xxs pt-1">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Target Database</span>
                <span className="font-mono text-emerald-300 font-bold text-xs">{mongoDatabase || 'PharmacyPOSDB'}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Collections Included</span>
                <span className="font-semibold text-slate-200">Patients, Visits, POS Sales, Medicines, Users, Accounts</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <span className="font-bold text-slate-400 uppercase block">Format & Compatibility</span>
                <span className="font-semibold text-emerald-400">JSON (Universal MongoDB / Atlas import)</span>
              </div>
            </div>
          </div>

          {/* MongoDB Connection Instructions Panel */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-lg space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg shrink-0 mt-0.5">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">🍃 MongoDB Deployment & Autocreation Guideline</h4>
                  <p className="text-slate-400 text-xxs mt-0.5 leading-normal">
                    This modern application has been completely migrated to MongoDB. It is built to instantiate databases, collections, and sample records natively on startup.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 text-xxs space-y-3 leading-normal">
              <div>
                <span className="font-black text-emerald-400 uppercase text-[9px] tracking-wider block mb-1">What MongoDB Handles Automatically:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li><strong>Automatic Database Provisioning:</strong> Connect to any empty MongoDB cluster or localhost daemon. The server automatically spins up <code>PharmacyPOSDB</code> on demand.</li>
                  <li><strong>Collection Generation:</strong> Standardized documents for OPD Consultations, Patients, Medicines (Panadol, Augmentin, etc.), Cities, and Financial Ledgers are initialized.</li>
                  <li><strong>Initial Seed injection:</strong> Zero manual scripts required. System boots loaded with pre-packaged reference data.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded border border-slate-850 space-y-2">
                <span className="font-bold text-slate-200 block text-[10px] uppercase">How to Bind Your App to an External MongoDB Service:</span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Retrieve your MongoDB Connection String from MongoDB Atlas (e.g. <code>mongodb+srv://...</code>) or use local <code>mongodb://localhost:27017</code>.</li>
                  <li>Provide your Connection URI and Target Database Name in the Connection Center fields above.</li>
                  <li>Click <strong>Apply & Save Connection Parameters</strong> to preserve settings across sessions.</li>
                  <li>The Express backend (Server.js) reads this URI dynamically to initialize database connection pools on the server side securely.</li>
                </ol>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* View 5: System Maintenance & Database Safeguards */}
      {activeSettingsTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Main Maintenance Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-750 text-white rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-start space-x-3.5">
                <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 p-3 rounded-xl shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-white uppercase tracking-wider">System Maintenance & Data Protection Center</h3>
                    <span className="px-2.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                    Perform system maintenance tasks, manage database health, and export full manual snapshots of your active MongoDB collections for safe offline storage and disaster recovery.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0 text-right">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Target Database</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{mongoDatabase || 'PharmacyPOSDB'}</span>
              </div>
            </div>

            {/* Manual Backup Spotlight Feature Box */}
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-lg shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white uppercase tracking-wide flex items-center gap-2">
                      <span>Manual MongoDB Database Backup & JSON Export</span>
                      <span className="text-xxs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">JSON Snapshot</span>
                    </h4>
                    <p className="text-slate-300 text-xs mt-1 leading-normal">
                      Instantly aggregate all live records from your MongoDB collections (Patients, EMR Consultations, OPD Tokens, Pharmacy POS Inventory, Sales Bills, and Financial Ledgers) into a single downloadable JSON backup file.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerManualBackup}
                  disabled={downloadingBackup}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2.5 shadow-lg shadow-emerald-950/80 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {downloadingBackup ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Download className="w-4 h-4 text-white" />
                  )}
                  <span>{downloadingBackup ? 'Generating Snapshot...' : 'Trigger Manual Backup (.JSON)'}</span>
                </button>
              </div>

              {backupSuccess && (
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold bg-emerald-950/80 border border-emerald-800 p-3 rounded-lg animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{backupSuccess}</span>
                </div>
              )}

              {/* Collections Grid Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xxs pt-2">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Patients & Medical Records</span>
                  <span className="text-slate-200 font-bold">EMR & History</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Pharmacy & POS</span>
                  <span className="text-slate-200 font-bold">Inventory & Sales</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">Accounts & Finance</span>
                  <span className="text-slate-200 font-bold">Journal & Ledgers</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium block">System Profiles</span>
                  <span className="text-slate-200 font-bold">Users & Configs</span>
                </div>
              </div>
            </div>

            {/* Maintenance Instructions & Safety Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-amber-400 uppercase text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Backup Best Practices</span>
                </h5>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-xxs leading-relaxed">
                  <li>Store generated JSON backup files in a secure external drive or cloud storage.</li>
                  <li>Trigger a manual backup before major inventory updates or system maintenance.</li>
                  <li>Backup files contain raw collection JSON data fully formatted for standard MongoDB restoration.</li>
                </ul>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-blue-400 uppercase text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>Restoration & Import Protocol</span>
                </h5>
                <p className="text-slate-300 text-xxs leading-relaxed">
                  JSON backup exports can be directly imported back into local MongoDB or MongoDB Atlas using standard <code className="bg-slate-900 px-1 rounded text-emerald-300">mongoimport</code> or via the admin restore console.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

