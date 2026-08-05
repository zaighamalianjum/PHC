import React, { useState, useEffect } from 'react';
import { QrCode, Search, Printer, CheckSquare, Square, X, Tag } from 'lucide-react';
import { Item } from '../types';
import { generateQRCodeDataUrl, printItemQRCodes, encodeItemQRData } from '../utils/qrUtils';

interface ItemQRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  clinicName?: string;
}

export const ItemQRGeneratorModal: React.FC<ItemQRGeneratorModalProps> = ({
  isOpen,
  onClose,
  items,
  clinicName = 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [qrPreviews, setQrPreviews] = useState<{ [itemId: string]: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      item.ItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ItemID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.Category && item.Category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle item selection
  const toggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.ItemID)));
    }
  };

  // Generate QR code data URLs for visible selected items
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsGenerating(true);

    const generatePreviews = async () => {
      const previews: { [id: string]: string } = {};
      const sampleItems = items.slice(0, 50); // limit preview render to 50 for speed
      for (const item of sampleItems) {
        const qrDataStr = encodeItemQRData(item);
        const dataUrl = await generateQRCodeDataUrl(qrDataStr, { width: 140, margin: 1 });
        if (isMounted) previews[item.ItemID] = dataUrl;
      }
      if (isMounted) {
        setQrPreviews(previews);
        setIsGenerating(false);
      }
    };

    generatePreviews();
    return () => {
      isMounted = false;
    };
  }, [isOpen, items]);

  const handlePrintSelected = () => {
    const selectedList = items.filter((i) => selectedItemIds.has(i.ItemID));
    if (selectedList.length === 0) {
      alert('Please select at least one item to print QR Code sticker labels.');
      return;
    }
    printItemQRCodes(selectedList, clinicName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide text-white">
                Item QR Code Label Generator & Printer
              </h3>
              <p className="text-xs text-slate-400">
                Generate high-density scannable QR sticker labels for pharmacy inventory & POS fast-scanning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine name, category or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition flex items-center space-x-1.5 cursor-pointer"
            >
              {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({filteredItems.length})</span>
            </button>

            <button
              onClick={handlePrintSelected}
              disabled={selectedItemIds.size === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print QR Labels ({selectedItemIds.size})</span>
            </button>
          </div>
        </div>

        {/* Item Cards Grid */}
        <div className="p-5 overflow-y-auto grow space-y-4 bg-slate-100/60">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-dashed border-slate-300">
              No inventory medicine items match the search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.ItemID);
                const qrUrl = qrPreviews[item.ItemID];

                return (
                  <div
                    key={item.ItemID}
                    onClick={() => toggleSelect(item.ItemID)}
                    className={`p-3.5 bg-white rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">ID: {item.ItemID}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{item.ItemName}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">
                            {item.Category || item.Unit || 'Item'}
                          </span>
                          <span className="text-[9.5px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">
                            Rs. {Number(item.Price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>

                    {/* QR Preview Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center min-h-24">
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR Code" className="w-20 h-20 object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono animate-pulse">Generating...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Selected: <strong className="text-slate-900">{selectedItemIds.size} items</strong> for printing</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemQRGeneratorModal;
