import { AssessmentRecord, LamProfile, StudyProgramInfo } from '../types/accreditation';

export const INITIAL_STUDY_PROGRAMS: Record<string, StudyProgramInfo> = {
  'LAMDIK-S1': {
    universityName: 'Universitas Pattimura',
    facultyName: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    studyProgramName: 'S1 Pendidikan Guru Sekolah Dasar (PGSD)',
    degreeLevel: 'S1',
    accreditationTarget: 'UNGGUL (5 TAHUN)',
    assessmentDateStart: '2026-10-14',
    assessmentDateEnd: '2026-10-16',
    skPenugasanNo: 'SK-DE/LAMDIK-S1/AL-2026/0842',
    asesor1Name: 'Prof. Dr. Natelda Timisela, M.Pd.',
    asesor1Institution: 'Universitas Pattimura (Lead Assessor LAMDIK S1)',
    asesor2Name: 'Dr. Bruri Melky Laimeheriwa, M.Si.',
    asesor2Institution: 'Universitas Pattimura (Member Assessor LAMDIK S1)',
    dekanOrKaprodiName: 'Prof. Dr. Izak H. Leasa, M.Pd. (Dekan FKIP)',
  },
  'LAMDIK-S2': {
    universityName: 'Universitas Pattimura',
    facultyName: 'Program Pascasarjana',
    studyProgramName: 'S2 Manajemen Pendidikan',
    degreeLevel: 'S2',
    accreditationTarget: 'UNGGUL (5 TAHUN)',
    assessmentDateStart: '2026-10-14',
    assessmentDateEnd: '2026-10-16',
    skPenugasanNo: 'SK-DE/LAMDIK-S2/AL-2026/0843',
    asesor1Name: 'Prof. Dr. Natelda Timisela, M.Pd.',
    asesor1Institution: 'Universitas Pattimura (Lead Assessor LAMDIK S2)',
    asesor2Name: 'Dr. Bruri Melky Laimeheriwa, M.Si.',
    asesor2Institution: 'Universitas Pattimura (Member Assessor LAMDIK S2)',
    dekanOrKaprodiName: 'Prof. Dr. N. Saptenno, M.Hum. (Direktur Pascasarjana)',
  },
  'LAMDIK-S3': {
    universityName: 'Universitas Pattimura',
    facultyName: 'Program Pascasarjana',
    studyProgramName: 'S3 Administrasi Pendidikan',
    degreeLevel: 'S3',
    accreditationTarget: 'UNGGUL (5 TAHUN)',
    assessmentDateStart: '2026-10-14',
    assessmentDateEnd: '2026-10-16',
    skPenugasanNo: 'SK-DE/LAMDIK-S3/AL-2026/0844',
    asesor1Name: 'Prof. Dr. Natelda Timisela, M.Pd.',
    asesor1Institution: 'Universitas Pattimura (Lead Assessor LAMDIK S3)',
    asesor2Name: 'Dr. Bruri Melky Laimeheriwa, M.Si.',
    asesor2Institution: 'Universitas Pattimura (Member Assessor LAMDIK S3)',
    dekanOrKaprodiName: 'Prof. Dr. J. Riry, M.Pd. (Kaprodi S3)',
  },
  'LAMDIK-Profesi': {
    universityName: 'Universitas Pattimura',
    facultyName: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    studyProgramName: 'Program Profesi Guru (PPG)',
    degreeLevel: 'Profesi',
    accreditationTarget: 'UNGGUL (5 TAHUN)',
    assessmentDateStart: '2026-10-14',
    assessmentDateEnd: '2026-10-16',
    skPenugasanNo: 'SK-DE/LAMDIK-PPG/AL-2026/0845',
    asesor1Name: 'Prof. Dr. Natelda Timisela, M.Pd.',
    asesor1Institution: 'Universitas Pattimura (Lead Assessor LAMDIK PPG)',
    asesor2Name: 'Dr. Bruri Melky Laimeheriwa, M.Si.',
    asesor2Institution: 'Universitas Pattimura (Member Assessor LAMDIK PPG)',
    dekanOrKaprodiName: 'Dr. A. Dahlan, M.Pd. (Kaprodi PPG)',
  },
};

export function generateDefaultRecords(profile: LamProfile): Record<string, AssessmentRecord> {
  const records: Record<string, AssessmentRecord> = {};

  for (const ind of profile.indicators) {
    const varMap: Record<string, number> = {};
    if (ind.scoringFormula) {
      for (const v of ind.scoringFormula.variables) {
        varMap[v.key] = 0;
      }
    }

    records[ind.id] = {
      indicatorId: ind.id,
      scoreAsesor1: 0,
      scoreAsesor2: 0,
      scoreConsensus: 0,
      scoreSelf: 0,
      notesAsesor1: '',
      notesAsesor2: '',
      consensusNotes: '',
      evidenceChecked: false,
      variableValues: varMap,
      isRated: false,
    };
  }

  return records;
}

export const DEFAULT_GLOBAL_VARIABLES: Record<string, number> = {
  PTW: 82.5,
  PPS: 91.0,
  WT: 3.5,
  PDGBLKL: 60.0,
  P_S3: 100,
  P_Lektor: 5,
  N_Lektor: 5,
  N_LektorKepala: 3,
  N_GuruBesar: 4,
  P_GBLK: 15,
  WT_INFO: 3.5,
  P_S3_EMBA: 100,
  Kesesuaian: 90,
  P_IPM: 25,
  Lulus_UKM: 95,
  UKOM: 90,
  P_LektorKepala: 4,
  PDGBLKL_Pub: 50,
};

export const INDONESIAN_UNIVERSITIES: string[] = [
  'Universitas Pattimura (UNPATTI)',
  'Universitas Pendidikan Indonesia (UPI)',
  'Universitas Negeri Malang (UM)',
  'Universitas Negeri Yogyakarta (UNY)',
  'Universitas Negeri Surabaya (UNESA)',
  'Universitas Negeri Semarang (UNNES)',
  'Universitas Negeri Medan (UNIMED)',
  'Universitas Negeri Padang (UNP)',
  'Universitas Negeri Makassar (UNM)',
  'Universitas Gadjah Mada (UGM)',
  'Universitas Indonesia (UI)',
  'Universitas Brawijaya (UB)',
  'Universitas Hasanuddin (UNHAS)',
  'Dewan Pengurus LAMDIK',
];

export const UPPS_LEADERSHIP_ROLES: { label: string; value: string; fullTitle: string }[] = [
  { label: 'Dekan', value: 'Dekan', fullTitle: 'Dekan Fakultas' },
  { label: 'Direktur', value: 'Direktur', fullTitle: 'Direktur Pascasarjana / Sekolah / Politeknik' },
  { label: 'WaDek', value: 'WaDek', fullTitle: 'Wakil Dekan (Bidang Akademik / Umum)' },
  { label: 'WaDir', value: 'WaDir', fullTitle: 'Wakil Direktur' },
];
