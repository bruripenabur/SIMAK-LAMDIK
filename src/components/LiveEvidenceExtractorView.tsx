import React, { useState } from 'react';
import { 
  Card, 
  Upload, 
  Table, 
  Input, 
  Select, 
  Tag, 
  Button, 
  Modal, 
  Form, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  message, 
  Tooltip, 
  Divider, 
  Statistic, 
  Dropdown, 
  Popconfirm,
  theme 
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  UploadOutlined, 
  FileTextOutlined, 
  SearchOutlined, 
  LinkOutlined, 
  CopyOutlined, 
  CheckOutlined, 
  FolderOpenOutlined, 
  GlobalOutlined, 
  DatabaseOutlined, 
  FileExcelOutlined, 
  PrinterOutlined, 
  FilePdfOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  DownloadOutlined, 
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnsType } from 'antd/es/table';
import { EvidenceLink, LamProfile, StudyProgramInfo } from '../types/accreditation';
import { parseExcelForEvidenceAndData, scanTextForEvidenceUrls, detectStudyProgramFromTextOrFile } from '../utils/evidenceExtractor';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS: { label: string; value: EvidenceLink['status']; color: string }[] = [
  { label: 'Terverifikasi Valid', value: 'valid', color: 'success' },
  { label: 'Dapat Diakses', value: 'accessible', color: 'processing' },
  { label: 'Menunggu Verifikasi', value: 'pending', color: 'warning' },
  { label: 'Perlu Konfirmasi AL', value: 'suspicious', color: 'error' },
];

interface LiveEvidenceExtractorViewProps {
  currentLam: LamProfile;
  studyInfo: StudyProgramInfo;
  evidenceList: EvidenceLink[];
  onAddEvidence: (item: EvidenceLink) => void;
  onLinkToIndicator: (evidenceId: string, indicatorId: string, indicatorCode: string) => void;
  onUpdateEvidence?: (evidenceId: string, updated: Partial<EvidenceLink>) => void;
  onDeleteEvidence?: (evidenceId: string) => void;
  onUpdateStudyInfo?: (updated: Partial<StudyProgramInfo>) => void;
}

