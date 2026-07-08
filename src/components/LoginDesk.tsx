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
  Sparkles,
  Server
} from 'lucide-react';
import { User as UserType } from '../types';

interface LoginDeskProps {
  usersList: UserType[];
  onLoginSuccess: (user: UserType) => void;
  clinicName: string;
}

export default function LoginDesk({ usersList, onLoginSuccess, clinicName }: LoginDeskProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    // Simulate small latency for premium network feel
    setTimeout(() => {
      const foundUser = usersList.find(
        (u) => u.LoginName.toLowerCase() === username.trim().toLowerCase()
      );

      if (!foundUser) {
        setErrorMessage('Invalid credentials: User login name not found.');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.PasswordHash !== password) {
        setErrorMessage('Authentication Failed: Incorrect secret password.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSubmitting(false);
      onLoginSuccess(foundUser);
    }, 800);
  };

  const handleQuickFill = (user: UserType) => {
    setUsername(user.LoginName);
    setPassword(user.PasswordHash);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-6 select-none relative overflow-hidden" id="login-desk-root">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg tracking-tight shadow-lg shadow-blue-500/20">
            {clinicName.charAt(0) || 'P'}
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase font-sans">
              {clinicName || 'Punjab Clinic'}
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Clinical Systems Terminal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono">SQL SERVER: CONNECTED</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 animate-fadeIn space-y-6">
        
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative">
          
          <div className="text-center space-y-1.5">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Staff Account Authorization</h2>
            <p className="text-xxs text-slate-400 font-medium leading-relaxed">
              Input assigned terminal credentials to access medical records, OPD queue registries, pharmacy POS, and clinic ledgers.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-900/50 rounded-xl text-rose-300 text-xxs font-semibold tracking-wide leading-normal">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Login Account Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-550 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="e.g. admin, doctor_morn"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Passcode</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs font-medium text-white placeholder-slate-550 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Decrypting Keyring...</span>
                </>
              ) : (
                <span>Authorize & Mount Terminal</span>
              )}
            </button>

          </form>

          {/* Quick Demo Logins Swapper */}
          <div className="space-y-2 pt-4 border-t border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick-Fill Staff Demo Roles (One-Tap Select):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {usersList.map((user) => (
                <button
                  key={user.UserID}
                  type="button"
                  onClick={() => handleQuickFill(user)}
                  className={`px-2.5 py-1 text-[10px] font-semibold border rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    username === user.LoginName 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 font-bold'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{user.FullName.split(' ')[0]} ({user.Role})</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Security Compliance Note */}
        <p className="text-[10px] text-slate-500 text-center leading-normal">
          This system is secure. Handshake packets are compiled via 256-bit TLS encryption protocols to registered MSSQL instances. Unauthenticated access attempts are logged.
        </p>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full z-10 text-[10px] text-slate-500 font-semibold space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span>Clinic Log Date: <span className="font-mono text-slate-400">July 3, 2026</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Server className="w-3.5 h-3.5 text-slate-600" />
            <span>Node Latency: <span className="font-mono text-emerald-500">12ms</span></span>
          </span>
          <span>PCMS v4.2.1-PROD</span>
        </div>
      </div>

    </div>
  );
}
