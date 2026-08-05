import React from 'react';
import { Printer } from 'lucide-react';
import { ClinicSettings } from '../../types';
import { generateOPDThermalTokenHtml } from '../../utils/thermalPrinter';

export interface ThermalPrintData {
  tokenNo: number;
  patientName: string;
  patientId: string;
  shiftName: string;
  date: string;
  fee: number;
  feeNote?: string;
  appId: string;
  patientType: 'New Patient' | 'Old Patient';
  remarks?: string;
}

interface ThermalTokenModalProps {
  thermalPrintOpen: boolean;
  thermalPrintData: ThermalPrintData | null;
  setThermalPrintOpen: (open: boolean) => void;
  clinicSettings?: ClinicSettings;
  handleCleanThermalTokenPrint: () => void;
}

export default function ThermalTokenModal({
  thermalPrintOpen,
  thermalPrintData,
  setThermalPrintOpen,
  clinicSettings,
  handleCleanThermalTokenPrint
}: ThermalTokenModalProps) {
  if (!thermalPrintOpen || !thermalPrintData) return null;

  const htmlContent = generateOPDThermalTokenHtml(thermalPrintData, clinicSettings);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] print:absolute print:inset-0 print:bg-white print:p-0">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full flex flex-col border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:w-full print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <span className="text-xs font-bold text-slate-700">OPD Thermal Ticket Issued</span>
          <div className="flex space-x-1.5">
            <button
              type="button"
              onClick={handleCleanThermalTokenPrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xxs rounded-lg flex items-center shadow-md transition cursor-pointer"
              title={`Direct print thermal ticket (+2in width)`}
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print Ticket ({clinicSettings?.ThermalPrinterName || 'Thermal Printer'})</span>
            </button>
            <button
              type="button"
              onClick={() => setThermalPrintOpen(false)}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xxs rounded cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Thermal Print Receipt Frame */}
        <div 
          className="p-2 bg-white text-black font-black space-y-2 overflow-y-auto flex-1 select-all mx-auto font-sans" 
          id="thermal-receipt"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

      </div>
    </div>
  );
}

