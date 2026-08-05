import { Patient } from '../types';

/**
 * Generates a standard Patient ID in the format YYYYMMDD-### (e.g. 20260805-001)
 * @param existingPatients List of existing patients
 * @param date Registration date (defaults to current date)
 */
export const generatePatientId = (existingPatients: Patient[] = [], date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const datePrefix = `${yyyy}${mm}${dd}`;

  // Count existing patient IDs starting with datePrefix-
  const matchingToday = (existingPatients || []).filter(p => {
    if (!p || !p.PatientID) return false;
    return p.PatientID.startsWith(`${datePrefix}-`);
  });

  let seqNum = matchingToday.length + 1;
  let candidateId = `${datePrefix}-${String(seqNum).padStart(3, '0')}`;

  // Safety check to ensure complete uniqueness
  while ((existingPatients || []).some(p => p && p.PatientID === candidateId)) {
    seqNum++;
    candidateId = `${datePrefix}-${String(seqNum).padStart(3, '0')}`;
  }

  return candidateId;
};
