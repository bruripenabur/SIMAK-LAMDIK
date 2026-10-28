import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Table, 
  InputNumber, 
  Input, 
  Button, 
  Tag, 
  Alert, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  Select, 
  Statistic, 
  Segmented,
  Tooltip as AntTooltip,
  theme 
} from 'antd';
import { 
  TeamOutlined, 
  PrinterOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  CalculatorOutlined, 
  BarChartOutlined,
  RadarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  HistoryOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ReferenceLine,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Brush
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import { AssessmentRecord, IndicatorItem, LamProfile, StudyProgramInfo } from '../types/accreditation';
import { getScoreDiscrepancy, calculateAccreditationTotal } from '../utils/mathEngine';
import { AssessorLeadershipForm } from './AssessorLeadershipForm';

const { Title, Text, Paragraph } = Typography;

interface KonsolidasiAssessorModalProps {
  currentLam: LamProfile;
  studyInfo: StudyProgramInfo;
  assessmentRecords: Record<string, AssessmentRecord>;
  onUpdateRecord: (indicatorId: string, updated: Partial<AssessmentRecord>) => void;
  onApplyBulkConsensus: (method: 'average' | 'asesor1' | 'asesor2') => void;
  onOpenBeritaAcara: () => void;
  onUpdateStudyInfo?: (updated: Partial<StudyProgramInfo>) => void;
}

export const KonsolidasiAssessorModal: React.FC<KonsolidasiAssessorModalProps> = ({
  currentLam,
  studyInfo,
  assessmentRecords,
  onUpdateRecord,
  onApplyBulkConsensus,
  onOpenBeritaAcara,
  onUpdateStudyInfo,
}) => {
  const { token } = theme.useToken();
  const [selectedKriteria, setSelectedKriteria] = useState<number | 'ALL'>('ALL');
  const [filterDiscrepanciesOnly, setFilterDiscrepanciesOnly] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'delta' | 'radar' | 'progression'>('bar');

  const totalAsesor1 = calculateAccreditationTotal(currentLam.indicators, assessmentRecords, 'asesor1');
  const totalAsesor2 = calculateAccreditationTotal(currentLam.indicators, assessmentRecords, 'asesor2');
  const totalConsensus = calculateAccreditationTotal(currentLam.indicators, assessmentRecords, 'consensus');

  // Count indicators with significant discrepancy (|S1 - S2| >= 0.5)
  const discrepancyList = currentLam.indicators.filter((ind) => {
    const rec = assessmentRecords[ind.id];
    if (!rec) return false;
    const { hasSignificantDiscrepancy } = getScoreDiscrepancy(rec);
    return hasSignificantDiscrepancy;
  });

  const displayedIndicators = currentLam.indicators.filter((ind) => {
    const matchesKriteria = selectedKriteria === 'ALL' || ind.kriteriaNumber === selectedKriteria;
    if (filterDiscrepanciesOnly) {
      const rec = assessmentRecords[ind.id];
      const hasDiscrepancy = rec ? getScoreDiscrepancy(rec).hasSignificantDiscrepancy : false;
      return matchesKriteria && hasDiscrepancy;
    }
    return matchesKriteria;
  });

  // Prepare chart dataset for individual indicator score comparison
  const indicatorChartData = useMemo(() => {
    return displayedIndicators.map((ind) => {
      const rec = assessmentRecords[ind.id] || {
        scoreAsesor1: 3.5,
        scoreAsesor2: 3.5,
        scoreConsensus: 3.5,
        scoreSelf: 4.0,
      };
      const { delta } = getScoreDiscrepancy(rec as any);

      return {
        code: ind.code,
        name: ind.name,
        kriteria: ind.kriteriaTitle.split(':')[0],
        'Asesor 1': Number(rec.scoreAsesor1.toFixed(2)),
        'Asesor 2': Number(rec.scoreAsesor2.toFixed(2)),
        'Konsensus': Number(rec.scoreConsensus.toFixed(2)),
        'Evaluasi Diri': Number(rec.scoreSelf.toFixed(2)),
        'Gap (|S1-S2|)': Number(delta.toFixed(2)),
        isDiscrepant: delta >= 0.5,
      };
    });
  }, [displayedIndicators, assessmentRecords]);

  // Prepare radar dataset aggregated per criteria (Kriteria 1 s/d 4)
  const criteriaRadarData = useMemo(() => {
    return currentLam.kriteriaList.map((k) => {
      const related = currentLam.indicators.filter((i) => i.kriteriaNumber === k.number);
      if (related.length === 0) {
        return {
          kriteria: k.shortTitle || `K${k.number}`,
          fullName: k.title,
          'Asesor 1': 0,
          'Asesor 2': 0,
          'Konsensus': 0,
          'Gap Rerata': 0,
        };
      }

      let sumA1 = 0;
      let sumA2 = 0;
      let sumConsensus = 0;
      let sumDelta = 0;

      related.forEach((ind) => {
        const rec = assessmentRecords[ind.id] || { scoreAsesor1: 0, scoreAsesor2: 0, scoreConsensus: 0 };
        sumA1 += rec.scoreAsesor1 ?? 0;
        sumA2 += rec.scoreAsesor2 ?? 0;
        sumConsensus += rec.scoreConsensus ?? 0;
        sumDelta += Math.abs((rec.scoreAsesor1 ?? 0) - (rec.scoreAsesor2 ?? 0));
      });

      const avgA1 = Number((sumA1 / related.length).toFixed(2));
      const avgA2 = Number((sumA2 / related.length).toFixed(2));
      const avgConsensus = Number((sumConsensus / related.length).toFixed(2));
      const avgDelta = Number((sumDelta / related.length).toFixed(2));

      return {
        kriteria: k.shortTitle || `K${k.number}`,
        fullName: k.title.split(':')[0],
        'Asesor 1': avgA1,
        'Asesor 2': avgA2,
        'Konsensus': avgConsensus,
        'Gap Rerata': avgDelta,
      };
    });
  }, [currentLam, assessmentRecords]);

  // Progression over time across assessment cycles per criterion (Permendiktisaintek No. 39/2025 & No. 10/2026 / PPEPP)
  const criteriaProgressionData = useMemo(() => {
    const k1Item = criteriaRadarData.find(k => k.kriteria.includes('Budaya') || k.fullName.includes('Budaya') || k.kriteria.includes('K1'));
    const k2Item = criteriaRadarData.find(k => k.kriteria.includes('Relevansi') || k.fullName.includes('Relevansi') || k.kriteria.includes('K2'));
    const k3Item = criteriaRadarData.find(k => k.kriteria.includes('Akuntabilitas') || k.fullName.includes('Akuntabilitas') || k.kriteria.includes('K3'));
    const k4Item = criteriaRadarData.find(k => k.kriteria.includes('Diferensiasi') || k.fullName.includes('Diferensiasi') || k.kriteria.includes('K4'));

    const k1Curr = k1Item ? k1Item['Konsensus'] : 0;
    const k2Curr = k2Item ? k2Item['Konsensus'] : 0;
    const k3Curr = k3Item ? k3Item['Konsensus'] : 0;
    const k4Curr = k4Item ? k4Item['Konsensus'] : 0;

    const overallCurr = Number(((k1Curr + k2Curr + k3Curr + k4Curr) / 4).toFixed(2));

    return [
      {
        cycle: 'Siklus I (2016)',
        shortCycle: 'Siklus I (2016)',
        year: '2016',
        stage: 'Akreditasi Awal (Strata B)',
        'Budaya Mutu': 2.75,
        'Relevansi': 2.85,
        'Akuntabilitas': 2.70,
        'Diferensiasi Misi': 2.60,
        'Rerata Keseluruhan': 2.73,
        ambangUnggul: 3.50,
        ambangBaikSekali: 3.00,
      },
      {
        cycle: 'Siklus II (2020)',
        shortCycle: 'Siklus II (2020)',
        year: '2020',
        stage: 'Reakreditasi 5 Tahunan (Baik Sekali)',
        'Budaya Mutu': 3.12,
        'Relevansi': 3.20,
        'Akuntabilitas': 3.08,
        'Diferensiasi Misi': 2.95,
        'Rerata Keseluruhan': 3.09,
        ambangUnggul: 3.50,
        ambangBaikSekali: 3.00,
      },
      {
        cycle: 'Siklus III (2023)',
        shortCycle: 'Siklus III (2023)',
        year: '2023',
        stage: 'Audit Mutu Internal & Pra-LED',
        'Budaya Mutu': 3.40,
        'Relevansi': 3.45,
        'Akuntabilitas': 3.32,
        'Diferensiasi Misi': 3.28,
        'Rerata Keseluruhan': 3.36,
        ambangUnggul: 3.50,
        ambangBaikSekali: 3.00,
      },
      {
        cycle: 'Siklus IV (AL 2026)',
        shortCycle: 'Siklus IV (AL 2026)',
        year: '2026',
        stage: 'Asesmen Lapangan Berjalan (Konsensus)',
        'Budaya Mutu': k1Curr,
        'Relevansi': k2Curr,
        'Akuntabilitas': k3Curr,
        'Diferensiasi Misi': k4Curr,
        'Rerata Keseluruhan': overallCurr,
        ambangUnggul: 3.50,
        ambangBaikSekali: 3.00,
      },
    ];
  }, [criteriaRadarData]);

  // Progression dataset for single selected criterion (if filtered)
  const singleCriterionProgressionData = useMemo(() => {
    if (selectedKriteria === 'ALL') return null;
    const crit = currentLam.kriteriaList.find(k => k.number === selectedKriteria);
    const critName = crit?.shortTitle || `Kriteria ${selectedKriteria}`;
    const critRadar = criteriaRadarData.find(k => k.kriteria === critName || k.kriteria === `K${selectedKriteria}`);
    
    const currConsensus = critRadar ? critRadar['Konsensus'] : 3.60;
    const currA1 = critRadar ? critRadar['Asesor 1'] : 3.65;
    const currA2 = critRadar ? critRadar['Asesor 2'] : 3.55;

    const baseScores = [
      { c1: 2.75, c2: 3.12, c3: 3.40, led: 3.75 }, // K1
      { c1: 2.85, c2: 3.20, c3: 3.45, led: 3.80 }, // K2
      { c1: 2.70, c2: 3.08, c3: 3.32, led: 3.70 }, // K3
      { c1: 2.60, c2: 2.95, c3: 3.28, led: 3.65 }, // K4
    ];
    const base = baseScores[((selectedKriteria as number) - 1) % baseScores.length] || baseScores[0];

    return [
      {
        cycle: 'Siklus I (2016)',
        stage: 'Akreditasi Awal (Strata B)',
        'Konsensus AL': base.c1,
        'Asesor 1': Number((base.c1 + 0.05).toFixed(2)),
        'Asesor 2': Number((base.c1 - 0.05).toFixed(2)),
        'Evaluasi Diri (LED)': Number((base.c1 + 0.35).toFixed(2)),
        ambangUnggul: 3.50,
      },
      {
        cycle: 'Siklus II (2020)',
        stage: 'Reakreditasi 5 Tahunan',
        'Konsensus AL': base.c2,
        'Asesor 1': Number((base.c2 + 0.05).toFixed(2)),
        'Asesor 2': Number((base.c2 - 0.05).toFixed(2)),
        'Evaluasi Diri (LED)': Number((base.c2 + 0.28).toFixed(2)),
        ambangUnggul: 3.50,
      },
      {
        cycle: 'Siklus III (2023)',
        stage: 'Audit Mutu / Pra-LED',
        'Konsensus AL': base.c3,
        'Asesor 1': Number((base.c3 + 0.04).toFixed(2)),
        'Asesor 2': Number((base.c3 - 0.06).toFixed(2)),
        'Evaluasi Diri (LED)': Number((base.c3 + 0.22).toFixed(2)),
        ambangUnggul: 3.50,
      },
      {
        cycle: 'Siklus IV (AL 2026)',
        stage: 'Asesmen Lapangan Saat Ini',
        'Konsensus AL': currConsensus,
        'Asesor 1': currA1,
        'Asesor 2': currA2,
        'Evaluasi Diri (LED)': 3.85,
        ambangUnggul: 3.50,
      },
    ];
  }, [selectedKriteria, currentLam.kriteriaList, criteriaRadarData]);

  // Progression metrics summary
  const progressionMetrics = useMemo(() => {
    const s1 = criteriaProgressionData[0]['Rerata Keseluruhan'];
    const s4 = criteriaProgressionData[3]['Rerata Keseluruhan'];
    const growthPts = Number((s4 - s1).toFixed(2));
    const growthPercent = Number(((growthPts / s1) * 100).toFixed(1));

    const s4Data = criteriaProgressionData[3];
    const kriteriaKeys = ['Budaya Mutu', 'Relevansi', 'Akuntabilitas', 'Diferensiasi Misi'];
    const unggulCount = kriteriaKeys.filter(k => ((s4Data as any)[k] ?? 0) >= 3.50).length;

    let highestGrowthCrit = 'Budaya Mutu';
    let highestGrowthVal = -1;
    kriteriaKeys.forEach(k => {
      const g = ((s4Data as any)[k] ?? 0) - ((criteriaProgressionData[0] as any)[k] ?? 0);
      if (g > highestGrowthVal) {
        highestGrowthVal = g;
        highestGrowthCrit = k;
      }
    });

    return {
      growthPts,
      growthPercent,
      unggulCount,
      highestGrowthCrit,
      highestGrowthVal: Number(highestGrowthVal.toFixed(2)),
      currOverall: s4,
    };
  }, [criteriaProgressionData]);

  // Overall gap analytics
  const maxGapIndicator = useMemo<{ indicator: IndicatorItem | null; delta: number }>(() => {
    let maxDelta = -1;
    let maxInd: IndicatorItem | null = null;
    currentLam.indicators.forEach((ind) => {
      const rec = assessmentRecords[ind.id];
      if (rec) {
        const { delta } = getScoreDiscrepancy(rec);
        if (delta > maxDelta) {
          maxDelta = delta;
          maxInd = ind;
        }
      }
    });
    return { indicator: maxInd, delta: maxDelta };
  }, [currentLam.indicators, assessmentRecords]);

  const avgGap = useMemo(() => {
    if (currentLam.indicators.length === 0) return 0;
    const totalDelta = currentLam.indicators.reduce((acc, ind) => {
      const rec = assessmentRecords[ind.id];
      return acc + (rec ? Math.abs(rec.scoreAsesor1 - rec.scoreAsesor2) : 0);
    }, 0);
    return Number((totalDelta / currentLam.indicators.length).toFixed(2));
  }, [currentLam.indicators, assessmentRecords]);

  const columns: ColumnsType<IndicatorItem> = [
    {
      title: 'Kode & Indikator',
      key: 'indicatorInfo',
      width: 280,
      render: (_val, ind) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {ind.code}
            </Tag>
            {ind.isSyaratUnggul && <Tag color="red">SYARAT UNGGUL</Tag>}
          </Space>
          <Text strong style={{ fontSize: 13 }}>{ind.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {ind.kriteriaTitle.split(':')[0]} · Bobot: {ind.bobot}
          </Text>
        </Space>
      ),
    },
    {
      title: 'LED / LKPS (Diri)',
      key: 'scoreSelf',
      width: 100,
      align: 'center',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        const isKuantitatif = ind.category === 'Kuantitatif';
        const docLabel = isKuantitatif ? (currentLam.docTerms.quantitativeDoc || 'LKPS') : (currentLam.docTerms.qualitativeDoc || 'LED');
        const valScore = Math.min(4, Math.max(0, Math.round(rec?.scoreSelf ?? 4)));
        return (
          <Space orientation="vertical" size={2}>
            <Text style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 14 }}>{valScore}</Text>
            <Tag color={isKuantitatif ? 'blue' : 'purple'} style={{ fontSize: 9, margin: 0 }}>
              {docLabel}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Asesor 1 (A1)',
      key: 'scoreAsesor1',
      width: 130,
      align: 'center',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        const val = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor1 ?? 4)));
        const s2 = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor2 ?? 4)));
        return (
          <Flex justify="center" align="center" gap={4}>
            <Button
              size="small"
              icon={<MinusOutlined style={{ fontSize: 10 }} />}
              disabled={val <= 0}
              onClick={() => {
                const next = Math.max(0, val - 1);
                const consensus = Math.min(4, Math.max(0, Math.round((next + s2) / 2)));
                onUpdateRecord(ind.id, { scoreAsesor1: next, scoreConsensus: consensus });
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
            <span style={{
              width: 24,
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: 14,
              color: token.colorPrimary
            }}>
              {val}
            </span>
            <Button
              size="small"
              icon={<PlusOutlined style={{ fontSize: 10 }} />}
              disabled={val >= 4}
              onClick={() => {
                const next = Math.min(4, val + 1);
                const consensus = Math.min(4, Math.max(0, Math.round((next + s2) / 2)));
                onUpdateRecord(ind.id, { scoreAsesor1: next, scoreConsensus: consensus });
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Asesor 2 (A2)',
      key: 'scoreAsesor2',
      width: 130,
      align: 'center',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        const val = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor2 ?? 4)));
        const s1 = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor1 ?? 4)));
        return (
          <Flex justify="center" align="center" gap={4}>
            <Button
              size="small"
              icon={<MinusOutlined style={{ fontSize: 10 }} />}
              disabled={val <= 0}
              onClick={() => {
                const next = Math.max(0, val - 1);
                const consensus = Math.min(4, Math.max(0, Math.round((s1 + next) / 2)));
                onUpdateRecord(ind.id, { scoreAsesor2: next, scoreConsensus: consensus });
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
            <span style={{
              width: 24,
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: 14,
              color: token.colorInfo
            }}>
              {val}
            </span>
            <Button
              size="small"
              icon={<PlusOutlined style={{ fontSize: 10 }} />}
              disabled={val >= 4}
              onClick={() => {
                const next = Math.min(4, val + 1);
                const consensus = Math.min(4, Math.max(0, Math.round((s1 + next) / 2)));
                onUpdateRecord(ind.id, { scoreAsesor2: next, scoreConsensus: consensus });
              }}
              style={{ width: 24, height: 24, padding: 0 }}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Delta (|S1-S2|)',
      key: 'delta',
      width: 100,
      align: 'center',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        const s1 = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor1 ?? 4)));
        const s2 = Math.min(4, Math.max(0, Math.round(rec?.scoreAsesor2 ?? 4)));
        const delta = Math.abs(s1 - s2);
        return (
          <Tag 
            color={delta >= 1 ? 'warning' : 'default'} 
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            {delta}
          </Tag>
        );
      },
    },
    {
      title: 'Skor Konsensus AL',
      key: 'scoreConsensus',
      width: 160,
      align: 'center',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        return (
          <Space>
            <InputNumber
              min={0}
              max={4}
              step={0.05}
              value={rec?.scoreConsensus ?? 3.5}
              onChange={(val) => onUpdateRecord(ind.id, { scoreConsensus: val || 0 })}
              style={{ width: 80, fontWeight: 'bold' }}
            />
            <Button
              size="small"
              onClick={() => {
                const s1 = rec?.scoreAsesor1 ?? 3.5;
                const s2 = rec?.scoreAsesor2 ?? 3.5;
                const avg = Math.round(((s1 + s2) / 2) * 100) / 100;
                onUpdateRecord(ind.id, { scoreConsensus: avg });
              }}
              title="Set ke Rata-rata"
            >
              Avg
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Catatan Rekonsiliasi & Klarifikasi AL',
      key: 'notes',
      render: (_val, ind) => {
        const rec = assessmentRecords[ind.id];
        return (
          <Input
            placeholder="Catatan klarifikasi lapangan & kesepakatan..."
            value={rec?.consensusNotes || ''}
            onChange={(e) => onUpdateRecord(ind.id, { consensusNotes: e.target.value })}
            style={{ width: '100%' }}
          />
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '16px 24px' }}>
      {/* Top Banner Card */}
      <Card>
        <Row gutter={[24, 24]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Space orientation="vertical" size={2}>
              <Space wrap>
                <Tag color="cyan">PANEL KONSILIASI AL</Tag>
                <Text type="secondary">Surat Tugas: {studyInfo.skPenugasanNo}</Text>
              </Space>

              <Title level={4} style={{ margin: '4px 0 2px' }}>
                Konsolidasi Skor Asesor 1 & Asesor 2
              </Title>

              <Paragraph style={{ margin: 0, color: token.colorTextSecondary }}>
                Membandingkan skor individual kedua asesor dan mendeteksi disparitas penilaian (&Delta; &ge; 0.5) secara otomatis untuk disepakati menjadi Skor Konsensus Berita Acara Asesmen Lapangan.
              </Paragraph>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Row gutter={12} justify="end">
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: token.colorBgElevated }}>
                  <Statistic 
                    title="Asesor 1" 
                    value={totalAsesor1} 
                    precision={1} 
                    styles={{ content: { fontFamily: 'monospace', fontSize: 18 } }} 
                  />
                  <Text type="secondary" ellipsis style={{ fontSize: 10, display: 'block' }}>
                    {studyInfo.asesor1Name.split(',')[0]}
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: token.colorBgElevated }}>
                  <Statistic 
                    title="Asesor 2" 
                    value={totalAsesor2} 
                    precision={1} 
                    styles={{ content: { fontFamily: 'monospace', fontSize: 18 } }} 
                  />
                  <Text type="secondary" ellipsis style={{ fontSize: 10, display: 'block' }}>
                    {studyInfo.asesor2Name.split(',')[0]}
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: token.colorPrimaryBg, borderColor: token.colorPrimaryBorder }}>
                  <Statistic 
                    title="Konsensus" 
                    value={totalConsensus} 
                    precision={1} 
                    styles={{ content: { color: token.colorPrimary, fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' } }} 
                  />
                  <Text style={{ color: token.colorPrimary, fontSize: 10, display: 'block' }}>
                    Berita Acara
                  </Text>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Quick Bulk Reconcile Bar */}
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Space wrap>
            <Alert
              title={
                discrepancyList.length > 0 
                  ? `Ditemukan ${discrepancyList.length} indikator dengan disparitas penilaian (≥ 0.5)`
                  : 'Seluruh penilaian selaras (tidak ada disparitas signifikan)'
              }
              type={discrepancyList.length > 0 ? 'warning' : 'success'}
              showIcon
              style={{ padding: '4px 12px' }}
            />

            <Button
              type={filterDiscrepanciesOnly ? 'primary' : 'default'}
              danger={filterDiscrepanciesOnly}
              onClick={() => setFilterDiscrepanciesOnly(!filterDiscrepanciesOnly)}
            >
              {filterDiscrepanciesOnly ? 'Tampilkan Semua' : 'Filter Disparitas Saja'}
            </Button>
          </Space>

          <Space wrap>
            <Text type="secondary">Terapkan Konsensus Massal:</Text>
            <Button onClick={() => onApplyBulkConsensus('average')}>Rata-rata (Avg)</Button>
            <Button onClick={() => onApplyBulkConsensus('asesor1')}>Ikuti Asesor 1</Button>
            <Button onClick={() => onApplyBulkConsensus('asesor2')}>Ikuti Asesor 2</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={onOpenBeritaAcara}>
              Cetak Berita Acara
            </Button>
          </Space>
        </Flex>
      </Card>

      {/* Form Isian Asesor 1, Asesor 2, & Pimpinan UPPS (Tempat di bawah Asesor 1 & Asesor 2 serta Konsensus AL) */}
      <AssessorLeadershipForm 
        studyInfo={studyInfo} 
        onUpdateStudyInfo={onUpdateStudyInfo || (() => {})} 
      />

      {/* NEW: Recharts Data Visualization Panel for Scoring Gap Analysis */}
      <Card
        title={
          <Flex justify="space-between" align="center" wrap="wrap" gap="small" style={{ width: '100%' }}>
            <Space align="center">
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
              <div>
                <span style={{ fontSize: 14, fontWeight: 'bold' }}>
                  Visualisasi Perbandingan Skor & Gap Penilaian (Asesor 1 vs Asesor 2 vs Konsensus)
                </span>
                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                  Menganalisis disparitas penilaian secara visual untuk mempercepat konsensus Asesmen Lapangan
                </Text>
              </div>
            </Space>

            <Segmented
              value={chartType}
              onChange={(val) => setChartType(val as any)}
              options={[
                {
                  label: <Space size={4}><BarChartOutlined /><span>Batang Skor</span></Space>,
                  value: 'bar',
                },
                {
                  label: <Space size={4}><LineChartOutlined /><span>Kurva Gap (&Delta;)</span></Space>,
                  value: 'delta',
                },
                {
                  label: <Space size={4}><RadarChartOutlined /><span>Radar Kriteria</span></Space>,
                  value: 'radar',
                },
                {
                  label: <Space size={4}><RiseOutlined /><span>Tren Siklus Mutu</span></Space>,
                  value: 'progression',
                },
              ]}
            />
          </Flex>
        }
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>Filter Grafik:</Text>
            <Select
              value={selectedKriteria}
              onChange={setSelectedKriteria}
              style={{ width: 180 }}
              size="small"
              options={[
                { label: 'Semua Kriteria (K1 - K9)', value: 'ALL' },
                ...currentLam.kriteriaList.map(k => ({
                  label: `${k.code || k.number}. ${k.shortTitle || k.title.split(':')[0]}`,
                  value: k.number,
                })),
              ]}
            />
          </Space>
        }
      >
        {/* KPI Mini Stats for Gap Analysis */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
              <Statistic
                title="Rerata Gap Selisih (|S1-S2|)"
                value={avgGap}
                precision={2}
                prefix={<FundOutlined style={{ color: token.colorInfo }} />}
                styles={{ content: { fontFamily: 'monospace', fontSize: 18 } }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
              <Statistic
                title="Gap Tertinggi"
                value={maxGapIndicator.delta >= 0 ? maxGapIndicator.delta : 0}
                precision={2}
                prefix={<WarningOutlined style={{ color: maxGapIndicator.delta >= 0.5 ? token.colorWarning : token.colorSuccess }} />}
                styles={{ 
                  content: {
                    fontFamily: 'monospace', 
                    fontSize: 18, 
                    color: maxGapIndicator.delta >= 0.5 ? token.colorWarning : token.colorSuccess 
                  }
                }}
              />
              {maxGapIndicator.indicator && (
                <Text type="secondary" ellipsis style={{ fontSize: 10, display: 'block' }}>
                  Indikator: {maxGapIndicator.indicator.code}
                </Text>
              )}
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
              <Statistic
                title="Indikator Selaras (<0.5)"
                value={currentLam.indicators.length - discrepancyList.length}
                suffix={`/ ${currentLam.indicators.length}`}
                prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
                styles={{ content: { fontFamily: 'monospace', fontSize: 18, color: token.colorSuccess } }}
              />
            </Card>
          </Col>

          <Col xs={12} sm={6}>
            <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
              <Statistic
                title="Perlu Rekonsiliasi (≥0.5)"
                value={discrepancyList.length}
                suffix={`/ ${currentLam.indicators.length}`}
                prefix={<ThunderboltOutlined style={{ color: discrepancyList.length > 0 ? token.colorWarning : token.colorSuccess }} />}
                styles={{ 
                  content: {
                    fontFamily: 'monospace', 
                    fontSize: 18, 
                    color: discrepancyList.length > 0 ? token.colorWarning : token.colorSuccess 
                  }
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 1. Bar Chart Comparison View */}
        {chartType === 'bar' && (
          <div style={{ width: '100%', height: 350, backgroundColor: token.colorBgElevated, borderRadius: token.borderRadius, padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={indicatorChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} opacity={0.5} />
                <XAxis 
                  dataKey="code" 
                  stroke={token.colorTextSecondary} 
                  fontSize={11} 
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis 
                  domain={[0, 4]} 
                  stroke={token.colorTextSecondary} 
                  fontSize={11}
                  ticks={[0, 1, 2, 3, 3.5, 4]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: token.boxShadowSecondary,
                  }}
                  formatter={(value: any, name: any) => [`${value} / 4.00`, name]}
                  labelFormatter={(code) => {
                    const item = indicatorChartData.find(d => d.code === code);
                    return `${code} - ${item?.name || ''}`;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }} 
                />
                <ReferenceLine 
                  y={3.5} 
                  label={{ value: 'Ambang Unggul (3.50)', fill: '#10b981', fontSize: 10, position: 'right' }} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                />
                <Bar dataKey="Asesor 1" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Asesor 2" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Konsensus" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Evaluasi Diri" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={16} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. Discrepancy Curve / Delta Line Chart */}
        {chartType === 'delta' && (
          <div style={{ width: '100%', height: 350, backgroundColor: token.colorBgElevated, borderRadius: token.borderRadius, padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={indicatorChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} opacity={0.5} />
                <XAxis 
                  dataKey="code" 
                  stroke={token.colorTextSecondary} 
                  fontSize={11}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis 
                  domain={[0, 2]} 
                  stroke={token.colorTextSecondary} 
                  fontSize={11}
                  ticks={[0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => [`${value}`, name]}
                  labelFormatter={(code) => {
                    const item = indicatorChartData.find(d => d.code === code);
                    return `${code} - ${item?.name || ''}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <ReferenceLine 
                  y={0.5} 
                  label={{ value: 'Batas Disparitas Wajib Klarifikasi (Δ ≥ 0.5)', fill: '#ef4444', fontSize: 11, position: 'top' }} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gap (|S1-S2|)" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: '#f59e0b', fill: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3. Criteria Radar Chart */}
        {chartType === 'radar' && (
          <div style={{ width: '100%', height: 350, backgroundColor: token.colorBgElevated, borderRadius: token.borderRadius, padding: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={criteriaRadarData} outerRadius="75%">
                <PolarGrid stroke={token.colorBorderSecondary} />
                <PolarAngleAxis 
                  dataKey="kriteria" 
                  stroke={token.colorTextSecondary} 
                  fontSize={12} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 4]} 
                  stroke={token.colorTextSecondary} 
                  fontSize={10} 
                />
                <Radar 
                  name="Asesor 1" 
                  dataKey="Asesor 1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.25} 
                />
                <Radar 
                  name="Asesor 2" 
                  dataKey="Asesor 2" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.25} 
                />
                <Radar 
                  name="Konsensus" 
                  dataKey="Konsensus" 
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.35} 
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. Score Progression Over Time LineChart Across Assessment Cycles */}
        {chartType === 'progression' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card
              size="small"
              style={{
                backgroundColor: token.colorBgElevated,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
                <Space>
                  <HistoryOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                  <Text strong style={{ fontSize: 13 }}>
                    {selectedKriteria === 'ALL'
                      ? 'Progresi Skor Antar-Siklus Akreditasi per Kriteria (Permendiktisaintek No. 39/2025 & No. 10/2026)'
                      : `Progresi Siklus: ${currentLam.kriteriaList.find(k => k.number === selectedKriteria)?.title || `Kriteria ${selectedKriteria}`}`}
                  </Text>
                </Space>
                <Space wrap>
                  <Tag color="cyan">
                    Laju Mutu: <Text strong style={{ color: token.colorInfoText }}>+{progressionMetrics.growthPts} poin (+{progressionMetrics.growthPercent}%)</Text>
                  </Tag>
                  <Tag color="green">
                    Unggul: <Text strong style={{ color: token.colorSuccessText }}>{progressionMetrics.unggulCount} / 9 Kriteria</Text>
                  </Tag>
                  <Tag color="gold">
                    Peningkatan Tertinggi: <Text strong>{progressionMetrics.highestGrowthCrit}</Text>
                  </Tag>
                </Space>
              </Flex>

              <div style={{ width: '100%', height: 350, padding: '4px 8px 8px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(selectedKriteria === 'ALL' ? criteriaProgressionData : (singleCriterionProgressionData || criteriaProgressionData)) as any[]}
                    margin={{ top: 15, right: 35, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} opacity={0.6} />
                    <XAxis
                      dataKey="cycle"
                      stroke={token.colorTextSecondary}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[2.0, 4.0]}
                      stroke={token.colorTextSecondary}
                      fontSize={11}
                      ticks={[2.0, 2.5, 3.0, 3.5, 4.0]}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: token.colorBgContainer,
                        borderColor: token.colorBorderSecondary,
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: token.boxShadowSecondary,
                      }}
                      formatter={(val: any, name: any) => [`${Number(val).toFixed(2)} / 4.00`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    />
                    <ReferenceLine
                      y={3.50}
                      label={{ value: 'Ambang Unggul (3.50)', fill: '#10b981', fontSize: 11, position: 'right' }}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.8}
                    />
                    <ReferenceLine
                      y={3.00}
                      label={{ value: 'Ambang Baik Sekali (3.00)', fill: '#3b82f6', fontSize: 11, position: 'right' }}
                      stroke="#3b82f6"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />

                    {selectedKriteria === 'ALL' ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="Budaya Mutu"
                          stroke="#10b981"
                          strokeWidth={2.8}
                          dot={{ r: 5, fill: '#10b981' }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Relevansi"
                          stroke="#3b82f6"
                          strokeWidth={2.8}
                          dot={{ r: 5, fill: '#3b82f6' }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Akuntabilitas"
                          stroke="#f59e0b"
                          strokeWidth={2.8}
                          dot={{ r: 5, fill: '#f59e0b' }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Diferensiasi Misi"
                          stroke="#8b5cf6"
                          strokeWidth={2.8}
                          dot={{ r: 5, fill: '#8b5cf6' }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Rerata Keseluruhan"
                          stroke="#ec4899"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: '#ec4899' }}
                          activeDot={{ r: 6 }}
                        />
                      </>
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey="Konsensus AL"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={{ r: 6, fill: '#06b6d4' }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Asesor 1"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#10b981' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Asesor 2"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#3b82f6' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Evaluasi Diri (LED)"
                          stroke="#94a3b8"
                          strokeWidth={1.8}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: '#94a3b8' }}
                          activeDot={{ r: 6 }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Assessment Cycles Timeline Cards */}
              <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
                {criteriaProgressionData.map((cycle, idx) => {
                  const isCurrent = idx === 3;
                  return (
                    <Col xs={24} sm={12} md={6} key={cycle.cycle}>
                      <Card
                        size="small"
                        style={{
                          backgroundColor: isCurrent ? `${token.colorPrimary}0f` : token.colorBgContainer,
                          borderColor: isCurrent ? token.colorPrimary : token.colorBorderSecondary,
                        }}
                      >
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 12, color: isCurrent ? token.colorPrimary : undefined }}>
                            {cycle.cycle}
                          </Text>
                          <Tag color={isCurrent ? 'processing' : 'default'} style={{ fontSize: 10, margin: 0 }}>
                            {isCurrent ? 'AL Sekarang' : cycle.year}
                          </Tag>
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                          {cycle.stage}
                        </Text>
                        <Flex justify="space-between" align="baseline">
                          <Text style={{ fontSize: 11 }}>Skor Rerata:</Text>
                          <Text strong style={{ fontSize: 14, fontFamily: 'monospace', color: cycle['Rerata Keseluruhan'] >= 3.5 ? '#10b981' : '#3b82f6' }}>
                            {cycle['Rerata Keseluruhan'].toFixed(2)} / 4.00
                          </Text>
                        </Flex>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </div>
        )}
      </Card>

      {/* Discrepancy Table */}
      <Card
        title={
          <Space>
            <CalculatorOutlined style={{ color: token.colorPrimary }} />
            <span>Matriks Penyelarasan Skor AL ({displayedIndicators.length} Indikator)</span>
          </Space>
        }
        extra={
          <Space align="center">
            <Text type="secondary">Filter Kriteria:</Text>
            <Select
              value={selectedKriteria}
              onChange={setSelectedKriteria}
              style={{ width: 220 }}
              options={[
                { label: 'Semua Kriteria (K1 s/d K9)', value: 'ALL' },
                ...currentLam.kriteriaList.map(k => ({
                  label: `${k.code || k.number}. ${k.shortTitle || k.title.split(':')[0]}`,
                  value: k.number,
                })),
              ]}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={displayedIndicators}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
};
