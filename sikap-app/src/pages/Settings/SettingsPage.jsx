import { useState, useEffect, useRef } from 'react'
import { Cog6ToothIcon, ArrowDownTrayIcon, DocumentTextIcon, ArrowUpTrayIcon, ShieldExclamationIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { pengaturanService, transaksiService, instansiService, hutangService } from '../../services/firebase.service'
import * as XLSX from 'xlsx'
import { formatRupiah } from '../../utils/formatRupiah'
import { getBulanLabel, BULAN_HIJRIYAH } from '../../utils/hijriyah'

const EXPECTED_HEADERS = ['No', 'Instansi', 'Tanggal (M)', 'Tanggal (H)', 'Bulan (H)', 'Tahun (H)', 'Kode', 'Bukti', 'Jenis', 'Uraian', 'Sumber Dana', 'Nominal (Rp)', 'Dibuat Pada']

export default function SettingsPage() {
  const [form, setForm] = useState({
    nama_yayasan: '', alamat_yayasan: '', ketua_yayasan: '', bendahara_pusat: '', tahun_aktif: '', tutup_buku: []
  })
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [exporting, setExporting]       = useState(false)
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [previewRows, setPreviewRows]   = useState([])
  const [showPreview, setShowPreview]   = useState(false)
  const [toast, setToast]               = useState(null)
  const [instansiList, setInstansiList] = useState([])
  const fileInputRef = useRef()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadSettings() {
    setLoading(true)
    try {
      const [data, instansi] = await Promise.all([
        pengaturanService.getSettings(),
        instansiService.getAll(),
      ])
      setInstansiList(instansi)
      if (data && data.id) {
        setForm({
          nama_yayasan:    data.nama_yayasan   || '',
          alamat_yayasan:  data.alamat_yayasan || '',
          ketua_yayasan:   data.ketua_yayasan  || '',
          bendahara_pusat: data.bendahara_pusat|| '',
          tahun_aktif:     data.tahun_aktif    || '',
          tutup_buku:      data.tutup_buku     || []
        })
      }
    } catch (err) {
      console.error(err)
      showToast('Gagal memuat pengaturan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSettings() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e) {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      await pengaturanService.updateSettings(form)
      showToast('Pengaturan berhasil disimpan!')
    } catch (err) {
      console.error(err)
      showToast('Gagal menyimpan pengaturan.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleBackup() {
    setExporting(true)
    try {
      const [data, dataHutang, dataPembayaran] = await Promise.all([
        transaksiService.getAll({ limit: 100000 }),
        hutangService.getAll({}),
        hutangService.getAllPembayaran()
      ])
      
      if (data.length === 0 && dataHutang.length === 0) { 
        showToast('Tidak ada data untuk di-backup.', 'error'); 
        setExporting(false);
        return 
      }

      const wb = XLSX.utils.book_new()

      // 1. Sheet Transaksi
      if (data.length > 0) {
        const wsData = [
          ['BACKUP MASTER DATA TRANSAKSI S-KEU'],
          ['Tanggal Backup', ':', new Date().toLocaleString()],
          [],
          EXPECTED_HEADERS
        ]
        data.forEach((t, i) => {
          wsData.push([
            i + 1,
            t.instansi?.nama_instansi || '-',
            t.tanggal || '',
            t.tanggal_hijriyah || '',
            getBulanLabel(t.bulan_hijriyah) || t.bulan_hijriyah || '',
            t.tahun_hijriyah || '',
            t.kode_transaksi || '',
            t.nomor_bukti || '',
            t.jenis?.toUpperCase() || '',
            t.uraian || '',
            t.sumber_dana || '',
            t.nominal || 0,
            new Date(t.created_at).toLocaleString()
          ])
        })
        const ws = XLSX.utils.aoa_to_sheet(wsData)
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
      }

      // 2. Sheet Hutang Piutang
      if (dataHutang.length > 0) {
        const wsHutangData = [
          ['BACKUP DATA HUTANG PIUTANG S-KEU'],
          ['Tanggal Backup', ':', new Date().toLocaleString()],
          [],
          ['No', 'Instansi', 'Tanggal (M)', 'Tanggal (H)', 'Bulan (H)', 'Tahun (H)', 'Kode', 'Bukti', 'Jenis', 'Pihak', 'Uraian', 'Status', 'Jatuh Tempo', 'Nominal Total (Rp)', 'Nominal Dibayar (Rp)', 'Sisa (Rp)']
        ]
        dataHutang.forEach((h, i) => {
          const sisa = Math.max(0, (h.nominal_total || 0) - (h.nominal_dibayar || 0))
          wsHutangData.push([
            i + 1,
            h.instansi?.nama_instansi || '-',
            h.tanggal || '',
            h.tanggal_hijriyah || '',
            getBulanLabel(h.bulan_hijriyah) || h.bulan_hijriyah || '',
            h.tahun_hijriyah || '',
            h.kode_transaksi || '',
            h.nomor_bukti || '',
            h.jenis?.toUpperCase() || '',
            h.nama_pihak || '',
            h.uraian || '',
            h.status?.toUpperCase() || '',
            h.tanggal_jatuh_tempo || '',
            h.nominal_total || 0,
            h.nominal_dibayar || 0,
            sisa
          ])
        })
        const wsHutang = XLSX.utils.aoa_to_sheet(wsHutangData)
        XLSX.utils.book_append_sheet(wb, wsHutang, 'Hutang Piutang')
      }

      // 3. Sheet Pembayaran Cicilan
      if (dataPembayaran.length > 0) {
        const wsPembayaranData = [
          ['BACKUP DATA PEMBAYARAN HUTANG PIUTANG'],
          ['Tanggal Backup', ':', new Date().toLocaleString()],
          [],
          ['No', 'ID Hutang', 'Tanggal', 'Nominal (Rp)', 'Catatan']
        ]
        dataPembayaran.forEach((p, i) => {
          wsPembayaranData.push([
            i + 1,
            p.hutang_piutang_id || '',
            p.tanggal || '',
            p.nominal || 0,
            p.catatan || ''
          ])
        })
        const wsPembayaran = XLSX.utils.aoa_to_sheet(wsPembayaranData)
        XLSX.utils.book_append_sheet(wb, wsPembayaran, 'Pembayaran Cicilan')
      }

      // Jika kosong semua tapi somehow sampai sini (harusnya tidak terjadi)
      if (wb.SheetNames.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['Data Kosong']])
        XLSX.utils.book_append_sheet(wb, ws, 'Data')
      }

      XLSX.writeFile(wb, `Backup_Master_S-KEU_${new Date().toISOString().split('T')[0]}.xlsx`)
      showToast(`Berhasil mengekspor data ke Excel!`)
    } catch (err) {
      console.error(err)
      showToast('Gagal melakukan backup data.', 'error')
    } finally {
      setExporting(false)
    }
  }

  // Baca file dan tampilkan preview
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportResult(null)
    setShowPreview(false)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        const headerRowIdx = raw.findIndex(r => r[0] === 'No' && r[1] === 'Instansi')
        if (headerRowIdx === -1) {
          showToast('Format file tidak valid. Gunakan file dari Backup S-KEU.', 'error')
          fileInputRef.current.value = ''
          return
        }

        const dataRows = raw.slice(headerRowIdx + 1).filter(r => r[0] !== '' && r[9] !== '')
        if (dataRows.length === 0) {
          showToast('Tidak ada data yang ditemukan dalam file.', 'error')
          return
        }

        setPreviewRows(dataRows.slice(0, 5))
        setShowPreview(true)
      } catch (err) {
        console.error(err)
        showToast('Gagal membaca file. Pastikan file tidak rusak.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    if (!window.confirm('PERHATIAN!\n\nData dari file backup akan DITAMBAHKAN ke database.\nData lama TIDAK dihapus.\n\nLanjutkan import?')) return

    setImporting(true)
    setImportResult(null)
    setShowPreview(false)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        const headerRowIdx = raw.findIndex(r => r[0] === 'No' && r[1] === 'Instansi')
        const dataRows = raw.slice(headerRowIdx + 1).filter(r => r[0] !== '' && r[9] !== '')

        // Ambil data existing sekali saja untuk cek duplikasi
        const existingTx = await transaksiService.getAll({ limit: 100000 })
        const existingSet = new Set(
          existingTx.map(t => `${t.instansi_id}|${t.uraian}|${t.nominal}|${t.jenis}|${t.tanggal}`)
        )

        let skipped = 0
        const errors = []
        const batchPayloads = []

        // Kumpulkan semua payload yang valid dulu, baru insert sekali (batch)
        for (const row of dataRows) {
          const [, namaInstansi, tanggal, tanggalH, bulanH, tahunH, kode, bukti, jenis, uraian, sumberDana, nominal] = row

          const instansi = instansiList.find(i =>
            i.nama_instansi?.toLowerCase().trim() === namaInstansi?.toString().toLowerCase().trim()
          )

          if (!instansi) {
            errors.push(`"${uraian}": Instansi "${namaInstansi}" tidak ditemukan di sistem.`)
            continue
          }

          const jenisBersih = jenis?.toString().toLowerCase().includes('masuk') ? 'pemasukan' : 'pengeluaran'
          const uraianBersih = uraian?.toString() || '-'
          const tanggalBersih = tanggal?.toString() || null
          const nominalBersih = Number(nominal) || 0

          const payload = {
            instansi_id:      instansi.id,
            tanggal:          tanggalBersih,
            tanggal_hijriyah: tanggalH?.toString() || null,
            bulan_hijriyah:   bulanH?.toString() || null,
            tahun_hijriyah:   tahunH?.toString() || null,
            kode_transaksi:   kode?.toString() || null,
            nomor_bukti:      bukti?.toString() || null,
            jenis:            jenisBersih,
            uraian:           uraianBersih,
            sumber_dana:      sumberDana?.toString() || null,
            nominal:          nominalBersih,
          }

          // Cek duplikasi via Set (O(1)) — jauh lebih cepat dari .some()
          const key = `${payload.instansi_id}|${payload.uraian}|${payload.nominal}|${payload.jenis}|${payload.tanggal}`
          if (existingSet.has(key)) {
            skipped++
            errors.push(`"${payload.uraian}": sudah ada, dilewati.`)
            continue
          }

          batchPayloads.push(payload)
        }

        // Batch insert: 1 request untuk semua data (chunked per 500 baris)
        let success = 0
        let failed = 0
        const CHUNK_SIZE = 500
        for (let i = 0; i < batchPayloads.length; i += CHUNK_SIZE) {
          const chunk = batchPayloads.slice(i, i + CHUNK_SIZE)
          try {
            await transaksiService.createBatch(chunk)
            success += chunk.length
          } catch (error) {
            failed += chunk.length
            errors.push(`Batch insert gagal: ${error.message}`)
          }
        }

        setImportResult({ success, failed, skipped, errors: errors.slice(0, 10) })
        if (success > 0 || skipped > 0) showToast(`Import selesai: ${success} berhasil, ${skipped} dilewati, ${failed} gagal.`)
        else showToast('Import gagal. Periksa daftar error.', 'error')
      } catch (err) {
        console.error(err)
        showToast('Terjadi kesalahan saat memproses import.', 'error')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Memuat pengaturan...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      <div>
        <h2 className="font-bold text-slate-800 font-display text-2xl flex items-center gap-2">
          <Cog6ToothIcon className="w-6 h-6 text-emerald-600" />
          Pengaturan Sistem
        </h2>
        <p className="text-sm text-slate-500 mt-1">Kelola identitas yayasan, tanda tangan laporan, dan backup/import data master.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiri: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="card p-7">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                <DocumentTextIcon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Identitas & Kop Laporan</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Atur informasi yayasan yang akan tampil pada cetakan BKU.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 mb-6">
              <div className="md:col-span-2">
                <label className="label">Nama Induk Yayasan</label>
                <input required className="input" placeholder="Contoh: Pondok Pesantren Darur Rohman"
                  value={form.nama_yayasan} onChange={e => setForm({ ...form, nama_yayasan: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Akan muncul di baris paling atas kop surat BKU.</p>
              </div>
              <div className="md:col-span-2">
                <label className="label">Alamat Lengkap (Kop Surat)</label>
                <input required className="input" placeholder="Contoh: Blu'uran, Karang Penang, Sampang"
                  value={form.alamat_yayasan} onChange={e => setForm({ ...form, alamat_yayasan: e.target.value })} />
              </div>
              <div>
                <label className="label">Nama Ketua Yayasan</label>
                <input required className="input" placeholder="Nama Ketua"
                  value={form.ketua_yayasan} onChange={e => setForm({ ...form, ketua_yayasan: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Penandatangan kiri pada cetak BKU.</p>
              </div>
              <div>
                <label className="label">Nama Bendahara Pusat</label>
                <input required className="input" placeholder="Nama Bendahara"
                  value={form.bendahara_pusat} onChange={e => setForm({ ...form, bendahara_pusat: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">Penandatangan kanan pada cetak BKU.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 pt-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Cog6ToothIcon className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Preferensi Sistem</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Pengaturan standar tahun buku.</p>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <label className="label">Tahun Pembukuan Aktif (Hijriyah)</label>
              <input required type="text" className="input font-mono text-lg" placeholder="1446"
                value={form.tahun_aktif} onChange={e => setForm({ ...form, tahun_aktif: e.target.value })} />
              <p className="text-[10px] text-slate-400 mt-1">Tahun ini otomatis terpilih di menu Laporan & BKU.</p>
            </div>
            <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                <CheckCircleIcon className="w-5 h-5" />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>

          {/* Tutup Buku */}
          <div className="card p-7 mt-6 border-amber-200/50 shadow-amber-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-amber-100/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldExclamationIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Tutup Buku (Lock Data)</h3>
                <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">Amankan data dari perubahan tidak disengaja.</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Kunci bulan pembukuan untuk tahun aktif (<strong>{form.tahun_aktif || '-'}H</strong>). Transaksi pada bulan yang ditutup tidak akan bisa ditambah, diedit, atau dihapus.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BULAN_HIJRIYAH.map(b => {
                const lockKey = `${form.tahun_aktif}-${b}`
                const isLocked = form.tutup_buku.includes(lockKey)
                return (
                  <label key={b} className={`relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 select-none overflow-hidden ${isLocked ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20 scale-[1.02]' : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'}`}>
                    <span className={`text-sm font-bold z-10 ${isLocked ? 'text-white' : 'text-slate-600'}`}>
                      {getBulanLabel(b)}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isLocked}
                      onChange={(e) => {
                        const newTutup = e.target.checked
                          ? [...form.tutup_buku, lockKey]
                          : form.tutup_buku.filter(k => k !== lockKey)
                        setForm({ ...form, tutup_buku: newTutup })
                      }}
                    />
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors z-10 ${isLocked ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {isLocked && <CheckCircleIcon className="w-4 h-4 text-white" />}
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="pt-5 mt-5 flex justify-end border-t border-amber-100/50">
              <button type="button" onClick={() => handleSave()} className="btn bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md hover:shadow-amber-500/30 border border-amber-400/30 hover:-translate-y-0.5" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Kunci Bulan'}
              </button>
            </div>
          </div>
        </div>

        {/* Kanan: Backup & Import */}
        <div className="space-y-6">
          {/* Backup */}
          <div className="card p-7 border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-orange-50/30 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mb-5 border border-amber-200/60 shadow-sm relative z-10">
              <ArrowDownTrayIcon className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2 relative z-10">Backup Master Data</h3>
            <p className="text-[11.5px] text-slate-600 leading-relaxed mb-6 relative z-10">
              Ekspor <strong className="text-amber-700">seluruh data transaksi</strong> ke file Excel. Sangat disarankan untuk dilakukan secara berkala.
            </p>
            <button onClick={handleBackup} disabled={exporting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-70 hover:-translate-y-0.5 relative z-10">
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Memproses...' : 'Download Master Excel'}
            </button>
          </div>

          {/* Import */}
          <div className="card p-7 border-primary-200/60 bg-gradient-to-b from-primary-50/50 to-blue-50/30 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-400/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mb-5 border border-primary-200/60 shadow-sm relative z-10">
              <ArrowUpTrayIcon className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2 relative z-10">Import dari Backup</h3>
            <p className="text-[11.5px] text-slate-600 leading-relaxed mb-6 relative z-10">
              Pulihkan data dari file Excel. Data tidak menimpa, tapi akan <strong className="text-primary-700">ditambahkan</strong>.
            </p>

            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />

            <button
              onClick={() => { setImportResult(null); setShowPreview(false); fileInputRef.current?.click() }}
              disabled={importing}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-500/20 disabled:opacity-70 hover:-translate-y-0.5 relative z-10"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              {importing ? 'Sedang Mengimpor...' : 'Pilih File Backup (.xlsx)'}
            </button>

            {/* Preview */}
            {showPreview && previewRows.length > 0 && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-white overflow-hidden">
                <div className="px-3 py-2 bg-blue-100">
                  <p className="text-xs font-semibold text-blue-800">Preview {previewRows.length} baris pertama</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-1 text-left text-slate-500">Instansi</th>
                        <th className="px-2 py-1 text-left text-slate-500">Uraian</th>
                        <th className="px-2 py-1 text-slate-500">Jenis</th>
                        <th className="px-2 py-1 text-right text-slate-500">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((r, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 text-slate-600 truncate max-w-[80px]">{r[1]}</td>
                          <td className="px-2 py-1 text-slate-700 font-medium truncate max-w-[100px]">{r[9]}</td>
                          <td className={`px-2 py-1 text-center font-semibold ${r[8]?.toString().toLowerCase().includes('masuk') ? 'text-emerald-600' : 'text-red-500'}`}>{r[8]}</td>
                          <td className="px-2 py-1 text-right text-slate-700">{formatRupiah(Number(r[11]))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2 border-t border-blue-100 flex gap-2">
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition flex items-center justify-center gap-1">
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                    {importing ? 'Mengimpor...' : 'Mulai Import'}
                  </button>
                  <button onClick={() => { setShowPreview(false); setPreviewRows([]); fileInputRef.current.value = '' }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md text-xs font-semibold transition">
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Hasil Import */}
            {importResult && (
              <div className="mt-3 rounded-lg border overflow-hidden">
                <div className={`px-3 py-2 flex items-center gap-2 ${importResult.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  {importResult.failed === 0
                    ? <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    : <ShieldExclamationIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  }
                  <p className="text-xs font-semibold text-slate-700">
                    ✓ {importResult.success} berhasil
                    {importResult.failed > 0 && <span className="text-red-600"> &nbsp;✗ {importResult.failed} gagal</span>}
                  </p>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="px-3 py-2 bg-white space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                        <XCircleIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />{err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 p-2 rounded-lg bg-blue-100/70 border border-blue-200">
              <p className="text-[10px] text-blue-700 leading-relaxed">
                💡 <strong>Catatan:</strong> Gunakan hanya file dari menu Backup S-KEU. Nama instansi di file harus sama persis dengan yang ada di sistem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
