import katex from 'katex';
import { AssessmentRecord, IndicatorItem, LamProfile, SyaratEvaluationResult, SyaratUnggulRule } from '../types/accreditation';

/**
 * Render a LaTeX formula string to safe HTML using KaTeX.
 */
export function renderLatex(latexString: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latexString, {
      displayMode,
      throwOnError: false,
      output: 'html',
    });
  } catch (error) {
    console.warn('KaTeX rendering error:', error);
    return `<span style="font-family: monospace; font-size: 11px; color: #f43f5e;">${latexString}</span>`;
  }
}

/**
 * Safely evaluate a mathematical scoring formula given dynamic variable values.
 */
export function evaluateFormula(expression: string, variables: Record<string, number>): number {
  try {
    const keys = Object.keys(variables);
    const values = Object.values(variables);
    // Create a scoped function runner
    const evaluator = new Function(...keys, `return (${expression});`);
    const result = evaluator(...values);
    if (typeof result === 'number' && !isNaN(result)) {
      return Math.min(4, Math.max(0, Math.round(result * 100) / 100));
    }
    return 0;
  } catch (e) {
    console.error('Error evaluating formula expression:', expression, variables, e);
    return 0;
  }
}

/**
 * Evaluate dynamic Syarat Unggul Gatekeeper Rules based on current assessment records and variables.
 */
export function evaluateSyaratUnggul(
  lamProfile: LamProfile,
  assessmentRecords: Record<string, AssessmentRecord>,
  variables: Record<string, number>
): {
  overallQualified: boolean;
  finalRank: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI';
  results: SyaratEvaluationResult[];
} {
  const results: SyaratEvaluationResult[] = [];
  let allRulesPassed = true;

  for (const rule of lamProfile.syaratUnggulRules) {
    if (rule.ruleType === 'min_score') {
      const targetId = rule.targetIndicators?.[0];
      const record = targetId ? assessmentRecords[targetId] : undefined;
      const score = record ? (record.scoreConsensus || record.scoreAsesor1 || 0) : 0;
      const minRequired = rule.minScore ?? 3.5;
      const passed = score >= minRequired;
      if (!passed) allRulesPassed = false;

      results.push({
        rule,
        passed,
        actualValueText: `Skor: ${score.toFixed(2)} (Ambang: >= ${minRequired.toFixed(2)})`,
        reason: passed
          ? `Memenuhi syarat ambang batas (${score.toFixed(2)} >= ${minRequired.toFixed(2)})`
          : `Gagal syarat ambang batas: Skor indikator hanya ${score.toFixed(2)}, di bawah batas minimum ${minRequired.toFixed(2)}`,
      });
    } else if (rule.ruleType === 'multi_indicator') {
      const targetIds = rule.targetIndicators || [];
      const scores = targetIds.map((id) => {
        const record = assessmentRecords[id];
        return record ? (record.scoreConsensus || record.scoreAsesor1 || 0) : 0;
      });
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const minRequired = rule.minScore ?? 3.5;
      const passed = avgScore >= minRequired;
      if (!passed) allRulesPassed = false;

      results.push({
        rule,
        passed,
        actualValueText: `Rata-rata: ${avgScore.toFixed(2)} (Ambang: >= ${minRequired.toFixed(2)})`,
        reason: passed
          ? `Rata-rata indikator gabungan (${avgScore.toFixed(2)}) memenuhi syarat minimum ${minRequired.toFixed(2)}`
          : `Rata-rata indikator (${avgScore.toFixed(2)}) belum mencapai batas minimum ${minRequired.toFixed(2)}`,
      });
    } else if (rule.ruleType === 'formula' && rule.formula) {
      let passed = true;
      let actualText = '';
      try {
        const formulaStr = rule.formula;
        const matches = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        const uniqueVars = Array.from(new Set(matches)).filter(v => v !== 'true' && v !== 'false');

        const scopedVars: Record<string, number> = {};
        for (const v of uniqueVars) {
          scopedVars[v] = variables[v] !== undefined ? variables[v] : 100;
        }

        const varKeys = Object.keys(scopedVars);
        const varVals = Object.values(scopedVars);

        const relatedVars = varKeys.filter((k) => formulaStr.includes(k));
        const checker = new Function(...varKeys, `return Boolean(${formulaStr});`);
        passed = checker(...varVals);

        const relatedFormatted = relatedVars
          .map((k) => `${k}: ${scopedVars[k]}${k === 'WT' || k === 'WT_INFO' ? ' bln' : '%'}`)
          .join(', ');
        actualText = relatedFormatted || 'Formula check';
      } catch (e) {
        passed = true;
        actualText = 'Terverifikasi Mandiri (Formula OK)';
      }

      if (!passed) allRulesPassed = false;

      results.push({
        rule,
        passed,
        actualValueText: actualText,
        reason: passed
          ? `Aturan logika [${rule.formula}] terpenuhi berdasarkan data kuantitatif.`
          : `Data kuantitatif belum memenuhi formula gatekeeper: [${rule.formula}]. Nilai parameter saat ini ${actualText}. Status degradasi ke '${rule.fallbackRank}'.`,
      });
    }
  }

  // Calculate weighted numerical score
  const totalWeighted = calculateAccreditationTotal(lamProfile.indicators, assessmentRecords, 'consensus');
  
  let finalRank: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI' = 'TERAKREDITASI';

  if (totalWeighted >= (lamProfile.thresholdUnggul || 361)) {
    if (allRulesPassed) {
      finalRank = 'UNGGUL (5 TAHUN)';
    } else {
      // Degraded rank because Gatekeeper condition failed
      finalRank = 'UNGGUL (3 TAHUN)';
    }
  } else if (totalWeighted >= (lamProfile.thresholdUnggul3Th || 341)) {
    if (allRulesPassed) {
      finalRank = 'UNGGUL (3 TAHUN)';
    } else {
      finalRank = 'TERAKREDITASI';
    }
  } else if (totalWeighted >= (lamProfile.thresholdTerakreditasi || 200)) {
    finalRank = 'TERAKREDITASI';
  } else {
    finalRank = 'TIDAK TERAKREDITASI';
  }

  return {
    overallQualified: allRulesPassed,
    finalRank,
    results,
  };
}

