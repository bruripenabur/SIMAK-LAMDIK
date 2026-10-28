import React, { useRef, useState } from 'react';
import { 
  Modal, 
  Button, 
  Space, 
  Typography, 
  Upload, 
  message, 
  Tag, 
  Alert, 
  Card, 
  Row, 
  Col, 
  Divider,
  Radio,
  Tooltip
} from 'antd';
import { 
  DownloadOutlined, 
  UploadOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  CloudDownloadOutlined, 
  CloudUploadOutlined, 
  HistoryOutlined, 
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  AssessmentRecord, 
  EvidenceLink, 
  LamProfile, 
  StudyProgramInfo 
} from '../types/accreditation';

const { Title, Text, Paragraph } = Typography;

export interface AssessmentBackupPayload {
  version: string;
  exportedAt: string;
  appTitle: string;
  institution: string;
  currentLamCode: string;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  studyPrograms: Record<string, StudyProgramInfo>;
  allAssessments: Record<string, Record<string, AssessmentRecord>>;
  globalVariables: Record<string, number>;
  evidenceLists: Record<string, EvidenceLink[]>;
}

interface AssessmentImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLamCode: string;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  studyPrograms: Record<string, StudyProgramInfo>;
  allAssessments: Record<string, Record<string, AssessmentRecord>>;
  globalVariables: Record<string, number>;
  evidenceLists: Record<string, EvidenceLink[]>;
  onImportSuccess: (data: AssessmentBackupPayload) => void;
}

