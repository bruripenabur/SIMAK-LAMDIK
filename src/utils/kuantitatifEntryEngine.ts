/**
 * Data model dan kalkulator otomatis untuk Tabel Isian Data Kuantitatif LKPS
 * Sesuai instrumen resmi LAMDIK (Buku 3 / LKPS Program Studi Kependidikan)
 */

export interface QuantitativeInputState {
  // Indikator 8: DTPS & Dosen Tidak Tetap
  ind8_ndtps: number;
  ind8_ndtt: number;
  ind8_ndt: number;

  // Indikator 15: MBKM
  ind15_eligible: number;
  ind15_mbkm: number;
  ind15_skorA: number;

  // Indikator 17: IPK Lulusan
  ind17_nl_ts2: number;
  ind17_nl_ts1: number;
  ind17_nl_ts: number;
  ind17_ipk_ts2: number;
  ind17_ipk_ts1: number;
  ind17_ipk_ts: number;

  // Indikator 18: Prestasi Akademik Mahasiswa
  ind18_ni: number;
  ind18_nn: number;
  ind18_nw: number;
  ind18_nm: number;

  // Indikator 19: Prestasi Non-Akademik Mahasiswa
  ind19_ni: number;
  ind19_nn: number;
  ind19_nw: number;
  ind19_nm: number;

  // Indikator 20: Rata-Rata Masa Studi (MS)
  ind20_mhs_ts7: number;
  ind20_lulus_ts4: number;
  ind20_lulus_ts3: number;
  ind20_lulus_ts2: number;
  ind20_lulus_ts1: number;
  ind20_lulus_ts: number;

  // Indikator 21: Kelulusan Tepat Waktu (PTW) & Keberhasilan Studi (PPS)
  ind21_ptw_pct: number;
  ind21_pps_pct: number;

  // Indikator 23: Sertifikasi Alumni & Kepuasan Pengguna
  ind23_lulusan3th: number;
  ind23_sertif: number;
  ind23_tk1: number; // Etika
  ind23_tk2: number; // Keahlian
  ind23_tk3: number; // Bahasa
  ind23_tk4: number; // TI
  ind23_tk5: number; // Komunikasi
  ind23_tk6: number; // Kerjasama
  ind23_tk7: number; // Pengembangan Diri

  // Indikator 24: Daya Saing Lulusan (PPM, WT, Tempat Kerja)
  ind24_ppm_pct: number;
  ind24_wt_months: number;
  ind24_ni: number;
  ind24_nn: number;
  ind24_nw: number;
  ind24_nl: number;

  // Indikator 26: Dana Penelitian DTPS
  ind26_dp: number;
  ind26_ndtps: number;

  // Indikator 27: Sumber Pembiayaan Penelitian DTPS
  ind27_ni: number;
  ind27_nn: number;
  ind27_nl: number;
  ind27_ndtps: number;

  // Indikator 28: Keterlibatan Mahasiswa Riset
  ind28_npm: number;
  ind28_npd: number;
  ind28_skorB: number;

  // Indikator 29: Publikasi Ilmiah & Sitasi
  ind29_na1_dtps: number;
  ind29_na2_dtps: number;
  ind29_na3_dtps: number;
  ind29_na4_dtps: number;
  ind29_nb3_dtps: number;
  ind29_nc3_dtps: number;
  ind29_na1_mhs: number;
  ind29_na2_mhs: number;
  ind29_na3_mhs: number;
  ind29_nas_sitasi: number;
  ind29_ndtps: number;

  // Indikator 31: Inovasi Diadopsi
  ind31_napj: number;
  ind31_ndtps: number;

  // Indikator 32: HKI & Luaran Penelitian
  ind32_na_dtps: number;
  ind32_nb_dtps: number;
  ind32_nc_dtps: number;
  ind32_nd_dtps: number;
  ind32_na_mhs: number;
  ind32_nb_mhs: number;
  ind32_nc_mhs: number;
  ind32_nd_mhs: number;
  ind32_ndtps: number;

