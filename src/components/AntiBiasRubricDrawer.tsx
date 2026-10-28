import React, { useState } from 'react';
import { 
  Drawer, 
  Alert, 
  Card, 
  Space, 
  Flex, 
  Tag, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tooltip,
  message,
  theme 
} from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleFilled, 
  BookOutlined, 
  AuditOutlined, 
  InfoCircleOutlined,
  LinkOutlined,
  FilePdfOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { IndicatorItem, AssessmentRecord, EvidenceLink } from '../types/accreditation';
import { 
  getEvidenceDocumentInfo, 
  updateCustomEvidenceDocument, 
  deleteCustomEvidenceDocument 
} from '../utils/evidenceDocumentUrls';
import { classifyUrlDomain } from '../utils/evidenceExtractor';

const { Title, Text, Paragraph } = Typography;

interface AntiBiasRubricDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: IndicatorItem | null;
  currentRecord: AssessmentRecord | null;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  onSelectScore: (score: number) => void;
  onUpdateRecord?: (indicatorId: string, updated: Partial<AssessmentRecord>) => void;
  quantitativeDocName: string;
  qualitativeDocName: string;
  onAddEvidence?: (item: EvidenceLink) => void;
  onUpdateEvidence?: (evidenceId: string, updated: Partial<EvidenceLink>) => void;
  onDeleteEvidence?: (evidenceId: string) => void;
  onUpdateIndicatorEvidence?: (indicatorId: string, newTags: string[]) => void;
}

