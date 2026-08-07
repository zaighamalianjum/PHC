import { ClinicSettings, Patient } from '../types';

export interface PharmacyThermalItem {
  ItemID?: string;
  ItemName?: string;
  Qty: number;
  Price: number;
  isClinical?: boolean;
  batchNo?: string;
  expiry?: string;
}

export interface PharmacyReceiptData {
  invoiceNo: string;
  invoiceDate: string;
  invoiceTime?: string;
  patient?: Patient | null;
  patientName?: string;
  patientId?: string;
  shift?: 1 | 2 | string | number;
  basket: PharmacyThermalItem[];
  discount: number;
  netAmount: number;
  grossAmount?: number;
  cashPaid?: number;
  changeDue?: number;
  pharmacistName?: string;
  remarks?: string;
}

/**
 * Generate standard HTML content for Pharmacy POS Thermal Receipt
 */
export function generatePharmacyThermalHtml(
  data: PharmacyReceiptData,
  clinicSettings?: ClinicSettings
): string {
  const printerName = clinicSettings?.ThermalPrinterName || 'Thermal Printer';
  const basePaperWidth = clinicSettings?.ThermalPaperWidth || '60mm';
  const widthOffset = clinicSettings?.ThermalWidthOffset || '+0in';
  const marginVal = clinicSettings?.ThermalMargin || '0mm';
  const fontSize = clinicSettings?.ThermalFontSize || '11px';
  const showPrinterHeader = clinicSettings?.ThermalShowPrinterHeader !== false;

  const effectiveWidth =
    widthOffset && widthOffset !== '+0in'
      ? `calc(${basePaperWidth} + ${widthOffset})`
      : basePaperWidth;

  const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
  const clinicAddress = clinicSettings?.ClinicAddress || (clinicSettings as any)?.Address || 'Opposite State Bank, Mall Road, Lahore';
  const clinicPhone = clinicSettings?.PhoneMobile || (clinicSettings as any)?.PhoneNo || '042-3111222';

  const patientDisplayName = data.patient ? data.patient.PatientName : data.patientName || 'Walk-in Guest';
  const patientDisplayId = data.patient ? data.patient.PatientID : data.patientId || '';

  const currentTimeStr = data.invoiceTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const shiftText = Number(data.shift) === 1 ? 'Morning Shift (1)' : Number(data.shift) === 2 ? 'Evening Shift (2)' : 'General Shift';

  const grossCalculated = data.grossAmount ?? data.basket.reduce((sum, item) => sum + (item.Qty * item.Price), 0);

  return `
    <div 
      class="pharmacy-thermal-receipt" 
      style="
        width: ${effectiveWidth}; 
        font-size: ${fontSize}; 
        font-family: Arial, Helvetica, sans-serif; 
        font-weight: 800; 
        color: #000; 
        background: #fff; 
        padding: ${marginVal}; 
        box-sizing: border-box; 
        margin: 0 auto;
      "
    >
      ${showPrinterHeader ? `
        <div style="font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">
          PRINTER: ${printerName.toUpperCase()} (${basePaperWidth})
        </div>
      ` : ''}

      <!-- Brand Header -->
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <h2 style="font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 0; padding: 0; letter-spacing: 0.5px; line-height: 1.2;">
          ${clinicName}
        </h2>
        <p style="font-size: 8.5px; font-weight: 700; margin: 2px 0 0 0; color: #222;">
          ${clinicAddress}
        </p>
        <p style="font-size: 8.5px; font-weight: 700; margin: 1px 0 0 0; color: #222;">
          Phone: ${clinicPhone}
        </p>
        <div style="margin-top: 5px; display: inline-block; background: #000; color: #fff; padding: 2px 8px; border-radius: 2px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px;">
          PHARMACY POS CASH RECEIPT
        </div>
      </div>

      <!-- Invoice Details Grid -->
      <div style="font-size: 9.5px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; line-height: 1.35;">
        <div style="display: flex; justify-content: space-between;">
          <span>INVOICE REF:</span>
          <strong style="font-family: monospace; font-size: 10.5px;">${data.invoiceNo}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>DATE & TIME:</span>
          <span>${data.invoiceDate} ${currentTimeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>PATIENT:</span>
          <strong>${patientDisplayName}${patientDisplayId ? ` (#${patientDisplayId})` : ''}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>SHIFT:</span>
          <span>${shiftText}</span>
        </div>
        ${data.pharmacistName ? `
          <div style="display: flex; justify-content: space-between;">
            <span>DISPENSED BY:</span>
            <span>${data.pharmacistName}</span>
          </div>
        ` : ''}
      </div>

      <!-- Items Section Header -->
      <div style="font-size: 8.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; display: flex; justify-content: space-between;">
        <span>ITEM DESCRIPTION</span>
        <span>QTY x PRICE = AMT</span>
      </div>

      <!-- Items List -->
      <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        ${data.basket.map((item) => {
          const name = item.ItemName || item.ItemID || 'Medicine Item';
          const qty = item.Qty || 1;
          const price = item.Price || 0;
          const total = item.isClinical ? 0 : qty * price;

          return `
            <div style="margin-bottom: 4px; line-height: 1.2;">
              <div style="font-weight: 900; font-size: 9.5px;">${name}</div>
              <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #222;">
                <span>
                  ${item.isClinical 
                    ? '<span style="font-weight: 900; text-transform: uppercase;">[CLINICAL MEDICINE]</span>' 
                    : `${qty} unit(s) x Rs. ${price.toFixed(1)}`}
                  ${item.batchNo ? ` (B:#${item.batchNo})` : ''}
                </span>
                <strong style="font-family: monospace; font-size: 9.5px;">
                  Rs. ${(total || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Summary Totals -->
      <div style="font-size: 9.5px; line-height: 1.4; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between;">
          <span>GROSS AMOUNT:</span>
          <span style="font-family: monospace;">Rs. ${(grossCalculated || 0).toLocaleString()}</span>
        </div>
        ${(data.discount || 0) > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #000;">
            <span>DISCOUNT:</span>
            <span style="font-family: monospace;">- Rs. ${(data.discount || 0).toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
          <span>NET AMOUNT PAID:</span>
          <span style="font-family: monospace; font-size: 12px; font-weight: 900;">Rs. ${(data.netAmount || 0).toLocaleString()}</span>
        </div>
        ${data.cashPaid !== undefined && data.cashPaid > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 8.5px; margin-top: 2px;">
            <span>CASH TENDERED:</span>
            <span style="font-family: monospace;">Rs. ${(data.cashPaid || 0).toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5px;">
            <span>CHANGE DUE:</span>
            <span style="font-family: monospace;">Rs. ${(data.changeDue || 0).toLocaleString()}</span>
          </div>
        ` : ''}
      </div>

      <!-- Receipt Barcode & Footer Signatures -->
      <div style="text-align: center; padding-top: 4px; font-size: 8.5px;">
        <div style="letter-spacing: 3px; font-family: monospace; font-size: 13px; font-weight: 900; margin-bottom: 2px;">
          ||||| | |||| ||| |||||
        </div>
        <div style="font-family: monospace; font-size: 8px; font-weight: 900; margin-bottom: 6px;">
          *${data.invoiceNo}*
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 10px; padding: 0 4px; font-size: 7.5px;">
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #000; width: 65px; height: 14px; margin: 0 auto;"></div>
            <span style="margin-top: 2px; display: block;">DUTY PHARMACIST</span>
          </div>
          <div style="text-align: center;">
            <div style="border-bottom: 1px solid #000; width: 65px; height: 14px; margin: 0 auto;"></div>
            <span style="margin-top: 2px; display: block;">CUSTOMER COPY</span>
          </div>
        </div>

        <p style="font-style: italic; font-size: 8px; margin-top: 8px; font-weight: 700;">
          Thank you for choosing ${clinicName}. Get well soon!
        </p>
      </div>
    </div>
  `;
}

/**
 * Triggers thermal print popup window for Pharmacy POS invoice using configured ThermalPrinterName
 */
export function printPharmacyThermalReceipt(
  data: PharmacyReceiptData,
  clinicSettings?: ClinicSettings
): boolean {
  const printerName = clinicSettings?.ThermalPrinterName || 'Thermal Printer';
  const basePaperWidth = clinicSettings?.ThermalPaperWidth || '60mm';
  const widthOffset = clinicSettings?.ThermalWidthOffset || '+0in';
  const paperHeight = clinicSettings?.ThermalPaperHeight || 'auto';
  const marginVal = clinicSettings?.ThermalMargin || '0mm';
  const scaleVal = clinicSettings?.ThermalScale || '100%';
  const scaleFactor = parseFloat(scaleVal) > 1 ? parseFloat(scaleVal) / 100 : (parseFloat(scaleVal) || 1);

  const effectiveWidth =
    widthOffset && widthOffset !== '+0in'
      ? `calc(${basePaperWidth} + ${widthOffset})`
      : basePaperWidth;

  let pageCssSize = `${effectiveWidth} auto`;
  if (paperHeight && paperHeight !== 'auto') {
    pageCssSize = `${effectiveWidth} ${paperHeight}`;
  }

  const receiptHtml = generatePharmacyThermalHtml(data, clinicSettings);

  const printWin = window.open('', '_blank', 'width=500,height=700');
  if (!printWin) {
    window.print();
    return false;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pharmacy POS Receipt #${data.invoiceNo} - ${printerName}</title>
        <style>
          @page {
            size: ${pageCssSize};
            margin: ${marginVal};
          }
          html, body {
            margin: 0;
            padding: 0;
            width: ${effectiveWidth};
            ${paperHeight && paperHeight !== 'auto' ? `height: ${paperHeight};` : ''}
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          *, p, span, div, h1, h2, h3, h4, strong, b {
            font-weight: 900 !important;
          }
          #thermal-container {
            width: ${effectiveWidth};
            ${paperHeight && paperHeight !== 'auto' ? `min-height: ${paperHeight}; height: ${paperHeight}; max-height: ${paperHeight};` : ''}
            margin: ${marginVal} auto;
            padding: 4px;
            box-sizing: border-box;
            ${scaleVal && scaleVal !== '100%' ? `transform: scale(${scaleFactor}); transform-origin: top center;` : ''}
          }
        </style>
      </head>
      <body>
        <div id="thermal-container">
          ${receiptHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);

  printWin.document.close();
  return true;
}

export interface OPDTokenThermalData {
  tokenNo: number | string;
  patientId: string;
  patientName: string;
  shiftName?: string;
  patientType?: string;
  fee?: number;
  remarks?: string;
  date?: string;
  time?: string;
  doctorName?: string;
}

/**
 * Generate standard HTML content for OPD Token Ticket Receipt
 */
export function generateOPDThermalTokenHtml(
  data: OPDTokenThermalData,
  clinicSettings?: ClinicSettings
): string {
  const printerName = clinicSettings?.ThermalPrinterName || 'Thermal Printer';
  const basePaperWidth = clinicSettings?.ThermalPaperWidth || '60mm';
  const widthOffset = clinicSettings?.ThermalWidthOffset || '+0in';
  const marginVal = clinicSettings?.ThermalMargin || '0mm';
  const fontSize = clinicSettings?.ThermalFontSize || '11px';
  const showPrinterHeader = clinicSettings?.ThermalShowPrinterHeader !== false;

  const effectiveWidth =
    widthOffset && widthOffset !== '+0in'
      ? `calc(${basePaperWidth} + ${widthOffset})`
      : basePaperWidth;

  const clinicName = clinicSettings?.ClinicName || 'PUNJAB HOMEOPATHIC CLINIC';
  const clinicAddress = clinicSettings?.ClinicAddress || (clinicSettings as any)?.Address || '39-Shalimar Road, Garhi Shahu, Lahore';
  const clinicPhone = clinicSettings?.PhoneMobile || (clinicSettings as any)?.PhoneNo || '0300-1234567';

  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const timeStr = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `
    <div 
      class="opd-thermal-token" 
      style="
        width: ${effectiveWidth}; 
        font-size: ${fontSize}; 
        font-family: Arial, Helvetica, sans-serif; 
        font-weight: 800; 
        color: #000; 
        background: #fff; 
        padding: ${marginVal}; 
        box-sizing: border-box; 
        margin: 0 auto;
      "
    >
      ${showPrinterHeader ? `
        <div style="font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">
          PRINTER: ${printerName.toUpperCase()} (${basePaperWidth})
        </div>
      ` : ''}

      <!-- Brand Header -->
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <h2 style="font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 0; padding: 0; letter-spacing: 0.5px; line-height: 1.2;">
          ${clinicName}
        </h2>
        <p style="font-size: 8.5px; font-weight: 700; margin: 2px 0 0 0; color: #222;">
          ${clinicAddress}
        </p>
        <p style="font-size: 8.5px; font-weight: 700; margin: 1px 0 0 0; color: #222;">
          Tel: ${clinicPhone}
        </p>
        <div style="margin-top: 5px; display: inline-block; background: #000; color: #fff; padding: 2px 8px; border-radius: 2px; font-size: 9.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px;">
          OPD APPOINTMENT TOKEN
        </div>
      </div>

      <!-- Token Number Section -->
      <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #333;">TOKEN NUMBER</div>
        <div style="font-size: 32px; font-weight: 900; font-family: monospace; letter-spacing: 2px; margin: 2px 0; color: #000;">
          #${data.tokenNo}
        </div>
        ${data.shiftName ? `
          <div style="display: inline-block; border: 1px solid #000; padding: 1px 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; border-radius: 2px; margin-top: 2px;">
            ${data.shiftName}
          </div>
        ` : ''}
      </div>

      <!-- Patient & Appointment Details -->
      <div style="font-size: 9.5px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between;">
          <span>DATE & TIME:</span>
          <span style="font-family: monospace; font-weight: 900;">${dateStr} ${timeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>PATIENT ID:</span>
          <strong style="font-family: monospace; font-size: 10px;">${data.patientId}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>PATIENT NAME:</span>
          <strong style="text-transform: uppercase;">${data.patientName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>PATIENT TYPE:</span>
          <span style="font-weight: 900; text-transform: uppercase;">[${data.patientType || 'New Patient'}]</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>DOCTOR:</span>
          <strong>${data.doctorName || 'Dr. Ejaz Ahmad (DHMS)'}</strong>
        </div>
      </div>

      <!-- Fee Box -->
      <div style="font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 4px 6px; border: 1px solid #000; border-radius: 2px;">
          <span style="font-weight: 900; text-transform: uppercase; font-size: 9px;">OPD / APP FEE:</span>
          <strong style="font-family: monospace; font-size: 11px;">
            ${data.fee === 0 ? 'PKR 0' : `PKR ${(data.fee !== undefined && data.fee !== null ? data.fee : 0).toLocaleString()}`}
          </strong>
        </div>
        ${data.remarks ? `
          <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 9px;">
            <span>REMARKS:</span>
            <span style="text-transform: uppercase; font-weight: 800;">${data.remarks}</span>
          </div>
        ` : ''}
      </div>

      <!-- Footnote -->
      <div style="text-align: center; font-size: 8.5px; font-weight: 800; line-height: 1.3; color: #222;">
        <p style="margin: 0; text-transform: uppercase; font-weight: 900;">Please wait for your token call.</p>
        <p style="margin: 2px 0 0 0; text-transform: uppercase; color: #444;">Keep this ticket with you.</p>
      </div>
    </div>
  `;
}

/**
 * Triggers thermal print popup window for OPD Token Ticket using configured ThermalPrinterName
 */
export function printOPDThermalToken(
  data: OPDTokenThermalData,
  clinicSettings?: ClinicSettings
): boolean {
  const printerName = clinicSettings?.ThermalPrinterName || 'Thermal Printer';
  const basePaperWidth = clinicSettings?.ThermalPaperWidth || '60mm';
  const widthOffset = clinicSettings?.ThermalWidthOffset || '+0in';
  const paperHeight = clinicSettings?.ThermalPaperHeight || 'auto';
  const marginVal = clinicSettings?.ThermalMargin || '0mm';
  const scaleVal = clinicSettings?.ThermalScale || '100%';
  const scaleFactor = parseFloat(scaleVal) > 1 ? parseFloat(scaleVal) / 100 : (parseFloat(scaleVal) || 1);

  const effectiveWidth =
    widthOffset && widthOffset !== '+0in'
      ? `calc(${basePaperWidth} + ${widthOffset})`
      : basePaperWidth;

  let pageCssSize = `${effectiveWidth} auto`;
  if (paperHeight && paperHeight !== 'auto') {
    pageCssSize = `${effectiveWidth} ${paperHeight}`;
  }

  const tokenHtml = generateOPDThermalTokenHtml(data, clinicSettings);

  const printWin = window.open('', '_blank', 'width=500,height=600');
  if (!printWin) {
    window.print();
    return false;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>OPD Token Ticket #${data.tokenNo} - ${printerName}</title>
        <style>
          @page {
            size: ${pageCssSize};
            margin: ${marginVal};
          }
          html, body {
            margin: 0;
            padding: 0;
            width: ${effectiveWidth};
            ${paperHeight && paperHeight !== 'auto' ? `height: ${paperHeight};` : ''}
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          *, p, span, div, h1, h2, h3, h4, strong, b {
            font-weight: 900 !important;
          }
          #thermal-container {
            width: ${effectiveWidth};
            ${paperHeight && paperHeight !== 'auto' ? `min-height: ${paperHeight}; height: ${paperHeight}; max-height: ${paperHeight};` : ''}
            margin: ${marginVal} auto;
            padding: 4px;
            box-sizing: border-box;
            ${scaleVal && scaleVal !== '100%' ? `transform: scale(${scaleFactor}); transform-origin: top center;` : ''}
          }
        </style>
      </head>
      <body>
        <div id="thermal-container">
          ${tokenHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);

  printWin.document.close();
  return true;
}

