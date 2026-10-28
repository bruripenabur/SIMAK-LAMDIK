import React from 'react';
import { Space, Typography, Button, Progress, Tag, Divider, theme, Flex } from 'antd';
import { 
  TableOutlined, 
  FormOutlined, 
  SafetyCertificateOutlined, 
  LinkOutlined, 
  TeamOutlined, 
  AuditOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { LamProfile, AssessmentRecord } from '../types/accreditation';
import { calculateAccreditationTotal } from '../utils/mathEngine';

const { Text } = Typography;

interface AppSidebarProps {
  currentLam: LamProfile;
  assessmentRecords: Record<string, AssessmentRecord>;
  activeTab: string;
  onChangeTab: (tab: any) => void;
  activeRole: string;
  onOpenSummaryModal?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentLam,
  assessmentRecords,
  activeTab,
  onChangeTab,
  activeRole,
  onOpenSummaryModal,
}) => {
  const { token } = theme.useToken();

  const overallScore = calculateAccreditationTotal(currentLam.indicators, assessmentRecords, activeRole as any);

  // Group indicators by criteria (1 to 9)
  const criteriaList = [
    { num: 1, name: 'Visi, Misi, Tujuan & Strategi' },
    { num: 2, name: 'Tata Pamong & Kerjasama' },
    { num: 3, name: 'Mahasiswa' },
    { num: 4, name: 'Sumber Daya Manusia' },
    { num: 5, name: 'Keuangan, Sarana & Prasarana' },
    { num: 6, name: 'Pendidikan (Kurikulum & PMB)' },
    { num: 7, name: 'Penelitian' },
    { num: 8, name: 'Pengabdian kepada Masyarakat' },
    { num: 9, name: 'Luaran & Capaian Tri Dharma' },
  ];

  return (
    <div
      style={{
        width: 260,
        backgroundColor: '#CC00CC',
        borderRight: `1px solid rgba(255, 255, 255, 0.2)`,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flexShrink: 0,
        minHeight: 'calc(100vh - 180px)',
        color: '#ffffff',
      }}
    >
      {/* Sidebar Header / Summary Card */}
      <div
        style={{
          backgroundColor: '#4d004d',
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 11, color: '#f3e8ff', fontWeight: 600 }}>STATUS AKREDITASI</Text>
          <Tag color="cyan" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>LAMDIK 3.0</Tag>
        </Flex>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <Text strong style={{ fontSize: 22, color: '#34d399', fontFamily: 'monospace' }}>
            {overallScore.toFixed(1)}
          </Text>
          <Text style={{ fontSize: 12, color: '#f3e8ff' }}>/ 400.0 (Unggul)</Text>
        </div>
        <Progress
          percent={Math.round((overallScore / 400) * 100)}
          size="small"
          strokeColor={{ '0%': '#38bdf8', '100%': '#34d399' }}
          railColor="rgba(255,255,255,0.2)"
          showInfo={false}
        />
        {onOpenSummaryModal && (
          <Button
            type="dashed"
            size="small"
            block
            icon={<DashboardOutlined />}
            onClick={onOpenSummaryModal}
            style={{ marginTop: 10, fontSize: 12, borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff', backgroundColor: '#5c005c', fontWeight: 600 }}
          >
            Dasbor Ringkasan 9 Kriteria
          </Button>
        )}
      </div>

      {/* Navigation Modules */}
      <div>
        <Text style={{ fontSize: 11, fontWeight: 700, color: '#f3e8ff', letterSpacing: 0.5, paddingLeft: 6, textTransform: 'uppercase' }}>
          Menu Modul Utama
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          <Button
            type={activeTab === 'worksheet' ? 'primary' : 'text'}
            icon={<TableOutlined />}
            onClick={() => onChangeTab('worksheet')}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              backgroundColor: activeTab === 'worksheet' ? '#10b981' : 'transparent',
              color: '#ffffff',
              fontWeight: activeTab === 'worksheet' ? 700 : 500,
            }}
          >
            Kertas Kerja 65 Indikator
          </Button>

          <Button
            type={activeTab === 'syarat_unggul' ? 'primary' : 'text'}
            icon={<SafetyCertificateOutlined />}
            onClick={() => onChangeTab('syarat_unggul')}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              backgroundColor: activeTab === 'syarat_unggul' ? '#10b981' : 'transparent',
              color: '#ffffff',
              fontWeight: activeTab === 'syarat_unggul' ? 700 : 500,
            }}
          >
            Syarat Unggul & Simulasi
          </Button>

          <Button
            type={activeTab === 'evidence' ? 'primary' : 'text'}
            icon={<LinkOutlined />}
            onClick={() => onChangeTab('evidence')}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              backgroundColor: activeTab === 'evidence' ? '#10b981' : 'transparent',
              color: '#ffffff',
              fontWeight: activeTab === 'evidence' ? 700 : 500,
            }}
          >
            Live Evidence Extractor
          </Button>

          <Button
            type={activeTab === 'konsolidasi' ? 'primary' : 'text'}
            icon={<TeamOutlined />}
            onClick={() => onChangeTab('konsolidasi')}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              backgroundColor: activeTab === 'konsolidasi' ? '#10b981' : 'transparent',
              color: '#ffffff',
              fontWeight: activeTab === 'konsolidasi' ? 700 : 500,
            }}
          >
            Konsolidasi Asesor 1 & 2
          </Button>

          <Button
            type={activeTab === 'berita_acara_menu' ? 'primary' : 'text'}
            icon={<AuditOutlined />}
            onClick={() => onChangeTab('berita_acara_menu')}
            style={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              backgroundColor: activeTab === 'berita_acara_menu' ? '#10b981' : 'transparent',
              color: '#ffffff',
              fontWeight: activeTab === 'berita_acara_menu' ? 700 : 500,
            }}
          >
            Berita Acara & Lampiran
          </Button>
        </div>
      </div>

      <Divider style={{ margin: '4px 0', borderColor: 'rgba(255,255,255,0.3)' }} />

      {/* 9 Criteria Quick Jump List */}
      <div>
        <Text style={{ fontSize: 11, fontWeight: 700, color: '#f3e8ff', letterSpacing: 0.5, paddingLeft: 6, textTransform: 'uppercase' }}>
          9 Kriteria LAMDIK 3.0
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
          {criteriaList.map((crit) => {
            const count = currentLam.indicators.filter(i => i.kriteriaNumber === crit.num).length;
            return (
              <div
                key={crit.num}
                onClick={() => {
                  onChangeTab('worksheet');
                }}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: '#4d004d',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                title={`Kriteria ${crit.num}: ${crit.name} (${count} indikator)`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <Tag color="cyan" style={{ margin: 0, fontSize: 10, padding: '0 4px', fontWeight: 700 }}>K{crit.num}</Tag>
                  <Text style={{ fontSize: 11, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {crit.name}
                  </Text>
                </div>
                <Text style={{ fontSize: 10, color: '#f3e8ff', flexShrink: 0 }}>{count} ind</Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
