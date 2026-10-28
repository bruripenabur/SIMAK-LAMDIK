import * as XLSX from 'xlsx';
import { EvidenceLink } from '../types/accreditation';

// Regular expression to match URL occurrences in texts and sheets
const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+)/gi;

/**
 * Identify the category/domain provider of a URL.
 */
export function classifyUrlDomain(url: string): {
  domain: string;
  driveType: EvidenceLink['driveType'];
} {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
      return { domain: hostname, driveType: 'Google Drive' };
    }
    if (hostname.includes('sharepoint.com') || hostname.includes('onedrive.live.com') || hostname.includes('1drv.ms')) {
      return { domain: hostname, driveType: 'OneDrive' };
    }
    if (hostname.includes('spmi') || hostname.includes('mutu') || hostname.includes('penjaminan')) {
      return { domain: hostname, driveType: 'SPMI Portal' };
    }
    if (hostname.includes('repository') || hostname.includes('eprints') || hostname.includes('ejournal') || hostname.includes('sinta')) {
      return { domain: hostname, driveType: 'Repository PT' };
    }
    return { domain: hostname, driveType: 'External Web' };
  } catch {
    return { domain: 'Tautan Kustom', driveType: 'External Web' };
  }
}

/**
 * Scan arbitrary text string (from PDF, Word, or LED narrative) for hyperlinks and documents.
 */
