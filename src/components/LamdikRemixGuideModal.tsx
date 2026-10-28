import React from 'react';
import { Modal, Typography, Steps, Card, Tag, Divider, Space, Alert } from 'antd';
import { BookOutlined, CodeOutlined, SettingOutlined, CheckCircleFilled, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface LamdikRemixGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LamdikRemixGuideModal: React.FC<LamdikRemixGuideModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      title={
        <Space size={8}>
          <BookOutlined style={{ color: '#10b981', fontSize: 20 }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Panduan Step-by-Step Penyesuaian ke SIMAK-LAMDIK 3.0</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '20px 24px' } }}
    >
      <Alert
        type="success"
        showIcon
        message="Aplikasi Terkonversi Penuh ke SIMAK-LAMDIK (IAPSK 3.0)"
        description="Sistem Simulasi Akreditasi ini telah disesuaikan dengan regulasi LAMDIK 3.0, mencakup 9 Kriteria standar APS Kependidikan, program studi kependidikan, formula Gatekeeper Syarat Perlu Unggul, dan Kop Surat resmi Berita Acara Asesmen Lapangan."
        style={{ marginBottom: 20, backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
      />

      <Steps
        direction="vertical"
        current={-1}
        items={[
          {
            title: <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>Langkah 1: Penyesuaian Profil Lembaga (`INITIAL_LAM_PROFILES`)</span>,
            description: (
              <div style={{ marginTop: 8, color: '#94a3b8' }}>
                <Paragraph style={{ color: '#cbd5e1' }}>
                  Konfigurasi profil lembaga pada berkas <Text code style={{ color: '#38bdf8' }}>src/data/lamProfiles.ts</Text> diubah menjadi <Text strong style={{ color: '#34d399' }}>LAMDIK</Text> dengan 9 Kriteria standar Akreditasi Program Studi Kependidikan (IAPSK 3.0):
                </Paragraph>
                <div style={{ backgroundColor: '#090d16', padding: 12, borderRadius: 8, border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: 12, color: '#a7f3d0' }}>
                  {`export const INITIAL_LAM_PROFILES: Record<string, LamProfile> = {
  'LAMDIK': {
    lamCode: 'LAMDIK',
    lamName: 'Lembaga Akreditasi Mandiri Kependidikan',
    totalIndicators: 59,
    thresholdUnggul: 361,
    docTerms: { quantitativeDoc: 'LKPS', qualitativeDoc: 'LED' }
  }
};`}
                </div>
              </div>
            ),
          },
          {
            title: <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>Langkah 2: Penyesuaian Registry Program Studi (`LAMPTIP_PRODI_REGISTRY`)</span>,
            description: (
              <div style={{ marginTop: 8, color: '#94a3b8' }}>
                <Paragraph style={{ color: '#cbd5e1' }}>
                  Registry program studi pada <Text code style={{ color: '#38bdf8' }}>src/data/lamPtipProdiRegistry.ts</Text> memuat daftar program studi kependidikan unggulan:
                </Paragraph>
                <div style={{ backgroundColor: '#090d16', padding: 12, borderRadius: 8, border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>
                  {`export const LAMPTIP_PRODI_REGISTRY: ProdiRegistryItem[] = [
  { kodeProdi: '86206', namaProgramStudi: 'S1 Pendidikan Guru Sekolah Dasar (PGSD)', fakultas: 'FKIP', jenjang: 'S1' },
  { kodeProdi: '86207', namaProgramStudi: 'S1 Pendidikan Guru PAUD (PGPAUD)', fakultas: 'FKIP', jenjang: 'S1' },
  { kodeProdi: '84002', namaProgramStudi: 'S1 Pendidikan Matematika', fakultas: 'FKIP', jenjang: 'S1' },
  { kodeProdi: '88203', namaProgramStudi: 'S1 Pendidikan Bahasa Inggris', fakultas: 'FKIP', jenjang: 'S1' },
  { kodeProdi: '86131', namaProgramStudi: 'S2 Manajemen Pendidikan', fakultas: 'Pascasarjana', jenjang: 'S2' },
  { kodeProdi: '86904', namaProgramStudi: 'Program Profesi Guru (PPG)', fakultas: 'FKIP', jenjang: 'Profesi' }
];`}
                </div>
              </div>
            ),
          },
          {
            title: <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>Langkah 3: Logika Evaluasi Syarat Perlu Unggul & Pembobotan TNA (`mathEngine.ts`)</span>,
            description: (
              <div style={{ marginTop: 8, color: '#94a3b8' }}>
                <Paragraph style={{ color: '#cbd5e1' }}>
                  Implementasi rumus kumulatif nilai akreditasi (<Text code style={{ color: '#38bdf8' }}>NA ≥ 361</Text> untuk status Unggul 5 tahun) dan Gatekeeper Syarat Perlu Unggul (kualitas DTPS S3/Doktor, Kurikulum OBE, Microteaching, SPMI PPEPP, dan Publikasi DTPS) di <Text code style={{ color: '#38bdf8' }}>src/utils/mathEngine.ts</Text>.
                </Paragraph>
              </div>
            ),
          },
          {
            title: <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>Langkah 4: Pembaruan Kop Surat, Logo & Berita Acara Asesmen Lapangan</span>,
            description: (
              <div style={{ marginTop: 8, color: '#94a3b8' }}>
                <Paragraph style={{ color: '#cbd5e1' }}>
                  Kop surat dan dokumen Berita Acara Asesmen Lapangan pada <Text code style={{ color: '#38bdf8' }}>src/components/BeritaAcaraPrintView.tsx</Text> otomatis menampilkan identitas <Text strong style={{ color: '#ffffff' }}>LEMBAGA AKREDITASI MANDIRI KEPENDIDIKAN (LAMDIK)</Text> lengkap dengan logo resmi dan ekspor PDF berbasis jsPDF.
                </Paragraph>
              </div>
            ),
          },
        ]}
      />

      <Divider style={{ borderColor: '#334155', margin: '20px 0' }} />

      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tutup Panduan
        </button>
      </div>
    </Modal>
  );
};
