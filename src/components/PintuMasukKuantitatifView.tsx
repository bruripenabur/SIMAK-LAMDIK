import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Flex,
  InputNumber,
  Select,
  Input,
  Tooltip,
  Alert,
  Popconfirm,
  message,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  ThunderboltOutlined,
  FormOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { LamProfile, AssessmentRecord } from '../types/accreditation';
import {
  QuantitativeInputState,
  EMPTY_QUANTITATIVE_STATE,
  SAMPLE_EXCEL_QUANTITATIVE_STATE,
  calculateAllQuantitativeScores,
} from '../utils/kuantitatifEntryEngine';

const { Title, Text, Paragraph } = Typography;

interface PintuMasukKuantitatifViewProps {
  currentLam: LamProfile;
  assessmentRecords: Record<string, AssessmentRecord>;
  onUpdateRecord: (indicatorId: string, updated: Partial<AssessmentRecord>) => void;
  onUpdateGlobalVariable: (key: string, val: number) => void;
  onNavigateToKertasKerja: () => void;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
}

export const PintuMasukKuantitatifView: React.FC<PintuMasukKuantitatifViewProps> = ({
  currentLam,
  assessmentRecords,
  onUpdateRecord,
  onUpdateGlobalVariable,
  onNavigateToKertasKerja,
  activeRole,
}) => {
  // State isian kuantitatif
  const [data, setData] = useState<QuantitativeInputState>(EMPTY_QUANTITATIVE_STATE);
  const [filterMode, setFilterMode] = useState<'all' | 'kuantitatif_only'>('all');
  const [filterKriteria, setFilterKriteria] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live kalkulasi skor tiap indikator kuantitatif
  const calculatedScores = useMemo(() => {
    return calculateAllQuantitativeScores(data);
  }, [data]);

  // Update nilai single field
  const updateField = (key: keyof QuantitativeInputState, val: any) => {
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // Muat data default sesuai dokumen asli Excel
  const handleLoadSampleData = () => {
    setData(SAMPLE_EXCEL_QUANTITATIVE_STATE);
    message.success('Berhasil memuat data isian kuantitatif sesuai dokumen Excel asli yang diunggah!');
  };

  // Kosongkan semua data ke 0
  const handleResetToZero = () => {
    setData(EMPTY_QUANTITATIVE_STATE);
    message.success('Seluruh sel isian kuantitatif berhasil dikosongkan (set ke 0).');
  };

  // Terapkan seluruh hasil isian kuantitatif ke Kertas Kerja (LKPS)
  const handleApplyToKertasKerja = () => {
    let appliedCount = 0;

    // 1. Terapkan skor indikator kuantitatif ke assessmentRecords
    currentLam.indicators.forEach((ind) => {
      const indNum = ind.indicatorNumber;
      if (indNum && calculatedScores[indNum] !== undefined) {
        const calculated = calculatedScores[indNum];
        onUpdateRecord(ind.id, {
          scoreSelf: calculated, // Nilai LKPS
          scoreAsesor1: calculated,
          scoreAsesor2: calculated,
          scoreConsensus: calculated,
          isRated: true,
          notesAsesor1: `Data kuantitatif LKPS diverifikasi dari tabel isian (Skor hasil hitung: ${calculated.toFixed(2)})`,
          notesAsesor2: `Data kuantitatif LKPS diverifikasi dari tabel isian (Skor hasil hitung: ${calculated.toFixed(2)})`,
          consensusNotes: `Konsensus AL: Skor LKPS ditetapkan ${calculated.toFixed(2)} sesuai perhitungan formula resmi.`,
        });
        appliedCount++;
      }
    });

    // 2. Sinkronkan variabel Gatekeeper Syarat Perlu Unggul
    onUpdateGlobalVariable('PTW', data.ind21_ptw_pct);
    onUpdateGlobalVariable('PPS', data.ind21_pps_pct);
    onUpdateGlobalVariable('WT', data.ind24_wt_months);
    onUpdateGlobalVariable('PDGBLKL', data.ind51_ndtps > 0 
      ? Math.round(((data.ind51_ndgb + data.ind51_ndlk + data.ind51_ndl) / data.ind51_ndtps) * 100 * 10) / 10 
      : 0
    );

    message.success({
      content: `Berhasil menerapkan ${appliedCount} indikator kuantitatif ke Kertas Kerja LKPS & Syarat Unggul!`,
      duration: 3,
      key: 'appliedLKPS',
    });
  };

  // Unduh tampilan tabel dalam format Excel
  const handleExportExcel = () => {
    try {
      const rows: any[] = [];
      rows.push(['PENILAIAN AKREDITASI PROGRAM STUDI']);
      rows.push(['PROGRAM SARJANA']);
      rows.push([]);
      rows.push(['PETUNJUK PENGISIAN: SEL YANG DIISI HANYA YANG BERWARNA KUNING. MOHON VALIDASI KEMBALI KEBENARAN DATA PADA SEL BERWARNA ABU-ABU']);
      rows.push([]);
      rows.push(['NO.', 'KRITERIA', 'SASARAN MUTU', 'INDIKATOR DAN PENILAIAN', 'INPUT / NILAI', 'SKOR', 'STATUS / FORMULA', 'DESKRIPSI / CATATAN ASESMEN']);

      currentLam.indicators.forEach((ind) => {
        const indNum = ind.indicatorNumber ?? ind.code;
        const skor = calculatedScores[Number(indNum)] ?? 0;
        rows.push([
          indNum,
          ind.kriteriaTitle,
          ind.sasaranMutu || ind.dimensi,
          ind.name,
          ind.category === 'Kuantitatif' ? 'Tabel Data LKPS Terisi' : 'Rubrik Deskriptif LED',
          skor.toFixed(2),
          ind.category === 'Kuantitatif' ? 'Formula Otomatis' : 'Asesmen Kualitatif',
          ind.element
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Isian Kuantitatif LKPS');
      XLSX.writeFile(wb, `Isian_Data_Kuantitatif_LKPS_${currentLam.lamCode}.xlsx`);
      message.success('Berkas Excel berhasil diunduh!');
    } catch (e) {
      message.error('Gagal mengunduh Excel.');
    }
  };

  return (
    <div style={{ width: '100%', padding: '16px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Banner Utama: Judul Resmi & Petunjuk Pengisian Sel Kuning */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          borderRadius: 12,
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Tag color="gold" style={{ fontWeight: 800, padding: '3px 10px', fontSize: 12, borderRadius: 4 }}>
                🚪 PINTU MASUK UTAMA
              </Tag>
              <Tag color="cyan" style={{ fontWeight: 700, padding: '3px 8px', fontSize: 11 }}>
                {currentLam.lamCode} · IAPS 1.0 (2025)
              </Tag>
            </div>
            <Title level={3} style={{ margin: '4px 0 2px', color: '#fef08a', fontWeight: 900, letterSpacing: -0.5 }}>
              PENILAIAN AKREDITASI PROGRAM STUDI · PROGRAM SARJANA
            </Title>
            <Text style={{ fontSize: 13, color: '#e2e8f0', display: 'block' }}>
              TABEL ISIAN DATA KUANTITATIF (LKPS WAJIB DIISI DULUAN UNTUK MENGISI SELURUH TIPE INDIKATOR KUANTITATIF)
            </Text>
          </Col>

          <Col xs={24} md={8}>
            <Flex justify="flex-end" align="center" gap="small" wrap="wrap">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleApplyToKertasKerja}
                style={{
                  backgroundColor: '#10b981',
                  borderColor: '#10b981',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                Terapkan ke Kertas Kerja (LKPS)
              </Button>
              <Button
                icon={<ArrowRightOutlined />}
                onClick={onNavigateToKertasKerja}
                style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#38bdf8', fontWeight: 600 }}
              >
                Buka Kertas Kerja
              </Button>
            </Flex>
          </Col>
        </Row>

        {/* Kotak Petunjuk Resmi Sesuai Dokumen Excel */}
        <div
          style={{
            marginTop: 14,
            padding: '10px 16px',
            backgroundColor: '#fef9c3',
            border: '2px solid #ca8a04',
            borderRadius: 8,
            color: '#713f12',
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>
              PETUNJUK PENGISIAN: SEL YANG DIISI HANYA YANG BERWARNA KUNING. MOHON VALIDASI KEMBALI KEBENARAN DATA PADA SEL BERWARNA ABU-ABU.
            </span>
          </div>

          <Space size="small">
            <Popconfirm
              title="Isi dengan contoh data resmi?"
              description="Ini akan memuat angka-angka dari dokumen Excel LKPS asli yang Anda unggah."
              onConfirm={handleLoadSampleData}
              okText="Ya, Muat Contoh"
              cancelText="Batal"
            >
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                style={{ backgroundColor: '#854d0e', borderColor: '#854d0e', color: '#fef08a', fontWeight: 700 }}
              >
                Isi Contoh Data Dokumen Asli
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Kosongkan seluruh isian kuantitatif?"
              description="Semua sel warna kuning akan dikembalikan ke 0 agar dapat diisi ulang dari awal."
              onConfirm={handleResetToZero}
              okText="Ya, Kosongkan"
              cancelText="Batal"
            >
              <Button size="small" danger icon={<ReloadOutlined />} style={{ fontWeight: 600 }}>
                Kosongkan Semua (Reset 0)
              </Button>
            </Popconfirm>

            <Button
              size="small"
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              style={{ backgroundColor: '#065f46', borderColor: '#059669', color: '#fff' }}
            >
              Unduh Excel
            </Button>
          </Space>
        </div>

        {/* Filter Bar */}
        <Row gutter={[12, 12]} align="middle" style={{ marginTop: 14 }}>
          <Col xs={24} sm={10} md={6}>
            <Input
              placeholder="Cari indikator atau nomor (1-64)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              value={filterMode}
              onChange={(val) => setFilterMode(val)}
              style={{ width: '100%' }}
              options={[
                { label: 'Tampilkan Semua Indikator (64)', value: 'all' },
                { label: 'Hanya Isian Kuantitatif LKPS', value: 'kuantitatif_only' },
              ]}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              value={filterKriteria}
              onChange={(val) => setFilterKriteria(val)}
              style={{ width: '100%' }}
              options={[
                { label: 'Semua Kriteria (1-9)', value: 'ALL' },
                ...currentLam.kriteriaList.map(k => ({
                  label: `Kriteria ${k.number}: ${k.shortTitle || k.title.split(':')[0]}`,
                  value: k.number,
                })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <Flex justify="flex-end" align="center" gap="small">
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Keterangan Warna:</span>
              <Tag style={{ backgroundColor: '#fef08a', border: '1px solid #ca8a04', color: '#713f12', fontWeight: 700 }}>
                Kuning = Wajib Diisi (Input)
              </Tag>
              <Tag style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#cbd5e1', fontWeight: 600 }}>
                Abu-Abu = Otomatis / Formula
              </Tag>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* Tabel Utama Format Excel Asli (Persis Tampilan SpreadSheet) */}
      <div
        style={{
          backgroundColor: '#0b1120',
          borderRadius: 10,
          border: '1.5px solid #1e293b',
          overflowX: 'auto',
          boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1300,
            borderCollapse: 'collapse',
            textAlign: 'left',
            color: '#e2e8f0',
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '12px 8px', width: 50, textAlign: 'center', borderRight: '1px solid #334155', fontWeight: 800 }}>
                NO.
              </th>
              <th style={{ padding: '12px 10px', width: 140, borderRight: '1px solid #334155', fontWeight: 800 }}>
                KRITERIA
              </th>
              <th style={{ padding: '12px 10px', width: 100, borderRight: '1px solid #334155', fontWeight: 800 }}>
                SASARAN MUTU
              </th>
              <th style={{ padding: '12px 12px', minWidth: 260, maxWidth: 320, borderRight: '1px solid #334155', fontWeight: 800 }}>
                INDIKATOR DAN PENILAIAN
              </th>
              <th style={{ padding: '12px 12px', minWidth: 260, borderRight: '1px solid #334155', fontWeight: 800, backgroundColor: '#0f172a' }}>
                DATA RINCIAN &amp; VARIABEL LKPS
              </th>
              <th style={{ padding: '12px 8px', width: 140, textAlign: 'center', borderRight: '1px solid #334155', fontWeight: 800, backgroundColor: '#854d0e', color: '#fef08a' }}>
                ISIAN DATA (SEL KUNING / INPUT)
              </th>
              <th style={{ padding: '12px 8px', width: 90, textAlign: 'center', borderRight: '1px solid #334155', fontWeight: 800 }}>
                SKOR
              </th>
              <th style={{ padding: '12px 12px', width: 220, fontWeight: 800 }}>
                STATUS &amp; KETERANGAN FORMULA
              </th>
            </tr>
          </thead>

          <tbody>
            {/* RENDER INDIKATOR 1 S.D. 64 */}
            {currentLam.indicators
              .filter((ind) => {
                const isKuantitatif = ind.category === 'Kuantitatif';
                if (filterMode === 'kuantitatif_only' && !isKuantitatif) return false;
                if (filterKriteria !== 'ALL' && ind.kriteriaNumber !== filterKriteria) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const numStr = String(ind.indicatorNumber || '');
                  return ind.name.toLowerCase().includes(q) || numStr.includes(q) || ind.element.toLowerCase().includes(q);
                }
                return true;
              })
              .map((ind, idx) => {
                const indNum = ind.indicatorNumber ?? Number(ind.code);
                const rec = assessmentRecords[ind.id];
                const liveSkor = calculatedScores[indNum] ?? (rec?.scoreConsensus ?? rec?.scoreAsesor1 ?? 0);
                const isKuantitatif = ind.category === 'Kuantitatif';
                const rowBg = idx % 2 === 0 ? '#0b1120' : '#0e1626';

                return (
                  <React.Fragment key={ind.id}>
                    {/* Baris Utama Indikator */}
                    <tr
                      style={{
                        backgroundColor: rowBg,
                        borderBottom: '1px solid #1e293b',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          verticalAlign: 'top',
                          borderRight: '1px solid #1e293b',
                          fontWeight: 800,
                          color: '#38bdf8',
                          fontSize: 14,
                        }}
                      >
                        {indNum}
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #1e293b', fontWeight: 600 }}>
                        {ind.kriteriaTitle.replace('Kriteria ', '')}
                      </td>
                      <td style={{ padding: '10px 10px', verticalAlign: 'top', borderRight: '1px solid #1e293b' }}>
                        <Tag color={ind.sasaranMutu === 'Masukan' ? 'blue' : ind.sasaranMutu === 'Proses' ? 'green' : ind.sasaranMutu === 'Luaran' ? 'orange' : 'magenta'} style={{ margin: 0, fontWeight: 700 }}>
                          {ind.sasaranMutu || ind.dimensi}
                        </Tag>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={isKuantitatif ? 'gold' : 'purple'} style={{ fontSize: 10, margin: 0 }}>
                            {ind.category}
                          </Tag>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', borderRight: '1px solid #1e293b' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{ind.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{ind.element}</div>
                      </td>

                      {/* Kolom 5: Data Rincian Komponen */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top', borderRight: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
                        {renderKomponenDeskripsi(indNum, data, ind)}
                      </td>

                      {/* Kolom 6: Isian Data (Sel Kuning) */}
                      <td style={{ padding: '10px 8px', verticalAlign: 'top', borderRight: '1px solid #1e293b', textAlign: 'center' }}>
                        {renderYellowInputCells(indNum, data, updateField, ind, onUpdateRecord, rec)}
                      </td>

                      {/* Kolom 7: Skor Hasil Hitung */}
                      <td style={{ padding: '10px 8px', verticalAlign: 'top', borderRight: '1px solid #1e293b', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: 6,
                            backgroundColor: liveSkor > 0 ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                            border: `1px solid ${liveSkor > 0 ? '#10b981' : '#334155'}`,
                            color: liveSkor > 0 ? '#34d399' : '#94a3b8',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: 15,
                          }}
                        >
                          {liveSkor.toFixed(2)}
                        </div>
                      </td>

                      {/* Kolom 8: Status & Keterangan */}
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {renderStatusDanKeterangan(indNum, liveSkor, ind)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <Card
        size="small"
        style={{
          marginTop: 16,
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          borderRadius: 10,
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
          <Space size="middle">
            <Tag color="gold" style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
              ✓ Data Kuantitatif Siap Diterapkan ke LKPS &amp; Kertas Kerja
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Semua sel warna kuning akan otomatis menghitung nilai bulat/desimal (0 s.d. 4.00) dan mengisi formulir LKPS.
            </Text>
          </Space>

          <Space size="small">
            <Button
              type="primary"
              size="middle"
              icon={<SaveOutlined />}
              onClick={handleApplyToKertasKerja}
              style={{
                backgroundColor: '#059669',
                borderColor: '#059669',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)',
              }}
            >
              Simpan &amp; Terapkan Data ke Kertas Kerja (LKPS)
            </Button>
            <Button
              size="middle"
              icon={<ArrowRightOutlined />}
              onClick={onNavigateToKertasKerja}
              style={{ fontWeight: 700 }}
            >
              Lanjut ke Kertas Kerja &gt;
            </Button>
          </Space>
        </Flex>
      </Card>
    </div>
  );
};

// =========================================================================
// HELPER COMPONENT: RENDER KOMPONEN & DESKRIPSI DATA KUANTITATIF PER INDIKATOR
// =========================================================================
function renderKomponenDeskripsi(indNum: number, data: QuantitativeInputState, ind: any) {
  switch (indNum) {
    case 8:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>A. Kecukupan DTPS (NDTPS):</strong> Dosen tetap di prodi (b1=3, b2=12)</div>
          <div><strong>B. Dosen Tidak Tetap (PDTT):</strong> NDTT / (NDTT + NDT) (b1=10%, b2=40%)</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: (Skor A + (Skor B × 2)) / 3</div>
        </div>
      );
    case 15:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>B. Kepesertaan MBKM:</strong> Rasio mahasiswa MBKM terhadap mahasiswa eligible</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: ((Skor A × 2) + Skor B) / 3</div>
        </div>
      );
    case 17:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Rata-Rata IPK Lulusan (RIPK):</strong> Data kelulusan &amp; IPK 3 tahun (TS-2, TS-1, TS)</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: RIPK ≥ 3.25 → Skor 4.00</div>
        </div>
      );
    case 18:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Prestasi Akademik Mahasiswa:</strong> Internasional (NI), Nasional (NN), Wilayah (NW)</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: RI ≥ 0.1% → 4; RN ≥ 1% → 3.5; RW ≥ 2% → 2.0</div>
        </div>
      );
    case 19:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Prestasi Non-Akademik:</strong> Internasional (NI), Nasional (NN), Wilayah (NW)</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: RI ≥ 0.2% → 4; RN ≥ 2% → 3.5; RW ≥ 4% → 2.0</div>
        </div>
      );
    case 20:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Masa Studi (MS):</strong> Rata-rata tahun kelulusan mahasiswa TS-7 s.d. TS</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: 3.5 ≤ MS ≤ 4.5 → Skor 4.00</div>
        </div>
      );
    case 21:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>A. Kelulusan Tepat Waktu (PTW):</strong> Target PTW ≥ 45% (Syarat Unggul)</div>
          <div><strong>B. Keberhasilan Studi (PPS):</strong> Target PPS ≥ 75% (Syarat Unggul)</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: (Skor A + Skor B) / 2</div>
        </div>
      );
    case 23:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>A. Sertifikasi Kompetensi Alumni:</strong> Lulusan memiliki sertifikat</div>
          <div><strong>B. Kepuasan Pengguna Lulusan:</strong> Rerata 7 kriteria survei pengguna</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: ((Skor A × 3) + (Skor B × 6)) / 9</div>
        </div>
      );
    case 24:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>A. Penurunan Mhs Baru (PPM):</strong> Persentase 5 tahun terakhir</div>
          <div><strong>B1. Waktu Tunggu (WT):</strong> Target WT ≤ 7.5 bulan (Syarat Unggul)</div>
          <div><strong>B2. Tempat Kerja:</strong> Proporsi nasional / internasional</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: ((A×4) + (B1×7) + (B2×2)) / 13</div>
        </div>
      );
    case 26:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Dana Penelitian DTPS per Tahun (DPD):</strong> DP / 3 / NDTPS</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: DPD ≥ Rp 10 Juta/dosen/th → Skor 4.00</div>
        </div>
      );
    case 27:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Sumber Pembiayaan Riset:</strong> Luar Negeri (NI), Dalam Negeri (NN), PT/Mandiri (NL)</div>
        </div>
      );
    case 28:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Mahasiswa dlm Riset DTPS (PPDM):</strong> (NPM / NPD) × 100%</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: PPDM ≥ 25% → Skor A = 4.00</div>
        </div>
      );
    case 29:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Publikasi DTPS (A) + Mhs (B) + Sitasi (C):</strong> Jurnal, seminar &amp; sitasi NAS</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: ((A×2) + (B×3) + (C×3)) / 8</div>
        </div>
      );
    case 31:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Inovasi Diadopsi Industri/Masyarakat:</strong> NAPJ / NDTPS</div>
        </div>
      );
    case 32:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>HKI &amp; Luaran Riset (DTPS &amp; Mhs):</strong> Paten, Hak Cipta, Desain, TTG, Buku</div>
        </div>
      );
    case 34:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Dana PkM DTPS per Tahun (DPkMD):</strong> DPkM / 3 / NDTPS</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Formula: DPkMD ≥ Rp 5 Juta/dosen/th → Skor 4.00</div>
        </div>
      );
    case 35:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Sumber Pembiayaan PkM:</strong> Luar Negeri, Dalam Negeri, PT/Mandiri</div>
        </div>
      );
    case 36:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Mahasiswa dlm PkM (PPkMDM):</strong> (NPkMM / NPkMD) × 100%</div>
        </div>
      );
    case 37:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Desa / Kelompok Binaan (RDB):</strong> NDB / NDTPS (Target ≥ 0.5)</div>
        </div>
      );
    case 40:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Produk PkM Diadopsi (RPA):</strong> NAPkMJ / NDTPS</div>
        </div>
      );
    case 41:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>HKI &amp; Luaran PkM:</strong> Paten, Hak Cipta, TTG, Buku ISBN</div>
        </div>
      );
    case 51:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Jabatan Akademik DTPS (PDGBLKL):</strong> Guru Besar + Lektor Kepala + Lektor</div>
          <div style={{ color: '#38bdf8', marginTop: 4 }}>Target Syarat Unggul: PDGBLKL ≥ 50%</div>
        </div>
      );
    case 52:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Dosen Doktor (PDS3):</strong> (NDS3 / NDTPS) × 100% (Target ≥ 50%)</div>
        </div>
      );
    case 53:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Asosiasi Keilmuan (PDA):</strong> (NDA / NDTPS) × 100% (Target ≥ 50%)</div>
        </div>
      );
    case 54:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Rasio Mahasiswa : Dosen (RMD):</strong> NM / NDTPS (Saintek: 15-25)</div>
        </div>
      );
    case 55:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Bimbingan Skripsi (RDPU):</strong> Rata-rata mhs bimbingan (Target: 6-10)</div>
        </div>
      );
    case 56:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>EWMP DTPS:</strong> Beban kerja dosen per semester (Target: 12-16 SKS)</div>
        </div>
      );
    case 57:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Kerjasama Tridharma (RK):</strong> Pendidikan, Penelitian, dan PkM</div>
        </div>
      );
    case 58:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Kerjasama Internasional, Nasional &amp; Wilayah:</strong> NI, NN, NW</div>
        </div>
      );
    case 59:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Magang DUDI (RMKI):</strong> Mahasiswa magang / Jumlah mitra DUDI</div>
        </div>
      );
    case 60:
      return (
        <div style={{ fontSize: 11, color: '#cbd5e1' }}>
          <div><strong>Rekognisi &amp; Sertifikasi DTPS:</strong> Prestasi kepakaran / NDTPS</div>
        </div>
      );
    default:
      return (
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          <div>Aspek kualitatif LED evaluasi mandiri prodi.</div>
          <div style={{ fontStyle: 'italic', color: '#64748b' }}>Pilih skor rubrik di sel kuning.</div>
        </div>
      );
  }
}

