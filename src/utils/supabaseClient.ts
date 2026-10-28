/**
 * Supabase Client Configuration & Direct Database Utilities
 * Mendukung koneksi langsung ke Supabase melalui REST API & Postgres Client
 */

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tableName: string; // default: 'akreditasi_sessions'
  autoSync: boolean;
  lastSyncTime?: string;
  isConnected?: boolean;
}

const STORAGE_KEY = 'si-akreditasi-supabase-config';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  tableName: 'akreditasi_sessions',
  autoSync: false,
  isConnected: false,
};

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SUPABASE_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SUPABASE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_SUPABASE_CONFIG;
  }
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Supabase config to localStorage', e);
  }
};

/**
 * Tes koneksi ke REST API Supabase
 */
export async function testSupabaseConnection(
  supabaseUrl: string,
  anonKey: string,
  tableName: string = 'akreditasi_sessions'
): Promise<{ success: boolean; message: string; details?: any }> {
  const cleanUrl = supabaseUrl.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'Supabase Project URL dan Anon Key tidak boleh kosong.',
    };
  }

  try {
    // 1. Cek kesehatan REST API root endpoint
    const endpoint = `${cleanUrl}/rest/v1/${tableName}?select=*&limit=1`;
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      return {
        success: true,
        message: `Koneksi berhasil! Tabel '${tableName}' ditemukan dan siap digunakan.`,
        details: { countChecked: Array.isArray(data) ? data.length : 0 },
      };
    } else {
      const errText = await resp.text();
      let errorMsg = `HTTP ${resp.status}: ${resp.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errorMsg = parsed.message;
        if (parsed.hint) errorMsg += ` (${parsed.hint})`;
      } catch {
        if (errText) errorMsg = errText;
      }

      // Jika tabel belum ada (relation does not exist code 42P01)
      if (resp.status === 404 || errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
        return {
          success: false,
          message: `Koneksi ke Supabase berhasil terhubung, namun tabel '${tableName}' belum dibuat di PostgreSQL database.`,
          details: { 
            errorMsg, 
            code: 'TABLE_NOT_FOUND',
            explanation: `Penyebab: Server Supabase merespons dengan benar, tetapi tabel '${tableName}' belum ada di skema public database Anda.`,
            solution: `Solusi: Buka Supabase Dashboard > SQL Editor > tempel skrip SQL pembuatan tabel akreditasi_sessions > klik RUN.`
          },
        };
      }

      // Jika URL atau Key salah
      if (resp.status === 401 || resp.status === 403 || errorMsg.toLowerCase().includes('jwt') || errorMsg.toLowerCase().includes('apikey')) {
        return {
          success: false,
          message: `Otentikasi API Key Supabase ditolak (${errorMsg}).`,
          details: {
            errorMsg,
            code: 'AUTH_FAILED',
            explanation: 'Penyebab: API Key (anon/public key) yang dimasukkan salah, kadaluarsa, atau tidak cocok dengan Project URL.',
            solution: 'Solusi: Buka Supabase Dashboard > Project Settings > API > salin ulang "Project URL" dan "anon public key".'
          }
        };
      }

      return {
        success: false,
        message: `Gagal tersambung ke Supabase: ${errorMsg}`,
        details: { 
          errorMsg,
          code: 'HTTP_ERROR',
          explanation: `Penyebab: Server Supabase merespons status ${resp.status} (${resp.statusText}).`,
          solution: 'Periksa keabsahan Project URL Supabase dan konfigurasi jaringan Anda.'
        },
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase (${err.message || 'Network Error'}).`,
      details: {
        errorMsg: err.message,
        code: 'NETWORK_ERROR',
        explanation: 'Penyebab: Browser tidak dapat menjangkau server Supabase (CORS, URL salah format, atau kendala jaringan internet).',
        solution: 'Pastikan format URL diawali https:// (contoh: https://xyz.supabase.co) dan koneksi internet aktif.'
      },
    };
  }
}

/**
 * Menyimpan / Sinkronisasi data sesi akreditasi ke Supabase
 */
export async function syncAssessmentToSupabase(
  config: SupabaseConfig,
  sessionPayload: {
    programStudyId: string;
    programStudyName: string;
    degreeLevel: string;
    lamCode: string;
    data: any;
  }
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
  const cleanKey = config.supabaseAnonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, message: 'Supabase URL dan Anon Key belum dikonfigurasi.' };
  }

  const endpoint = `${cleanUrl}/rest/v1/${config.tableName || 'akreditasi_sessions'}`;
  const now = new Date().toISOString();

  // Payload baris database
  const body = {
    session_id: `${sessionPayload.lamCode}_${sessionPayload.programStudyName.replace(/\s+/g, '_')}_${sessionPayload.degreeLevel}`.toLowerCase(),
    program_study_name: sessionPayload.programStudyName,
    degree_level: sessionPayload.degreeLevel,
    lam_code: sessionPayload.lamCode,
    payload: sessionPayload.data,
    updated_at: now,
  };

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      return { success: true, message: 'Data berhasil disinkronkan ke Supabase Database!' };
    } else {
      const err = await resp.text();
      return { success: false, message: `Gagal sinkronisasi: ${err}` };
    }
  } catch (err: any) {
    return { success: false, message: `Error sinkronisasi: ${err.message}` };
  }
}

/**
 * Memuat sesi penilaian dari Supabase
 */
export async function loadAssessmentsFromSupabase(
  config: SupabaseConfig,
  lamCode?: string
): Promise<{ success: boolean; data?: any[]; message: string }> {
  const cleanUrl = config.supabaseUrl.trim().replace(/\/+$/, '');
  const cleanKey = config.supabaseAnonKey.trim();

  if (!cleanUrl || !cleanKey) {
    return { success: false, message: 'Supabase belum dikonfigurasi.' };
  }

  let endpoint = `${cleanUrl}/rest/v1/${config.tableName || 'akreditasi_sessions'}?select=*&order=updated_at.desc`;
  if (lamCode) {
    endpoint += `&lam_code=eq.${encodeURIComponent(lamCode)}`;
  }

  try {
    const resp = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (resp.ok) {
      const items = await resp.json();
      return { success: true, data: items, message: `Berhasil memuat ${items.length} sesi dari Supabase.` };
    } else {
      const err = await resp.text();
      return { success: false, message: `Gagal memuat: ${err}` };
    }
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Script DDL SQL untuk Supabase SQL Editor
 */
export const SUPABASE_SQL_SCHEMA = `-- 1. Buat tabel akreditasi_sessions untuk menyimpan kertas kerja & instrumen LAM
CREATE TABLE IF NOT EXISTS public.akreditasi_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    program_study_name TEXT NOT NULL,
    degree_level TEXT NOT NULL,
    lam_code TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.akreditasi_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan akses anonim/publik untuk aplikasi asesor
-- (Catatan: Untuk production, sesuaikan dengan aturan auth jika diperlukan)
CREATE POLICY "Izinkan baca semua sesi" 
ON public.akreditasi_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Izinkan insert dan update sesi" 
ON public.akreditasi_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. Indeks untuk query pencarian cepat berdasarkan lam_code dan program studi
CREATE INDEX IF NOT EXISTS idx_akreditasi_lam ON public.akreditasi_sessions (lam_code);
CREATE INDEX IF NOT EXISTS idx_akreditasi_session_id ON public.akreditasi_sessions (session_id);
`;