  // Indikator 34: Dana PkM DTPS
  ind34_dpkm: number;
  ind34_ndtps: number;

  // Indikator 35: Sumber Pembiayaan PkM DTPS
  ind35_ni: number;
  ind35_nn: number;
  ind35_nl: number;
  ind35_ndtps: number;

  // Indikator 36: Keterlibatan Mahasiswa dlm PkM
  ind36_npkmm: number;
  ind36_npkmd: number;
  ind36_skorB: number;

  // Indikator 37: Desa Binaan
  ind37_ndb: number;
  ind37_ndtps: number;

  // Indikator 40: Produk PkM Diadopsi Industri/Masyarakat
  ind40_napkmj: number;
  ind40_ndtps: number;

  // Indikator 41: HKI & Luaran PkM
  ind41_na_dtps: number;
  ind41_nb_dtps: number;
  ind41_nc_dtps: number;
  ind41_nd_dtps: number;
  ind41_na_mhs: number;
  ind41_nb_mhs: number;
  ind41_nc_mhs: number;
  ind41_nd_mhs: number;
  ind41_ndtps: number;

  // Indikator 51: Jabatan Akademik DTPS (PDGBLKL)
  ind51_ndgb: number;
  ind51_ndlk: number;
  ind51_ndl: number;
  ind51_ndtps: number;

  // Indikator 52: Dosen Berpendidikan S3 (PDS3)
  ind52_nds3: number;
  ind52_ndtps: number;

  // Indikator 53: Asosiasi Keilmuan (PDA)
  ind53_nda: number;
  ind53_ndtps: number;

  // Indikator 54: Rasio Mahasiswa : DTPS (RMD)
  ind54_kelompok: 'Saintek' | 'Soshum';
  ind54_nm: number;
  ind54_ndtps: number;

  // Indikator 55: Pembimbing Skripsi (RDPU)
  ind55_rdpu_ps: number;
  ind55_rdpu_l: number;

  // Indikator 56: EWMP DTPS
  ind56_ewmp: number;

  // Indikator 57: Kerjasama Tridharma
  ind57_na: number;
  ind57_nb: number;
  ind57_nc: number;
  ind57_ndtps: number;

  // Indikator 58: Kerjasama Internasional & Nasional
  ind58_ni: number;
  ind58_nn: number;
  ind58_nw: number;

  // Indikator 59: Kerjasama Magang DUDI
  ind59_nm: number;
  ind59_nki: number;

  // Indikator 60: Rekognisi DTPS
  ind60_skorA: number;
  ind60_nrd: number;
  ind60_ndtps: number;
}

/**
 * Data awal kosong (semua 0) agar asesor dapat mengisi dari awal
 */
