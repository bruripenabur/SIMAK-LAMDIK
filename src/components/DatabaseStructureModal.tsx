import React from 'react';
import {
  Modal,
  Typography,
  Space,
  Card,
  Tag,
  Tabs,
  Divider,
  Alert,
  Flex,
  theme,
} from 'antd';
import {
  DatabaseOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined,
  TableOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface DatabaseStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStructureModal: React.FC<DatabaseStructureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <Space>
          <DatabaseOutlined style={{ color: '#10b981', fontSize: 20 }} />
          <div>
            <Text strong style={{ fontSize: 16 }}>Struktur Database Cloud Firestore (simak-lamptip)</Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              Panduan arsitektur database, koleksi, skema dokumen, &amp; aturan keamanan untuk dikelola
            </Text>
          </div>
        </Space>
      }
      width={760}
      footer={null}
    >
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="info"
          showIcon
          title="Arsitektur Cloud Firestore Enterprise"
          description="Aplikasi simak-lamptip menggunakan Google Cloud Firestore sebagai database NoSQL real-time terdistribusi dengan enkripsi penuh dan Zero-Trust Access Control."
          style={{ marginBottom: 16, fontSize: 12 }}
        />

        <Tabs
          defaultActiveKey="collections"
          items={[
            {
              key: 'collections',
              label: (
                <Space>
                  <CloudServerOutlined />
                  <span>Koleksi &amp; Dokumen</span>
                </Space>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Card size="small" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                        /assessment_sessions/{'{sessionId}'}
                      </Text>
                      <Tag color="green">Primary Collection</Tag>
                    </div>
                    <Paragraph style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      Koleksi utama yang menyimpan seluruh sesi asesmen lapangan LAM-PTIP per pengguna / asesor. Setiap dokumen merepresentasikan satu state lengkap instrumen akreditasi.
                    </Paragraph>
                  </Card>

                  <Card size="small" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                        /test/connection
                      </Text>
                      <Tag color="cyan">System Health Check</Tag>
                    </div>
                    <Paragraph style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      Path uji konektivitas server saat aplikasi melakukan boot / verifikasi latensi jaringan ke Firestore.
                    </Paragraph>
                  </Card>
                </div>
              ),
            },
            {
              key: 'schema',
              label: (
                <Space>
                  <CodeOutlined />
                  <span>Skema Dokumen (JSON)</span>
                </Space>
              ),
              children: (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Struktur field yang tersimpan di dalam dokumen <code style={{ color: '#34d399' }}>assessment_sessions</code>:
                  </Text>
                  <pre
                    style={{
                      backgroundColor: '#030712',
                      color: '#34d399',
                      padding: 14,
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      maxHeight: 320,
                      overflowY: 'auto',
                      border: '1px solid #1e293b',
                    }}
                  >
{`{
  "userId": "string (Firebase Auth UID - wajib sama dengan request.auth.uid)",
  "updatedAt": "string (ISO 8601 Timestamp, cth: '2026-10-26T18:00:00.000Z')",
  "studyPrograms": {
    "LAM PTIP": {
      "universityName": "Universitas Pattimura",
      "facultyName": "Fakultas Pertanian",
      "studyProgramName": "S1 Penyuluhan Pertanian",
      "degreeLevel": "S1",
      "accreditationTarget": "Unggul",
      "asesor1Name": "Prof. Dr. Natelda Timisela",
      "asesor2Name": "Dr. Bruri Melky Laimeheriwa, M.Si."
    }
  },
  "allAssessments": {
    "LAM PTIP": {
      "ptip-ind-1": {
        "indicatorId": "ptip-ind-1",
        "scoreSelf": 4,
        "scoreAsesor1": 4,
        "scoreAsesor2": 4,
        "scoreConsensus": 4,
        "notesAsesor1": "Terverifikasi lengkap...",
        "evidenceChecked": true
      }
    }
  },
  "globalVariables": {
    "PTW": 82.5,
    "PPS": 91.0,
    "WT": 3.5,
    "PDGBLKL": 60.0
  },
  "evidenceLists": {
    "LAM PTIP": [
      {
        "id": "ev-1",
        "title": "Dokumen LKPS 3 Tahun Terakhir",
        "url": "https://drive.google.com/...",
        "category": "LKPS"
      }
    ]
  }
}`}
                  </pre>
                </div>
              ),
            },
            {
              key: 'rules',
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  <span>Aturan Keamanan (Rules)</span>
                </Space>
              ),
              children: (
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    File <code style={{ color: '#f472b6' }}>firestore.rules</code> (Zero-Trust ABAC &amp; Anti-Update-Gap):
                  </Text>
                  <pre
                    style={{
                      backgroundColor: '#030712',
                      color: '#f472b6',
                      padding: 14,
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      maxHeight: 320,
                      overflowY: 'auto',
                      border: '1px solid #1e293b',
                    }}
                  >
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isValidAssessmentSession(data) {
      return data.keys().hasAll(['userId', 'updatedAt']) &&
             data.keys().hasOnly(['userId', 'updatedAt', 'studyPrograms', 'allAssessments', 'globalVariables', 'evidenceLists']) &&
             data.userId is string && data.userId == request.auth.uid &&
             data.updatedAt is string && data.updatedAt.size() <= 64;
    }

    match /assessment_sessions/{sessionId} {
      allow get, list: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() && isValidId(sessionId) && isValidAssessmentSession(request.resource.data);
      allow update: if isSignedIn() && isValidId(sessionId) && resource.data.userId == request.auth.uid && isValidAssessmentSession(request.resource.data) && request.resource.data.userId == resource.data.userId;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
  }
}`}
                  </pre>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
};
