import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Typography,
  Space,
  Alert,
  Card,
  Tag,
  Divider,
  message,
  Avatar,
  Flex,
  Row,
  Col,
  theme,
} from 'antd';
import {
  CloudSyncOutlined,
  GoogleOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { auth, signInWithGoogle, logoutFirebase, saveAssessmentToFirestore, loadAssessmentFromFirestore } from '../utils/firebaseClient';
import { onAuthStateChanged, User } from 'firebase/auth';

const { Title, Text, Paragraph } = Typography;

interface FirebaseCloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssessmentData: {
    studyPrograms: any;
    allAssessments: any;
    globalVariables: any;
    evidenceLists: any;
    currentLamCode: string;
    activeRole: string;
  };
  onRestoreFromCloud: (payload: any) => void;
}

export const FirebaseCloudSyncModal: React.FC<FirebaseCloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentAssessmentData,
  onRestoreFromCloud,
}) => {
  const { token } = theme.useToken();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setLoadingAuth(true);
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      message.success(`Berhasil login dengan Google: ${user.email}`);
    } catch (err: any) {
      message.error(`Gagal login Google: ${err.message || 'Kesalahan autentikasi'}`);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      setCurrentUser(null);
      message.success('Berhasil logout dari akun Firebase.');
    } catch (err: any) {
      message.error('Gagal logout.');
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentUser) {
      message.warning('Silakan login dengan Google terlebih dahulu.');
      return;
    }
    setSyncing(true);
    try {
      await saveAssessmentToFirestore(currentUser.uid, currentAssessmentData);
      message.success('Progres asesmen berhasil disimpan ke database cloud Firebase Firestore!');
    } catch (err: any) {
      message.error(`Gagal menyimpan ke cloud: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!currentUser) {
      message.warning('Silakan login dengan Google terlebih dahulu.');
      return;
    }
    setRestoring(true);
    try {
      const data = await loadAssessmentFromFirestore(currentUser.uid);
      if (data) {
        onRestoreFromCloud(data);
        message.success('Progres asesmen berhasil dipulihkan dari database cloud Firebase!');
        onClose();
      } else {
        message.info('Belum ada data tersimpan di cloud untuk akun ini.');
      }
    } catch (err: any) {
      message.error(`Gagal memuat dari cloud: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <Space>
          <DatabaseOutlined style={{ color: '#10b981', fontSize: 20 }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>Koneksi Database Cloud Firebase &amp; Auth</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              Simpan dan sinkronkan progres kertas kerja asesmen LAM-PTIP secara aman ke Firestore
            </Text>
          </div>
        </Space>
      }
      width={640}
      footer={null}
    >
      <div style={{ padding: '8px 0' }}>
        {/* Auth Status Card */}
        <Card
          size="small"
          style={{
            backgroundColor: '#0f172a',
            borderColor: currentUser ? '#10b981' : '#334155',
            marginBottom: 20,
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
            <Space align="center" size="middle">
              {currentUser?.photoURL ? (
                <Avatar src={currentUser.photoURL} size={44} />
              ) : (
                <Avatar icon={<GoogleOutlined />} size={44} style={{ backgroundColor: '#4f46e5' }} />
              )}
              <div>
                <Text strong style={{ fontSize: 14, color: '#f8fafc', display: 'block' }}>
                  {currentUser ? currentUser.displayName || 'Asesor Terverifikasi' : 'Belum Login ke Akun Firebase'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {currentUser ? currentUser.email : 'Autentikasi Google diperlukan untuk sinkronisasi cloud'}
                </Text>
              </div>
            </Space>

            <div>
              {currentUser ? (
                <Button
                  danger
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<GoogleOutlined />}
                  loading={loadingAuth}
                  onClick={handleGoogleLogin}
                  style={{ backgroundColor: '#ea4335', borderColor: '#ea4335', fontWeight: 600 }}
                >
                  Login dengan Google
                </Button>
              )}
            </div>
          </Flex>
        </Card>

        {/* Sync Actions */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  <CloudUploadOutlined style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: 600 }}>Simpan ke Cloud (Backup)</span>
                </Space>
              }
              style={{ height: '100%', borderColor: '#10b981', backgroundColor: '#0b1120' }}
            >
              <Paragraph style={{ fontSize: 12, color: '#94a3b8' }}>
                Unggah seluruh progres isian skor, rumus kuantitatif, catatan temuan, &amp; dokumen ke cloud database Firebase Firestore Anda.
              </Paragraph>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                block
                loading={syncing}
                disabled={!currentUser}
                onClick={handleSaveToCloud}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600, marginTop: 16 }}
              >
                Simpan ke Firebase Cloud
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              size="small"
              title={
                <Space>
                  <CloudDownloadOutlined style={{ color: '#06b6d4' }} />
                  <span style={{ fontWeight: 600 }}>Pulihkan dari Cloud (Restore)</span>
                </Space>
              }
              style={{ height: '100%', borderColor: '#06b6d4', backgroundColor: '#0b1120' }}
            >
              <Paragraph style={{ fontSize: 12, color: '#94a3b8' }}>
                Tarik dan pulihkan kembali progres penilaian kertas kerja Anda yang tersimpan di server cloud Firebase.
              </Paragraph>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                block
                loading={restoring}
                disabled={!currentUser}
                onClick={handleLoadFromCloud}
                style={{ backgroundColor: '#06b6d4', borderColor: '#06b6d4', fontWeight: 600, marginTop: 16 }}
              >
                Muat dari Firebase Cloud
              </Button>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '18px 0 12px', borderColor: '#1e293b' }} />

        <Alert
          type="success"
          showIcon
          title="Database Terhubung &amp; Diamankan dengan Aturan Zero-Trust"
          description="Aplikasi simak-lamptip telah berhasil dikonfigurasi dengan Cloud Firestore Enterprise Edition dan Firebase Authentication (Google Sign-In). Data setiap asesor terisolasi secara aman dan terenkripsi."
          style={{ fontSize: 12, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: '#047857', color: '#a7f3d0' }}
        />
      </div>
    </Modal>
  );
};
