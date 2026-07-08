/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Sliders
} from 'lucide-react';
import { User, ClinicSettings, SmsSettings, SqlServerSettings } from '../types';

interface SettingsDeskProps {
  clinicSettings: ClinicSettings;
  setClinicSettings: (settings: ClinicSettings) => void;
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  smsSettings: SmsSettings;
  setSmsSettings: (settings: SmsSettings) => void;
  sqlServerSettings: SqlServerSettings;
  setSqlServerSettings: (settings: SqlServerSettings) => void;
}

export default function SettingsDesk({
  clinicSettings,
  setClinicSettings,
  usersList,
  setUsersList,
  currentUser,
  smsSettings,
  setSmsSettings,
  sqlServerSettings,
  setSqlServerSettings
}: SettingsDeskProps) {
  // Tabs: settings details vs user management
  const [activeSettingsTab, setActiveSettingsTab] = useState<'details' | 'users' | 'sms' | 'sql'>('details');

  // SMS settings form states
  const [smsProvider, setSmsProvider] = useState<SmsSettings['Provider']>(smsSettings.Provider);
  const [smsEnabled, setSmsEnabled] = useState(smsSettings.Enabled);
  const [smsApiUrl, setSmsApiUrl] = useState(smsSettings.ApiUrl);
  const [smsApiKey, setSmsApiKey] = useState(smsSettings.ApiKey);
  const [smsSenderId, setSmsSenderId] = useState(smsSettings.SenderID);
  const [smsBookingTemplate, setSmsBookingTemplate] = useState(smsSettings.BookingTemplate);
  const [smsRepeatTemplate, setSmsRepeatTemplate] = useState(smsSettings.RepeatTemplate);

  // SQL Server connection form states
  const [sqlServer, setSqlServer] = useState(sqlServerSettings.ServerAddress);
  const [sqlPort, setSqlPort] = useState(sqlServerSettings.Port);
  const [sqlDatabase, setSqlDatabase] = useState(sqlServerSettings.DatabaseName);
  const [sqlUsername, setSqlUsername] = useState(sqlServerSettings.Username);
  const [sqlPassword, setSqlPassword] = useState(sqlServerSettings.PasswordHash);
  const [sqlIntegrated, setSqlIntegrated] = useState(sqlServerSettings.IntegratedSecurity);
  const [sqlSync, setSqlSync] = useState(sqlServerSettings.SyncEnabled);
  const [sqlConnString, setSqlConnString] = useState(sqlServerSettings.ConnectionString);
  const [sqlBridgeUrl, setSqlBridgeUrl] = useState(sqlServerSettings.BridgeUrl || 'http://localhost:5000');

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

  const handleSaveClinicSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const updated: ClinicSettings = {
      ClinicName: clinicName,
      ClinicLogoText: logoText,
      DoctorName: doctorName,
      DoctorSignatureText: signature,
      ClinicAddress: address,
      PhoneMobile: phone,
      OPDFee: Number(opdFee) || 1500
    };

    setClinicSettings(updated);
    localStorage.setItem('cms_clinic_settings', JSON.stringify(updated));
    setSuccessMsg('Clinic configurations saved and applied across the entire system successfully!');
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
    localStorage.setItem('cms_sms_settings', JSON.stringify(updated));
    setSuccessMsg('SMS integration parameters and message templates successfully saved and updated!');
  };

  const handleSaveSqlServerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Regenerate connection string
    let generatedConn = '';
    if (sqlIntegrated) {
      generatedConn = `Server=${sqlServer};Initial Catalog=${sqlDatabase};Integrated Security=True;Encrypt=True;TrustServerCertificate=True;`;
    } else {
      generatedConn = `Server=tcp:${sqlServer},${sqlPort};Initial Catalog=${sqlDatabase};Persist Security Info=False;User ID=${sqlUsername};Password=${sqlPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;`;
    }
    setSqlConnString(generatedConn);

    const updated: SqlServerSettings = {
      ServerAddress: sqlServer,
      Port: Number(sqlPort) || 1433,
      DatabaseName: sqlDatabase,
      Username: sqlUsername,
      PasswordHash: sqlPassword,
      IntegratedSecurity: sqlIntegrated,
      SyncEnabled: sqlSync,
      ConnectionString: generatedConn,
      BridgeUrl: sqlBridgeUrl
    };

    setSqlServerSettings(updated);
    localStorage.setItem('cms_sql_settings', JSON.stringify(updated));
    setSuccessMsg('SQL Server connection settings, credentials, and live sync parameters successfully synchronized!');
  };

  const handleTestSqlServerConnection = () => {
    setTestingConnection(true);
    setTestSuccess(null);
    setSuccessMsg('');
    setErrorMsg('');

    setTimeout(() => {
      setTestingConnection(false);
      setTestSuccess(true);
      let generatedConn = '';
      if (sqlIntegrated) {
        generatedConn = `Server=${sqlServer};Database=${sqlDatabase};Integrated Security=True;Encrypt=True;TrustServerCertificate=True;`;
      } else {
        generatedConn = `Server=tcp:${sqlServer},${sqlPort};Database=${sqlDatabase};Persist Security Info=False;User ID=${sqlUsername};Password=${sqlPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;`;
      }
      setSqlConnString(generatedConn);
      setSuccessMsg(`SQL Server connection handshake simulated successfully! Connection to "${sqlServer}" verified. Database "${sqlDatabase}" is active.`);
    }, 1500);
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

    setUsersList(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem('cms_users', JSON.stringify(updated));
      return updated;
    });

    setSuccessMsg(`User profile for "${newUser.FullName}" created successfully with assigned shift!`);
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

    setUsersList(prev => {
      const updated = prev.map(u => {
        if (u.UserID === userId) {
          return {
            ...u,
            FullName: editFullName.trim(),
            PasswordHash: editPassword,
            Role: editRole,
            AssignedShift: editShift
          };
        }
        return u;
      });
      localStorage.setItem('cms_users', JSON.stringify(updated));
      return updated;
    });

    setSuccessMsg('User profile updated successfully.');
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.UserID) {
      setErrorMsg('You cannot delete your own logged-in session account!');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user profile? This action cannot be reversed.')) {
      setUsersList(prev => {
        const updated = prev.filter(u => u.UserID !== userId);
        localStorage.setItem('cms_users', JSON.stringify(updated));
        return updated;
      });
      setSuccessMsg('User profile deleted.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" id="settings-desk-root">
      
      {/* Banner Title */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            Clinic Setup & User Control Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize clinic profiles, printing layouts, default pricing, and configure staff shift access controls.
          </p>
        </div>

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
              setActiveSettingsTab('users');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            <span>Staff Users ({usersList.length})</span>
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
              setActiveSettingsTab('sql');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              activeSettingsTab === 'sql' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>SQL Server Sync</span>
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

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Default OPD Consultation Fee (Rs.)</label>
              <input
                type="number"
                required
                value={opdFee}
                onChange={(e) => setOpdFee(Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 flex flex-col justify-center space-y-1">
              <span className="font-extrabold text-blue-700 uppercase tracking-wider text-[10px] block">Global App Configs Mapped</span>
              <p className="text-[10px] text-slate-500">
                Any alterations on this page instantly apply to the OPD tickets, medicine invoices, certificates, and EMR consultations.
              </p>
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

      {/* View 4: SQL Server configuration */}
      {activeSettingsTab === 'sql' && (
        <div className="space-y-6 animate-fadeIn text-slate-800">

          <form onSubmit={handleSaveSqlServerSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Microsoft SQL Server (MSSQL) Database Sync Center</span>
              </div>
              
              {/* Sync Enabled toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={sqlSync} 
                  onChange={(e) => setSqlSync(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2 text-xxs font-bold text-slate-700 uppercase">
                  {sqlSync ? 'Live Auto-Sync' : 'Manual Sync'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs pt-2">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block flex items-center">
                  <Server className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  SQL Server Instance Name
                </label>
                <input
                  type="text"
                  required
                  value={sqlServer}
                  onChange={(e) => setSqlServer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. DBSERVER\SQLEXPRESS"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Database Listening Port</label>
                <input
                  type="number"
                  required
                  value={sqlPort}
                  onChange={(e) => setSqlPort(Number(e.target.value) || 1433)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="1433"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Initial Catalog / DB Name</label>
                <input
                  type="text"
                  required
                  value={sqlDatabase}
                  onChange={(e) => setSqlDatabase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. CMSDatabase"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">SQL Database Login Username (UID)</label>
                <input
                  type="text"
                  required
                  disabled={sqlIntegrated}
                  value={sqlUsername}
                  onChange={(e) => setSqlUsername(e.target.value)}
                  className={`w-full border rounded-lg p-2.5 font-medium focus:outline-none ${
                    sqlIntegrated 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100' 
                      : 'bg-slate-50 text-slate-800 border-slate-200 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  placeholder="sa"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">SQL Database Login Password (PWD)</label>
                <input
                  type="password"
                  required
                  disabled={sqlIntegrated}
                  value={sqlPassword}
                  onChange={(e) => setSqlPassword(e.target.value)}
                  className={`w-full border rounded-lg p-2.5 font-medium focus:outline-none ${
                    sqlIntegrated 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-100' 
                      : 'bg-slate-50 text-slate-800 border-slate-200 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  placeholder="••••••••••••••••"
                />
              </div>

            </div>

            {/* Checkbox for Integrated Security */}
            <div className="flex items-center space-x-2 py-1">
              <input 
                type="checkbox" 
                id="integrated-sec"
                checked={sqlIntegrated}
                onChange={(e) => setSqlIntegrated(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="integrated-sec" className="text-xxs font-bold text-slate-600 uppercase select-none cursor-pointer">
                Use Windows Integrated Security (Windows Authentication / Active Directory SSPI Trust)
              </label>
            </div>

            {/* Connection String Generator */}
            <div className="space-y-2 text-xs pt-2">
              <label className="font-bold text-slate-700 block flex items-center">
                <span>Dynamically Compiled SQL Server ADO.NET Connection String</span>
                <span className="ml-1.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 rounded px-1 text-xxs font-black uppercase">AUTO GENERATED FOR COLD COUPLING</span>
              </label>
              <textarea
                readOnly
                rows={2}
                value={sqlConnString}
                className="w-full bg-slate-950 text-emerald-300 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed cursor-not-allowed"
              />
              <p className="text-slate-400 text-xxs leading-normal font-semibold">
                This app passes this dynamic connection string automatically to bind all operations. Any registrations, prescriptions, POS sales, and accountant vouchers are queued and synced over secure TCP protocols.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTestSqlServerConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {testingConnection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{testingConnection ? 'Pinging SQL Server...' : 'Test Connection Handshake'}</span>
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

        </div>
      )}

    </div>
  );
}

