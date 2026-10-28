import React from 'react';
import { 
  Flex, 
  Space, 
  Select, 
  Input, 
  Button, 
  Tag, 
  Badge, 
  Typography, 
  Segmented, 
  Upload,
  Tooltip,
  theme 
} from 'antd';
import { 
  TrophyOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  PrinterOutlined, 
  SettingOutlined, 
  TableOutlined, 
  SafetyCertificateOutlined, 
  LinkOutlined, 
  TeamOutlined,
  EditOutlined,
  RobotOutlined,
  AuditOutlined,
  FileDoneOutlined,
  UserOutlined,
  CloudSyncOutlined,
  HistoryOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  LoginOutlined,
  IdcardOutlined,
  UploadOutlined,
  SyncOutlined,
  FileTextOutlined,
  FormOutlined,
  BookOutlined
} from '@ant-design/icons';
import { LamProfile, StudyProgramInfo } from '../types/accreditation';
import { AssessorLeadershipForm } from './AssessorLeadershipForm';
import { AssessorAccount } from '../data/dummyAssessors';

const { Text } = Typography;

// List of all 12 LAMs + BANPT as explicitly requested
export const ACCREDITATION_BODIES = [
  'LAMDIK',
];

export const DEGREE_LEVEL_OPTIONS = [
  { label: 'Sarjana (S1)', value: 'S1' },
  { label: 'Magister (S2)', value: 'S2' },
  { label: 'Doktor (S3)', value: 'S3' },
  { label: 'Profesi', value: 'Profesi' },
];