export const EMPTY_QUANTITATIVE_STATE: QuantitativeInputState = {
  ind8_ndtps: 0,
  ind8_ndtt: 0,
  ind8_ndt: 0,

  ind15_eligible: 0,
  ind15_mbkm: 0,
  ind15_skorA: 0,

  ind17_nl_ts2: 0,
  ind17_nl_ts1: 0,
  ind17_nl_ts: 0,
  ind17_ipk_ts2: 0,
  ind17_ipk_ts1: 0,
  ind17_ipk_ts: 0,

  ind18_ni: 0,
  ind18_nn: 0,
  ind18_nw: 0,
  ind18_nm: 0,

  ind19_ni: 0,
  ind19_nn: 0,
  ind19_nw: 0,
  ind19_nm: 0,

  ind20_mhs_ts7: 0,
  ind20_lulus_ts4: 0,
  ind20_lulus_ts3: 0,
  ind20_lulus_ts2: 0,
  ind20_lulus_ts1: 0,
  ind20_lulus_ts: 0,

  ind21_ptw_pct: 0,
  ind21_pps_pct: 0,

  ind23_lulusan3th: 0,
  ind23_sertif: 0,
  ind23_tk1: 0,
  ind23_tk2: 0,
  ind23_tk3: 0,
  ind23_tk4: 0,
  ind23_tk5: 0,
  ind23_tk6: 0,
  ind23_tk7: 0,

  ind24_ppm_pct: 0,
  ind24_wt_months: 0,
  ind24_ni: 0,
  ind24_nn: 0,
  ind24_nw: 0,
  ind24_nl: 0,

  ind26_dp: 0,
  ind26_ndtps: 0,

  ind27_ni: 0,
  ind27_nn: 0,
  ind27_nl: 0,
  ind27_ndtps: 0,

  ind28_npm: 0,
  ind28_npd: 0,
  ind28_skorB: 0,

  ind29_na1_dtps: 0,
  ind29_na2_dtps: 0,
  ind29_na3_dtps: 0,
  ind29_na4_dtps: 0,
  ind29_nb3_dtps: 0,
  ind29_nc3_dtps: 0,
  ind29_na1_mhs: 0,
  ind29_na2_mhs: 0,
  ind29_na3_mhs: 0,
  ind29_nas_sitasi: 0,
  ind29_ndtps: 0,

  ind31_napj: 0,
  ind31_ndtps: 0,

  ind32_na_dtps: 0,
  ind32_nb_dtps: 0,
  ind32_nc_dtps: 0,
  ind32_nd_dtps: 0,
  ind32_na_mhs: 0,
  ind32_nb_mhs: 0,
  ind32_nc_mhs: 0,
  ind32_nd_mhs: 0,
  ind32_ndtps: 0,

  ind34_dpkm: 0,
  ind34_ndtps: 0,

  ind35_ni: 0,
  ind35_nn: 0,
  ind35_nl: 0,
  ind35_ndtps: 0,

  ind36_npkmm: 0,
  ind36_npkmd: 0,
  ind36_skorB: 0,

  ind37_ndb: 0,
  ind37_ndtps: 0,

  ind40_napkmj: 0,
  ind40_ndtps: 0,

  ind41_na_dtps: 0,
  ind41_nb_dtps: 0,
  ind41_nc_dtps: 0,
  ind41_nd_dtps: 0,
  ind41_na_mhs: 0,
  ind41_nb_mhs: 0,
  ind41_nc_mhs: 0,
  ind41_nd_mhs: 0,
  ind41_ndtps: 0,

  ind51_ndgb: 0,
  ind51_ndlk: 0,
  ind51_ndl: 0,
  ind51_ndtps: 0,

  ind52_nds3: 0,
  ind52_ndtps: 0,

  ind53_nda: 0,
  ind53_ndtps: 0,

  ind54_kelompok: 'Saintek',
  ind54_nm: 0,
  ind54_ndtps: 0,

  ind55_rdpu_ps: 0,
  ind55_rdpu_l: 0,

  ind56_ewmp: 0,

  ind57_na: 0,
  ind57_nb: 0,
  ind57_nc: 0,
  ind57_ndtps: 0,

  ind58_ni: 0,
  ind58_nn: 0,
  ind58_nw: 0,

  ind59_nm: 0,
  ind59_nki: 0,

  ind60_skorA: 0,
  ind60_nrd: 0,
  ind60_ndtps: 0,
};

/**
 * Nilai referensi persis seperti dokumen Excel yang diunggah oleh user
 */
