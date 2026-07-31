import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface RegistrationSuccessData {
  patientId: string;
  patientName: string;
  phoneMobile: string;
}

interface RegistrationSuccessModalProps {
  regSuccessModalOpen: boolean;
  regSuccessData: RegistrationSuccessData | null;
  onClose: () => void;
}

export default function RegistrationSuccessModal({
  regSuccessModalOpen,
  regSuccessData,
  onClose
}: RegistrationSuccessModalProps) {
  if (!regSuccessModalOpen || !regSuccessData) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-emerald-300 shadow-2xl p-6 space-y-4 animate-scaleUp text-center">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-black text-slate-900">Save Successfully</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            New patient intake file has been saved to EMR records.
          </p>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs text-left space-y-1.5 font-sans">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Patient ID:</span>
            <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
              {regSuccessData.patientId}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Patient Name:</span>
            <span className="font-bold text-slate-900">{regSuccessData.patientName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Mobile Phone:</span>
            <span className="font-mono font-bold text-slate-800">{regSuccessData.phoneMobile}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
        >
          OK / Continue
        </button>
      </div>
    </div>
  );
}
