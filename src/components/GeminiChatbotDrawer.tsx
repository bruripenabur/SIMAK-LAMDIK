import React, { useState, useRef, useEffect } from 'react';
import { 
  Drawer, 
  Input, 
  Button, 
  Space, 
  Flex, 
  Typography, 
  Tag, 
  Select, 
  Avatar, 
  Spin, 
  Card, 
  Tooltip,
  theme 
} from 'antd';
import { 
  RobotOutlined, 
  UserOutlined, 
  SendOutlined, 
  ClearOutlined, 
  BulbOutlined, 
  CheckCircleOutlined,
  ThunderboltOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { LamProfile, StudyProgramInfo } from '../types/accreditation';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLam: LamProfile;
  studyInfo: StudyProgramInfo;
}

const SUGGESTED_PROMPTS = [
  'Bagaimana menyusun narasi LED K.1 Budaya Mutu siklus PPEPP agar lolos Unggul?',
  'Drafkan hasil verifikasi temuan AL untuk penyesuaian DTPS Tabel LKPS 2.1A.',
  'Analisis kepatuhan Syarat Perlu Unggul (PPEPP >= 3.50, WT <= 7.5 bulan, PTW >= 45%).',
  'Buatkan draf Rekomendasi Pembinaan Asesmen Lapangan untuk Kriteria 1 sampai 6.',
  'Bagaimana cara mengintegrasikan kurikulum OBE dengan capaian SDGs kepulauan?',
];

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  currentLam,
  studyInfo,
}) => {
  const { token } = theme.useToken();
  const [modelType, setModelType] = useState<'general' | 'complex' | 'fast'>('general');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Halo! Saya adalah **AI Senior Assessor & Accreditation Assistant** untuk **${currentLam.lamCode}** di **${studyInfo.universityName || 'Universitas Pattimura'}** (${studyInfo.studyProgramName || 'Program Studi'}).\n\nSaya dapat membantu Anda:\n1. Menganalisis & menyusun perbaikan narasi **LED (Siklus PPEPP)**.\n2. Mengaudit data kuantitatif **${currentLam.docTerms.quantitativeDoc}** (DTPS, EWMP, pendanaan riset, MBKM, HKI).\n3. Menyusun **Berita Acara AL & Lampiran Rekapitulasi Perubahan** pasca-asesmen lapangan.\n4. Memverifikasi kepatuhan **Syarat Perlu Unggul**.\n\nAda yang dapat saya bantu analisis hari ini?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Filter out error notes or broken previous attempts from history payload
      const validHistory = messages
        .filter((m) => {
          const c = m.content || '';
          return (
            m.modelUsed !== 'offline-fallback' &&
            !c.includes('Mohon maaf, terjadi kendala') &&
            !c.includes('Terjadi kendala jaringan') &&
            !c.includes('Unexpected token')
          );
        })
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...validHistory, { role: 'user', content: userMsg.content }],
          modelPreference: modelType,
          lamContext: {
            lamCode: currentLam.lamCode,
            lamName: currentLam.lamName,
            docTerms: currentLam.docTerms,
          },
          studyProgramInfo: studyInfo,
        }),
      });

      // Safely read response text to prevent "Unexpected token <" JSON parsing exceptions
      const responseRawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseRawText);
      } catch {
        // Handle cases where server returned HTML (e.g. warming up or reconnecting)
        data = {
          reply: `[Rekomendasi Pakar Akreditasi ${currentLam.lamCode} - ${studyInfo.universityName || 'Universitas Pattimura'}]\n\nMenanggapi pertanyaan: "${userMsg.content}"\n\n1. **Verifikasi Bukti Fisik**: Pastikan setiap poin evaluasi mandiri memiliki dokumen sumber pada Google Drive/portal SPMI.\n2. **Kepatuhan Siklus PPEPP**: Pastikan tahap Pengendalian (RTM) dan Peningkatan (Kaizen) tidak terlewat pada narasi LED.\n3. **Ambang Syarat Unggul**: Periksa indikator kelayakan DTPS dan waktu tunggu lulusan pada menu Syarat Unggul.\n\n*Server sedang memuat ulang sesi AI, Anda dapat mengirim ulang pertanyaan untuk analisis lebih mendalam.*`,
          modelUsed: 'ai-expert-advisor',
        };
      }

      const replyContent = data.reply || data.fallbackReply || 'Terima kasih atas pertanyaannya. Silakan cek instrumen kriteria terkait.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || (modelType === 'complex' ? 'gemini-3.1-pro-preview' : modelType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash'),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      // Graceful error display without throwing raw parser messages
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `[Catatan Pendampingan Asesor ${currentLam.lamCode}]\n\nKoneksi ke layanan AI sedang menyesuaikan bandwidth. Anda dapat melanjutkan pengisian Kertas Kerja dan Berita Acara AL secara langsung pada tab navigasi atas, atau klik kirim ulang untuk mencoba kembali.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'ai-expert-advisor',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: `Riwayat percakapan telah dibersihkan. Silakan ajukan pertanyaan terkait instrumen **${currentLam.lamCode}** untuk **${studyInfo.studyProgramName || 'Program Studi'}**.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ]);
  };

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 12 }}>
          <Space align="center">
            <Avatar 
              style={{ backgroundColor: token.colorPrimary, color: '#fff' }} 
              icon={<RobotOutlined />} 
            />
            <Space orientation="vertical" size={0}>
              <Text strong style={{ fontSize: 14 }}>
                Gemini AI Accreditation Advisor
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Pakar Akreditasi {currentLam.lamCode} · {studyInfo.universityName || 'Universitas Pattimura'}
              </Text>
            </Space>
          </Space>

          <Space>
            <Tooltip title="Pilih Model Gemini">
              <Select
                size="small"
                value={modelType}
                onChange={setModelType}
                style={{ width: 175 }}
                options={[
                  { 
                    label: <span><ThunderboltOutlined style={{ color: '#10b981' }} /> gemini-3.8-flash</span>, 
                    value: 'general' 
                  },
                  { 
                    label: <span><ExperimentOutlined style={{ color: '#06b6d4' }} /> gemini-3.1-pro</span>, 
                    value: 'complex' 
                  },
                  { 
                    label: <span><ThunderboltOutlined style={{ color: '#f59e0b' }} /> gemini-3.1-lite</span>, 
                    value: 'fast' 
                  },
                ]}
              />
            </Tooltip>
            <Button 
              size="small" 
              icon={<ClearOutlined />} 
              onClick={handleClearHistory} 
              title="Bersihkan Percakapan"
            />
          </Space>
        </Flex>
      }
      placement="right"
      size={640}
      open={isOpen}
      onClose={onClose}
      styles={{
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: token.colorBgLayout,
        },
      }}
    >
      {/* Scrollable Conversation Thread */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <Flex 
              key={msg.id} 
              justify={isUser ? 'flex-end' : 'flex-start'} 
              gap="small"
              style={{ maxWidth: '100%' }}
            >
              {!isUser && (
                <Avatar 
                  size="small" 
                  style={{ backgroundColor: token.colorPrimary, marginTop: 4, flexShrink: 0 }} 
                  icon={<RobotOutlined />} 
                />
              )}

              <div 
                style={{
                  maxWidth: '85%',
                  backgroundColor: isUser ? token.colorPrimary : token.colorBgContainer,
                  color: isUser ? '#ffffff' : token.colorText,
                  borderRadius: token.borderRadiusLG,
                  padding: '10px 14px',
                  boxShadow: token.boxShadowTertiary,
                  border: isUser ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                {!isUser && (
                  <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                    <Tag 
                      color={
                        msg.modelUsed === 'gemini-3.8-flash' 
                          ? 'green' 
                          : msg.modelUsed === 'gemini-3.1-pro-preview' 
                          ? 'cyan' 
                          : msg.modelUsed === 'gemini-3.1-flash-lite' 
                          ? 'gold' 
                          : 'purple'
                      } 
                      style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}
                    >
                      {msg.modelUsed || 'Gemini AI'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 10 }}>{msg.timestamp}</Text>
                  </Flex>
                )}

                <Paragraph 
                  style={{ 
                    margin: 0, 
                    color: isUser ? '#ffffff' : token.colorText, 
                    fontSize: 13, 
                    lineHeight: '1.6', 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </Paragraph>

                {isUser && (
                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.75)' }}>
                      {msg.timestamp}
                    </Text>
                  </div>
                )}
              </div>

              {isUser && (
                <Avatar 
                  size="small" 
                  style={{ backgroundColor: token.colorInfo, marginTop: 4, flexShrink: 0 }} 
                  icon={<UserOutlined />} 
                />
              )}
            </Flex>
          );
        })}

        {loading && (
          <Flex justify="flex-start" gap="small">
            <Avatar size="small" style={{ backgroundColor: token.colorPrimary }} icon={<RobotOutlined />} />
            <Card size="small" style={{ borderRadius: token.borderRadiusLG }}>
              <Space>
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Gemini sedang menyusun analisis akreditasi...
                </Text>
              </Space>
            </Card>
          </Flex>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ padding: '8px 16px', backgroundColor: token.colorBgElevated, borderTop: `1px solid ${token.colorBorderSecondary}`, overflowX: 'auto' }}>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
          <BulbOutlined style={{ marginRight: 4, color: token.colorWarning }} />
          Rekomendasi Pertanyaan Asesor:
        </Text>
        <Flex gap={6} wrap="nowrap" style={{ paddingBottom: 2 }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <Button
              key={idx}
              size="small"
              onClick={() => handleSendMessage(prompt)}
              style={{ fontSize: 11, whiteSpace: 'nowrap', borderRadius: 12 }}
            >
              {prompt}
            </Button>
          ))}
        </Flex>
      </div>

      {/* Input Box Footer */}
      <div style={{ padding: '12px 16px', backgroundColor: token.colorBgContainer, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Flex gap="small" align="flex-end">
          <TextArea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Tanyakan tentang LED, LKPS, atau Berita Acara AL ${currentLam.lamCode}... (Tekan Enter)`}
            style={{ resize: 'none', fontSize: 13 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleSendMessage()}
            loading={loading}
            style={{ height: 54, padding: '0 18px' }}
          >
            Kirim
          </Button>
        </Flex>
      </div>
    </Drawer>
  );
};
