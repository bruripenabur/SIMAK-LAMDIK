import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  Divider, 
  Tag, 
  message, 
  theme 
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined, 
  DownloadOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { LamProfile, SyaratUnggulRule } from '../types/accreditation';

const { Title, Text, Paragraph } = Typography;

interface LamConfigEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLam: LamProfile;
  onSaveProfile: (updatedProfile: LamProfile) => void;
  onResetProfile: () => void;
}

export const LamConfigEditorModal: React.FC<LamConfigEditorModalProps> = ({
  isOpen,
  onClose,
  currentLam,
  onSaveProfile,
  onResetProfile,
}) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [rules, setRules] = useState<SyaratUnggulRule[]>([...currentLam.syaratUnggulRules]);

  // Sync initial values when modal opens
  React.useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        lamName: currentLam.lamName,
        quantDoc: currentLam.docTerms.quantitativeDoc,
        qualDoc: currentLam.docTerms.qualitativeDoc,
        worksheetDoc: currentLam.docTerms.worksheetDoc,
        institutionDoc: currentLam.docTerms.institutionLevelDoc,
        thresholdUnggul: currentLam.thresholdUnggul,
        thresholdUnggul3Th: currentLam.thresholdUnggul3Th,
      });
      setRules([...currentLam.syaratUnggulRules]);
    }
  }, [isOpen, currentLam, form]);

  const handleAddRule = () => {
    const newRule: SyaratUnggulRule = {
      id: `CUSTOM-SU-${Date.now()}`,
      indicatorKey: 'KUSTOM_RULE',
      indicatorName: 'Kriteria Gatekeeper Tambahan',
      description: 'Deskripsi syarat ambang batas kustom untuk penjaminan mutu LAM.',
      ruleType: 'formula',
      formula: 'PTW >= 50',
      latexRule: 'PTW \\ge 50\\%',
      fallbackRank: 'TERAKREDITASI',
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleUpdateRule = (id: string, updated: Partial<SyaratUnggulRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updated } : r));
  };

  const handleFormFinish = (values: any) => {
    const updated: LamProfile = {
      ...currentLam,
      lamName: values.lamName,
      thresholdUnggul: values.thresholdUnggul,
      thresholdUnggul3Th: values.thresholdUnggul3Th,
      docTerms: {
        quantitativeDoc: values.quantDoc,
        qualitativeDoc: values.qualDoc,
        worksheetDoc: values.worksheetDoc,
        institutionLevelDoc: values.institutionDoc,
      },
      syaratUnggulRules: rules,
    };
    onSaveProfile(updated);
    message.success('Konfigurasi profil LAM berhasil diperbarui');
    onClose();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentLam, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LAM_CONFIG_${currentLam.lamCode}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    message.success(`Konfigurasi ${currentLam.lamCode} berhasil diekspor sebagai JSON`);
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined style={{ color: token.colorPrimary }} />
          <span>Konfigurasi Master Profil & Rumus LAM ({currentLam.lamCode})</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={780}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExportJson}>
          Ekspor JSON
        </Button>,
        <Button key="reset" icon={<ReloadOutlined />} onClick={() => { onResetProfile(); onClose(); }}>
          Reset Standar
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        <Button key="submit" type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
          Simpan Konfigurasi
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormFinish}
        style={{ marginTop: 16 }}
      >
        {/* Document Terminology */}
        <Card size="small" title="Multi-Tenant Terminology Switcher" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Nama Dokumen Kuantitatif (LKPS / DKPS / LKK)"
                name="quantDoc"
                rules={[{ required: true }]}
              >
                <Input style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nama Dokumen Kualitatif (LED / LKD / LPT)"
                name="qualDoc"
                rules={[{ required: true }]}
              >
                <Input style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Nama Kertas Kerja (Worksheet)"
                name="worksheetDoc"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ambang Batas Unggul 5 Tahun (TNA ≥ 361)"
                name="thresholdUnggul"
                rules={[{ required: true }]}
              >
                <InputNumber min={200} max={400} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ambang Batas Unggul 3 Tahun (341 ≤ TNA < 361)"
                name="thresholdUnggul3Th"
                rules={[{ required: true }]}
              >
                <InputNumber min={200} max={400} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Dynamic Syarat Unggul Rules Config */}
        <Card
          size="small"
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
              <span>Dynamic Syarat Perlu Unggul (Gatekeeper Rules)</span>
            </Space>
          }
          extra={
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
              Tambah Aturan
            </Button>
          }
        >
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            {rules.map((r, idx) => (
              <Card
                key={r.id}
                size="small"
                style={{ backgroundColor: token.colorBgElevated }}
                extra={
                  <Button 
                    type="text" 
                    danger 
                    size="small" 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleRemoveRule(r.id)} 
                  />
                }
                title={`#${idx + 1} ${r.indicatorName}`}
              >
                <Row gutter={12}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Kunci Simbol:
                    </Text>
                    <Input
                      size="small"
                      value={r.indicatorKey}
                      onChange={(e) => handleUpdateRule(r.id, { indicatorKey: e.target.value })}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Col>
                  <Col span={16}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Kondisi Logika (JS Logic Formula):
                    </Text>
                    <Input
                      size="small"
                      value={r.formula || ''}
                      onChange={(e) => handleUpdateRule(r.id, { formula: e.target.value })}
                      style={{ fontFamily: 'monospace', color: token.colorSuccess }}
                      placeholder="Contoh: PTW >= 45 || PPS >= 75"
                    />
                  </Col>
                  <Col span={24} style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                      Notasi Matematis LaTeX:
                    </Text>
                    <Input
                      size="small"
                      value={r.latexRule || ''}
                      onChange={(e) => handleUpdateRule(r.id, { latexRule: e.target.value })}
                      style={{ fontFamily: 'monospace', color: token.colorInfo }}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      </Form>
    </Modal>
  );
};
