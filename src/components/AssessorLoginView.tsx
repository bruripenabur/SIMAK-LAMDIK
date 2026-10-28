import React, { useState } from 'react';
import {
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Tag,
  Segmented,
  Divider,
  Select,
  message,
} from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  KeyOutlined,
  CrownOutlined,
  TeamOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
} from '@ant-design/icons';
import {
  AssessorAccount,
  findAssessorByNumber,
  saveAssessorSession,
} from '../data/dummyAssessors';
import { LAMPTIP_PRODI_REGISTRY, ProdiRegistryItem } from '../data/lamPtipProdiRegistry';

const { Title, Text } = Typography;

interface AssessorLoginViewProps {
  onLoginSuccess: (assessor: AssessorAccount, selectedProdi?: ProdiRegistryItem) => void;
  onLoginAdmin?: () => void;
}

export const AssessorLoginView: React.FC<AssessorLoginViewProps> = ({
  onLoginSuccess,
  onLoginAdmin,
}) => {
  const [assessorNumber, setAssessorNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedLam] = useState<string>('LAMDIK');
  const [selectedProdiName, setSelectedProdiName] = useState<string>('');
  const [matchedAssessor, setMatchedAssessor] = useState<AssessorAccount | null>(null);
  const [assessorRoleType, setAssessorRoleType] = useState<'lead' | 'member'>('lead');
  const [notFound, setNotFound] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Otomatis mencari dan menampilkan Nama Lengkap Asesor saat Nomor Asesor diketikkan
  const handleNumberChange = (value: string) => {
    setAssessorNumber(value);
    setErrorText(null);
    const trimmed = value.trim();

    if (!trimmed) {
      setFullName('');
      setMatchedAssessor(null);
      setNotFound(false);
      return;
    }

    const matched = findAssessorByNumber(trimmed);
    if (matched) {
      setFullName(matched.fullName);
      setMatchedAssessor(matched);
      setAssessorRoleType(matched.role === 'asesor2' ? 'member' : 'lead');
      setNotFound(false);
    } else {
      setFullName('');
      setMatchedAssessor(null);
      setNotFound(true);
    }
  };

  const handleLogin = () => {
    setErrorText(null);
    if (!assessorNumber.trim()) {
      setErrorText('Silakan ketikkan Kode Nomor Asesor.');
      return;
    }

    if (!matchedAssessor) {
      setErrorText('Kode Nomor Asesor Tidak Terdaftar');
      return;
    }

    if (!selectedProdiName.trim()) {
      setErrorText('Silakan pilih atau ketik Program Studi yang akan diasesi.');
      return;
    }

    const targetRole = assessorRoleType === 'lead' ? 'asesor1' : 'asesor2';
    const roleTitle = assessorRoleType === 'lead' ? 'Lead Asesor (Asesor 1)' : 'Member Asesor (Asesor 2)';

    const updatedAccount: AssessorAccount = {
      ...matchedAssessor,
      role: targetRole,
      roleTitle,
    };

    saveAssessorSession(updatedAccount);
    message.success(`Berhasil masuk sebagai ${updatedAccount.fullName} (${roleTitle})`);
    
    // Find selected prodi object
    const prodiObj = LAMPTIP_PRODI_REGISTRY.find(p => p.namaProgramStudi === selectedProdiName);
    onLoginSuccess(updatedAccount, prodiObj);
  };

  const handleAdminAuth = () => {
    setAdminError(null);
    if (adminPassword === 'admin123' || adminPassword === 'lamdik2026') {
      message.success('Berhasil masuk sebagai Administrator.');
      if (onLoginAdmin) onLoginAdmin();
    } else {
      setAdminError('Password Admin Salah (Gunakan: admin123)');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070b14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#f8fafc',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            backgroundColor: '#ffffff',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            padding: 6,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
          }}
        >
          <img
            src="/logo_unpatti.png"
            alt="Logo Universitas Pattimura"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png';
            }}
          />
        </div>
        <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
          simak-lamdik
        </Title>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>
          Sistem Simulasi Akreditasi LAMDIK · Universitas Pattimura
        </Text>
      </div>

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#0f172a',
          borderRadius: 16,
          border: '1px solid #1e293b',
          padding: '32px 28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(79, 70, 229, 0.15)',
        }}
      >
        {/* Top Icon Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              fontSize: 22,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <LoginOutlined />
          </div>
        </div>

        {/* Title: Login Asesor */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 4px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Login Asesor LAMDIK
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            Silakan masukkan Kode Nomor Asesor Anda untuk memulai asesmen
          </p>
        </div>

        {errorText && (
          <Alert
            type="error"
            showIcon
            message={errorText}
            style={{ marginBottom: 16, backgroundColor: '#450a0a', borderColor: '#7f1d1d', color: '#fca5a5' }}
          />
        )}

        {/* Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 1. Input Kode Nomor Asesor */}
          <div>
            <div style={{ marginBottom: 6 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2e8f0',
                }}
              >
                Kode Nomor Asesor
              </label>
            </div>
            <Input
              value={assessorNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              placeholder="Ketik Kode Asesor (misal: ASR-LAMDIK-001)"
              prefix={<KeyOutlined style={{ color: matchedAssessor ? '#10b981' : notFound ? '#ef4444' : '#64748b' }} />}
              size="large"
              style={{
                backgroundColor: '#090d16',
                borderColor: notFound ? '#ef4444' : matchedAssessor ? '#10b981' : '#1e293b',
                color: '#f8fafc',
                borderRadius: 8,
              }}
            />

            {/* Status Feedback: Not Found */}
            {notFound && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  backgroundColor: '#450a0a',
                  border: '1px solid #7f1d1d',
                  borderRadius: 8,
                  color: '#fca5a5',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CloseCircleFilled style={{ color: '#ef4444', fontSize: 16 }} />
                <span style={{ fontWeight: 600 }}>Kode Nomor Asesor Tidak Terdaftar</span>
              </div>
            )}

            {/* Status Feedback: Matched assessor */}
            {matchedAssessor && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  backgroundColor: '#064e3b',
                  border: '1px solid #047857',
                  borderRadius: 8,
                  color: '#a7f3d0',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircleFilled style={{ color: '#10b981' }} />
                  <span>
                    Terverifikasi: <strong>{matchedAssessor.roleTitle}</strong>
                  </span>
                </div>
                <Tag color="success" style={{ margin: 0, fontSize: 10 }}>
                  LAMDIK
                </Tag>
              </div>
            )}
          </div>

          {/* 2. Nama Lengkap Asesor */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#e2e8f0',
                marginBottom: 6,
              }}
            >
              Nama Asesor (Otomatis / Terdaftar)
            </label>
            <Input
              value={fullName}
              disabled
              placeholder="Nama Asesor akan muncul otomatis"
              prefix={<UserOutlined style={{ color: '#64748b' }} />}
              size="large"
              style={{
                backgroundColor: '#090d16',
                borderColor: '#1e293b',
                color: fullName ? '#a7f3d0' : '#64748b',
                borderRadius: 8,
              }}
            />
          </div>

          {/* 3. Pilih Program Studi yang Diasesi */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#e2e8f0',
                marginBottom: 6,
              }}
            >
              Pilih Program Studi Asesmen
            </label>
            <Select
              showSearch
              placeholder="Pilih atau cari Program Studi kependidikan..."
              optionFilterProp="children"
              value={selectedProdiName || undefined}
              onChange={(val) => setSelectedProdiName(val)}
              size="large"
              style={{ width: '100%' }}
              options={LAMPTIP_PRODI_REGISTRY.map(p => ({
                value: p.namaProgramStudi,
                label: `${p.namaProgramStudi} (${p.fakultas} - ${p.jenjang})`,
              }))}
            />
          </div>

          {/* 4. Peran Asesor (Lead / Member) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#e2e8f0',
                marginBottom: 6,
              }}
            >
              Penugasan Peran Asesor Lapangan
            </label>
            <Segmented
              block
              value={assessorRoleType}
              onChange={(val) => setAssessorRoleType(val as 'lead' | 'member')}
              options={[
                { label: 'Asesor 1 (Lead)', value: 'lead' },
                { label: 'Asesor 2 (Member)', value: 'member' },
              ]}
              style={{ backgroundColor: '#090d16', padding: 4 }}
            />
          </div>

          {/* Action Button */}
          <Button
            type="primary"
            size="large"
            onClick={handleLogin}
            style={{
              height: 48,
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              marginTop: 6,
            }}
          >
            Masuk Kertas Kerja Asesmen LAMDIK
          </Button>

          <Divider style={{ borderColor: '#1e293b', margin: '12px 0' }} />

          {/* Admin Bypass / Login Section */}
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CrownOutlined style={{ color: '#f43f5e' }} />
              <span>Akses Khusus Administrator SIMAK</span>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input.Password
                placeholder="Password Admin (admin123)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onPressEnter={handleAdminAuth}
                style={{ backgroundColor: '#090d16', borderColor: '#1e293b', color: '#f8fafc' }}
              />
              <Button
                type="primary"
                onClick={handleAdminAuth}
                style={{
                  backgroundColor: '#db2777',
                  borderColor: '#db2777',
                  fontWeight: 600,
                }}
              >
                Masuk Admin
              </Button>
            </Space.Compact>
            {adminError && (
              <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>
                {adminError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        simak-lamdik • Universitas Pattimura • Instrumen Akreditasi LAMDIK
      </div>
    </div>
  );
};
