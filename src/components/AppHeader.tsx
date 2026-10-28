import React from 'react';
import { Flex, Space, Select, Input, Button, Tag, Typography, Segmented, Tooltip, theme } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  PrinterOutlined, 
  SettingOutlined, 
  SafetyCertificateOutlined, 
  CloudSyncOutlined, 
  UserOutlined, 
  DatabaseOutlined, 
  LogoutOutlined, 
  LoginOutlined, 
  IdcardOutlined,
  RobotOutlined,
  EditOutlined,
  BookOutlined
} from '@ant-design/icons';
import { LamProfile, StudyProgramInfo } from '../types/accreditation';
import { AssessorAccount } from '../data/dummyAssessors';

const { Text } = Typography;

export const DEGREE_LEVEL_OPTIONS = [
  { label: 'Sarjana (S1)', value: 'S1' },
  { label: 'Magister (S2)', value: 'S2' },
  { label: 'Doktor (S3)', value: 'S3' },
  { label: 'Profesi', value: 'Profesi' },
];

interface AppHeaderProps {
  currentLam: LamProfile;
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
  onOpenBackupModal?: () => void;
  onOpenSupabaseModal?: () => void;
  activeAssessor?: AssessorAccount | null;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenRemixGuide?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentLam,
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
  onOpenBackupModal,
  onOpenSupabaseModal,
  activeAssessor,
  onOpenLoginModal,
  onLogout,
  onOpenRemixGuide,
}) => {
  const { token } = theme.useToken();

  const rankColor = 
    finalRank.includes('UNGGUL') ? 'success' : 
    finalRank === 'TERAKREDITASI' ? 'warning' : 'error';

  return (
    <div 
      style={{ 
        backgroundColor: '#CC00CC', 
        borderBottom: `1px solid rgba(255, 255, 255, 0.2)`, 
        padding: '12px 24px',
        color: '#ffffff',
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        {/* Left: Logo & University / Prodi */}
        <Flex align="center" gap="middle" wrap="wrap">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: token.borderRadiusLG,
            backgroundColor: '#ffffff',
            border: `1px solid #ffffff`,
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
              <Text strong style={{ fontSize: 15, color: '#ffffff', letterSpacing: 0.3 }}>
                SIMAK-LAMDIK
              </Text>
              <Tag color="cyan" style={{ fontWeight: 700 }}>LAMDIK 3.0</Tag>
            </Space>

            <Flex align="center" gap="small" wrap="wrap">
              <Text strong style={{ fontSize: 13, color: '#f3e8ff' }}>
                Universitas Pattimura
              </Text>
              <Text style={{ color: '#f3e8ff' }}>·</Text>
              
              <Input
                size="small"
                prefix={<EditOutlined style={{ color: '#64748b' }} />}
                value={studyInfo.studyProgramName}
                onChange={(e) => onChangeStudyProgramName(e.target.value)}
                placeholder="Isi Nama Program Studi..."
                style={{ width: 190, minWidth: 150, fontSize: 12, backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}
              />

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

        {/* Right: Score, Status Badges & Quick Actions */}
        <Flex align="center" gap="small" wrap="wrap">
          <div style={{
            padding: '4px 12px',
            borderRadius: token.borderRadius,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: `1px solid rgba(255, 255, 255, 0.3)`,
          }}>
            <Text style={{ fontSize: 12, marginRight: 8, color: '#f3e8ff' }}>Total Skor AL:</Text>
            <Text strong style={{ fontSize: 16, color: '#ffffff', fontFamily: 'monospace' }}>
              {overallScore.toFixed(1)} <span style={{ fontSize: 12, color: '#e2e8f0' }}>/ 400</span>
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
            style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600, color: '#fff' }}
          >
            Chatbot AI
          </Button>

          <Button 
            type="default" 
            icon={<PrinterOutlined />} 
            onClick={onOpenBeritaAcara}
            style={{ fontWeight: 600, backgroundColor: '#ffffff', borderColor: '#ffffff', color: '#701a75' }}
          >
            Cetak PDF
          </Button>

          <Button
            type="dashed"
            icon={<CloudSyncOutlined style={{ color: '#06b6d4' }} />}
            onClick={onOpenBackupModal}
            style={{ fontWeight: 600, borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
            title="Import & Export Backup JSON"
          >
            Backup JSON
          </Button>

          {!activeAssessor && (
            <Space size={4} style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: 600 }}>Role:</Text>
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
                  { label: 'Asesor', value: 'user' },
                  { label: 'Admin', value: 'admin' },
                ]}
              />
            </Space>
          )}

          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={onOpenSupabaseModal}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
          >
            Cloud Firebase
          </Button>

          {activeAssessor ? (
            <Space
              size={6}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '3px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <IdcardOutlined style={{ color: '#ffffff', fontSize: 16 }} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                  {activeAssessor.fullName.length > 18 ? `${activeAssessor.fullName.slice(0, 16)}...` : activeAssessor.fullName}
                </div>
                <div style={{ fontSize: 10, color: '#f3e8ff', fontFamily: 'monospace' }}>
                  {activeAssessor.assessorNumber}
                </div>
              </div>
              {onLogout && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={onLogout}
                  title="Keluar"
                  style={{ color: '#fca5a5' }}
                />
              )}
            </Space>
          ) : (
            onOpenLoginModal && (
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={onOpenLoginModal}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
              >
                Login Asesor
              </Button>
            )
          )}

          <Tooltip title="Panduan Remix Aplikasi">
            <Button
              icon={<BookOutlined style={{ color: '#ffffff' }} />}
              onClick={onOpenRemixGuide}
              style={{ borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.2)' }}
            />
          </Tooltip>

          <Button
            icon={<SettingOutlined />}
            onClick={onOpenConfigModal}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#ffffff', color: '#fff' }}
            title="Konfigurasi Profil LAM"
          />
        </Flex>
      </Flex>
    </div>
  );
};
