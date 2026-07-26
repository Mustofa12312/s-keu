# PRD FINAL

# SISTEM INFORMASI KEUANGAN PONDOK PESANTREN DARUR ROHMAN

## (SIKAP DARUR ROHMAN)

---

# 1. INFORMASI PROYEK

## Nama Sistem

SIKAP DARUR ROHMAN
(Sistem Informasi Keuangan & Pelaporan)

---

## Jenis Sistem

Aplikasi web laporan keuangan berbasis cloud multi-instansi.

---

## Platform

* Web Application
* Responsive Desktop & Mobile

---

## Target Pengguna

* Bendahara Pondok
* Admin Instansi
* Pimpinan Pondok
* Unit Pendidikan
* Unit Usaha Pondok

---

# 2. LATAR BELAKANG

Pondok Pesantren Darur Rohman memiliki banyak instansi/unit yang melakukan pencatatan dan pelaporan keuangan secara terpisah menggunakan file Excel manual.

Permasalahan saat ini:

* Data laporan tersebar di banyak file
* Format laporan tidak konsisten
* Rekap manual memerlukan waktu lama
* Monitoring seluruh instansi sulit dilakukan
* Pencarian data lama tidak efisien
* Proses print laporan masih manual
* Risiko kehilangan data cukup besar

Karena itu diperlukan sistem digital terpusat yang:

* modern
* ringan
* gratis
* aman
* mudah digunakan
* dapat diakses online
* mendukung banyak instansi
* memiliki sistem login
* memiliki fitur print profesional

---

# 3. ACUAN SISTEM

Pengembangan sistem menggunakan file Excel laporan keuangan yang diberikan client sebagai referensi utama.

File Excel digunakan sebagai acuan:

* struktur Buku Kas Umum (BKU)
* format laporan bulanan
* struktur kolom transaksi
* format saldo berjalan
* alur pemasukan & pengeluaran
* sistem pencatatan keuangan pondok

Acuan berasal dari:

* folder/file Excel laporan keuangan Pondok Pesantren Darur Rohman

Tujuan penggunaan acuan Excel:

* mempermudah adaptasi pengguna
* mempertahankan format laporan yang sudah familiar
* mempermudah migrasi dari sistem manual ke digital

---

# 4. TUJUAN SISTEM

## Tujuan Utama

* Digitalisasi laporan keuangan pondok
* Menyatukan laporan seluruh instansi
* Mempermudah monitoring keuangan
* Mempermudah audit
* Mengurangi penggunaan Excel manual
* Membuat laporan lebih profesional
* Mempermudah proses print laporan resmi

---

# 5. SCOPE SISTEM

---

# Authentication

* Login
* Logout
* Session Authentication
* Protected Route
* Role Based Access

---

# Dashboard

* Statistik pemasukan
* Statistik pengeluaran
* Saldo akhir
* Grafik transaksi
* Aktivitas terbaru

---

# Manajemen Instansi

* Tambah instansi
* Edit instansi
* Nonaktifkan instansi

---

# Manajemen User

* Tambah user
* Reset password
* Role management

---

# Manajemen Transaksi

* Tambah transaksi
* Edit transaksi
* Delete transaksi
* Search transaksi
* Filter transaksi
* Saldo otomatis

---

# Buku Kas Umum

* Tampilan seperti format Excel resmi
* Saldo berjalan otomatis
* Rekap bulanan

---

# Laporan

* Laporan harian
* Laporan bulanan
* Laporan tahunan
* Laporan per instansi
* Rekap seluruh instansi

---

# Print & Export

* Print A4
* Export PDF
* Export Excel

---

# 6. STRUKTUR INSTANSI

Dalam pondok terdapat banyak unit yang melaporkan keuangan masing-masing.

Contoh:

* Madrasah Diniyah
* SMP
* SMA
* Asrama
* Koperasi
* Unit Konsumsi
* Unit Pembangunan
* Unit Usaha
* dll

Setiap instansi:

* memiliki akun sendiri
* memiliki data sendiri
* tidak dapat melihat data instansi lain

---

# 7. ROLE USER

---

