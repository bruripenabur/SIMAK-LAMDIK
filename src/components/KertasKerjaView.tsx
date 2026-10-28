import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Select, 
  TreeSelect,
  Input, 
  InputNumber, 
  Slider, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Flex, 
  Row, 
  Col, 
  Tooltip, 
  Modal,
  Form,
  Popconfirm,
  Segmented,
  Divider,
  message,
  theme 
} from 'antd';
import { 
  TableOutlined, 
  AppstoreOutlined,
  AuditOutlined, 
  LinkOutlined, 
  SearchOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  CalculatorOutlined, 
  SafetyCertificateOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FileAddOutlined,
  CheckOutlined,
  DownOutlined,
  UpOutlined,
  FilterOutlined,
  FormOutlined
} from '@ant-design/icons';
import { IndicatorItem, LamProfile, AssessmentRecord, EvidenceLink, StudyProgramInfo } from '../types/accreditation';
import { renderLatex, evaluateFormula, calculateCriteriaSubtotals } from '../utils/mathEngine';
import { 
  getCriteriaTreeSelectData, 
  checkIndicatorMatchesCriteria 
} from '../data/criteriaStructure';
import { 
  getEvidenceDocumentInfo, 
  updateCustomEvidenceDocument, 
  deleteCustomEvidenceDocument 
} from '../utils/evidenceDocumentUrls';
import { classifyUrlDomain } from '../utils/evidenceExtractor';
import { HasilSkorAkAlTable } from './HasilSkorAkAlTable';

const { Title, Text, Paragraph } = Typography;

interface KertasKerjaViewProps {
  currentLam: LamProfile;
  assessmentRecords: Record<string, AssessmentRecord>;
  activeRole: 'asesor1' | 'asesor2' | 'consensus';
  onChangeRole?: (role: 'asesor1' | 'asesor2' | 'consensus') => void;
  studyInfo?: StudyProgramInfo;
  evidenceList: EvidenceLink[];
  onUpdateRecord: (indicatorId: string, updated: Partial<AssessmentRecord>) => void;
  onOpenRubricDrawer: (indicator: IndicatorItem) => void;
  onOpenEvidenceDrawer: (indicatorId: string) => void;
  onAddEvidence?: (item: EvidenceLink) => void;
  onUpdateEvidence?: (evidenceId: string, updated: Partial<EvidenceLink>) => void;
  onDeleteEvidence?: (evidenceId: string) => void;
  onUpdateIndicatorEvidence?: (indicatorId: string, newTags: string[]) => void;
  globalVariables?: Record<string, number>;
  onUpdateGlobalVariable?: (key: string, val: number) => void;
  onResetGlobalVariablesToZero?: () => void;
  onNavigateToPintuMasuk?: () => void;
}