// =========================================================================
// HELPER COMPONENT: RENDER INPUT SEL WARNA KUNING (INPUT WAJIB)
// =========================================================================
function renderYellowInputCells(
  indNum: number,
  data: QuantitativeInputState,
  updateField: (k: keyof QuantitativeInputState, val: any) => void,
  ind: any,
  onUpdateRecord: (id: string, updated: any) => void,
  rec?: AssessmentRecord
) {
  // Helper kotak input warna kuning khas Excel
  const yellowInputStyle = {
    backgroundColor: '#fef08a',
    borderColor: '#ca8a04',
    color: '#000000',
    fontWeight: 800,
    borderRadius: 4,
    fontFamily: 'monospace',
    width: '100%',
  };

  switch (indNum) {
    case 8:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>NDTPS:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind8_ndtps}
              onChange={(v) => updateField('ind8_ndtps', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>NDTT:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind8_ndtt}
              onChange={(v) => updateField('ind8_ndtt', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>NDT:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind8_ndt}
              onChange={(v) => updateField('ind8_ndt', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
        </Space>
      );

    case 15:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Eligible:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind15_eligible}
              onChange={(v) => updateField('ind15_eligible', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Ikut MBKM:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind15_mbkm}
              onChange={(v) => updateField('ind15_mbkm', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
        </Space>
      );

    case 17:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>IPK TS-2:</span>
            <InputNumber
              size="small"
              min={0}
              max={4}
              step={0.01}
              value={data.ind17_ipk_ts2}
              onChange={(v) => updateField('ind17_ipk_ts2', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>IPK TS-1:</span>
            <InputNumber
              size="small"
              min={0}
              max={4}
              step={0.01}
              value={data.ind17_ipk_ts1}
              onChange={(v) => updateField('ind17_ipk_ts1', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>IPK TS:</span>
            <InputNumber
              size="small"
              min={0}
              max={4}
              step={0.01}
              value={data.ind17_ipk_ts}
              onChange={(v) => updateField('ind17_ipk_ts', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
        </Space>
      );

    case 18:
    case 19:
      const prefix = indNum === 18 ? 'ind18' : 'ind19';
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Intl (NI):</span>
            <InputNumber
              size="small"
              min={0}
              value={(data as any)[`${prefix}_ni`]}
              onChange={(v) => updateField(`${prefix}_ni` as any, v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Nasional (NN):</span>
            <InputNumber
              size="small"
              min={0}
              value={(data as any)[`${prefix}_nn`]}
              onChange={(v) => updateField(`${prefix}_nn` as any, v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Wilayah (NW):</span>
            <InputNumber
              size="small"
              min={0}
              value={(data as any)[`${prefix}_nw`]}
              onChange={(v) => updateField(`${prefix}_nw` as any, v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Total Mhs:</span>
            <InputNumber
              size="small"
              min={0}
              value={(data as any)[`${prefix}_nm`]}
              onChange={(v) => updateField(`${prefix}_nm` as any, v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
        </Space>
      );

    case 21:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>PTW (%):</span>
            <InputNumber
              size="small"
              min={0}
              max={100}
              step={0.5}
              value={data.ind21_ptw_pct}
              onChange={(v) => updateField('ind21_ptw_pct', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>PPS (%):</span>
            <InputNumber
              size="small"
              min={0}
              max={100}
              step={0.5}
              value={data.ind21_pps_pct}
              onChange={(v) => updateField('ind21_pps_pct', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
        </Space>
      );

    case 24:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>PPM (%):</span>
            <InputNumber
              size="small"
              step={0.1}
              value={data.ind24_ppm_pct}
              onChange={(v) => updateField('ind24_ppm_pct', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>WT (Bln):</span>
            <InputNumber
              size="small"
              min={0}
              max={24}
              step={0.1}
              value={data.ind24_wt_months}
              onChange={(v) => updateField('ind24_wt_months', v ?? 0)}
              style={{ ...yellowInputStyle, width: 75 }}
            />
          </div>
        </Space>
      );

    case 26:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#cbd5e1' }}>Dana Riset (Rp):</span>
          <InputNumber
            size="small"
            min={0}
            step={1000000}
            value={data.ind26_dp}
            onChange={(v) => updateField('ind26_dp', v ?? 0)}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(v: any) => v.replace(/\./g, '')}
            style={yellowInputStyle}
          />
        </div>
      );

    case 34:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#cbd5e1' }}>Dana PkM (Rp):</span>
          <InputNumber
            size="small"
            min={0}
            step={1000000}
            value={data.ind34_dpkm}
            onChange={(v) => updateField('ind34_dpkm', v ?? 0)}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(v: any) => v.replace(/\./g, '')}
            style={yellowInputStyle}
          />
        </div>
      );

    case 51:
      return (
        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Prof (GB):</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind51_ndgb}
              onChange={(v) => updateField('ind51_ndgb', v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>L. Kepala:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind51_ndlk}
              onChange={(v) => updateField('ind51_ndlk', v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Lektor:</span>
            <InputNumber
              size="small"
              min={0}
              value={data.ind51_ndl}
              onChange={(v) => updateField('ind51_ndl', v ?? 0)}
              style={{ ...yellowInputStyle, width: 65 }}
            />
          </div>
        </Space>
      );

    case 52:
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#cbd5e1' }}>Dosen S3:</span>
          <InputNumber
            size="small"
            min={0}
            value={data.ind52_nds3}
            onChange={(v) => updateField('ind52_nds3', v ?? 0)}
            style={{ ...yellowInputStyle, width: 75 }}
          />
        </div>
      );

    case 56:
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#cbd5e1' }}>EWMP (SKS):</span>
          <InputNumber
            size="small"
            min={0}
            step={0.1}
            value={data.ind56_ewmp}
            onChange={(v) => updateField('ind56_ewmp', v ?? 0)}
            style={{ ...yellowInputStyle, width: 75 }}
          />
        </div>
      );

    default:
      // Indikator Kualitatif LED: Pilihan Skor (0, 1, 2, 3, 4)
      const currentScore = rec?.scoreConsensus ?? rec?.scoreAsesor1 ?? 0;
      return (
        <Select
          size="small"
          value={currentScore}
          onChange={(val) => {
            onUpdateRecord(ind.id, {
              scoreAsesor1: val,
              scoreAsesor2: val,
              scoreConsensus: val,
              scoreSelf: val,
              isRated: true,
            });
          }}
          style={{ width: '100%' }}
          styles={{ popup: { root: { backgroundColor: '#1e293b' } } }}
          options={[
            { label: 'Skor 4 (Unggul)', value: 4 },
            { label: 'Skor 3 (Baik Sekali)', value: 3 },
            { label: 'Skor 2 (Baik)', value: 2 },
            { label: 'Skor 1 (Kurang)', value: 1 },
            { label: 'Skor 0 (Tidak Memenuhi)', value: 0 },
          ]}
        />
      );
  }
}

// =========================================================================
// HELPER COMPONENT: RENDER STATUS EVALUASI & FORMULA SESUAI EXCEL
// =========================================================================
function renderStatusDanKeterangan(indNum: number, liveSkor: number, ind: any) {
  const isUnggulRule = ind.isSyaratUnggul;

  if (indNum === 8) {
    return (
      <div style={{ fontSize: 11, color: '#cbd5e1' }}>
        <Tag color="cyan">Tabel 2.1A &amp; 2.1B</Tag>
        <span style={{ color: '#94a3b8' }}>Dosen Tetap &amp; Tidak Tetap</span>
      </div>
    );
  }

  if (indNum === 21) {
    const isPassed = liveSkor >= 2.4;
    return (
      <div style={{ fontSize: 11 }}>
        <Tag color="red">SYARAT PERLU UNGGUL</Tag>
        <div style={{ color: isPassed ? '#10b981' : '#f59e0b', fontWeight: 700, marginTop: 2 }}>
          {isPassed ? '✓ Syarat PTW/PPS Terpenuhi' : 'PTW ≥ 45% atau PPS ≥ 75%'}
        </div>
      </div>
    );
  }

  if (indNum === 24) {
    return (
      <div style={{ fontSize: 11 }}>
        <Tag color="red">SYARAT PERLU UNGGUL</Tag>
        <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>
          Masa Tunggu WT ≤ 7.5 bulan
        </div>
      </div>
    );
  }

  if (indNum === 51) {
    return (
      <div style={{ fontSize: 11 }}>
        <Tag color="red">SYARAT PERLU UNGGUL</Tag>
        <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>
          Lektor+ ≥ 50%
        </div>
      </div>
    );
  }

  if (isUnggulRule) {
    return (
      <div style={{ fontSize: 11 }}>
        <Tag color="red">SYARAT PERLU UNGGUL</Tag>
        <div style={{ color: liveSkor >= 3.5 ? '#10b981' : '#ef4444', fontWeight: 700, marginTop: 2 }}>
          {liveSkor >= 3.5 ? '✓ Memenuhi (≥ 3.50)' : 'Min. Skor ≥ 3.50'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 11, color: '#94a3b8' }}>
      {liveSkor > 0 ? (
        <span style={{ color: '#34d399' }}>✓ Data Terverifikasi</span>
      ) : (
        <span style={{ color: '#64748b' }}>Belum dinilai / 0</span>
      )}
    </div>
  );
}
