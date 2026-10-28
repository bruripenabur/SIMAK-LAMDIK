import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey && apiKey !== 'MY_GEMINI_API_KEY' ? new GoogleGenAI({ apiKey }) : null;

// Domain Expert Accreditation Advisor Engine (Intelligent Local Knowledge Base)
function generateAccreditationExpertAdvice(
  userQuery: string,
  lamContext: any,
  studyProgramInfo: any
): string {
  const lamCode = lamContext?.lamCode || 'LAM PTIP';
  const univ = studyProgramInfo?.universityName || 'Universitas Pattimura';
  const prodi = studyProgramInfo?.studyProgramName || 'Program Studi';
  const degree = studyProgramInfo?.degreeLevel || 'S1';
  const q = (userQuery || '').toLowerCase();

  // Pattern 1: PPEPP / LED / K.1 / Budaya Mutu / Akreditasi Unggul
  if (q.includes('ppepp') || q.includes('led') || q.includes('k.1') || q.includes('budaya mutu') || q.includes('unggul') || q.includes('narasi')) {
    return `### Panduan Penyusunan Narasi LED Kriteria 1 (Budaya Mutu SPMI) Siklus PPEPP untuk Predikat Unggul\n**Program Studi ${prodi} (${degree}) - ${univ} | Acuan: ${lamCode}**\n\nUntuk meraih predikat **Unggul (Skor 4.00)** pada instrumen ${lamCode}, narasi Laporan Evaluasi Diri (LED) tidak boleh sekadar bersifat deskriptif administratif, melainkan harus mendokumentasikan siklus **PPEPP yang utuh, tertutup (*closed-loop*), dan berbasis bukti faktual (*evidence-based*)**:\n\n---\n\n#### 1. Penetapan (P)\n- **Kaidah Skor 4**: Tersedia dokumen SPMI lengkap (Kebijakan, Manual, Standar, Formulir) yang disahkan pimpinan institusi dan memiliki **Standar Pelampauan SN-Dikti** spesifik rumpun keilmuan ${lamCode}.\n- **Draf Narasi**: *"PS ${prodi} mengimplementasikan SPMI merujuk pada SK Rektor ${univ} tentang Kebijakan SPMI dan Manual SPMI Fakultas. PS menetapkan 24 Standar Nasional ditambah 4 Standar Pelampauan SN-Dikti, meliputi: (a) Standar Publikasi Internasional Bereputasi, (b) Standar Kemitraan DUDI/Industri Kepulauan, (c) Standar Waktu Tunggu Lulusan <= 6 bulan, dan (d) Standar Pembelajaran Berbasis WBL/OBE."*\n\n#### 2. Pelaksanaan (P)\n- **Kaidah Skor 4**: Standar diimplementasikan secara konsisten oleh pengelola program studi dengan dukungan Gugus Jaminan Mutu (GJM) dan didukung SIM-SPMI terintegrasi.\n- **Draf Narasi**: *"Pelaksanaan standar didukung SOP operasional yang terekam secara digital pada sistem penjaminan mutu ${univ} (portal SPMI). Ketercapaian IKU/IKT prodi pada tahun akademik berjalan mencapai rata-rata 92% dari target RKAT."*\n\n#### 3. Evaluasi (E)\n- **Kaidah Skor 4**: Dilaksanakan **Audit Mutu Internal (AMI)** secara periodik (minimal 1 kali per tahun) oleh auditor tersertifikasi independen, disertai survei kepuasan pemangku kepentingan (mahasiswa, dosen, tendik, alumni, pengguna lulusan).\n- **Draf Narasi**: *"LP3MP/LPM ${univ} menyelenggarakan AMI secara berkala pada setiap akhir semester. Hasil AMI tahun berjalan mengidentifikasi tingkat kepatuhan standar 94.2% dengan 2 Ketidaksesuaian Observasi (KOB) dan 0 Ketidaksesuaian Terbuka (KTD)."*\n\n#### 4. Pengendalian (P)\n- **Kaidah Skor 4**: Adanya penyelenggaraan **Rapat Tinjauan Manajemen (RTM)** berjenjang dengan Berita Acara resmi serta Rencana Tindak Lanjut (RTL) yang terealisasi 100% (*closing the loop*).\n- **Draf Narasi**: *"Temuan AMI ditindaklanjuti melalui Rapat Tinjauan Manajemen (RTM) Fakultas dan Prodi dengan bukti Notula dan Berita Acara RTM. Seluruh rekomendasi auditor telah diselesaikan (closed) melalui audit verifikasi tindak lanjut dalam tempo 30 hari."*\n\n#### 5. Peningkatan (P - Kaizen / Continuous Quality Improvement)\n- **Kaidah Skor 4**: Peningkatan standar dilakukan setelah target capaian siklus sebelumnya terpenuhi (bukan sekadar mempertahankan).\n- **Draf Narasi**: *"Setelah target publikasi mahasiswa Sinta 3 tercapai 100%, PS meningkatkan standar mutu baru menjadi publikasi minimal Sinta 2 atau Jurnal Internasional terindeks bereputasi untuk siklus berikutnya."*\n\n---\n\n#### Checklist Bukti Fisik / Eviden Pendukung:\n1. Buku Standar SPMI & SK Penetapan Standar Pelampauan SN-Dikti.\n2. Laporan Hasil Audit Mutu Internal (LHA AMI) 3 tahun terakhir.\n3. Berita Acara, Notula, dan Daftar Hadir RTM.\n4. Laporan Rekapitulasi Verifikasi RTL Temuan AMI.`;
  }

  // Pattern 2: DTPS / Tabel LKPS 2.1A / Dosen / Rasio / Beban Kerja
  if (q.includes('dtps') || q.includes('2.1a') || q.includes('lkps') || q.includes('dosen') || q.includes('rasio') || q.includes('ewmp')) {
    return `### Panduan Verifikasi Temuan AL untuk Penyesuaian DTPS (Tabel LKPS 2.1A)\n**Program Studi ${prodi} (${degree}) - ${univ} | Acuan: ${lamCode}**\n\nDalam pelaksanaan Asesmen Lapangan (AL) ${lamCode}, verifikasi data Dosen Tetap Program Studi (DTPS) pada Tabel LKPS 2.1A merupakan salah satu titik krusial penentu kelolosan Syarat Perlu Unggul:\n\n---\n\n#### 1. Kriteria Validitas DTPS Sesuai Regulasi Terbaru:\n- **Kesesuaian Bidang**: Dosen penugasan memiliki kesesuaian bidang keahlian (kompetensi inti) dengan Program Studi ${prodi}.\n- **Beban Kerja (EWMP)**: Dosen memiliki penugasan Tridharma minimal 12 SKS dan maksimal 16 SKS per semester (rata-rata tahunan), tidak merangkap sebagai DTPS pada prodi lain.\n- **Kualifikasi S3 / Doktor**: Untuk jenjang Sarjana (S1), persentase DTPS berkualifikasi S3 dianjurkan **>= 50%** untuk memenuhi ambang batas predikat Unggul.\n- **Jabatan Akademik**: Rasio Lektor Kepala dan Guru Besar (Profesor) diperhitungkan dalam skor daya saing akademik.\n\n#### 2. Draf Rekomendasi Penyesuaian Temuan Lapangan Pasca-AL:\n- **Temuan Asesor**: *"Terdapat perbedaan pencatatan kualifikasi akademik 2 orang dosen yang baru menyelesaikan studi S3 namun data PDDIKTI belum terbarui saat pengiriman LKPS."*\n- **Uraian Penyesuaian Dokumen**: *"Tim Akreditasi ${prodi} telah menunjukkan Ijazah S3 asli, Surat Keputusan Penyetaraan/Pencantuman Gelar, dan bukti pemutakhiran PDDIKTI. Data pada Tabel LKPS 2.1A disesuaikan dari semula N dosen S3 menjadi N+2 dosen S3."*\n- **Dampak Skor**: Persentase DTPS berpendidikan S3 meningkat, memenuhi indikator Syarat Perlu Unggul instrumen ${lamCode}.\n\n#### 3. Dokumen Eviden yang Wajib Dilampirkan di Berita Acara AL:\n1. SK Rektor ${univ} tentang Penugasan Dosen Tetap Homebase Prodi.\n2. Ijazah & Transkrip S2/S3 beserta SK Pencantuman Gelar Kemenristek/Kemendiktisaintek.\n3. Laporan Kinerja Dosen (BKD/LKD) 2 semester terakhir yang disahkan Asesor BKD.\n4. Rekapitulasi Surat Tugas Pembimbingan Skripsi dan Pengajaran TA berjalan.`;
  }

  // Pattern 3: Syarat Perlu Unggul / Gatekeeper Rules / Thresholds
  if (q.includes('syarat unggul') || q.includes('perlu unggul') || q.includes('gatekeeper') || q.includes('ambang') || q.includes('aturan')) {
    return `### Analisis Kepatuhan Syarat Perlu Unggul (Gatekeeper Rules)\n**Program Studi ${prodi} (${degree}) - ${univ} | Acuan: ${lamCode}**\n\nBerdasarkan regulasi akreditasi ${lamCode} dan standar akreditasi nasional, predikat **UNGGUL** hanya dapat diraih apabila Program Studi memenuhi seluruh indikator *Gatekeeper Rules* (Syarat Perlu Peringkat Unggul) berikut tanpa ada satu pun yang gugur:\n\n---\n\n| No | Indikator Syarat Perlu Unggul | Ambang Batas Minimal (Threshold) | Status Kepatuhan Prodi |\n| :--- | :--- | :--- | :--- |\n| 1 | **Skor Sistem Penjaminan Mutu Internal (SPMI / Siklus PPEPP)** | Skor >= 3.50 (Skala 4.00) | Wajib Terpenuhi (Kriteria 1) |\n| 2 | **Kualifikasi Akademik DTPS (Doktor / S3)** | >= 50% dari total DTPS | Verifikasi Ijazah & PDDIKTI |\n| 3 | **Jabatan Akademik DTPS (Lektor Kepala & Guru Besar)** | >= 40% dari total DTPS | SK Jabatan Fungsional Resmi |\n| 4 | **Waktu Tunggu Lulusan Mendapatkan Pekerjaan Pertama** | <= 7.5 Bulan (Ideal <= 6 Bulan) | Laporan Tracer Study Terverifikasi |\n| 5 | **Kesesuaian Bidang Kerja Lulusan (Horizontal/Vertikal)** | >= 60% tingkat keselarasan tinggi | Bukti Survei Kepuasan Pengguna |\n| 6 | **Publikasi Ilmiah & Sitasi DTPS / Mahasiswa** | Memiliki artikel di Jurnal Nasional Terakreditasi (Sinta) / Internasional | Bukti Link DOI / URL Repository |\n\n---\n\n#### Rekomendasi Strategis Asesor:\n1. **Kunci SPMI**: Pastikan siklus evaluasi internal (AMI) terdokumentasi rapi hingga tahap Peningkatan (Kaizen).\n2. **Kunci Tracer Study**: Tingkatkan persentase responden pelacak jejak alumni (*response rate*) minimal 70% agar data waktu tunggu dinyatakan valid oleh asesor.\n3. **Kunci Konsolidasi**: Gunakan menu *Simulasi Konsolidasi Asesor* di aplikasi ini untuk memantau perolehan total skor (Skor Total >= 361 untuk predikat Unggul).`;
  }

  // Pattern 4: Rekomendasi Pembinaan / Berita Acara / AL
  if (q.includes('rekomendasi') || q.includes('berita acara') || q.includes('temuan') || q.includes('cqi') || q.includes('visitasi')) {
    return `### Draf Rekomendasi Pembinaan Asesmen Lapangan (AL)\n**Program Studi ${prodi} (${degree}) - ${univ} | Acuan: ${lamCode}**\n\nBerdasarkan konfirmasi dokumen dan wawancara visitasi lapangan, berikut draf rumusan rekomendasi pembinaan mutu berprinsip Continuous Quality Improvement (CQI):\n\n1. **Kriteria 1 & 2 (Tata Pamong & Kerjasama)**: Tingkatkan kuantitas kemitraan internasional aktif yang memiliki *Implementation Arrangement* (IA) nyata pada tridharma prodi, khususnya bidang maritim dan pulau-pulau kecil.\n2. **Kriteria 3 (Mahasiswa & Alumni)**: Intensifkan pembinaan prestasi penalaran mahasiswa pada kompetisi bereputasi nasional (PIMNAS/Peksiminas) dan perkuat ekosistem tracer study online terpusat.\n3. **Kriteria 4 & 5 (Sumber Daya Manusia & Keuangan)**: Akselerasi studi lanjut S3 bagi dosen muda serta tingkatkan alokasi dana penelitian mandiri institusi berbasis luaran HKI/Paten.\n4. **Kriteria 6 (Pendidikan & Kurikulum OBE)**: Sempurnakan asesmen ketercapaian CPL (*Course Learning Outcome Assessment*) secara periodik tiap akhir semester pada portal SIAKAD.\n5. **Kriteria 7 & 8 (Penelitian & PkM)**: Dorong integrasi hasil penelitian unggulan dosen ke dalam bahan ajar dan modul praktikum mahasiswa.\n6. **Kriteria 9 (Luaran & Capaian)**: Pertahankan tren kelulusan tepat waktu (KTW) di atas 85% dan persingkat waktu tunggu kerja lulusan.\n\n*Draf ini dapat langsung disalin ke menu Berita Acara Cetak pada aplikasi.*`;
  }

  // Default: General comprehensive accreditation advisory
  return `### Analisis & Rekomendasi Pakar Akreditasi ${lamCode}\n**Program Studi ${prodi} (${degree}) - ${univ}**\n\nMenanggapi pertanyaan Anda terkait: *"${userQuery}"*:\n\n1. **Kesesuaian dengan Instrumen ${lamCode}**:\n   Instrumen akreditasi ${lamCode} menitikberatkan pada keselarasan antara luaran Tridharma Perguruan Tinggi dengan profil keunggulan spesifik Program Studi di ${univ}. Pastikan setiap klaim kinerja di LED didukung dengan tautan bukti faktual pada portal SPMI atau Google Drive resmi prodi.\n\n2. **Penyelarasan Data LKPS & Narasi LED**:\n   Asesor lapangan melakukan uji silang (*cross-examination*) antara data angka pada LKPS dengan narasi siklus PPEPP. Pastikan tidak ada diskrepansi antara data PDDIKTI lokal dengan isian borang.\n\n3. **Kesiapan Dokumen Asesmen Lapangan (AL)**:\n   Siapkan dokumen portofolio pembelajaran (RPS berbasis OBE, rubrik penilaian, sampel karya mahasiswa), dokumen tridharma dosen (kontrak riset, laporan PKM berbasis luaran), dan berita acara penjaminan mutu.\n\n*Silakan ajukan pertanyaan lebih spesifik mengenai kriteria tertentu, simulasi perhitungan skor, atau penyusunan draf Berita Acara AL.*`;
}

