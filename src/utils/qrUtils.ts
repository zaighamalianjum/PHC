import QRCode from 'qrcode';
import { Item } from '../types';

export interface ItemQRData {
  type: 'MEDICINE_QR';
  id: string;
  name: string;
  category?: string;
  price?: number;
  unit?: string;
  batch?: string;
}

/**
 * Encodes item details into a standard QR string
 */
export function encodeItemQRData(item: Item | any): string {
  const qrData: ItemQRData = {
    type: 'MEDICINE_QR',
    id: item.ItemID || item.id || '',
    name: item.ItemName || item.name || '',
    category: item.Category || item.Unit || '',
    price: item.Price || item.PurchasePrice || 0,
    unit: item.Unit || 'Unit',
    batch: item.BatchNo || ''
  };
  return JSON.stringify(qrData);
}

/**
 * Generates a base64 Data URL for a QR Code string
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 200,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.color?.dark || '#0f172a',
        light: options?.color?.light || '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export interface ParsedQRResult {
  itemId: string;
  itemName: string;
  rawText: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  mrp?: number;
}

/**
 * Parses a QR code string or raw scanned code to find the ItemID, Search query, and metadata (Batch, Mfg, Exp, MRP)
 */
export function parseScannedItemQR(scannedText: string): ParsedQRResult {
  const trimmed = scannedText.trim();
  if (!trimmed) return { itemId: '', itemName: '', rawText: '' };

  // Helper regex extractors for Batch No, Mfg Date, Exp Date, and MRP / Price
  const extractBatch = () => {
    const m = trimmed.match(/(?:B#|BATCH|LOT|B\.NO|BN|B_NO)[:#\s]*([A-Za-z0-9\-\/]+)/i);
    return m ? m[1].trim() : undefined;
  };

  const extractMfg = () => {
    const m = trimmed.match(/(?:MFG|MFGDAT|MFG_DATE|MANUFACTURED|MFD)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2})/i);
    return m ? m[1].trim() : undefined;
  };

  const extractExp = () => {
    const m = trimmed.match(/(?:EXP|EXPDAT|EXP_DATE|EXPIRY|BEST_BEFORE)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2})/i);
    return m ? m[1].trim() : undefined;
  };

  const extractMrp = () => {
    const m = trimmed.match(/(?:MRP|RETAIL|PRICE|RS|PKR)[:\s]*([0-9]+(?:\.[0-9]+)?)(?:\/=|\/|\b)/i);
    return m ? parseFloat(m[1]) : undefined;
  };

  const batchNo = extractBatch();
  const mfgDate = extractMfg();
  const expDate = extractExp();
  const mrp = extractMrp();

  // Case 1: JSON payload with ItemQRData
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id || parsed.ItemID || parsed.itemId) {
        return {
          itemId: String(parsed.id || parsed.ItemID || parsed.itemId).trim(),
          itemName: String(parsed.name || parsed.ItemName || parsed.itemName || '').trim(),
          rawText: trimmed,
          batchNo: parsed.batch || parsed.BatchNo || parsed.batchNo || batchNo,
          mfgDate: parsed.mfg || parsed.MfgDate || parsed.mfgDate || mfgDate,
          expDate: parsed.exp || parsed.ExpDate || parsed.expDate || expDate,
          mrp: parsed.mrp || parsed.Price || parsed.price || mrp
        };
      }
    } catch {
      // Not JSON, continue
    }
  }

  // Case 2: Prefix format like MED:ITM-001 or ITEM:ITM-001
  if (trimmed.toUpperCase().startsWith('MED:') || trimmed.toUpperCase().startsWith('ITEM:')) {
    const parts = trimmed.split(':');
    if (parts[1]) {
      return {
        itemId: parts[1].trim(),
        itemName: parts[2] ? parts[2].trim() : '',
        rawText: trimmed,
        batchNo,
        mfgDate,
        expDate,
        mrp
      };
    }
  }

  // Case 3: Label style string with B# or Mfg/Exp metadata
  if (batchNo || mfgDate || expDate || mrp) {
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    let potentialNameOrId = '';
    for (const l of lines) {
      if (!l.match(/(?:B#|BATCH|LOT|B\.NO|BN|MFG|EXP|MRP|RETAIL|PRICE)/i)) {
        potentialNameOrId = l;
        break;
      }
    }

    return {
      itemId: potentialNameOrId || (batchNo ? `BATCH-${batchNo}` : trimmed),
      itemName: potentialNameOrId || (batchNo ? `Batch #${batchNo}` : trimmed),
      rawText: trimmed,
      batchNo,
      mfgDate,
      expDate,
      mrp
    };
  }

  // Case 4: Direct ItemID or barcode string (e.g., ITM-001 or 890123456789)
  return {
    itemId: trimmed,
    itemName: trimmed,
    rawText: trimmed,
    batchNo,
    mfgDate,
    expDate,
    mrp
  };
}

/**
 * Plays a quick Web Audio beep feedback sound on QR/barcode scan
 */
export function playBeepSound(type: 'success' | 'error' = 'success') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio context might be restricted before user gesture
  }
}