# Super Admin Pondok

Hak akses:

* Melihat semua instansi
* Kelola user
* Kelola instansi
* Monitoring seluruh laporan
* Export seluruh laporan
* Full access system

---

# Admin Instansi

Hak akses:

* Input transaksi
* Edit transaksi
* Hapus transaksi
* Print laporan instansi
* Melihat dashboard instansi sendiri

---

# Viewer / Pimpinan

Hak akses:

* Hanya melihat laporan
* Tidak dapat mengedit data

---

# 8. TEKNOLOGI YANG DIGUNAKAN

---

# FRONTEND

## React + Vite

Digunakan untuk:

* membangun antarmuka web
* dashboard
* halaman laporan
* halaman transaksi

Alasan:

* ringan
* cepat
* modern
* cocok untuk admin panel
* lebih mudah dikembangkan

---

## Tailwind CSS

Digunakan untuk:

* styling UI modern
* responsive design
* dashboard minimalis elegan

---

## React Router

Digunakan untuk:

* routing halaman
* protected route
* navigasi dashboard

---

## Axios

Digunakan untuk:

* komunikasi frontend dengan backend/API

---

# BACKEND & DATABASE

## Supabase

Digunakan untuk:

* authentication
* database PostgreSQL
* keamanan data
* multi-instansi

Alasan:

* gratis
* tidak perlu VPS
* scalable
* mudah maintenance
* cocok untuk sistem laporan keuangan

---

# HOSTING

## Frontend Hosting

Deploy menggunakan:

* [Vercel](https://vercel.com?utm_source=chatgpt.com)

---

## Backend & Database

Menggunakan:

* [Supabase](https://supabase.com?utm_source=chatgpt.com)

---

# 9. STRATEGI GRATIS JANGKA PANJANG

Agar sistem tetap aman menggunakan free plan:

* Tidak upload file besar
* Tidak upload bukti transfer
* Fokus data teks transaksi
* Optimasi query database
* Backup rutin bulanan
* Menghindari penyimpanan media berat

Dengan strategi ini sistem masih aman untuk:

* banyak instansi
* ribuan transaksi
* penggunaan harian normal

---

# 10. SISTEM BACKUP

---

# Backup Internal

Supabase memiliki sistem backup internal.

---

# Backup Manual

Admin dapat:

* export Excel
* export CSV
* download laporan bulanan

Backup disimpan pada:

* Google Drive
* Harddisk lokal
* Flashdisk pondok

---

# Jadwal Backup

* Backup bulanan
* Backup akhir tahun

---

# 11. STRUKTUR HALAMAN

---

# PUBLIC PAGE

## Login

Komponen:

* Email
* Password
* Tombol login
* Error validation

---

# DASHBOARD

---

# Dashboard Utama

Komponen:

* Total pemasukan
* Total pengeluaran
* Saldo akhir
* Grafik transaksi
* Aktivitas terbaru

---

# Halaman Transaksi

Fitur:

* Tambah transaksi
* Edit transaksi
* Delete transaksi
* Search transaksi
* Filter bulan
* Filter tahun

Kolom:

* Tanggal masehi
* Tanggal hijriyah
* No kode
* No bukti
* Uraian
* Sumber dana
* Pemasukan
* Pengeluaran
* Saldo

---

# Halaman Buku Kas Umum

Tampilan:

* menyerupai format Excel BKU resmi
* tabel profesional
* saldo otomatis

---

# Halaman Laporan

Fitur:

* Filter periode
* Print laporan
* Export PDF
* Export Excel

Jenis:

* laporan bulanan
* tahunan
* per instansi

---

# Halaman Instansi

Khusus super admin

Fitur:

* tambah instansi
* edit instansi
* nonaktifkan instansi

---

# Halaman User

Fitur:

* tambah user
* role management
* reset password

---

# 12. STRUKTUR DATABASE

---

# TABEL USERS

| Field       | Type      |
| ----------- | --------- |
| id          | uuid      |
| nama        | varchar   |
| email       | varchar   |
| role        | varchar   |
| instansi_id | uuid      |
| created_at  | timestamp |

---

# TABEL INSTANSI

| Field         | Type      |
| ------------- | --------- |
| id            | uuid      |
| nama_instansi | varchar   |
| kode_instansi | varchar   |
| created_at    | timestamp |

---

# TABEL TRANSAKSI

| Field            | Type      |
| ---------------- | --------- |
| id               | uuid      |
| instansi_id      | uuid      |
| tanggal          | date      |
| tanggal_hijriyah | varchar   |
| kode_transaksi   | varchar   |
| nomor_bukti      | varchar   |
| uraian           | text      |
| sumber_dana      | varchar   |
| jenis            | varchar   |
| nominal          | bigint    |
| saldo            | bigint    |
| created_by       | uuid      |
| created_at       | timestamp |

---

# 13. ALUR SISTEM

---

# Login

1. User membuka website
2. Input email & password
3. Sistem validasi login
4. User masuk dashboard sesuai role

---

# Input Transaksi

1. Admin membuka menu transaksi
2. Klik tambah transaksi
3. Isi form transaksi
4. Simpan data
5. Sistem menghitung saldo otomatis

---

# Cetak Laporan

1. Pilih jenis laporan
2. Pilih periode
3. Klik print/export
4. Sistem generate PDF
5. Laporan siap dicetak

---

# 14. SISTEM PRINT PROFESIONAL

---

# Format Print

* A4 Portrait
* Header pondok
* Nama instansi
* Periode laporan
* Tanda tangan bendahara

---

# Optimasi Print

Saat print:

* sidebar disembunyikan
* navbar disembunyikan
* warna disesuaikan
* tabel dirapikan otomatis

---

# Export

* PDF
* Excel

---

# 15. UI / UX DESIGN

---

# Konsep Design

* Minimalis elegan
* Modern dashboard
* Bersih
* Profesional

---

# Warna

* Putih
* Emerald
* Abu soft

---

# Font

* Inter
* Poppins

---

# Komponen

* Card modern
* Rounded smooth
* Shadow halus
* Responsive mobile

---

# 16. KEAMANAN SISTEM

---

# Authentication

* Supabase Auth

---

# Database Security

* Row Level Security (RLS)

---

# Hak Akses

* Role Based Access Control

---

# Proteksi Data

* Data antar instansi terisolasi

---

# Session Security

* Session timeout
* Protected route

---

# 17. DEPLOYMENT SISTEM

---

# Frontend

Deploy menggunakan:

* [Vercel](https://vercel.com?utm_source=chatgpt.com)

---

# Backend & Database

Menggunakan:

* [Supabase](https://supabase.com?utm_source=chatgpt.com)

---

# Keuntungan

Tidak perlu:

* VPS
* server Linux
* hosting mahal
* maintenance server manual

---

# 18. STRUKTUR PROJECT FRONTEND

```bash id="s3txi1"
src/
│
├── assets/
├── components/
├── layouts/
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Transaksi/
│   ├── BukuKas/
│   ├── Laporan/
│   ├── Instansi/
│   └── Users/
│
├── routes/
├── services/
├── hooks/
├── context/
├── utils/
├── lib/
└── App.jsx
```

---

# 19. ROADMAP PENGEMBANGAN

---

# Tahap 1

* Setup project
* Setup Supabase
* Authentication

---

# Tahap 2

* Dashboard
* CRUD transaksi

---

# Tahap 3

* Buku Kas Umum
* Print PDF

---

# Tahap 4

* Multi instansi
* Role management

---

# Tahap 5

* Finishing UI
* Deploy production

---

# 20. KESIMPULAN

SIKAP DARUR ROHMAN adalah sistem laporan keuangan berbasis web yang:

* modern
* ringan
* gratis
* aman
* scalable
* mudah digunakan

Dibangun menggunakan:

* React + Vite
* Tailwind CSS
* Axios
* React Router
* Supabase
* Vercel

Dengan acuan utama format laporan dari file Excel yang diberikan client sehingga pengguna pondok tetap familiar terhadap alur pencatatan dan format laporan yang sudah digunakan sebelumnya.

buatkan sql untuk di gunakan supabase