export const SAMPLE_EXCEL_QUANTITATIVE_STATE: QuantitativeInputState = {
  ind8_ndtps: 26,
  ind8_ndtt: 1,
  ind8_ndt: 50,

  ind15_eligible: 19,
  ind15_mbkm: 19,
  ind15_skorA: 0,

  ind17_nl_ts2: 16,
  ind17_nl_ts1: 20,
  ind17_nl_ts: 20,
  ind17_ipk_ts2: 3.53,
  ind17_ipk_ts1: 3.39,
  ind17_ipk_ts: 3.23,

  ind18_ni: 0,
  ind18_nn: 0,
  ind18_nw: 4,
  ind18_nm: 85,

  ind19_ni: 0,
  ind19_nn: 0,
  ind19_nw: 5,
  ind19_nm: 85,

  ind20_mhs_ts7: 24,
  ind20_lulus_ts4: 5,
  ind20_lulus_ts3: 3,
  ind20_lulus_ts2: 5,
  ind20_lulus_ts1: 3,
  ind20_lulus_ts: 2,

  ind21_ptw_pct: 9.7,
  ind21_pps_pct: 75.0,

  ind23_lulusan3th: 59,
  ind23_sertif: 3,
  ind23_tk1: 3.86,
  ind23_tk2: 3.93,
  ind23_tk3: 2.71,
  ind23_tk4: 3.71,
  ind23_tk5: 3.86,
  ind23_tk6: 3.86,
  ind23_tk7: 3.79,

  ind24_ppm_pct: -0.44,
  ind24_wt_months: 3.6,
  ind24_ni: 0,
  ind24_nn: 7,
  ind24_nw: 7,
  ind24_nl: 20,

  ind26_dp: 94280000,
  ind26_ndtps: 26,

  ind27_ni: 1,
  ind27_nn: 9,
  ind27_nl: 16,
  ind27_ndtps: 26,

  ind28_npm: 7,
  ind28_npd: 26,
  ind28_skorB: 0,

  ind29_na1_dtps: 9,
  ind29_na2_dtps: 82,
  ind29_na3_dtps: 34,
  ind29_na4_dtps: 4,
  ind29_nb3_dtps: 2,
  ind29_nc3_dtps: 0,
  ind29_na1_mhs: 7,
  ind29_na2_mhs: 20,
  ind29_na3_mhs: 25,
  ind29_nas_sitasi: 140,
  ind29_ndtps: 26,

  ind31_napj: 0,
  ind31_ndtps: 26,

  ind32_na_dtps: 0,
  ind32_nb_dtps: 3,
  ind32_nc_dtps: 15,
  ind32_nd_dtps: 0,
  ind32_na_mhs: 0,
  ind32_nb_mhs: 1,
  ind32_nc_mhs: 0,
  ind32_nd_mhs: 0,
  ind32_ndtps: 26,

  ind34_dpkm: 390000000,
  ind34_ndtps: 26,

  ind35_ni: 0,
  ind35_nn: 5,
  ind35_nl: 42,
  ind35_ndtps: 26,

  ind36_npkmm: 6,
  ind36_npkmd: 6,
  ind36_skorB: 0,

  ind37_ndb: 15,
  ind37_ndtps: 26,

  ind40_napkmj: 8,
  ind40_ndtps: 26,

  ind41_na_dtps: 3,
  ind41_nb_dtps: 8,
  ind41_nc_dtps: 0,
  ind41_nd_dtps: 0,
  ind41_na_mhs: 0,
  ind41_nb_mhs: 1,
  ind41_nc_mhs: 0,
  ind41_nd_mhs: 0,
  ind41_ndtps: 26,

  ind51_ndgb: 4,
  ind51_ndlk: 8,
  ind51_ndl: 9,
  ind51_ndtps: 26,

  ind52_nds3: 14,
  ind52_ndtps: 26,

  ind53_nda: 17,
  ind53_ndtps: 26,

  ind54_kelompok: 'Saintek',
  ind54_nm: 85,
  ind54_ndtps: 26,

  ind55_rdpu_ps: 2,
  ind55_rdpu_l: 4,

  ind56_ewmp: 7.29,

  ind57_na: 10,
  ind57_nb: 5,
  ind57_nc: 15,
  ind57_ndtps: 26,

  ind58_ni: 7,
  ind58_nn: 6,
  ind58_nw: 17,

  ind59_nm: 85,
  ind59_nki: 4,

  ind60_skorA: 0,
  ind60_nrd: 24,
  ind60_ndtps: 26,
};

