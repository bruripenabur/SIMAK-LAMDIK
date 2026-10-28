import { KriteriaItemDef, SubKriteriaNode } from '../types/accreditation';

/**
 * Struktur 9 Kriteria Penilaian Akreditasi LAMDIK 3.0 (IAPSK 3.0)
 * Sesuai Peraturan LAMDIK Nomor 5 Tahun 2025.
 */
export const STANDARD_KRITERIA_STRUCTURE: KriteriaItemDef[] = [
  {
    number: 1,
    code: '1',
    title: 'Kriteria 1: Visi Keilmuan Program Studi',
    shortTitle: 'Visi Keilmuan',
    description: 'Rumusan, sosialisasi, pemahaman, rujukan, serta evaluasi & refleksi visi keilmuan program studi kependidikan.',
    totalWeight: 10,
    subKriteria: [
      { code: '1.1', title: 'Ketepatan Rumusan Visi Keilmuan PS', fullTitle: '1.1 Ketepatan Rumusan Visi Keilmuan', level: 2, parentCode: '1' },
      { code: '1.2', title: 'Sosialisasi & Tingkat Pemahaman Visi Keilmuan', fullTitle: '1.2 Sosialisasi dan Tingkat Pemahaman', level: 2, parentCode: '1' },
      { code: '1.3', title: 'Peran Visi Keilmuan dalam Pelaksanaan Tridharma', fullTitle: '1.3 Peran Visi Keilmuan dalam Tridharma', level: 2, parentCode: '1' },
      { code: '1.4', title: 'Evaluasi & Refleksi Kriteria Visi Keilmuan', fullTitle: '1.4 Evaluasi & Refleksi', level: 2, parentCode: '1' },
    ],
  },
  {
    number: 2,
    code: '2',
    title: 'Kriteria 2: Tata Pamong dan Tata Kelola UPPS',
    shortTitle: 'Tata Pamong',
    description: 'Keberadaan tata pamong good governance, pelaksanaan tata kelola, kerja sama tridharma, serta evaluasi.',
    totalWeight: 12,
    subKriteria: [
      { code: '2.1', title: 'Keberadaan Tata Pamong & Good Governance', fullTitle: '2.1 Keberadaan Tata Pamong', level: 2, parentCode: '2' },
      { code: '2.2', title: 'Pelaksanaan Tata Kelola UPPS', fullTitle: '2.2 Pelaksanaan Tata Kelola', level: 2, parentCode: '2' },
      { code: '2.3', title: 'Kerja Sama Tridharma Perguruan Tinggi', fullTitle: '2.3 Kerja Sama Tridharma', level: 2, parentCode: '2' },
      { code: '2.4', title: 'Evaluasi, Refleksi & Tindak Lanjut Tata Pamong', fullTitle: '2.4 Evaluasi & Refleksi Tata Pamong', level: 2, parentCode: '2' },
    ],
  },
  {
    number: 3,
    code: '3',
    title: 'Kriteria 3: Mahasiswa',
    shortTitle: 'Mahasiswa',
    description: 'Penerimaan mahasiswa baru, kualitas input, rasio dosen-mahasiswa, layanan, perlindungan, prestasi, dan kepuasan.',
    totalWeight: 12,
    subKriteria: [
      { code: '3.1', title: 'Penerimaan & Profil Mahasiswa Baru', fullTitle: '3.1 Penerimaan Mahasiswa Baru', level: 2, parentCode: '3' },
      { code: '3.2', title: 'Kualitas Input Mahasiswa & Seleksi', fullTitle: '3.2 Kualitas Input Mahasiswa', level: 2, parentCode: '3' },
      { code: '3.3', title: 'Layanan, Aksesibilitas & Perlindungan Mahasiswa', fullTitle: '3.3 Layanan & Perlindungan Mahasiswa', level: 2, parentCode: '3' },
      { code: '3.4', title: 'Prestasi Akademik & Non-Akademik Mahasiswa', fullTitle: '3.4 Prestasi Mahasiswa', level: 2, parentCode: '3' },
      { code: '3.5', title: 'Produktivitas Karya Inovatif & Publikasi Mahasiswa', fullTitle: '3.5 Karya Inovatif Mahasiswa', level: 2, parentCode: '3' },
      { code: '3.6', title: 'Kepuasan Mahasiswa', fullTitle: '3.6 Kepuasan Mahasiswa', level: 2, parentCode: '3' },
    ],
  },
  {
    number: 4,
    code: '4',
    title: 'Kriteria 4: Dosen dan Tenaga Kependidikan',
    shortTitle: 'Dosen & Tendik',
    description: 'Seleksi, kualifikasi akademik S3, jabatan akademik, beban kerja BKD, pengakuan kepakaran, dan pengembangan kompetensi.',
    totalWeight: 15,
    subKriteria: [
      { code: '4.1', title: 'Pelaksanaan Seleksi Dosen & Tendik', fullTitle: '4.1 Seleksi Dosen & Tendik', level: 2, parentCode: '4' },
      { code: '4.2', title: 'Kualifikasi Akademik & Jabatan Akademik DTPS', fullTitle: '4.2 Kualifikasi & Jabatan DTPS', level: 2, parentCode: '4' },
      { code: '4.3', title: 'Beban Kerja DTPS (BKD)', fullTitle: '4.3 Beban Kerja DTPS', level: 2, parentCode: '4' },
      { code: '4.4', title: 'Pengakuan & Rekognisi Kepakaran DTPS', fullTitle: '4.4 Pengakuan Kepakaran DTPS', level: 2, parentCode: '4' },
      { code: '4.5', title: 'Pengembangan Kompetensi Dosen & Tendik', fullTitle: '4.5 Pengembangan Kompetensi', level: 2, parentCode: '4' },
      { code: '4.6', title: 'Profil Guru Pamong & Sekolah Mitra', fullTitle: '4.6 Guru Pamong', level: 2, parentCode: '4' },
    ],
  },
  {
    number: 5,
    code: '5',
    title: 'Kriteria 5: Keuangan, Sarana, dan Prasarana Pendidikan',
    shortTitle: 'Keuangan & Sarpras',
    description: 'Perencanaan dan pengelolaan keuangan, penggunaan anggaran tridharma, sarana prasarana utama, TI, dan K3L.',
    totalWeight: 10,
    subKriteria: [
      { code: '5.1', title: 'Perencanaan & Pengelolaan Keuangan UPPS/PS', fullTitle: '5.1 Perencanaan & Pengelolaan Keuangan', level: 2, parentCode: '5' },
      { code: '5.2', title: 'Penggunaan Anggaran Operasional Tridharma', fullTitle: '5.2 Penggunaan Anggaran Tridharma', level: 2, parentCode: '5' },
      { code: '5.3', title: 'Ketersediaan & Aksesibilitas Sarana Prasarana Utama', fullTitle: '5.3 Sarana Prasarana Utama', level: 2, parentCode: '5' },
      { code: '5.4', title: 'Infrastruktur TI & Platform Digital', fullTitle: '5.4 Infrastruktur TI', level: 2, parentCode: '5' },
      { code: '5.5', title: 'Standar Keamanan, Keselamatan & Kesehatan Lingkungan (K3L)', fullTitle: '5.5 Standar K3L', level: 2, parentCode: '5' },
    ],
  },
  {
    number: 6,
    code: '6',
    title: 'Kriteria 6: Pendidikan',
    shortTitle: 'Pendidikan',
    description: 'Kurikulum OBE, pelaksanaan pembelajaran, integrasi penelitian/PkM, penilaian, micro-teaching/PPL/magang, dan luaran kelulusan.',
    totalWeight: 22,
    subKriteria: [
      { code: '6.1', title: 'Pengembangan Kurikulum Berbasis Luaran (OBE)', fullTitle: '6.1 Kurikulum OBE', level: 2, parentCode: '6' },
      { code: '6.2', title: 'Pelaksanaan Pembelajaran & Integrasi Penelitian/PkM', fullTitle: '6.2 Pelaksanaan Pembelajaran', level: 2, parentCode: '6' },
      { code: '6.3', title: 'Penilaian Pembelajaran & Asesmen CPL', fullTitle: '6.3 Asesmen CPL', level: 2, parentCode: '6' },
      { code: '6.4', title: 'Perkuliahan Micro-teaching, PPL & Magang Kependidikan', fullTitle: '6.4 Micro-teaching & PPL', level: 2, parentCode: '6' },
      { code: '6.5', title: 'Pembimbingan Tugas Akhir / Disertasi & Suasana Akademik', fullTitle: '6.5 Pembimbingan & Suasana Akademik', level: 2, parentCode: '6' },
      { code: '6.6', title: 'Luaran Lulusan: IPK, Masa Studi, Tepat Waktu & Tracer Study', fullTitle: '6.6 Luaran Lulusan & Tracer Study', level: 2, parentCode: '6' },
    ],
  },
  {
    number: 7,
    code: '7',
    title: 'Kriteria 7: Penelitian',
    shortTitle: 'Penelitian',
    description: 'Peta jalan penelitian, produktivitas DTPS, pelibatan mahasiswa, publikasi ilmiah, sitasi, dan evaluasi.',
    totalWeight: 10,
    subKriteria: [
      { code: '7.1', title: 'Peta Jalan & Integrasi Penelitian', fullTitle: '7.1 Peta Jalan Penelitian', level: 2, parentCode: '7' },
      { code: '7.2', title: 'Produktivitas Penelitian DTPS & Pelibatan Mahasiswa', fullTitle: '7.2 Produktivitas Penelitian DTPS', level: 2, parentCode: '7' },
      { code: '7.3', title: 'Jumlah Publikasi Karya Ilmiah DTPS & Disitasi', fullTitle: '7.3 Publikasi & Sitasi DTPS', level: 2, parentCode: '7' },
      { code: '7.4', title: 'Evaluasi & Refleksi Kriteria Penelitian', fullTitle: '7.4 Evaluasi Kriteria Penelitian', level: 2, parentCode: '7' },
    ],
  },
  {
    number: 8,
    code: '8',
    title: 'Kriteria 8: Pengabdian kepada Masyarakat (PkM)',
    shortTitle: 'PkM',
    description: 'Produktivitas PkM DTPS, pelibatan mahasiswa dalam PkM, dampak pemberdayaan masyarakat, dan evaluasi.',
    totalWeight: 5,
    subKriteria: [
      { code: '8.1', title: 'Produktivitas PkM DTPS & Pendanaan', fullTitle: '8.1 Produktivitas PkM DTPS', level: 2, parentCode: '8' },
      { code: '8.2', title: 'Pelibatan Mahasiswa dalam Kegiatan PkM', fullTitle: '8.2 Pelibatan Mahasiswa dalam PkM', level: 2, parentCode: '8' },
      { code: '8.3', title: 'Evaluasi, Refleksi & Dampak PkM', fullTitle: '8.3 Evaluasi & Dampak PkM', level: 2, parentCode: '8' },
    ],
  },
  {
    number: 9,
    code: '9',
    title: 'Kriteria 9: Penjaminan Mutu',
    shortTitle: 'Penjaminan Mutu',
    description: 'Unsur pelaksana penjaminan mutu, perangkat SPMI, pelaksanaan siklus PPEPP berbasis TI, dan evaluasi berkelanjutan.',
    totalWeight: 4,
    subKriteria: [
      { code: '9.1', title: 'Terbentuknya Unsur Pelaksana Penjaminan Mutu', fullTitle: '9.1 Unsur Pelaksana Penjaminan Mutu', level: 2, parentCode: '9' },
      { code: '9.2', title: 'Ketersediaan Perangkat SPMI & Pemanfaatan TI', fullTitle: '9.2 Perangkat SPMI & TI', level: 2, parentCode: '9' },
      { code: '9.3', title: 'Pelaksanaan Penjaminan Mutu dengan Siklus PPEPP', fullTitle: '9.3 Siklus PPEPP', level: 2, parentCode: '9' },
      { code: '9.4', title: 'Evaluasi & Refleksi Terhadap Kriteria Penjaminan Mutu', fullTitle: '9.4 Evaluasi Penjaminan Mutu', level: 2, parentCode: '9' },
    ],
  },
];