export const AssessmentImportExportModal: React.FC<AssessmentImportExportModalProps> = ({
  isOpen,
  onClose,
  currentLamCode,
  activeRole,
  studyPrograms,
  allAssessments,
  globalVariables,
  evidenceLists,
  onImportSuccess,
}) => {
  const [selectedScope, setSelectedScope] = useState<'all' | 'current'>('all');
  const [importedPreview, setImportedPreview] = useState<AssessmentBackupPayload | null>(null);
  const [importSummary, setImportSummary] = useState<{
    totalRecords: number;
    targetLam: string;
    programName: string;
    date: string;
  } | null>(null);

  // Build JSON export
  const handleExportJSON = () => {
    try {
      const payload: AssessmentBackupPayload = {
        version: '2.0-unpatti-multilam',
        exportedAt: new Date().toISOString(),
        appTitle: 'APLIKASI SIMULASI AKREDITASI BAN-PT & LAM',
        institution: 'Universitas Pattimura',
        currentLamCode,
        activeRole,
        studyPrograms: selectedScope === 'all' 
          ? studyPrograms 
          : { [currentLamCode]: studyPrograms[currentLamCode] },
        allAssessments: selectedScope === 'all'
          ? allAssessments
          : { [currentLamCode]: allAssessments[currentLamCode] || {} },
        globalVariables,
        evidenceLists: selectedScope === 'all'
          ? evidenceLists
          : { [currentLamCode]: evidenceLists[currentLamCode] || [] },
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const prodiName = studyPrograms[currentLamCode]?.studyProgramName || 'Prodi';
      const cleanProdi = prodiName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanLam = currentLamCode.replace(/\s+/g, '_');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `AKREDITASI_${cleanLam}_${cleanProdi}_${timestamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success({
        content: `Berhasil mengekspor backup penilaian: ${filename}`,
        key: 'exportSuccess',
        duration: 3,
      });
    } catch (err: any) {
      message.error(`Gagal mengekspor data: ${err.message || 'Kesalahan sistem'}`);
    }
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AssessmentBackupPayload;

        if (!parsed.allAssessments || !parsed.studyPrograms) {
          throw new Error('Format file backup tidak valid. Objek data penilaian atau prodi tidak ditemukan.');
        }

        // Count assessment items
        let totalCount = 0;
        Object.values(parsed.allAssessments).forEach(recs => {
          totalCount += Object.keys(recs || {}).length;
        });

        const targetProdi = parsed.studyPrograms[parsed.currentLamCode || currentLamCode]?.studyProgramName || 'Prodi Terkait';

        setImportedPreview(parsed);
        setImportSummary({
          totalRecords: totalCount,
          targetLam: parsed.currentLamCode || currentLamCode,
          programName: targetProdi,
          date: parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('id-ID') : 'Tidak tercatat',
        });

        message.success('File backup berhasil dibaca dan valid. Silakan klik "Terapkan Restore" di bawah.');
      } catch (err: any) {
        message.error(`Gagal membaca file: ${err.message || 'Format JSON tidak valid'}`);
      }
    };
    reader.readAsText(file);
    return false; // prevent automatic HTTP upload
  };

  const handleApplyImport = () => {
    if (!importedPreview) return;
    onImportSuccess(importedPreview);
    message.success({
      content: 'Progres penilaian dan personil berhasil dipulihkan secara penuh!',
      key: 'importApplied',
      duration: 3,
    });
    setImportedPreview(null);
    setImportSummary(null);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        setImportedPreview(null);
        setImportSummary(null);
        onClose();
      }}
      title={
        <Space>
          <HistoryOutlined style={{ color: '#10b981', fontSize: 20 }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>Import & Export Backup Progres Akreditasi (JSON)</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              Simpan seluruh isian skor, rumus kuantitatif, catatan temuan, bukti live, & personil secara aman ke komputer lokal
            </Text>
          </div>
        </Space>
      }
      width={720}
      footer={null}
    >
      <div style={{ padding: '8px 0' }}>
        <Row gutter={[16, 16]}>
          {/* Card Export */}
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  <CloudDownloadOutlined style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 600 }}>Ekspor / Backup Data (.JSON)</span>
                </Space>
              }
              style={{ height: '100%', borderColor: '#10b981' }}
            >
              <Paragraph style={{ fontSize: 12, color: '#94a3b8' }}>
                Unduh seluruh progres penilaian saat ini ke file JSON. Anda dapat menyimpannya sebagai arsip atau melanjutkannya di laptop / browser lain kapan saja.
              </Paragraph>

              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                  Cakupan Backup Data:
                </Text>
                <Radio.Group 
                  value={selectedScope} 
                  onChange={(e) => setSelectedScope(e.target.value)}
                  size="small"
                >
                  <Space orientation="vertical">
                    <Radio value="all">
                      <Text style={{ fontSize: 12 }}>Seluruh 12 LAM + BAN-PT (Lengkap)</Text>
                    </Radio>
                    <Radio value="current">
                      <Text style={{ fontSize: 12 }}>Khusus Instrumen Aktif ({currentLamCode})</Text>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: 6, marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  ✓ Skor Asesor 1, Asesor 2, & Konsensus<br />
                  ✓ Isian Angka Rumus Kuantitatif & Variabel<br />
                  ✓ Catatan Temuan & Rekomendasi<br />
                  ✓ Tautan Live Evidence & Dokumen LKPS/LED<br />
                  ✓ Nama Personil Asesor & Pimpinan UPPS
                </Text>
              </div>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                block
                onClick={handleExportJSON}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
              >
                Unduh File Backup JSON
              </Button>
            </Card>
          </Col>

          {/* Card Import */}
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  <CloudUploadOutlined style={{ color: '#06b6d4' }} />
                  <span style={{ fontWeight: 600 }}>Impor / Pulihkan Data (.JSON)</span>
                </Space>
              }
              style={{ height: '100%', borderColor: '#06b6d4' }}
            >
              <Paragraph style={{ fontSize: 12, color: '#94a3b8' }}>
                Muat kembali file JSON yang pernah Anda unduh sebelumnya. Sistem akan mengembalikan seluruh kertas kerja dan personil secara instan.
              </Paragraph>

              <Upload.Dragger
                accept=".json,application/json"
                showUploadList={false}
                beforeUpload={handleFileUpload}
                style={{ padding: '16px 8px', marginBottom: 12 }}
              >
                <p className="ant-upload-drag-icon" style={{ margin: '0 0 8px' }}>
                  <UploadOutlined style={{ fontSize: 24, color: '#06b6d4' }} />
                </p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>
                  Klik atau Seret file JSON ke sini
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                  Hanya mendukung format .json backup akreditasi
                </p>
              </Upload.Dragger>

              {importSummary && (
                <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 12, color: '#06b6d4', display: 'block', marginBottom: 4 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} /> Ringkasan File Terbaca:
                  </Text>
                  <Text style={{ fontSize: 11, display: 'block' }}>
                    • Instrumen: <b>{importSummary.targetLam}</b><br />
                    • Program Studi: <b>{importSummary.programName}</b><br />
                    • Total Item Indikator: <b>{importSummary.totalRecords} record</b><br />
                    • Waktu Backup: {importSummary.date}
                  </Text>
                </div>
              )}

              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                block
                disabled={!importedPreview}
                onClick={handleApplyImport}
                style={{ backgroundColor: '#06b6d4', borderColor: '#06b6d4', fontWeight: 600 }}
              >
                Terapkan Restore ke Aplikasi
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0 12px' }} />

        <Alert
          type="info"
          showIcon
          title="Penyimpanan Lokal & Privasi Data"
          description="Seluruh data backup disimpan langsung di perangkat komputer Anda dan tidak diunggah ke server eksternal, menjamin kerahasiaan dokumen asesmen dan temuan akreditasi."
          style={{ fontSize: 12 }}
        />
      </div>
    </Modal>
  );
};
