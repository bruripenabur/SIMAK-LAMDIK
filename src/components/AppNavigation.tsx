import React from 'react';
import { Flex, Space, Select, Button, Tag, Typography, Upload, Tooltip, theme } from 'antd';
import { 
  CheckCircleOutlined, 
  UploadOutlined, 
  TableOutlined, 
  FileTextOutlined, 
  SyncOutlined, 
  FileDoneOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { LamProfile, StudyProgramInfo } from '../types/accreditation';
import { AssessorLeadershipForm } from './AssessorLeadershipForm';

const { Text } = Typography;

export const ACCREDITATION_BODIES = ['LAMDIK'];

interface AppNavigationProps {
  currentLam: LamProfile;
  availableLams: LamProfile[];
  onSelectLam: (lamCode: string) => void;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  onChangeRole: (role: 'asesor1' | 'asesor2' | 'consensus') => void;
  studyInfo: StudyProgramInfo;
  onUpdateStudyInfo: (updated: Partial<StudyProgramInfo>) => void;
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
}

export const AppNavigation: React.FC<AppNavigationProps> = ({
  currentLam,
  availableLams,
  onSelectLam,
  activeRole,
  onChangeRole,
  studyInfo,
  onUpdateStudyInfo,
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
}) => {
  const { token } = theme.useToken();
  const [showPersonnelForm, setShowPersonnelForm] = React.useState(false);

  return (
    <div 
      style={{ 
        backgroundColor: '#CC00CC', 
        borderBottom: `1px solid rgba(255, 255, 255, 0.2)`, 
        padding: '10px 24px',
        color: '#ffffff',
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        {/* Left: LAM Selector & Document Uploads & Sync */}
        <Space size="middle" align="center" wrap>
          <Space size="small" align="center">
            <Text strong style={{ fontSize: 12, color: '#f3e8ff' }}>
              Lembaga Akreditasi:
            </Text>
            <Select
              value={currentLam.lamCode}
              onChange={onSelectLam}
              style={{ width: 160 }}
              options={ACCREDITATION_BODIES.map(code => ({ label: code, value: code }))}
            />
          </Space>

          <Space size={6} align="center" wrap>
            {/* Upload LKPS */}
            <Upload
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadLkps?.(file);
                return false;
              }}
            >
              <Tooltip title={lkpsUploaded ? `Berkas: ${lkpsFileName || 'Tersedia'} (Complete)` : `Unggah LKPS (.xlsx)`}>
                <Tag 
                  color={lkpsUploaded ? 'success' : 'geekblue'}
                  icon={lkpsUploaded ? <CheckCircleOutlined /> : <UploadOutlined />}
                  style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, margin: 0 }}
                >
                  {currentLam.docTerms.quantitativeDoc || 'LKPS'} {lkpsUploaded ? '(Complete)' : ''}
                </Tag>
              </Tooltip>
            </Upload>

            <Text style={{ fontSize: 11, fontWeight: 700, color: '#f3e8ff' }}>&</Text>

            {/* Upload LED */}
            <Upload
              accept=".docx,.doc,.pdf,.txt"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadLed?.(file);
                return false;
              }}
            >
              <Tooltip title={ledUploaded ? `Berkas: ${ledFileName || 'Tersedia'} (Complete)` : `Unggah LED (.pdf / .docx)`}>
                <Tag 
                  color={ledUploaded ? 'success' : 'purple'}
                  icon={ledUploaded ? <CheckCircleOutlined /> : <FileTextOutlined />}
                  style={{ cursor: 'pointer', padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, margin: 0 }}
                >
                  {currentLam.docTerms.qualitativeDoc || 'LED'} {ledUploaded ? '(Complete)' : ''}
                </Tag>
              </Tooltip>
            </Upload>

            {/* Upload Matrik Penilaian */}
            <Upload
              accept=".xlsx,.xls,.csv,.json"
              showUploadList={false}
              beforeUpload={(file) => {
                onUploadMatrikPenilaian?.(file);
                return false;
              }}
            >
              <Button
                type={matrikUploaded ? 'primary' : 'default'}
                size="small"
                icon={matrikUploaded ? <CheckCircleOutlined /> : <TableOutlined />}
                style={{
                  backgroundColor: matrikUploaded ? '#0284c7' : '#ffffff',
                  borderColor: matrikUploaded ? '#0284c7' : '#ffffff',
                  color: matrikUploaded ? '#ffffff' : '#701a75',
                  fontWeight: 600,
                  fontSize: 12,
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 6,
                }}
              >
                {matrikUploaded ? `Matrik Penilaian (Complete)` : `Upload Matrik`}
              </Button>
            </Upload>

            {onDownloadMatrikTemplate && (
              <Tooltip title="Unduh Template Matrik Penilaian (.xlsx)">
                <Button
                  type="text"
                  size="small"
                  icon={<FileDoneOutlined style={{ color: '#ffffff', fontSize: 14 }} />}
                  onClick={onDownloadMatrikTemplate}
                  style={{ height: 28 }}
                />
              </Tooltip>
            )}

            <Tooltip title="Sinkronisasi & Simulasi Perhitungan Otomatis">
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin={isSyncing} />}
                loading={isSyncing}
                onClick={onSyncAllData}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600, height: 28, padding: '0 14px', color: '#fff' }}
              >
                Sinkron
              </Button>
            </Tooltip>
          </Space>
        </Space>

        {/* Right: Assessor Role Switcher */}
        <Space size="middle" align="center">
          <Space orientation="vertical" size={2} align="end">
            <Select
              value={activeRole}
              onChange={(val) => onChangeRole(val)}
              style={{ width: 140 }}
              size="small"
              options={[
                { label: 'Asesor 1 (Lead)', value: 'asesor1' },
                { label: 'Asesor 2 (Member)', value: 'asesor2' },
                { label: 'Konsensus AL', value: 'consensus' },
              ]}
            />
            <Button
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => setShowPersonnelForm(!showPersonnelForm)}
              style={{ fontSize: 11, padding: 0, height: 'auto', color: '#ffffff', fontWeight: 600 }}
            >
              {showPersonnelForm ? '▲ Tutup Form Personil' : '▼ Form Isian Personil'}
            </Button>
          </Space>
        </Space>
      </Flex>

      {showPersonnelForm && (
        <div style={{ marginTop: 10, padding: 10, backgroundColor: '#4d004d', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)' }}>
          <AssessorLeadershipForm
            studyInfo={studyInfo}
            onUpdateStudyInfo={onUpdateStudyInfo}
            compact
          />
        </div>
      )}
    </div>
  );
};
