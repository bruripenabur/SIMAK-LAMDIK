import React from 'react';
import { Modal, Card, Row, Col, Progress, Typography, Space, Button, Table, Tag, Flex, theme, message } from 'antd';
import { DashboardOutlined, CheckCircleOutlined, WarningOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { LamProfile, AssessmentRecord, IndicatorItem } from '../types/accreditation';
import { calculateCriteriaSubtotals, calculateAccreditationTotal } from '../utils/mathEngine';

const { Title, Text, Paragraph } = Typography;

interface SummaryDashboardModalProps {
  visible: boolean;
  onClose: () => void;
  currentLam: LamProfile;
  assessmentRecords: Record<string, AssessmentRecord>;
  onQuickFillBaseline: () => void;
  onNavigateToIndicator: (indicatorId: string) => void;
}

export const SummaryDashboardModal: React.FC<SummaryDashboardModalProps> = ({
  visible,
  onClose,
  currentLam,
  assessmentRecords,
  onQuickFillBaseline,
  onNavigateToIndicator,
}) => {
  const { token } = theme.useToken();

  const subtotalsResult = calculateCriteriaSubtotals(currentLam.indicators, assessmentRecords, 'consensus');
  const grandTotal = calculateAccreditationTotal(currentLam.indicators, assessmentRecords, 'consensus');

  // Find unrated indicators (score = 0 or unrated)
  const unratedIndicators = currentLam.indicators.filter((ind) => {
    const rec = assessmentRecords[ind.id];
    const score = rec ? (rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0) : 0;
    return score === 0 && !rec?.isRated;
  });

  return (
    <Modal
      title={
        <Space>
          <DashboardOutlined style={{ color: token.colorPrimary, fontSize: 20 }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Dasbor Ringkasan Status Akreditasi ({currentLam.lamCode})</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="quickfill" type="default" icon={<ThunderboltOutlined />} onClick={onQuickFillBaseline} style={{ borderColor: '#f59e0b', color: '#f59e0b', fontWeight: 600 }}>
          ⚡ Isi Cepat (Quick-Fill Baseline Skor 3.00)
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Tutup Dasbor
        </Button>,
      ]}
      width={950}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px 24px' } }}
    >
      {/* Top Banner */}
      <Card style={{ backgroundColor: '#0f172a', borderColor: '#1e293b', marginBottom: 20 }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Akumulasi Nilai Akreditasi (NA)</Text>
            <Title level={2} style={{ margin: 0, color: grandTotal >= 361 ? '#10b981' : grandTotal >= 321 ? '#06b6d4' : '#f59e0b' }}>
              {grandTotal.toFixed(2)} / 400.00
            </Title>
          </div>
          <Space>
            <Tag color={unratedIndicators.length === 0 ? 'success' : 'warning'} style={{ padding: '6px 12px', fontSize: 13 }}>
              {unratedIndicators.length === 0 ? 'Semua Indikator Telah Dinilai' : `${unratedIndicators.length} Indikator Belum Dinilai (Skor 0)`}
            </Tag>
          </Space>
        </Flex>
      </Card>

      {/* 9 Criteria Progress Bars Grid */}
      <Title level={5} style={{ color: '#f8fafc', marginBottom: 12 }}>
        Indikator Kemajuan per Kriteria LAMDIK (1 s.d. 9)
      </Title>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((kNum) => {
          const st = subtotalsResult.subtotals[kNum];
          const currentScore = st?.totalWeightedScore || 0;
          const maxScore = st?.maxPossibleScore || 1;
          const pct = Math.min(100, Math.round((currentScore / maxScore) * 100));
          const kInfo = currentLam.kriteriaList.find(k => k.number === kNum);

          return (
            <Col xs={24} sm={12} md={8} key={kNum}>
              <div style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155' }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 12, color: '#f1f5f9' }}>
                    K{kNum}: {kInfo?.shortTitle || `Kriteria ${kNum}`}
                  </Text>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                    {currentScore.toFixed(1)} / {maxScore.toFixed(0)}
                  </span>
                </Flex>
                <Progress 
                  percent={pct} 
                  size="small" 
                  strokeColor={pct >= 85 ? '#10b981' : pct >= 70 ? '#06b6d4' : '#f59e0b'}
                  railColor="#334155"
                  style={{ margin: '4px 0 0' }}
                />
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
                  {st?.indicatorCount || 0} Indikator · Bobot {kInfo?.totalWeight || 0}%
                </Text>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Unrated Indicators Alert / Table */}
      {unratedIndicators.length > 0 && (
        <div>
          <Title level={5} style={{ color: '#f8fafc', marginBottom: 8 }}>
            Indikator Menunggu Penilaian (Skor = 0)
          </Title>
          <Table
            dataSource={unratedIndicators.slice(0, 10)}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: 'Kode', dataIndex: 'code', key: 'code', width: 70 },
              { title: 'Kriteria & Nama Indikator', dataIndex: 'name', key: 'name', render: (val, record: IndicatorItem) => `${record.kriteriaTitle} - ${val}` },
              { title: 'Kategori', dataIndex: 'category', key: 'category', width: 90, render: (cat) => <Tag color="blue">{cat}</Tag> },
              {
                title: 'Aksi',
                key: 'action',
                width: 120,
                align: 'center',
                render: (_val, record: IndicatorItem) => (
                  <Button size="small" type="link" icon={<ArrowRightOutlined />} onClick={() => { onClose(); onNavigateToIndicator(record.id); }}>
                    Beri Skor
                  </Button>
                ),
              },
            ]}
          />
          {unratedIndicators.length > 10 && (
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
              Dan {unratedIndicators.length - 10} indikator lainnya belum diberi skor. Gunakan tombol 'Isi Cepat' di bawah untuk mengisi seluruhnya secara otomatis ke nilai baseline.
            </Text>
          )}
        </div>
      )}
    </Modal>
  );
};