interface HeaderNavbarProps {
  currentLam: LamProfile;
  availableLams: LamProfile[];
  onSelectLam: (lamCode: string) => void;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  onChangeRole: (role: 'asesor1' | 'asesor2' | 'consensus') => void;
  activeTab: 'pintu_masuk_kuantitatif' | 'worksheet' | 'evidence' | 'syarat_unggul' | 'konsolidasi' | 'berita_acara_menu';
  onChangeTab: (tab: 'pintu_masuk_kuantitatif' | 'worksheet' | 'evidence' | 'syarat_unggul' | 'konsolidasi' | 'berita_acara_menu') => void;
  studyInfo: StudyProgramInfo;
  onChangeStudyProgramName: (name: string) => void;
  onChangeDegreeLevel: (level: string) => void;
  overallScore: number;
  finalRank: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI';
  isSyaratUnggulPassed: boolean;
  onOpenConfigModal: () => void;
  onOpenBeritaAcara: () => void;
  onOpenChatbot: () => void;
  systemRole: 'user' | 'admin';
  onChangeSystemRole: (role: 'user' | 'admin') => void;
  onUpdateStudyInfo?: (updated: Partial<StudyProgramInfo>) => void;
  onOpenBackupModal?: () => void;
  onOpenSupabaseModal?: () => void;
  activeAssessor?: AssessorAccount | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onUploadLkps?: (file: File) => Promise<void> | void;
  onUploadLed?: (file: File) => Promise<void> | void;
  onSyncAllData?: () => Promise<void> | void;
  lkpsUploaded?: boolean;
  lkpsFileName?: string | null;
  ledUploaded?: boolean;
  ledFileName?: string | null;
  isSyncing?: boolean;
  onUploadMatrikPenilaian?: (file: File) => Promise<void> | void;
  matrikUploaded?: boolean;
  matrikFileName?: string | null;
  matrikIndicatorCount?: number;
  onDownloadMatrikTemplate?: () => void;
  onOpenRemixGuide?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentLam,
  availableLams,
  onSelectLam,
  activeRole,
  onChangeRole,
  activeTab,
  onChangeTab,
  studyInfo,
  onChangeStudyProgramName,
  onChangeDegreeLevel,
  overallScore,
  finalRank,
  isSyaratUnggulPassed,
  onOpenConfigModal,
  onOpenBeritaAcara,
  onOpenChatbot,
  systemRole,
  onChangeSystemRole,
  onUpdateStudyInfo,
  onOpenBackupModal,
  onOpenSupabaseModal,
  activeAssessor,
  onOpenLoginModal,
  onLogout,
  onUploadLkps,
  onUploadLed,
  onSyncAllData,
  lkpsUploaded,
  lkpsFileName,
  ledUploaded,
  ledFileName,
  isSyncing,
  onUploadMatrikPenilaian,
  matrikUploaded,
  matrikFileName,
  matrikIndicatorCount,
  onDownloadMatrikTemplate,
  onOpenRemixGuide,
}) => {
  const { token } = theme.useToken();
  const [showPersonnelForm, setShowPersonnelForm] = React.useState(false);

  const rankColor = 
    finalRank.includes('UNGGUL') ? 'success' : 
    finalRank === 'TERAKREDITASI' ? 'warning' : 'error';

  return (
    <div 
      className="app-header-container"
      style={{ 
        backgroundColor: token.colorBgContainer, 
        borderBottom: `1px solid ${token.colorBorderSecondary}`, 
        padding: '10px 24px' 
      }}
    >
      {/* Top Banner: Application Title, Institution & Live Program Study Input */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ paddingBottom: 12, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Flex align="center" gap="middle" wrap="wrap">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: token.borderRadiusLG,
            backgroundColor: '#ffffff',
            border: `1px solid ${token.colorPrimaryBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <img 
              src="/logo_unpatti.png" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png";
              }}
              alt="Logo Universitas Pattimura" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <Space orientation="vertical" size={2}>
            <Space align="center" size="small" wrap>
              {/* Revised Application Name: Sistem Simulasi Akreditasi */}
              <Text strong style={{ fontSize: 14, letterSpacing: 0.3 }}>
                simak-lamdik
              </Text>
              <Tag color="success">LAMDIK (Kependidikan)</Tag>
            </Space>

            {/* Revised Institution: Universitas Pattimura with Editable Prodi & Jenjang Filter */}
            <Flex align="center" gap="small" wrap="wrap">
              <Text strong style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Universitas Pattimura
              </Text>
              <Text type="secondary">·</Text>
              
              {/* Field Isian Prodi */}
              <Input
                size="small"
                prefix={<EditOutlined style={{ color: token.colorTextPlaceholder }} />}
                value={studyInfo.studyProgramName}
                onChange={(e) => onChangeStudyProgramName(e.target.value)}
                placeholder="Isi Nama Program Studi..."
                style={{ width: 190, minWidth: 150, fontSize: 12 }}
              />

              {/* Filter Pilihan Jenjang: S1, S2, S3, Profesi */}
              <Select
                size="small"
                value={studyInfo.degreeLevel}
                onChange={onChangeDegreeLevel}
                style={{ width: 125 }}
                options={DEGREE_LEVEL_OPTIONS}
              />
            </Flex>
          </Space>
        </Flex>

        {/* Total Score & Accreditation Status Badges */}
        <Flex align="center" gap="small" wrap="wrap">
          <div style={{
            padding: '4px 12px',
            borderRadius: token.borderRadius,
            backgroundColor: token.colorBgElevated,
            border: `1px solid ${token.colorBorder}`,
          }}>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>Total Skor AL:</Text>
            <Text strong style={{ fontSize: 16, color: token.colorPrimary, fontFamily: 'monospace' }}>
              {overallScore.toFixed(1)} <span style={{ fontSize: 12, color: token.colorTextTertiary }}>/ 400</span>
            </Text>
          </div>

          <Tag 
            color={rankColor} 
            icon={isSyaratUnggulPassed ? <CheckCircleOutlined /> : <WarningOutlined />}
            style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Peringkat: {finalRank}
          </Tag>

          <Button 
            type="primary" 
            icon={<RobotOutlined />} 
            onClick={onOpenChatbot}
            style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 500 }}
          >
            Chatbot Gemini AI
          </Button>

          <Button 
            type="default" 
            icon={<PrinterOutlined />} 
            onClick={onOpenBeritaAcara}
            style={{ fontWeight: 500 }}
          >
            Cetak PDF
          </Button>

          {/* Tombol Backup / Restore JSON */}
          <Button
            type="dashed"
            icon={<CloudSyncOutlined style={{ color: '#06b6d4' }} />}
            onClick={onOpenBackupModal}
            style={{ fontWeight: 500, borderColor: '#06b6d4' }}
            title="Import & Export Backup JSON (Simpan / Pulihkan Progres Penilaian)"
          >
            Backup JSON
          </Button>

          {/* Menu Role untuk User dan Admin: Tersembunyi saat asesor login */}
          {!activeAssessor && (
            <Space size={4} style={{ backgroundColor: token.colorBgElevated, padding: '2px 8px', borderRadius: 8, border: `1px solid ${token.colorBorder}` }}>
              <Text style={{ fontSize: 11, color: token.colorTextSecondary, fontWeight: 600 }}>Role Sistem:</Text>
              <Segmented
                value={systemRole}
                onChange={(val) => {
                  const nextRole = val as 'user' | 'admin';
                  onChangeSystemRole(nextRole);
                  if (nextRole === 'user' && !activeAssessor && onOpenLoginModal) {
                    onOpenLoginModal();
                  }
                }}
                options={[
                  {
                    label: (
                      <Space size={4}>
                        <UserOutlined style={{ color: systemRole === 'user' ? '#10b981' : undefined }} />
                        <span>User Asesor</span>
                      </Space>
                    ),
                    value: 'user',
                  },
                  {
                    label: (
                      <Space size={4}>
                        <SafetyCertificateOutlined style={{ color: systemRole === 'admin' ? '#ec4899' : undefined }} />
                        <span>Admin</span>
                      </Space>
                    ),
                    value: 'admin',
                  },
                ]}
              />
            </Space>
          )}

          {/* Badge Khusus jika masuk mode Admin */}
          {systemRole === 'admin' && !activeAssessor && (
            <Tag color="magenta" icon={<SafetyCertificateOutlined />} style={{ fontWeight: 700, margin: 0, padding: '3px 8px' }}>
              Mode Administrator
            </Tag>
          )}

          {/* Tombol Koneksi Cloud Firebase & Auth */}
          <Button
            type="primary"
            icon={<DatabaseOutlined style={{ color: '#ffffff' }} />}
            onClick={onOpenSupabaseModal}
            style={{
              backgroundColor: '#10b981',
              borderColor: '#059669',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
            }}
            title="Koneksi Cloud Firebase &amp; Auth (Simpan / Muat Progres Asesmen)"
          >
            Cloud Firebase
          </Button>

          {/* User / Asesor Session Profile Card */}
          {activeAssessor ? (
            <Space
              size={6}
              style={{
                backgroundColor: token.colorBgElevated,
                padding: '3px 10px',
                borderRadius: 8,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <IdcardOutlined style={{ color: '#818cf8', fontSize: 16 }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: token.colorText }}>
                  {activeAssessor.fullName.length > 20
                    ? `${activeAssessor.fullName.slice(0, 18)}...`
                    : activeAssessor.fullName}
                </div>
                <div style={{ fontSize: 10, color: token.colorTextSecondary, fontFamily: 'monospace' }}>
                  {activeAssessor.assessorNumber} ({activeAssessor.assignedLam})
                </div>
              </div>
              {onLogout && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={onLogout}
                  title="Keluar / Ganti Akun Asesor"
                  style={{ marginLeft: 2 }}
                />
              )}
            </Space>
          ) : (
            onOpenLoginModal && (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={onOpenLoginModal}
                style={{
                  background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
                  borderColor: '#6366f1',
                  fontWeight: 600,
                }}
              >
                Login Asesor
              </Button>
            )
          )}
        </Flex>
      </Flex>

      {/* Navigation Bar: Filter 12 LAM + BANPT, Tab Views, Assessor Mode, Settings */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle" style={{ paddingTop: 10 }}>
        {/* Lembaga Akreditasi Filter with 12 LAM + BANPT */}
        <Space size="small" align="center" wrap>
          <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
            Lembaga Akreditasi:
          </Text>
          <Select
            value={currentLam.lamCode}
            onChange={onSelectLam}
            style={{ width: 180 }}
            options={ACCREDITATION_BODIES.map(code => ({
              label: code,
              value: code,
            }))}
          />
          {/* Hyperlink Upload LKPS & LED + Tombol Sinkron */}
          <Space size={6} align="center" wrap>
            {/* Upload LKPS (.xlsx) */}
            <Upload
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadLkps?.(file);
                return false;
              }}
            >
              <Tooltip 
                title={
                  lkpsUploaded 
                    ? `Berkas: ${lkpsFileName || 'Tersedia'} (Complete). Klik untuk unggah ulang .xlsx` 
                    : `Klik (Hyperlink) untuk Unggah Berkas ${currentLam.docTerms.quantitativeDoc || 'LKPS'} (.xlsx)`
                }
              >
                <Tag 
                  color={lkpsUploaded ? 'success' : 'geekblue'}
                  icon={lkpsUploaded ? <CheckCircleOutlined /> : <UploadOutlined />}
                  style={{
                    cursor: 'pointer',
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    margin: 0,
                    border: lkpsUploaded ? '1px solid #10b981' : undefined,
                    boxShadow: lkpsUploaded ? '0 0 8px rgba(16, 185, 129, 0.3)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {currentLam.docTerms.quantitativeDoc || 'LKPS'} {lkpsUploaded ? '(Complete)' : ''}
                </Tag>
              </Tooltip>
            </Upload>

            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700 }}>&</Text>

            {/* Upload LED (.docx / .pdf) */}
            <Upload
              accept=".docx,.doc,.pdf,.txt"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadLed?.(file);
                return false;
              }}
            >
              <Tooltip 
                title={
                  ledUploaded 
                    ? `Berkas: ${ledFileName || 'Tersedia'} (Complete). Klik untuk unggah ulang .docx/.pdf` 
                    : `Klik (Hyperlink) untuk Unggah Berkas ${currentLam.docTerms.qualitativeDoc || 'LED'} (.pdf / .docx)`
                }
              >
                <Tag 
                  color={ledUploaded ? 'success' : 'purple'}
                  icon={ledUploaded ? <CheckCircleOutlined /> : <FileTextOutlined />}
                  style={{
                    cursor: 'pointer',
                    padding: '3px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    margin: 0,
                    border: ledUploaded ? '1px solid #10b981' : undefined,
                    boxShadow: ledUploaded ? '0 0 8px rgba(16, 185, 129, 0.3)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {currentLam.docTerms.qualitativeDoc || 'LED'} {ledUploaded ? '(Complete)' : ''}
                </Tag>
              </Tooltip>
            </Upload>

            {/* Tombol Upload Matrik Penilaian (Tepat di Kiri Tombol Sinkron) */}
            <Upload
              accept=".xlsx,.xls,.csv,.json"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadMatrikPenilaian?.(file);
                return false;
              }}
            >
              <Tooltip 
                title={
                  matrikUploaded 
                    ? `Berkas: ${matrikFileName || 'Matrik Penilaian'} (Complete, ${matrikIndicatorCount || 64} indikator terpetakan). Klik untuk unggah ulang.` 
                    : `Klik untuk Unggah Berkas Matrik Penilaian Akreditasi (.xlsx / .xls / .json / .csv) untuk memuat indikator, bobot, & rubrik instan`
                }
              >
                <Button
                  type={matrikUploaded ? 'primary' : 'default'}
                  size="small"
                  icon={matrikUploaded ? <CheckCircleOutlined /> : <TableOutlined style={{ color: matrikUploaded ? undefined : '#0284c7' }} />}
                  style={{
                    backgroundColor: matrikUploaded ? '#0284c7' : '#f0f9ff',
                    borderColor: matrikUploaded ? '#0284c7' : '#38bdf8',
                    color: matrikUploaded ? '#ffffff' : '#0369a1',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 26,
                    padding: '0 10px',
                    borderRadius: 6,
                    boxShadow: matrikUploaded ? '0 2px 6px rgba(2, 132, 199, 0.35)' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {matrikUploaded ? `Matrik Penilaian (Complete)` : `Upload Matrik Penilaian`}
                </Button>
              </Tooltip>
            </Upload>

            {/* Quick Action: Unduh Format Template Matriks jika tersedia */}
            {onDownloadMatrikTemplate && (
              <Tooltip title="Unduh Format Template Matrik Penilaian (.xlsx) untuk diisi offline">
                <Button
                  type="text"
                  size="small"
                  icon={<FileDoneOutlined style={{ color: '#0284c7', fontSize: 13 }} />}
                  onClick={onDownloadMatrikTemplate}
                  style={{ padding: '0 4px', height: 26 }}
                />
              </Tooltip>
            )}

            {/* Tombol Sinkron di sebelah kanan */}
            <Tooltip title="Klik untuk memperbarui seluruh data lama di aplikasi & melakukan simulasi penghitungan otomatis Total Skor AL & Skor LED/LKPS">
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin={isSyncing} />}
                loading={isSyncing}
                onClick={onSyncAllData}
                style={{
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  fontWeight: 600,
                  fontSize: 12,
                  height: 26,
                  padding: '0 12px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                }}
              >
                Sinkron
              </Button>
            </Tooltip>
          </Space>
        </Space>

        {/* View Switcher Tabs */}
        <Segmented
          value={activeTab}
          onChange={(val) => onChangeTab(val as any)}
          options={[

            {
              label: (
                <Space size={6}>
                  <TableOutlined />
                  <span>Kertas Kerja</span>
                </Space>
              ),
              value: 'worksheet',
            },
            {
              label: (
                <Space size={6}>
                  <SafetyCertificateOutlined />
                  <span>Syarat Unggul</span>
                  <Badge count={currentLam.syaratUnggulRules.length} style={{ backgroundColor: token.colorPrimary }} />
                </Space>
              ),
              value: 'syarat_unggul',
            },
            {
              label: (
                <Space size={6}>
                  <LinkOutlined />
                  <span>Live Evidence</span>
                </Space>
              ),
              value: 'evidence',
            },
            {
              label: (
                <Space size={6}>
                  <TeamOutlined />
                  <span>Konsolidasi</span>
                </Space>
              ),
              value: 'konsolidasi',
            },
            {
              label: (
                <Space size={6}>
                  <AuditOutlined style={{ color: token.colorPrimary }} />
                  <span>Berita Acara AL & Lampiran</span>
                </Space>
              ),
              value: 'berita_acara_menu',
            },
          ]}
        />

        {/* Assessor Role & Config */}
        <Space size="middle" align="center">
          <Space orientation="vertical" size={2} align="end">
            <Segmented
              value={activeRole}
              onChange={(val) => onChangeRole(val as any)}
              options={[
                { label: 'Asesor 1', value: 'asesor1' },
                { label: 'Asesor 2', value: 'asesor2' },
                { label: 'Konsensus AL', value: 'consensus' },
              ]}
            />
            {/* Tempat di bawah Asesor 1 & Asesor 2 serta Konsensus AL */}
            <Button
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => setShowPersonnelForm(!showPersonnelForm)}
              style={{ fontSize: 11, padding: 0, height: 'auto', color: token.colorPrimary }}
            >
              {showPersonnelForm ? '▲ Tutup Form Personil' : '▼ Form Isian: Asesor 1, Asesor 2, UPPS'}
            </Button>
          </Space>

          <Tooltip title="Panduan Remix Aplikasi ke LAMDIK">
            <Button
              icon={<BookOutlined style={{ color: '#10b981' }} />}
              onClick={onOpenRemixGuide}
              style={{ borderColor: '#10b981', color: '#10b981' }}
            />
          </Tooltip>

          <Button
            icon={<SettingOutlined />}
            onClick={onOpenConfigModal}
            title="Konfigurasi Profil LAM & Rumus"
          />
        </Space>
      </Flex>

      {/* Form Isian Expandable di bawah Asesor 1 & Asesor 2 serta Konsensus AL */}
      {showPersonnelForm && (
        <div style={{ marginTop: 12 }}>
          <AssessorLeadershipForm
            studyInfo={studyInfo}
            onUpdateStudyInfo={onUpdateStudyInfo || (() => {})}
            compact
          />
        </div>
      )}
    </div>
  );
};
