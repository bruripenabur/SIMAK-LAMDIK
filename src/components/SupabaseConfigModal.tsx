import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Switch,
  Typography,
  Space,
  Alert,
  Card,
  Tabs,
  Tag,
  Row,
  Col,
  Divider,
  message,
  Tooltip,
  Table,
  Badge,
  Flex,
  theme,
} from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  CloudSyncOutlined,
  QuestionCircleOutlined,
  CodeOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import {
  SupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncAssessmentToSupabase,
  loadAssessmentsFromSupabase,
  SUPABASE_SQL_SCHEMA,
} from '../utils/supabaseClient';

const { Title, Text, Paragraph } = Typography;

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLamCode: string;
  studyInfo: {
    studyProgramName: string;
    degreeLevel: string;
  };
  currentAssessmentData?: any;
  onRestoreFromCloud?: (payload: any) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  currentLamCode,
  studyInfo,
  currentAssessmentData,
  onRestoreFromCloud,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [config, setConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [cloudItems, setCloudItems] = useState<any[]>([]);
  const [loadingCloudItems, setLoadingCloudItems] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSupabaseConfig();
      setConfig(stored);
      form.setFieldsValue({
        supabaseUrl: stored.supabaseUrl,
        supabaseAnonKey: stored.supabaseAnonKey,
        tableName: stored.tableName || 'akreditasi_sessions',
        autoSync: stored.autoSync || false,
      });
      setTestResult(null);
      if (stored.supabaseUrl && stored.supabaseAnonKey) {
        handleFetchCloudList(stored);
      }
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    const values = form.getFieldsValue();
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(
      values.supabaseUrl,
      values.supabaseAnonKey,
      values.tableName || 'akreditasi_sessions'
    );

    setTesting(false);
    setTestResult(res);

    if (res.success) {
      message.success('Koneksi ke database Supabase berhasil!');
      const updated: SupabaseConfig = {
        ...config,
        ...values,
        isConnected: true,
      };
      setConfig(updated);
      saveSupabaseConfig(updated);
      handleFetchCloudList(updated);
    } else {
      message.error(res.message);
    }
  };

  const handleSave = () => {
    const values = form.getFieldsValue();
    const updated: SupabaseConfig = {
      ...config,
      ...values,
      isConnected: testResult?.success ?? config.isConnected,
    };
    setConfig(updated);
    saveSupabaseConfig(updated);
    message.success('Pengaturan koneksi API Supabase tersimpan!');
    onClose();
  };

  const handleSyncCurrentToSupabase = async () => {
    const values = form.getFieldsValue();
    if (!values.supabaseUrl || !values.supabaseAnonKey) {
      message.warning('Masukkan URL dan API Key Supabase terlebih dahulu.');
      return;
    }
    setSyncing(true);
    const res = await syncAssessmentToSupabase(
      {
        ...config,
        ...values,
      },
      {
        programStudyId: studyInfo.studyProgramName,
        programStudyName: studyInfo.studyProgramName,
        degreeLevel: studyInfo.degreeLevel,
        lamCode: currentLamCode,
        data: currentAssessmentData,
      }
    );
    setSyncing(false);

    if (res.success) {
      message.success(res.message);
      const updated: SupabaseConfig = {
        ...config,
        lastSyncTime: new Date().toLocaleString('id-ID'),
      };
      setConfig(updated);
      saveSupabaseConfig(updated);
      handleFetchCloudList({ ...config, ...values });
    } else {
      message.error(res.message);
    }
  };

  const handleFetchCloudList = async (cfg: SupabaseConfig) => {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
    setLoadingCloudItems(true);
    const res = await loadAssessmentsFromSupabase(cfg);
    setLoadingCloudItems(false);
    if (res.success && res.data) {
      setCloudItems(res.data);
    }
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    message.success('Script SQL berhasil disalin ke clipboard!');
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={880}
      title={
        <Space align="center">
          <DatabaseOutlined style={{ color: '#3ecf8e', fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Integrasi & Setting Koneksi Database Supabase
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 'normal' }}>
              Fitur Administrator: Hubungkan Kertas Kerja Akreditasi Langsung ke PostgreSQL Supabase
            </div>
          </div>
        </Space>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SafetyCertificateOutlined />}
          style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
          onClick={handleSave}
        >
          Simpan Konfigurasi
        </Button>,
      ]}
    >
      <Tabs
        defaultActiveKey="settings"
        items={[
          {
            key: 'settings',
            label: (
              <Space>
                <ApiOutlined />
                <span>Pengaturan API & Koneksi</span>
              </Space>
            ),
            children: (
              <div>
                <Alert
                  type="info"
                  showIcon
                  icon={<RocketOutlined />}
                  title="Koneksi Langsung ke Cloud Database Supabase"
                  description="Dengan menghubungkan Supabase, seluruh butir penilaian, skor konsensus asesor, catatan, dan bukti pendukung dapat disinkronkan secara aman dan diakses multi-perangkat secara real-time."
                  style={{ marginBottom: 16 }}
                />

                <Form form={form} layout="vertical">
                  <Row gutter={16}>
                    <Col xs={24} md={14}>
                      <Form.Item
                        name="supabaseUrl"
                        label={
                          <Space>
                            <Text strong>Supabase Project URL</Text>
                            <Tooltip title="Ditemukan di Supabase Dashboard -> Project Settings -> API -> Project URL (misal: https://xyzcompany.supabase.co)">
                              <QuestionCircleOutlined />
                            </Tooltip>
                          </Space>
                        }
                        rules={[{ required: true, message: 'Supabase Project URL wajib diisi' }]}
                      >
                        <Input
                          placeholder="https://your-project-id.supabase.co"
                          prefix={<ApiOutlined style={{ color: '#3ecf8e' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                      <Form.Item
                        name="tableName"
                        label={
                          <Space>
                            <Text strong>Nama Tabel Database</Text>
                            <Tooltip title="Tabel di public schema tempat data sesi disimpan. Default: akreditasi_sessions">
                              <QuestionCircleOutlined />
                            </Tooltip>
                          </Space>
                        }
                      >
                        <Input placeholder="akreditasi_sessions" prefix={<DatabaseOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="supabaseAnonKey"
                    label={
                      <Space>
                        <Text strong>Supabase API Key (Anon / Public Key)</Text>
                        <Tooltip title="Ditemukan di Supabase Dashboard -> Project Settings -> API -> Project API Keys -> 'anon public'">
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    rules={[{ required: true, message: 'Anon Key wajib diisi' }]}
                  >
                    <Input.Password
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
                      prefix={<SafetyCertificateOutlined style={{ color: '#f59e0b' }} />}
                    />
                  </Form.Item>

                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="autoSync"
                        valuePropName="checked"
                        style={{ marginBottom: 0 }}
                      >
                        <Space>
                          <Switch />
                          <Text>Auto-Sync Saat Perubahan Nilai Disimpan</Text>
                        </Space>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                      <Space>
                        <Button
                          loading={testing}
                          icon={<CheckCircleOutlined />}
                          onClick={handleTestConnection}
                          style={{ borderColor: '#3ecf8e', color: '#10b981' }}
                        >
                          Uji Koneksi (Test API)
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </Form>

                {/* Status Uji Koneksi */}
                {testResult && (
                  <Alert
                    style={{ marginTop: 16 }}
                    type={testResult.success ? 'success' : 'error'}
                    showIcon
                    title={
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {testResult.success ? 'Koneksi Berhasil Terhubung!' : 'Koneksi ke Supabase Gagal / Belum Sempurna'}
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <div style={{ marginBottom: 6 }}>{testResult.message}</div>
                        {testResult.details?.explanation && (
                          <div style={{ 
                            padding: '8px 12px', 
                            borderRadius: 6, 
                            backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            marginTop: 8
                          }}>
                            <div style={{ fontWeight: 600, color: testResult.success ? '#059669' : '#dc2626' }}>
                              Artinya apa ini?
                            </div>
                            <div style={{ marginTop: 2, color: token.colorText }}>
                              {testResult.details.explanation}
                            </div>
                            {testResult.details.solution && (
                              <div style={{ marginTop: 6, fontWeight: 500, color: token.colorTextSecondary }}>
                                👉 <strong>Langkah Perbaikan:</strong> {testResult.details.solution}
                              </div>
                            )}
                            {testResult.details.code === 'TABLE_NOT_FOUND' && (
                              <div style={{ marginTop: 10 }}>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CopyOutlined />}
                                  onClick={copySqlSchema}
                                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                                >
                                  Salin Skrip SQL Pembuatan Tabel Sekarang
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    }
                  />
                )}

                <Divider style={{ margin: '16px 0' }} />

                {/* Panel Sinkronisasi Langsung */}
                <Card
                  size="small"
                  title={
                    <Space>
                      <CloudSyncOutlined style={{ color: '#06b6d4' }} />
                      <Text strong>Aksi Sinkronisasi Sesi Aktif Saat Ini</Text>
                    </Space>
                  }
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} md={16}>
                      <Space orientation="vertical" size={2}>
                        <div>
                          <Text strong>Program Studi:</Text>{' '}
                          <Tag color="blue">{studyInfo.studyProgramName || 'Belum diisi'}</Tag>
                          <Tag color="cyan">{studyInfo.degreeLevel}</Tag>
                          <Tag color="purple">{currentLamCode}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {config.lastSyncTime
                            ? `Terakhir disinkronkan: ${config.lastSyncTime}`
                            : 'Belum pernah disinkronkan ke Supabase'}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                      <Button
                        type="primary"
                        icon={<CloudUploadOutlined />}
                        loading={syncing}
                        onClick={handleSyncCurrentToSupabase}
                        style={{ backgroundColor: '#3ecf8e', borderColor: '#3ecf8e' }}
                      >
                        Push ke Database Supabase
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </div>
            ),
          },
          {
            key: 'cloud_data',
            label: (
              <Space>
                <CloudDownloadOutlined />
                <span>Data di Supabase ({cloudItems.length})</span>
              </Space>
            ),
            children: (
              <div>
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Text type="secondary">
                    Daftar sesi penilaian akreditasi yang tersimpan di cloud database Supabase.
                  </Text>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={loadingCloudItems}
                    onClick={() => handleFetchCloudList(form.getFieldsValue())}
                  >
                    Segarkan
                  </Button>
                </Flex>

                <Table
                  dataSource={cloudItems}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'Program Studi',
                      dataIndex: 'program_study_name',
                      key: 'program_study_name',
                      render: (text, record) => (
                        <Space orientation="vertical" size={0}>
                          <Text strong>{text || '-'}</Text>
                          <Space size={4}>
                            <Tag color="cyan">{record.degree_level}</Tag>
                            <Tag color="purple">{record.lam_code}</Tag>
                          </Space>
                        </Space>
                      ),
                    },
                    {
                      title: 'Terakhir Diperbarui',
                      dataIndex: 'updated_at',
                      key: 'updated_at',
                      render: (text) => (
                        <Text style={{ fontSize: 12 }} type="secondary">
                          {text ? new Date(text).toLocaleString('id-ID') : '-'}
                        </Text>
                      ),
                    },
                    {
                      title: 'Aksi',
                      key: 'action',
                      render: (_, record) => (
                        <Button
                          size="small"
                          type="link"
                          icon={<CloudDownloadOutlined />}
                          onClick={() => {
                            if (onRestoreFromCloud && record.payload) {
                              onRestoreFromCloud(record.payload);
                              message.success(`Data ${record.program_study_name} berhasil dimuat dari Supabase!`);
                              onClose();
                            } else {
                              message.warning('Payload data sesi tidak ditemukan.');
                            }
                          }}
                        >
                          Terapkan ke Aplikasi
                        </Button>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText:
                      cloudItems.length === 0
                        ? 'Belum ada data sesi akreditasi di database Supabase atau tabel belum dibuat.'
                        : 'Tidak ada data',
                  }}
                />
              </div>
            ),
          },
          {
            key: 'guide',
            label: (
              <Space>
                <BookOutlined />
                <span>Petunjuk Lengkap & SQL</span>
              </Space>
            ),
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                  <RocketOutlined style={{ color: '#3ecf8e', marginRight: 8 }} />
                  Panduan Tahap demi Tahap Konfigurasi Supabase
                </Title>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Card size="small" title="Langkah 1: Buat Akun & Project Baru di Supabase">
                    <Paragraph style={{ marginBottom: 8 }}>
                      1. Buka situs resmi Supabase di{' '}
                      <Text strong style={{ color: '#3ecf8e' }}>
                        https://supabase.com
                      </Text>{' '}
                      dan masuk (Sign In) menggunakan akun GitHub atau email Anda.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 8 }}>
                      2. Klik tombol <strong>"New Project"</strong>.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0 }}>
                      3. Berikan nama project (contoh: <code>akreditasi-unpatti</code>), buat database password yang aman, dan pilih Region terdekat (contoh: <code>Singapore (ap-southeast-1)</code> untuk latensi tercepat di Indonesia).
                    </Paragraph>
                  </Card>

                  <Card size="small" title="Langkah 2: Eksekusi Skrip SQL Pembuatan Tabel">
                    <Paragraph style={{ marginBottom: 8 }}>
                      1. Pada bilah navigasi kiri Supabase Dashboard, pilih menu <strong>"SQL Editor"</strong> (ikon terminal).
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 8 }}>
                      2. Klik <strong>"New query"</strong>, tempelkan skrip SQL di bawah ini, lalu klik tombol <strong>"RUN"</strong>:
                    </Paragraph>

                    <div style={{ position: 'relative', marginTop: 8 }}>
                      <pre
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#38bdf8',
                          padding: '12px 16px',
                          borderRadius: 8,
                          fontSize: 12,
                          overflowX: 'auto',
                          maxHeight: 200,
                        }}
                      >
                        {SUPABASE_SQL_SCHEMA}
                      </pre>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={copySqlSchema}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          color: '#f8fafc',
                        }}
                      >
                        Salin SQL
                      </Button>
                    </div>
                  </Card>

                  <Card size="small" title="Langkah 3: Ambil Project URL dan Anon Public Key">
                    <Paragraph style={{ marginBottom: 8 }}>
                      1. Di dashboard Supabase, buka menu <strong>Project Settings</strong> (ikon roda gerigi di kiri bawah) &gt; pilih menu <strong>API</strong>.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 8 }}>
                      2. Salin nilai <strong>Project URL</strong> (format: <code>https://abcdefghijkl.supabase.co</code>).
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0 }}>
                      3. Salin nilai <strong>Project API keys &gt; anon public</strong> (token diawali dengan <code>eyJ...</code>).
                    </Paragraph>
                  </Card>

                  <Card size="small" title="Langkah 4: Masukkan ke Form Setting dan Uji Koneksi">
                    <Paragraph style={{ marginBottom: 8 }}>
                      1. Buka tab <strong>Pengaturan API & Koneksi</strong> pada jendela ini.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 8 }}>
                      2. Tempelkan URL dan Anon Key pada input yang tersedia.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 8 }}>
                      3. Klik tombol <strong>Uji Koneksi (Test API)</strong>. Indikator hijau menandakan integrasi database telah aktif sempurna.
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0 }}>
                      4. Klik <strong>Simpan Konfigurasi</strong> dan Anda dapat langsung menekan tombol <strong>Push ke Database Supabase</strong> untuk mencadangkan penilaian secara real-time.
                    </Paragraph>
                  </Card>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