export const AntiBiasRubricDrawer: React.FC<AntiBiasRubricDrawerProps> = ({
  isOpen,
  onClose,
  indicator,
  currentRecord,
  activeRole,
  onSelectScore,
  onUpdateRecord,
  quantitativeDocName,
  qualitativeDocName,
  onAddEvidence,
  onUpdateEvidence,
  onDeleteEvidence,
  onUpdateIndicatorEvidence,
}) => {
  const { token } = theme.useToken();

  // Evidence Modal State inside Drawer
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [evidenceForm] = Form.useForm();

  if (!indicator) return null;

  // Tentukan Dokumen Evaluasi: Kualitatif = LED, Kuantitatif = LKPS
  const selfDocName = indicator.category === 'Kuantitatif'
    ? (quantitativeDocName || 'LKPS')
    : indicator.category === 'Kualitatif'
    ? (qualitativeDocName || 'LED')
    : (indicator.sourceDoc === 'LKPS' ? (quantitativeDocName || 'LKPS') : (qualitativeDocName || 'LED'));

  const valSelf = Math.min(4, Math.max(0, Math.round(currentRecord?.scoreSelf ?? 4)));
  const valA1 = Math.min(4, Math.max(0, Math.round(currentRecord?.scoreAsesor1 ?? 0)));
  const valA2 = Math.min(4, Math.max(0, Math.round(currentRecord?.scoreAsesor2 ?? 0)));
  const valConsensus = Math.min(4, Math.max(0, Math.round(currentRecord?.scoreConsensus ?? 0)));

  const handleAdjustAssessor = (role: 'asesor1' | 'asesor2', delta: number) => {
    if (!indicator || !onUpdateRecord) return;
    if (role === 'asesor1') {
      const nextA1 = Math.min(4, Math.max(0, valA1 + delta));
      const consensus = Math.min(4, Math.max(0, Math.round((nextA1 + valA2) / 2)));
      onUpdateRecord(indicator.id, { scoreAsesor1: nextA1, scoreConsensus: consensus });
    } else {
      const nextA2 = Math.min(4, Math.max(0, valA2 + delta));
      const consensus = Math.min(4, Math.max(0, Math.round((valA1 + nextA2) / 2)));
      onUpdateRecord(indicator.id, { scoreAsesor2: nextA2, scoreConsensus: consensus });
    }
  };

  const rubricOptions = [
    {
      score: 4,
      title: 'Skor 4: Sangat Baik / Melampaui SN-Dikti',
      desc: indicator.rubric.score4,
      tag: 'Unggul / International Benchmark',
      color: token.colorSuccess,
      tagColor: 'success',
    },
    {
      score: 3,
      title: 'Skor 3: Baik / Memenuhi Standar Nasional (SN-Dikti)',
      desc: indicator.rubric.score3,
      tag: 'Standar Mutu Tercapai',
      color: token.colorPrimary,
      tagColor: 'processing',
    },
    {
      score: 2,
      title: 'Skor 2: Cukup / Pemenuhan Parsial',
      desc: indicator.rubric.score2,
      tag: 'Pemenuhan Standar Sebagian',
      color: token.colorWarning,
      tagColor: 'warning',
    },
    {
      score: 1,
      title: 'Skor 1: Kurang / Di Bawah Standar',
      desc: indicator.rubric.score1,
      tag: 'Perlu Rekomendasi Perbaikan Serius',
      color: token.colorError,
      tagColor: 'error',
    },
    {
      score: 0,
      title: 'Skor 0: Tidak Ada Data / Sangat Buruk',
      desc: indicator.rubric.score0,
      tag: 'Ketiadaan Bukti Dokumen Mutu',
      color: token.colorTextTertiary,
      tagColor: 'default',
    },
  ];

  return (
    <Drawer
      title={
        <Space orientation="vertical" size={2}>
          <Space align="center">
            <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {indicator.code}
            </Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {indicator.kriteriaTitle} · Bobot: {indicator.bobot}
            </Text>
            {indicator.isSyaratUnggul && (
              <Tag color="red">SYARAT PERLU UNGGUL</Tag>
            )}
          </Space>
          <Text strong style={{ fontSize: 15 }}>{indicator.name}</Text>
        </Space>
      }
      placement="right"
      size={680}
      open={isOpen}
      onClose={onClose}
      extra={
        <Button onClick={onClose} type="text">Tutup</Button>
      }
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Anti-Bias Evaluator Protocol Guidance */}
        <Alert
          title="Panduan Anti-Bias Asesor (Anti-Bias Evaluator Protocol)"
          description={
            <ul style={{ paddingLeft: 18, margin: '6px 0 0', lineHeight: '1.6' }}>
              <li>
                <strong>Hindari Halo Effect:</strong> Jangan otomatis memberikan skor 4 hanya karena reputasi universitas, tanpa verifikasi bukti faktual di dokumen {indicator.category === 'Kuantitatif' ? quantitativeDocName : qualitativeDocName}.
              </li>
              <li>
                <strong>Prinsip Triangulasi:</strong> Selaraskan data dokumen dengan hasil wawancara dosen, mahasiswa, alumni, dan pimpinan UPPS saat Asesmen Lapangan.
              </li>
              <li>
                <strong>Hindari Leniency Bias:</strong> Berikan skor sesuai deskriptor rubrik secara objektif, demi pembinaan mutu institusi yang kredibel.
              </li>
            </ul>
          }
          type="warning"
          showIcon
          icon={<SafetyCertificateOutlined />}
        />

        {/* Current Assessment Comparison Bar */}
        <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title={`Evaluasi Diri (${selfDocName})`} 
                value={valSelf} 
                precision={0}
                styles={{ content: { fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold' } }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Asesor 1 (A1)" 
                value={valA1} 
                precision={0}
                styles={{ 
                  content: {
                    fontSize: 20, 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold',
                    color: token.colorPrimary 
                  }
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Asesor 2 (A2)" 
                value={valA2} 
                precision={0}
                styles={{ 
                  content: {
                    fontSize: 20, 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold',
                    color: token.colorInfo 
                  }
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Konsensus AL" 
                value={valConsensus} 
                precision={0}
                styles={{ 
                  content: {
                    fontSize: 20, 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold'
                  }
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* Dedicated Stepper Buttons for Asesor 1 & Asesor 2 (Nilai Bulat 0 - 4) */}
        <Card 
          size="small" 
          style={{ 
            backgroundColor: token.colorPrimaryBg,
            borderColor: token.colorPrimaryBorder,
            borderWidth: 1.5,
            borderRadius: token.borderRadius
          }}
        >
          <Row gutter={[16, 12]} align="middle" justify="space-between">
            <Col xs={24} md={10}>
              <Space orientation="vertical" size={2}>
                <Text strong style={{ fontSize: 13, color: token.colorTextHeading }}>
                  Penyesuaian Skor Asesor 1 & 2
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Skala bulat 0 - 4 (tanpa desimal). Gunakan tombol [-] atau [+] setelah melihat rubrik di bawah:
                </Text>
              </Space>
            </Col>

            <Col xs={24} md={14}>
              <Flex justify="flex-end" align="center" gap="small" wrap="wrap">
                {/* Kontrol Asesor 1 (A1) */}
                <div style={{
                  backgroundColor: token.colorBgContainer,
                  border: `1.5px solid ${token.colorPrimary}`,
                  padding: '4px 8px',
                  borderRadius: token.borderRadiusSM,
                }}>
                  <Flex align="center" gap={6}>
                    <Tag color="green" style={{ margin: 0, fontWeight: 'bold', fontSize: 11 }}>A1</Tag>
                    <Button
                      size="small"
                      icon={<MinusOutlined style={{ fontSize: 11 }} />}
                      disabled={valA1 <= 0}
                      onClick={() => handleAdjustAssessor('asesor1', -1)}
                      title="Kurangi nilai Asesor 1 (-1)"
                      style={{ width: 26, height: 26 }}
                    />
                    <span style={{
                      minWidth: 24,
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: 16,
                      color: token.colorPrimary
                    }}>
                      {valA1}
                    </span>
                    <Button
                      size="small"
                      icon={<PlusOutlined style={{ fontSize: 11 }} />}
                      disabled={valA1 >= 4}
                      onClick={() => handleAdjustAssessor('asesor1', 1)}
                      title="Tambah nilai Asesor 1 (+1)"
                      style={{ width: 26, height: 26 }}
                    />
                  </Flex>
                </div>

                {/* Kontrol Asesor 2 (A2) */}
                <div style={{
                  backgroundColor: token.colorBgContainer,
                  border: `1.5px solid ${token.colorInfo}`,
                  padding: '4px 8px',
                  borderRadius: token.borderRadiusSM,
                }}>
                  <Flex align="center" gap={6}>
                    <Tag color="blue" style={{ margin: 0, fontWeight: 'bold', fontSize: 11 }}>A2</Tag>
                    <Button
                      size="small"
                      icon={<MinusOutlined style={{ fontSize: 11 }} />}
                      disabled={valA2 <= 0}
                      onClick={() => handleAdjustAssessor('asesor2', -1)}
                      title="Kurangi nilai Asesor 2 (-1)"
                      style={{ width: 26, height: 26 }}
                    />
                    <span style={{
                      minWidth: 24,
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      fontSize: 16,
                      color: token.colorInfo
                    }}>
                      {valA2}
                    </span>
                    <Button
                      size="small"
                      icon={<PlusOutlined style={{ fontSize: 11 }} />}
                      disabled={valA2 >= 4}
                      onClick={() => handleAdjustAssessor('asesor2', 1)}
                      title="Tambah nilai Asesor 2 (+1)"
                      style={{ width: 26, height: 26 }}
                    />
                  </Flex>
                </div>
              </Flex>
            </Col>
          </Row>
        </Card>

        {/* Official Rubric Descriptors List */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            <AuditOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
            Rubrik Resmi Deskriptor Penilaian (Skala Bulat 0 - 4)
          </Title>

          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {rubricOptions.map((opt) => {
              const isSelectedA1 = valA1 === opt.score;
              const isSelectedA2 = valA2 === opt.score;
              const isSelectedAny = isSelectedA1 || isSelectedA2;

              return (
                <Card
                  key={opt.score}
                  size="small"
                  hoverable
                  style={{
                    borderColor: isSelectedAny ? token.colorPrimary : token.colorBorderSecondary,
                    backgroundColor: isSelectedAny ? token.colorPrimaryBg : token.colorBgContainer,
                    boxShadow: isSelectedAny ? token.boxShadowSecondary : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Space align="center">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: isSelectedAny ? token.colorPrimary : token.colorFillSecondary,
                        color: isSelectedAny ? token.colorWhite : token.colorText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                      }}>
                        {opt.score}
                      </div>
                      <Text strong style={{ fontSize: 14 }}>{opt.title}</Text>
                    </Space>

                    <Space>
                      <Tag color={opt.tagColor}>{opt.tag}</Tag>
                      {isSelectedA1 && (
                        <Tag color="green" icon={<CheckCircleFilled />}>Dipilih A1</Tag>
                      )}
                      {isSelectedA2 && (
                        <Tag color="blue" icon={<CheckCircleFilled />}>Dipilih A2</Tag>
                      )}
                    </Space>
                  </Flex>

                  <Paragraph style={{ margin: '0 0 12px 36px', color: token.colorTextSecondary }}>
                    {opt.desc}
                  </Paragraph>

                  <Flex justify="flex-end" align="center" gap="small" style={{ paddingLeft: 36 }}>
                    <Button
                      size="small"
                      type={isSelectedA1 ? 'primary' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateRecord) {
                          const consensus = Math.min(4, Math.max(0, Math.round((opt.score + valA2) / 2)));
                          onUpdateRecord(indicator.id, { scoreAsesor1: opt.score, scoreConsensus: consensus });
                        } else {
                          onSelectScore(opt.score);
                        }
                      }}
                    >
                      {isSelectedA1 ? `✓ Asesor 1: Skor ${opt.score}` : `Terapkan ke Asesor 1 (${opt.score})`}
                    </Button>
                    <Button
                      size="small"
                      type={isSelectedA2 ? 'primary' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateRecord) {
                          const consensus = Math.min(4, Math.max(0, Math.round((valA1 + opt.score) / 2)));
                          onUpdateRecord(indicator.id, { scoreAsesor2: opt.score, scoreConsensus: consensus });
                        } else {
                          onSelectScore(opt.score);
                        }
                      }}
                    >
                      {isSelectedA2 ? `✓ Asesor 2: Skor ${opt.score}` : `Terapkan ke Asesor 2 (${opt.score})`}
                    </Button>
                  </Flex>
                </Card>
              );
            })}
          </Space>
        </div>

        {/* Evidence Verification Checklist with Direct URL Links */}
        {indicator.evidenceTags && indicator.evidenceTags.length > 0 && (
          <Card 
            size="small" 
            style={{ 
              backgroundColor: token.colorBgElevated,
              borderColor: token.colorPrimaryBorder,
              borderWidth: 1.5
            }}
          >
            <Space orientation="vertical" size={10} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap="small">
                <Space>
                  <BookOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
                  <Text strong style={{ fontSize: 13 }}>Dokumen Bukti Terkait Yang Wajib Diverifikasi:</Text>
                </Space>
                <Space>
                  <Tag color="cyan">
                    {(indicator.evidenceTags || []).length} Tautan Berkas
                  </Tag>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setModalMode('add');
                      setEditingTagName(null);
                      evidenceForm.resetFields();
                      evidenceForm.setFieldsValue({
                        name: '',
                        url: 'https://',
                        type: 'Google Drive',
                      });
                      setEvidenceModalOpen(true);
                    }}
                    style={{ backgroundColor: '#059669', borderColor: '#059669', fontSize: 11 }}
                  >
                    Tambah Link
                  </Button>
                </Space>
              </Flex>

              <Text type="secondary" style={{ fontSize: 11 }}>
                Klik pada dokumen atau tombol tautan di bawah ini untuk meninjau berkas bukti digital resmi secara langsung:
              </Text>

              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                {(indicator.evidenceTags || []).map((tag, idx) => {
                  const docInfo = getEvidenceDocumentInfo(tag);
                  const isSpecialDoc = [
                    'Dokumen Renstra Fakultas', 
                    'SK Rektor VMTS Unpatti', 
                    'Naskah Akademik Keunikan Kurikulum'
                  ].some(k => tag.toLowerCase().includes(k.toLowerCase()));

                  return (
                    <Card
                      key={idx}
                      size="small"
                      style={{
                        backgroundColor: isSpecialDoc ? token.colorPrimaryBg : token.colorBgContainer,
                        borderColor: isSpecialDoc ? token.colorPrimary : token.colorBorderSecondary,
                        borderRadius: token.borderRadiusSM,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      <Row gutter={[12, 8]} align="middle" justify="space-between">
                        <Col xs={24} md={14}>
                          <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                            <Flex align="center" gap="small" wrap="wrap">
                              <Text strong style={{ fontSize: 12, color: token.colorTextHeading }}>
                                {docInfo.name}
                              </Text>
                              <Tag 
                                color={docInfo.type === 'SK Rektor' ? 'purple' : docInfo.type === 'PDF' ? 'red' : 'blue'}
                                icon={docInfo.type === 'PDF' ? <FilePdfOutlined /> : <CloudDownloadOutlined />}
                                style={{ margin: 0, fontSize: 10 }}
                              >
                                {docInfo.type}
                              </Tag>
                              <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0, fontSize: 10 }}>
                                Terhubung URL
                              </Tag>
                            </Flex>

                            {docInfo.description && (
                              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                                {docInfo.description}
                              </Text>
                            )}

                            {/* Direct URL text preview */}
                            <Typography.Link
                              href={docInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                fontSize: 11, 
                                fontFamily: 'monospace', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 4,
                                color: token.colorPrimaryText
                              }}
                              ellipsis
                            >
                              <LinkOutlined />
                              <span>{docInfo.url}</span>
                            </Typography.Link>
                          </Space>
                        </Col>

                        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                          <Space wrap size={4}>
                            <Tooltip title="Salin URL">
                              <Button
                                size="small"
                                icon={<CopyOutlined style={{ fontSize: 12 }} />}
                                onClick={() => {
                                  navigator.clipboard.writeText(docInfo.url);
                                  message.success('Tautan berhasil disalin!');
                                }}
                              />
                            </Tooltip>

                            <Tooltip title="Edit Nama & Tautan Link">
                              <Button
                                size="small"
                                icon={<EditOutlined style={{ color: '#06b6d4', fontSize: 12 }} />}
                                onClick={() => {
                                  setModalMode('edit');
                                  setEditingTagName(docInfo.name);
                                  evidenceForm.setFieldsValue({
                                    name: docInfo.name,
                                    url: docInfo.url,
                                    type: docInfo.type,
                                  });
                                  setEvidenceModalOpen(true);
                                }}
                              />
                            </Tooltip>

                            <Tooltip title="Hapus Tautan Bukti">
                              <Popconfirm
                                title="Hapus Tautan Bukti"
                                description={`Hapus dokumen "${docInfo.name}"?`}
                                onConfirm={() => {
                                  const newTags = (indicator.evidenceTags || []).filter(t => t !== tag && t !== docInfo.name);
                                  onUpdateIndicatorEvidence?.(indicator.id, newTags);
                                  deleteCustomEvidenceDocument(docInfo.name);
                                  message.success(`Tautan "${docInfo.name}" berhasil dihapus.`);
                                }}
                                okText="Hapus"
                                cancelText="Batal"
                                okButtonProps={{ danger: true, size: 'small' }}
                              >
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                />
                              </Popconfirm>
                            </Tooltip>

                            <Button
                              type="primary"
                              size="small"
                              icon={<LinkOutlined />}
                              href={docInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                fontWeight: 500,
                                backgroundColor: isSpecialDoc ? token.colorPrimary : undefined
                              }}
                            >
                              Buka
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </Space>
            </Space>
          </Card>
        )}
      </Space>

      {/* Modal Tambah / Edit Link Bukti di Drawer */}
      <Modal
        title={
          <Space>
            {modalMode === 'add' ? (
              <FileAddOutlined style={{ color: '#10b981', fontSize: 18 }} />
            ) : (
              <EditOutlined style={{ color: '#06b6d4', fontSize: 18 }} />
            )}
            <span>
              {modalMode === 'add' ? 'Tambah Tautan Bukti Dokumen' : 'Edit Tautan Bukti Dokumen'}
            </span>
          </Space>
        }
        open={evidenceModalOpen}
        onCancel={() => setEvidenceModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={540}
      >
        <div style={{ 
          marginBottom: 14, 
          padding: '8px 12px', 
          backgroundColor: token.colorBgContainer, 
          borderRadius: 6, 
          border: `1px solid ${token.colorBorderSecondary}` 
        }}>
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
            Preset Cepat (Klik untuk Mengisi Otomatis):
          </Text>
          <Space wrap size={[6, 6]}>
            <Tag 
              color="cyan" 
              style={{ cursor: 'pointer', fontWeight: 500 }}
              onClick={() => {
                evidenceForm.setFieldsValue({
                  name: 'PDDikti Dosen Kemdiktisaintek',
                  url: 'https://pddikti.kemdiktisaintek.go.id/',
                  type: 'SIM / Portal',
                });
              }}
            >
              🎓 PDDikti (https://pddikti.kemdiktisaintek.go.id/)
            </Tag>
            <Tag 
              color="green" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                evidenceForm.setFieldsValue({
                  name: 'Portal Penjaminan Mutu SPMI Unpatti',
                  url: 'https://spmi.unpatti.ac.id/portal-mutu/laporan',
                  type: 'SIM / Portal',
                });
              }}
            >
              🏛️ SPMI Unpatti
            </Tag>
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                evidenceForm.setFieldsValue({
                  name: 'Folder Berkas Google Drive',
                  url: 'https://drive.google.com/drive/folders/1Unpatti_Arsip_Bukti_AL?usp=sharing',
                  type: 'Google Drive',
                });
              }}
            >
              📁 Google Drive
            </Tag>
          </Space>
        </div>

        <Form
          form={evidenceForm}
          layout="vertical"
          onFinish={(values: { name: string; url: string; type: string }) => {
            const { name, url, type } = values;
            if (modalMode === 'add') {
              const currentTags = indicator.evidenceTags || [];
              if (!currentTags.includes(name)) {
                onUpdateIndicatorEvidence?.(indicator.id, [...currentTags, name]);
              }
              updateCustomEvidenceDocument(name, {
                name,
                url,
                type: (type as any) || 'Google Drive',
              });
              const { domain, driveType } = classifyUrlDomain(url);
              onAddEvidence?.({
                id: `ev-drawer-${Date.now()}`,
                title: name,
                url,
                domain,
                driveType: (type as any) || driveType,
                foundInDoc: `Indikator ${indicator.code}`,
                indicatorId: indicator.id,
                indicatorCode: indicator.code,
                status: 'accessible',
              });
              message.success(`Tautan bukti "${name}" berhasil ditambahkan!`);
            } else if (editingTagName) {
              updateCustomEvidenceDocument(editingTagName, {
                name,
                url,
                type: (type as any) || 'Google Drive',
              });
              if (editingTagName !== name) {
                const currentTags = (indicator.evidenceTags || []).map(t => 
                  t === editingTagName ? name : t
                );
                onUpdateIndicatorEvidence?.(indicator.id, currentTags);
              }
              message.success(`Tautan bukti "${name}" berhasil diperbarui!`);
            }
            setEvidenceModalOpen(false);
          }}
        >
          <Form.Item
            name="name"
            label="Nama Dokumen Bukti"
            rules={[{ required: true, message: 'Harap isi nama dokumen!' }]}
          >
            <Input placeholder="Contoh: PDDikti Dosen / SK Tim Mutu SPMI" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Tautan URL Dokumen"
            rules={[
              { required: true, message: 'Harap isi URL!' },
              {
                validator: async (_, value) => {
                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    throw new Error('URL harus diawali dengan http:// atau https://');
                  }
                }
              }
            ]}
          >
            <Input 
              prefix={<LinkOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="https://pddikti.kemdiktisaintek.go.id/ atau https://drive.google.com/..." 
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Tipe Media"
            initialValue="Google Drive"
          >
            <Select
              options={[
                { label: 'SIM / Portal (PDDikti, SIAKAD, SPMI)', value: 'SIM / Portal' },
                { label: 'Google Drive', value: 'Google Drive' },
                { label: 'PDF Resmi', value: 'PDF' },
                { label: 'SK Rektor / SK Pimpinan', value: 'SK Rektor' },
                { label: 'External Repository / Jurnal', value: 'External Repository' },
                { label: 'OneDrive / SharePoint', value: 'OneDrive' },
              ]}
            />
          </Form.Item>

          <Flex justify="flex-end" gap="small" style={{ marginTop: 20 }}>
            <Button onClick={() => setEvidenceModalOpen(false)}>
              Batal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}
            >
              Simpan Tautan
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Drawer>
  );
};
