import React from 'react';
import { Printer } from 'lucide-react';
import { ClinicSettings } from '../../types';

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
          style={{
            width: clinicSettings?.ThermalWidthOffset && clinicSettings?.ThermalWidthOffset !== '+0in'
              ? `calc(${clinicSettings?.ThermalPaperWidth || '60mm'} + ${clinicSettings?.ThermalWidthOffset})`
              : (clinicSettings?.ThermalPaperWidth || '60mm'),
            fontSize: clinicSettings?.ThermalFontSize || '11px',
            fontFamily: "Arial, Helvetica, sans-serif",
            padding: clinicSettings?.ThermalMargin || '0mm',
            transform: clinicSettings?.ThermalScale && clinicSettings?.ThermalScale !== '100%' 
              ? `scale(${parseFloat(clinicSettings.ThermalScale) > 1 ? parseFloat(clinicSettings.ThermalScale)/100 : parseFloat(clinicSettings.ThermalScale) || 1})` 
              : undefined,
            transformOrigin: 'top center'
          }}
        >
          
          {/* Optional Printer Header */}
          {clinicSettings?.ThermalShowPrinterHeader !== false && (
            <p className="text-[8px] font-black text-black uppercase tracking-widest bg-white py-0.5 border-b border-black mb-1 text-center m-0">
              PRINTER: {clinicSettings?.ThermalPrinterName || 'THERMAL PRINTER'} ({clinicSettings?.ThermalPaperWidth || '60mm'})
            </p>
          )}

          {/* Top Header: Clinic Name, Document Type, Appointment Date, Doctor Info */}
          <div className="text-center pt-1 pb-2.5 border-b border-dashed border-black space-y-2 m-0 font-black">
            <h2 className="text-base font-black text-black tracking-wide uppercase leading-normal m-0">
              {clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC'}
            </h2>
            
            <div className="py-1">
              <span className="text-xs font-black uppercase inline-block px-3 py-1 rounded-xs bg-black text-white tracking-widest">
                APPOINTMENT PAYMENT
              </span>
            </div>

            <div className="text-xs font-black text-black py-1.5 flex flex-col items-center justify-center border-t border-dotted border-black mt-1.5 space-y-0.5">
              <span className="font-black uppercase tracking-widest text-[11px] block">APPOINTMENT DATE</span>
              <span className="font-mono text-black font-black text-base underline decoration-2 tracking-widest block">
                {thermalPrintData.date || new Date().toISOString().split('T')[0]}
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
              #{thermalPrintData.tokenNo}
            </span>
            <span className="text-xl font-black tracking-wider block leading-snug text-black font-mono py-0.5">
              PATIENT ID: {thermalPrintData.patientId}
            </span>
            {thermalPrintData.shiftName && (
              <span className={`text-xs font-black uppercase inline-block tracking-widest px-2.5 py-1 rounded-sm mt-1 ${
                clinicSettings?.ThermalBadgeStyle === 'black'
                  ? 'bg-black text-white border border-black font-black'
                  : clinicSettings?.ThermalBadgeStyle === 'outline'
                  ? 'bg-transparent text-black border border-dashed border-black font-black'
                  : 'bg-white text-black border border-black font-black'
              }`}>
                {thermalPrintData.shiftName}
              </span>
            )}
          </div>

          {/* Patient Details: Patient Type, Patient Name, OPD Fee */}
          <div className="space-y-2.5 py-3 border-b border-dashed border-black text-xs font-black text-black leading-relaxed">
            <div className="flex justify-between items-center py-1">
              <span className="font-black text-black uppercase tracking-wider">PATIENT TYPE:</span>
              <span className={`font-black uppercase px-2.5 py-1 rounded border border-black text-xs tracking-wide ${
                clinicSettings?.ThermalBadgeStyle === 'black' ? 'bg-black text-white' : 'bg-white text-black'
              }`}>
                {thermalPrintData.patientType || 'New Patient'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-black text-black uppercase tracking-wider">PATIENT ID:</span>
              <span className="font-black text-black font-mono text-xs tracking-wider">{thermalPrintData.patientId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-black text-black uppercase tracking-wider">PATIENT NAME:</span>
              <span className="font-black text-black uppercase truncate max-w-[160px] text-xs tracking-wide">{thermalPrintData.patientName}</span>
            </div>
            <div className="flex justify-between py-1 items-center">
              <span className="font-black text-black uppercase tracking-wider">OPD / APP FEE:</span>
              <span className="font-black text-black font-mono text-xs tracking-wider">
                {thermalPrintData.fee === 0 ? (
                  'PKR 0 (PREPAID)'
                ) : (
                  `PKR ${thermalPrintData.fee !== undefined && thermalPrintData.fee !== null ? thermalPrintData.fee : (clinicSettings?.OPDFee || 1500)}`
                )}
              </span>
            </div>
            {thermalPrintData.remarks && (
              <div className="flex justify-between py-1 items-center text-xs font-black">
                <span className="font-black text-black uppercase tracking-wider">REMARKS:</span>
                <span className="font-black text-black truncate max-w-[160px] uppercase tracking-wide">{thermalPrintData.remarks}</span>
              </div>
            )}
          </div>

          {/* Footnote */}
          <div className="text-center space-y-1.5 text-xs pt-2.5 pb-1 font-black text-black leading-relaxed">
            <p className="font-black uppercase tracking-widest text-black">Please wait for your call.</p>
            <p className="text-xs font-black text-black uppercase tracking-wider">Kindly keep this ticket with you.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