// Multi-turn Gemini Chatbot API endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, modelPreference, lamContext, studyProgramInfo } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Format pesan tidak valid.' });
  }

  const lastUserMsg = messages[messages.length - 1]?.content || '';

  // Determine official model name according to task complexity
  let selectedModel = 'gemini-3.8-flash';
  if (modelPreference === 'complex') {
    selectedModel = 'gemini-3.1-pro-preview';
  } else if (modelPreference === 'fast') {
    selectedModel = 'gemini-3.1-flash-lite';
  }

  // If Gemini client is not initialized or API key is absent, use domain expert generator
  if (!ai || !apiKey) {
    const fallbackText = generateAccreditationExpertAdvice(lastUserMsg, lamContext, studyProgramInfo);
    return res.json({
      reply: fallbackText,
      modelUsed: 'ai-expert-advisor',
    });
  }

  try {
    // Role-specific System Instruction for Accreditation Advisory
    const systemInstruction = `Anda adalah "AI Senior Assessor & Accreditation Expert" dari Badan Akreditasi Nasional Perguruan Tinggi (BAN-PT) dan 12 Lembaga Akreditasi Mandiri (LAM-PTIP, LAM-PTKes, LAMEMBA, LAMDIK, LAMSAMA, LAM INFOKOM, LAM TEKNIK, LAM SPAK, LAM GAMA, LAM WISATA, LAM DEPILAR, LAM HUM).
Saat ini Anda bertugas mendampingi tim akreditasi di ${studyProgramInfo?.universityName || 'Universitas Pattimura'}, Program Studi ${studyProgramInfo?.studyProgramName || 'Program Studi'} (${studyProgramInfo?.degreeLevel || 'S1'}), dengan instrumen acuan ${lamContext?.lamCode || 'LAM PTIP'}.

Fokus keahlian Anda:
1. Membantu penyusunan dan perbaikan narasi Laporan Evaluasi Diri (LED / LKD / LPT) sesuai siklus SPMI PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan).
2. Memverifikasi data kuantitatif Laporan Kinerja Program Studi (LKPS / DKPS / LKK) seperti DTPS, rasio dosen-mahasiswa, pendanaan tridharma, luaran HKI, buku, MBKM, dan tracer study.
3. Menganalisis kepatuhan Syarat Perlu Unggul (Gatekeeper Rules) dan memberikan simulasi perbaikan skor.
4. Menyusun draf temuan Asesmen Lapangan (AL), Berita Acara AL, dan Lampiran Rekapitulasi Perubahan Dokumen Pasca-AL.
5. Memberikan rekomendasi pembinaan mutu berprinsip Continuous Quality Improvement (CQI) dan anti-bias assessment.

Jawablah dengan bahasa Indonesia yang formal, terstruktur, berbasis bukti dokumen faktual, dan solutif bagi asesor maupun pengelola program studi.`;

    // Sanitize and normalize messages into alternating user/model turns
    const validMessages = messages.filter((m: any) => {
      const c = m?.content || '';
      return c.trim().length > 0 && 
        !c.includes('Mohon maaf, terjadi kendala') && 
        !c.includes('Terjadi kendala jaringan') &&
        !c.includes('Unexpected token');
    });

    // Build contents: merge consecutive turns of the same role
    const rawTurns: { role: string; text: string }[] = [];
    for (const m of validMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = String(m.content).trim();
      if (rawTurns.length > 0 && rawTurns[rawTurns.length - 1].role === role) {
        rawTurns[rawTurns.length - 1].text += `\n\n${text}`;
      } else {
        rawTurns.push({ role, text });
      }
    }

    // Ensure contents starts with 'user'
    while (rawTurns.length > 0 && rawTurns[0].role !== 'user') {
      rawTurns.shift();
    }

    // If empty after sanitization, add the last user message
    if (rawTurns.length === 0) {
      rawTurns.push({ role: 'user', text: lastUserMsg || 'Halo, mohon panduan akreditasi.' });
    }

    const contents = rawTurns.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    let replyText = '';
    let usedModel = selectedModel;

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });
      replyText = response.text || '';
    } catch (primaryErr: any) {
      console.warn(`Primary model ${selectedModel} failed, trying gemini-3.1-flash-lite:`, primaryErr?.message);
      // Fallback to flash-lite if primary model experienced an issue
      try {
        usedModel = 'gemini-3.1-flash-lite';
        const fallbackResponse = await ai.models.generateContent({
          model: usedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.6,
          },
        });
        replyText = fallbackResponse.text || '';
      } catch (liteErr: any) {
        console.warn('Fallback to flash-lite also failed, using local expert engine:', liteErr?.message);
        replyText = generateAccreditationExpertAdvice(lastUserMsg, lamContext, studyProgramInfo);
        usedModel = 'ai-expert-advisor';
      }
    }

    if (!replyText) {
      replyText = generateAccreditationExpertAdvice(lastUserMsg, lamContext, studyProgramInfo);
      usedModel = 'ai-expert-advisor';
    }

    return res.json({ reply: replyText, modelUsed: usedModel });
  } catch (error: any) {
    console.error('Gemini API General Error:', error);
    // Never fail with 500 error: deliver high-quality expert advice
    const fallbackText = generateAccreditationExpertAdvice(lastUserMsg, lamContext, studyProgramInfo);
    return res.json({
      reply: fallbackText,
      modelUsed: 'ai-expert-advisor',
    });
  }
});

// In production, serve static built files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, dynamically mount Vite middlewares
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server Universal Accreditation Engine running on port ${PORT}`);
});
