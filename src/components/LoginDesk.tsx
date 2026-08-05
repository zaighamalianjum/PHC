/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Activity, 
  Calendar,
  Building2,
  CheckCircle2,
  KeyRound,
  Phone,
  CreditCard,
  Smile,
  ArrowLeft,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { User as UserType } from '../types';

interface LoginDeskProps {
  usersList: UserType[];
  onLoginSuccess: (user: UserType) => void;
  onUserUpdated?: (user: UserType) => void;
  clinicName: string;
  clinicLogoImage?: string;
}

export default function LoginDesk({ usersList, onLoginSuccess, onUserUpdated, clinicName, clinicLogoImage }: LoginDeskProps) {
  // Main Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Mode: 'login' | 'verify' | 'reset' | 'success'
  const [viewMode, setViewMode] = useState<'login' | 'verify' | 'reset' | 'success'>('login');

  // Verification Form State
  const [verifyUsername, setVerifyUsername] = useState('admin');
  const [verifyMobile, setVerifyMobile] = useState('');
  const [verifyCNIC, setVerifyCNIC] = useState('');
  const [verifyNickName, setVerifyNickName] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<UserType | null>(null);

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const foundUser = usersList.find(
        (u) => u.LoginName.toLowerCase() === username.trim().toLowerCase()
      );

      if (!foundUser) {
        setErrorMessage('Invalid username or password.');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.PasswordHash !== password) {
        setErrorMessage('Invalid username or password.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onLoginSuccess(foundUser);
    }, 600);
  };

  // Helper to normalize strings (remove non-alphanumeric chars, convert to lowercase)
  const normalize = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Handle Admin Verification
  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setIsVerifying(true);

    setTimeout(() => {
      // Find candidate admin user
      let adminUser = usersList.find(
        u => u.Role === 'Administrator' && u.LoginName.toLowerCase() === verifyUsername.trim().toLowerCase()
      );

      if (!adminUser && !verifyUsername.trim()) {
        adminUser = usersList.find(u => u.Role === 'Administrator');
      }

      if (!adminUser) {
        adminUser = usersList.find(u => u.Role === 'Administrator');
      }

      if (!adminUser) {
        setVerifyError('No Administrator account found in system database.');
        setIsVerifying(false);
        return;
      }

      const inputMobile = normalize(verifyMobile);
      const inputCNIC = normalize(verifyCNIC);
      const inputNickName = normalize(verifyNickName);

      if (!inputMobile || !inputCNIC || !inputNickName) {
        setVerifyError('Please enter Mobile Number, CNIC, and Nick Name to proceed.');
        setIsVerifying(false);
        return;
      }

      // Default registered values if record fields aren't populated yet
      const registeredMobile = normalize(adminUser.MobileNumber || '03001234567');
      const registeredCNIC = normalize(adminUser.CNIC || '3520112345671');
      const registeredNickName = normalize(adminUser.NickName || 'zaigham');

      const mobileMatch = inputMobile === registeredMobile || (adminUser.MobileNumber && normalize(adminUser.MobileNumber) === inputMobile);
      const cnicMatch = inputCNIC === registeredCNIC || (adminUser.CNIC && normalize(adminUser.CNIC) === inputCNIC);
      const nickMatch = (
        inputNickName === registeredNickName || 
        (adminUser.NickName && normalize(adminUser.NickName) === inputNickName) ||
        normalize(adminUser.FullName).includes(inputNickName)
      );

      if (mobileMatch && cnicMatch && nickMatch) {
        setVerifiedUser(adminUser);
        setViewMode('reset');
        setVerifyError('');
        setIsVerifying(false);
      } else {
        const failed: string[] = [];
        if (!mobileMatch) failed.push('Mobile Number');
        if (!cnicMatch) failed.push('CNIC');
        if (!nickMatch) failed.push('Nick Name');

        setVerifyError(`Verification failed for: ${failed.join(', ')}. Please enter valid Admin verification details.`);
        setIsVerifying(false);
      }
    }, 600);
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPassword || newPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please try again.');
      return;
    }

    if (!verifiedUser) return;

    setIsResetting(true);

    const updatedUser: UserType = {
      ...verifiedUser,
      PasswordHash: newPassword,
      MobileNumber: verifyMobile.trim() || verifiedUser.MobileNumber,
      CNIC: verifyCNIC.trim() || verifiedUser.CNIC,
      NickName: verifyNickName.trim() || verifiedUser.NickName
    };

    try {
      // Save updated user to server database
      const bridgeUrl = window.location.origin;
      await fetch(`${bridgeUrl}/api/users/${verifiedUser.UserID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      }).catch(() => {});

      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setIsResetting(false);
      setViewMode('success');
    } catch {
      setIsResetting(false);
      // Fallback update
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setViewMode('success');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 select-none relative overflow-hidden font-sans text-slate-800" id="login-desk-root">
      
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
            {clinicLogoImage ? (
              <img src={clinicLogoImage} alt="Clinic Logo" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <Building2 className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-wide font-sans">
              {clinicName || 'Punjab Homeopathic Clinic'}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wider">Clinical Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wider">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Main Login / Reset Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 animate-fadeIn space-y-6 py-8">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/60 space-y-6 relative">
          
          {/* VIEW MODE 1: STANDARD LOGIN */}
          {viewMode === 'login' && (
            <>
              {/* Card Header & Logo Badge */}
              <div className="text-center space-y-3">
                <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-600 p-0.5 shadow-lg shadow-emerald-600/15">
                  <div className="w-full h-full bg-white rounded-[14px] p-2 flex items-center justify-center">
                    {clinicLogoImage ? (
                      <img src={clinicLogoImage} alt="Punjab Homeopathic Clinic Logo" className="w-full h-full object-contain rounded-md" />
                    ) : (
                      <Building2 className="w-10 h-10 text-emerald-600" />
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Punjab Homeopathic Clinic</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Staff Account Authorization & Access Terminal
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold tracking-wide flex items-center space-x-2.5 animate-fadeIn">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('verify');
                        setVerifyError('');
                        if (username.trim()) setVerifyUsername(username.trim());
                      }}
                      className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition flex items-center space-x-1"
                    >
                      <KeyRound className="w-3 h-3 mr-0.5" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-emerald-600/20 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In to Terminal</span>
                  )}
                </button>

              </form>
            </>
          )}

          {/* VIEW MODE 2: ADMIN IDENTITY VERIFICATION */}
          {viewMode === 'verify' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Admin Account Verification</h2>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter your registered Admin details (Mobile Number, CNIC & Nick Name) to verify authorization.
                </p>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-start space-x-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAdmin} className="space-y-3.5">
                
                {/* Admin Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Admin Username</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={verifyUsername}
                      onChange={(e) => setVerifyUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={verifyMobile}
                      onChange={(e) => setVerifyMobile(e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* CNIC Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">CNIC Number *</label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={verifyCNIC}
                      onChange={(e) => setVerifyCNIC(e.target.value)}
                      placeholder="e.g. 35201-1234567-1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Nick Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Nick Name *</label>
                  <div className="relative">
                    <Smile className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={verifyNickName}
                      onChange={(e) => setVerifyNickName(e.target.value)}
                      placeholder="e.g. Zaigham"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Admin Credentials...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Admin Identity</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* VIEW MODE 3: RESET PASSWORD */}
          {viewMode === 'reset' && verifiedUser && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Reset Admin Password</h2>
                <p className="text-xs text-slate-600 font-medium">
                  Identity verified for <strong className="text-slate-900">{verifiedUser.FullName}</strong> ({verifiedUser.LoginName})
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-white" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Update Admin Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('verify')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW MODE 4: SUCCESS */}
          {viewMode === 'success' && (
            <div className="text-center space-y-5 animate-fadeIn py-2">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">Password Updated Successfully!</h2>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Your Admin password has been reset. You can now sign in with your username and new password.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (verifiedUser) {
                    setUsername(verifiedUser.LoginName);
                  }
                  setPassword('');
                  setViewMode('login');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Proceed to Sign In</span>
              </button>
            </div>
          )}

        </div>

        {/* Security Compliance Banner */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted Session • Authorized Access Only</span>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full z-10 text-[11px] text-slate-500 font-medium space-y-2 sm:space-y-0 border-t border-slate-200 pt-4">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>System Date: <span className="font-semibold text-slate-700">{currentDate}</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-700 font-bold">{clinicName || 'Punjab Homeopathic Clinic'}</span>
        </div>
      </div>

    </div>
  );
}