export const KertasKerjaView: React.FC<KertasKerjaViewProps> = ({
  currentLam,
  assessmentRecords,
  activeRole,
  onChangeRole,
  studyInfo,
  evidenceList,
  onUpdateRecord,
  onOpenRubricDrawer,
  onOpenEvidenceDrawer,
  onAddEvidence,
  onUpdateEvidence,
  onDeleteEvidence,
  onUpdateIndicatorEvidence,
  globalVariables,
  onUpdateGlobalVariable,
  onResetGlobalVariablesToZero,
  onNavigateToPintuMasuk,
}) => {
  const { token } = theme.useToken();
  const [viewMode, setViewMode] = useState<'table' | 'rekap_skor' | 'card'>('table');
  const [selectedKriteria, setSelectedKriteria] = useState<string>('ALL');
  const [selectedSasaranMutu, setSelectedSasaranMutu] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCalculatorIds, setExpandedCalculatorIds] = useState<Record<string, boolean>>({});

  // Evidence Link Modal State
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeIndicatorForEvidence, setActiveIndicatorForEvidence] = useState<IndicatorItem | null>(null);
  const [editingEvidenceItem, setEditingEvidenceItem] = useState<{
    id?: string;
    originalName: string;
    name: string;
    url: string;
    type?: string;
    isTag: boolean;
  } | null>(null);

  const [evidenceForm] = Form.useForm();

  // Toggle calculator expansion
  const toggleCalculator = (indicatorId: string) => {
    setExpandedCalculatorIds(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
  };

  // Handlers for Evidence Actions: Add, Edit, Delete
  const handleOpenAddEvidence = (indicator: IndicatorItem) => {
    setActiveIndicatorForEvidence(indicator);
    setEditingEvidenceItem(null);
    setModalMode('add');
    evidenceForm.resetFields();
    evidenceForm.setFieldsValue({
      name: '',
      url: 'https://',
      type: 'Google Drive',
    });
    setEvidenceModalOpen(true);
  };

  const handleOpenEditEvidence = (
    item: { id?: string; name: string; url: string; type?: string; isTag: boolean }, 
    indicator: IndicatorItem
  ) => {
    setActiveIndicatorForEvidence(indicator);
    setEditingEvidenceItem({
      id: item.id,
      originalName: item.name,
      name: item.name,
      url: item.url,
      type: item.type || 'Google Drive',
      isTag: item.isTag,
    });
    setModalMode('edit');
    evidenceForm.setFieldsValue({
      name: item.name,
      url: item.url,
      type: item.type || 'Google Drive',
    });
    setEvidenceModalOpen(true);
  };

  const handleDeleteEvidenceItem = (
    item: { id?: string; name: string; isTag: boolean }, 
    indicator: IndicatorItem
  ) => {
    if (item.isTag) {
      const newTags = (indicator.evidenceTags || []).filter(t => t !== item.name);
      onUpdateIndicatorEvidence?.(indicator.id, newTags);
      deleteCustomEvidenceDocument(item.name);
    }
    if (item.id && !item.isTag) {
      onDeleteEvidence?.(item.id);
    }
    message.success(`Tautan bukti "${item.name}" berhasil dihapus.`);
  };

  const handleSaveEvidenceModal = (values: { name: string; url: string; type: string }) => {
    if (!activeIndicatorForEvidence) return;
    const { name, url, type } = values;

    if (modalMode === 'add') {
      const newEvidenceId = `ev-custom-${Date.now()}`;
      const { domain, driveType } = classifyUrlDomain(url);
      
      const newEvidence: EvidenceLink = {
        id: newEvidenceId,
        title: name,
        url,
        domain,
        driveType: (type as any) || driveType,
        foundInDoc: `Indikator ${activeIndicatorForEvidence.code}`,
        indicatorId: activeIndicatorForEvidence.id,
        indicatorCode: activeIndicatorForEvidence.code,
        status: 'accessible',
        notes: `Ditambahkan melalui kertas kerja indikator ${activeIndicatorForEvidence.code}`,
      };

      onAddEvidence?.(newEvidence);

      updateCustomEvidenceDocument(name, {
        name,
        url,
        type: (type as any) || 'Google Drive',
      });

      const currentTags = activeIndicatorForEvidence.evidenceTags || [];
      if (!currentTags.includes(name)) {
        onUpdateIndicatorEvidence?.(activeIndicatorForEvidence.id, [...currentTags, name]);
      }

      message.success(`Tautan bukti "${name}" berhasil ditambahkan ke Indikator ${activeIndicatorForEvidence.code}!`);
    } else if (editingEvidenceItem) {
      if (editingEvidenceItem.isTag) {
        updateCustomEvidenceDocument(editingEvidenceItem.originalName, {
          name,
          url,
          type: (type as any) || 'Google Drive',
        });
        if (editingEvidenceItem.originalName !== name) {
          const currentTags = (activeIndicatorForEvidence.evidenceTags || []).map(t => 
            t === editingEvidenceItem.originalName ? name : t
          );
          onUpdateIndicatorEvidence?.(activeIndicatorForEvidence.id, currentTags);
        }
      }

      if (editingEvidenceItem.id && !editingEvidenceItem.isTag) {
        onUpdateEvidence?.(editingEvidenceItem.id, {
          title: name,
          url,
          driveType: (type as any) || 'Google Drive',
        });
      }

      message.success(`Tautan bukti "${name}" berhasil diperbarui!`);
    }

    setEvidenceModalOpen(false);
  };

  // Filter indicators sequentially
  const filteredIndicators = useMemo(() => {
    return currentLam.indicators.filter((ind) => {
      const matchesKriteria = checkIndicatorMatchesCriteria(ind, selectedKriteria);
      const matchesSasaranMutu = 
        selectedSasaranMutu === 'ALL' || 
        ind.sasaranMutu === selectedSasaranMutu || 
        ind.dimensi === selectedSasaranMutu;
      const matchesCategory = 
        selectedCategory === 'ALL' || 
        (selectedCategory === 'SYARAT_UNGGUL' ? ind.isSyaratUnggul : ind.category === selectedCategory);
      
      const numStr = ind.indicatorNumber ? String(ind.indicatorNumber) : '';
      const matchesSearch = 
        ind.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        numStr.includes(searchQuery.trim()) ||
        ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.element.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ind.kriteriaTitle && ind.kriteriaTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ind.subKriteriaTitle && ind.subKriteriaTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesKriteria && matchesSasaranMutu && matchesCategory && matchesSearch;
    });
  }, [currentLam.indicators, selectedKriteria, selectedSasaranMutu, selectedCategory, searchQuery]);

  // Live score calculation (Gambar 3 format & max 400 total)
  const liveCalculation = useMemo(() => {
    return calculateCriteriaSubtotals(currentLam.indicators, assessmentRecords, activeRole);
  }, [currentLam.indicators, assessmentRecords, activeRole]);

  const { grandTotalBobot, grandTotalWeightedScore, maxScore, subtotals } = liveCalculation;

  // Set / Centang skor langsung ke level (4, 3, 2, 1, 0)
  const handleSelectScore = (indicatorId: string, targetScore: number) => {
    const rec = assessmentRecords[indicatorId] || {
      scoreAsesor1: 0,
      scoreAsesor2: 0,
      scoreConsensus: 0,
      scoreSelf: 0,
    };

    if (activeRole === 'asesor1') {
      const s2 = rec.scoreAsesor2 ?? targetScore;
      const consensus = Math.round(((targetScore + s2) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, {
        scoreAsesor1: targetScore,
        scoreConsensus: consensus,
        isRated: true,
      });
      message.success(`Skor Asesor 1 pada indikator dicentang: ${targetScore}`);
    } else if (activeRole === 'asesor2') {
      const s1 = rec.scoreAsesor1 ?? targetScore;
      const consensus = Math.round(((s1 + targetScore) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, {
        scoreAsesor2: targetScore,
        scoreConsensus: consensus,
        isRated: true,
      });
      message.success(`Skor Asesor 2 pada indikator dicentang: ${targetScore}`);
    } else {
      // Konsensus
      onUpdateRecord(indicatorId, {
        scoreConsensus: targetScore,
        scoreAsesor1: targetScore,
        scoreAsesor2: targetScore,
        isRated: true,
      });
      message.success(`Skor Konsensus pada indikator dicentang: ${targetScore}`);
    }
  };

  // Menulis / mengedit skor langsung via InputNumber
  const handleWriteScore = (indicatorId: string, val: number | null) => {
    if (val === null || isNaN(val)) return;
    const clamped = Math.min(4, Math.max(0, val));
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
      onUpdateRecord(indicatorId, {
        scoreConsensus: clamped,
        isRated: true,
      });
    }
  };

  const handleAdjustScore = (indicatorId: string, role: 'asesor1' | 'asesor2', delta: number) => {
    const rec = assessmentRecords[indicatorId];
    if (!rec) return;

    if (role === 'asesor1') {
      const current = rec.scoreAsesor1 ?? 0;
      const nextScore = Math.min(4, Math.max(0, Math.round((current + delta) * 10) / 10));
      const s2 = rec.scoreAsesor2 ?? 0;
      const consensus = Math.round(((nextScore + s2) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, { 
        scoreAsesor1: nextScore,
        scoreConsensus: consensus,
      });
    } else {
      const current = rec.scoreAsesor2 ?? 0;
      const nextScore = Math.min(4, Math.max(0, Math.round((current + delta) * 10) / 10));
      const s1 = rec.scoreAsesor1 ?? 0;
      const consensus = Math.round(((s1 + nextScore) / 2) * 10) / 10;
      onUpdateRecord(indicatorId, { 
        scoreAsesor2: nextScore,
        scoreConsensus: consensus,
      });
    }
  };

  // Variable change in quantitative formulas
  const handleVariableChange = (indicator: IndicatorItem, varKey: string, newVal: number) => {
    const currentRec = assessmentRecords[indicator.id];
    const currentVars = currentRec?.variableValues || {};
    const updatedVars = { ...currentVars, [varKey]: newVal };

    let calculatedScore = currentRec?.scoreAsesor1 ?? 0;
    if (indicator.scoringFormula) {
      calculatedScore = Math.min(4, Math.max(0, evaluateFormula(indicator.scoringFormula.expression, updatedVars)));
    }

    const updatedData: Partial<AssessmentRecord> = {
      variableValues: updatedVars,
      scoreSelf: calculatedScore,
      scoreAsesor1: calculatedScore,
      scoreAsesor2: calculatedScore,
      scoreConsensus: calculatedScore,
    };

    onUpdateRecord(indicator.id, updatedData);

    if (onUpdateGlobalVariable) {
      if (updatedVars.NDS3 !== undefined && updatedVars.NDTPS !== undefined && updatedVars.NDTPS > 0) {
        const pDosenS3 = Math.round((updatedVars.NDS3 / updatedVars.NDTPS) * 100 * 10) / 10;
        onUpdateGlobalVariable('PDGBLKL', pDosenS3);
        onUpdateGlobalVariable('N_DS3', updatedVars.NDS3);
        onUpdateGlobalVariable('N_DTPS', updatedVars.NDTPS);
      }
      if (updatedVars.PTW_INPUT !== undefined) {
        onUpdateGlobalVariable('PTW', updatedVars.PTW_INPUT);
      }
      if (updatedVars.PPS_INPUT !== undefined) {
        onUpdateGlobalVariable('PPS', updatedVars.PPS_INPUT);
      }
      if (updatedVars.WT_VAL !== undefined) {
        onUpdateGlobalVariable('WT', updatedVars.WT_VAL);
      }
    }
  };

  // Active score for the current role
  const getActiveRoleScore = (rec: AssessmentRecord) => {
    if (activeRole === 'asesor1') return rec.scoreAsesor1 ?? 0;
    if (activeRole === 'asesor2') return rec.scoreAsesor2 ?? 0;
    return rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0;
  };

  return (
    <div style={{ width: '100%', padding: '16px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Top Banner & Control Toolbar */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 16, 
          backgroundColor: '#0f172a', 
          borderColor: '#1e293b',
          borderRadius: 10,
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={14}>
            <Flex align="center" gap="middle" wrap="wrap">
              <div>
                <Title level={4} style={{ margin: 0, color: '#f8fafc', fontWeight: 700, letterSpacing: -0.3 }}>
                  SISTEM DAN ACUAN PENILAIAN AKREDITASI PROGRAM STUDI
                </Title>
                <Text type="secondary" style={{ fontSize: 12, color: '#94a3b8' }}>
                  Instrumen Kertas Kerja Asesmen Lapangan (AL) · {currentLam.lamCode} ({currentLam.indicators.length} Indikator Runtut No. 1 s.d. {currentLam.indicators.length})
                </Text>
              </div>
            </Flex>
          </Col>

          <Col xs={24} md={10}>
            <Flex justify="flex-end" align="center" gap="small" wrap="wrap">
              {onNavigateToPintuMasuk && (
                <Button
                  size="small"
                  icon={<FormOutlined style={{ color: '#facc15' }} />}
                  onClick={onNavigateToPintuMasuk}
                  style={{
                    backgroundColor: '#854d0e',
                    borderColor: '#ca8a04',
                    color: '#fef08a',
                    fontWeight: 700,
                  }}
                >
                  🚪 Isian Kuantitatif LKPS
                </Button>
              )}
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>Mode Tampilan:</Text>
              <Segmented
                value={viewMode}
                onChange={(val) => setViewMode(val as 'table' | 'rekap_skor' | 'card')}
                options={[
                  { 
                    label: 'Format Tabel Resmi (Gambar 2)', 
                    value: 'table', 
                    icon: <TableOutlined /> 
                  },
                  { 
                    label: 'Format Hasil Skor AK/AL (Gambar 3)', 
                    value: 'rekap_skor', 
                    icon: <AuditOutlined /> 
                  },
                  { 
                    label: 'Format Kartu (Gambar 1)', 
                    value: 'card', 
                    icon: <AppstoreOutlined /> 
                  },
                ]}
              />
            </Flex>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0', borderColor: '#1e293b' }} />

        {/* Filter & Search Bar */}
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={7}>
            <Input
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              placeholder={`Cari indikator, nomor (1-${currentLam.indicators.length}), atau kata kunci...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <TreeSelect
              value={selectedKriteria}
              onChange={(val) => setSelectedKriteria(val)}
              style={{ width: '100%' }}
              styles={{ popup: { root: { maxHeight: 450, overflow: 'auto', backgroundColor: '#0f172a' } } }}
              treeData={getCriteriaTreeSelectData()}
              placeholder="Filter Kriteria"
              treeDefaultExpandAll={true}
              showSearch
              treeNodeFilterProp="title"
              allowClear={false}
            />
          </Col>

          <Col xs={12} sm={8} md={4}>
            <Select
              value={selectedSasaranMutu}
              onChange={setSelectedSasaranMutu}
              style={{ width: '100%' }}
              options={[
                { label: 'Semua Sasaran Mutu', value: 'ALL' },
                { label: 'Masukan', value: 'Masukan' },
                { label: 'Proses', value: 'Proses' },
                { label: 'Luaran', value: 'Luaran' },
                { label: 'Dampak', value: 'Dampak' },
              ]}
            />
          </Col>

          <Col xs={12} sm={8} md={4}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              options={[
                { label: 'Semua Tipe Indikator', value: 'ALL' },
                { label: 'Kuantitatif (LKPS)', value: 'Kuantitatif' },
                { label: 'Kualitatif (LED)', value: 'Kualitatif' },
                { label: 'Hybrid', value: 'Hybrid' },
                { label: '★ Syarat Perlu Unggul', value: 'SYARAT_UNGGUL' },
              ]}
            />
          </Col>

          <Col xs={24} sm={8} md={3}>
            <Flex justify="flex-end" align="center">
              <Tag color="cyan" style={{ margin: 0, padding: '4px 8px', fontSize: 12, fontWeight: 600 }}>
                {filteredIndicators.length} / {currentLam.indicators.length} Butir
              </Tag>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* ======================================================== */}
      {/* MODE 1: TABEL STANDAR INSTRUMEN RESMI / REKAP SKOR / KARTU */}
      {/* ======================================================== */}
      {viewMode === 'rekap_skor' ? (
        <HasilSkorAkAlTable
          currentLam={currentLam}
          assessmentRecords={assessmentRecords}
          activeRole={activeRole}
          onChangeRole={onChangeRole}
          studyInfo={studyInfo}
          onUpdateRecord={onUpdateRecord}
          onOpenRubricDrawer={onOpenRubricDrawer}
          onNavigateToRubricTable={() => setViewMode('table')}
          onResetGlobalVariablesToZero={onResetGlobalVariablesToZero}
        />
      ) : viewMode === 'table' ? (
        <>
          {/* Top Live Rekapitulasi Skor Bar (Max 400.00) */}
          <div style={{
            backgroundColor: '#0f172a',
            border: '1.5px solid #10b981',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
          }}>
            <Flex align="center" gap="middle" wrap="wrap">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Live Skor AK/AL:
                </Text>
                <span style={{ fontSize: 26, fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                  {grandTotalWeightedScore.toFixed(2)}
                </span>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  / {maxScore.toFixed(2)}
                </span>
              </div>
              <Tag 
                color={grandTotalWeightedScore >= 361 ? 'success' : grandTotalWeightedScore >= 301 ? 'processing' : 'warning'} 
                style={{ fontWeight: 800, fontSize: 12, padding: '3px 10px' }}
              >
                {grandTotalWeightedScore >= 361 ? 'TERAKREDITASI UNGGUL' : grandTotalWeightedScore >= 301 ? 'BAIK SEKALI' : 'BAIK'}
              </Tag>
              <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#cbd5e1', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((kNum) => {
                  const st = subtotals[kNum];
                  return (
                    <span key={kNum}>
                      K{kNum}: <strong style={{ color: '#38bdf8' }}>{st?.totalWeightedScore.toFixed(1)}/{st?.maxPossibleScore.toFixed(0)}</strong>
                      {kNum < 9 ? ' · ' : ''}
                    </span>
                  );
                })}
              </div>
            </Flex>

            <Button
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => setViewMode('rekap_skor')}
              style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 700, borderRadius: 6 }}
            >
              Lihat Format Tabel Hasil Skor AK/AL (Gambar 3)
            </Button>
          </div>

          <div style={{
            backgroundColor: '#0b1120',
            borderRadius: 8,
            border: '1px solid #1e293b',
            overflowX: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <table style={{
            width: '100%',
            minWidth: 1420,
            borderCollapse: 'collapse',
            textAlign: 'left',
            color: '#e2e8f0',
            fontSize: 13,
          }}>
            <thead>
              {/* Header Baris 1 */}
              <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '12px 10px', width: 120, borderRight: '1px solid #334155', fontWeight: 700 }} rowSpan={2}>
                  KRITERIA
                </th>
                <th style={{ padding: '12px 10px', width: 90, borderRight: '1px solid #334155', fontWeight: 700 }} rowSpan={2}>
                  SASARAN MUTU
                </th>
                <th style={{ padding: '12px 8px', width: 65, textAlign: 'center', borderRight: '1px solid #334155', fontWeight: 700 }} rowSpan={2}>
                  INDIKATOR
                </th>
                <th style={{ padding: '12px 14px', minWidth: 260, maxWidth: 320, borderRight: '1px solid #334155', fontWeight: 700 }} rowSpan={2}>
                  ELEMEN & INDIKATOR PENILAIAN LAMDIK
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #334155', fontWeight: 700, backgroundColor: '#1e293b' }} colSpan={5}>
                  HARKAT PENSKORAN · ACUAN & ASPEK RUBRIK
                </th>
                <th style={{ padding: '12px 12px', minWidth: 240, width: 260, fontWeight: 700, textAlign: 'center', backgroundColor: '#0f172a' }} rowSpan={2}>
                  FIELD ASESOR (MENICANG / MENULIS SKOR & CATATAN)
                </th>
              </tr>

              {/* Header Baris 2: Sub-Kolom 4, 3, 2, 1, 0 */}
              <tr style={{ backgroundColor: '#0f172a', color: '#f8fafc', borderBottom: '2px solid #334155' }}>
                {[4, 3, 2, 1, 0].map((score) => (
                  <th key={score} style={{
                    padding: '8px 6px',
                    width: 175,
                    textAlign: 'center',
                    borderRight: '1px solid #334155',
                    fontWeight: 700,
                    fontSize: 14,
                    color: score === 4 ? '#34d399' : score === 3 ? '#38bdf8' : score === 2 ? '#fbbf24' : score === 1 ? '#fb923c' : '#f87171'
                  }}>
                    Skor {score}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredIndicators.map((indicator, idx) => {
                const rec = assessmentRecords[indicator.id] || {
                  scoreAsesor1: 0,
                  scoreAsesor2: 0,
                  scoreConsensus: 0,
                  scoreSelf: 0,
                  notesAsesor1: '',
                  notesAsesor2: '',
                  consensusNotes: '',
                  variableValues: {},
                  isRated: false,
                };

                const activeScore = getActiveRoleScore(rec);
                const isSelectedScore = (scoreVal: number) => {
                  if (scoreVal > 0) {
                    return Math.round(activeScore) === scoreVal;
                  }
                  return activeScore === 0 && Boolean(rec.isRated);
                };

                const selfDocLabel = indicator.category === 'Kuantitatif'
                  ? (currentLam.docTerms.quantitativeDoc || 'LKPS')
                  : indicator.category === 'Kualitatif'
                  ? (currentLam.docTerms.qualitativeDoc || 'LED')
                  : (indicator.sourceDoc === 'LKPS' ? (currentLam.docTerms.quantitativeDoc || 'LKPS') : (currentLam.docTerms.qualitativeDoc || 'LED'));

                const delta = Math.abs((rec.scoreAsesor1 ?? 0) - (rec.scoreAsesor2 ?? 0));
                const hasDiscrepancy = delta >= 1;
                const isCalcExpanded = Boolean(expandedCalculatorIds[indicator.id]);

                const linkedEvidences = evidenceList.filter(
                  ev => ev.indicatorId === indicator.id || ev.indicatorCode === indicator.code
                );

                const resolvedTags = (indicator.evidenceTags || []).map(tag => ({
                  ...getEvidenceDocumentInfo(tag),
                  isTag: true,
                  originalTag: tag,
                }));

                const allDocs = [
                  ...linkedEvidences.map(ev => ({
                    id: ev.id,
                    name: ev.title,
                    url: ev.url,
                    type: ev.driveType || 'Google Drive',
                    isTag: false,
                    originalTag: undefined,
                  })),
                  ...resolvedTags.map((doc, dIdx) => ({
                    id: `tag-${dIdx}-${doc.name}`,
                    name: doc.name,
                    url: doc.url,
                    type: doc.type,
                    isTag: true,
                    originalTag: doc.originalTag,
                  }))
                ];

                const rowBg = idx % 2 === 0 ? '#0b1120' : '#0e1626';

                return (
                  <tr 
                    key={indicator.id} 
                    style={{ 
                      backgroundColor: rowBg, 
                      borderBottom: '1px solid #1e293b',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {/* Kolom 1: Kriteria */}
                    <td style={{
                      padding: '12px 10px',
                      verticalAlign: 'top',
                      borderRight: '1px solid #1e293b',
                      fontWeight: 600,
                      color: '#cbd5e1',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {indicator.kriteriaTitle.replace('Kriteria ', '')}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        Bobot: <strong style={{ color: '#38bdf8' }}>{indicator.bobot}</strong>
                      </div>
                    </td>

                    {/* Kolom 2: Sasaran Mutu */}
                    <td style={{
                      padding: '12px 10px',
                      verticalAlign: 'top',
                      borderRight: '1px solid #1e293b',
                    }}>
                      <Tag 
                        color={
                          (indicator.sasaranMutu || indicator.dimensi) === 'Masukan' ? 'blue' : 
                          (indicator.sasaranMutu || indicator.dimensi) === 'Proses' ? 'green' : 
                          (indicator.sasaranMutu || indicator.dimensi) === 'Luaran' ? 'orange' : 'magenta'
                        } 
                        style={{ margin: 0, fontWeight: 600, fontSize: 11 }}
                      >
                        {indicator.sasaranMutu || indicator.dimensi || 'Masukan'}
                      </Tag>
                      <div style={{ marginTop: 6 }}>
                        <Tag color={indicator.category === 'Kuantitatif' ? 'blue' : indicator.category === 'Kualitatif' ? 'purple' : 'gold'} style={{ fontSize: 10, margin: 0 }}>
                          {indicator.category}
                        </Tag>
                      </div>
                    </td>

                    {/* Kolom 3: Nomor Indikator */}
                    <td style={{
                      padding: '12px 8px',
                      verticalAlign: 'top',
                      textAlign: 'center',
                      borderRight: '1px solid #1e293b',
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        fontWeight: 800,
                        fontSize: 16,
                        fontFamily: 'monospace',
                        color: '#38bdf8',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      }}>
                        {indicator.indicatorNumber ?? indicator.code}
                      </div>
                      {indicator.isSyaratUnggul && (
                        <div style={{ marginTop: 4 }}>
                          <Tooltip title="Syarat Perlu Peringkat Unggul">
                            <Tag color="red" style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>UNGGUL</Tag>
                          </Tooltip>
                        </div>
                      )}
                    </td>

                    {/* Kolom 4: Indikator & Elemen Penilaian */}
                    <td style={{
                      padding: '12px 14px',
                      verticalAlign: 'top',
                      borderRight: '1px solid #1e293b',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc', marginBottom: 6, lineHeight: 1.4 }}>
                        {indicator.name}
                      </div>
                      <Paragraph 
                        ellipsis={{ rows: 5, expandable: true, symbol: 'baca selengkapnya' }}
                        style={{ fontSize: 12, color: '#cbd5e1', whiteSpace: 'pre-line', margin: 0, lineHeight: 1.5 }}
                      >
                        {indicator.element}
                      </Paragraph>

                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag style={{ fontSize: 10, backgroundColor: '#1e293b', borderColor: '#334155', color: '#94a3b8' }}>
                          Dokumen: <strong>{selfDocLabel}</strong>
                        </Tag>

                        {indicator.scoringFormula && (
                          <Button
                            size="small"
                            type="dashed"
                            icon={<CalculatorOutlined style={{ color: '#38bdf8' }} />}
                            onClick={() => toggleCalculator(indicator.id)}
                            style={{ fontSize: 11, height: 22, padding: '0 6px' }}
                          >
                            {isCalcExpanded ? 'Tutup Kalkulator' : 'Buka Kalkulator KaTeX'}
                          </Button>
                        )}

                        <Button 
                          size="small"
                          type="link"
                          icon={<AuditOutlined />}
                          onClick={() => onOpenRubricDrawer(indicator)}
                          style={{ fontSize: 11, height: 22, padding: 0, color: '#06b6d4' }}
                        >
                          Drawer Rubrik
                        </Button>
                      </div>

                      {/* Kalkulator Kuantitatif Tersemat (KaTeX & Sliders) */}
                      {indicator.scoringFormula && isCalcExpanded && (
                        <div style={{
                          marginTop: 10,
                          padding: 10,
                          backgroundColor: '#0f172a',
                          borderRadius: 6,
                          border: '1px solid #334155',
                        }}>
                          <div style={{ textAlign: 'center', marginBottom: 8, overflowX: 'auto' }}>
                            <div dangerouslySetInnerHTML={{ __html: renderLatex(indicator.scoringFormula.latex, true) }} />
                            <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                              {indicator.scoringFormula.explanation}
                            </Text>
                          </div>

                          <Row gutter={[8, 8]}>
                            {indicator.scoringFormula.variables.map((v) => {
                              const val = rec.variableValues?.[v.key] ?? v.defaultValue;
                              return (
                                <Col key={v.key} xs={24} sm={12}>
                                  <div style={{ backgroundColor: '#1e293b', padding: '6px 8px', borderRadius: 4 }}>
                                    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                                      <Text style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{v.label}:</Text>
                                      <InputNumber
                                        size="small"
                                        min={v.min ?? 0}
                                        max={v.max ?? 100}
                                        step={v.step ?? 1}
                                        value={val}
                                        onChange={(nv) => {
                                          if (nv !== null && !isNaN(Number(nv))) {
                                            handleVariableChange(indicator, v.key, Number(nv));
                                          }
                                        }}
                                        style={{ width: 68, fontSize: 11 }}
                                      />
                                    </Flex>
                                    <Slider
                                      min={v.min ?? 0}
                                      max={v.max ?? 100}
                                      step={v.step ?? 1}
                                      value={val}
                                      onChange={(nv) => handleVariableChange(indicator, v.key, nv)}
                                      style={{ margin: '4px 0' }}
                                    />
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>
                        </div>
                      )}
                    </td>

                    {/* ========================================================= */}
                    {/* KOLOM RUBRIK PENILAIAN (SKOR 4, 3, 2, 1, 0) SESUAI GAMBAR 2 */}
                    {/* ========================================================= */}
                    {[4, 3, 2, 1, 0].map((scoreLevel) => {
                      const rubricKey = `score${scoreLevel}` as keyof typeof indicator.rubric;
                      const rubricText = indicator.rubric[rubricKey] || `Tidak ada acuan spesifik skor ${scoreLevel}.`;
                      const isSelected = isSelectedScore(scoreLevel);

                      return (
                        <td 
                          key={scoreLevel}
                          onClick={() => handleSelectScore(indicator.id, scoreLevel)}
                          style={{
                            padding: '10px 8px',
                            verticalAlign: 'top',
                            borderRight: '1px solid #1e293b',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                            border: isSelected ? '2px solid #06b6d4' : undefined,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Tombol Centang Skor di atas teks rubrik */}
                          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Button
                              size="small"
                              type={isSelected ? 'primary' : 'default'}
                              icon={isSelected ? <CheckOutlined /> : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectScore(indicator.id, scoreLevel);
                              }}
                              style={{
                                fontSize: 11,
                                height: 24,
                                padding: '0 8px',
                                fontWeight: 700,
                                backgroundColor: isSelected ? '#059669' : '#1e293b',
                                borderColor: isSelected ? '#10b981' : '#334155',
                                color: isSelected ? '#ffffff' : '#cbd5e1',
                              }}
                            >
                              {isSelected ? `✓ Terpilih: ${scoreLevel}` : `Pilih ${scoreLevel}`}
                            </Button>

                            {isSelected && (
                              <Tag color="cyan" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                {activeRole === 'asesor1' ? 'A1' : activeRole === 'asesor2' ? 'A2' : 'Konsensus'}
                              </Tag>
                            )}
                          </div>

                          {/* Teks Deskripsi Acuan Rubrik */}
                          <div style={{
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            color: isSelected ? '#f8fafc' : '#94a3b8',
                            fontWeight: isSelected ? 500 : 400,
                          }}>
                            {rubricText}
                          </div>
                        </td>
                      );
                    })}

                    {/* ======================================================== */}
                    {/* KOLOM PENILAIAN ASESOR (INPUT SKOR, BUKTI, CATATAN TEMUAN) */}
                    {/* ======================================================== */}
                    <td style={{
                      padding: '12px 10px',
                      verticalAlign: 'top',
                      backgroundColor: '#080d1a',
                    }}>
                      {/* Box Pengisian Skor Langsung (Tulis / Input Angka) */}
                      <div style={{
                        padding: '8px 10px',
                        backgroundColor: '#111827',
                        borderRadius: 6,
                        border: '1px solid #1f2937',
                        marginBottom: 10,
                      }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
                            Tulis Skor Asesor:
                          </Text>
                          <Tag color="geekblue" style={{ margin: 0, fontWeight: 700, fontSize: 10 }}>
                            {activeRole === 'asesor1' ? 'Asesor 1 (A1)' : activeRole === 'asesor2' ? 'Asesor 2 (A2)' : 'Konsensus'}
                          </Tag>
                        </Flex>

                        {/* Live Rekapitulasi Bobot & Skor x Bobot Indikator ini */}
                        <div style={{
                          backgroundColor: '#0a0f1d',
                          border: '1px solid #10b981',
                          borderRadius: 6,
                          padding: '5px 8px',
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <div>
                            <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>
                              Bobot: <strong style={{ color: '#cbd5e1' }}>{indicator.bobot.toFixed(2)}%</strong>
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>
                              Skor × Bobot:
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>
                              {(activeScore * indicator.bobot).toFixed(2)}
                            </span>
                            <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>
                              / {(4 * indicator.bobot).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Input Number & Stepper +/- */}
                        <Flex align="center" gap={4} style={{ marginBottom: 6 }}>
                          <Button
                            size="small"
                            icon={<MinusOutlined style={{ fontSize: 10 }} />}
                            disabled={activeScore <= 0}
                            onClick={() => handleAdjustScore(indicator.id, activeRole === 'asesor2' ? 'asesor2' : 'asesor1', -0.5)}
                            style={{ width: 26, height: 26, padding: 0 }}
                          />

                          <InputNumber
                            min={0}
                            max={4}
                            step={0.1}
                            value={activeScore}
                            onChange={(nv) => handleWriteScore(indicator.id, nv)}
                            style={{ 
                              flex: 1, 
                              textAlign: 'center', 
                              fontWeight: 800, 
                              fontFamily: 'monospace',
                              fontSize: 14,
                              backgroundColor: '#0f172a',
                              borderColor: '#38bdf8',
                              color: '#38bdf8',
                            }}
                          />

                          <Button
                            size="small"
                            icon={<PlusOutlined style={{ fontSize: 10 }} />}
                            disabled={activeScore >= 4}
                            onClick={() => handleAdjustScore(indicator.id, activeRole === 'asesor2' ? 'asesor2' : 'asesor1', 0.5)}
                            style={{ width: 26, height: 26, padding: 0 }}
                          />
                        </Flex>

                        {/* Quick Centang Skor Buttons: [4] [3] [2] [1] [0] */}
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'space-between' }}>
                          {[4, 3, 2, 1, 0].map((sVal) => (
                            <button
                              key={sVal}
                              onClick={() => handleSelectScore(indicator.id, sVal)}
                              style={{
                                flex: 1,
                                padding: '3px 0',
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                borderRadius: 4,
                                border: '1px solid',
                                cursor: 'pointer',
                                backgroundColor: isSelectedScore(sVal) ? '#0284c7' : '#1e293b',
                                borderColor: isSelectedScore(sVal) ? '#38bdf8' : '#334155',
                                color: isSelectedScore(sVal) ? '#ffffff' : '#cbd5e1',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Centang skor ${sVal}`}
                            >
                              {sVal}
                            </button>
                          ))}
                        </div>

                        {/* Indikator Rekapitulasi Skor Nilai Multi-Asesor */}
                        <div style={{
                          marginTop: 8,
                          paddingTop: 6,
                          borderTop: '1px dashed #334155',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 10,
                          color: '#94a3b8',
                        }}>
                          <span>
                            {selfDocLabel}: <strong style={{ color: (rec.isRated || (rec.scoreConsensus ?? 0) > 0) ? '#38bdf8' : '#cbd5e1' }}>
                              {(rec.isRated || (rec.scoreConsensus ?? 0) > 0 || (rec.scoreAsesor1 ?? 0) > 0) 
                                ? (rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0) 
                                : (rec.scoreSelf ?? 0)}
                            </strong>
                          </span>
                          <span>A1: <strong style={{ color: '#34d399' }}>{rec.scoreAsesor1 ?? 0}</strong></span>
                          <span>A2: <strong style={{ color: '#38bdf8' }}>{rec.scoreAsesor2 ?? 0}</strong></span>
                          <span>KS: <strong style={{ color: '#f59e0b' }}>{rec.scoreConsensus ?? 0}</strong></span>
                        </div>

                        {hasDiscrepancy && (
                          <div style={{ marginTop: 4 }}>
                            <Tag color="warning" icon={<WarningOutlined />} style={{ fontSize: 9, margin: 0 }}>
                              Disparitas &Delta; = {delta.toFixed(1)}
                            </Tag>
                          </div>
                        )}
                      </div>

                      {/* Catatan Temuan Lapangan */}
                      <div style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                          Catatan Temuan ({activeRole}):
                        </Text>
                        <Input.TextArea
                          rows={2}
                          placeholder="Catatan verifikasi dokumen & lapangan..."
                          value={
                            activeRole === 'asesor1'
                              ? rec.notesAsesor1 || ''
                              : activeRole === 'asesor2'
                              ? rec.notesAsesor2 || ''
                              : rec.consensusNotes || ''
                          }
                          onChange={(e) => {
                            if (activeRole === 'asesor1') onUpdateRecord(indicator.id, { notesAsesor1: e.target.value });
                            else if (activeRole === 'asesor2') onUpdateRecord(indicator.id, { notesAsesor2: e.target.value });
                            else onUpdateRecord(indicator.id, { consensusNotes: e.target.value });
                          }}
                          style={{ fontSize: 11, backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                        />
                      </div>

                      {/* Tautan Dokumen Bukti & Tambah Link */}
                      <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                            Bukti Terkait ({allDocs.length}):
                          </Text>
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlusOutlined style={{ fontSize: 9 }} />}
                            onClick={() => handleOpenAddEvidence(indicator)}
                            style={{ fontSize: 10, height: 20, padding: '0 6px', backgroundColor: '#059669', borderColor: '#059669' }}
                          >
                            Tambah
                          </Button>
                        </Flex>

                        {allDocs.length > 0 ? (
                          <div style={{ maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {allDocs.map((docItem) => (
                              <div
                                key={docItem.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '2px 4px',
                                  borderRadius: 3,
                                  backgroundColor: '#1e293b',
                                  fontSize: 10,
                                }}
                              >
                                <Typography.Link
                                  href={docItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    color: '#38bdf8',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    fontSize: 10,
                                  }}
                                >
                                  <LinkOutlined style={{ fontSize: 9 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{docItem.name}</span>
                                </Typography.Link>

                                <Space size={1}>
                                  <Tooltip title="Salin Link">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<CopyOutlined style={{ fontSize: 9 }} />}
                                      style={{ width: 16, height: 16, padding: 0 }}
                                      onClick={() => {
                                        navigator.clipboard.writeText(docItem.url);
                                        message.success('Link disalin!');
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Hapus">
                                    <Popconfirm
                                      title="Hapus tautan ini?"
                                      onConfirm={() => handleDeleteEvidenceItem(docItem, indicator)}
                                      okText="Ya"
                                      cancelText="Batal"
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined style={{ fontSize: 9 }} />}
                                        style={{ width: 16, height: 16, padding: 0 }}
                                      />
                                    </Popconfirm>
                                  </Tooltip>
                                </Space>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic style={{ fontSize: 10 }}>
                            Belum ada dokumen tertaut
                          </Text>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Rekapitulasi Skor AK/AL Langsung (Maksimal 400) */}
            <tfoot>
              <tr style={{ backgroundColor: '#0f172a', borderTop: '3px solid #10b981' }}>
                <td colSpan={4} style={{ padding: '16px 14px' }}>
                  <Text style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc', display: 'block' }}>
                    REKAPITULASI HASIL SKOR AK/AL INSTRUMEN ({currentLam.indicators.length} INDIKATOR)
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Total akumulasi nilai tertimbang (Skor × Bobot) seluruh indikator akreditasi prodi.
                  </Text>
                </td>
                <td colSpan={5} style={{ padding: '16px 14px', textAlign: 'center' }}>
                  <Space size="large">
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>TOTAL BOBOT</span>
                      <strong style={{ fontSize: 16, color: '#f8fafc' }}>{grandTotalBobot.toFixed(2)}%</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>STATUS AKREDITASI</span>
                      <Tag color={grandTotalWeightedScore >= 361 ? 'success' : grandTotalWeightedScore >= 301 ? 'processing' : 'warning'} style={{ fontWeight: 800, fontSize: 12 }}>
                        {grandTotalWeightedScore >= 361 ? 'TERAKREDITASI UNGGUL' : grandTotalWeightedScore >= 301 ? 'BAIK SEKALI' : 'BAIK'}
                      </Tag>
                    </div>
                  </Space>
                </td>
                <td style={{ padding: '16px 14px', textAlign: 'center', backgroundColor: '#080d1a' }}>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #10b981', borderRadius: 8, padding: '8px 10px' }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                      TOTAL SKOR AL
                    </span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>
                      {grandTotalWeightedScore.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>
                      / {maxScore.toFixed(2)}
                    </span>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setViewMode('rekap_skor')}
                    style={{ fontSize: 11, padding: 0, marginTop: 4, color: '#38bdf8' }}
                  >
                    Buka Tabel Gambar 3 →
                  </Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        </>
      ) : (
        /* ======================================================== */
        /* MODE 2: FORMAT KARTU DETAIL INTERAKTIF (GAMBAR 1)        */
        /* ======================================================== */
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {filteredIndicators.map((indicator) => {
            const rec = assessmentRecords[indicator.id] || {
              scoreAsesor1: 4,
              scoreAsesor2: 4,
              scoreConsensus: 4,
              scoreSelf: 4,
              notesAsesor1: '',
              notesAsesor2: '',
              consensusNotes: '',
              variableValues: {},
            };

            const selfDocLabel = indicator.category === 'Kuantitatif'
              ? (currentLam.docTerms.quantitativeDoc || 'LKPS')
              : indicator.category === 'Kualitatif'
              ? (currentLam.docTerms.qualitativeDoc || 'LED')
              : (indicator.sourceDoc === 'LKPS' ? (currentLam.docTerms.quantitativeDoc || 'LKPS') : (currentLam.docTerms.qualitativeDoc || 'LED'));

            const isRatedCard = Boolean(rec.isRated || (rec.scoreConsensus && rec.scoreConsensus > 0) || (rec.scoreAsesor1 && rec.scoreAsesor1 > 0));
            const scoreSelfInt = isRatedCard
              ? Math.min(4, Math.max(0, Math.round(rec.scoreConsensus ?? rec.scoreAsesor1 ?? 0)))
              : Math.min(4, Math.max(0, Math.round(rec.scoreSelf ?? 0)));
            const scoreA1Int = Math.min(4, Math.max(0, Math.round(rec.scoreAsesor1 ?? 0)));
            const scoreA2Int = Math.min(4, Math.max(0, Math.round(rec.scoreAsesor2 ?? 0)));
            const scoreConsensusInt = Math.min(4, Math.max(0, Math.round(rec.scoreConsensus ?? 0)));

            const deltaInt = Math.abs(scoreA1Int - scoreA2Int);
            const hasSignificantDiscrepancy = deltaInt >= 1;
            const linkedEvidences = evidenceList.filter(
              ev => ev.indicatorId === indicator.id || ev.indicatorCode === indicator.code
            );

            return (
              <Card
                key={indicator.id}
                style={{
                  borderColor: hasSignificantDiscrepancy ? token.colorWarningBorder : '#1e293b',
                  backgroundColor: '#0f172a',
                  borderRadius: 8,
                }}
              >
                {/* Header Row: Kode Indikator, Judul, Nilai & Stepper */}
                <Row gutter={[16, 16]} align="top" justify="space-between">
                  <Col xs={24} lg={15}>
                    <Space orientation="vertical" size={4}>
                      <Space wrap>
                        <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 }}>
                          No. {indicator.indicatorNumber ?? indicator.code}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12, color: '#94a3b8' }}>
                          {indicator.kriteriaTitle} · Bobot: <Text strong style={{ color: '#38bdf8' }}>{indicator.bobot}</Text>
                        </Text>
                        <Tag 
                          color={
                            (indicator.sasaranMutu || indicator.dimensi) === 'Masukan' ? 'blue' : 
                            (indicator.sasaranMutu || indicator.dimensi) === 'Proses' ? 'green' : 
                            (indicator.sasaranMutu || indicator.dimensi) === 'Luaran' ? 'orange' : 'magenta'
                          } 
                          style={{ fontSize: 11 }}
                        >
                          Sasaran: {indicator.sasaranMutu || indicator.dimensi || 'Masukan'}
                        </Tag>
                        <Tag color={indicator.category === 'Kuantitatif' ? 'blue' : indicator.category === 'Kualitatif' ? 'purple' : 'gold'}>
                          {indicator.category}
                        </Tag>
                        <Tag style={{ fontWeight: 600 }}>Dok: {selfDocLabel}</Tag>
                        {indicator.isSyaratUnggul && (
                          <Tag color="red" icon={<SafetyCertificateOutlined />}>SYARAT UNGGUL</Tag>
                        )}
                        {hasSignificantDiscrepancy && (
                          <Tag color="warning" icon={<WarningOutlined />}>
                            Disparitas &Delta;={deltaInt}
                          </Tag>
                        )}
                      </Space>

                      <Title level={5} style={{ margin: '6px 0 2px', color: '#f8fafc' }}>
                        {indicator.name}
                      </Title>

                      <Text type="secondary" style={{ fontSize: 12, color: '#cbd5e1' }}>
                        <Text strong style={{ color: '#e2e8f0' }}>Elemen Penilaian:</Text> {indicator.element}
                      </Text>
                    </Space>
                  </Col>

                  <Col xs={24} lg={9}>
                    <Flex justify="flex-end" align="center" gap="small" wrap="wrap">
                      {/* Badge Nilai Evaluasi Diri LED / LKPS */}
                      <div style={{
                        backgroundColor: '#111827',
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: '1px solid #1f2937',
                        textAlign: 'center',
                        minWidth: 54,
                      }}>
                        <Text style={{ fontSize: 10, display: 'block', fontWeight: 700, color: '#38bdf8' }}>
                          {selfDocLabel}
                        </Text>
                        <Text strong style={{ fontSize: 16, fontFamily: 'monospace', color: '#ffffff', lineHeight: 1.2 }}>
                          {scoreSelfInt}
                        </Text>
                      </div>

                      {/* Tombol - dan + untuk Asesor 1 */}
                      <div style={{
                        backgroundColor: activeRole === 'asesor1' ? 'rgba(5, 150, 105, 0.15)' : '#1e293b',
                        border: `1px solid ${activeRole === 'asesor1' ? '#10b981' : '#334155'}`,
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}>
                        <Flex align="center" gap={4}>
                          <Tag color="green" style={{ margin: 0, fontWeight: 'bold', fontSize: 10 }}>A1</Tag>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined style={{ fontSize: 10 }} />} 
                            disabled={scoreA1Int <= 0}
                            onClick={() => handleAdjustScore(indicator.id, 'asesor1', -1)} 
                            style={{ width: 22, height: 22, padding: 0 }}
                          />
                          <div style={{ width: 22, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 14, color: '#34d399' }}>
                            {scoreA1Int}
                          </div>
                          <Button 
                            size="small" 
                            icon={<PlusOutlined style={{ fontSize: 10 }} />} 
                            disabled={scoreA1Int >= 4}
                            onClick={() => handleAdjustScore(indicator.id, 'asesor1', 1)} 
                            style={{ width: 22, height: 22, padding: 0 }}
                          />
                        </Flex>
                      </div>

                      {/* Tombol - dan + untuk Asesor 2 */}
                      <div style={{
                        backgroundColor: activeRole === 'asesor2' ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                        border: `1px solid ${activeRole === 'asesor2' ? '#38bdf8' : '#334155'}`,
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}>
                        <Flex align="center" gap={4}>
                          <Tag color="blue" style={{ margin: 0, fontWeight: 'bold', fontSize: 10 }}>A2</Tag>
                          <Button 
                            size="small" 
                            icon={<MinusOutlined style={{ fontSize: 10 }} />} 
                            disabled={scoreA2Int <= 0}
                            onClick={() => handleAdjustScore(indicator.id, 'asesor2', -1)} 
                            style={{ width: 22, height: 22, padding: 0 }}
                          />
                          <div style={{ width: 22, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 14, color: '#38bdf8' }}>
                            {scoreA2Int}
                          </div>
                          <Button 
                            size="small" 
                            icon={<PlusOutlined style={{ fontSize: 10 }} />} 
                            disabled={scoreA2Int >= 4}
                            onClick={() => handleAdjustScore(indicator.id, 'asesor2', 1)} 
                            style={{ width: 22, height: 22, padding: 0 }}
                          />
                        </Flex>
                      </div>

                      {/* Rubrik Skor Drawer Trigger */}
                      <Button 
                        type="primary" 
                        icon={<AuditOutlined />} 
                        onClick={() => onOpenRubricDrawer(indicator)}
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                      >
                        Rubrik
                      </Button>
                    </Flex>
                  </Col>
                </Row>

                {/* Quick Score Centang Bar (4, 3, 2, 1, 0) */}
                <div style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  backgroundColor: '#0b1120',
                  borderRadius: 6,
                  border: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                    Centang Skor ({activeRole}):
                  </Text>
                  <Space size={4}>
                    {[4, 3, 2, 1, 0].map((sVal) => {
                      const curVal = activeRole === 'asesor1' ? scoreA1Int : activeRole === 'asesor2' ? scoreA2Int : scoreConsensusInt;
                      const active = curVal === sVal;
                      return (
                        <Button
                          key={sVal}
                          size="small"
                          type={active ? 'primary' : 'default'}
                          onClick={() => handleSelectScore(indicator.id, sVal)}
                          style={{
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: active ? '#059669' : '#1e293b',
                            borderColor: active ? '#10b981' : '#334155',
                          }}
                        >
                          {active ? `✓ ${sVal}` : `${sVal}`}
                        </Button>
                      );
                    })}
                  </Space>
                  <Flex align="center" gap={6}>
                    <Text style={{ fontSize: 12, color: '#94a3b8' }}>Tulis Manual:</Text>
                    <InputNumber
                      size="small"
                      min={0}
                      max={4}
                      step={0.1}
                      value={activeRole === 'asesor1' ? rec.scoreAsesor1 : activeRole === 'asesor2' ? rec.scoreAsesor2 : rec.scoreConsensus}
                      onChange={(nv) => handleWriteScore(indicator.id, nv)}
                      style={{ width: 70, textAlign: 'center' }}
                    />
                  </Flex>
                </div>

                {/* Evidence & Notes Row */}
                <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                  <Col xs={24} md={10}>
                    <Card size="small" style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 11, color: '#cbd5e1' }}>
                          <LinkOutlined style={{ marginRight: 6, color: '#38bdf8' }} />
                          Bukti Terkait ({linkedEvidences.length + (indicator.evidenceTags?.length || 0)})
                        </Text>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleOpenAddEvidence(indicator)}
                          style={{ fontSize: 10, height: 22, backgroundColor: '#059669', borderColor: '#059669' }}
                        >
                          Tambah Link
                        </Button>
                      </Flex>

                      <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                        {(indicator.evidenceTags || []).map((tag, tIdx) => (
                          <div key={tIdx} style={{ fontSize: 11, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <LinkOutlined style={{ fontSize: 10 }} />
                            <span>{tag}</span>
                          </div>
                        ))}
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} md={14}>
                    <Card size="small" style={{ backgroundColor: '#0b1120', borderColor: '#1e293b' }}>
                      <Text strong style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
                        Catatan Temuan Lapangan ({activeRole}):
                      </Text>
                      <Input
                        placeholder="Catatan temuan verifikasi lapangan..."
                        value={
                          activeRole === 'asesor1'
                            ? rec.notesAsesor1 || ''
                            : activeRole === 'asesor2'
                            ? rec.notesAsesor2 || ''
                            : rec.consensusNotes || ''
                        }
                        onChange={(e) => {
                          if (activeRole === 'asesor1') onUpdateRecord(indicator.id, { notesAsesor1: e.target.value });
                          else if (activeRole === 'asesor2') onUpdateRecord(indicator.id, { notesAsesor2: e.target.value });
                          else onUpdateRecord(indicator.id, { consensusNotes: e.target.value });
                        }}
                        style={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      )}

      {/* Modal Tambah / Edit Link URL Dokumen Bukti */}
      <Modal
        title={
          <Space>
            {modalMode === 'add' ? (
              <FileAddOutlined style={{ color: '#10b981', fontSize: 18 }} />
            ) : (
              <EditOutlined style={{ color: '#06b6d4', fontSize: 18 }} />
            )}
            <span style={{ color: '#f8fafc' }}>
              {modalMode === 'add' ? 'Tambah Tautan Bukti Dokumen' : 'Edit Tautan Bukti Dokumen'}
            </span>
          </Space>
        }
        open={evidenceModalOpen}
        onCancel={() => setEvidenceModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={560}
      >
        {activeIndicatorForEvidence && (
          <div style={{ marginBottom: 14 }}>
            <Tag color="blue">Indikator No. {activeIndicatorForEvidence.indicatorNumber ?? activeIndicatorForEvidence.code}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activeIndicatorForEvidence.name}
            </Text>
          </div>
        )}

        <Form
          form={evidenceForm}
          layout="vertical"
          onFinish={handleSaveEvidenceModal}
        >
          <Form.Item
            name="name"
            label="Nama Dokumen Bukti"
            rules={[{ required: true, message: 'Harap isi nama dokumen bukti!' }]}
          >
            <Input placeholder="Contoh: SK Tim Mutu SPMI / Bukti Pengukuran CPL / Transkrip Nilai" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Tautan / Link URL Dokumen"
            rules={[
              { required: true, message: 'Harap masukkan tautan URL!' },
              {
                validator: async (_, value) => {
                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    throw new Error('URL harus diawali dengan http:// atau https://');
                  }
                }
              }
            ]}
          >
            <Input 
              prefix={<LinkOutlined style={{ color: '#64748b' }} />} 
              placeholder="https://drive.google.com/... atau https://pddikti..." 
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Tipe Media / Penyimpanan"
            initialValue="Google Drive"
          >
            <Select
              options={[
                { label: 'SIM / Portal (PDDikti, SIAKAD, SPMI)', value: 'SIM / Portal' },
                { label: 'Google Drive', value: 'Google Drive' },
                { label: 'PDF Resmi', value: 'PDF' },
                { label: 'SK Rektor / SK Pimpinan', value: 'SK Rektor' },
                { label: 'External Repository / Jurnal', value: 'External Repository' },
                { label: 'OneDrive / SharePoint', value: 'OneDrive' },
              ]}
            />
          </Form.Item>

          <Flex justify="flex-end" gap="small" style={{ marginTop: 20 }}>
            <Button onClick={() => setEvidenceModalOpen(false)}>
              Batal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 600 }}
            >
              {modalMode === 'add' ? 'Simpan & Tambahkan Link' : 'Simpan Perubahan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </div>
  );
};