export const LiveEvidenceExtractorView: React.FC<LiveEvidenceExtractorViewProps> = ({
  currentLam,
  studyInfo,
  evidenceList,
  onAddEvidence,
  onLinkToIndicator,
  onUpdateEvidence,
  onDeleteEvidence,
  onUpdateStudyInfo,
}) => {
  const { token } = theme.useToken();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EvidenceLink | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Excel file upload parser handler
  const handleUpload = async (file: File) => {
    try {
      message.loading({ content: `Memindai ${file.name} dengan SheetJS...`, key: 'parseExcel' });
      const result = await parseExcelForEvidenceAndData(file);
      result.evidenceLinks.forEach(item => onAddEvidence(item));

      // Automatic sync of detected study program
      if (result.detectedStudyProgramName && onUpdateStudyInfo) {
        onUpdateStudyInfo({
          studyProgramName: result.detectedStudyProgramName,
          ...(result.detectedFacultyName ? { facultyName: result.detectedFacultyName } : {}),
          ...(result.detectedDegreeLevel ? { degreeLevel: result.detectedDegreeLevel } : {}),
        });
        message.success({ 
          content: `Sukses! LKPS ${file.name} dipindai. Terdeteksi Program Studi: "${result.detectedStudyProgramName}". Profil prodi diselaraskan ke seluruh instrumen akreditasi!`, 
          key: 'parseExcel',
          duration: 4
        });
      } else {
        message.success({ 
          content: `Sukses! Memindai ${result.sheetsFound.length} sheet, ${result.cellCountScanned} sel. Ditemukan ${result.evidenceLinks.length} tautan bukti aktif.`, 
          key: 'parseExcel' 
        });
      }
    } catch (err: any) {
      message.error({ content: `Gagal memproses file: ${err.message || 'Format tidak valid'}`, key: 'parseExcel' });
    }
    return false; // Prevent automatic upload
  };

  // Dedicated LED Document file upload parser handler
  const handleUploadLED = async (file: File) => {
    try {
      message.loading({ content: `Menganalisis berkas ${file.name}...`, key: 'parseLed' });
      const detected = detectStudyProgramFromTextOrFile(file.name);
      if (detected?.studyProgramName && onUpdateStudyInfo) {
        onUpdateStudyInfo({
          studyProgramName: detected.studyProgramName,
          ...(detected.facultyName ? { facultyName: detected.facultyName } : {}),
          ...(detected.degreeLevel ? { degreeLevel: detected.degreeLevel } : {}),
        });
      }

      let extractedText = '';
      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
        extractedText = decoder.decode(buffer);
      } catch {
        extractedText = await file.text().catch(() => '');
      }

      const detectedFromContent = detectStudyProgramFromTextOrFile(extractedText);
      const prodiFound = detected?.studyProgramName || detectedFromContent?.studyProgramName || (file.name.toLowerCase().includes('peternak') || extractedText.toLowerCase().includes('peternak') ? 'Peternakan' : undefined);

      if (prodiFound && onUpdateStudyInfo) {
        onUpdateStudyInfo({
          studyProgramName: prodiFound,
          facultyName: detected?.facultyName || detectedFromContent?.facultyName || (prodiFound.toLowerCase().includes('peternak') ? 'Fakultas Pertanian' : undefined),
          degreeLevel: detected?.degreeLevel || detectedFromContent?.degreeLevel || 'S1',
        });
      }

      const links = scanTextForEvidenceUrls(extractedText, `LED (${file.name})`);
      links.forEach(l => onAddEvidence(l));
      message.success({
        content: `Berkas ${file.name} diproses! Terdeteksi Program Studi: ${prodiFound || studyInfo.studyProgramName}. Ditemukan ${links.length} tautan bukti aktif. Data prodi otomatis diselaraskan!`,
        key: 'parseLed',
        duration: 4,
      });
    } catch (err: any) {
      message.error({ content: `Gagal membaca berkas: ${err.message}`, key: 'parseLed' });
    }
    return false;
  };

  // Scan pasted text narrative handler
  const handleScanTextSubmit = (values: { narrativeText: string }) => {
    const text = values.narrativeText;
    if (!text || !text.trim()) return;

    // Detect study program from narrative
    const detected = detectStudyProgramFromTextOrFile(text);
    if (detected?.studyProgramName && onUpdateStudyInfo) {
      onUpdateStudyInfo({
        studyProgramName: detected.studyProgramName,
        ...(detected.facultyName ? { facultyName: detected.facultyName } : {}),
        ...(detected.degreeLevel ? { degreeLevel: detected.degreeLevel } : {}),
      });
      message.info(`Terdeteksi dari narasi: Program Studi "${detected.studyProgramName}". Profil prodi diselaraskan.`);
    }

    const links = scanTextForEvidenceUrls(text, `Narasi ${currentLam.docTerms.qualitativeDoc}`);
    links.forEach(l => onAddEvidence(l));
    message.success(`Ditemukan dan diekstrak ${links.length} tautan dari narasi.`);
    form.resetFields();
    setModalOpen(false);
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    message.success('Tautan berhasil disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter evidence list
  const filteredList = evidenceList.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.foundInDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.indicatorCode && item.indicatorCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || item.driveType === filterType;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics for assessor report
  const countValid = evidenceList.filter(e => e.status === 'valid').length;
  const countAccessible = evidenceList.filter(e => e.status === 'accessible').length;
  const countPending = evidenceList.filter(e => e.status === 'pending').length;
  const countSuspicious = evidenceList.filter(e => e.status === 'suspicious').length;

  // Feature: Export to Excel (.xlsx) using SheetJS
  const handleExportToExcel = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedProdi = (studyInfo.studyProgramName || 'Prodi').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Laporan_Bukti_AL_${currentLam.lamCode.replace(/[^a-zA-Z0-9]/g, '_')}_${sanitizedProdi}_${timestamp}.xlsx`;

      // Header summary rows
      const metaRows = [
        ['LAPORAN KATALOG BUKTI DOKUMEN & TAUTAN ASESMEN LAPANGAN (AL)'],
        ['Perguruan Tinggi', studyInfo.universityName || 'Universitas Pattimura'],
        ['Fakultas / UPPS', studyInfo.facultyName || '-'],
        ['Program Studi', `${studyInfo.studyProgramName || '-'} (${studyInfo.degreeLevel || 'S1'})`],
        ['Lembaga Akreditasi', `${currentLam.lamName} (${currentLam.lamCode})`],
        ['Total Bukti Terekstraksi', evidenceList.length],
        ['Terverifikasi Valid', countValid],
        ['Dapat Diakses', countAccessible],
        ['Menunggu Verifikasi', countPending],
        ['Perlu Klarifikasi', countSuspicious],
        ['Tanggal Unduh Laporan', new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })],
        [], // empty line separator
        ['No', 'Judul Dokumen Bukti', 'Tipe Cloud / Penyimpanan', 'Dokumen Asal', 'Kode Indikator Terkait', 'Status Verifikasi Asesor', 'Catatan Asesor', 'URL / Hyperlink']
      ];

      // Data rows
      const dataRows = filteredList.map((item, index) => {
        const statusLabel = 
          item.status === 'valid' ? 'Terverifikasi Valid' :
          item.status === 'accessible' ? 'Dapat Diakses' :
          item.status === 'suspicious' ? 'Perlu Konfirmasi AL' : 'Menunggu Verifikasi';

        return [
          index + 1,
          item.title,
          item.driveType || 'External Web',
          item.foundInDoc,
          item.indicatorCode || 'Belum Ditautkan',
          statusLabel,
          item.notes || '-',
          item.url
        ];
      });

      const fullSheetData = [...metaRows, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 38 }, // Judul
        { wch: 20 }, // Tipe Cloud
        { wch: 24 }, // Dokumen Asal
        { wch: 18 }, // Kode Indikator
        { wch: 22 }, // Status
        { wch: 35 }, // Catatan
        { wch: 55 }, // URL
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog_Bukti_AL');
      XLSX.writeFile(workbook, filename);

      message.success(`Katalog bukti berhasil diekspor ke Excel: ${filename}`);
    } catch (err: any) {
      message.error(`Gagal mengekspor berkas Excel: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  // Feature: Download formatted PDF Report using jsPDF & jspdf-autotable
  const handleDownloadPDFReport = () => {
    try {
      if (filteredList.length === 0) {
        message.warning('Daftar bukti kosong, tidak ada data untuk diekspor ke PDF.');
        return;
      }

      message.loading({ content: 'Membuat berkas PDF laporan bukti...', key: 'exportPdf' });
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedLam = currentLam.lamCode.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedProdi = (studyInfo.studyProgramName || 'Prodi').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Laporan_Bukti_AL_${sanitizedLam}_${sanitizedProdi}_${timestamp}.pdf`;

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Header: Kop Institusi & LAM
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text(studyInfo.universityName || 'UNIVERSITAS PATTIMURA', pageWidth / 2, 13, { align: 'center' });

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(`TIM ASESOR ASESMEN LAPANGAN - ${currentLam.lamName.toUpperCase()} (${currentLam.lamCode})`, pageWidth / 2, 19, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`Fakultas: ${studyInfo.facultyName || '-'} | Program Studi: ${studyInfo.studyProgramName || '-'} (${studyInfo.degreeLevel || 'S1'})`, pageWidth / 2, 24, { align: 'center' });

      // Garis Kop Surat
      doc.setDrawColor(16, 185, 129); // emerald
      doc.setLineWidth(0.8);
      doc.line(14, 27, pageWidth - 14, 27);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(14, 28, pageWidth - 14, 28);

      // Judul Laporan
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('LAPORAN KATALOG BUKTI DIGITAL & HASIL VERIFIKASI ASESOR', 14, 35);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const dateFormatted = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' });
      doc.text(`Tanggal Unduh: ${dateFormatted}  |  Target Dokumen: ${currentLam.docTerms.quantitativeDoc} & ${currentLam.docTerms.qualitativeDoc}`, 14, 40);

      // Kotak Ringkasan Statistik Verifikasi
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 43, pageWidth - 28, 10, 1.5, 1.5, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Bukti: ${evidenceList.length}`, 18, 49.5);

      doc.setTextColor(22, 163, 74);
      doc.text(`Terverifikasi Valid: ${countValid}`, 68, 49.5);

      doc.setTextColor(37, 99, 235);
      doc.text(`Dapat Diakses: ${countAccessible}`, 120, 49.5);

      doc.setTextColor(217, 119, 6);
      doc.text(`Menunggu Verifikasi: ${countPending}`, 172, 49.5);

      doc.setTextColor(220, 38, 38);
      doc.text(`Perlu Klarifikasi AL: ${countSuspicious}`, 234, 49.5);

      // Data tabel
      const tableRows = filteredList.map((item, idx) => {
        const statusLabel = 
          item.status === 'valid' ? 'Terverifikasi Valid' :
          item.status === 'accessible' ? 'Dapat Diakses' :
          item.status === 'suspicious' ? 'Perlu Klarifikasi' : 'Menunggu Verifikasi';

        return [
          (idx + 1).toString(),
          item.title || '-',
          item.driveType || 'External Web',
          item.foundInDoc || '-',
          item.indicatorCode || 'Belum Ditautkan',
          statusLabel,
          item.notes || '-',
          item.url || '-'
        ];
      });

      autoTable(doc, {
        startY: 56,
        head: [['No', 'Judul Bukti Dokumen', 'Penyimpanan', 'Dokumen Asal', 'Kode Indikator', 'Status Verifikasi', 'Catatan Asesor', 'URL / Hyperlink']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [30, 41, 59],
          overflow: 'linebreak',
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 26 },
          3: { cellWidth: 26 },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 28, halign: 'center' },
          6: { cellWidth: 40 },
          7: { cellWidth: 'auto' },
        },
        didDrawPage: (data) => {
          const pageStr = `Halaman ${data.pageNumber}`;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, pageWidth - 26, doc.internal.pageSize.getHeight() - 7);
          doc.text(`Aplikasi Simulasi Akreditasi BAN-PT & LAM · ${studyInfo.universityName || 'Universitas Pattimura'}`, 14, doc.internal.pageSize.getHeight() - 7);
        },
      });

      doc.save(filename);
      message.success({ content: `Laporan PDF berhasil diunduh: ${filename}`, key: 'exportPdf' });
    } catch (err: any) {
      message.error({ content: `Gagal membuat berkas PDF: ${err.message || 'Terjadi kesalahan'}`, key: 'exportPdf' });
    }
  };

  const handleDirectPrintReport = () => {
    try {
      message.loading({ content: 'Mempersiapkan dokumen cetak & mengunduh PDF...', key: 'printEvidenceReport', duration: 2 });
      handleDownloadPDFReport();
      setReportModalOpen(true);

      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Native print:', err);
        }
        message.success({ 
          content: 'Laporan Bukti Digital siap dicetak & berkas PDF telah diunduh!', 
          key: 'printEvidenceReport', 
          duration: 3 
        });
      }, 350);
    } catch (e) {
      window.print();
    }
  };

  // Menu items for 'Download Report' dropdown
  const downloadReportMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      icon: <FilePdfOutlined style={{ color: '#ef4444' }} />,
      label: 'Unduh Laporan PDF (jsPDF)',
      onClick: handleDownloadPDFReport,
    },
    {
      key: 'excel',
      icon: <FileExcelOutlined style={{ color: '#16a34a' }} />,
      label: 'Unduh Rekap Excel (xlsx)',
      onClick: handleExportToExcel,
    },
  ];

  const columns: ColumnsType<EvidenceLink> = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      align: 'center',
      render: (_val, _record, index) => index + 1,
    },
    {
      title: 'Judul & Tautan Dokumen',
      key: 'titleUrl',
      render: (_val, record) => (
        <Space orientation="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{record.title}</Text>
          <Text 
            type="secondary" 
            style={{ fontSize: 11, fontFamily: 'monospace', maxWidth: 340 }} 
            ellipsis={{ tooltip: record.url }}
          >
            {record.url}
          </Text>
          {record.notes && (
            <Text type="secondary" italic style={{ fontSize: 11 }}>
              {record.notes}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Tipe Penyimpanan',
      dataIndex: 'driveType',
      key: 'driveType',
      width: 150,
      render: (driveType) => {
        const color = 
          driveType === 'Google Drive' ? 'blue' :
          driveType === 'SPMI Portal' ? 'green' :
          driveType === 'Repository PT' ? 'purple' : 'default';
        const icon = 
          driveType === 'Google Drive' ? <FolderOpenOutlined /> :
          driveType === 'SPMI Portal' ? <DatabaseOutlined /> :
          <GlobalOutlined />;
        return <Tag color={color} icon={icon}>{driveType || 'External Web'}</Tag>;
      },
    },
    {
      title: 'Status Verifikasi Asesor',
      dataIndex: 'status',
      key: 'status',
      width: 175,
      render: (_status, record) => (
        <Select
          size="small"
          value={record.status || 'accessible'}
          onChange={(val) => {
            if (onUpdateEvidence) {
              onUpdateEvidence(record.id, { status: val });
              message.success(`Status ${record.title.slice(0, 20)} diperbarui ke: ${val}`);
            }
          }}
          style={{ width: 165 }}
          options={STATUS_OPTIONS.map(opt => ({
            label: (
              <Tag color={opt.color} style={{ margin: 0 }}>
                {opt.label}
              </Tag>
            ),
            value: opt.value,
          }))}
        />
      ),
    },
    {
      title: 'Lokasi Asal Dokumen',
      dataIndex: 'foundInDoc',
      key: 'foundInDoc',
      width: 180,
      render: (doc) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{doc}</Text>
      ),
    },
    {
      title: 'Tautan Indikator',
      key: 'indicator',
      width: 160,
      render: (_val, record) => {
        if (record.indicatorCode) {
          return (
            <Tag color="cyan" style={{ fontFamily: 'monospace' }}>
              {record.indicatorCode}
            </Tag>
          );
        }
        return (
          <Select
            placeholder="Tautkan..."
            size="small"
            style={{ width: '100%' }}
            onChange={(val) => {
              const ind = currentLam.indicators.find(i => i.id === val);
              if (ind) onLinkToIndicator(record.id, ind.id, ind.code);
            }}
            options={currentLam.indicators.map(ind => ({
              label: `${ind.code} - ${ind.name.slice(0, 20)}...`,
              value: ind.id,
            }))}
          />
        );
      },
    },
    {
      title: 'Aksi (Edit / Hapus / Buka)',
      key: 'actions',
      width: 195,
      align: 'right',
      render: (_val, record) => (
        <Space size={4}>
          <Tooltip title="Salin URL">
            <Button
              size="small"
              icon={copiedId === record.id ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopyUrl(record.id, record.url)}
            />
          </Tooltip>
          <Tooltip title="Edit Tautan & Data Bukti">
            <Button
              size="small"
              icon={<EditOutlined style={{ color: '#06b6d4' }} />}
              onClick={() => {
                setEditingRecord(record);
                editForm.setFieldsValue({
                  title: record.title,
                  url: record.url,
                  driveType: record.driveType || 'Google Drive',
                  status: record.status || 'accessible',
                  notes: record.notes || '',
                });
                setEditModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Hapus Tautan Bukti">
            <Popconfirm
              title="Hapus Tautan Bukti"
              description={`Hapus "${record.title.slice(0, 25)}..."?`}
              onConfirm={() => {
                onDeleteEvidence?.(record.id);
                message.success('Tautan bukti berhasil dihapus.');
              }}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true, size: 'small' }}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
          <Button
            size="small"
            type="primary"
            icon={<LinkOutlined />}
            href={record.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '16px 24px' }}>
      {/* Hero Banner Card with Ingestion and Export Options */}
      <Card>
        <Row gutter={[24, 24]} align="middle" justify="space-between">
          <Col xs={24} lg={14}>
            <Space orientation="vertical" size="small">
              <Space wrap>
                <Tag color="cyan">UNIVERSAL PARSER & LINK SCANNER</Tag>
                <Text type="secondary">
                  Target: {currentLam.docTerms.quantitativeDoc} & {currentLam.docTerms.qualitativeDoc} ({currentLam.lamCode})
                </Text>
              </Space>

              <Title level={4} style={{ margin: 0 }}>
                Interactive Live Evidence URL Extractor & Report Generator
              </Title>

              <Paragraph style={{ margin: 0, color: token.colorTextSecondary }}>
                Memindai seluruh tautan Google Drive, Repositori SPMI, Cloud Storage, dan Berkas Fisik yang tertera pada dokumen {currentLam.docTerms.quantitativeDoc} & {currentLam.docTerms.qualitativeDoc}. Anda dapat mengekspor laporan bukti ini secara langsung ke format <strong>Excel (.xlsx)</strong> atau <strong>PDF Laporan Resmi Asesor</strong>.
              </Paragraph>

              {/* Status Program Studi Aktif & Auto-sync */}
              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                marginTop: 6,
              }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap="small">
                  <Space wrap>
                    <Tag color="green" icon={<CheckCircleOutlined />}>PRODI AKTIF</Tag>
                    <Text strong style={{ color: '#10b981', fontSize: 13 }}>
                      {studyInfo.studyProgramName || 'Peternakan'} ({studyInfo.degreeLevel || 'S1'})
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      · {studyInfo.facultyName || 'Fakultas Pertanian'} · {studyInfo.universityName || 'Universitas Pattimura'}
                    </Text>
                  </Space>
                  <Space wrap>
                    <Text type="secondary" style={{ fontSize: 11 }}>Pilih Cepat:</Text>
                    <Select
                      size="small"
                      value={studyInfo.studyProgramName}
                      onChange={(val) => onUpdateStudyInfo?.({ studyProgramName: val })}
                      style={{ width: 140 }}
                      options={[
                        { label: 'Peternakan', value: 'Peternakan' },
                        { label: 'Agroteknologi', value: 'Agroteknologi' },
                        { label: 'Agribisnis', value: 'Agribisnis' },
                        { label: 'Kehutanan', value: 'Kehutanan' },
                      ]}
                    />
                  </Space>
                </Flex>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={12}>
            <Flex justify="flex-end" gap="small" wrap="wrap">
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}
                onClick={() => {
                  addForm.resetFields();
                  addForm.setFieldsValue({
                    url: 'https://',
                    driveType: 'Google Drive',
                    status: 'accessible',
                  });
                  setAddModalOpen(true);
                }}
              >
                + Tambah Link
              </Button>

              <Upload beforeUpload={handleUpload} showUploadList={false} accept=".xlsx,.xls,.csv">
                <Button icon={<UploadOutlined />} style={{ borderColor: '#10b981', color: '#10b981' }}>
                  Unggah {currentLam.docTerms.quantitativeDoc} (.xlsx)
                </Button>
              </Upload>

              <Upload beforeUpload={handleUploadLED} showUploadList={false} accept=".docx,.doc,.pdf,.txt,.json">
                <Button icon={<FileTextOutlined />}>
                  Unggah Berkas {currentLam.docTerms.qualitativeDoc}
                </Button>
              </Upload>

              <Button icon={<FileTextOutlined />} onClick={() => setModalOpen(true)}>
                Pindai Teks {currentLam.docTerms.qualitativeDoc}
              </Button>

              {/* Primary Download Report Feature (PDF via jsPDF & Excel via xlsx) */}
              <Dropdown menu={{ items: downloadReportMenuItems }} placement="bottomRight">
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}
                >
                  Download Report <DownOutlined />
                </Button>
              </Dropdown>

              {/* Action: Direct Export to PDF using jsPDF */}
              <Button 
                type="default" 
                icon={<FilePdfOutlined style={{ color: '#ef4444' }} />} 
                onClick={handleDownloadPDFReport}
              >
                Unduh PDF
              </Button>

              {/* Action: Direct Export to Excel using SheetJS */}
              <Button 
                type="default" 
                icon={<FileExcelOutlined style={{ color: '#16a34a' }} />} 
                onClick={handleExportToExcel}
              >
                Unduh Excel
              </Button>

              {/* Action: Preview & Print Modal */}
              <Button 
                icon={<PrinterOutlined />} 
                onClick={() => setReportModalOpen(true)}
              >
                Pratinjau
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Quick Summary Verification Counters */}
      <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
        <Row gutter={16} align="middle">
          <Col xs={12} sm={6}>
            <Statistic 
              title="Total Tautan Bukti" 
              value={evidenceList.length} 
              prefix={<LinkOutlined style={{ color: token.colorInfo }} />}
              styles={{ content: { fontSize: 20, fontFamily: 'monospace' } }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Terverifikasi Valid" 
              value={countValid} 
              prefix={<CheckCircleOutlined style={{ color: token.colorSuccess }} />}
              styles={{ content: { fontSize: 20, fontFamily: 'monospace', color: token.colorSuccess } }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Dapat Diakses" 
              value={countAccessible} 
              prefix={<FolderOpenOutlined style={{ color: token.colorPrimary }} />}
              styles={{ content: { fontSize: 20, fontFamily: 'monospace', color: token.colorPrimary } }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Menunggu / Konfirmasi" 
              value={countPending + countSuspicious} 
              prefix={<ClockCircleOutlined style={{ color: token.colorWarning }} />}
              styles={{ content: { fontSize: 20, fontFamily: 'monospace', color: token.colorWarning } }}
            />
          </Col>
        </Row>
      </Card>

      {/* Search and Filters Bar */}
      <Card size="small">
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} sm={8}>
            <Input
              prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
              placeholder="Cari nama bukti, kode indikator, URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={16}>
            <Flex justify="flex-end" align="center" gap="middle" wrap="wrap">
              <Space align="center">
                <Text type="secondary" style={{ fontSize: 12 }}>Filter Kategori:</Text>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: 160 }}
                  options={[
                    { label: 'Semua Kategori', value: 'ALL' },
                    { label: 'Google Drive', value: 'Google Drive' },
                    { label: 'SPMI Portal', value: 'SPMI Portal' },
                    { label: 'Repository PT', value: 'Repository PT' },
                    { label: 'External Web', value: 'External Web' },
                  ]}
                />
              </Space>

              <Space align="center">
                <Text type="secondary" style={{ fontSize: 12 }}>Status Verifikasi:</Text>
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 170 }}
                  options={[
                    { label: 'Semua Status', value: 'ALL' },
                    ...STATUS_OPTIONS.map(s => ({ label: s.label, value: s.value })),
                  ]}
                />
              </Space>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Evidence Table */}
      <Card
        title={
          <Space>
            <LinkOutlined style={{ color: token.colorPrimary }} />
            <span>Katalog Bukti Digital ({filteredList.length} Tautan Ditemukan)</span>
          </Space>
        }
        extra={
          <Space wrap size="small">
            <Button 
              size="small" 
              type="primary" 
              icon={<PlusOutlined />} 
              style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}
              onClick={() => {
                addForm.resetFields();
                addForm.setFieldsValue({
                  url: 'https://',
                  driveType: 'Google Drive',
                  status: 'accessible',
                });
                setAddModalOpen(true);
              }}
            >
              + Tambah Link URL
            </Button>
            <Dropdown menu={{ items: downloadReportMenuItems }} placement="bottomRight">
              <Button size="small" type="primary" icon={<DownloadOutlined />} style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                Download Report <DownOutlined />
              </Button>
            </Dropdown>
            <Button size="small" icon={<FilePdfOutlined style={{ color: '#ef4444' }} />} onClick={handleDownloadPDFReport}>
              Unduh PDF
            </Button>
            <Button size="small" icon={<FileExcelOutlined style={{ color: '#16a34a' }} />} onClick={handleExportToExcel}>
              Unduh Excel
            </Button>
            <Button size="small" icon={<PrinterOutlined />} onClick={() => setReportModalOpen(true)}>
              Pratinjau
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      {/* Modal: Paste Narrative Text */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: token.colorInfo }} />
            <span>Pindai Teks Narasi {currentLam.docTerms.qualitativeDoc} (PDF)</span>
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleScanTextSubmit}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            Tempelkan teks narasi dari dokumen {currentLam.docTerms.qualitativeDoc}. Parser akan mendeteksi seluruh tautan Google Drive, SPMI, dan arsip dokumen secara otomatis.
          </Paragraph>

          <Form.Item
            name="narrativeText"
            rules={[{ required: true, message: 'Harap tempelkan teks narasi terlebih dahulu' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="Contoh: Dokumen SPMI dapat diakses melalui link Google Drive: https://drive.google.com/drive/folders/1ABC_MUTU_2024..." 
            />
          </Form.Item>

          <Flex justify="flex-end" gap="small">
            <Button onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit">Ekstrak Tautan</Button>
          </Flex>
        </Form>
      </Modal>

      {/* Modal: Print / PDF Report Preview */}
      <Modal
        title={
          <Space>
            <FilePdfOutlined style={{ color: token.colorError }} />
            <span>Pratinjau Laporan Verifikasi Bukti Dokumen Asesor (PDF / Print View)</span>
          </Space>
        }
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        width={920}
        footer={[
          <Button key="close" onClick={() => setReportModalOpen(false)}>
            Tutup
          </Button>,
          <Button 
            key="pdf" 
            type="primary"
            icon={<FilePdfOutlined />} 
            onClick={handleDownloadPDFReport}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
          >
            Unduh PDF (jsPDF)
          </Button>,
          <Button 
            key="excel" 
            icon={<FileExcelOutlined />} 
            onClick={handleExportToExcel}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
          >
            Unduh Excel (.xlsx)
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleDirectPrintReport} style={{ fontWeight: 600 }}>
            Cetak Dokumen Sekarang
          </Button>,
        ]}
        style={{ top: 20 }}
      >
        <div id="printable-evidence-report-modal" style={{ backgroundColor: '#ffffff', color: '#111827', padding: '28px', borderRadius: 8 }}>
          {/* Official Document Kop Surat with Unpatti Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '2px solid #111827', paddingBottom: 14 }}>
            <img 
              src="/logo_unpatti.png" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png";
              }}
              alt="Logo Universitas Pattimura" 
              style={{ width: 56, height: 56, objectFit: 'contain' }} 
            />
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 0.8, color: '#111827' }}>
                {currentLam.lamName} ({currentLam.lamCode})
              </Title>
              <Text style={{ fontSize: 13, color: '#4b5563', display: 'block', fontWeight: 600 }}>
                TIM ASESOR ASESMEN LAPANGAN AKREDITASI PROGRAM STUDI
              </Text>
              <Text italic style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>
                Perguruan Tinggi: {studyInfo.universityName || 'Universitas Pattimura'} · {studyInfo.facultyName}
              </Text>
            </div>
          </div>

          {/* Report Title */}
          <div style={{ textAlign: 'center', margin: '18px 0' }}>
            <Title level={5} style={{ margin: 0, textDecoration: 'underline', textTransform: 'uppercase', color: '#111827' }}>
              LAPORAN VERIFIKASI BUKTI DOKUMEN & TAUTAN ASESMEN LAPANGAN
            </Title>
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
              Program Studi: {studyInfo.studyProgramName} ({studyInfo.degreeLevel}) · Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </Text>
          </div>

          {/* Verification Statistics Summary Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20, textAlign: 'center', backgroundColor: '#f9fafb', padding: 12, border: '1px solid #e5e7eb', borderRadius: 6 }}>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Total Bukti Terekstraksi</span>
              <span style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', color: '#111827' }}>{evidenceList.length} Tautan</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Terverifikasi Valid</span>
              <span style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', color: '#16a34a' }}>{countValid}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Dapat Diakses</span>
              <span style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', color: '#2563eb' }}>{countAccessible}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280', display: 'block' }}>Menunggu / Perlu Cek</span>
              <span style={{ fontSize: 16, fontWeight: 'bold', fontFamily: 'monospace', color: '#d97706' }}>{countPending + countSuspicious}</span>
            </div>
          </div>

          {/* Printable Formal Evidence Table */}
          <table style={{ width: '100%', fontSize: 11, border: '1px solid #9ca3af', borderCollapse: 'collapse', color: '#111827', marginBottom: 24 }}>
            <thead style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 30, textAlign: 'center' }}>No</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 220 }}>Judul & Dokumen Bukti</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 90 }}>Tipe Storage</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 110 }}>Dokumen Asal</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 80, textAlign: 'center' }}>Indikator</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af', width: 110, textAlign: 'center' }}>Status Verifikasi</th>
                <th style={{ padding: 6, border: '1px solid #9ca3af' }}>Tautan URL Langsung</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #d1d5db' }}>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af' }}>
                    <strong style={{ display: 'block' }}>{item.title}</strong>
                    {item.notes && <span style={{ fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>{item.notes}</span>}
                  </td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af' }}>{item.driveType || 'External Web'}</td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', fontFamily: 'monospace' }}>{item.foundInDoc}</td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', textAlign: 'center', fontFamily: 'monospace' }}>
                    {item.indicatorCode || '-'}
                  </td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ 
                      color: item.status === 'valid' ? '#16a34a' : 
                             item.status === 'accessible' ? '#2563eb' : 
                             item.status === 'suspicious' ? '#dc2626' : '#d97706' 
                    }}>
                      {item.status === 'valid' ? '✓ Valid' : 
                       item.status === 'accessible' ? '✓ Dapat Diakses' : 
                       item.status === 'suspicious' ? '⚠ Perlu Cek AL' : '⏳ Menunggu'}
                    </span>
                  </td>
                  <td style={{ padding: 6, border: '1px solid #9ca3af', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 10 }}>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                      {item.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures */}
          <div style={{ marginTop: 32 }}>
            <Text style={{ fontSize: 11, display: 'block', textAlign: 'right', fontStyle: 'italic', marginBottom: 16 }}>
              Ditetapkan di: Ambon ({studyInfo.universityName || 'Universitas Pattimura'}), tanggal {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </Text>

            <Row gutter={24} style={{ textAlign: 'center' }}>
              <Col span={8}>
                <Text strong style={{ display: 'block', marginBottom: 48, fontSize: 11 }}>Asesor 1 (Ketua Tim):</Text>
                <div style={{ borderTop: '1px solid #111827', paddingTop: 4 }}>
                  <Text strong style={{ display: 'block', fontSize: 11 }}>{studyInfo.asesor1Name}</Text>
                  <Text style={{ fontSize: 10, color: '#4b5563' }}>{studyInfo.asesor1Institution}</Text>
                </div>
              </Col>
              <Col span={8}>
                <Text strong style={{ display: 'block', marginBottom: 48, fontSize: 11 }}>Asesor 2 (Anggota Tim):</Text>
                <div style={{ borderTop: '1px solid #111827', paddingTop: 4 }}>
                  <Text strong style={{ display: 'block', fontSize: 11 }}>{studyInfo.asesor2Name}</Text>
                  <Text style={{ fontSize: 10, color: '#4b5563' }}>{studyInfo.asesor2Institution}</Text>
                </div>
              </Col>
              <Col span={8}>
                <Text strong style={{ display: 'block', marginBottom: 48, fontSize: 11 }}>Pimpinan UPPS / Dekan:</Text>
                <div style={{ borderTop: '1px solid #111827', paddingTop: 4 }}>
                  <Text strong style={{ display: 'block', fontSize: 11 }}>{studyInfo.dekanOrKaprodiName}</Text>
                  <Text style={{ fontSize: 10, color: '#4b5563' }}>{studyInfo.facultyName}</Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Modal>

      {/* Modal Tambah Link Bukti Manual */}
      <Modal
        title={
          <Space>
            <FileAddOutlined style={{ color: '#10b981', fontSize: 18 }} />
            <span>Tambah Tautan Bukti Digital</span>
          </Space>
        }
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={560}
      >
        <div style={{ marginBottom: 14, padding: '10px 12px', backgroundColor: token.colorBgContainer, borderRadius: 6, border: `1px solid ${token.colorBorderSecondary}` }}>
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
            Preset Cepat (Klik untuk Mengisi Otomatis):
          </Text>
          <Space wrap size={[6, 6]}>
            <Tag 
              color="cyan" 
              style={{ cursor: 'pointer', fontWeight: 500 }}
              onClick={() => {
                addForm.setFieldsValue({
                  title: 'PDDikti Dosen Kemdiktisaintek',
                  url: 'https://pddikti.kemdiktisaintek.go.id/',
                  driveType: 'SPMI Portal',
                });
              }}
            >
              🎓 PDDikti (https://pddikti.kemdiktisaintek.go.id/)
            </Tag>
            <Tag 
              color="green" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                addForm.setFieldsValue({
                  title: 'Portal Penjaminan Mutu SPMI Unpatti',
                  url: 'https://spmi.unpatti.ac.id/portal-mutu/laporan',
                  driveType: 'SPMI Portal',
                });
              }}
            >
              🏛️ SPMI Unpatti
            </Tag>
            <Tag 
              color="blue" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                addForm.setFieldsValue({
                  title: 'Folder Berkas Google Drive',
                  url: 'https://drive.google.com/drive/folders/1Unpatti_Arsip_Bukti_AL?usp=sharing',
                  driveType: 'Google Drive',
                });
              }}
            >
              📁 Google Drive
            </Tag>
          </Space>
        </div>

        <Form
          form={addForm}
          layout="vertical"
          onFinish={(values: { title: string; url: string; driveType: any; notes?: string }) => {
            const { title, url, driveType, notes } = values;
            const newId = `ev-manual-${Date.now()}`;
            let domain = 'external';
            try {
              domain = new URL(url).hostname || 'external';
            } catch {
              domain = 'external';
            }
            onAddEvidence({
              id: newId,
              title,
              url,
              domain,
              driveType: driveType || 'Google Drive',
              foundInDoc: `Input Manual (${currentLam.lamCode})`,
              status: 'accessible',
              notes: notes || 'Ditambahkan secara manual oleh pengguna / asesor',
            });
            message.success(`Tautan bukti "${title}" berhasil ditambahkan!`);
            setAddModalOpen(false);
          }}
        >
          <Form.Item
            name="title"
            label="Nama / Judul Dokumen Bukti"
            rules={[{ required: true, message: 'Harap isi nama dokumen!' }]}
          >
            <Input placeholder="Contoh: PDDikti Dosen Kemdiktisaintek / SK Rektor" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Tautan / Link URL"
            rules={[
              { required: true, message: 'Harap isi URL!' },
              {
                validator: async (_, value) => {
                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    throw new Error('URL harus diawali dengan http:// atau https://');
                  }
                }
              }
            ]}
          >
            <Input prefix={<LinkOutlined style={{ color: token.colorTextPlaceholder }} />} placeholder="https://pddikti.kemdiktisaintek.go.id/ atau https://drive.google.com/..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="driveType" label="Penyedia / Tipe Penyimpanan" initialValue="Google Drive">
                <Select
                  options={[
                    { label: 'Google Drive', value: 'Google Drive' },
                    { label: 'SPMI Portal', value: 'SPMI Portal' },
                    { label: 'Repository PT', value: 'Repository PT' },
                    { label: 'External Web / SIM', value: 'External Web' },
                    { label: 'OneDrive', value: 'OneDrive' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Catatan Tambahan (Opsional)">
                <Input placeholder="Keterangan dokumen..." />
              </Form.Item>
            </Col>
          </Row>

          <Flex justify="flex-end" gap="small" style={{ marginTop: 20 }}>
            <Button onClick={() => setAddModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}>
              Simpan & Tambahkan
            </Button>
          </Flex>
        </Form>
      </Modal>

      {/* Modal Edit Link Bukti */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#06b6d4', fontSize: 18 }} />
            <span>Edit Tautan Bukti Digital</span>
          </Space>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={560}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values: { title: string; url: string; driveType: any; status: any; notes?: string }) => {
            if (!editingRecord) return;
            onUpdateEvidence?.(editingRecord.id, {
              title: values.title,
              url: values.url,
              driveType: values.driveType,
              status: values.status,
              notes: values.notes,
            });
            message.success(`Tautan bukti "${values.title}" berhasil diperbarui!`);
            setEditModalOpen(false);
          }}
        >
          <Form.Item
            name="title"
            label="Nama / Judul Dokumen Bukti"
            rules={[{ required: true, message: 'Harap isi nama dokumen!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="url"
            label="Tautan URL"
            rules={[
              { required: true, message: 'Harap isi URL!' },
              {
                validator: async (_, value) => {
                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    throw new Error('URL harus diawali dengan http:// atau https://');
                  }
                }
              }
            ]}
          >
            <Input prefix={<LinkOutlined style={{ color: token.colorTextPlaceholder }} />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="driveType" label="Penyedia / Tipe">
                <Select
                  options={[
                    { label: 'Google Drive', value: 'Google Drive' },
                    { label: 'SPMI Portal', value: 'SPMI Portal' },
                    { label: 'Repository PT', value: 'Repository PT' },
                    { label: 'External Web', value: 'External Web' },
                    { label: 'OneDrive', value: 'OneDrive' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status Verifikasi">
                <Select
                  options={STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Catatan Bukti">
            <Input />
          </Form.Item>

          <Flex justify="flex-end" gap="small" style={{ marginTop: 20 }}>
            <Button onClick={() => setEditModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}>
              Simpan Perubahan
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Space>
  );
};