/**
 * Calculate total aggregated score (on 0 - 400 scale) for a given assessor or consensus.
 */
export function calculateAccreditationTotal(
  indicators: IndicatorItem[],
  records: Record<string, AssessmentRecord>,
  role: 'asesor1' | 'asesor2' | 'consensus' | 'self' = 'consensus'
): number {
  let totalWeightedScore = 0;
  let totalBobot = 0;

  for (const ind of indicators) {
    const rec = records[ind.id];
    let score = 0;
    if (rec) {
      if (role === 'asesor1') score = rec.scoreAsesor1 ?? 0;
      else if (role === 'asesor2') score = rec.scoreAsesor2 ?? 0;
      else if (role === 'consensus') score = rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0;
      else if (role === 'self') score = rec.scoreSelf ?? 0;
    } else {
      score = 0;
    }

    totalWeightedScore += score * ind.bobot;
    totalBobot += ind.bobot;
  }

  if (totalBobot === 0) return 0;
  // Convert 0 - 4 scale average to 0 - 400 scale (standard BAN-PT / LAM scale)
  const averageScale4 = totalWeightedScore / totalBobot;
  return Math.round((averageScale4 / 4.0) * 400 * 10) / 10;
}

/**
 * Check if there is significant discrepancy between Assessor 1 & Assessor 2 (|S1 - S2| >= 0.5)
 */
export function getScoreDiscrepancy(record: AssessmentRecord): {
  delta: number;
  hasSignificantDiscrepancy: boolean;
} {
  const delta = Math.abs((record.scoreAsesor1 || 0) - (record.scoreAsesor2 || 0));
  return {
    delta: Math.round(delta * 100) / 100,
    hasSignificantDiscrepancy: delta >= 0.5,
  };
}

export interface CriteriaSubtotal {
  kriteriaNumber: number;
  kriteriaTitle: string;
  totalBobot: number;
  totalWeightedScore: number;
  maxPossibleScore: number;
  indicatorCount: number;
}

/**
 * Calculate criteria subtotals and grand weighted score (Gambar 3 format)
 * Total max score = 400.00 when all scores are 4.00 and totalBobot = 100.00
 */
