/**
 * Registry Program Studi Kependidikan LAMDIK & Universitas Pattimura
 * Sesuai instrumen APS LAMDIK 3.0.
 */

export interface ProdiRegistryItem {
  kodeProdi: string;
  namaProgramStudi: string;
  fakultas: string;
  jenjang: string;
  namaKaprodi: string;
  isLamPtipScope: boolean;
}

export const LAMPTIP_PRODI_REGISTRY: ProdiRegistryItem[] = [
  { kodeProdi: '86206', namaProgramStudi: 'S1 Pendidikan Guru Sekolah Dasar (PGSD)', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. John Leleury, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '86207', namaProgramStudi: 'S1 Pendidikan Guru PAUD (PGPAUD)', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. Maria Tetelepta, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '84002', namaProgramStudi: 'S1 Pendidikan Matematika', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. La Eddy, M.Si.', isLamPtipScope: true },
  { kodeProdi: '88203', namaProgramStudi: 'S1 Pendidikan Bahasa Inggris', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. Grace Loupatty, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '86131', namaProgramStudi: 'S2 Manajemen Pendidikan', fakultas: 'Pascasarjana', jenjang: 'S2', namaKaprodi: 'Prof. Dr. N. Saptenno, M.Hum.', isLamPtipScope: true },
  { kodeProdi: '86004', namaProgramStudi: 'S3 Administrasi Pendidikan', fakultas: 'Pascasarjana', jenjang: 'S3', namaKaprodi: 'Prof. Dr. J. Riry, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '86904', namaProgramStudi: 'Program Profesi Guru (PPG)', fakultas: 'FKIP', jenjang: 'Profesi', namaKaprodi: 'Dr. A. Dahlan, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '84203', namaProgramStudi: 'S1 Pendidikan Fisika', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. H. Wattimena, M.Si.', isLamPtipScope: true },
  { kodeProdi: '84204', namaProgramStudi: 'S1 Pendidikan Kimia', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. R. Heturu, M.Sc.', isLamPtipScope: true },
  { kodeProdi: '84205', namaProgramStudi: 'S1 Pendidikan Biologi', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. E. Sahusilawane, M.Si.', isLamPtipScope: true },
  { kodeProdi: '87203', namaProgramStudi: 'S1 Pendidikan Ekonomi', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. M. Latuconsina, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '87201', namaProgramStudi: 'S1 Pendidikan Sejarah', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. S. Pelu, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '85201', namaProgramStudi: 'S1 Pendidikan Jasmani, Kesehatan & Rekreasi', fakultas: 'FKIP', jenjang: 'S1', namaKaprodi: 'Dr. Ch. Latumahina, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '84105', namaProgramStudi: 'S2 Pendidikan Biologi', fakultas: 'Pascasarjana', jenjang: 'S2', namaKaprodi: 'Prof. Dr. R. Talakua, M.Si.', isLamPtipScope: true },
  { kodeProdi: '84102', namaProgramStudi: 'S2 Pendidikan Matematika', fakultas: 'Pascasarjana', jenjang: 'S2', namaKaprodi: 'Prof. Dr. Y. Gaspersz, M.Sc.', isLamPtipScope: true },
  { kodeProdi: '86206-ARU', namaProgramStudi: 'S1 Pendidikan Guru Sekolah Dasar (PGSD) PSDKU Kab. Kepulauan Aru', fakultas: 'PSDKU Aru', jenjang: 'S1', namaKaprodi: 'Dr. Hendra Gaspersz, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '84205-ARU', namaProgramStudi: 'S1 Pendidikan Biologi PSDKU Kab. Kepulauan Aru', fakultas: 'PSDKU Aru', jenjang: 'S1', namaKaprodi: 'Dr. Yuliana Pattipeilohy, M.Si.', isLamPtipScope: true },
  { kodeProdi: '86206-MBD', namaProgramStudi: 'S1 Pendidikan Guru Sekolah Dasar (PGSD) PSDKU Kab. Maluku Barat Daya', fakultas: 'PSDKU MBD', jenjang: 'S1', namaKaprodi: 'Dr. Alex Laturiuw, M.Pd.', isLamPtipScope: true },
  { kodeProdi: '84002-MBD', namaProgramStudi: 'S1 Pendidikan Matematika PSDKU Kab. Maluku Barat Daya', fakultas: 'PSDKU MBD', jenjang: 'S1', namaKaprodi: 'Dr. Korneles Talakua, M.Si.', isLamPtipScope: true },
];
