-- ============================================================
-- SIKAP DARUR ROHMAN — Supabase SQL Schema
-- Salin dan Jalankan seluruh kode ini di: Supabase Dashboard > SQL Editor
-- File ini sudah disempurnakan dan mencakup SEMUA tabel, RLS, & trigger aplikasi.
-- ============================================================

-- 1. Tabel instansi
CREATE TABLE IF NOT EXISTS public.instansi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_instansi VARCHAR NOT NULL,
  kode_instansi VARCHAR UNIQUE NOT NULL,
  alamat        TEXT,
  aktif         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel profiles (extend auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama         VARCHAR NOT NULL,
  email        VARCHAR,
  role         VARCHAR CHECK (role IN ('super_admin', 'admin_instansi', 'viewer')) DEFAULT 'admin_instansi',
  instansi_id  UUID REFERENCES public.instansi(id) ON DELETE SET NULL,
  akses_menu   JSONB DEFAULT '["/dashboard", "/transaksi", "/buku-kas", "/laporan"]'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel pengaturan (Konfigurasi Aplikasi)
CREATE TABLE IF NOT EXISTS public.pengaturan (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nama_yayasan    VARCHAR DEFAULT 'Pondok Pesantren Darur Rohman',
  alamat_yayasan  TEXT DEFAULT 'Blu''uran, Karang Penang, Sampang',
  ketua_yayasan   VARCHAR DEFAULT 'K. KHOIRUS SHOLEH',
  bendahara_pusat VARCHAR DEFAULT '..............................................',
  tahun_aktif     VARCHAR DEFAULT '1446',
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel transaksi
CREATE TABLE IF NOT EXISTS public.transaksi (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instansi_id      UUID REFERENCES public.instansi(id) ON DELETE CASCADE,
  tanggal          DATE,
  tanggal_hijriyah VARCHAR,
  bulan_hijriyah   VARCHAR,
  tahun_hijriyah   VARCHAR DEFAULT '1446',
  kode_transaksi   VARCHAR,
  nomor_bukti      VARCHAR,
  uraian           TEXT NOT NULL,
  sumber_dana      VARCHAR,
  jenis            VARCHAR CHECK (jenis IN ('pemasukan', 'pengeluaran')) NOT NULL,
  nominal          BIGINT NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Helper Functions (Aman diletakkan di public schema)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_instansi()
RETURNS UUID AS $$
  SELECT instansi_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.instansi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;

-- ---- RLS: instansi ----
-- Super admin bisa semua, user lain hanya baca instansi mereka
CREATE POLICY "instansi_select" ON public.instansi FOR SELECT
  USING (public.get_user_role() = 'super_admin' OR id = public.get_user_instansi());

CREATE POLICY "instansi_all_superadmin" ON public.instansi FOR ALL
  USING (public.get_user_role() = 'super_admin');

-- ---- RLS: profiles ----
CREATE POLICY "profiles_own" ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.get_user_role() = 'super_admin');

CREATE POLICY "profiles_update_superadmin" ON public.profiles FOR ALL
  USING (public.get_user_role() = 'super_admin');

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ---- RLS: pengaturan ----
-- Semua user (yg login) bisa melihat pengaturan, tapi hanya super admin yg bisa mengubah
CREATE POLICY "pengaturan_select" ON public.pengaturan FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "pengaturan_update_superadmin" ON public.pengaturan FOR UPDATE
  USING (public.get_user_role() = 'super_admin');

CREATE POLICY "pengaturan_insert_superadmin" ON public.pengaturan FOR INSERT
  WITH CHECK (public.get_user_role() = 'super_admin');

-- ---- RLS: transaksi ----
-- Super admin: semua; admin_instansi: instansi sendiri; viewer: read only instansi sendiri
CREATE POLICY "transaksi_select" ON public.transaksi FOR SELECT
  USING (
    public.get_user_role() = 'super_admin'
    OR instansi_id = public.get_user_instansi()
  );

CREATE POLICY "transaksi_insert" ON public.transaksi FOR INSERT
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin_instansi')
    AND (public.get_user_role() = 'super_admin' OR instansi_id = public.get_user_instansi())
  );

CREATE POLICY "transaksi_update" ON public.transaksi FOR UPDATE
  USING (
    public.get_user_role() IN ('super_admin', 'admin_instansi')
    AND (public.get_user_role() = 'super_admin' OR instansi_id = public.get_user_instansi())
  );

CREATE POLICY "transaksi_delete" ON public.transaksi FOR DELETE
  USING (
    public.get_user_role() IN ('super_admin', 'admin_instansi')
    AND (public.get_user_role() = 'super_admin' OR instansi_id = public.get_user_instansi())
  );

-- ============================================================
-- Trigger: auto-create profile saat user baru register
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), NEW.email, 'admin_instansi')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed Data Awal Aplikasi
-- ============================================================

-- Seed Data: Pengaturan Awal
INSERT INTO public.pengaturan (id, nama_yayasan, alamat_yayasan, ketua_yayasan, bendahara_pusat, tahun_aktif)
VALUES (1, 'Pondok Pesantren Darur Rohman', 'Blu''uran, Karang Penang, Sampang', 'K. KHOIRUS SHOLEH', '..............................................', '1446')
ON CONFLICT (id) DO NOTHING;

-- Seed Data: 7 Instansi Default Sesuai BKU
INSERT INTO public.instansi (nama_instansi, kode_instansi, alamat, aktif) VALUES
  ('Yayasan / DRC',       'DRC',         'Blu''uran, Karang Penang, Sampang', true),
  ('MI Ibtidaiyah',       'IBTIDAIYAH',  'Blu''uran, Karang Penang, Sampang', true),
  ('Koperasi',            'KOPERASI',    'Blu''uran, Karang Penang, Sampang', true),
  ('Madrasah Ibtidaiyah', 'MI',          'Blu''uran, Karang Penang, Sampang', true),
  ('MTQ',                 'MTQ',         'Blu''uran, Karang Penang, Sampang', true),
  ('MTs',                 'MTS',         'Blu''uran, Karang Penang, Sampang', true),
  ('Ma''hadiyah',         'MAHADIYAH',   'Blu''uran, Karang Penang, Sampang', true)
ON CONFLICT (kode_instansi) DO NOTHING;
