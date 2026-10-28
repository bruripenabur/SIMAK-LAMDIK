import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Slider, 
  InputNumber,
  Table, 
  Tag, 
  Alert, 
  Button, 
  Typography, 
  Space, 
  Flex, 
  theme,
  message,
  Popconfirm,
  Select
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ControlOutlined, 
  ArrowRightOutlined, 
  FileTextOutlined,
  ReloadOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LamProfile, SyaratEvaluationResult, AssessmentRecord } from '../types/accreditation';
import { renderLatex, simulateImprovement } from '../utils/mathEngine';
import { RadarSyaratUnggulChart } from './RadarSyaratUnggulChart';

const { Title, Text, Paragraph } = Typography;

interface SyaratUnggulPanelProps {
  currentLam: LamProfile;
  evaluations: SyaratEvaluationResult[];
  overallQualified: boolean;
  finalRank: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI';
  overallScore: number;
  globalVariables: Record<string, number>;
  onUpdateGlobalVariable: (key: string, val: number) => void;
  onNavigateToIndicator: (indicatorId: string) => void;
  assessmentRecords?: Record<string, AssessmentRecord>;
}

export const SyaratUnggulPanel: React.FC<SyaratUnggulPanelProps> = ({
  currentLam,
  evaluations,
  overallQualified,
  finalRank,
  overallScore,
  globalVariables,
  onUpdateGlobalVariable,
  onNavigateToIndicator,
  assessmentRecords = {},
}) => {
  const { token } = theme.useToken();

  const isTrulyUnggul = overallQualified && overallScore >= currentLam.thresholdUnggul;

  // Table columns for Syarat Unggul Rules
  const columns: ColumnsType<SyaratEvaluationResult> = [
    {
      title: 'No',
      key: 'index',
      width: 55,
      align: 'center',
      render: (_val, _record, index) => index + 1,
    },
    {
      title: 'Kriteria Melampaui SN-DIKTI & Gatekeeper',
      key: 'ruleInfo',
      render: (_val, record) => (
        <Space orientation="vertical" size={2}>
          <Space>
            <Text strong style={{ fontSize: 13 }}>{record.rule.indicatorName}</Text>
            <Tag color="cyan" style={{ fontFamily: 'monospace' }}>{record.rule.indicatorKey}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.rule.description}</Text>
          {record.rule.latexRule && (
            <div 
              style={{ 
                marginTop: 4, 
                padding: '2px 8px', 
                backgroundColor: token.colorBgElevated, 
                borderRadius: token.borderRadiusSM, 
                display: 'inline-block' 
              }}
              dangerouslySetInnerHTML={{ __html: renderLatex(record.rule.latexRule) }}
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Capaian Aktual',
      dataIndex: 'actualValueText',
      key: 'actualValueText',
      width: 220,
      render: (text) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</Text>
      ),
    },
    {
      title: 'Hasil Evaluasi',
      key: 'status',
      width: 160,
      align: 'center',
      render: (_val, record) => (
        record.passed ? (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '3px 8px' }}>
            MELAMPAUI SN-DIKTI
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />} style={{ padding: '3px 8px' }}>
            BELUM MEMENUHI
          </Tag>
        )
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_val, record) => {
        const targetId = record.rule.targetIndicators?.[0];
        if (!targetId) return null;
        return (
          <Button 
            size="small" 
            type="link" 
            icon={<ArrowRightOutlined />} 
            onClick={() => onNavigateToIndicator(targetId)}
          >
            Buka Kertas Kerja
          </Button>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '16px 24px' }}>
      {/* Top Banner Result Card */}
      <Card 
        style={{ 
          background: isTrulyUnggul 
            ? `linear-gradient(135deg, ${token.colorSuccessBgHover} 0%, ${token.colorBgContainer} 100%)`
            : `linear-gradient(135deg, ${token.colorWarningBg} 0%, ${token.colorBgContainer} 100%)`,
          borderColor: isTrulyUnggul ? token.colorSuccessBorder : token.colorWarningBorder,
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space orientation="vertical" size="small">
              <Space>
                <Tag color={isTrulyUnggul ? 'success' : 'warning'}>
                  {overallQualified ? 'MELAMPAUI SN-DIKTI PASSED' : 'GATEKEEPER ALERT'}
                </Tag>
                <Text type="secondary">Instrumen: <Text strong>{currentLam.lamCode}</Text></Text>
              </Space>

              <Title level={3} style={{ margin: 0 }}>
                {isTrulyUnggul ? (
                  <Space align="center">
                    <SafetyCertificateOutlined style={{ color: token.colorSuccess }} />
                    <span>Status Peringkat Akreditasi: UNGGUL (Melampaui SN-Dikti)</span>
                  </Space>
                ) : (
                  <Space align="center">
                    <WarningOutlined style={{ color: token.colorWarning }} />
                    <span>Status Peringkat Terkoreksi: {finalRank.toUpperCase()}</span>
                  </Space>
                )}
              </Title>

              <Paragraph style={{ margin: 0, color: token.colorTextSecondary }}>
                {isTrulyUnggul
                  ? `Total Skor Asesmen Lapangan mencapai ${overallScore.toFixed(1)} / 400 (Ambang batas Unggul: >= ${currentLam.thresholdUnggul}) dan seluruh (${currentLam.syaratUnggulRules.length}) kriteria Syarat Perlu Unggul / Melampaui SN-DIKTI terpenuhi.`
                  : overallScore >= currentLam.thresholdUnggul
                  ? `Total Skor Asesmen Lapangan mencapai ${overallScore.toFixed(1)} (memenuhi skor numerik >= ${currentLam.thresholdUnggul}), namun peringkat didegradasi menjadi "${finalRank}" karena terdapat Syarat Perlu Unggul / Melampaui SN-DIKTI yang belum terpenuhi.`
                  : `Total Skor Asesmen Lapangan saat ini ${overallScore.toFixed(1)} / 400. Peringkat sesuai ambang batas nilai adalah "${finalRank}".`}
              </Paragraph>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Row gutter={16} justify="end">
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: token.colorBgElevated }}>
                  <Statistic 
                    title="Nilai Akreditasi (NA)" 
                    value={overallScore} 
                    precision={1} 
                    styles={{ content: { color: overallScore >= currentLam.thresholdUnggul ? '#10b981' : '#f59e0b', fontWeight: 800 } }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', backgroundColor: token.colorBgElevated }}>
                  <Statistic 
                    title="Syarat Melampaui" 
                    value={`${evaluations.filter(e => e.passed).length}/${evaluations.length}`} 
                    styles={{ content: { color: overallQualified ? '#10b981' : '#ef4444', fontWeight: 800 } }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Radar Chart Component */}
      <RadarSyaratUnggulChart
        currentLam={currentLam}
        evaluations={evaluations}
        overallQualified={overallQualified}
        overallScore={overallScore}
        finalRank={finalRank}
        globalVariables={globalVariables}
      />

      {/* What-If Simulation Card */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#f59e0b' }} />
            <span>Simulasi Apa yang Perlu Ditingkatkan (What-If Projection)</span>
          </Space>
        }
        style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorderSecondary }}
      >
        <Paragraph style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
          Pilih salah satu indikator untuk mensimulasikan peningkatan skor ke nilai maksimum (4.00) dan lihat proyeksi kenaikan Nilai Akreditasi (NA) total secara instan.
        </Paragraph>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>Pilih Indikator Simulasi:</Text>
            <Select
              showSearch
              placeholder="Pilih indikator..."
              style={{ width: '100%' }}
              options={currentLam.indicators.map(ind => ({
                value: ind.id,
                label: `${ind.code}. ${ind.name} (Bobot: ${ind.bobot})`,
              }))}
              onChange={(targetId) => {
                const sim = simulateImprovement(currentLam.indicators, assessmentRecords, targetId, 4.0);
                message.info({
                  content: `Proy. NA Total: ${sim.projectedTotal.toFixed(2)} (+${sim.delta.toFixed(2)}) → Peringkat: ${sim.projectedRank}`,
                  duration: 4,
                });
              }}
            />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
              <Text strong style={{ color: '#38bdf8', display: 'block', marginBottom: 4 }}>💡 Rekomendasi Mutu LAMDIK:</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                Fokuskan peningkatan dokumen pada Kriteria 4 (Kualifikasi Doktor DTPS) dan Kriteria 6 (Kurikulum OBE & Asesmen CPL) yang memiliki porsi bobot tertinggi dalam instrumen IAPSK 3.0.
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Melampaui SN-DIKTI Feature Showcase Panel */}
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#10b981' }} />
            <span>Indikator 'Melampaui SN-DIKTI' (Syarat Tambahan Predikat Unggul LAMDIK)</span>
          </Space>
        }
        style={{ backgroundColor: token.colorBgContainer, borderColor: token.colorBorderSecondary }}
      >
        <Paragraph style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
          Sesuai Peraturan BAN-PT No. 27 Tahun 2025 tentang Kriteria Melampaui Standar Nasional Pendidikan Tinggi bagi Program Studi di bawah LAMDIK, untuk memperoleh peringkat <strong>Unggul</strong>, program studi wajib memenuhi ambang batas numerik (NA ≥ 361) serta kriteria kualitatif dan kuantitatif khusus <Text style={{ color: '#34d399' }}>Melampaui SN-DIKTI</Text> (seperti rekognisi internasional, kurikulum OBE, microteaching/PPL, SPMI PPEPP, dan produktivitas publikasi DTPS/mahasiswa).
        </Paragraph>
        <Row gutter={[16, 16]}>
          {evaluations.map((ev, idx) => (
            <Col xs={24} md={12} key={ev.rule.id || idx}>
              <div style={{ backgroundColor: '#0f172a', padding: 14, borderRadius: 8, border: `1px solid ${ev.passed ? '#047857' : '#7f1d1d'}` }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                  <Text strong style={{ color: '#f8fafc', fontSize: 13 }}>{ev.rule.indicatorName}</Text>
                  {ev.passed ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>MELAMPAUI SN-DIKTI</Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>BELUM MELAMPAUI</Tag>
                  )}
                </Flex>
                <Paragraph style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 8px' }}>
                  {ev.rule.description}
                </Paragraph>
                <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#38bdf8' }}>
                  Capaian Aktual: {ev.actualValueText}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Rules Evaluation Table */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorPrimary }} />
            <span>Daftar Evaluasi Syarat Perlu Unggul & Melampaui SN-DIKTI ({evaluations.length} Kriteria)</span>
          </Space>
        }
        extra={<Text type="secondary" style={{ fontSize: 12 }}>Acuan: {currentLam.regulationBasis}</Text>}
      >
        <Table
          rowKey={(record) => record.rule.id}
          columns={columns}
          dataSource={evaluations}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
};
