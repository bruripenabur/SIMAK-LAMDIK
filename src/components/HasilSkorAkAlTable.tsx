import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  Input, 
  InputNumber, 
  Select, 
  Tooltip, 
  Badge, 
  Progress, 
  Divider, 
  message, 
  Popconfirm,
  Alert
} from 'antd';
import { 
  CheckCircleOutlined, 
  SafetyCertificateOutlined, 
  PrinterOutlined, 
  FileExcelOutlined, 
  ReloadOutlined, 
  SearchOutlined, 
  StarFilled, 
  TrophyOutlined, 
  InfoCircleOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { IndicatorItem, AssessmentRecord, LamProfile, StudyProgramInfo } from '../types/accreditation';
import { calculateCriteriaSubtotals } from '../utils/mathEngine';
import { checkIndicatorMatchesCriteria } from '../data/criteriaStructure';

const { Title, Text } = Typography;

interface HasilSkorAkAlTableProps {
  currentLam: LamProfile;
  assessmentRecords: Record<string, AssessmentRecord>;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  onChangeRole?: (role: 'asesor1' | 'asesor2' | 'consensus') => void;
  studyInfo?: StudyProgramInfo;
  onUpdateRecord: (indicatorId: string, updated: Partial<AssessmentRecord>) => void;
  onOpenRubricDrawer?: (indicator: IndicatorItem) => void;
  onNavigateToRubricTable?: () => void;
  onResetGlobalVariablesToZero?: () => void;
}

export const HasilSkorAkAlTable: React.FC<HasilSkorAkAlTableProps> = ({
  currentLam,
  assessmentRecords,
  activeRole,
  onChangeRole,
  studyInfo,
  onUpdateRecord,
  onOpenRubricDrawer,
  onNavigateToRubricTable,
  onResetGlobalVariablesToZero,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKriteria, setSelectedKriteria] = useState<string>('ALL');
  const [filterUnggulOnly, setFilterUnggulOnly] = useState<boolean>(false);

  // Calculate live criteria subtotals and grand total
  const calculation = useMemo(() => {
    return calculateCriteriaSubtotals(currentLam.indicators, assessmentRecords, activeRole);
  }, [currentLam.indicators, assessmentRecords, activeRole]);

  const { subtotals, grandTotalBobot, grandTotalWeightedScore, maxScore } = calculation;

  // Accreditation rank based on weighted score
  const accreditationRank = useMemo(() => {
    if (grandTotalWeightedScore >= 361) {
      return {
        rank: 'TERAKREDITASI UNGGUL',
        color: '#10b981',
        tagColor: 'success',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: '#10b981',
      };
    }
    if (grandTotalWeightedScore >= 301) {
      return {
        rank: 'TERAKREDITASI BAIK SEKALI',
        color: '#3b82f6',
        tagColor: 'processing',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: '#3b82f6',
      };
    }
    if (grandTotalWeightedScore >= 200) {
      return {
        rank: 'TERAKREDITASI BAIK',
        color: '#f59e0b',
        tagColor: 'warning',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: '#f59e0b',
      };
    }
    return {
      rank: 'TIDAK TERAKREDITASI',
      color: '#ef4444',
      tagColor: 'error',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: '#ef4444',
    };
  }, [grandTotalWeightedScore]);

  // Handler for score click or change
  const handleScoreChange = (indicatorId: string, newScore: number) => {
    const clamped = Math.min(4, Math.max(0, Math.round(newScore * 100) / 100));
    const rec = assessmentRecords[indicatorId] || {
      scoreAsesor1: 0,
      scoreAsesor2: 0,
      scoreConsensus: 0,
      scoreSelf: 0,
    };

    if (activeRole === 'asesor1') {
      const s2 = rec.scoreAsesor2 ?? clamped;
      const consensus = Math.round(((clamped + s2) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, {
        scoreAsesor1: clamped,
        scoreConsensus: consensus,
        isRated: true,
      });
    } else if (activeRole === 'asesor2') {
      const s1 = rec.scoreAsesor1 ?? clamped;
      const consensus = Math.round(((s1 + clamped) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, {
        scoreAsesor2: clamped,
        scoreConsensus: consensus,
        isRated: true,
      });
    } else {
      // Consensus
      onUpdateRecord(indicatorId, {
        scoreConsensus: clamped,
        isRated: true,
      });
    }
    message.success({
      content: `Skor indikator diperbarui: ${clamped.toFixed(2)} (Total Skor Baru: ${grandTotalWeightedScore.toFixed(2)})`,
      key: 'scoreUpdate',
      duration: 1.5,
    });
  };

  // Set all scores to max 4 (Score 400.00)
  const handleSetAllMaxScore = () => {
    currentLam.indicators.forEach((ind) => {
      onUpdateRecord(ind.id, {
        scoreAsesor1: 4,
        scoreAsesor2: 4,
        scoreConsensus: 4,
        scoreSelf: 4,
        isRated: true,
      });
    });
    message.success('Seluruh indikator berhasil diisi skor maksimal 4 (Total Skor: 400.00 / UNGGUL)!');
  };

  // Reset all scores to 0 (nol)
  const handleResetAllScoresToZero = () => {
    currentLam.indicators.forEach((ind) => {
      onUpdateRecord(ind.id, {
        scoreAsesor1: 0,
        scoreAsesor2: 0,
        scoreConsensus: 0,
        scoreSelf: 0,
        isRated: false,
      });
    });
    onResetGlobalVariablesToZero?.();
    message.success('Seluruh skor indikator & parameter syarat unggul berhasil di-reset ke 0 (nol). Siap dinilai 1 demi 1.');
  };

  // Filter indicators
  const displayedIndicators = useMemo(() => {
    return currentLam.indicators.filter((ind) => {
      const matchesKriteria = checkIndicatorMatchesCriteria(ind, selectedKriteria);
      const matchesUnggul = !filterUnggulOnly || ind.isSyaratUnggul;
      const q = searchQuery.trim().toLowerCase();
      const numStr = ind.indicatorNumber ? String(ind.indicatorNumber) : '';
      const matchesSearch = 
        !q || 
        ind.code.toLowerCase().includes(q) ||
        numStr === q ||
        numStr.includes(q) ||
        ind.name.toLowerCase().includes(q) ||
        ind.element.toLowerCase().includes(q);

      return matchesKriteria && matchesUnggul && matchesSearch;
    });
  }, [currentLam.indicators, selectedKriteria, filterUnggulOnly, searchQuery]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const rows: any[] = [];
      
      // Title metadata
      rows.push(['REKAPITULASI HASIL SKOR ASESMEN KECUKUPAN (AK) & ASESMEN LAPANGAN (AL)']);
      rows.push(['UNIVERSITAS PATTIMURA - FAKULTAS PERTANIAN']);
      rows.push([`Program Studi: ${studyInfo?.studyProgramName || 'Penyuluhan Pertanian'} (Jenjang ${studyInfo?.degreeLevel || 'S1'})`]);
      rows.push([`Instrumen: ${currentLam.lamCode} - IAPS 1.0 (64 Indikator)`]);
      rows.push([`Peran Penilaian: ${activeRole.toUpperCase()} | Tanggal: ${new Date().toLocaleDateString('id-ID')}`]);
      rows.push([]);
      
      // Table Header
      rows.push([
        'NO.',
        'KRITERIA',
        'SASARAN MUTU',
        'ELEMEN / INDIKATOR PENILAIAN',
        'KATEGORI',
        'SYARAT UNGGUL',
        'SKOR (0-4)',
        'BOBOT (%)',
        'SKOR x BOBOT (NILAI AKHIR)',
        'CATATAN ASESOR'
      ]);

      let currentKriteriaGroup: number | null = null;

      currentLam.indicators.forEach((ind) => {
        const kNum = ind.kriteriaNumber || 1;
        
        // Add criteria header row if new group
        if (currentKriteriaGroup !== kNum) {
          currentKriteriaGroup = kNum;
          const st = subtotals[kNum];
          rows.push([
            `KRITERIA ${kNum}`,
            ind.kriteriaTitle || `Kriteria ${kNum}`,
            '',
            `SUBTOTAL KRITERIA ${kNum} (${st?.indicatorCount || 0} Indikator)`,
            '',
            '',
            '',
            st?.totalBobot.toFixed(2),
            st?.totalWeightedScore.toFixed(2),
            `Maksimal Skor Kriteria: ${st?.maxPossibleScore.toFixed(2)}`
          ]);
        }

        const rec = assessmentRecords[ind.id];
        let score = 0;
        let notes = '';
        if (rec) {
          if (activeRole === 'asesor1') {
            score = rec.scoreAsesor1 ?? 0;
            notes = rec.notesAsesor1 || '';
          } else if (activeRole === 'asesor2') {
            score = rec.scoreAsesor2 ?? 0;
            notes = rec.notesAsesor2 || '';
          } else {
            score = rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0;
            notes = rec.consensusNotes || '';
          }
        }
        const weighted = Math.round(score * ind.bobot * 100) / 100;

        rows.push([
          ind.indicatorNumber ?? ind.code,
          `Kriteria ${ind.kriteriaNumber}`,
          ind.sasaranMutu || ind.dimensi || '-',
          ind.name,
          ind.category,
          ind.isSyaratUnggul ? 'YA (Syarat Perlu Unggul)' : 'Tidak',
          score.toFixed(2),
          ind.bobot.toFixed(2),
          weighted.toFixed(2),
          notes
        ]);
      });

      // Grand Total Row
      rows.push([]);
      rows.push([
        'TOTAL AKHIR',
        '',
        '',
        'TOTAL NILAI AKREDITASI ASESMEN LAPANGAN (AL)',
        '',
        '',
        '',
        grandTotalBobot.toFixed(2),
        grandTotalWeightedScore.toFixed(2),
        `STATUS: ${accreditationRank.rank} (Maksimal: 400.00)`
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hasil Skor AK-AL');
      
      const fileName = `Hasil_Skor_AK_AL_${studyInfo?.studyProgramName || 'Prodi'}_${currentLam.lamCode.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      message.success(`Berhasil mengunduh ${fileName}!`);
    } catch (err) {
      console.error(err);
      message.error('Gagal mengekspor data ke Excel.');
    }
  };

  // Print view handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ width: '100%', padding: '16px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Institutional Kop & Document Heading (Format Gambar 3) */}
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
            <Space orientation="vertical" size={2}>
              <Flex align="center" gap="small" wrap="wrap">
                <Tag color="cyan" style={{ fontWeight: 700, padding: '2px 8px', fontSize: 11 }}>
                  UNIVERSITAS PATTIMURA
                </Tag>
                <Tag color="blue" style={{ fontWeight: 600, padding: '2px 8px', fontSize: 11 }}>
                  FAKULTAS PERTANIAN
                </Tag>
                <Tag color="purple" style={{ fontWeight: 600, padding: '2px 8px', fontSize: 11 }}>
                  {currentLam.lamCode} · IAPS 1.0 (2025)
                </Tag>
              </Flex>
              <Title level={4} style={{ margin: '4px 0 2px', color: '#f8fafc', fontWeight: 800, letterSpacing: -0.3 }}>
                LAPORAN ASESMEN LAPANGAN (AL) · FORMAT HASIL SKOR AK/AL
              </Title>
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>
                Program Studi: <strong style={{ color: '#38bdf8' }}>{studyInfo?.studyProgramName || 'Program Studi'}</strong> ({studyInfo?.degreeLevel || 'S1'}) · Evaluasi Matriks {currentLam.indicators.length} Indikator Runtut (Maksimal Skor 400.00)
              </Text>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Flex justify="flex-end" align="center" gap="small" wrap="wrap">
              <Button
                icon={<FileTextOutlined />}
                onClick={onNavigateToRubricTable}
                style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
              >
                Format Rubrik (Gambar 2)
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                style={{ backgroundColor: '#065f46', borderColor: '#059669', color: '#fff' }}
              >
                Unduh Excel
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
              >
                Cetak
              </Button>
            </Flex>
          </Col>
        </Row>

        <Divider style={{ margin: '14px 0 12px', borderColor: '#1e293b' }} />

        {/* Live Score KPI Banner */}
        <Row gutter={[16, 16]} align="middle">
          {/* Main Score Box */}
          <Col xs={24} sm={12} md={7}>
            <div 
              style={{ 
                backgroundColor: accreditationRank.bg, 
                border: `1.5px solid ${accreditationRank.border}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div>
                <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', fontWeight: 600 }}>
                  Total Skor Akhir (AK/AL)
                </Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: accreditationRank.color, lineHeight: 1.1 }}>
                    {grandTotalWeightedScore.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    / {maxScore.toFixed(2)}
                  </span>
                </div>
                <Tag color={accreditationRank.tagColor} style={{ marginTop: 4, fontWeight: 700, fontSize: 11 }}>
                  {accreditationRank.rank}
                </Tag>
              </div>
              <Progress
                type="circle"
                percent={Math.min(100, Math.round((grandTotalWeightedScore / maxScore) * 100))}
                size={54}
                strokeColor={accreditationRank.color}
                railColor="#334155"
                format={(p) => <span style={{ fontSize: 11, color: '#f8fafc', fontWeight: 700 }}>{p}%</span>}
              />
            </div>
          </Col>

          {/* Criteria Subtotals Mini Grid */}
          <Col xs={24} sm={12} md={11}>
            <div 
              style={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: 10, 
                padding: '10px 14px' 
              }}
            >
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Rekapitulasi 9 Kriteria Akreditasi LAMDIK (Skor × Bobot):
              </Text>
              <Row gutter={[6, 6]}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((kNum) => {
                  const st = subtotals[kNum];
                  const percent = st?.maxPossibleScore > 0 ? Math.round((st.totalWeightedScore / st.maxPossibleScore) * 100) : 0;
                  const shortTitles = ['Visi', 'Pamong', 'Mhs', 'Dosen', 'Sarpras', 'Pendidikan', 'Penelitian', 'PkM', 'Mutu'];
                  return (
                    <Col xs={8} sm={8} key={kNum}>
                      <div style={{ backgroundColor: '#0f172a', padding: '5px 6px', borderRadius: 6, border: '1px solid #334155' }}>
                        <Flex justify="space-between" align="center">
                          <Text style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            K{kNum}: {shortTitles[kNum-1]}
                          </Text>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>
                            {st?.totalWeightedScore.toFixed(1)}/{st?.maxPossibleScore.toFixed(0)}
                          </span>
                        </Flex>
                        <Progress 
                          percent={percent} 
                          size="small" 
                          showInfo={false} 
                          strokeColor="#10b981" 
                          railColor="#334155"
                          style={{ margin: '1px 0 0' }}
                        />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Col>

          {/* Quick Actions & Role Switcher */}
          <Col xs={24} md={6}>
            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
              <Flex align="center" justify="space-between">
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Peran Penilai:</Text>
                <Select
                  size="small"
                  value={activeRole}
                  onChange={(val) => onChangeRole?.(val as any)}
                  style={{ width: 140 }}
                  options={[
                    { label: 'Asesor 1 (Lead)', value: 'asesor1' },
                    { label: 'Asesor 2 (Member)', value: 'asesor2' },
                    { label: 'Konsensus AL', value: 'consensus' },
                  ]}
                />
              </Flex>
              <Flex gap={4}>
                <Popconfirm
                  title="Reset Semua Skor ke 0 (Nol)?"
                  description="Seluruh skor indikator akan dikembalikan ke 0.00 sehingga asesor dapat mengecek 1 per 1."
                  onConfirm={handleResetAllScoresToZero}
                  okText="Ya, Reset ke 0"
                  cancelText="Batal"
                >
                  <Button
                    size="small"
                    danger
                    icon={<ReloadOutlined />}
                    style={{ flex: 1, fontWeight: 600, fontSize: 11 }}
                  >
                    Reset Skor: 0
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="Isi Semua Skor Maksimal 4?"
                  description="Ini akan menyetel seluruh indikator ke nilai 4.00 (Total Skor = 400.00)."
                  onConfirm={handleSetAllMaxScore}
                  okText="Ya, Setel 4.00"
                  cancelText="Batal"
                >
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    style={{ flex: 1, backgroundColor: '#065f46', borderColor: '#059669', color: '#6ee7b7', fontWeight: 600, fontSize: 11 }}
                  >
                    Setel Skor: 4
                  </Button>
                </Popconfirm>
              </Flex>
              <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', display: 'block' }}>
                Klik tombol skor di tabel untuk melihat rekap live!
              </Text>
            </Space>
          </Col>
        </Row>

        {/* Filter and Search Bar */}
        <Divider style={{ margin: '12px 0', borderColor: '#1e293b' }} />
        <Row gutter={[10, 10]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              placeholder="Cari nomor (1-64) atau nama indikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="middle"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              style={{ width: '100%' }}
              value={selectedKriteria}
              onChange={setSelectedKriteria}
              options={[
                { label: 'Semua Kriteria (1-9)', value: 'ALL' },
                ...currentLam.kriteriaList.map(k => ({
                  label: `Kriteria ${k.number}: ${k.shortTitle || k.title.split(':')[0]}`,
                  value: String(k.number),
                })),
              ]}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Button
              block
              type={filterUnggulOnly ? 'primary' : 'default'}
              icon={<SafetyCertificateOutlined />}
              onClick={() => setFilterUnggulOnly(!filterUnggulOnly)}
              style={filterUnggulOnly ? { backgroundColor: '#f59e0b', borderColor: '#f59e0b' } : {}}
            >
              {filterUnggulOnly ? 'Filter: Syarat Unggul' : 'Tampilkan Syarat Unggul'}
            </Button>
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'right' }}>
              Menampilkan <strong>{displayedIndicators.length}</strong> dari <strong>{currentLam.indicators.length}</strong> indikator
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Main Hasil Skor AK/AL Table */}
      <Card
        size="small"
        style={{
          backgroundColor: '#0b1120',
          borderColor: '#1e293b',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              color: '#e2e8f0',
              fontSize: 13,
              textAlign: 'left'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155' }}>
                <th style={{ padding: '12px 10px', width: 55, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                  NO.
                </th>
                <th style={{ padding: '12px 12px', width: 140, color: '#94a3b8', fontWeight: 700 }}>
                  KRITERIA / SASARAN
                </th>
                <th style={{ padding: '12px 14px', minWidth: 260, color: '#94a3b8', fontWeight: 700 }}>
                  ELEMEN / INDIKATOR PENILAIAN
                </th>
                <th style={{ padding: '12px 12px', width: 220, textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>
                  SKOR ASESOR ({activeRole.toUpperCase()})
                </th>
                <th style={{ padding: '12px 10px', width: 90, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                  BOBOT (%)
                </th>
                <th style={{ padding: '12px 12px', width: 130, textAlign: 'center', color: '#10b981', fontWeight: 800 }}>
                  SKOR × BOBOT
                </th>
                <th style={{ padding: '12px 10px', width: 120, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>
                  AKSI / RUBRIK
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedIndicators.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    Tidak ada indikator yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                displayedIndicators.map((ind, index) => {
                  const rec = assessmentRecords[ind.id];
                  let score = 0;
                  if (rec) {
                    if (activeRole === 'asesor1') score = rec.scoreAsesor1 ?? 0;
                    else if (activeRole === 'asesor2') score = rec.scoreAsesor2 ?? 0;
                    else score = rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0;
                  }
                  const weighted = Math.round(score * ind.bobot * 100) / 100;
                  const maxWeighted = Math.round(4 * ind.bobot * 100) / 100;

                  // Check if this row is start of a new criteria (for visual grouping)
                  const prevInd = displayedIndicators[index - 1];
                  const isNewKriteria = !prevInd || prevInd.kriteriaNumber !== ind.kriteriaNumber;
                  const kNum = ind.kriteriaNumber || 1;
                  const st = subtotals[kNum];

                  return (
                    <React.Fragment key={ind.id}>
                      {/* Criteria Group Header Row when filtering ALL */}
                      {isNewKriteria && selectedKriteria === 'ALL' && (
                        <tr 
                          style={{ 
                            backgroundColor: '#1e293b', 
                            borderTop: '2px solid #334155',
                            borderBottom: '1px solid #334155' 
                          }}
                        >
                          <td 
                            colSpan={4} 
                            style={{ 
                              padding: '10px 14px', 
                              fontWeight: 800, 
                              color: '#38bdf8', 
                              fontSize: 13 
                            }}
                          >
                            <Space size="middle">
                              <Tag color="blue" style={{ fontWeight: 700 }}>
                                KRITERIA {kNum}
                              </Tag>
                              <span>{ind.kriteriaTitle || `Kriteria ${kNum}`}</span>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ({st?.indicatorCount || 0} Indikator)
                              </Text>
                            </Space>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#f8fafc', padding: '10px 4px' }}>
                            {st?.totalBobot.toFixed(2)}%
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#10b981', padding: '10px 4px' }}>
                            {st?.totalWeightedScore.toFixed(2)} <span style={{ fontSize: 11, color: '#64748b' }}>/ {st?.maxPossibleScore.toFixed(2)}</span>
                          </td>
                          <td style={{ textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                            Subtotal K{kNum}
                          </td>
                        </tr>
                      )}

                      {/* Main Indicator Row */}
                      <tr
                        style={{
                          borderBottom: '1px solid #1e293b',
                          backgroundColor: index % 2 === 0 ? '#0b1120' : '#0f172a',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#162033';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#0b1120' : '#0f172a';
                        }}
                      >
                        {/* 1. NO. */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%', 
                              backgroundColor: ind.isSyaratUnggul ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                              border: ind.isSyaratUnggul ? '1.5px solid #f59e0b' : '1px solid #334155',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              margin: '0 auto',
                              fontWeight: 800,
                              fontSize: 13,
                              color: ind.isSyaratUnggul ? '#fbbf24' : '#f8fafc'
                            }}
                          >
                            {ind.indicatorNumber ?? ind.code}
                          </div>
                        </td>

                        {/* 2. KRITERIA / SASARAN MUTU */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <Text style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', display: 'block' }}>
                            Kriteria {ind.kriteriaNumber}
                          </Text>
                          <Tag 
                            color={
                              ind.sasaranMutu === 'Masukan' ? 'blue' :
                              ind.sasaranMutu === 'Proses' ? 'geekblue' :
                              ind.sasaranMutu === 'Luaran' ? 'green' : 'gold'
                            } 
                            style={{ margin: '2px 0 0', fontSize: 11, padding: '0 6px' }}
                          >
                            {ind.sasaranMutu || ind.dimensi || 'Standar Mutu'}
                          </Tag>
                        </td>

                        {/* 3. ELEMEN / INDIKATOR PENILAIAN */}
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <Flex align="center" gap="small" wrap="wrap" style={{ marginBottom: 3 }}>
                            <Text style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>
                              {ind.name}
                            </Text>
                            {ind.isSyaratUnggul && (
                              <Tooltip title="Indikator ini merupakan Syarat Perlu Terakreditasi Unggul">
                                <Tag color="warning" icon={<SafetyCertificateOutlined />} style={{ fontWeight: 700, fontSize: 10 }}>
                                  SYARAT UNGGUL
                                </Tag>
                              </Tooltip>
                            )}
                            <Tag color={ind.category === 'Kuantitatif' ? 'purple' : 'default'} style={{ fontSize: 10 }}>
                              {ind.category} ({ind.sourceDoc || 'LED/LKPS'})
                            </Tag>
                          </Flex>
                          <Text 
                            type="secondary" 
                            style={{ 
                              fontSize: 12, 
                              color: '#94a3b8', 
                              display: '-webkit-box', 
                              WebkitLineClamp: 2, 
                              WebkitBoxOrient: 'vertical', 
                              overflow: 'hidden' 
                            }}
                          >
                            {ind.element}
                          </Text>
                        </td>

                        {/* 4. SKOR ASESMEN (INTERACTIVE CLICKABLE BADGES + INPUT) */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <Flex vertical align="center" gap={4}>
                            {/* Clickable Quick Score Buttons */}
                            <Flex justify="center" gap={4} wrap="wrap">
                              {[4, 3, 2, 1, 0].map((sVal) => {
                                const isSelected = Math.abs(score - sVal) < 0.05 && (score > 0 || Boolean(rec?.isRated));
                                return (
                                  <button
                                    key={sVal}
                                    type="button"
                                    onClick={() => handleScoreChange(ind.id, sVal)}
                                    title={`Pilih Skor ${sVal}`}
                                    style={{
                                      cursor: 'pointer',
                                      width: 28,
                                      height: 28,
                                      borderRadius: 6,
                                      fontWeight: 800,
                                      fontSize: 12,
                                      border: isSelected 
                                        ? sVal >= 3 ? '2px solid #10b981' : sVal >= 2 ? '2px solid #f59e0b' : '2px solid #ef4444' 
                                        : '1px solid #334155',
                                      backgroundColor: isSelected 
                                        ? sVal >= 3 ? '#065f46' : sVal >= 2 ? '#78350f' : '#7f1d1d' 
                                        : '#1e293b',
                                      color: isSelected ? '#ffffff' : '#94a3b8',
                                      transition: 'all 0.15s ease',
                                      boxShadow: isSelected ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                                    }}
                                  >
                                    {sVal}
                                  </button>
                                );
                              })}
                            </Flex>

                            {/* Direct Number Input */}
                            <Flex align="center" justify="center" gap={4}>
                              <Text style={{ fontSize: 11, color: '#64748b' }}>Edit:</Text>
                              <InputNumber
                                size="small"
                                min={0}
                                max={4}
                                step={0.1}
                                value={score}
                                onChange={(val) => {
                                  if (val !== null) handleScoreChange(ind.id, val);
                                }}
                                style={{ 
                                  width: 62, 
                                  textAlign: 'center',
                                  backgroundColor: '#1e293b',
                                  borderColor: '#334155',
                                  color: '#f8fafc',
                                  fontWeight: 700,
                                  fontSize: 12
                                }}
                              />
                            </Flex>
                          </Flex>
                        </td>

                        {/* 5. BOBOT (%) */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>
                            {ind.bobot.toFixed(2)}%
                          </span>
                        </td>

                        {/* 6. SKOR × BOBOT (LIVE RECAPITULATION RESULT) */}
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981', lineHeight: 1.2 }}>
                              {weighted.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>
                              maks: {maxWeighted.toFixed(2)}
                            </div>
                          </div>
                        </td>

                        {/* 7. AKSI / LIHAT RUBRIK */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <Button
                            size="small"
                            type="text"
                            icon={<InfoCircleOutlined />}
                            onClick={() => onOpenRubricDrawer?.(ind)}
                            style={{ color: '#38bdf8', fontSize: 12 }}
                          >
                            Rubrik
                          </Button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Official Grand Total Matching Gambar 3 */}
            <tfoot>
              <tr 
                style={{ 
                  backgroundColor: '#0f172a', 
                  borderTop: '3px solid #3b82f6', 
                  borderBottom: '3px solid #3b82f6' 
                }}
              >
                <td colSpan={4} style={{ padding: '16px 14px', verticalAlign: 'middle' }}>
                  <Space orientation="vertical" size={2}>
                    <Text style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      TOTAL NILAI AKREDITASI ASESMEN LAPANGAN (AL)
                    </Text>
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                      Hasil Rekapitulasi Skor Tertimbang Berdasarkan Indikator Standar LAMDIK 3.0
                    </Text>
                  </Space>
                </td>

                {/* Total Bobot */}
                <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Total Bobot</Text>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>
                    {grandTotalBobot.toFixed(2)}%
                  </span>
                </td>

                {/* Total Skor × Bobot (Max 400.00) */}
                <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div 
                    style={{ 
                      backgroundColor: accreditationRank.bg, 
                      padding: '8px 10px', 
                      borderRadius: 8, 
                      border: `1.5px solid ${accreditationRank.border}` 
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      Total Skor AL
                    </Text>
                    <span style={{ fontSize: 22, fontWeight: 900, color: accreditationRank.color }}>
                      {grandTotalWeightedScore.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block' }}>
                      / {maxScore.toFixed(2)}
                    </span>
                  </div>
                </td>

                {/* Status Badge */}
                <td style={{ padding: '16px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <Tag color={accreditationRank.tagColor} style={{ fontWeight: 800, padding: '4px 8px', fontSize: 11 }}>
                    {accreditationRank.rank}
                  </Tag>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Footer Info Box */}
      <Alert
        style={{ marginTop: 16, backgroundColor: '#0f172a', borderColor: '#1e293b' }}
        type="info"
        showIcon
        title={
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
            Sinkronisasi Skor Real-Time dengan Format Rubrik (Gambar 2)
          </span>
        }
        description={
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            Setiap kali Asesor mengklik tombol skor (4, 3, 2, 1, atau 0) atau memasukkan angka desimal di tabel ini maupun di tabel rubrik, 
            seluruh perhitungan <strong>Skor × Bobot</strong>, subtotal kriteria, syarat perlu unggul, dan nilai akhir (maksimal 400) langsung diperbarui secara otomatis.
          </span>
        }
      />
    </div>
  );
};
