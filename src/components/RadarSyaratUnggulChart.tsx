import React from 'react';
import { Card, Row, Col, Tag, Typography, Progress, Space, Flex, theme, Badge } from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  RadarChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { LamProfile, SyaratEvaluationResult } from '../types/accreditation';

const { Text, Title } = Typography;

interface RadarSyaratUnggulChartProps {
  currentLam: LamProfile;
  evaluations: SyaratEvaluationResult[];
  overallQualified: boolean;
  overallScore: number;
  finalRank: string;
  globalVariables: Record<string, number>;
  compact?: boolean;
}

export const RadarSyaratUnggulChart: React.FC<RadarSyaratUnggulChartProps> = ({
  currentLam,
  evaluations,
  overallQualified,
  overallScore,
  finalRank,
  globalVariables,
  compact = false,
}) => {
  const { token } = theme.useToken();

  // Helper untuk normalisasi skor / persentase pemenuhan 0 - 100% untuk masing-masing kriteria
  const radarData = React.useMemo(() => {
    return evaluations.map((ev, index) => {
      const rule = ev.rule;
      const key = rule.indicatorKey;
      let capaianPct = 100;
      let ambangPct = 85;
      let actualScoreText = ev.actualValueText;
      let targetText = '';

      if (rule.ruleType === 'min_score') {
        const minReq = rule.minScore ?? 3.5;
        targetText = `Min. Skor: ${minReq.toFixed(2)}`;
        ambangPct = Math.round((minReq / 4.0) * 100); // 3.5 / 4 = 87.5 -> 88%

        // Ambil capaian numerik jika tersedia
        const match = ev.actualValueText.match(/(\d+\.?\d*)/);
        const actualVal = match ? parseFloat(match[1]) : (ev.passed ? 4.0 : 3.0);
        capaianPct = Math.min(100, Math.round((actualVal / 4.0) * 100));
        actualScoreText = `Skor: ${actualVal.toFixed(2)} / 4.00`;
      } else if (rule.formula) {
        if (rule.formula.includes('PTW') || rule.formula.includes('PPS')) {
          const ptw = globalVariables.PTW ?? 0;
          const pps = globalVariables.PPS ?? 0;
          targetText = 'PTW ≥ 45% atau PPS ≥ 75%';
          ambangPct = 85;
          if (ptw === 0 && pps === 0) {
            capaianPct = 0;
            actualScoreText = 'PTW: 0% | PPS: 0% (Kosong)';
          } else {
            const ptwRatio = ptw / 45;
            const ppsRatio = pps / 75;
            const bestRatio = Math.max(ptwRatio, ppsRatio);
            capaianPct = Math.min(100, Math.round(bestRatio * 85));
            actualScoreText = `PTW: ${ptw}% | PPS: ${pps}%`;
          }
        } else if (rule.formula.includes('WT')) {
          const wt = globalVariables.WT ?? 0;
          targetText = 'WT ≤ 7.5 bulan';
          ambangPct = 85;
          if (wt <= 0) {
            capaianPct = 0;
            actualScoreText = 'WT: 0 bln (Kosong)';
          } else if (wt <= 6.0) {
            capaianPct = 100;
            actualScoreText = `WT: ${wt} bulan`;
          } else if (wt <= 7.5) {
            capaianPct = Math.round(100 - ((wt - 6.0) / 1.5) * 15);
            actualScoreText = `WT: ${wt} bulan`;
          } else {
            capaianPct = Math.max(20, Math.round(85 - ((wt - 7.5) / 5) * 65));
            actualScoreText = `WT: ${wt} bulan`;
          }
        } else if (rule.formula.includes('PDGBLKL')) {
          const pdg = globalVariables.PDGBLKL ?? 0;
          targetText = 'Dosen S3 ≥ 50%';
          ambangPct = 85;
          if (pdg <= 0) {
            capaianPct = 0;
            actualScoreText = 'Dosen S3: 0% (Kosong)';
          } else {
            capaianPct = Math.min(100, Math.round((pdg / 50) * 85));
            actualScoreText = `Dosen S3: ${pdg}%`;
          }
        } else {
          ambangPct = 80;
          capaianPct = ev.passed ? 95 : 0;
          targetText = rule.formula;
        }
      } else {
        ambangPct = 85;
        capaianPct = ev.passed ? 100 : 50;
        targetText = 'Ambang Syarat Unggul';
      }

      // Pastikan label ringkas untuk sumbu radar
      let shortLabel = `${index + 1}. ${key}`;
      if (key === 'Kurikulum') shortLabel = '1. Kurikulum OBE';
      else if (key === 'Laboratorium') shortLabel = '2. Lab & Sarpras';
      else if (key === 'PPEPP') shortLabel = '3. PPEPP Penjaminan';
      else if (key === 'PTW') shortLabel = '4. Kelulusan (PTW/PPS)';
      else if (key === 'WT') shortLabel = '5. Masa Tunggu (WT)';
      else if (key === 'PDGBLKL') shortLabel = '6. Dosen S3';

      return {
        id: rule.id,
        shortLabel,
        fullTitle: rule.indicatorName,
        capaian: capaianPct,
        ambang: ambangPct,
        actualScoreText,
        targetText,
        passed: ev.passed,
        reason: ev.reason,
      };
    });
  }, [evaluations, globalVariables]);

  const passedCount = evaluations.filter(e => e.passed).length;
  const totalCount = evaluations.length;
  const isAllPassed = passedCount === totalCount;

  // Custom Tooltip Recharts yang informatif
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          padding: '10px 14px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          maxWidth: 280,
          color: '#ffffff',
          fontSize: 12,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#38bdf8' }}>
            {data.fullTitle}
          </div>
          <div style={{ marginBottom: 6 }}>
            <Tag color={data.passed ? 'success' : 'error'} icon={data.passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
              {data.passed ? 'MEMENUHI SYARAT' : 'BELUM MEMENUHI'}
            </Tag>
          </div>
          <div style={{ lineHeight: 1.5 }}>
            <div><strong>Capaian Aktual:</strong> <span style={{ color: '#10b981' }}>{data.actualScoreText}</span> ({data.capaian}%)</div>
            <div><strong>Standar Ambang:</strong> <span style={{ color: '#f59e0b' }}>{data.targetText}</span> ({data.ambang}%)</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>{data.reason}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        backgroundColor: token.colorBgContainer,
        borderColor: isAllPassed ? '#10b981' : token.colorBorderSecondary,
        boxShadow: isAllPassed ? '0 0 16px rgba(16, 185, 129, 0.15)' : undefined,
      }}
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap="small">
          <Space>
            <RadarChartOutlined style={{ color: '#10b981', fontSize: 18 }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              Radar Chart Pemenuhan 6 Kriteria Syarat Perlu Unggul (Real-Time)
            </span>
            <Tag color="cyan">{currentLam.lamCode}</Tag>
          </Space>
          <Space>
            <Tag 
              color={isAllPassed ? 'success' : 'warning'} 
              icon={isAllPassed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              style={{ fontWeight: 600, fontSize: 12, padding: '2px 8px' }}
            >
              Status: {passedCount} / {totalCount} Kriteria Terpenuhi ({Math.round((passedCount / (totalCount || 1)) * 100)}%)
            </Tag>
          </Space>
        </Flex>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 11 }}>
          Terhubung Dinamis dengan Slider & Isian Kertas Kerja
        </Text>
      }
    >
      <Row gutter={[24, 24]} align="middle">
        {/* Left Column: Visual Radar Chart (Recharts) */}
        <Col xs={24} lg={compact ? 24 : 14}>
          <div style={{ width: '100%', height: compact ? 300 : 380, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={compact ? "70%" : "75%"} data={radarData}>
                <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="shortLabel" 
                  tick={{ fill: token.colorText, fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: token.colorTextSecondary, fontSize: 9 }}
                  stroke="#4b5563"
                />
                <Radar 
                  name="Capaian Aktual Prodi (%)" 
                  dataKey="capaian" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
                <Radar 
                  name="Ambang Minimum Unggul (%)" 
                  dataKey="ambang" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.12} 
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <RechartsTooltip content={<CustomRadarTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 12, fontSize: 12 }} 
                  formatter={(value) => <span style={{ color: token.colorText }}>{value}</span>}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Right Column: 6 Criteria Metric Checklist & Real-Time Status */}
        <Col xs={24} lg={compact ? 24 : 10}>
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ 
              backgroundColor: isAllPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isAllPassed ? '#10b981' : '#f59e0b'}`,
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 8,
            }}>
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 13, color: isAllPassed ? '#10b981' : '#f59e0b' }}>
                  {isAllPassed ? '★ SEMUA SYARAT UNGGUL TERPENUHI' : 'PERINGKAT TERKOREKSI / GATEKEEPER'}
                </Text>
                <Tag color={isAllPassed ? 'success' : 'warning'} style={{ fontWeight: 700 }}>
                  {finalRank}
                </Tag>
              </Flex>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                Total Skor AL: <strong style={{ color: token.colorPrimary }}>{overallScore.toFixed(1)} / 400</strong>.
                {isAllPassed 
                  ? ' Seluruh ambang batas syarat perlu unggul telah dipenuhi 100%!' 
                  : ' Terdapat indikator syarat perlu unggul di bawah batas minimum.'}
              </Text>
            </div>

            {/* List 6 Kriteria dengan Progress Bar dan Tag Status */}
            <div style={{ maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
              {radarData.map((item, idx) => (
                <div 
                  key={item.id} 
                  style={{
                    backgroundColor: token.colorBgElevated,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: 6,
                    padding: '7px 10px',
                    marginBottom: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 3 }}>
                    <Text strong style={{ fontSize: 12 }}>
                      {item.shortLabel}
                    </Text>
                    <Tag 
                      color={item.passed ? 'success' : 'error'} 
                      icon={item.passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                      style={{ fontSize: 10, margin: 0, padding: '0 6px', fontWeight: 600 }}
                    >
                      {item.passed ? 'LOLOS' : 'GAGAL'}
                    </Tag>
                  </Flex>

                  <Flex justify="space-between" align="center" style={{ fontSize: 11, color: token.colorTextSecondary }}>
                    <span>Capaian: <strong style={{ color: item.passed ? '#10b981' : '#ef4444' }}>{item.actualScoreText}</strong></span>
                    <span>Target: <strong>{item.targetText}</strong></span>
                  </Flex>

                  <Progress 
                    percent={item.capaian} 
                    size="small" 
                    status={item.passed ? 'success' : 'exception'}
                    showInfo={false}
                    strokeColor={item.passed ? '#10b981' : '#ef4444'}
                    style={{ margin: '3px 0 0' }}
                  />
                </div>
              ))}
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