export interface TreeSelectNode {
  title: string;
  value: string;
  key: string;
  disabled?: boolean;
  children?: TreeSelectNode[];
}

export const getCriteriaTreeSelectData = (): TreeSelectNode[] => {
  return [
    {
      title: 'Semua Kriteria (K1 s/d K9)',
      value: 'ALL',
      key: 'ALL',
    },
    ...STANDARD_KRITERIA_STRUCTURE.map((k) => ({
      title: `${k.code}. ${k.shortTitle} (Bobot: ${k.totalWeight}%)`,
      value: k.code || String(k.number),
      key: k.code || String(k.number),
      children: k.subKriteria?.map((sub) => ({
        title: `${sub.code} ${sub.title}`,
        value: sub.code,
        key: sub.code,
      })),
    })),
  ];
};

export interface FlatSelectOption {
  label: string;
  value: string | number;
}

export const getCriteriaFlatOptions = (): FlatSelectOption[] => {
  const options: FlatSelectOption[] = [
    { label: 'Semua Kriteria (K1 s/d K9)', value: 'ALL' },
  ];

  STANDARD_KRITERIA_STRUCTURE.forEach((k) => {
    options.push({
      label: `${k.code}. ${k.shortTitle}`,
      value: k.number,
    });
  });

  return options;
};

export function checkIndicatorMatchesCriteria(ind: any, selectedKriteria: string | number): boolean {
  if (selectedKriteria === 'ALL' || selectedKriteria === undefined) return true;
  const kNum = ind.kriteriaNumber;
  const code = String(selectedKriteria);
  if (code === String(kNum)) return true;
  if (ind.code === code || ind.subKriteriaCode === code) return true;
  return false;
}
