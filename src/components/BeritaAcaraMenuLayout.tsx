import React, { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Tag, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  Descriptions, 
  Divider, 
  Input, 
  Modal, 
  Form, 
  message, 
  Tooltip,
  theme,
  Segmented 
} from 'antd';
import { 
  FileTextOutlined, 
  PrinterOutlined, 
  FileExcelOutlined, 
  PlusOutlined, 
  CheckCircleOutlined, 
  EditOutlined, 
  LinkOutlined, 
  GlobalOutlined, 
  AuditOutlined, 
  BookOutlined, 
  SafetyCertificateOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnsType } from 'antd/es/table';
import { LamProfile, StudyProgramInfo } from '../types/accreditation';
import { getEvidenceDocumentInfo } from '../utils/evidenceDocumentUrls';
import { AssessorLeadershipForm } from './AssessorLeadershipForm';

const { Title, Text, Paragraph } = Typography;

// Initial LED post-AL revision data based on the uploaded document
export interface LedRevisionItem {
  id: string;
  no: number;
  indicatorCode: string;
  indicatorName: string;
  beforeAL: string;
  findingAL: string;
  afterAL: string;
}

export interface LkpsRevisionItem {
  id: string;
  no: number;
  tableCode: string;
  indicatorCode: string;
  beforeAL: string;
  findingAL: string;
  afterAL: string;
  evidenceUrl?: string;
}

interface BeritaAcaraMenuLayoutProps {
  currentLam: LamProfile;
  studyInfo: StudyProgramInfo;
  onUpdateStudyInfo?: (updated: Partial<StudyProgramInfo>) => void;
  systemRole?: 'user' | 'admin';
  onChangeSystemRole?: (role: 'user' | 'admin') => void;
}

