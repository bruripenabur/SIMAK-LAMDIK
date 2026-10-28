import { IndicatorItem, KriteriaItemDef } from '../types/accreditation';

export const LAMDIK_9_KRITERIA: KriteriaItemDef[] = [
  { number: 1, code: '1', title: 'Kriteria 1: Visi Keilmuan Program Studi', shortTitle: 'Visi Keilmuan', description: 'Rumusan, sosialisasi, pemahaman, rujukan, serta evaluasi & refleksi visi keilmuan program studi kependidikan.', totalWeight: 10, subKriteria: [] },
  { number: 2, code: '2', title: 'Kriteria 2: Tata Pamong dan Tata Kelola UPPS', shortTitle: 'Tata Pamong', description: 'Keberadaan tata pamong good governance, pelaksanaan tata kelola, kerja sama tridharma, serta evaluasi.', totalWeight: 12, subKriteria: [] },
  { number: 3, code: '3', title: 'Kriteria 3: Mahasiswa', shortTitle: 'Mahasiswa', description: 'Penerimaan mahasiswa baru, kualitas input, rasio dosen-mahasiswa, layanan, perlindungan, prestasi, dan kepuasan.', totalWeight: 12, subKriteria: [] },
  { number: 4, code: '4', title: 'Kriteria 4: Dosen dan Tenaga Kependidikan', shortTitle: 'Dosen & Tendik', description: 'Seleksi, kualifikasi akademik S3, jabatan akademik, beban kerja BKD, pengakuan kepakaran, dan pengembangan kompetensi.', totalWeight: 15, subKriteria: [] },
  { number: 5, code: '5', title: 'Kriteria 5: Keuangan, Sarana, dan Prasarana Pendidikan', shortTitle: 'Keuangan & Sarpras', description: 'Perencanaan dan pengelolaan keuangan, penggunaan anggaran tridharma, sarana prasarana utama, TI, dan K3L.', totalWeight: 10, subKriteria: [] },
  { number: 6, code: '6', title: 'Kriteria 6: Pendidikan', shortTitle: 'Pendidikan', description: 'Kurikulum OBE, pelaksanaan pembelajaran, integrasi penelitian/PkM, penilaian, micro-teaching/PPL/magang, dan luaran kelulusan.', totalWeight: 22, subKriteria: [] },
  { number: 7, code: '7', title: 'Kriteria 7: Penelitian', shortTitle: 'Penelitian', description: 'Peta jalan penelitian, produktivitas DTPS, pelibatan mahasiswa, publikasi ilmiah, sitasi, dan evaluasi.', totalWeight: 10, subKriteria: [] },
  { number: 8, code: '8', title: 'Kriteria 8: Pengabdian kepada Masyarakat (PkM)', shortTitle: 'PkM', description: 'Produktivitas PkM DTPS, pelibatan mahasiswa dalam PkM, dampak pemberdayaan masyarakat, dan evaluasi.', totalWeight: 5, subKriteria: [] },
  { number: 9, code: '9', title: 'Kriteria 9: Penjaminan Mutu', shortTitle: 'Penjaminan Mutu', description: 'Unsur pelaksana penjaminan mutu, perangkat SPMI, pelaksanaan siklus PPEPP berbasis TI, dan evaluasi berkelanjutan.', totalWeight: 4, subKriteria: [] },
];

/**
 * Generator for LAMDIK 3.0 Indicators based on Degree Level ('S1' | 'S2' | 'S3' | 'Profesi')
 */
export function generateLamdikIndicators(degreeLevel: 'S1' | 'S2' | 'S3' | 'Profesi'): IndicatorItem[] {
  const indicators: IndicatorItem[] = [];
  let counter = 1;

  const getDimensi = (kNum: number, idx: number, total: number) => {
    if (idx < Math.ceil(total * 0.3)) return 'Masukan';
    if (idx < Math.ceil(total * 0.7)) return 'Proses';
    return idx < Math.ceil(total * 0.9) ? 'Luaran' : 'Dampak';
  };

  const countsMap: Record<string, number[]> = {
    'S1': [4, 4, 9, 7, 6, 21, 7, 3, 4],     // Total 65
    'S2': [4, 4, 8, 7, 6, 18, 7, 3, 4],     // Total 61
    'S3': [4, 4, 8, 7, 6, 17, 7, 3, 4],     // Total 60
    'Profesi': [4, 4, 7, 8, 6, 18, 6, 2, 4], // Total 59
  };

  const counts = countsMap[degreeLevel] || countsMap['S1'];

  counts.forEach((count, kIndex) => {
    const kNum = kIndex + 1;
    const kInfo = LAMDIK_9_KRITERIA[kIndex];
    const weightPerInd = (kInfo.totalWeight / count);

    for (let i = 0; i < count; i++) {
      const indId = `lamdik-${degreeLevel.toLowerCase()}-k${kNum}-i${i + 1}`;
      const dimensi = getDimensi(kNum, i, count) as any;
      const isSyarat = (kNum === 4 && i === 0) || (kNum === 6 && i === 0) || (kNum === 9 && i === count - 1);

      indicators.push({
        id: indId,
        code: `${kNum}.${i + 1}`,
        indicatorNumber: counter,
        kriteriaNumber: kNum,
        kriteriaCode: `${kNum}`,
        kriteriaTitle: kInfo.shortTitle || '',
        subKriteriaCode: `${kNum}.${i + 1 <= Math.ceil(count/3) ? '1' : i + 1 <= Math.ceil(count*2/3) ? '2' : '3'}`,
        subKriteriaTitle: `${dimensi} (${kInfo.shortTitle})`,
        dimensi,
        sasaranMutu: dimensi,
        name: `Indikator ${kNum}.${i + 1} (${kInfo.shortTitle} - ${dimensi}) ${degreeLevel}`,
        element: `Standar dan parameter pengukuran kinerja ${kInfo.shortTitle} untuk program studi ${degreeLevel} kategori ${dimensi} sesuai instrumen LAMDIK IAPSK 3.0.`,
        category: i % 2 === 0 ? 'Kualitatif' : 'Kuantitatif',
        bobot: Math.round(weightPerInd * 100) / 100,
        sourceDoc: i % 2 === 0 ? 'LED' : 'LKPS',
        isSyaratUnggul: isSyarat,
        rubric: {
          score4: `Program studi ${degreeLevel} melampaui seluruh standar mutu untuk elemen ${kInfo.shortTitle} secara konsisten dengan bukti sahih dan dampak berkelanjutan.`,
          score3: `Program studi ${degreeLevel} memenuhi standar mutu untuk elemen ${kInfo.shortTitle} dengan baik dan terdokumentasikan secara lengkap.`,
          score2: `Program studi ${degreeLevel} memenuhi sebagian standar mutu untuk elemen ${kInfo.shortTitle} dengan beberapa catatan perbaikan.`,
          score1: `Program studi ${degreeLevel} belum memenuhi standar mutu yang diharapkan untuk elemen ${kInfo.shortTitle}.`,
          score0: `Tidak ada implementasi atau bukti sahih sama sekali.`,
        },
        defaultAssessor1Score: 3,
        defaultAssessor2Score: 3,
        defaultSelfScore: 4,
        evidenceTags: [`LKPS Tabel ${kNum}.${i+1}`, `LED Kriteria ${kNum}`, `Dokumen SPMI ${degreeLevel}`],
      });
      counter++;
    }
  });

  return indicators;
}