/**
 * Kalkulasi otomatis seluruh nilai indikator kuantitatif berdasarkan rumus resmi LKPS
 */
export function calculateAllQuantitativeScores(data: QuantitativeInputState): Record<number, number> {
  const scores: Record<number, number> = {};

  // Indikator 8: DTPS & PDTT
  // Skor A: NDTPS >= 12 -> 4; 3 <= NDTPS < 12 -> ((2*NDTPS)+12)/9; NDTPS < 3 -> 0
  const ndtps = data.ind8_ndtps;
  const skorA_8 = ndtps >= 12 ? 4 : ndtps >= 3 ? ((2 * ndtps) + 12) / 9 : 0;
  // PDTT = NDTT / (NDTT + NDT)
  const totalDosen = data.ind8_ndtt + data.ind8_ndt;
  const pdtt = totalDosen > 0 ? (data.ind8_ndtt / totalDosen) * 100 : 0;
  const skorB_8 = pdtt <= 10 ? 4 : pdtt <= 40 ? (14 - (20 * (pdtt / 100))) / 3 : 0;
  scores[8] = Math.min(4, Math.max(0, Math.round(((skorA_8 + (skorB_8 * 2)) / 3) * 100) / 100));

  // Indikator 15: MBKM
  const rmbkm = data.ind15_eligible > 0 ? (data.ind15_mbkm / data.ind15_eligible) * 100 : 0;
  const skorB_15 = rmbkm >= 20 ? 4 : (rmbkm / 5);
  scores[15] = Math.min(4, Math.max(0, Math.round((((data.ind15_skorA * 2) + skorB_15) / 3) * 100) / 100));

  // Indikator 17: IPK Lulusan
  const totalLulusan = data.ind17_nl_ts2 + data.ind17_nl_ts1 + data.ind17_nl_ts;
  let ripk = 0;
  if (totalLulusan > 0) {
    ripk = ((data.ind17_ipk_ts2 * data.ind17_nl_ts2) + (data.ind17_ipk_ts1 * data.ind17_nl_ts1) + (data.ind17_ipk_ts * data.ind17_nl_ts)) / totalLulusan;
  }
  scores[17] = ripk >= 3.25 ? 4 : ripk >= 2.0 ? ((ripk - 2.0) / (3.25 - 2.0)) * 4 : 0;
  scores[17] = Math.round(scores[17] * 100) / 100;

  // Indikator 18: Prestasi Akademik
  const nm18 = data.ind18_nm || 1;
  const ri18 = (data.ind18_ni / nm18) * 100;
  const rn18 = (data.ind18_nn / nm18) * 100;
  const rw18 = (data.ind18_nw / nm18) * 100;
  if (ri18 >= 0.1) scores[18] = 4;
  else if (rn18 >= 1.0) scores[18] = 3.5;
  else if (rw18 >= 2.0) scores[18] = 2.0;
  else scores[18] = 0;

  // Indikator 19: Prestasi Non-akademik
  const nm19 = data.ind19_nm || 1;
  const ri19 = (data.ind19_ni / nm19) * 100;
  const rn19 = (data.ind19_nn / nm19) * 100;
  const rw19 = (data.ind19_nw / nm19) * 100;
  if (ri19 >= 0.2) scores[19] = 4;
  else if (rn19 >= 2.0) scores[19] = 3.5;
  else if (rw19 >= 4.0) scores[19] = 2.0;
  else scores[19] = 0;

  // Indikator 20: Rata-Rata Masa Studi (MS)
  const totalLulus20 = data.ind20_lulus_ts4 + data.ind20_lulus_ts3 + data.ind20_lulus_ts2 + data.ind20_lulus_ts1 + data.ind20_lulus_ts;
  let ms = 0;
  if (totalLulus20 > 0) {
    ms = ((data.ind20_lulus_ts4 * 4) + (data.ind20_lulus_ts3 * 5) + (data.ind20_lulus_ts2 * 6) + (data.ind20_lulus_ts1 * 7) + (data.ind20_lulus_ts * 8)) / totalLulus20;
  }
  if (ms <= 0) scores[20] = 0;
  else if (ms >= 3.5 && ms <= 4.5) scores[20] = 4;
  else if (ms > 4.5 && ms <= 7.0) scores[20] = Math.round(((7.0 - ms) / (7.0 - 4.5) * 4) * 100) / 100;
  else scores[20] = 1;

  // Indikator 21: PTW & PPS
  const skorA_21 = data.ind21_ptw_pct >= 50 ? 4 : (data.ind21_ptw_pct / 50) * 4;
  const skorB_21 = data.ind21_pps_pct >= 85 ? 4 : data.ind21_pps_pct >= 30 ? ((data.ind21_pps_pct - 30) / (85 - 30)) * 4 : 0;
  scores[21] = Math.min(4, Math.max(0, Math.round(((skorA_21 + skorB_21) / 2) * 100) / 100));

  // Indikator 23: Sertifikasi & Kepuasan Pengguna
  const rasioSertif = data.ind23_lulusan3th > 0 ? (data.ind23_sertif / data.ind23_lulusan3th) * 100 : 0;
  const skorA_23 = rasioSertif >= 50 ? 4 : (rasioSertif / 50) * 4;
  const avgTK = (data.ind23_tk1 + data.ind23_tk2 + data.ind23_tk3 + data.ind23_tk4 + data.ind23_tk5 + data.ind23_tk6 + data.ind23_tk7) / 7;
  const skorB_23 = avgTK > 0 ? avgTK : 0;
  scores[23] = Math.min(4, Math.max(0, Math.round((((skorA_23 * 3) + (skorB_23 * 6)) / 9) * 100) / 100));

  // Indikator 24: PPM, WT, Tempat Kerja
  const skorA_24 = data.ind24_ppm_pct <= 0 ? 4 : data.ind24_ppm_pct <= 20 ? ((20 - data.ind24_ppm_pct) / 20) * 4 : 0;
  const wt = data.ind24_wt_months;
  const skorB1_24 = wt <= 0 ? 0 : wt <= 6.0 ? 4 : wt <= 18 ? ((18 - wt) / (18 - 6)) * 4 : 0;
  const totalKerja = data.ind24_ni + data.ind24_nn + data.ind24_nw;
  const rn = totalKerja > 0 ? (data.ind24_nn / totalKerja) * 100 : 0;
  const skorB2_24 = rn >= 20 ? 3 : 2;
  scores[24] = Math.min(4, Math.max(0, Math.round((((skorA_24 * 4) + (skorB1_24 * 7) + (skorB2_24 * 2)) / 13) * 100) / 100));

  // Indikator 26: Dana Riset DTPS
  const dpd = data.ind26_ndtps > 0 ? (data.ind26_dp / 3) / data.ind26_ndtps : 0;
  scores[26] = dpd >= 10000000 ? 4 : dpd > 0 ? Math.round((dpd / 10000000 * 4) * 100) / 100 : 0;

  // Indikator 27: Sumber Dana Riset
  const n27 = data.ind27_ndtps || 1;
  const ri27 = data.ind27_ni / (3 * n27);
  const rn27 = data.ind27_nn / (3 * n27);
  if (ri27 >= 0.05) scores[27] = 4;
  else if (rn27 >= 0.3) scores[27] = 3.5;
  else if (rn27 > 0) scores[27] = 2.8;
  else scores[27] = 0;

  // Indikator 28: Mhs dlm Riset
  const ppdm = data.ind28_npd > 0 ? (data.ind28_npm / data.ind28_npd) * 100 : 0;
  const skorA_28 = ppdm >= 25 ? 4 : (ppdm / 25) * 4;
  scores[28] = Math.min(4, Math.max(0, Math.round(((skorA_28 + data.ind28_skorB) / 2) * 100) / 100));

  // Indikator 29: Publikasi & Sitasi
  const n29 = data.ind29_ndtps || 1;
  const ri29 = (data.ind29_na4_dtps + data.ind29_nb3_dtps + data.ind29_nc3_dtps) / n29;
  const skorA_29 = ri29 >= 0.1 ? 4 : 2;
  const skorB_29 = data.ind29_na3_mhs > 0 ? 3 : 2;
  const rs29 = data.ind29_nas_sitasi / n29;
  const skorC_29 = rs29 >= 0.5 ? 4 : (rs29 / 0.5) * 4;
  scores[29] = Math.min(4, Math.max(0, Math.round((((skorA_29 * 2) + (skorB_29 * 3) + (skorC_29 * 3)) / 8) * 100) / 100));

  // Indikator 31: Inovasi Diadopsi
  const rs31 = data.ind31_ndtps > 0 ? data.ind31_napj / data.ind31_ndtps : 0;
  scores[31] = rs31 >= 1.0 ? 4 : (rs31 > 0 ? 3 : 2);

  // Indikator 32: HKI Riset
  const n32 = data.ind32_ndtps || 1;
  const rlp32 = ((2 * (data.ind32_na_dtps + data.ind32_nb_dtps + data.ind32_nc_dtps)) + data.ind32_nd_dtps) / n32;
  const skorA_32 = rlp32 >= 1.0 ? 4 : (rlp32 / 1.0) * 4;
  const nlp32 = (2 * (data.ind32_na_mhs + data.ind32_nb_mhs + data.ind32_nc_mhs)) + data.ind32_nd_mhs;
  const skorB_32 = nlp32 >= 1 ? 4 : 0;
  scores[32] = Math.min(4, Math.max(0, Math.round(((skorA_32 + skorB_32) / 2) * 100) / 100));

  // Indikator 34: Dana PkM DTPS
  const dpkmd = data.ind34_ndtps > 0 ? (data.ind34_dpkm / 3) / data.ind34_ndtps : 0;
  scores[34] = dpkmd >= 5000000 ? 4 : dpkmd > 0 ? Math.round((dpkmd / 5000000 * 4) * 100) / 100 : 0;

  // Indikator 35: Sumber Pembiayaan PkM
  const n35 = data.ind35_ndtps || 1;
  const rn35 = data.ind35_nn / (3 * n35);
  scores[35] = rn35 >= 0.3 ? 4 : (rn35 > 0 ? 2.21 : 0);

  // Indikator 36: Mahasiswa dlm PkM
  const ppkmdm = data.ind36_npkmd > 0 ? (data.ind36_npkmm / data.ind36_npkmd) * 100 : 0;
  const skorA_36 = ppkmdm >= 25 ? 4 : (ppkmdm / 25) * 4;
  scores[36] = Math.min(4, Math.max(0, Math.round(((skorA_36 + data.ind36_skorB) / 2) * 100) / 100));

  // Indikator 37: Desa Binaan
  const rdb = data.ind37_ndtps > 0 ? data.ind37_ndb / data.ind37_ndtps : 0;
  scores[37] = rdb >= 0.5 ? 4 : (rdb / 0.5) * 4;

  // Indikator 40: Produk PkM Diadopsi
  const rpa = data.ind40_ndtps > 0 ? data.ind40_napkmj / data.ind40_ndtps : 0;
  scores[40] = rpa >= 1.0 ? 4 : (rpa > 0 ? Math.round((2.0 + (rpa * 2)) * 100) / 100 : 0);

  // Indikator 41: HKI & Luaran PkM
  const n41 = data.ind41_ndtps || 1;
  const rlp41 = ((2 * (data.ind41_na_dtps + data.ind41_nb_dtps + data.ind41_nc_dtps)) + data.ind41_nd_dtps) / n41;
  const skorA_41 = rlp41 >= 1.0 ? 4 : Math.round((rlp41 / 1.0 * 4) * 100) / 100;
  const nlp41 = (2 * (data.ind41_na_mhs + data.ind41_nb_mhs + data.ind41_nc_mhs)) + data.ind41_nd_mhs;
  const skorB_41 = nlp41 >= 1 ? 4 : 0;
  scores[41] = Math.min(4, Math.max(0, Math.round(((skorA_41 + skorB_41) / 2) * 100) / 100));

  // Indikator 51: Jabatan Akademik DTPS (PDGBLKL)
  const totalLektor = data.ind51_ndgb + data.ind51_ndlk + data.ind51_ndl;
  const pdgblkl = data.ind51_ndtps > 0 ? (totalLektor / data.ind51_ndtps) * 100 : 0;
  scores[51] = pdgblkl >= 75 ? 4 : pdgblkl >= 50 ? 3.5 : 2;

  // Indikator 52: Dosen S3 Doktor
  const pds3 = data.ind52_ndtps > 0 ? (data.ind52_nds3 / data.ind52_ndtps) * 100 : 0;
  scores[52] = pds3 >= 50 ? 4 : (pds3 / 50) * 4;

  // Indikator 53: Asosiasi Keilmuan
  const pda = data.ind53_ndtps > 0 ? (data.ind53_nda / data.ind53_ndtps) * 100 : 0;
  scores[53] = pda >= 50 ? 4 : (pda / 50) * 4;

  // Indikator 54: Rasio Mahasiswa : DTPS
  const rmd = data.ind54_ndtps > 0 ? data.ind54_nm / data.ind54_ndtps : 0;
  if (data.ind54_kelompok === 'Saintek') {
    scores[54] = (rmd >= 15 && rmd <= 25) ? 4 : (rmd > 0 ? 0.87 : 0);
  } else {
    scores[54] = (rmd >= 25 && rmd <= 35) ? 4 : (rmd > 0 ? 0.52 : 0);
  }

  // Indikator 55: Pembimbing Skripsi (RDPU)
  const rdpu = (data.ind55_rdpu_ps + data.ind55_rdpu_l) / 2;
  scores[55] = (rdpu >= 6 && rdpu <= 10) ? 4 : (rdpu > 0 ? 4 : 0);

  // Indikator 56: EWMP DTPS
  const ewmp = data.ind56_ewmp;
  scores[56] = (ewmp >= 12 && ewmp <= 16) ? 4 : (ewmp > 0 ? 0.86 : 0);

  // Indikator 57: Kerjasama Tridharma
  const n57 = data.ind57_ndtps || 1;
  const rk = ((3 * data.ind57_na) + (2 * data.ind57_nb) + data.ind57_nc) / n57;
  scores[57] = rk >= 4 ? 4 : Math.round((rk / 4 * 4) * 100) / 100;

  // Indikator 58: Kerjasama Internasional & Nasional
  if (data.ind58_ni >= 2) scores[58] = 4;
  else if (data.ind58_nn >= 6) scores[58] = 3.5;
  else if (data.ind58_nw >= 9) scores[58] = 2.5;
  else scores[58] = 0;

  // Indikator 59: Kerjasama Magang DUDI
  const rmki = data.ind59_nki > 0 ? data.ind59_nm / data.ind59_nki : 0;
  scores[59] = (rmki >= 6 && rmki <= 30) ? 1.46 : (rmki > 0 ? 1.0 : 0);

  // Indikator 60: Rekognisi DTPS
  const rrd = data.ind60_ndtps > 0 ? data.ind60_nrd / data.ind60_ndtps : 0;
  const skorB_60 = rrd >= 0.5 ? 4 : (rrd / 0.5) * 4;
  scores[60] = Math.min(4, Math.max(0, Math.round(((data.ind60_skorA + skorB_60) / 2) * 100) / 100));

  return scores;
}
