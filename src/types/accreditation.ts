/**
 * Universal Accreditation Engine Types
 * Multi-LAM Architecture for Indonesian Higher Education Accreditation
 */

export type ScoreLevel = 0 | 1 | 2 | 3 | 4;

export interface RubricLevel {
  score: ScoreLevel;
  label: string;
  description: string;
  benchmarks?: string[];
}

export interface FormulaVariable {
  key: string;
  label: string;
  defaultValue: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface ScoringFormula {
  latex: string;
  variables: FormulaVariable[];
  // JavaScript mathematical expression evaluated safely: e.g. "Math.min(4, Math.max(0, (ndS3 / ndtps) * 4))"
  expression: string;
  explanation: string;
}

export interface SubKriteriaNode {
  code: string; // e.g. "1.1", "2.1", "2.1.1"
  title: string; // e.g. "Masukan", "Relevansi Pendidikan"
  fullTitle: string; // e.g. "1.1 Masukan", "2.1.1 Masukan"
  level: 2 | 3;
  dimensi?: 'Masukan' | 'Proses' | 'Luaran' | 'Dampak';
  parentCode?: string;
  children?: SubKriteriaNode[];
}

export interface KriteriaItemDef {
  number: number; // 1, 2, 3, 4
  code?: string;
  title: string;
  shortTitle?: string;
  description: string;
  totalWeight: number;
  subKriteria?: SubKriteriaNode[];
}

export interface IndicatorItem {
  id: string;
  code: string; // e.g. "1.1.1", "2.1.1", "C.1.1", "IND-02"
  kriteriaNumber: number; // 1 to 4
  kriteriaCode?: string; // "1", "2", "3", "4"
  kriteriaTitle: string; // e.g. "Kriteria 1: Budaya Mutu"
  subKriteriaCode?: string; // e.g. "1.1", "1.2", "2.1.1", "2.1.2", "3.1", "4.1"
  subKriteriaTitle?: string; // e.g. "1.1 Masukan", "2.1.1 Masukan (Pendidikan)"
  dimensi?: 'Masukan' | 'Proses' | 'Luaran' | 'Dampak';
  sasaranMutu?: 'Masukan' | 'Proses' | 'Luaran' | 'Dampak';
  indicatorNumber?: number;
  name: string;
  element: string; // e.g. "Kecukupan Dosen Tetap Perguruan Tinggi (DTPS)"
  category: 'Kuantitatif' | 'Kualitatif' | 'Hybrid';
  bobot: number; // Weight in AL (e.g. 1.5, 2.0, 3.0)
  sourceDoc: 'LKPS' | 'DKPS' | 'LKK' | 'LED' | 'LKD' | 'LPT' | 'UNIVERSAL';
  rubric: {
    score0: string;
    score1: string;
    score2: string;
    score3: string;
    score4: string;
  };
  scoringFormula?: ScoringFormula;
  defaultAssessor1Score?: number;
  defaultAssessor2Score?: number;
  defaultSelfScore?: number;
  evidenceTags?: string[];
  isSyaratUnggul?: boolean;
}

export interface SyaratUnggulRule {
  id: string;
  indicatorKey: string;
  indicatorName: string;
  description: string;
  ruleType: 'min_score' | 'formula' | 'multi_indicator';
  minScore?: number;
  targetIndicators?: string[]; // IDs of indicators
  formula?: string; // Logical expression e.g. "PTW >= 45 || PPS >= 75"
  latexRule?: string;
  fallbackRank: 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI';
}

export interface LamDocumentTerms {
  quantitativeDoc: string; // "LKPS" | "DKPS" | "LKK"
  qualitativeDoc: string; // "LED" | "LKD" | "LPT"
  worksheetDoc: string; // "Kertas Kerja AL" | "Instrumen Penilaian"
  institutionLevelDoc: string; // "Lembaga Pengelola" / "UPPS"
}

export interface LamProfile {
  lamCode: string; // "LAM PTIP"
  lamName: string;
  focusArea: string;
  regulationBasis: string;
  totalIndicators: number;
  maxScoreScale: number; // Usually 400 or 4.00
  thresholdUnggul: number; // e.g. 361
  thresholdUnggul3Th: number; // e.g. 341
  thresholdTerakreditasi: number; // e.g. 200
  docTerms: LamDocumentTerms;
  kriteriaList: KriteriaItemDef[];
  syaratUnggulRules: SyaratUnggulRule[];
  indicators: IndicatorItem[];
}

export interface EvidenceLink {
  id: string;
  title: string;
  url: string;
  domain: string;
  foundInDoc: string; // e.g. "LKPS Tabel 4.1" or "LED Kriteria 3 Hal 28"
  indicatorId?: string;
  indicatorCode?: string;
  status: 'valid' | 'suspicious' | 'pending' | 'accessible';
  driveType?: 'Google Drive' | 'OneDrive' | 'SPMI Portal' | 'Repository PT' | 'External Web';
  notes?: string;
}

export interface AssessmentRecord {
  indicatorId: string;
  scoreAsesor1: number;
  scoreAsesor2: number;
  scoreConsensus: number;
  scoreSelf: number;
  notesAsesor1: string;
  notesAsesor2: string;
  consensusNotes: string;
  evidenceChecked: boolean;
  variableValues?: Record<string, number>;
  isRated?: boolean;
}

export interface StudyProgramInfo {
  universityName: string;
  facultyName: string;
  studyProgramName: string;
  degreeLevel: string; // "Sarjana (S1)", "Magister (S2)", "Diploma (D4)"
  accreditationTarget: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI';
  assessmentDateStart: string;
  assessmentDateEnd: string;
  skPenugasanNo: string;
  asesor1Name: string;
  asesor1Institution: string;
  asesor2Name: string;
  asesor2Institution: string;
  dekanOrKaprodiName: string;
  dekanRoleType?: 'Dekan' | 'Direktur' | 'WaDek' | 'WaDir' | string;
}

export interface SyaratEvaluationResult {
  rule: SyaratUnggulRule;
  passed: boolean;
  actualValueText: string;
  reason: string;
}
