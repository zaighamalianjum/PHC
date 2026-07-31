import React from 'react';
import { ShieldAlert, X, Lock } from 'lucide-react';

interface UnauthorizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function UnauthorizedModal({
  isOpen,
  onClose,
  title = "Access Restricted",
  message = "You are not authorized to access."
}: UnauthorizedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white border border-rose-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-center transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="text-xs text-rose-100 font-medium mt-1">System Security & Authorization Control</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-rose-900 text-sm font-semibold flex items-center space-x-3 text-left">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            <p className="leading-snug">{message}</p>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            If you require access to this section or feature, please contact your System Administrator to update your user role and permissions in Clinic Setup & Users.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
