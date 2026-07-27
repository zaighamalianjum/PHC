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
  CheckCircle2
} from 'lucide-react';
import { User as UserType } from '../types';

interface LoginDeskProps {
  usersList: UserType[];
  onLoginSuccess: (user: UserType) => void;
  clinicName: string;
  clinicLogoImage?: string;
}

export default function LoginDesk({ usersList, onLoginSuccess, clinicName, clinicLogoImage }: LoginDeskProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    // Simulate standard authentication network response time
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

      // Success
      setIsSubmitting(false);
      onLoginSuccess(foundUser);
    }, 600);
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

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 animate-fadeIn space-y-6 py-8">
        
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/60 space-y-6 relative">
          
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
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Password</label>
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