export function scanTextForEvidenceUrls(text: string, sourceDocName: string = 'Dokumen LED'): EvidenceLink[] {
  const matches = text.match(URL_REGEX) || [];
  const uniqueUrls = Array.from(new Set(matches));

  return uniqueUrls.map((url, idx) => {
    const { domain, driveType } = classifyUrlDomain(url);
    // Guess a plausible title from the surrounding context or URL path
    let title = `Bukti Dukung [${idx + 1}]`;
    const cleanUrl = url.split(/[?#]/)[0];
    const lastSegment = cleanUrl.split('/').filter(Boolean).pop();
    if (lastSegment && lastSegment.length > 3 && !lastSegment.includes('.')) {
      title = decodeURIComponent(lastSegment).replace(/[-_]/g, ' ');
    } else if (url.includes('drive.google.com')) {
      title = `Folder Arsip Bukti AL #${idx + 1} (${driveType})`;
    }

    return {
      id: `ev-text-${Date.now()}-${idx}`,
      title,
      url,
      domain,
      foundInDoc: sourceDocName,
      status: 'accessible',
      driveType,
      notes: `Terekstraksi otomatis dari narasi ${sourceDocName}`,
    };
  });
}

export interface ParsedExcelResult {
  sheetsFound: string[];
  evidenceLinks: EvidenceLink[];
  cellCountScanned: number;
  sampleRows: Record<string, any[]>;
  detectedStudyProgramName?: string;
  detectedFacultyName?: string;
  detectedDegreeLevel?: string;
}

/**
 * Heuristics to detect study program, faculty, and degree level from file name or raw text content
 */
export function detectStudyProgramFromTextOrFile(textOrFilename: string): {
  studyProgramName?: string;
  facultyName?: string;
  degreeLevel?: string;
} | null {
  const lower = textOrFilename.toLowerCase();

  // Known study programs at Universitas Pattimura and partner universities
  if (lower.includes('peternakan')) {
    return {
      studyProgramName: 'Peternakan',
      facultyName: 'Fakultas Pertanian',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('agroteknologi') || lower.includes('agrotek')) {
    return {
      studyProgramName: 'Agroteknologi',
      facultyName: 'Fakultas Pertanian',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('agribisnis')) {
    return {
      studyProgramName: 'Agribisnis',
      facultyName: 'Fakultas Pertanian',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('kehutanan')) {
    return {
      studyProgramName: 'Kehutanan',
      facultyName: 'Fakultas Pertanian',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('dokter') || lower.includes('kedokteran')) {
    return {
      studyProgramName: 'Pendidikan Dokter',
      facultyName: 'Fakultas Kedokteran',
      degreeLevel: 'Profesi',
    };
  }
  if (lower.includes('manajemen')) {
    return {
      studyProgramName: 'Manajemen',
      facultyName: 'Fakultas Ekonomi dan Bisnis',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('biologi')) {
    return {
      studyProgramName: 'Pendidikan Biologi',
      facultyName: 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('ilmu komputer') || lower.includes('informatika')) {
    return {
      studyProgramName: 'Ilmu Komputer',
      facultyName: 'Fakultas MIPA',
      degreeLevel: 'S1',
    };
  }
  if (lower.includes('teknik mesin')) {
    return {
      studyProgramName: 'Teknik Mesin',
      facultyName: 'Fakultas Teknik',
      degreeLevel: 'S1',
    };
  }

  // Regex pattern matching "Program Studi [Nama]" or "Prodi [Nama]"
  const matchProdi = textOrFilename.match(/(?:program\s*studi|nama\s*program\s*studi|prodi)\s*[:=]?\s*([A-Za-z\s]{3,35})/i);
  if (matchProdi && matchProdi[1]) {
    const rawProdi = matchProdi[1].trim();
    if (rawProdi.length > 2 && !rawProdi.toLowerCase().startsWith('adalah') && !rawProdi.toLowerCase().startsWith('harus')) {
      return {
        studyProgramName: rawProdi,
        degreeLevel: lower.includes('s2') ? 'S2' : lower.includes('s3') ? 'S3' : lower.includes('profesi') ? 'Profesi' : 'S1',
      };
    }
  }

  return null;
}

/**
 * Scan an uploaded XLSX spreadsheet file using SheetJS (xlsx)
 * Extracts both embedded hyperlink metadata (cell.l.Target) and textual URLs inside table cells,
 * and detects Study Program metadata from sheet names, file name, and header cells.
 */
export async function parseExcelForEvidenceAndData(file: File): Promise<ParsedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true });

  const evidenceLinks: EvidenceLink[] = [];
  const seenUrls = new Set<string>();
  const sampleRows: Record<string, any[]> = {};
  let cellCount = 0;

  let detectedProgram: string | undefined = undefined;
  let detectedFaculty: string | undefined = undefined;
  let detectedDegree: string | undefined = undefined;

  // First check file name
  const nameDetected = detectStudyProgramFromTextOrFile(file.name);
  if (nameDetected?.studyProgramName) {
    detectedProgram = nameDetected.studyProgramName;
    detectedFaculty = nameDetected.facultyName;
    detectedDegree = nameDetected.degreeLevel;
  }

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Check sheet name for study program
    if (!detectedProgram) {
      const sheetDetected = detectStudyProgramFromTextOrFile(sheetName);
      if (sheetDetected?.studyProgramName) {
        detectedProgram = sheetDetected.studyProgramName;
        detectedFaculty = sheetDetected.facultyName;
        detectedDegree = sheetDetected.degreeLevel;
      }
    }

    // Get raw row data for sample previews
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
    if (jsonData && jsonData.length > 0) {
      sampleRows[sheetName] = jsonData.slice(0, 15);
    }

    // Inspect cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        cellCount++;
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (!cell) continue;

        // Check cell value for study program keywords if not yet detected
        if (cell.v && typeof cell.v === 'string' && !detectedProgram) {
          const val = cell.v.trim();
          if (val.length < 80) {
            const cellDetected = detectStudyProgramFromTextOrFile(val);
            if (cellDetected?.studyProgramName) {
              detectedProgram = cellDetected.studyProgramName;
              detectedFaculty = cellDetected.facultyName;
              detectedDegree = cellDetected.degreeLevel;
            }
          }
        }

        // 1. Check embedded SheetJS hyperlink (.l)
        if (cell.l && cell.l.Target) {
          const targetUrl = cell.l.Target;
          if (!seenUrls.has(targetUrl)) {
            seenUrls.add(targetUrl);
            const { domain, driveType } = classifyUrlDomain(targetUrl);
            evidenceLinks.push({
              id: `ev-xlsx-${Date.now()}-${evidenceLinks.length}`,
              title: cell.v ? String(cell.v) : `Tautan Tabel [${sheetName}!${cellAddress}]`,
              url: targetUrl,
              domain,
              foundInDoc: `Tabel Excel: ${sheetName} (Cell ${cellAddress})`,
              status: 'accessible',
              driveType,
              notes: `Hyperlink aktif tersemat pada sel ${cellAddress}`,
            });
          }
        }

        // 2. Check cell text value for URLs
        if (cell.v && typeof cell.v === 'string') {
          const matched = cell.v.match(URL_REGEX);
          if (matched) {
            for (const url of matched) {
              if (!seenUrls.has(url)) {
                seenUrls.add(url);
                const { domain, driveType } = classifyUrlDomain(url);
                evidenceLinks.push({
                  id: `ev-xlsx-${Date.now()}-${evidenceLinks.length}`,
                  title: `Tautan Teks: ${sheetName} (${cellAddress})`,
                  url,
                  domain,
                  foundInDoc: `Tabel Excel: ${sheetName} (Cell ${cellAddress})`,
                  status: 'accessible',
                  driveType,
                  notes: 'Terekstraksi dari teks sel tabel kuantitatif',
                });
              }
            }
          }
        }
      }
    }
  }

  return {
    sheetsFound: workbook.SheetNames,
    evidenceLinks,
    cellCountScanned: cellCount,
    sampleRows,
    detectedStudyProgramName: detectedProgram,
    detectedFacultyName: detectedFaculty,
    detectedDegreeLevel: detectedDegree,
  };
}

/**
 * Preloaded curated sample evidence links for realistic demonstration.
 */
export const SAMPLE_INITIAL_EVIDENCE_LINKS: Record<string, EvidenceLink[]> = {
  'LAMDIK': [
    {
      id: 'ev-ptip-1',
      title: 'Kebijakan & Manual Mutu SPMI Siklus PPEPP 2024-2028',
      url: 'https://drive.google.com/drive/folders/1aBcD_ptip_spmi_mutu2024?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'LED Kriteria 2 (Tata Pamong)',
      indicatorId: 'ptip-ppepp',
      indicatorCode: 'C.2.2',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'Folder berisi SK Rektor No. 412/SK/2023, SOP Audit Mutu Internal, dan Risalah Rapat Tinjauan Manajemen (RTM).',
    },
    {
      id: 'ev-ptip-2',
      title: 'Sertifikasi ISO/IEC 17025 & Inventaris Kebun Percobaan GAP',
      url: 'https://drive.google.com/file/d/1zYx_Lab_Sarpras_Pertanian_Sertifikat/view',
      domain: 'drive.google.com',
      foundInDoc: 'LKPS Tabel 5.2 (Sarana Laboratorium)',
      indicatorId: 'ptip-sarpras-lab',
      indicatorCode: 'C.5.2',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'Sertifikat akreditasi KAN untuk Laboratorium Uji Tanah & Nutrisi Tanaman.',
    },
    {
      id: 'ev-ptip-3',
      title: 'Ijazah Doktor (S3) & Sertifikat Pendidik DTPS Peternakan',
      url: 'https://spmi.ac.id/repositori/dosen/doktor-peternakan-2024',
      domain: 'spmi.ac.id',
      foundInDoc: 'LKPS Tabel 4.1 (Kualifikasi DTPS)',
      indicatorId: 'ptip-dosen-s3',
      indicatorCode: 'C.4.1',
      status: 'accessible',
      driveType: 'SPMI Portal',
      notes: 'Verifikasi ijazah S3 dalam bidang Nutrisi Ternak, Reproduksi Ternak, dan Biosains Hayati.',
    },
    {
      id: 'ev-ptip-4',
      title: 'Laporan Tracer Study Nasional & Sertifikasi Kompetensi Lulusan Peternakan',
      url: 'https://tracer.univ-agronusantara.ac.id/laporan/alumni-peternakan-2024.pdf',
      domain: 'univ-agronusantara.ac.id',
      foundInDoc: 'LKPS Tabel 8.3 (Tracer Study)',
      indicatorId: 'ptip-waktu-tunggu',
      indicatorCode: 'C.9.1',
      status: 'accessible',
      driveType: 'Repository PT',
      notes: 'Data tracer study periode 2023-2024 menunjukkan rata-rata waktu tunggu 5.2 bulan.',
    },
    {
      id: 'ev-ptip-5',
      title: 'Dokumen Kurikulum OBE, RPS, dan MoU Kemitraan Industri Peternakan',
      url: 'https://drive.google.com/drive/folders/1OBE_Kurikulum_MagangMBKM_Peternakan?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'LED Kriteria 6 (Pendidikan)',
      indicatorId: 'ptip-kurikulum',
      indicatorCode: 'C.6.1',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'RPS 54 SKS mata kuliah keahlian peternakan dengan rubrik asesmen CPL terstandar.',
    },
    {
      id: 'ev-ptip-6',
      title: 'Dokumen Renstra Fakultas Pertanian Universitas Pattimura 2024-2028',
      url: 'https://drive.google.com/file/d/1Renstra_Fakultas_Pertanian_Unpatti_2024_2028/view?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'LED Kriteria 4 (Diferensiasi Misi - Masukan)',
      indicatorId: 'ptip-misi-masukan',
      indicatorCode: '4.1.1',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'Renstra Fakultas Pertanian memuat milestone keunggulan komparatif kepulauan dan keterkaitan Pola Ilmiah Pokok Bina Mulia ke Lautan.',
    },
    {
      id: 'ev-ptip-7',
      title: 'SK Rektor VMTS Unpatti (No. 842/UN13/HK/2023)',
      url: 'https://drive.google.com/file/d/1SK_Rektor_Unpatti_VMTS_Pertanian_Kepulauan/view?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'LED Kriteria 4 (Diferensiasi Misi - Masukan)',
      indicatorId: 'ptip-misi-masukan',
      indicatorCode: '4.1.1',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'SK Rektor Universitas Pattimura tentang Penetapan Visi, Misi, Tujuan, dan Sasaran Program Studi dengan diferensiasi kepulauan.',
    },
    {
      id: 'ev-ptip-8',
      title: 'Naskah Akademik Keunikan Kurikulum Peternakan Tropis Kepulauan',
      url: 'https://drive.google.com/file/d/1Naskah_Akademik_Keunikan_Kurikulum_Peternakan_Unpatti/view?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'LED Kriteria 4 (Diferensiasi Misi - Masukan)',
      indicatorId: 'ptip-misi-masukan',
      indicatorCode: '4.1.1',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'Naskah Akademik Diferensiasi Misi dan Kurikulum Khusus Archipelago Livestock Program Studi Peternakan.',
    },
  ],
  'LAM-INFOKOM': [
    {
      id: 'ev-info-1',
      title: 'Repositori GitHub Capstone Project & Arsitektur AI Microservices',
      url: 'https://github.com/informatika-accredited/capstone-portfolio-2024',
      domain: 'github.com',
      foundInDoc: 'LKD Kriteria 6 (Kurikulum ACM)',
      indicatorId: 'info-kurikulum-acm',
      indicatorCode: 'C.6.1',
      status: 'accessible',
      driveType: 'External Web',
      notes: 'Kode sumber 48 proyek akhir mahasiswa dengan continuous integration dan unit testing.',
    },
    {
      id: 'ev-info-2',
      title: 'Fasilitas Cloud Server AWS & GPU Cluster Deep Learning',
      url: 'https://drive.google.com/drive/folders/1Info_Server_HPC_AWS_Invoice?usp=sharing',
      domain: 'drive.google.com',
      foundInDoc: 'DKPS Tabel 5.2 (Lab Komputasi)',
      indicatorId: 'info-lab-komputasi',
      indicatorCode: 'C.5.2',
      status: 'accessible',
      driveType: 'Google Drive',
      notes: 'Dokumentasi lisensi JetBrains, Oracle Academy, dan akses AWS Educate untuk 400 mahasiswa.',
    },
    {
      id: 'ev-info-3',
      title: 'Data Dosen S3 Ilmu Komputer & Publikasi IEEE/Scopus Q1-Q2',
      url: 'https://sinta.kemdikbud.go.id/authors/profile/informatika-staff',
      domain: 'sinta.kemdikbud.go.id',
      foundInDoc: 'DKPS Tabel 4.1 (DTPS Doktor)',
      indicatorId: 'info-dtps-s3',
      indicatorCode: 'C.4.1',
      status: 'accessible',
      driveType: 'Repository PT',
      notes: 'Profil SINTA 8 DTPS berpendidikan Doktor Komputer dengan h-index rata-rata 11.',
    },
  ],
};
