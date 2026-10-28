import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Select, 
  Typography, 
  Space, 
  Button, 
  Tag, 
  message, 
  theme,
  Divider,
  AutoComplete,
  Flex
} from 'antd';
import { 
  TeamOutlined, 
  UserOutlined, 
  BankOutlined, 
  SafetyCertificateOutlined, 
  CheckCircleOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { StudyProgramInfo } from '../types/accreditation';
import { INDONESIAN_UNIVERSITIES, UPPS_LEADERSHIP_ROLES } from '../utils/sampleData';

const { Title, Text } = Typography;

interface AssessorLeadershipFormProps {
  studyInfo: StudyProgramInfo;
  onUpdateStudyInfo: (updated: Partial<StudyProgramInfo>) => void;
  compact?: boolean;
}

export const AssessorLeadershipForm: React.FC<AssessorLeadershipFormProps> = ({
  studyInfo,
  onUpdateStudyInfo,
  compact = false,
}) => {
  const { token } = theme.useToken();

  const [studyProgName, setStudyProgName] = useState(studyInfo.studyProgramName || 'Peternakan');
  const [facName, setFacName] = useState(studyInfo.facultyName || 'Fakultas Pertanian');

  const [asesor1Name, setAsesor1Name] = useState(studyInfo.asesor1Name || '');
  const [asesor1Univ, setAsesor1Univ] = useState(studyInfo.asesor1Institution || '');
  
  const [asesor2Name, setAsesor2Name] = useState(studyInfo.asesor2Name || '');
  const [asesor2Univ, setAsesor2Univ] = useState(studyInfo.asesor2Institution || '');
  
  const [leaderName, setLeaderName] = useState(studyInfo.dekanOrKaprodiName || '');
  const [leaderRole, setLeaderRole] = useState<'Dekan' | 'Direktur' | 'WaDek' | 'WaDir'>(
    (studyInfo.dekanRoleType as any) || 'Dekan'
  );

  useEffect(() => {
    setStudyProgName(studyInfo.studyProgramName || 'Peternakan');
    setFacName(studyInfo.facultyName || 'Fakultas Pertanian');
    setAsesor1Name(studyInfo.asesor1Name || '');
    setAsesor1Univ(studyInfo.asesor1Institution || '');
    setAsesor2Name(studyInfo.asesor2Name || '');
    setAsesor2Univ(studyInfo.asesor2Institution || '');
    setLeaderName(studyInfo.dekanOrKaprodiName || '');
    if (studyInfo.dekanRoleType) {
      setLeaderRole(studyInfo.dekanRoleType as any);
    }
  }, [studyInfo]);

  const handleSave = () => {
    onUpdateStudyInfo({
      studyProgramName: studyProgName,
      facultyName: facName,
      asesor1Name,
      asesor1Institution: asesor1Univ,
      asesor2Name,
      asesor2Institution: asesor2Univ,
      dekanOrKaprodiName: leaderName,
      dekanRoleType: leaderRole,
    });
    message.success({ 
      content: 'Data Program Studi, Asesor 1, Asesor 2, & Pimpinan UPPS berhasil disimpan dan disinkronkan ke seluruh dokumen!', 
      key: 'savePersonnel' 
    });
  };

  const universityOptions = INDONESIAN_UNIVERSITIES.map(univ => ({
    label: univ,
    value: univ,
  }));

  return (
    <Card 
      size="small"
      style={{ 
        backgroundColor: token.colorBgElevated, 
        borderColor: token.colorPrimaryBorder,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        marginTop: compact ? 8 : 16,
        marginBottom: compact ? 8 : 16,
      }}
      title={
        <Space wrap>
          <TeamOutlined style={{ color: token.colorPrimary }} />
          <Text strong style={{ fontSize: 13, color: token.colorTextHeading }}>
            Form Isian Personil Asesmen Lapangan (Asesor 1, Asesor 2, & Pimpinan UPPS)
          </Text>
          <Tag color="cyan">Sinkronisasi Otomatis ke Dokumen AL & Cetak PDF</Tag>
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          size="small"
          icon={<SaveOutlined />} 
          onClick={handleSave}
          style={{ fontWeight: 600 }}
        >
          Simpan Personil
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        {/* Identitas Program Studi & Fakultas UPPS */}
        <Col span={24}>
          <div style={{ 
            padding: '8px 12px', 
            borderRadius: 6, 
            backgroundColor: token.colorBgContainer, 
            border: `1px solid ${token.colorBorderSecondary}`,
            marginBottom: 4 
          }}>
            <Row gutter={[16, 8]} align="middle">
              <Col xs={24} sm={12}>
                <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: 12, color: token.colorPrimary }}>
                    <BankOutlined style={{ marginRight: 6 }} />
                    Program Studi yang Diases:
                  </Text>
                  <Input
                    size="small"
                    value={studyProgName}
                    onChange={(e) => setStudyProgName(e.target.value)}
                    placeholder="Contoh: Peternakan, Agroteknologi, dll."
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space orientation="vertical" size={2} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Fakultas / UPPS:
                  </Text>
                  <Input
                    size="small"
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    placeholder="Contoh: Fakultas Pertanian"
                  />
                </Space>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Asesor 1: Nama Lengkap & Pilihan Asal Universitas */}
        <Col xs={24} md={8}>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: token.colorBgContainer, 
              borderLeft: `3px solid #10b981`,
              height: '100%' 
            }}
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 12, color: '#10b981' }}>
                  <UserOutlined style={{ marginRight: 6 }} />
                  Asesor 1 (Ketua Tim AL)
                </Text>
                <Tag color="green">Asesor 1</Tag>
              </Flex>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Nama Lengkap Asesor 1:
                </Text>
                <Input
                  value={asesor1Name}
                  onChange={(e) => {
                    setAsesor1Name(e.target.value);
                    onUpdateStudyInfo({ asesor1Name: e.target.value });
                  }}
                  placeholder="Contoh: Prof. Dr. Ir. Suryadi Pratama, M.Sc."
                  allowClear
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Pilihan Asal Universitas Asesor 1:
                </Text>
                <AutoComplete
                  style={{ width: '100%' }}
                  value={asesor1Univ}
                  options={universityOptions}
                  onChange={(val) => {
                    setAsesor1Univ(val);
                    onUpdateStudyInfo({ asesor1Institution: val });
                  }}
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  placeholder="Pilih atau ketik Asal Universitas..."
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Asesor 2: Nama Lengkap & Pilihan Asal Universitas */}
        <Col xs={24} md={8}>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: token.colorBgContainer, 
              borderLeft: `3px solid #06b6d4`,
              height: '100%' 
            }}
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 12, color: '#06b6d4' }}>
                  <UserOutlined style={{ marginRight: 6 }} />
                  Asesor 2 (Anggota Tim AL)
                </Text>
                <Tag color="cyan">Asesor 2</Tag>
              </Flex>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Nama Lengkap Asesor 2:
                </Text>
                <Input
                  value={asesor2Name}
                  onChange={(e) => {
                    setAsesor2Name(e.target.value);
                    onUpdateStudyInfo({ asesor2Name: e.target.value });
                  }}
                  placeholder="Contoh: Dr. Ir. Endang Sri Wahyuni, M.P."
                  allowClear
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Pilihan Asal Universitas Asesor 2:
                </Text>
                <AutoComplete
                  style={{ width: '100%' }}
                  value={asesor2Univ}
                  options={universityOptions}
                  onChange={(val) => {
                    setAsesor2Univ(val);
                    onUpdateStudyInfo({ asesor2Institution: val });
                  }}
                  filterOption={(inputValue, option) =>
                    option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  placeholder="Pilih atau ketik Asal Universitas..."
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Pimpinan UPPS/Dekan/Direktur: Nama Lengkap & Pilihan [Dekan/Direktur/WaDek/WaDir] */}
        <Col xs={24} md={8}>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: token.colorBgContainer, 
              borderLeft: `3px solid #f59e0b`,
              height: '100%' 
            }}
          >
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 12, color: '#f59e0b' }}>
                  <BankOutlined style={{ marginRight: 6 }} />
                  Pimpinan UPPS / Dekan / Direktur
                </Text>
                <Tag color="orange">{leaderRole}</Tag>
              </Flex>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Nama Lengkap Pimpinan UPPS:
                </Text>
                <Input
                  value={leaderName}
                  onChange={(e) => {
                    setLeaderName(e.target.value);
                    onUpdateStudyInfo({ dekanOrKaprodiName: e.target.value });
                  }}
                  placeholder="Contoh: Dr. Ir. J. Pattiasina, M.Si."
                  allowClear
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Pilihan Jabatan Pimpinan UPPS:
                </Text>
                <Select
                  style={{ width: '100%' }}
                  value={leaderRole}
                  onChange={(val) => {
                    setLeaderRole(val);
                    onUpdateStudyInfo({ dekanRoleType: val });
                  }}
                  options={UPPS_LEADERSHIP_ROLES}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
