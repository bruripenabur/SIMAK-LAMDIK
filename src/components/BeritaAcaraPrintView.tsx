import React from 'react';
import { 
  Modal, 
  Button, 
  Table, 
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
import { PrinterOutlined, FileDoneOutlined, FilePdfOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnsType } from 'antd/es/table';
import { LamProfile, StudyProgramInfo, AssessmentRecord, SyaratEvaluationResult } from '../types/accreditation';

const { Title, Text, Paragraph } = Typography;

interface BeritaAcaraPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentLam: LamProfile;
  studyInfo: StudyProgramInfo;
  assessmentRecords: Record<string, AssessmentRecord>;
  syaratEvaluations: SyaratEvaluationResult[];
  overallScore: number;
  finalRank: 'UNGGUL (5 TAHUN)' | 'UNGGUL (3 TAHUN)' | 'TERAKREDITASI' | 'TIDAK TERAKREDITASI';
  overallQualified: boolean;
}

export const BeritaAcaraPrintView: React.FC<BeritaAcaraPrintViewProps> = ({
  isOpen,
  onClose,
  currentLam,
  studyInfo,
  assessmentRecords,
  syaratEvaluations,
  overallScore,
  finalRank,
  overallQualified,
}) => {
  const { token } = theme.useToken();

  const handleDownloadPDF = () => {
    try {
      message.loading({ content: 'Membuat berkas PDF resmi Berita Acara...', key: 'exportBA' });
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedLam = currentLam.lamCode.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedProdi = (studyInfo.studyProgramName || 'Prodi').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Berita_Acara_AL_${sanitizedLam}_${sanitizedProdi}_${timestamp}.pdf`;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Kop Resmi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(currentLam.lamName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(`LEMBAGA AKREDITASI MANDIRI PENDIDIKAN TINGGI (${currentLam.lamCode})`, pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Perguruan Tinggi: ${studyInfo.universityName || 'Universitas Pattimura'} · ${studyInfo.facultyName || 'Fakultas'}`, pageWidth / 2, 25, { align: 'center' });

      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.8);
      doc.line(14, 28, pageWidth - 14, 28);
      doc.setLineWidth(0.3);
      doc.line(14, 29.5, pageWidth - 14, 29.5);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text('BERITA ACARA ASESMEN LAPANGAN (AL)', pageWidth / 2, 36, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`Nomor Surat Tugas: ${studyInfo.skPenugasanNo}`, pageWidth / 2, 42, { align: 'center' });

      // Preamble
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);
      const preamble = `Pada hari ini, dalam rangka Akreditasi Program Studi ${studyInfo.studyProgramName} (${studyInfo.degreeLevel}) pada ${studyInfo.universityName || 'Universitas Pattimura'}, Tim Asesor ${currentLam.lamCode} telah melaksanakan Asesmen Lapangan (AL) dan menyepakati berita acara hasil asesmen:`;
      const splitPreamble = doc.splitTextToSize(preamble, pageWidth - 28);
      doc.text(splitPreamble, 14, 48);

      let currentY = 48 + (splitPreamble.length * 4.2);

      // Table Data
      autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.2, textColor: [31, 41, 55] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 4 } },
        body: [
          ['Perguruan Tinggi', ':', studyInfo.universityName || 'Universitas Pattimura'],
          ['Unit Pengelola / Fakultas', ':', studyInfo.facultyName || '-'],
          ['Program Studi', ':', `${studyInfo.studyProgramName} (${studyInfo.degreeLevel})`],
          ['Target Akreditasi', ':', `${studyInfo.accreditationTarget} (Hasil: ${finalRank})`],
          ['Tanggal AL', ':', `${studyInfo.assessmentDateStart} s.d. ${studyInfo.assessmentDateEnd}`],
          ['Tim Asesor 1', ':', `${studyInfo.asesor1Name} (${studyInfo.asesor1Institution})`],
          ['Tim Asesor 2', ':', `${studyInfo.asesor2Name} (${studyInfo.asesor2Institution})`],
        ],
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;

      // Kriteria Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text('I. RANGKUMAN PENILAIAN KRITERIA AKREDITASI', 14, currentY);

      currentY += 3;

      const kriteriaRows = (currentLam.kriteriaList || []).map((k) => {
        const related = currentLam.indicators.filter(i => i.kriteriaNumber === k.number);
        const scores = related.map(i => {
          const rec = assessmentRecords[i.id];
          return rec ? (rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0) : 0;
        });
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return [
          k.number.toString(),
          k.title,
          `${k.totalWeight}%`,
          avg.toFixed(2),
          avg >= 3.5 ? 'Unggul' : avg >= 3.0 ? 'Baik Sekali' : 'Baik'
        ];
      });

      kriteriaRows.push([
        { content: `Total Skor: ${overallScore.toFixed(2)} / 400 | Syarat Perlu: ${overallQualified ? 'MEMENUHI' : 'BELUM'} | Peringkat: ${finalRank.toUpperCase()}`, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] } } as any
      ]);

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [31, 41, 55] },
        head: [['No', 'Kriteria Penilaian', 'Bobot', 'Skor Rerata', 'Kategori']],
        body: kriteriaRows,
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Ambon, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, pageWidth - 65, currentY);
      currentY += 4;
      doc.text('Tim Asesor Akreditasi,', 20, currentY);
      doc.text('Pimpinan UPPS / Dekan,', pageWidth - 75, currentY);

      currentY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text(studyInfo.asesor1Name, 20, currentY);
      doc.text(studyInfo.dekanOrKaprodiName || 'Dekan / Kaprodi', pageWidth - 75, currentY);

      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Asesor 1 (${studyInfo.asesor1Institution})`, 20, currentY);
      doc.text(studyInfo.facultyName || '-', pageWidth - 75, currentY);

      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(studyInfo.asesor2Name, 20, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Asesor 2 (${studyInfo.asesor2Institution})`, 20, currentY);

      doc.save(filename);
      message.success({ content: `Dokumen Berita Acara AL berhasil diunduh (${filename})!`, key: 'exportBA' });
    } catch (e: any) {
      message.error({ content: `Gagal mengekspor PDF: ${e.message || 'Kesalahan sistem'}`, key: 'exportBA' });
    }
  };

  const handlePrint = () => {
    try {
      message.loading({ content: 'Mempersiapkan dokumen cetak & mengunduh PDF resmi...', key: 'printBA', duration: 2 });
      
      // 1. Ekspor & Unduh PDF Resmi (pasti tersimpan ke perangkat)
      handleDownloadPDF();

      // 2. Langsung panggil dialog cetak browser
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Print execution:', err);
        }
        message.success({ 
          content: 'Dokumen Berita Acara AL siap dicetak! Berkas PDF resmi telah berhasil diunduh otomatis.', 
          key: 'printBA', 
          duration: 4 
        });
      }, 350);
    } catch (e: any) {
      console.error(e);
      window.print();
    }
  };

  // Kriteria Summary Table Columns
  const kriteriaColumns: ColumnsType<any> = [
    {
      title: 'No',
      dataIndex: 'number',
      key: 'number',
      width: 50,
      align: 'center',
    },
    {
      title: 'Kriteria Penilaian',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Bobot',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 90,
      align: 'center',
    },
    {
      title: 'Rerata Skor (0-4)',
      key: 'avgScore',
      width: 130,
      align: 'center',
      render: (_val, record) => {
        const related = currentLam.indicators.filter(i => i.kriteriaNumber === record.number);
        const scores = related.map(i => {
          const rec = assessmentRecords[i.id];
          return rec ? (rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0) : 0;
        });
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return <Text strong style={{ fontFamily: 'monospace' }}>{avg.toFixed(2)}</Text>;
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileDoneOutlined style={{ color: token.colorPrimary }} />
          <span>Pratinjau Dokumen Resmi: Berita Acara Asesmen Lapangan (AL)</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button 
          key="pdf" 
          type="primary" 
          icon={<FilePdfOutlined />} 
          onClick={handleDownloadPDF}
          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
        >
          Unduh PDF Resmi (jsPDF)
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ fontWeight: 600 }}>
          Cetak Dokumen Sekarang
        </Button>,
      ]}
      style={{ top: 20 }}
    >
      <div id="printable-ba-view-content" style={{ backgroundColor: '#ffffff', color: '#111827', padding: '32px', borderRadius: 8 }}>
        {/* Kop Surat Resmi */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '2px solid #111827', paddingBottom: 16 }}>
          <img 
            src="/logo_unpatti.png" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png";
            }}
            alt="Logo Unpatti" 
            style={{ width: 60, height: 60, objectFit: 'contain' }} 
          />
          <div style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 1, color: '#111827' }}>
              {currentLam.lamName} ({currentLam.lamCode})
            </Title>
            <Text style={{ fontSize: 13, color: '#4b5563', display: 'block', fontWeight: 600 }}>
              Sekretariat Dewan Eksekutif Akreditasi Program Studi Pendidikan Tinggi
            </Text>
            <Text italic style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>
              Landasan Regulasi: {currentLam.regulationBasis} · Universitas Pattimura
            </Text>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Title level={5} style={{ margin: 0, textDecoration: 'underline', textTransform: 'uppercase', color: '#111827' }}>
            BERITA ACARA ASESMEN LAPANGAN (AL)
          </Title>
          <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
            Nomor Penugasan: {studyInfo.skPenugasanNo}
          </Text>
        </div>

        {/* Preamble Narrative */}
        <Paragraph style={{ textAlign: 'justify', fontSize: 13, lineHeight: '1.7', color: '#1f2937' }}>
          Pada hari ini, tanggal <strong>16 Oktober 2026</strong>, telah dilaksanakan Asesmen Lapangan (AL) secara luring/daring dalam rangka Akreditasi Program Studi oleh Tim Asesor {currentLam.lamCode} terhadap:
        </Paragraph>

        {/* Study Program Details Table */}
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 16, color: '#1f2937' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0', width: 200, fontWeight: 600 }}>Perguruan Tinggi</td>
              <td>: {studyInfo.universityName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0', fontWeight: 600 }}>Fakultas / UPPS</td>
              <td>: {studyInfo.facultyName}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0', fontWeight: 600 }}>Program Studi</td>
              <td>: {studyInfo.studyProgramName} ({studyInfo.degreeLevel})</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 0', fontWeight: 600 }}>Jadwal Pelaksanaan AL</td>
              <td>: {studyInfo.assessmentDateStart} s/d {studyInfo.assessmentDateEnd}</td>
            </tr>
          </tbody>
        </table>

        {/* Assessors */}
        <Paragraph style={{ fontSize: 13, margin: '8px 0', color: '#1f2937' }}>
          Dengan Tim Asesor yang ditugaskan:
        </Paragraph>
        <ol style={{ fontSize: 13, paddingLeft: 20, margin: '4px 0 20px', color: '#1f2937' }}>
          <li>
            <strong>{studyInfo.asesor1Name}</strong> ({studyInfo.asesor1Institution}) - <em>Asesor 1 (Ketua Tim)</em>
          </li>
          <li>
            <strong>{studyInfo.asesor2Name}</strong> ({studyInfo.asesor2Institution}) - <em>Asesor 2 (Anggota Tim)</em>
          </li>
        </ol>

        {/* Section I: Rekapitulasi Kriteria */}
        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: 6, color: '#111827' }}>
            I. Rekapitulasi Penilaian Kertas Kerja AL
          </Title>

          <Table
            rowKey="number"
            columns={kriteriaColumns}
            dataSource={currentLam.kriteriaList}
            pagination={false}
            size="small"
            bordered
            style={{ marginBottom: 12 }}
            summary={() => (
              <Table.Summary.Row style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0} colSpan={2} align="right">
                  TOTAL SKOR TERBOBOT ASESMEN LAPANGAN (SKALA 0 - 400):
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2} align="center">
                  <Text strong style={{ fontSize: 15, fontFamily: 'monospace', color: '#047857' }}>
                    {overallScore.toFixed(1)} / 400.0
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </div>

        {/* Section II: Syarat Unggul Gatekeeper */}
        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ textTransform: 'uppercase', borderBottom: '1px solid #d1d5db', paddingBottom: 6, color: '#111827' }}>
            II. Hasil Evaluasi Syarat Perlu Unggul
          </Title>

          <table style={{ width: '100%', fontSize: 12, border: '1px solid #9ca3af', borderCollapse: 'collapse', color: '#111827' }}>
            <thead style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: 8, border: '1px solid #9ca3af', width: 40, textAlign: 'center' }}>No</th>
                <th style={{ padding: 8, border: '1px solid #9ca3af' }}>Indikator Gatekeeper</th>
                <th style={{ padding: 8, border: '1px solid #9ca3af' }}>Capaian Aktual</th>
                <th style={{ padding: 8, border: '1px solid #9ca3af', width: 140, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {syaratEvaluations.map((se, idx) => (
                <tr key={se.rule.id}>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af' }}>
                    {se.rule.indicatorName} ({se.rule.indicatorKey})
                  </td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', fontFamily: 'monospace' }}>
                    {se.actualValueText}
                  </td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ color: se.passed ? '#047857' : '#b91c1c' }}>
                      {se.passed ? '✓ MEMENUHI' : '✗ TIDAK MEMENUHI'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section III: Rekomendasi Peringkat */}
        <div style={{ marginTop: 24, padding: 16, border: '2px solid #111827', borderRadius: 6, textAlign: 'center' }}>
          <Text style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#4b5563', display: 'block' }}>
            REKOMENDASI PERINGKAT HASIL ASESMEN LAPANGAN:
          </Text>
          <Title level={3} style={{ margin: '8px 0', textTransform: 'uppercase', color: '#111827' }}>
            {finalRank}
          </Title>
          <Text style={{ fontSize: 12, color: '#4b5563' }}>
            {overallQualified 
              ? 'Memenuhi seluruh kriteria numerik dan syarat perlu unggul yang dipersyaratkan.'
              : 'Ditetapkan berdasarkan pemenuhan ambang batas atau degradasi syarat perlu unggul.'}
          </Text>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: 40 }}>
          <Text style={{ fontSize: 12, display: 'block', textAlign: 'right', fontStyle: 'italic', marginBottom: 20 }}>
            Ditetapkan di: {studyInfo.universityName.split(' ')[1] || 'Kampus Utama'}, tanggal 16 Oktober 2026
          </Text>

          <Row gutter={24} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <Text strong style={{ display: 'block', marginBottom: 60 }}>Asesor 1 (Ketua Tim):</Text>
              <div style={{ borderTop: '1px solid #111827', paddingTop: 6 }}>
                <Text strong style={{ display: 'block' }}>{studyInfo.asesor1Name}</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>{studyInfo.asesor1Institution}</Text>
              </div>
            </Col>
            <Col span={8}>
              <Text strong style={{ display: 'block', marginBottom: 60 }}>Asesor 2 (Anggota Tim):</Text>
              <div style={{ borderTop: '1px solid #111827', paddingTop: 6 }}>
                <Text strong style={{ display: 'block' }}>{studyInfo.asesor2Name}</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>{studyInfo.asesor2Institution}</Text>
              </div>
            </Col>
            <Col span={8}>
              <Text strong style={{ display: 'block', marginBottom: 60 }}>Pimpinan UPPS / Dekan:</Text>
              <div style={{ borderTop: '1px solid #111827', paddingTop: 6 }}>
                <Text strong style={{ display: 'block' }}>{studyInfo.dekanOrKaprodiName}</Text>
                <Text style={{ fontSize: 11, color: '#4b5563' }}>{studyInfo.facultyName}</Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
};
