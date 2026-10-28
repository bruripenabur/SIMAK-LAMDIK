import * as XLSX from 'xlsx';
import { IndicatorItem, LamProfile, AssessmentRecord } from '../types/accreditation';

export interface ParsedMatrikResult {
  success: boolean;
  fileName: string;
  sheetName: string;
  totalRows: number;
  matchedIndicators: number;
  scoresLoadedCount: number;
  records: Record<string, Partial<AssessmentRecord>>;
  updatedBobotMap?: Record<string, number>;
  totalBobotLoaded: number;
  warnings: string[];
  samplePreview: Array<{
    no: string | number;
    name: string;
    bobot: number;
    scoreA1: number;
    scoreA2: number;
  }>;
}

/**
 * Normalizes string keys for flexible column matching in Excel headers
 */
function normalizeHeader(str: any): string {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[\s_\-./\\]+/g, '');
}

/**
 * Parse an uploaded Matrik Penilaian file (.xlsx, .xls, .csv, .json)
 */
export async function parseMatrikPenilaianFile(
  file: File,
  currentIndicators: IndicatorItem[]
): Promise<ParsedMatrikResult> {
  const isJson = file.name.toLowerCase().endsWith('.json');

  if (isJson) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const records: Record<string, Partial<AssessmentRecord>> = {};
      let matchedCount = 0;
      let scoresCount = 0;
      let totalBobot = 0;

      // Handle raw record map or array
      const items = Array.isArray(json) ? json : (json.records ? Object.values(json.records) : Object.values(json));
      for (const item of items as any[]) {
        const idOrNum = item.indicatorId || item.id || item.indicatorNumber || item.code || item.no;
        if (!idOrNum) continue;

        const matchedInd = currentIndicators.find(
          ind => ind.id === String(idOrNum) || 
                 String(ind.indicatorNumber) === String(idOrNum) || 
                 ind.code.toLowerCase() === String(idOrNum).toLowerCase()
        );

        if (matchedInd) {
          const s1 = typeof item.scoreAsesor1 === 'number' ? Math.min(4, Math.max(0, item.scoreAsesor1)) : 0;
          const s2 = typeof item.scoreAsesor2 === 'number' ? Math.min(4, Math.max(0, item.scoreAsesor2)) : 0;
          const sc = typeof item.scoreConsensus === 'number' ? Math.min(4, Math.max(0, item.scoreConsensus)) : Math.round(((s1 + s2) / 2) * 10) / 10;
          const self = typeof item.scoreSelf === 'number' ? Math.min(4, Math.max(0, item.scoreSelf)) : 0;

          if (s1 > 0 || s2 > 0 || sc > 0) scoresCount++;

          records[matchedInd.id] = {
            indicatorId: matchedInd.id,
            scoreAsesor1: s1,
            scoreAsesor2: s2,
            scoreConsensus: sc,
            scoreSelf: self,
            notesAsesor1: item.notesAsesor1 || '',
            notesAsesor2: item.notesAsesor2 || '',
            consensusNotes: item.consensusNotes || '',
            evidenceChecked: Boolean(item.evidenceChecked),
            isRated: s1 > 0 || s2 > 0 || sc > 0,
          };
          matchedCount++;
          totalBobot += matchedInd.bobot;
        }
      }

      return {
        success: true,
        fileName: file.name,
        sheetName: 'JSON Matrix',
        totalRows: items.length,
        matchedIndicators: matchedCount,
        scoresLoadedCount: scoresCount,
        records,
        totalBobotLoaded: Math.round(totalBobot * 100) / 100,
        warnings: [],
        samplePreview: Object.values(records).slice(0, 5).map(r => ({
          no: r.indicatorId || '',
          name: currentIndicators.find(i => i.id === r.indicatorId)?.name || '',
          bobot: currentIndicators.find(i => i.id === r.indicatorId)?.bobot || 0,
          scoreA1: r.scoreAsesor1 ?? 0,
          scoreA2: r.scoreAsesor2 ?? 0,
        })),
      };
    } catch (err: any) {
      throw new Error(`Format JSON tidak valid: ${err.message}`);
    }
  }

  // Parse Excel / CSV using SheetJS
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Berkas spreadsheet kosong atau tidak memiliki sheet.');
  }

  // Prioritize sheet containing matrix keywords
  const preferredSheetName = workbook.SheetNames.find(s => {
    const l = s.toLowerCase();
    return l.includes('matrik') || l.includes('matrix') || l.includes('iaps') || l.includes('penilaian') || l.includes('instrumen');
  }) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[preferredSheetName];
  if (!worksheet) {
    throw new Error(`Sheet '${preferredSheetName}' tidak dapat dibaca.`);
  }

  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) {
    throw new Error('Lembar kerja spreadsheet kosong.');
  }

  // Detect header row index
  let headerRowIdx = -1;
  let colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;

    const rowStr = row.map(normalizeHeader);
    const hasNo = rowStr.some(h => h === 'no' || h === 'nomor' || h.includes('indikator') || h.includes('kode'));
    const hasBobotOrScore = rowStr.some(h => h.includes('bobot') || h.includes('skor') || h.includes('nilai'));

    if (hasNo && hasBobotOrScore) {
      headerRowIdx = r;
      // Map columns
      rowStr.forEach((h, colIdx) => {
        if (!h) return;
        if (h === 'no' || h === 'nomor' || h === 'noindikator' || h === 'nomorindikator') colMap['no'] = colIdx;
        else if (h.includes('kode') || h === 'id') colMap['code'] = colIdx;
        else if (h.includes('kriteria')) colMap['kriteria'] = colIdx;
        else if (h.includes('elemen') || h.includes('indikatorpenilaian') || h.includes('nama')) colMap['name'] = colIdx;
        else if (h.includes('bobot')) colMap['bobot'] = colIdx;
        else if (h.includes('asesor1') || h.includes('skor1') || h.includes('skora1') || h === 'a1') colMap['scoreA1'] = colIdx;
        else if (h.includes('asesor2') || h.includes('skor2') || h.includes('skora2') || h === 'a2') colMap['scoreA2'] = colIdx;
        else if (h.includes('konsensus') || h.includes('kesepakatan') || h === 'skorkonsensus') colMap['scoreConsensus'] = colIdx;
        else if (h.includes('led') || h.includes('lkps') || h.includes('mandiri') || h.includes('upps')) colMap['scoreSelf'] = colIdx;
        else if (h === 'skor' || h === 'nilai' || h.includes('skorakhir')) colMap['scoreGeneral'] = colIdx;
        else if (h.includes('catatan') || h.includes('temuan') || h.includes('keterangan')) colMap['notes'] = colIdx;
      });
      break;
    }
  }

  // If no header found, assume standard default column layout
  if (headerRowIdx === -1) {
    headerRowIdx = 0;
    colMap = {
      no: 0,
      kriteria: 1,
      name: 2,
      bobot: 3,
      scoreA1: 4,
      scoreA2: 5,
      scoreConsensus: 6,
      notes: 7,
    };
  }

  const records: Record<string, Partial<AssessmentRecord>> = {};
  const updatedBobotMap: Record<string, number> = {};
  const warnings: string[] = [];
  const samplePreview: ParsedMatrikResult['samplePreview'] = [];
  let matchedCount = 0;
  let scoresCount = 0;
  let totalBobot = 0;

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Read indicator identification
    const rawNo = colMap['no'] !== undefined ? row[colMap['no']] : undefined;
    const rawCode = colMap['code'] !== undefined ? row[colMap['code']] : undefined;
    const rawName = colMap['name'] !== undefined ? row[colMap['name']] : undefined;

    if (rawNo === undefined && rawCode === undefined && rawName === undefined) continue;

    const noClean = rawNo !== undefined ? String(rawNo).trim().replace(/[^0-9.]/g, '') : '';
    const numVal = parseInt(noClean, 10);

    // Try to find matching indicator in current LAM
    let matchedInd: IndicatorItem | undefined = undefined;

    if (!isNaN(numVal) && numVal > 0 && numVal <= 100) {
      matchedInd = currentIndicators.find(ind => ind.indicatorNumber === numVal || ind.code === String(numVal));
    }
    if (!matchedInd && rawCode) {
      const codeClean = String(rawCode).trim().toLowerCase();
      matchedInd = currentIndicators.find(ind => ind.code.toLowerCase() === codeClean || ind.id.toLowerCase() === codeClean);
    }
    if (!matchedInd && rawName && typeof rawName === 'string') {
      const nameClean = rawName.trim().toLowerCase();
      matchedInd = currentIndicators.find(ind => ind.name.toLowerCase().includes(nameClean.slice(0, 20)));
    }

    if (matchedInd) {
      // Parse bobot if present
      if (colMap['bobot'] !== undefined) {
        const rawB = parseFloat(String(row[colMap['bobot']]).replace(',', '.'));
        if (!isNaN(rawB) && rawB > 0) {
          updatedBobotMap[matchedInd.id] = rawB;
        }
      }

      // Parse scores
      const rawA1 = colMap['scoreA1'] !== undefined ? parseFloat(String(row[colMap['scoreA1']]).replace(',', '.')) : NaN;
      const rawA2 = colMap['scoreA2'] !== undefined ? parseFloat(String(row[colMap['scoreA2']]).replace(',', '.')) : NaN;
      const rawC = colMap['scoreConsensus'] !== undefined ? parseFloat(String(row[colMap['scoreConsensus']]).replace(',', '.')) : NaN;
      const rawGen = colMap['scoreGeneral'] !== undefined ? parseFloat(String(row[colMap['scoreGeneral']]).replace(',', '.')) : NaN;
      const rawSelf = colMap['scoreSelf'] !== undefined ? parseFloat(String(row[colMap['scoreSelf']]).replace(',', '.')) : NaN;

      const s1 = !isNaN(rawA1) ? Math.min(4, Math.max(0, rawA1)) : (!isNaN(rawGen) ? Math.min(4, Math.max(0, rawGen)) : 0);
      const s2 = !isNaN(rawA2) ? Math.min(4, Math.max(0, rawA2)) : (!isNaN(rawGen) ? Math.min(4, Math.max(0, rawGen)) : 0);
      const consensus = !isNaN(rawC) ? Math.min(4, Math.max(0, rawC)) : Math.round(((s1 + s2) / 2) * 10) / 10;
      const self = !isNaN(rawSelf) ? Math.min(4, Math.max(0, rawSelf)) : 0;

      const rawNotes = colMap['notes'] !== undefined ? String(row[colMap['notes']] || '') : '';

      if (s1 > 0 || s2 > 0 || consensus > 0) {
        scoresCount++;
      }

      records[matchedInd.id] = {
        indicatorId: matchedInd.id,
        scoreAsesor1: s1,
        scoreAsesor2: s2,
        scoreConsensus: consensus,
        scoreSelf: self,
        notesAsesor1: rawNotes || (s1 > 0 ? `Diimpor dari Matrik Penilaian ${file.name}` : ''),
        notesAsesor2: rawNotes || (s2 > 0 ? `Diimpor dari Matrik Penilaian ${file.name}` : ''),
        consensusNotes: rawNotes || (consensus > 0 ? `Hasil konsensus matrik penilaian.` : ''),
        evidenceChecked: true,
        isRated: s1 > 0 || s2 > 0 || consensus > 0,
      };

      matchedCount++;
      totalBobot += matchedInd.bobot;

      if (samplePreview.length < 5) {
        samplePreview.push({
          no: matchedInd.indicatorNumber ?? matchedInd.code,
          name: matchedInd.name,
          bobot: matchedInd.bobot,
          scoreA1: s1,
          scoreA2: s2,
        });
      }
    }
  }

  if (matchedCount === 0) {
    warnings.push('Tidak ada baris indikator yang cocok dengan nomor indikator standar (1-64). Pastikan kolom Nomor Indikator atau Kode tersedia.');
  }

  return {
    success: true,
    fileName: file.name,
    sheetName: preferredSheetName,
    totalRows: rawRows.length - (headerRowIdx + 1),
    matchedIndicators: matchedCount,
    scoresLoadedCount: scoresCount,
    records,
    updatedBobotMap: Object.keys(updatedBobotMap).length > 0 ? updatedBobotMap : undefined,
    totalBobotLoaded: Math.round(totalBobot * 100) / 100,
    warnings,
    samplePreview,
  };
}