/**
 * Opens a print window for selected Item QR Code Sticker Labels
 */
export async function printItemQRCodes(
  items: (Item | any)[],
  clinicName: string = 'PUNJAB HOMEOPATHIC CLINIC & PHARMACY'
) {
  if (!items || items.length === 0) return alert('No items selected for QR Code label printing.');

  // Render QR code images for all items
  const itemQrPairs = await Promise.all(
    items.map(async (item) => {
      const qrDataStr = encodeItemQRData(item);
      const dataUrl = await generateQRCodeDataUrl(qrDataStr, { width: 180, margin: 1 });
      return { item, dataUrl };
    })
  );

  const printWin = window.open('', '_blank', 'width=900,height=750');
  if (!printWin) return alert('Pop-up blocked. Please allow popups to print QR Code Labels.');

  const labelCardsHtml = itemQrPairs
    .map(({ item, dataUrl }) => {
      const id = item.ItemID || item.id || 'N/A';
      const name = item.ItemName || 'Medicine Item';
      const category = item.Category || item.Unit || 'Pharmacy Item';
      const price = item.Price || item.PurchasePrice || 0;
      const unit = item.Unit || 'Unit';

      return `
        <div class="qr-label-card">
          <div class="header-line">${clinicName}</div>
          <div class="item-title">${name}</div>
          <div class="meta-badge">${category} &bull; ${unit}</div>
          <div class="qr-image-wrap">
            <img src="${dataUrl}" alt="QR Code" />
          </div>
          <div class="item-id-code">ID: ${id}</div>
          <div class="price-tag">Rs. ${Number(price).toLocaleString()}</div>
        </div>
      `;
    })
    .join('');

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Item QR Code Labels Print - ${clinicName}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 10px;
            background: #fff;
            color: #0f172a;
          }
          .no-print-bar {
            background: #0f172a;
            color: #fff;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          .no-print-bar h2 {
            margin: 0;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .no-print-bar p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #94a3b8;
          }
          .btn-print {
            background: #10b981;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            text-transform: uppercase;
          }
          .btn-print:hover {
            background: #059669;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat( auto-fill, minmax(180px, 1fr) );
            gap: 12px;
          }
          .qr-label-card {
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            background: #ffffff;
            box-sizing: border-box;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .header-line {
            font-size: 8px;
            font-weight: 900;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
            width: 100%;
          }
          .item-title {
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 6px;
            line-height: 1.2;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-height: 26px;
          }
          .meta-badge {
            font-size: 8.5px;
            font-weight: 700;
            color: #4338ca;
            background: #eef2ff;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 4px;
          }
          .qr-image-wrap {
            margin: 6px 0;
          }
          .qr-image-wrap img {
            width: 110px;
            height: 110px;
            display: block;
          }
          .item-id-code {
            font-family: monospace;
            font-size: 10px;
            font-weight: 800;
            color: #334155;
            background: #f8fafc;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .price-tag {
            font-family: monospace;
            font-size: 12px;
            font-weight: 900;
            color: #059669;
            margin-top: 4px;
          }

          @media print {
            .no-print-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
            .qr-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 8px !important;
            }
            .qr-label-card {
              border: 1px solid #94a3b8 !important;
              box-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <div>
            <h2>Print Item QR Code Labels (${itemQrPairs.length} Items)</h2>
            <p>Ready for standard A4 grid sticker sheets or adhesive barcode printer rolls</p>
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Print Labels Now</button>
        </div>

        <div class="qr-grid">
          ${labelCardsHtml}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}
