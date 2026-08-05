import React, { useState } from 'react';
import jsQR from 'jsqr';
import { Upload, X, QrCode, CheckCircle2, AlertCircle, Calendar, Tag, DollarSign, Layers } from 'lucide-react';
import { parseScannedItemQR, ParsedQRResult } from '../utils/qrUtils';

interface ItemQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (scanned: ParsedQRResult) => void;
  onScanResult?: (scanned: ParsedQRResult) => void;
  title?: string;
  subtitle?: string;
}

export const ItemQRScannerModal: React.FC<ItemQRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanResult,
  title = 'Scan Item QR Code',
  subtitle = 'Scan medicine QR label by uploading image or entering QR code'
}) => {
  const triggerScanSuccess = (parsed: ParsedQRResult) => {
    if (typeof onScanSuccess === 'function') {
      onScanSuccess(parsed);
    } else if (typeof onScanResult === 'function') {
      onScanResult(parsed);
    }
  };

  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [scannedResult, setScannedResult] = useState<{ itemId: string; itemName: string; rawText: string } | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle uploaded QR code image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const parsed = parseScannedItemQR(code.data);
          if (parsed.itemId) {
            setScannedResult(parsed);
            triggerScanSuccess(parsed);
          } else {
            setUploadError('Valid QR code found, but no Item ID could be extracted.');
          }
        } else {
          setUploadError('No QR code detected in the uploaded image. Please try a clearer image.');
        }
      }
    };
    img.onerror = () => {
      setUploadError('Failed to load image file.');
    };
    img.src = URL.createObjectURL(file);
  };

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const parsed = parseScannedItemQR(manualCode);
    setScannedResult(parsed);
    triggerScanSuccess(parsed);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-600 border-b-2 border-emerald-600 font-extrabold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload QR Image</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-emerald-600 border-b-2 border-emerald-600 font-extrabold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Manual Entry / Scanner</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4">
          {/* TAB 1: IMAGE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50/50 transition cursor-pointer text-center space-y-2">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600" />
                <span className="text-xs font-bold text-slate-700">Click to upload QR code image</span>
                <span className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP item QR label photos</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL ENTRY / HARDWARE SCANNER INPUT */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Scan / Enter Raw QR Code or Item ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Scan with USB barcode reader or type Item ID (e.g. ITM-001)..."
                    autoFocus
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 USB/Bluetooth hardware scanners feed text directly into this field. Press Enter when done.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl shadow-xs transition cursor-pointer"
              >
                Load Item Details
              </button>
            </form>
          )}

          {/* Scan Success Banner */}
          {scannedResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-emerald-950">Item QR Matched & Parsed!</p>
                  <p className="font-mono text-[11px] text-emerald-800">
                    ID: {scannedResult.itemId} {scannedResult.itemName ? `(${scannedResult.itemName})` : ''}
                  </p>
                </div>
              </div>

              {/* Parsed Metadata Badges */}
              {(scannedResult.batchNo || scannedResult.mfgDate || scannedResult.expDate || scannedResult.mrp) && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-200/80 text-[11px]">
                  {scannedResult.batchNo && (
                    <span className="bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-700" />
                      Batch: {scannedResult.batchNo}
                    </span>
                  )}
                  {scannedResult.mfgDate && (
                    <span className="bg-teal-100 text-teal-900 font-extrabold px-2 py-0.5 rounded border border-teal-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-teal-700" />
                      Mfg: {scannedResult.mfgDate}
                    </span>
                  )}
                  {scannedResult.expDate && (
                    <span className="bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-700" />
                      Exp: {scannedResult.expDate}
                    </span>
                  )}
                  {scannedResult.mrp !== undefined && (
                    <span className="bg-emerald-800 text-white font-extrabold px-2 py-0.5 rounded border border-emerald-900 flex items-center gap-1">
                      MRP: PKR {scannedResult.mrp}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemQRScannerModal;