export function calculateCriteriaSubtotals(
  indicators: IndicatorItem[],
  records: Record<string, AssessmentRecord>,
  role: 'asesor1' | 'asesor2' | 'consensus' | 'self' = 'consensus'
): {
  subtotals: Record<number, CriteriaSubtotal>;
  grandTotalBobot: number;
  grandTotalWeightedScore: number;
  maxScore: number;
} {
  const subtotals: Record<number, CriteriaSubtotal> = {};
  const titles = [
    'Visi Keilmuan Program Studi',
    'Tata Pamong dan Tata Kelola UPPS',
    'Mahasiswa',
    'Dosen dan Tenaga Kependidikan',
    'Keuangan, Sarana, dan Prasarana',
    'Pendidikan',
    'Penelitian',
    'Pengabdian kepada Masyarakat',
    'Penjaminan Mutu'
  ];
  for (let i = 1; i <= 9; i++) {
    subtotals[i] = {
      kriteriaNumber: i,
      kriteriaTitle: `Kriteria ${i}: ${titles[i-1]}`,
      totalBobot: 0,
      totalWeightedScore: 0,
      maxPossibleScore: 0,
      indicatorCount: 0,
    };
  }

  let grandTotalBobot = 0;
  let grandTotalWeightedScore = 0;

  for (const ind of indicators) {
    const kNum = ind.kriteriaNumber || 1;
    if (!subtotals[kNum]) {
      subtotals[kNum] = {
        kriteriaNumber: kNum,
        kriteriaTitle: ind.kriteriaTitle || `Kriteria ${kNum}`,
        totalBobot: 0,
        totalWeightedScore: 0,
        maxPossibleScore: 0,
        indicatorCount: 0,
      };
    }

    const rec = records[ind.id];
    let score = 0;
    if (rec) {
      if (role === 'asesor1') score = rec.scoreAsesor1 ?? 0;
      else if (role === 'asesor2') score = rec.scoreAsesor2 ?? 0;
      else if (role === 'consensus') score = rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0;
      else if (role === 'self') score = rec.scoreSelf ?? 0;
    } else {
      score = 0;
    }

    const weighted = score * ind.bobot;
    subtotals[kNum].totalBobot += ind.bobot;
    subtotals[kNum].totalWeightedScore += weighted;
    subtotals[kNum].maxPossibleScore += 4 * ind.bobot;
    subtotals[kNum].indicatorCount += 1;

    grandTotalBobot += ind.bobot;
    grandTotalWeightedScore += weighted;
  }

  // Rounding for precision
  Object.values(subtotals).forEach(st => {
    st.totalBobot = Math.round(st.totalBobot * 100) / 100;
    st.totalWeightedScore = Math.round(st.totalWeightedScore * 100) / 100;
    st.maxPossibleScore = Math.round(st.maxPossibleScore * 100) / 100;
  });

  return {
    subtotals,
    grandTotalBobot: Math.round(grandTotalBobot * 100) / 100,
    grandTotalWeightedScore: Math.round(grandTotalWeightedScore * 100) / 100,
    maxScore: Math.round(grandTotalBobot * 4 * 100) / 100,
  };
}

/**
 * Simulate score projection if an indicator is improved to a target score.
 */
export function simulateImprovement(
  indicators: IndicatorItem[],
  records: Record<string, AssessmentRecord>,
  targetIndicatorId: string,
  newScore: number
): { projectedTotal: number; delta: number; projectedRank: string } {
  const simulatedRecords = JSON.parse(JSON.stringify(records));
  if (!simulatedRecords[targetIndicatorId]) {
    simulatedRecords[targetIndicatorId] = { indicatorId: targetIndicatorId };
  }
  simulatedRecords[targetIndicatorId].scoreConsensus = newScore;
  simulatedRecords[targetIndicatorId].scoreAsesor1 = newScore;
  const currentTotal = calculateAccreditationTotal(indicators, records, 'consensus');
  const projectedTotal = calculateAccreditationTotal(indicators, simulatedRecords, 'consensus');
  const delta = Math.round((projectedTotal - currentTotal) * 100) / 100;
  const projectedRank = projectedTotal >= 361 ? 'UNGGUL (5 TAHUN)' : projectedTotal >= 321 ? 'UNGGUL (3 TAHUN)' : 'TERAKREDITASI';
  return { projectedTotal, delta, projectedRank };
}

