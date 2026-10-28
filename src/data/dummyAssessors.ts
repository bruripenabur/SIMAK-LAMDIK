/**
 * Data Dummy Asesor dan Model Autentikasi Asesor LAMDIK
 * Khusus untuk simulasi nilai akreditasi LAMDIK (Lembaga Akreditasi Mandiri Kependidikan)
 */

export interface AssessorAccount {
  id: string;
  assessorNumber: string; // Kode Nomor Asesor e.g. "ASR-LAMDIK-001"
  fullName: string;
  email: string;
  institution: string;
  assignedLam: string; // "LAMDIK"
  role: 'asesor1' | 'asesor2' | 'consensus';
  roleTitle: string; // e.g. "Asesor 1 (Lead Assessor)", "Asesor 2 (Member)"
  specialization: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export const DUMMY_ASSESSORS: AssessorAccount[] = [
  {
    id: 'asr-lamdik-01',
    assessorNumber: 'ASR-LAMDIK-001',
    fullName: 'Prof. Dr. Natelda Timisela, M.Pd.',
    email: 'natelda.timisela@unpatti.ac.id',
    institution: 'Universitas Pattimura (Lead Assessor LAMDIK)',
    assignedLam: 'LAMDIK',
    role: 'asesor1',
    roleTitle: 'Lead Asesor (Asesor 1)',
    specialization: 'Kurikulum Pembelajaran & Evaluasi Pendidikan Kependidikan',
    phoneNumber: '0812-4011-8890',
  },
  {
    id: 'asr-lamdik-02',
    assessorNumber: 'ASR-LAMDIK-002',
    fullName: 'Dr. Bruri Melky Laimeheriwa, M.Si.',
    email: 'bruri.laimeheriwa@unpatti.ac.id',
    institution: 'Universitas Pattimura (Member Assessor LAMDIK)',
    assignedLam: 'LAMDIK',
    role: 'asesor2',
    roleTitle: 'Member Asesor (Asesor 2)',
    specialization: 'Manajemen Pendidikan & Penjaminan Mutu SPMI',
    phoneNumber: '0813-8821-4321',
  },
  {
    id: 'asr-lamdik-03',
    assessorNumber: 'ASR-LAMDIK-003',
    fullName: 'Prof. Dr. Muchlas Samani, M.Pd.',
    email: 'dewan@lamdik.or.id',
    institution: 'Dewan Pengurus LAMDIK Pusat',
    assignedLam: 'LAMDIK',
    role: 'consensus',
    roleTitle: 'Asesor Konsolidasi / Validator Lapangan',
    specialization: 'Kebijakan Standar Nasional Pendidikan Kependidikan',
    phoneNumber: '0811-9922-3344',
  },
];

// Helper to find assessor by assessor number
export function findAssessorByNumber(number: string): AssessorAccount | undefined {
  const cleaned = number.trim().toUpperCase();
  return DUMMY_ASSESSORS.find(a => a.assessorNumber.toUpperCase() === cleaned);
}

// Session storage helpers for Assessor login
export const ASSESSOR_SESSION_KEY = 'SIMAK_LAMDIK_ASSESSOR_SESSION_V2';

export function getStoredAssessorSession(): AssessorAccount | null {
  try {
    const data = localStorage.getItem(ASSESSOR_SESSION_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveAssessorSession(assessor: AssessorAccount): void {
  try {
    localStorage.setItem(ASSESSOR_SESSION_KEY, JSON.stringify(assessor));
  } catch {
    // ignore
  }
}

export function clearAssessorSession(): void {
  try {
    localStorage.removeItem(ASSESSOR_SESSION_KEY);
  } catch {
    // ignore
  }
}