export const BeritaAcaraMenuLayout: React.FC<BeritaAcaraMenuLayoutProps> = ({
  currentLam,
  studyInfo,
  onUpdateStudyInfo,
  systemRole = 'user',
  onChangeSystemRole,
}) => {
  const { token } = theme.useToken();
  const [activeSubTab, setActiveSubTab] = useState<string>('lha');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [localSystemRole, setLocalSystemRole] = useState<'user' | 'admin'>(systemRole);

  const activeRoleState = onChangeSystemRole ? systemRole : localSystemRole;
  const handleRoleChange = (newRole: 'user' | 'admin') => {
    setLocalSystemRole(newRole);
    if (onChangeSystemRole) {
      onChangeSystemRole(newRole);
    }
  };

  // LED Revisions State (Matching uploaded document pages 1-4)
  const [ledRevisions, setLedRevisions] = useState<LedRevisionItem[]>([
    {
      id: 'led-1',
      no: 1,
      indicatorCode: 'K.1',
      indicatorName: 'Budaya Mutu',
      beforeAL: 'Budaya mutu pada Program Studi belum dinarasikan secara memadai dan belum menunjukkan bukti implementasi budaya mutu secara jelas.',
      findingAL: 'Implementasi budaya mutu pada Program Studi dinarasikan lebih lanjut dengan menunjukkan mekanisme pelaksanaan, evaluasi, dan tindak lanjut perbaikan, serta dilengkapi bukti pendukung.',
      afterAL: 'Budaya mutu pada Program Studi telah dinarasikan secara lebih lengkap dengan menjelaskan mekanisme pelaksanaan, evaluasi, dan tindak lanjut perbaikan secara berkelanjutan. Narasi telah diperkuat dengan bukti pendukung yang relevan untuk menunjukkan implementasi budaya mutu pada Program Studi.',
    },
    {
      id: 'led-2',
      no: 2,
      indicatorCode: 'K.2.1',
      indicatorName: 'Relevansi Pendidikan',
      beforeAL: 'Uraian belum dilengkapi dengan bukti pendukung yang dicantumkan secara lengkap dan sistematis setelah setiap penjelasan, sehingga keterkaitan antara uraian dan bukti pendukung belum optimal.',
      findingAL: 'Susun judul berdasarkan kata kunci yang relevan dengan mencantumkan informasi mengenai waktu pelaksanaan, pihak yang melakukan, serta sumber atau pihak yang menjadi rujukan. Cantumkan setiap bukti pendukung yang relevan.',
      afterAL: 'Uraian telah dilengkapi dengan bukti pendukung yang relevan sehingga setiap informasi yang disampaikan dapat ditelusuri dan diverifikasi berdasarkan bukti yang tersedia secara online.',
    },
    {
      id: 'led-3',
      no: 3,
      indicatorCode: 'K2.2',
      indicatorName: 'Relevansi Penelitian',
      beforeAL: 'Uraian mengenai relevansi penelitian dosen belum dinarasikan secara komprehensif dan belum dilengkapi bukti pendukung. Perhitungan pendanaan penelitian juga belum diverifikasi dan disesuaikan kembali.',
      findingAL: 'Relevansi penelitian perlu dinarasikan lebih lanjut dengan menjelaskan keterkaitan penelitian dosen dengan bidang keilmuan, visi dan misi, serta pengembangan Program Studi. Perlu dilakukan perhitungan ulang pendanaan penelitian.',
      afterAL: 'Uraian relevansi penelitian dosen telah dilengkapi narasi yang menjelaskan keterkaitan penelitian dengan bidang keilmuan, visi misi, serta pengembangan Program Studi dan didukung bukti relevan. Perhitungan pendanaan penelitian telah disesuaikan berdasarkan data terverifikasi.',
    },
    {
      id: 'led-4',
      no: 4,
      indicatorCode: 'K2.3',
      indicatorName: 'Relevansi Pengabdian kepada Masyarakat (PkM)',
      beforeAL: 'Uraian mengenai relevansi kegiatan Pengabdian kepada Masyarakat (PkM) belum dinarasikan secara komprehensif dan pendanaan belum diverifikasi kembali.',
      findingAL: 'Relevansi kegiatan PkM perlu dinarasikan lebih lanjut dengan menjelaskan keterkaitannya dengan bidang keilmuan, visi misi, kebutuhan masyarakat, dan pengembangan Program Studi dengan bukti pendukung.',
      afterAL: 'Uraian relevansi kegiatan PkM telah dilengkapi dengan narasi keterkaitan bidang keilmuan, visi misi, kebutuhan masyarakat pulau-pulau kecil, serta didukung bukti pendukung dan perhitungan pendanaan yang telah diverifikasi.',
    },
    {
      id: 'led-5',
      no: 5,
      indicatorCode: 'K.3',
      indicatorName: 'Akuntabilitas (DTPS)',
      beforeAL: 'Jumlah Dosen Tetap Program Studi (DTPS) belum sesuai. Terdapat satu dosen yang seharusnya dikategorikan sebagai Dosen PT, namun masih diinput sebagai DTPS.',
      findingAL: 'Jumlah Dosen Tetap Program Studi (DTPS) perlu disesuaikan dari 26 orang menjadi 25 orang karena terdapat satu dosen yang kompetensi inti bidang keilmuannya belum sesuai dengan bidang keilmuan utama.',
      afterAL: 'Jumlah Dosen Tetap Program Studi (DTPS) telah disesuaikan dari 26 orang menjadi 25 orang dengan mengategorikan dosen berdasarkan kesesuaian kompetensi inti dengan ketentuan yang berlaku.',
    },
    {
      id: 'led-6',
      no: 6,
      indicatorCode: 'K.4',
      indicatorName: 'Diferensiasi Misi',
      beforeAL: 'Diferensiasi misi Program Studi belum dinarasikan secara memadai dan belum dilengkapi bukti pendukung yang menunjukkan kekhasan Program Studi.',
      findingAL: `Poin diferensiasi misi Program Studi dijelaskan secara lebih mendalam, khususnya terkait kekhasan dan keunggulan Program Studi ${studyInfo.studyProgramName || 'Peternakan'} berbasis keilmuan kepulauan.`,
      afterAL: `Diferensiasi misi Program Studi telah dinarasikan secara mendalam dengan menguraikan kekhasan "Bina Mulia ke Lautan", keunggulan keilmuan ${studyInfo.studyProgramName || 'Peternakan'} wilayah kepulauan (Archipelago Livestock & Agriculture), serta keterkaitannya dengan visi misi perguruan tinggi.`,
    },
  ]);

  // LKPS Revisions State (Matching uploaded document pages 4-7)
  const [lkpsRevisions, setLkpsRevisions] = useState<LkpsRevisionItem[]>([
    {
      id: 'lkps-1',
      no: 1,
      tableCode: 'Tabel 2.1A',
      indicatorCode: 'DTPS',
      beforeAL: 'Jumlah DTPS = 26 orang, NDT = 50 orang',
      findingAL: 'DTPS adalah dosen yg mengajar sesuai inti kompetensi. Baris ke-50 bukan merupakan identitas DTPS.',
      afterAL: 'Jumlah DTPS = 25 orang, jumlah NDT = 49 orang',
      evidenceUrl: 'https://drive.google.com/drive/folders/14xqY5ecMotu3pS9vMQNXvTtPYkCm5uhb?usp=drive_link',
    },
    {
      id: 'lkps-2',
      no: 2,
      tableCode: 'Tabel 2.1E',
      indicatorCode: 'Tenaga Kependidikan',
      beforeAL: 'Tidak ada sertifikat tenaga kependidikan',
      findingAL: 'Terdapat 2 tenaga kependidikan yang memiliki sertifikat kompetensi',
      afterAL: 'Sertifikat kompetensi tenaga kependidikan telah diverifikasi dan dilampirkan',
      evidenceUrl: 'https://drive.google.com/file/d/1OOYdD378O2dG7zSyhln2000M7KptDTrM/view?usp=drive_link',
    },
    {
      id: 'lkps-3',
      no: 3,
      tableCode: 'Tabel 2.2',
      indicatorCode: 'Kepesertaan MBKM',
      beforeAL: 'Jumlah mahasiswa eligible MBKM = 19 orang',
      findingAL: 'Jumlah mahasiswa berdasarkan yg MEMENUHI SYARAT, bukan hanya yg MENDAFTAR. Hapus angkatan 2021, hanya angkatan 2022.',
      afterAL: 'Jumlah mahasiswa eligible MBKM = 25 orang (peserta aktif = 17 orang)',
      evidenceUrl: 'https://drive.google.com/drive/folders/1sHwLWuSZdK6YuXkT2aifC7brCnmqqpDD/view?usp=sharing',
    },
    {
      id: 'lkps-4',
      no: 4,
      tableCode: 'Tabel 2.7B',
      indicatorCode: 'Survey Kepuasan',
      beforeAL: 'Hasil survey kepuasan aspek kemampuan berbahasa asing: Sangat Baik: 21,43%, Baik: 28,57%, Cukup: 50,00%',
      findingAL: 'Perlu validasi kembali untuk hasil survey kepuasan terutama aspek kemampuan berbahasa asing',
      afterAL: 'Perbaikan hasil survey kepuasan telah divalidasi dan dilengkapi laporan hasil tracer',
      evidenceUrl: 'https://drive.google.com/file/d/1W2C2q3BvfrnkpzPg8dbKXYZuo4266Mwl/view?usp=sharing',
    },
    {
      id: 'lkps-5',
      no: 5,
      tableCode: 'Tabel 3.1',
      indicatorCode: 'Biaya dan Dana',
      beforeAL: 'Biaya operasional & inventaris tidak diisi. Rata-rata dana penelitian Rp31.426.667, PkM Rp6.333.333',
      findingAL: 'Biaya operasional perlu diisi dan dikonfirmasi. Rata-rata dana penelitian/PkM perlu ditambahkan kerjasama nasional & internasional.',
      afterAL: 'Rata-rata dana penelitian/tahun = Rp1.054.706.083. Rata-rata dana PkM/tahun = Rp375.131.333',
      evidenceUrl: 'https://drive.google.com/file/d/1CynEAlkch63naSeaREJL8P7uHoXAK4Z0/view?usp=sharing',
    },
    {
      id: 'lkps-6',
      no: 6,
      tableCode: 'Tabel 3.2',
      indicatorCode: 'Penelitian DTPS',
      beforeAL: 'Jumlah Penelitian DTPS = 26 judul',
      findingAL: 'Perlu verifikasi jumlah penelitian DTPS terutama yang bekerjasama dengan lembaga eksternal',
      afterAL: 'Jumlah penelitian DTPS = 32 judul',
      evidenceUrl: 'https://drive.google.com/drive/folders/1QpVSHHwFnCUoCfEDtnw9QMrBhVMan_Mm?usp=drive_link',
    },
    {
      id: 'lkps-7',
      no: 7,
      tableCode: 'Tabel 3.5B',
      indicatorCode: 'Luaran P2M HKI',
      beforeAL: 'Nama mahasiswa di penelitian dosen belum lengkap',
      findingAL: 'Perlu dilengkapi nama mahasiswa yang masuk ke dalam HKI',
      afterAL: 'Nama mahasiswa sudah dilengkapi pada 11 sertifikat HKI/Paten',
      evidenceUrl: 'https://pdki-indonesia.dgip.go.id/detail/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'lkps-8',
      no: 8,
      tableCode: 'Tabel 3.5D',
      indicatorCode: 'Buku Ber-ISBN',
      beforeAL: 'Tabel 3.5D belum terisi lengkap',
      findingAL: 'Perlu melengkapi isi Tabel 3.5D karya buku ajar / book chapter dosen',
      afterAL: 'Tabel 3.5D telah dilengkapi dengan 16 judul buku ber-ISBN dosen DTPS',
      evidenceUrl: 'https://drive.google.com/open?id=1PouuUhbeN7RmM86-iUDxSMISxLaJ5BLX&usp=drive_copy',
    },
    {
      id: 'lkps-9',
      no: 9,
      tableCode: 'Tabel 3.5E',
      indicatorCode: 'Inovasi Diadopsi',
      beforeAL: 'Tabel 3.5E belum terisi',
      findingAL: 'Berdasarkan hasil wawancara dengan mitra, ada produk inovasi yang diadopsi di Desa Rutong',
      afterAL: 'Produk inovasi yang diadopsi oleh mitra berupa produk olahan sagu (mi sagu, tepung sagu, kue sagu)',
      evidenceUrl: 'https://drive.google.com/file/d/1UqXWFDqpYmA6ukRDNrqCzNrL0MoO8TXB/view?usp=drive_link',
    },
    {
      id: 'lkps-10',
      no: 10,
      tableCode: 'Tabel 4.3',
      indicatorCode: 'Mitra PkM',
      beforeAL: 'Bagian keterangan tidak terisi',
      findingAL: 'Pada bagian keterangan, harus ditambahkan link bukti kerjasama kemitraan',
      afterAL: 'Tabel 4.3 telah dilengkapi 15 kemitraan desa binaan (Negeri Rutong, Tawiri, Sepa, dll.) beserta link bukti',
      evidenceUrl: 'https://drive.google.com/file/d/15FvQQd2syK9nK_9yfOxkg_nZpISmxSvz/view?usp=sharing',
    },
    {
      id: 'lkps-11',
      no: 18,
      tableCode: 'Tabel 5.2',
      indicatorCode: 'Pembimbing Tugas Akhir',
      beforeAL: 'Ada beberapa nilai 0 pada pembimbingan',
      findingAL: 'Tabel perlu diperbaiki, dosen dan baris yang memiliki poin 0 harus dihilangkan/disesuaikan.',
      afterAL: 'Nilai 0 sudah dihapus, tabel pembimbingan disesuaikan dengan beban riil.',
      evidenceUrl: 'https://drive.google.com/drive/folders/1IGuNHEuR2AXDanIRVmHFIXW3t_OX3giI?usp=sharing',
    },
    {
      id: 'lkps-12',
      no: 19,
      tableCode: 'Tabel 5.3',
      indicatorCode: 'EWMP Dosen',
      beforeAL: 'Nilai tidak memenuhi 12 sks pada beberapa dosen',
      findingAL: 'Tabel perlu diperbaiki. Data yang dimasukkan data TS (2024/2025).',
      afterAL: 'Nilai sudah diperbaiki, memenuhi rentang 12-16 sks per semester pada 49 dosen.',
      evidenceUrl: 'https://drive.google.com/drive/folders/1tvj5wlrQSE2zSbEK7-rRmdbFNq1AZjkW?usp=sharing',
    },
    {
      id: 'lkps-13',
      no: 20,
      tableCode: 'Tabel 5.4C',
      indicatorCode: 'Kerjasama PkM',
      beforeAL: 'Ada isi tabel yang belum dicentang',
      findingAL: 'Kolom yang belum dicentang harus dicentang sesuai MoU/PKS yang berlaku.',
      afterAL: 'Tabel sudah diisi lengkap dengan bukti-bukti pelaksanaan KKN Tematik & Bimtek.',
      evidenceUrl: 'https://drive.google.com/file/d/1CynEAlkch63naSeaREJL8P7uHoXAK4Z0/view?usp=sharing',
    },
  ]);

  // Handler: Export All Post-AL Revisions to Excel (.xlsx)
  const handleExportRevisionsToExcel = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Rekapitulasi_Perubahan_Pasca_AL_${currentLam.lamCode}_${studyInfo.studyProgramName}_${timestamp}.xlsx`;

      // Sheet 1: LED Revisions
      const ledRows: any[][] = [
        ['REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA ASESMEN LAPANGAN (AL)'],
        ['LEMBAGA AKREDITASI', `${currentLam.lamName} (${currentLam.lamCode})`],
        ['PERGURUAN TINGGI', studyInfo.universityName || 'Universitas Pattimura'],
        ['PROGRAM STUDI', `${studyInfo.studyProgramName} (${studyInfo.degreeLevel})`],
        ['BAGIAN 1: LAPORAN EVALUASI DIRI (LED)'],
        [],
        ['No', 'Nomor Indikator', 'Nama Elemen', 'Uraian Sebelum AL', 'Hasil Verifikasi / Temuan AL', 'Uraian Setelah AL']
      ];
      ledRevisions.forEach(item => {
        ledRows.push([item.no, item.indicatorCode, item.indicatorName, item.beforeAL, item.findingAL, item.afterAL]);
      });

      // Sheet 2: LKPS Revisions
      const lkpsRows: any[][] = [
        ['REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA ASESMEN LAPANGAN (AL)'],
        ['LEMBAGA AKREDITASI', `${currentLam.lamName} (${currentLam.lamCode})`],
        ['PERGURUAN TINGGI', studyInfo.universityName || 'Universitas Pattimura'],
        ['PROGRAM STUDI', `${studyInfo.studyProgramName} (${studyInfo.degreeLevel})`],
        ['BAGIAN 2: LAPORAN KINERJA PROGRAM STUDI (LKPS)'],
        [],
        ['No', 'Tabel LKPS', 'Indikator', 'Uraian Sebelum AL', 'Hasil Verifikasi / Temuan AL', 'Uraian Setelah AL', 'Tautan Bukti Perbaikan']
      ];
      lkpsRevisions.forEach(item => {
        lkpsRows.push([item.no, item.tableCode, item.indicatorCode, item.beforeAL, item.findingAL, item.afterAL, item.evidenceUrl || '-']);
      });

      const workbook = XLSX.utils.book_new();
      const wsLed = XLSX.utils.aoa_to_sheet(ledRows);
      const wsLkps = XLSX.utils.aoa_to_sheet(lkpsRows);

      wsLed['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 40 }, { wch: 42 }, { wch: 45 }];
      wsLkps['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 38 }, { wch: 42 }, { wch: 45 }, { wch: 55 }];

      XLSX.utils.book_append_sheet(workbook, wsLed, 'Perubahan_LED');
      XLSX.utils.book_append_sheet(workbook, wsLkps, 'Perubahan_LKPS');

      XLSX.writeFile(workbook, filename);
      message.success(`Rekapitulasi perubahan pasca-AL berhasil diekspor ke Excel: ${filename}`);
    } catch (err: any) {
      message.error(`Gagal mengekspor: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  // Handler: Generate and Download Official Formatted PDF for Berita Acara & Lampiran Pasca-AL
  const handleExportBeritaAcaraPDF = () => {
    try {
      message.loading({ content: 'Menyiapkan berkas PDF resmi Berita Acara & Lampiran Pasca-AL...', key: 'exportBeritaAcara' });
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedLam = currentLam.lamCode.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedProdi = (studyInfo.studyProgramName || 'Prodi').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Berita_Acara_AL_Pasca_AL_${sanitizedLam}_${sanitizedProdi}_${timestamp}.pdf`;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // PAGE 1: KOP RESMI, BERITA ACARA, IDENTITAS, SKOR KRITERIA & TANDA TANGAN
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
      doc.text(`Perguruan Tinggi: ${studyInfo.universityName || 'Universitas Pattimura'} · ${studyInfo.facultyName || 'Fakultas Pertanian'}`, pageWidth / 2, 25, { align: 'center' });

      // Double line border for letterhead
      doc.setDrawColor(31, 41, 55);
      doc.setLineWidth(0.8);
      doc.line(14, 28, pageWidth - 14, 28);
      doc.setLineWidth(0.3);
      doc.line(14, 29.5, pageWidth - 14, 29.5);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(17, 24, 39);
      doc.text('BERITA ACARA ASESMEN LAPANGAN (AL)', pageWidth / 2, 36, { align: 'center' });
      doc.setFontSize(9.5);
      doc.text('& LAPORAN HASIL ASESMEN PASCA-AL', pageWidth / 2, 41, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`Nomor Surat Tugas: ${studyInfo.skPenugasanNo}`, pageWidth / 2, 46, { align: 'center' });

      // Preamble
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);
      const preamble = `Pada hari ini, dalam rangka pelaksanaan Akreditasi Program Studi ${studyInfo.studyProgramName} (${studyInfo.degreeLevel}) pada ${studyInfo.universityName || 'Universitas Pattimura'}, Tim Asesor ${currentLam.lamCode} telah melaksanakan Asesmen Lapangan (AL) dan menyepakati berita acara serta rekapitulasi perbaikan pasca-AL berikut:`;
      const splitPreamble = doc.splitTextToSize(preamble, pageWidth - 28);
      doc.text(splitPreamble, 14, 52);

      let currentY = 52 + (splitPreamble.length * 4.2);

      // Program Details Table
      autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.2, textColor: [31, 41, 55] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 4 } },
        body: [
          ['Perguruan Tinggi', ':', studyInfo.universityName || 'Universitas Pattimura'],
          ['Unit Pengelola / Fakultas', ':', studyInfo.facultyName || 'Fakultas Pertanian'],
          ['Program Studi', ':', `${studyInfo.studyProgramName} (${studyInfo.degreeLevel})`],
          ['Target Akreditasi', ':', `${studyInfo.accreditationTarget} (Hasil Rekomendasi: UNGGUL)`],
          ['Tanggal Asesmen Lapangan', ':', `${studyInfo.assessmentDateStart} s.d. ${studyInfo.assessmentDateEnd}`],
          ['Tim Asesor 1 (Ketua)', ':', `${studyInfo.asesor1Name} (${studyInfo.asesor1Institution})`],
          ['Tim Asesor 2 (Anggota)', ':', `${studyInfo.asesor2Name} (${studyInfo.asesor2Institution})`],
        ],
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;

      // Summary Kriteria Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text('I. RANGKUMAN PENILAIAN KRITERIA AKREDITASI (LAM & BAN-PT)', 14, currentY);

      currentY += 3;

      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [31, 41, 55] },
        head: [['No', 'Kriteria Akreditasi (BAN-PT / LAM)', 'Bobot (%)', 'Skor Rerata (0-4)', 'Status Capaian']],
        body: [
          ['1', 'Budaya Mutu (Masukan, Proses, Luaran, Dampak)', '25%', '3.82', 'Melampaui Standar (Unggul)'],
          ['2', 'Relevansi (Pendidikan, Penelitian, PkM)', '35%', '3.85', 'Melampaui Standar (Unggul)'],
          ['3', 'Akuntabilitas (Masukan, Proses, Luaran, Dampak)', '20%', '3.80', 'Melampaui Standar (Unggul)'],
          ['4', 'Diferensiasi Misi (Keunikan Pertanian Tropis Kepulauan)', '20%', '3.90', 'Distingtif & Unggul'],
          [{ content: 'Total Skor Terbobot: 384.50 / 400.00  |  Status Syarat Perlu Unggul: MEMENUHI (100%)  |  Rekomendasi: TERAKREDITASI UNGGUL', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] } }],
        ],
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      // Signature Block
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Ambon, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, pageWidth - 65, currentY);
      currentY += 3.5;
      doc.text('Tim Asesor Akreditasi,', 20, currentY);
      doc.text('Pimpinan Unit Pengelola / Dekan,', pageWidth - 75, currentY);

      currentY += 14;
      doc.setFont('helvetica', 'bold');
      doc.text(studyInfo.asesor1Name, 20, currentY);
      doc.text(studyInfo.dekanOrKaprodiName || 'Dekan Fakultas Pertanian', pageWidth - 75, currentY);

      currentY += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Asesor 1 (${studyInfo.asesor1Institution})`, 20, currentY);
      doc.text(`NIP: 196805141994031002`, pageWidth - 75, currentY);

      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(studyInfo.asesor2Name, 20, currentY);
      currentY += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Asesor 2 (${studyInfo.asesor2Institution})`, 20, currentY);

      // PAGE 2: LAMPIRAN 1 - REKAPITULASI PERUBAHAN DOKUMEN LED PASCA-AL
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('LAMPIRAN 1: REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA-AL', pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('BAGIAN A: LAPORAN EVALUASI DIRI (LED)', pageWidth / 2, 19, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 22, pageWidth - 14, 22);

      const ledTableData = ledRevisions.map(item => [
        item.no,
        `${item.indicatorCode}\n${item.indicatorName}`,
        item.beforeAL,
        item.findingAL,
        item.afterAL
      ]);

      autoTable(doc, {
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 32, fontStyle: 'bold' },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 },
          4: { cellWidth: 52 }
        },
        head: [['No', 'Kode / Elemen', 'Uraian Sebelum AL', 'Hasil Verifikasi / Temuan AL', 'Uraian Perbaikan Setelah AL']],
        body: ledTableData,
        margin: { left: 14, right: 14 },
      });

      // PAGE 3: LAMPIRAN 1 - BAGIAN B: LKPS REVISIONS
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('LAMPIRAN 1: REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA-AL', pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('BAGIAN B: LAPORAN KINERJA PROGRAM STUDI (LKPS / KUANTITATIF)', pageWidth / 2, 19, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 22, pageWidth - 14, 22);

      const lkpsTableData = lkpsRevisions.map(item => [
        item.no,
        `${item.tableCode}\n${item.indicatorCode}`,
        item.beforeAL,
        item.findingAL,
        item.afterAL,
        item.evidenceUrl ? 'Tersedia di Drive' : '-'
      ]);

      autoTable(doc, {
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 30, fontStyle: 'bold' },
          2: { cellWidth: 42 },
          3: { cellWidth: 45 },
          4: { cellWidth: 45 },
          5: { cellWidth: 18, halign: 'center' }
        },
        head: [['No', 'Tabel / Indikator', 'Data Sebelum AL', 'Temuan Verifikasi AL', 'Data Perbaikan Setelah AL', 'Tautan Bukti']],
        body: lkpsTableData,
        margin: { left: 14, right: 14 },
      });

      // PAGE 4: LAMPIRAN 2 - SIKLUS SPMI PPEPP & REKOMENDASI PEMBINAAN
      doc.addPage();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text('LAMPIRAN 2: REKOMENDASI PENERAPAN SIKLUS PENJAMINAN MUTU (SPMI PPEPP)', pageWidth / 2, 14, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('PROGRAM STUDI ' + (studyInfo.studyProgramName || 'PETERNAKAN').toUpperCase() + ' - UNIVERSITAS PATTIMURA', pageWidth / 2, 19, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 22, pageWidth - 14, 22);

      autoTable(doc, {
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2.2, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 32, fontStyle: 'bold' },
          1: { cellWidth: 88 },
          2: { cellWidth: 62 }
        },
        head: [['Tahap Siklus SPMI', 'Rekomendasi Tindak Lanjut Pasca-AL', 'Target & Bukti Kepatuhan']],
        body: [
          [
            '1. Penetapan (P)',
            'Memperbarui Standar Pendidikan, Penelitian, dan PkM dengan memasukkan indikator kinerja keunikan pertanian kepulauan dan pola ilmiah pokok Bina Mulia ke Lautan secara kuantitatif.',
            'SK Rektor / Dekan tentang Pembaruan Standar SPMI (Target: Q1 2027)'
          ],
          [
            '2. Pelaksanaan (P)',
            'Mengimplementasikan kurikulum OBE dan memastikan keterlibatan 100% DTPS dalam riset terapan dengan mahasiswa di wilayah kepulauan Maluku.',
            'RPS berbasis CPL, Kontrak Hibah Riset Payung, dan Bukti Logbook MBKM'
          ],
          [
            '3. Evaluasi (E)',
            'Melakukan Audit Mutu Internal (AMI) berkala setiap semester dan survei kepuasan pemangku kepentingan berbasis digital.',
            'Laporan Hasil AMI 2026/2027 dan Dashboard Evaluasi Dosen oleh Mahasiswa (EDOM)'
          ],
          [
            '4. Pengendalian (P)',
            'Menindaklanjuti setiap temuan ketidaksesuaian melalui Rapat Tinjauan Manajemen (RTM) fakultas dan menetapkan Rencana Tindak Lanjut (RTL).',
            'Risalah Rapat Tinjauan Manajemen (RTM) dan Laporan RTL Terverifikasi'
          ],
          [
            '5. Peningkatan (P)',
            'Menaikkan standar mutu secara berkelanjutan menuju akreditasi internasional dan penguatan reputasi riset tropis kepulauan.',
            'Benchmarking Internasional dan Sertifikasi Laboratorium KAN ISO/IEC 17025'
          ]
        ],
        margin: { left: 14, right: 14 },
      });

      // Page numbers footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Dokumen Resmi Pasca-AL | ${studyInfo.universityName || 'Universitas Pattimura'} - ${studyInfo.studyProgramName} | Halaman ${i} dari ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }

      doc.save(filename);
      message.success({ content: `Dokumen resmi Berita Acara & Lampiran Pasca-AL berhasil diunduh ke PDF (${filename})!`, key: 'exportBeritaAcara', duration: 4 });
    } catch (err: any) {
      message.error({ content: `Gagal mengekspor dokumen PDF: ${err.message || 'Terjadi kesalahan sistem'}`, key: 'exportBeritaAcara' });
    }
  };

  // Handler: Direct Print with guaranteed PDF auto-save and browser native print execution
  const handleDirectPrintDocument = () => {
    try {
      message.loading({ content: 'Mempersiapkan dokumen cetak & mengunduh PDF resmi...', key: 'printingDirect', duration: 2 });
      
      // 1. Unduh PDF Resmi Pasca-AL secara otomatis
      handleExportBeritaAcaraPDF();

      // 2. Buka modal pratinjau cetak agar dokumen ter-mount di DOM
      setIsPrintModalOpen(true);

      // 3. Panggil dialog cetak browser
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Native window.print failed, attempting iframe print fallback', err);
        }

        message.success({ 
          content: 'Tombol Cetak Dokumen Sekarang aktif! Berkas PDF resmi telah berhasil diunduh dan dialog cetak siap digunakan.', 
          key: 'printingDirect', 
          duration: 4 
        });
      }, 400);
    } catch (e: any) {
      console.error(e);
      window.print();
    }
  };

  // Columns for LED Table
  const ledColumns: ColumnsType<LedRevisionItem> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center',
    },
    {
      title: 'Nomor Indikator',
      key: 'indicator',
      width: 140,
      render: (_val, record) => (
        <Space orientation="vertical" size={2}>
          <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {record.indicatorCode}
          </Tag>
          <Text strong style={{ fontSize: 12 }}>{record.indicatorName}</Text>
        </Space>
      ),
    },
    {
      title: 'Uraian Sebelum AL',
      dataIndex: 'beforeAL',
      key: 'beforeAL',
      width: '28%',
      render: (text) => (
        <Paragraph style={{ margin: 0, fontSize: 12, color: token.colorTextSecondary }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: 'Hasil Verifikasi / Temuan AL',
      dataIndex: 'findingAL',
      key: 'findingAL',
      width: '32%',
      render: (text) => (
        <div style={{ padding: '6px 10px', backgroundColor: token.colorWarningBg, borderLeft: `3px solid ${token.colorWarning}`, borderRadius: token.borderRadiusSM }}>
          <Text style={{ fontSize: 12, color: token.colorText }}>
            {text}
          </Text>
        </div>
      ),
    },
    {
      title: 'Uraian Setelah AL (Revisi Pasca-AL)',
      dataIndex: 'afterAL',
      key: 'afterAL',
      width: '32%',
      render: (text) => (
        <div style={{ padding: '6px 10px', backgroundColor: token.colorSuccessBg, borderLeft: `3px solid ${token.colorSuccess}`, borderRadius: token.borderRadiusSM }}>
          <Text strong style={{ fontSize: 12, color: token.colorText }}>
            {text}
          </Text>
        </div>
      ),
    },
  ];

  // Columns for LKPS Table
  const lkpsColumns: ColumnsType<LkpsRevisionItem> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center',
    },
    {
      title: 'Tabel LKPS & Indikator',
      key: 'tableCode',
      width: 160,
      render: (_val, record) => (
        <Space orientation="vertical" size={2}>
          <Tag color="purple" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {record.tableCode}
          </Tag>
          <Text strong style={{ fontSize: 12 }}>{record.indicatorCode}</Text>
        </Space>
      ),
    },
    {
      title: 'Uraian Sebelum AL',
      dataIndex: 'beforeAL',
      key: 'beforeAL',
      width: '24%',
      render: (text) => (
        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Hasil Verifikasi / Temuan AL',
      dataIndex: 'findingAL',
      key: 'findingAL',
      width: '28%',
      render: (text) => (
        <div style={{ padding: '6px 10px', backgroundColor: token.colorWarningBg, borderLeft: `3px solid ${token.colorWarning}`, borderRadius: token.borderRadiusSM }}>
          <Text style={{ fontSize: 12 }}>{text}</Text>
        </div>
      ),
    },
    {
      title: 'Uraian Setelah AL',
      dataIndex: 'afterAL',
      key: 'afterAL',
      width: '28%',
      render: (_text, record) => (
        <div style={{ padding: '6px 10px', backgroundColor: token.colorSuccessBg, borderLeft: `3px solid ${token.colorSuccess}`, borderRadius: token.borderRadiusSM }}>
          <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {record.afterAL}
          </Text>
          {record.evidenceUrl && (
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              href={record.evidenceUrl}
              target="_blank"
              rel="noreferrer"
              style={{ padding: 0, height: 'auto', fontSize: 11 }}
            >
              Dokumen Perbaikan: Tautan Drive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%', padding: '16px 24px' }}>
      {/* Top Banner Header matching the official LAM & Unpatti document */}
      <Card>
        <Row gutter={[24, 24]} align="middle" justify="space-between">
          <Col xs={24} lg={10}>
            <Space orientation="vertical" size="small">
              <Space wrap>
                <Tag color="cyan">DOKUMEN RESMI ASESMEN LAPANGAN</Tag>
                <Tag color="green">Pasca-Asesmen Lapangan (AL)</Tag>
                <Text type="secondary">Acuan: {currentLam.regulationBasis}</Text>
              </Space>

              <Title level={4} style={{ margin: 0, letterSpacing: 0.5 }}>
                Berita Acara AL & Rekapitulasi Perubahan Dokumen Pasca-AL
              </Title>

              <Paragraph style={{ margin: 0, color: token.colorTextSecondary }}>
                Disusun sesuai format resmi <strong>{currentLam.lamName} ({currentLam.lamCode})</strong> untuk <strong>{studyInfo.universityName || 'Universitas Pattimura'}</strong>, Program Studi <strong>{studyInfo.studyProgramName}</strong> ({studyInfo.degreeLevel}). Memuat Berita Acara, Laporan Hasil Asesmen (LHA), Rekapitulasi Perubahan Dokumen LED & LKPS, dan Lampiran Perbaikan SPMI PPEPP.
              </Paragraph>
            </Space>
          </Col>

          <Col xs={24} lg={14}>
            <Flex justify="flex-end" gap="small" wrap="wrap" align="center">
              <Button 
                icon={<FileExcelOutlined />} 
                onClick={handleExportRevisionsToExcel}
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
              >
                Unduh Rekapitulasi (.xlsx)
              </Button>
              <Button 
                icon={<FilePdfOutlined />} 
                onClick={handleExportBeritaAcaraPDF}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
              >
                Cetak PDF
              </Button>

              {/* Menu Role untuk User dan Admin sebelah kanan Cetak PDF */}
              <Space size={4} style={{ backgroundColor: token.colorBgElevated, padding: '2px 8px', borderRadius: 8, border: `1px solid ${token.colorBorder}` }}>
                <Text style={{ fontSize: 11, color: token.colorTextSecondary, fontWeight: 600 }}>Role:</Text>
                <Segmented
                  value={activeRoleState}
                  onChange={(val) => handleRoleChange(val as 'user' | 'admin')}
                  options={[
                    {
                      label: (
                        <Space size={4}>
                          <UserOutlined style={{ color: activeRoleState === 'user' ? '#10b981' : undefined }} />
                          <span>User</span>
                        </Space>
                      ),
                      value: 'user',
                    },
                    {
                      label: (
                        <Space size={4}>
                          <SafetyCertificateOutlined style={{ color: activeRoleState === 'admin' ? '#ec4899' : undefined }} />
                          <span>Admin</span>
                        </Space>
                      ),
                      value: 'admin',
                    },
                  ]}
                />
              </Space>

              <Button 
                type="primary" 
                icon={<PrinterOutlined />} 
                onClick={handleDirectPrintDocument}
                style={{ fontWeight: 600 }}
              >
                Cetak Dokumen Sekarang
              </Button>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => setIsPrintModalOpen(true)}
              >
                Pratinjau Cetak
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Form Isian Personil Asesor 1, Asesor 2, & Pimpinan UPPS (Tempat di bawah Asesor 1 & Asesor 2 serta Konsensus AL) */}
      <AssessorLeadershipForm
        studyInfo={studyInfo}
        onUpdateStudyInfo={onUpdateStudyInfo || (() => {})}
      />

      {/* Main Tabs Navigation for Berita Acara & Lampiran */}
      <Card>
        <Tabs
          activeKey={activeSubTab}
          onChange={setActiveSubTab}
          type="card"
          items={[
            {
              key: 'lha',
              label: (
                <Space>
                  <AuditOutlined />
                  <span>Berita Acara & LHA (Induk)</span>
                </Space>
              ),
              children: (
                <Space orientation="vertical" size="middle" style={{ width: '100%', padding: '8px 0' }}>
                  {/* Kop Resmi Dokumen */}
                  <div style={{ textAlign: 'center', borderBottom: `2px solid ${token.colorBorder}`, paddingBottom: 16 }}>
                    <Title level={4} style={{ margin: 0, textTransform: 'uppercase' }}>
                      {currentLam.lamName} ({currentLam.lamCode})
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                      Accreditation Agency for Higher Education · Dewan Eksekutif Akreditasi
                    </Text>
                    <Text italic style={{ fontSize: 11, color: token.colorTextTertiary, display: 'block' }}>
                      Sekretariat Dewan Eksekutif · Alamat Kontak Resmi LAM
                    </Text>
                  </div>

                  {/* Document Title */}
                  <div style={{ textAlign: 'center', margin: '14px 0' }}>
                    <Title level={5} style={{ margin: 0, textDecoration: 'underline', textTransform: 'uppercase' }}>
                      LAPORAN HASIL ASESMEN (LHA) & BERITA ACARA ASESMEN LAPANGAN
                    </Title>
                    <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      Nomor Surat Tugas: {studyInfo.skPenugasanNo}
                    </Text>
                  </div>

                  {/* Metadata Table */}
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Perguruan Tinggi">
                      <Text strong>{studyInfo.universityName || 'Universitas Pattimura'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Fakultas / UPPS">
                      {studyInfo.facultyName || 'Fakultas Terkait'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Program Studi">
                      <Text strong>{studyInfo.studyProgramName}</Text> ({studyInfo.degreeLevel})
                    </Descriptions.Item>
                    <Descriptions.Item label="Jadwal Pelaksanaan AL">
                      {studyInfo.assessmentDateStart} s/d {studyInfo.assessmentDateEnd}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tim Asesor AL">
                      1. {studyInfo.asesor1Name} ({studyInfo.asesor1Institution}) - <em>Ketua Tim</em><br />
                      2. {studyInfo.asesor2Name} ({studyInfo.asesor2Institution}) - <em>Anggota Tim</em>
                    </Descriptions.Item>
                    <Descriptions.Item label="Pimpinan UPPS / Dekan">
                      {studyInfo.dekanOrKaprodiName}
                    </Descriptions.Item>
                  </Descriptions>

                  {/* Narasi Pendahuluan & Proses Asesmen */}
                  <div style={{ marginTop: 16, backgroundColor: token.colorBgElevated, padding: 16, borderRadius: token.borderRadius }}>
                    <Title level={5}>1. Pendahuluan & Landasan Akreditasi</Title>
                    <Paragraph style={{ textAlign: 'justify', fontSize: 13, lineHeight: '1.7' }}>
                      Penilaian akreditasi ini dilakukan untuk memotret dan mengonfirmasi Program Studi {studyInfo.studyProgramName} ({studyInfo.degreeLevel}) di Universitas Pattimura. Akreditasi merupakan wujud kepatuhan terhadap UU No. 12 Tahun 2012 tentang Pendidikan Tinggi, Permenristekdikti No. 62 Tahun 2016 tentang SPM Dikti, Permendikbud No. 3 Tahun 2020 tentang SN Dikti, Permendikbud No. 5 Tahun 2020 tentang Akreditasi Program Studi dan Perguruan Tinggi, Permendiktisaintek No. 39 Tahun 2025 & No. 10 Tahun 2026, serta Peraturan {currentLam.lamCode} Nomor 4 Tahun 2025 tentang Instrumen Akreditasi Program Studi.
                    </Paragraph>

                    <Title level={5} style={{ marginTop: 14 }}>2. Profil UPPS & Diferensiasi Misi</Title>
                    <Paragraph style={{ textAlign: 'justify', fontSize: 13, lineHeight: '1.7' }}>
                      Fakultas pengelola di Universitas Pattimura didukung oleh sumber daya manusia yang mumpuni dengan kualifikasi Doktor (S3) mencapai lebih dari 50% dan didukung para Guru Besar. Rasio dosen terhadap mahasiswa terkelola secara optimal. Keunggulan kompetitif prodi berakar pada Diferensiasi Misi berbasis kearifan lokal kepulauan Maluku (Pola Ilmiah Pokok "Bina Mulia ke Lautan"), mengadopsi kurikulum Outcome-Based Education (OBE) yang selaras dengan standar nasional dan kebutuhan masyarakat pulau-pulau kecil.
                    </Paragraph>

                    <Title level={5} style={{ marginTop: 14 }}>3. Proses Pelaksanaan Asesmen Lapangan</Title>
                    <Paragraph style={{ textAlign: 'justify', fontSize: 13, lineHeight: '1.7' }}>
                      Asesmen Lapangan diawali dengan pembukaan dihadiri oleh Wakil Rektor 1 Universitas Pattimura, Lembaga Penjaminan Mutu (LPM), LPPM, Dekan, Wakil Dekan, Kepala Jurusan, Koprodi, serta seluruh panitia dosen dan tendik. Dilakukan konfirmasi terkait rencana pengembangan UPPS, efektivitas SPMI siklus PPEPP, data final LKPS, pengecekan sarana laboratorium, serta sesi wawancara triangulasi dengan dosen, tenaga kependidikan, mahasiswa, alumni, dan mitra pengguna lulusan (Dinas terkait dan Pemerintah Desa Binaan).
                    </Paragraph>

                    <Title level={5} style={{ marginTop: 14 }}>4. Kesimpulan Hasil Asesmen Lapangan</Title>
                    <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: '1.7' }}>
                      <li><strong>Budaya Mutu:</strong> Organ dan tupoksi penjaminan mutu berfungsi dengan baik, tersedia perangkat SPMI siklus PPEPP dan bukti implementasi terdokumentasi secara digital.</li>
                      <li><strong>Relevansi Pendidikan:</strong> Kurikulum berbasis OBE telah terintegrasi dengan CPL, RPS pada seluruh mata kuliah, serta pelibatan pemangku kepentingan dalam lokakarya kurikulum.</li>
                      <li><strong>Relevansi Penelitian & PkM:</strong> UPPS memiliki peta jalan (roadmap) riset terintegrasi selaras VMTS keilmuan kepulauan, didukung luaran HKI, buku ajar ber-ISBN, dan inovasi desa binaan.</li>
                      <li><strong>Akuntabilitas & Diferensiasi Misi:</strong> Tata pamong transparan, tata laksana BMN terkelola, dan diferensiasi misi pertanian/keilmuan kepulauan terwujud secara nyata.</li>
                    </ul>
                  </div>

                  {/* Signatures Block */}
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Text italic style={{ fontSize: 12, display: 'block', textAlign: 'right', marginBottom: 20 }}>
                      Tempat: Ambon, Tanggal: 7 Oktober 2026
                    </Text>

                    <Row gutter={24}>
                      <Col span={8}>
                        <Text strong style={{ display: 'block', marginBottom: 50 }}>Asesor 1 (Ketua Tim):</Text>
                        <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 6 }}>
                          <Text strong style={{ display: 'block' }}>{studyInfo.asesor1Name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{studyInfo.asesor1Institution}</Text>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text strong style={{ display: 'block', marginBottom: 50 }}>Asesor 2 (Anggota Tim):</Text>
                        <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 6 }}>
                          <Text strong style={{ display: 'block' }}>{studyInfo.asesor2Name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{studyInfo.asesor2Institution}</Text>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text strong style={{ display: 'block', marginBottom: 50 }}>Pimpinan UPPS / Dekan:</Text>
                        <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 6 }}>
                          <Text strong style={{ display: 'block' }}>{studyInfo.dekanOrKaprodiName}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{studyInfo.facultyName}</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Space>
              ),
            },
            {
              key: 'lampiran-rekapitulasi',
              label: (
                <Space>
                  <FileTextOutlined />
                  <span>Lampiran 1: Rekapitulasi Perubahan Pasca-AL</span>
                </Space>
              ),
              children: (
                <Space orientation="vertical" size="large" style={{ width: '100%', padding: '8px 0' }}>
                  {/* Header of Lampiran */}
                  <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
                    <Flex justify="space-between" align="center" wrap="wrap">
                      <div>
                        <Text strong style={{ fontSize: 14 }}>
                          REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA ASESMEN LAPANGAN
                        </Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {studyInfo.universityName || 'Universitas Pattimura'} · {studyInfo.studyProgramName} ({studyInfo.degreeLevel}) · {currentLam.lamCode}
                        </Text>
                      </div>
                      <Button 
                        size="small" 
                        icon={<FileExcelOutlined />} 
                        onClick={handleExportRevisionsToExcel}
                        style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                      >
                        Ekspor Spreadsheet (.xlsx)
                      </Button>
                    </Flex>
                  </Card>

                  {/* Section 1: LED Changes Table */}
                  <div>
                    <Title level={5} style={{ marginBottom: 10 }}>
                      1. Laporan Evaluasi Diri ({currentLam.docTerms.qualitativeDoc})
                    </Title>
                    <Table
                      rowKey="id"
                      columns={ledColumns}
                      dataSource={ledRevisions}
                      pagination={false}
                      bordered
                      size="middle"
                    />
                  </div>

                  {/* Section 2: LKPS Changes Table */}
                  <div>
                    <Title level={5} style={{ marginBottom: 10 }}>
                      2. Laporan Kinerja Program Studi ({currentLam.docTerms.quantitativeDoc})
                    </Title>
                    <Table
                      rowKey="id"
                      columns={lkpsColumns}
                      dataSource={lkpsRevisions}
                      pagination={false}
                      bordered
                      size="middle"
                    />
                  </div>

                  {/* Signatures of Assessors on Post-AL Revision */}
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <Text italic style={{ fontSize: 12, display: 'block', textAlign: 'right', marginBottom: 16 }}>
                      Tempat: Ambon, Tanggal: 7 Oktober 2026
                    </Text>

                    <Row gutter={24} justify="center">
                      <Col span={10}>
                        <Text strong style={{ display: 'block', marginBottom: 44 }}>Asesor 1 (Ketua Tim):</Text>
                        <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 6 }}>
                          <Text strong style={{ display: 'block' }}>{studyInfo.asesor1Name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{studyInfo.asesor1Institution}</Text>
                        </div>
                      </Col>
                      <Col span={10}>
                        <Text strong style={{ display: 'block', marginBottom: 44 }}>Asesor 2 (Anggota Tim):</Text>
                        <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: 6 }}>
                          <Text strong style={{ display: 'block' }}>{studyInfo.asesor2Name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{studyInfo.asesor2Institution}</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Space>
              ),
            },
            {
              key: 'lampiran-spmi',
              label: (
                <Space>
                  <SafetyCertificateOutlined />
                  <span>Lampiran 2: Lampiran Perbaikan SPMI & PPEPP</span>
                </Space>
              ),
              children: (
                <Space orientation="vertical" size="large" style={{ width: '100%', padding: '8px 0' }}>
                  {/* Digital SPMI Portals of Universitas Pattimura */}
                  <Card 
                    title={
                      <Space>
                        <GlobalOutlined style={{ color: token.colorPrimary }} />
                        <span>Digitalisasi SPMI Universitas Pattimura & Fakultas</span>
                      </Space>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
                          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                            Portal Layanan Terintegrasi SPMI Unpatti (LPMPP)
                          </Text>
                          <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 8px' }}>
                            Pusat layanan digital penjaminan mutu tingkat universitas mencakup AMI, monev, dan instrumen kepuasan.
                          </Paragraph>
                          <Button 
                            type="link" 
                            icon={<LinkOutlined />} 
                            href="https://portallpmpp.simpatti.site/" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ padding: 0 }}
                          >
                            https://portallpmpp.simpatti.site/
                          </Button>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
                          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                            Repositori Dokumentasi Mutu Digital Unpatti
                          </Text>
                          <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 8px' }}>
                            Pusat unduhan buku saku SPMI, standar mutu, kebijakan mutu, kalender siklus SPMI, dan SOP.
                          </Paragraph>
                          <Button 
                            type="link" 
                            icon={<LinkOutlined />} 
                            href="https://dokumentasi.simpatti.site/" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ padding: 0 }}
                          >
                            https://dokumentasi.simpatti.site/
                          </Button>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
                          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                            Sistem Penjaminan Mutu Fakultas Pertanian Unpatti
                          </Text>
                          <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 8px' }}>
                            Laman resmi pemantauan SPMI tingkat UPPS, kalender implementasi satu siklus PPEPP, dan laporan AMI.
                          </Paragraph>
                          <Button 
                            type="link" 
                            icon={<LinkOutlined />} 
                            href="https://faperta.unpatti.ac.id/sistem-penjaminan-mutu-2023-2/" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ padding: 0 }}
                          >
                            https://faperta.unpatti.ac.id/sistem-penjaminan-mutu-2023-2/
                          </Button>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" style={{ backgroundColor: token.colorBgElevated }}>
                          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                            Portal Ekosistem Digital Kurikulum OBE (SIMPELOBE)
                          </Text>
                          <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 8px' }}>
                            Desain RPS digital, modul asesmen CPL-CPMK, dan pengusulan buku ajar matakuliah.
                          </Paragraph>
                          <Button 
                            type="link" 
                            icon={<LinkOutlined />} 
                            href="https://simpelobe.simpatti.site/rps/penyuluhan.html" 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ padding: 0 }}
                          >
                            https://simpelobe.simpatti.site/
                          </Button>
                        </Card>
                      </Col>
                    </Row>
                  </Card>

                  {/* Comprehensive PPEPP Descriptions (Academic & Non-Academic) */}
                  <Card title="Penerapan Siklus PPEPP Akademik & Non-Akademik Pasca-AL">
                    <Row gutter={[20, 20]}>
                      <Col xs={24} md={12}>
                        <Card size="small" title="1. PPEPP Pendidikan & Pembelajaran" style={{ backgroundColor: token.colorBgElevated }}>
                          <ul style={{ paddingLeft: 16, fontSize: 12, lineHeight: '1.7', margin: 0 }}>
                            <li><strong>Penetapan (P):</strong> Perangkat SPMI, Kebijakan, Manual Mutu, Standar OBE, dan RPS digital.</li>
                            <li><strong>Pelaksanaan (P):</strong> Terdata di SIAKAD (presensi, jurnal kuliah, logbook praktikum).</li>
                            <li><strong>Evaluasi (E):</strong> EDOM berkala di SIAKAD, Laporan AMI Akademik, survei kepuasan.</li>
                            <li><strong>Pengendalian (P):</strong> Rapat Tinjauan Manajemen (RTM) dan Lembar Tindak Lanjut (PTK).</li>
                            <li><strong>Peningkatan (P):</strong> Continuous Quality Improvement (CQI) dan revisi kurikulum berkala.</li>
                          </ul>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" title="2. PPEPP Penelitian & Pengabdian Masyarakat" style={{ backgroundColor: token.colorBgElevated }}>
                          <ul style={{ paddingLeft: 16, fontSize: 12, lineHeight: '1.7', margin: 0 }}>
                            <li><strong>Penetapan (P):</strong> Renstra Riset, Roadmap PkM, dan Standar SPMI Penelitian LPPM.</li>
                            <li><strong>Pelaksanaan (P):</strong> Melalui portal SILINTAS / SIMLIBTAMAS, kontrak penelitian, logbook riset.</li>
                            <li><strong>Evaluasi (E):</strong> Monev kemajuan dan laporan akhir riset/PkM, audit kepuasan mitra.</li>
                            <li><strong>Pengendalian (P):</strong> Notulensi RTM Fakultas, penanganan keterlambatan luaran HKI.</li>
                            <li><strong>Peningkatan (P):</strong> Peningkatan hibah matching fund Kedaireka dan kemitraan internasional.</li>
                          </ul>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" title="3. PPEPP Organisasi & Tata Kerja (Non-Akademik)" style={{ backgroundColor: token.colorBgElevated }}>
                          <ul style={{ paddingLeft: 16, fontSize: 12, lineHeight: '1.7', margin: 0 }}>
                            <li><strong>Penetapan (P):</strong> Statuta Universitas, Peraturan OTK, Analisis Jabatan (Anjab), SOP Layanan.</li>
                            <li><strong>Pelaksanaan (P):</strong> Sistem Pengendalian Intern Pemerintah (SPIP), Sasaran Kerja Pegawai (SKP).</li>
                            <li><strong>Evaluasi (E):</strong> Audit pengawasan non-akademik oleh Satuan Pengawas Internal (SPI).</li>
                            <li><strong>Pengendalian (P):</strong> Lembar Tindak Lanjut rekomendasi pengawasan SPI dan RTM.</li>
                            <li><strong>Peningkatan (P):</strong> Pembangunan Zona Integritas (ZI) menuju WBK / WBBM.</li>
                          </ul>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card size="small" title="4. PPEPP Pengelolaan Keuangan & Sarana Prasarana" style={{ backgroundColor: token.colorBgElevated }}>
                          <ul style={{ paddingLeft: 16, fontSize: 12, lineHeight: '1.7', margin: 0 }}>
                            <li><strong>Penetapan (P):</strong> DIPA PNBP BLU, RKBMN, Standar Biaya Masukan, SOP Pengadaan BMN.</li>
                            <li><strong>Pelaksanaan (P):</strong> Penatausahaan SPM, aplikasi SIMAK-BMN, pemeliharaan lab & kebun.</li>
                            <li><strong>Evaluasi (E):</strong> Pemeriksaan fisik kas (Cash Opname) dan Stock Opname BMN berkala oleh SPI.</li>
                            <li><strong>Pengendalian (P):</strong> Tindak lanjut temuan DTA dan verifikasi label NUP BMN.</li>
                            <li><strong>Peningkatan (P):</strong> Modernisasi lab smart greenhouse dan digitalisasi pengadaan.</li>
                          </ul>
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Pratinjau & Cetak Dokumen Resmi Pasca-AL */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: token.colorPrimary }} />
            <span>Pratinjau & Cetak Dokumen Resmi: Berita Acara & Lampiran Pasca-AL</span>
          </Space>
        }
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={950}
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={() => setIsPrintModalOpen(false)}>
            Tutup
          </Button>,
          <Button 
            key="excel"
            icon={<FileExcelOutlined />} 
            onClick={handleExportRevisionsToExcel}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
          >
            Unduh Excel (.xlsx)
          </Button>,
          <Button 
            key="pdf"
            type="primary"
            icon={<FilePdfOutlined />} 
            onClick={handleExportBeritaAcaraPDF}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
          >
            Unduh PDF Resmi (jsPDF)
          </Button>,
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handleDirectPrintDocument}
            style={{ fontWeight: 600 }}
          >
            Cetak Dokumen Sekarang
          </Button>,
        ]}
      >
        <div 
          id="printable-pasca-al-document"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#111827', 
            padding: '32px', 
            borderRadius: 8,
            maxHeight: '72vh',
            overflowY: 'auto',
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Kop Resmi Dokumen */}
          <div className="kop-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderBottom: '3px double #111827', paddingBottom: 14, marginBottom: 18 }}>
            <img 
              src="/logo_unpatti.png" 
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Logo_Universitas_Pattimura_Terbaru.png/330px-Logo_Universitas_Pattimura_Terbaru.png";
              }}
              alt="Logo Universitas Pattimura" 
              style={{ width: 62, height: 62, objectFit: 'contain' }} 
            />
            <div style={{ textAlign: 'center' }}>
              <h3 className="kop-title" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 1, color: '#111827', fontSize: 17 }}>
                {currentLam.lamName} ({currentLam.lamCode})
              </h3>
              <p className="kop-sub" style={{ margin: '3px 0', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                LEMBAGA AKREDITASI MANDIRI PENDIDIKAN TINGGI · DEWAN EKSEKUTIF
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}>
                Perguruan Tinggi: {studyInfo.universityName || 'Universitas Pattimura'} · {studyInfo.facultyName || 'Fakultas Pertanian'}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#6b7280' }}>
                Landasan Hukum: {currentLam.regulationBasis}
              </p>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div style={{ textAlign: 'center', margin: '18px 0 14px 0' }}>
            <h4 className="doc-title" style={{ margin: 0, textDecoration: 'underline', textTransform: 'uppercase', color: '#111827', fontSize: 15, fontWeight: 'bold' }}>
              BERITA ACARA ASESMEN LAPANGAN (AL) & LAPORAN HASIL ASESMEN
            </h4>
            <p style={{ margin: '4px 0', fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
              Nomor Surat Tugas: {studyInfo.skPenugasanNo}
            </p>
          </div>

          {/* Narasi Preamble */}
          <p style={{ textAlign: 'justify', fontSize: 12, lineHeight: '1.7', color: '#1f2937', marginBottom: 14 }}>
            Pada hari ini, dalam rangka pelaksanaan Akreditasi Program Studi <strong>{studyInfo.studyProgramName}</strong> ({studyInfo.degreeLevel}) pada <strong>{studyInfo.universityName || 'Universitas Pattimura'}</strong>, Tim Asesor {currentLam.lamCode} telah melaksanakan Asesmen Lapangan (AL) secara luring/daring dan menyepakati Berita Acara serta rekapitulasi perbaikan pasca-AL sebagai berikut:
          </p>

          {/* Tabel Identitas Program Studi */}
          <table className="no-border" style={{ width: '100%', fontSize: 12, marginBottom: 16, color: '#1f2937' }}>
            <tbody>
              <tr>
                <td style={{ width: 200, fontWeight: 'bold', padding: '3px 6px' }}>1. Perguruan Tinggi</td>
                <td style={{ width: 15, padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.universityName || 'Universitas Pattimura'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '3px 6px' }}>2. Unit Pengelola / Fakultas</td>
                <td style={{ padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.facultyName || 'Fakultas Pertanian'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '3px 6px' }}>3. Program Studi & Jenjang</td>
                <td style={{ padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.studyProgramName} ({studyInfo.degreeLevel})</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '3px 6px' }}>4. Tanggal Pelaksanaan AL</td>
                <td style={{ padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.assessmentDateStart} s.d. {studyInfo.assessmentDateEnd}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '3px 6px' }}>5. Tim Asesor 1 (Ketua Tim)</td>
                <td style={{ padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.asesor1Name} ({studyInfo.asesor1Institution})</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', padding: '3px 6px' }}>6. Tim Asesor 2 (Anggota Tim)</td>
                <td style={{ padding: '3px 6px' }}>:</td>
                <td style={{ padding: '3px 6px' }}>{studyInfo.asesor2Name} ({studyInfo.asesor2Institution})</td>
              </tr>
            </tbody>
          </table>

          {/* Tabel Rangkuman Skor Kriteria */}
          <h5 style={{ margin: '14px 0 8px 0', fontSize: 13, textTransform: 'uppercase', color: '#111827' }}>
            I. Rangkuman Skor Capaian Kriteria Akreditasi (LAM & BAN-PT)
          </h5>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center', width: 45 }}>No</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px' }}>Kriteria Akreditasi</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center', width: 90 }}>Bobot</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center', width: 110 }}>Rerata Skor</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px 8px', textAlign: 'center', width: 140 }}>Status Capaian</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>1</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>Budaya Mutu (Masukan, Proses, Luaran, Dampak)</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>25%</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', padding: '6px 8px' }}>3.82</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#166534', fontWeight: 'bold', padding: '6px 8px' }}>Unggul</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>2</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>Relevansi (Pendidikan, Penelitian, PkM)</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>35%</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', padding: '6px 8px' }}>3.85</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#166534', fontWeight: 'bold', padding: '6px 8px' }}>Unggul</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>3</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>Akuntabilitas (Masukan, Proses, Luaran, Dampak)</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>20%</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', padding: '6px 8px' }}>3.80</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#166534', fontWeight: 'bold', padding: '6px 8px' }}>Unggul</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>4</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px 8px' }}>Diferensiasi Misi (Keunikan Pertanian Tropis Kepulauan)</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '6px 8px' }}>20%</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', padding: '6px 8px' }}>3.90</td>
                <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#166534', fontWeight: 'bold', padding: '6px 8px' }}>Unggul</td>
              </tr>
              <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold' }}>
                <td colSpan={3} style={{ border: '1px solid #9ca3af', padding: '8px', textAlign: 'right' }}>
                  Total Skor Terbobot & Status Rekomendasi:
                </td>
                <td style={{ border: '1px solid #9ca3af', textAlign: 'center', fontFamily: 'monospace', fontSize: 13, color: '#15803d', padding: '8px' }}>
                  384.50 / 400
                </td>
                <td style={{ border: '1px solid #9ca3af', textAlign: 'center', color: '#15803d', padding: '8px' }}>
                  TERAKREDITASI UNGGUL
                </td>
              </tr>
            </tbody>
          </table>

          {/* Lembar Tanda Tangan */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ textAlign: 'right', fontSize: 11, color: '#4b5563', margin: '0 0 16px 0' }}>
              Ditetapkan di Ambon, Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 12 }}>
              <tbody>
                <tr>
                  <td style={{ border: 'none', width: '33%', verticalAlign: 'top', padding: '8px' }}>
                    <p style={{ margin: '0 0 55px 0', fontWeight: 'bold' }}>Asesor 1 (Ketua Tim):</p>
                    <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{studyInfo.asesor1Name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#4b5563' }}>{studyInfo.asesor1Institution}</p>
                  </td>
                  <td style={{ border: 'none', width: '33%', verticalAlign: 'top', padding: '8px' }}>
                    <p style={{ margin: '0 0 55px 0', fontWeight: 'bold' }}>Asesor 2 (Anggota Tim):</p>
                    <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{studyInfo.asesor2Name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#4b5563' }}>{studyInfo.asesor2Institution}</p>
                  </td>
                  <td style={{ border: 'none', width: '33%', verticalAlign: 'top', padding: '8px' }}>
                    <p style={{ margin: '0 0 55px 0', fontWeight: 'bold' }}>Pimpinan UPPS / Dekan:</p>
                    <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>{studyInfo.dekanOrKaprodiName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#4b5563' }}>{studyInfo.facultyName || 'Fakultas Pertanian'}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PEMBATAS HALAMAN LAMPIRAN 1 */}
          <div className="page-break" style={{ borderTop: '2px dashed #9ca3af', margin: '30px 0 20px 0', paddingTop: 20 }}>
            <h4 style={{ textAlign: 'center', textTransform: 'uppercase', textDecoration: 'underline', margin: '0 0 6px 0', fontSize: 14, color: '#111827' }}>
              LAMPIRAN 1: REKAPITULASI PERUBAHAN DOKUMEN AKREDITASI PASCA ASESMEN LAPANGAN (AL)
            </h4>
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#374151', margin: 0 }}>
              BAGIAN A: LAPORAN EVALUASI DIRI (LED)
            </p>
          </div>

          {/* Tabel Perubahan LED */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center', width: 35 }}>No</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', width: 130 }}>Elemen / Indikator</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Uraian Sebelum AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Temuan Hasil Verifikasi AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Uraian Perbaikan Setelah AL</th>
              </tr>
            </thead>
            <tbody>
              {ledRevisions.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '5px' }}>{item.no}</td>
                  <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '5px' }}>
                    {item.indicatorCode} - {item.indicatorName}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5 }}>{item.beforeAL}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5, color: '#b45309' }}>{item.findingAL}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5, color: '#15803d' }}>{item.afterAL}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bagian B: LKPS */}
          <div style={{ margin: '20px 0 10px 0' }}>
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#374151', margin: 0 }}>
              BAGIAN B: LAPORAN KINERJA PROGRAM STUDI (LKPS / DATA KUANTITATIF)
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', textAlign: 'center', width: 35 }}>No</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', width: 120 }}>Tabel / Indikator</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Data Sebelum AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Hasil Verifikasi AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Data Perbaikan Setelah AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', width: 100 }}>Tautan Bukti</th>
              </tr>
            </thead>
            <tbody>
              {lkpsRevisions.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '5px' }}>{item.no}</td>
                  <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '5px' }}>
                    {item.tableCode} - {item.indicatorCode}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5 }}>{item.beforeAL}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5, color: '#b45309' }}>{item.findingAL}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10.5, color: '#15803d' }}>{item.afterAL}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '5px', fontSize: 10 }}>
                    {item.evidenceUrl ? (
                      <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                        Tautan Bukti
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PEMBATAS HALAMAN LAMPIRAN 2 */}
          <div className="page-break" style={{ borderTop: '2px dashed #9ca3af', margin: '30px 0 20px 0', paddingTop: 20 }}>
            <h4 style={{ textAlign: 'center', textTransform: 'uppercase', textDecoration: 'underline', margin: '0 0 6px 0', fontSize: 14, color: '#111827' }}>
              LAMPIRAN 2: REKOMENDASI PENERAPAN SIKLUS PENJAMINAN MUTU (SPMI PPEPP) PASCA-AL
            </h4>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', width: 150 }}>Tahapan PPEPP</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px' }}>Rekomendasi Tindak Lanjut Pasca-AL</th>
                <th style={{ border: '1px solid #9ca3af', padding: '6px', width: 180 }}>Dokumen / Bukti Kepatuhan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '6px' }}>1. Penetapan (P)</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>Memperbarui Standar Tridharma dengan memasukkan indikator diferensiasi misi pertanian kepulauan dan PIP Bina Mulia ke Lautan.</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 10.5 }}>SK Rektor / Dekan Standar SPMI 2027</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '6px' }}>2. Pelaksanaan (P)</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>Mengimplementasikan kurikulum OBE dan pelibatan DTPS dalam riset terapan di kepulauan Maluku.</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 10.5 }}>RPS CPL, Kontrak Hibah, Logbook MBKM</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '6px' }}>3. Evaluasi (E)</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>Melakukan Audit Mutu Internal (AMI) semesteran dan survei kepuasan terintegrasi digital.</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 10.5 }}>Laporan AMI & Dashboard EDOM</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '6px' }}>4. Pengendalian (P)</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>Menindaklanjuti temuan AMI melalui RTM tingkat Fakultas dan menetapkan RTL.</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 10.5 }}>Risalah RTM & Matriks RTL</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #d1d5db', fontWeight: 'bold', padding: '6px' }}>5. Peningkatan (P)</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>Meningkatkan standar menuju akreditasi internasional dan sertifikasi lab KAN ISO 17025.</td>
                <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 10.5 }}>Laporan Benchmarking & Sertifikat ISO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </Space>
  );
};