/**
 * Downloads a standardized Excel template for Matrik Penilaian (.xlsx)
 * Users can fill scores offline and upload directly into the application.
 */
export function downloadMatrikPenilaianTemplate(profile: LamProfile, prefillScoresWithZero: boolean = true) {
  const headers = [
    'No Indikator',
    'Kriteria',
    'Sasaran Mutu',
    'Nama Indikator',
    'Elemen Penilaian (LED/LKPS)',
    'Kategori',
    'Bobot (%)',
    'Skor Asesor 1 (0-4)',
    'Skor Asesor 2 (0-4)',
    'Skor Konsensus (0-4)',
    'Skor LED / LKPS (0-4)',
    'Catatan Temuan Asesor',
  ];

  const rows: any[][] = [headers];

  for (const ind of profile.indicators) {
    rows.push([
      ind.indicatorNumber ?? ind.code,
      ind.kriteriaTitle || `Kriteria ${ind.kriteriaNumber}`,
      ind.sasaranMutu || ind.dimensi || 'Standar Mutu',
      ind.name,
      ind.element,
      ind.category,
      ind.bobot,
      prefillScoresWithZero ? 0 : '',
      prefillScoresWithZero ? 0 : '',
      prefillScoresWithZero ? 0 : '',
      prefillScoresWithZero ? 0 : '',
      '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths for clean readability
  ws['!cols'] = [
    { wch: 12 }, // No Indikator
    { wch: 25 }, // Kriteria
    { wch: 15 }, // Sasaran Mutu
    { wch: 35 }, // Nama Indikator
    { wch: 60 }, // Elemen Penilaian
    { wch: 14 }, // Kategori
    { wch: 12 }, // Bobot
    { wch: 18 }, // Skor Asesor 1
    { wch: 18 }, // Skor Asesor 2
    { wch: 18 }, // Skor Konsensus
    { wch: 18 }, // Skor LED / LKPS
    { wch: 40 }, // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matrik Penilaian');

  const fileName = `Template_Matrik_Penilaian_${profile.lamCode.replace(/\s+/g, '_')}_${profile.totalIndicators}_Indikator.xlsx`;
  XLSX.writeFile(wb, fileName);
}
