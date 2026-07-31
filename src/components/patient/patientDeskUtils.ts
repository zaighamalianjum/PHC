import { Patient, Appointment, Visit, NhcPatientHistory } from '../../types';

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr === 'N/A' || dateStr === '—') return dateStr || 'N/A';
  try {
    const cleanStr = String(dateStr).trim().split('T')[0].split(' ')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (parts.length === 3 && parts[2].length === 4) {
      return cleanStr;
    }
    const d = new Date(String(dateStr).trim());
    if (isNaN(d.getTime())) return String(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return String(dateStr);
  }
}

export function getPatientType(
  patientId: string,
  patients: Patient[],
  visits: Visit[],
  nhcPatients: NhcPatientHistory[],
  appointments: Appointment[]
): 'New Patient' | 'Old Patient' {
  if (!patientId) return 'New Patient';
  const pat = patients.find((p) => p.PatientID === patientId);
  if (!pat) return 'New Patient';

  const hasVisits = (visits || []).some((v) => v.PatientID === patientId);
  const hasNhc = (nhcPatients || []).some((n) => n.PatientID === patientId);
  const realToday = new Date().toISOString().split('T')[0];
  const hasPriorApp = (appointments || []).some(
    (a) => a.PatientID === patientId && a.AppointmentDate < realToday
  );

  return hasVisits || hasNhc || hasPriorApp ? 'Old Patient' : 'New Patient';
}

export function matchPatientRecord(
  p: { PatientName?: string; PatientID?: string; PhoneMobile?: string | number },
  query: string
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const name = String(p.PatientName || '').toLowerCase();
  const id = String(p.PatientID || '').toLowerCase();
  const phone = String(p.PhoneMobile || '').toLowerCase();

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanId = id.replace(/[^0-9a-zA-Z]/g, '');

  return terms.every((term) => {
    const cleanTerm = term.replace(/[^0-9a-zA-Z]/g, '');

    if (name.includes(term)) return true;
    if (id.includes(term)) return true;
    if (phone.includes(term)) return true;

    if (cleanTerm) {
      if (cleanId.includes(cleanTerm)) return true;
      if (cleanPhone.includes(cleanTerm)) return true;
    }

    return false;
  });
}

export function getResolvedNhcPatientName(
  nhcRecord: any,
  allPatients: Patient[] = [],
  allNhcList: NhcPatientHistory[] = []
): string {
  if (!nhcRecord) return '';
  const directName =
    nhcRecord.PatientName ||
    nhcRecord.patientName ||
    nhcRecord.Name ||
    nhcRecord.Patient_Name ||
    nhcRecord.patient_name;
  if (
    directName &&
    typeof directName === 'string' &&
    directName.trim() &&
    directName.trim() !== 'NHC Archive Patient' &&
    directName.trim() !== 'NHC Record'
  ) {
    return directName.trim();
  }

  if (nhcRecord.PatientID) {
    const activeMatch = allPatients.find((p) => p.PatientID === nhcRecord.PatientID);
    if (activeMatch && activeMatch.PatientName && activeMatch.PatientName.trim()) {
      return activeMatch.PatientName.trim();
    }

    const namedNhc = allNhcList.find(
      (item) =>
        item.PatientID === nhcRecord.PatientID &&
        (item.PatientName || (item as any).patientName || (item as any).Name) &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Archive Patient' &&
        String(item.PatientName || (item as any).patientName || (item as any).Name).trim() !== 'NHC Record'
    );
    if (namedNhc) {
      const name = namedNhc.PatientName || (namedNhc as any).patientName || (namedNhc as any).Name;
      if (name && typeof name === 'string' && name.trim()) return name.trim();
    }
  }

  return nhcRecord.PatientID ? `Patient (${nhcRecord.PatientID})` : 'Patient Record';
}
