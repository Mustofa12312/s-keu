// ============================================================
// src/pages/Transaksi/TransaksiPage.jsx
// CRUD Transaksi dengan tabel kolom BKU sesuai format Excel asli
// ============================================================
import { useState, useEffect, useMemo, useRef } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, ShieldExclamationIcon, XCircleIcon, PrinterIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import KuitansiLayout from '../../components/pdf/KuitansiLayout'
import { usePrint } from '../../hooks/usePrint'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel, BULAN_HIJRIYAH_LABEL } from '../../utils/hijriyah'
import { transaksiService, instansiService, pengaturanService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import * as XLSX from 'xlsx'

const EMPTY_FORM = {
  tanggal: '',
  tanggal_hijriyah: '',
  bulan_hijriyah: '',
  tahun_hijriyah: '1446',
  kode_transaksi: '',
  nomor_bukti: '',
  uraian: '',
  sumber_dana: '',
  jenis: 'pemasukan',
  nominal: '',
  instansi_id: '',
}

export default function TransaksiPage() {
  const { isSuperAdmin, isViewer, instansiId, user, profile } = useAuth()
  const [rows, setRows] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterBulan, setFilterBulan] = useState(BULAN_HIJRIYAH[0])
  const [filterTahun, setFilterTahun] = useState('1446')
  const [filterInstansi, setFilterInstansi] = useState(instansiId || '')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Backup & Import states
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Print Kuitansi
  const [printTarget, setPrintTarget] = useState(null)
  const [settings, setSettings] = useState(null)
  const [showKuitansiModal, setShowKuitansiModal] = useState(false)
  const kuitansiRef = useRef()
  const handlePrint = usePrint(kuitansiRef, `Kuitansi_${printTarget?.nomor_bukti || 'Transaksi'}`)

  const fileInputRef = useRef()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function formatDate(val) {
    if (!val) return null
    if (val instanceof Date) {
      return val.toISOString().split('T')[0]
    }
    const str = val.toString().trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str
    }
    const parts = str.split(/[-/]/)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
    }
    return str
  }

  function parseBulanHijriyah(val) {
    if (!val) return 'SYAWAL'
    const v = val.toString().toUpperCase().trim()
    
    if (BULAN_HIJRIYAH.includes(v)) return v

    const cleanVal = val.toString().toLowerCase().replace(/['`\s-]/g, '').trim()
    for (const [key, label] of Object.entries(BULAN_HIJRIYAH_LABEL)) {
      const cleanLabel = label.toLowerCase().replace(/['`\s-]/g, '')
      const cleanKey = key.toLowerCase().replace(/['`\s-]/g, '')
      if (cleanVal === cleanLabel || cleanVal === cleanKey) {
        return key
      }
    }

    return v
  }

  const EXPECTED_HEADERS = [
    'No', 'Instansi', 'Tanggal (M)', 'Tanggal (H)', 'Bulan (H)', 'Tahun (H)', 
    'Kode', 'Bukti', 'Jenis', 'Uraian', 'Sumber Dana', 'Nominal (Rp)', 'Dibuat Pada'
  ]

  async function handleExport() {
    if (rows.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor.', 'error')
      return
    }
    setExporting(true)
    try {
      const wsData = [
        ['BACKUP DATA TRANSAKSI SIKAP'],
        ['Tanggal Ekspor', ':', new Date().toLocaleString()],
        [],
        EXPECTED_HEADERS
      ]
      
      rows.forEach((t, i) => {
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
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
      
      const fileName = isSuperAdmin 
        ? `Backup_Transaksi_SIKAP_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Backup_Transaksi_${profile?.instansi?.nama_instansi || 'Unit'}_SIKAP_${new Date().toISOString().split('T')[0]}.xlsx`

      XLSX.writeFile(wb, fileName)
      showToast(`Berhasil mengekspor ${rows.length} transaksi!`)
    } catch (e) {
      showToast('Gagal mengekspor data.', 'error')
    } finally {
      setExporting(false)
    }
  }

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
          showToast('Format file tidak valid. Gunakan file hasil Export Transaksi.', 'error')
          fileInputRef.current.value = ''
          return
        }

        const dataRows = raw.slice(headerRowIdx + 1).filter(r => r[0] !== '' && r[9] !== '')
        if (dataRows.length === 0) {
          showToast('Tidak ada data transaksi yang ditemukan dalam file.', 'error')
          return
        }

        setPreviewRows(dataRows.slice(0, 5))
        setShowPreview(true)
      } catch (err) {
        showToast('Gagal membaca file. Pastikan file tidak rusak.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    const confirmMsg = isSuperAdmin
      ? 'PERHATIAN!\n\nData transaksi dari file backup akan DITAMBAHKAN ke database.\nLanjutkan import?'
      : `PERHATIAN!\n\nData transaksi dari file backup akan DITAMBAHKAN ke database instansi "${profile?.instansi?.nama_instansi || ''}".\nLanjutkan import?`

    if (!window.confirm(confirmMsg)) return

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

        let success = 0, failed = 0, skipped = 0
        const errors = []

        // Ambil data transaksi yang sudah ada untuk mengecek duplikasi
        const existingTx = await transaksiService.getAll({ limit: 100000 })

        for (const row of dataRows) {
          const [, namaInstansi, tanggal, tanggalH, bulanH, tahunH, kode, bukti, jenis, uraian, sumberDana, nominal] = row

          const instansi = instansiList.find(i =>
            i.nama_instansi?.toLowerCase().trim() === namaInstansi?.toString().toLowerCase().trim()
          )

          const uraianBersih = uraian?.toString() || '-'

          if (!instansi) {
            failed++
            errors.push(`"${uraianBersih}": Instansi "${namaInstansi}" tidak ditemukan atau Anda tidak memiliki akses.`)
            continue
          }

          if (!isSuperAdmin && instansi.id !== instansiId) {
            failed++
            errors.push(`"${uraianBersih}": Anda tidak memiliki hak untuk mengimpor transaksi ke instansi "${namaInstansi}".`)
            continue
          }

          const jenisBersih = jenis?.toString().toLowerCase().includes('keluar') || jenis?.toString().toLowerCase().includes('pengeluaran')
            ? 'pengeluaran'
            : 'pemasukan'

          const dbBulanHijriyah = parseBulanHijriyah(bulanH)
          
          const tanggalBersih = tanggal ? formatDate(tanggal) : null
          const nominalBersih = Number(nominal) || 0

          const payload = {
            instansi_id:      instansi.id,
            tanggal:          tanggalBersih,
            tanggal_hijriyah: tanggalH?.toString() || null,
            bulan_hijriyah:   dbBulanHijriyah,
            tahun_hijriyah:   tahunH?.toString() || null,
            kode_transaksi:   kode?.toString() || null,
            nomor_bukti:      bukti?.toString() || null,
            jenis:            jenisBersih,
            uraian:           uraianBersih,
            sumber_dana:      sumberDana?.toString() || null,
            nominal:          nominalBersih,
            created_by:       user?.id
          }

          // Cek duplikasi
          const isDuplicate = existingTx.some(t => 
            t.instansi_id === payload.instansi_id &&
            t.uraian === payload.uraian &&
            t.nominal === payload.nominal &&
            t.jenis === payload.jenis &&
            t.tanggal === payload.tanggal
          )

          if (isDuplicate) {
            skipped++
            errors.push(`"${payload.uraian}": sudah ada, dilewati.`)
            continue
          }

          try {
            const { error } = await supabase.from('transaksi').insert(payload)
            if (error) {
              failed++
              errors.push(`"${uraianBersih}": ${error.message}`)
            } else {
              success++
            }
          } catch {
            failed++
            errors.push(`"${uraianBersih}": Error tidak terduga.`)
          }
        }

        setImportResult({ success, failed, skipped, errors: errors.slice(0, 10) })
        if (success > 0 || skipped > 0) {
          showToast(`Import selesai: ${success} berhasil, ${skipped} dilewati, ${failed} gagal.`)
          load()
        } else {
          showToast('Import gagal. Periksa daftar error.', 'error')
        }
      } catch (err) {
        showToast('Terjadi kesalahan saat memproses import.', 'error')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
    
    pengaturanService.getSettings().then(s => {
      setSettings(s)
      if (s?.tahun_aktif) setFilterTahun(s.tahun_aktif)
    }).catch(console.error)
  }, [])

  async function load() {
    setLoading(true)
    setCurrentPage(1)
    const id = isSuperAdmin ? (filterInstansi || null) : instansiId
    try {
      const data = await transaksiService.getAll({
        instansiId: id,
        bulanHijriyah: filterBulan || null,
        tahunHijriyah: filterTahun || null,
        search: search || null,
      })
      // hitung saldo berjalan
      let saldo = 0
      const withSaldo = data.map(t => {
        if (t.jenis === 'pemasukan') saldo += t.nominal
        else saldo -= t.nominal
        return { ...t, saldo_berjalan: saldo }
      })
      setRows(withSaldo)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterBulan, filterTahun, filterInstansi, instansiId, isSuperAdmin])

  function handleSearch(e) {
    e.preventDefault()
    load()
  }

  function openAdd() {
    setForm({ 
      ...EMPTY_FORM, 
      instansi_id: isSuperAdmin ? (filterInstansi || '') : instansiId,
      tahun_hijriyah: filterTahun
    })
    setEditRow(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setForm({
      tanggal: row.tanggal || '',
      tanggal_hijriyah: row.tanggal_hijriyah || '',
      bulan_hijriyah: row.bulan_hijriyah || '',
      tahun_hijriyah: row.tahun_hijriyah || '1446',
      kode_transaksi: row.kode_transaksi || '',
      nomor_bukti: row.nomor_bukti || '',
      uraian: row.uraian || '',
      sumber_dana: row.sumber_dana || '',
      jenis: row.jenis || 'pemasukan',
      nominal: String(row.nominal || ''),
      instansi_id: row.instansi_id || '',
    })
    setEditRow(row)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.uraian || !form.nominal || !form.bulan_hijriyah) {
      alert('Uraian, nominal, dan bulan hijriyah harus diisi')
      return
    }
    
    const finalInstansiId = isSuperAdmin ? form.instansi_id : instansiId
    if (!finalInstansiId) {
      alert('Instansi tidak ditemukan. Silakan pilih instansi atau muat ulang halaman.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        nominal: parseInt(form.nominal) || 0,
        instansi_id: finalInstansiId,
        created_by: user?.id,
      }
      if (editRow) await transaksiService.update(editRow.id, payload)
      else await transaksiService.create(payload)
      setModalOpen(false)
      load()
    } catch(e) { alert('Gagal menyimpan: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await transaksiService.delete(deleteId)
      setDeleteId(null)
      load()
    } catch(e) { alert('Gagal hapus: ' + e.message) }
  }

  const summary = useMemo(() => {
    const pem = rows.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0)
    const pen = rows.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0)
    return { pem, pen, saldo: pem - pen }
  }, [rows])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, currentPage])
  
  const totalPages = Math.ceil(rows.length / pageSize)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Hidden input file */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Cari uraian transaksi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Cari</button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <select className="input w-auto" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}>
            <option value="">Semua Bulan</option>
            {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
          </select>
          <input
            type="text"
            className="input w-24"
            placeholder="Tahun H"
            value={filterTahun}
            onChange={e => setFilterTahun(e.target.value)}
            title="Filter Tahun Hijriyah"
          />
          {isSuperAdmin && (
            <select className="input w-auto" value={filterInstansi} onChange={e => setFilterInstansi(e.target.value)}>
              <option value="">Semua Instansi</option>
              {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
            </select>
          )}
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition disabled:opacity-60"
            title="Ekspor transaksi saat ini ke Excel"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Export
          </button>
          {/* Import Button */}
          {!isViewer && (
            <button
              onClick={() => { setImportResult(null); setShowPreview(false); fileInputRef.current?.click() }}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition disabled:opacity-60"
              title="Impor transaksi dari Excel"
            >
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
              {importing ? 'Mengimpor...' : 'Import'}
            </button>
          )}
          {!isViewer && (
            <button id="btn-tambah-transaksi" className="btn-primary" onClick={openAdd}>
              <PlusIcon className="w-4 h-4" /> Tambah
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Penerimaan', value: summary.pem, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pengeluaran', value: summary.pen, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Saldo', value: summary.saldo, color: summary.saldo >= 0 ? 'text-blue-600' : 'text-amber-600', bg: summary.saldo >= 0 ? 'bg-blue-50' : 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-3 text-center ${bg}`}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-sm font-bold text-money mt-0.5 ${color}`}>{formatRupiah(value)}</p>
          </div>
        ))}
      </div>

      {/* Preview before Import */}
      {showPreview && previewRows.length > 0 && (
        <div className="card border-blue-200 bg-blue-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <ArrowUpTrayIcon className="w-4 h-4" />
              Preview {previewRows.length} baris pertama transaksi dari file
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl bg-white">
              <thead>
                <tr>
                  <th>Instansi</th>
                  <th>Uraian</th>
                  <th>Jenis</th>
                  <th className="text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r[1]}</td>
                    <td className="font-medium">{r[9]}</td>
                    <td>
                      <span className={r[8]?.toString().toLowerCase().includes('keluar') || r[8]?.toString().toLowerCase().includes('pengeluaran') ? 'badge-red' : 'badge-green'}>
                        {r[8]}
                      </span>
                    </td>
                    <td className="text-right font-mono">{formatRupiah(Number(r[11]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-blue-200 flex gap-2">
            <button onClick={handleImport} disabled={importing}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
              {importing ? 'Mengimpor...' : 'Mulai Import'}
            </button>
            <button onClick={() => { setShowPreview(false); setPreviewRows([]); fileInputRef.current.value = '' }}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition hover:bg-slate-50">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Hasil Import */}
      {importResult && (
        <div className={`card p-4 border ${importResult.failed === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {importResult.failed === 0
              ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              : <ShieldExclamationIcon className="w-4 h-4 text-amber-600" />
            }
            <p className="text-sm font-semibold text-slate-700">
              ✓ {importResult.success} transaksi berhasil diimpor
              {importResult.failed > 0 && <span className="text-red-600"> &nbsp;· {importResult.failed} gagal</span>}
            </p>
          </div>
          {importResult.errors.length > 0 && (
            <div className="space-y-1 mt-1">
              {importResult.errors.map((e, i) => (
                <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <XCircleIcon className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-500" />{e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Klik 'Tambah' untuk mencatat transaksi pertama."
              action={!isViewer && <button className="btn-primary btn-sm" onClick={openAdd}>+ Tambah Transaksi</button>}
            />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Tgl Masehi</th>
                  <th>Tgl Hijriyah</th>
                  <th>No. Kode</th>
                  <th>No. Bukti</th>
                  <th>Uraian</th>
                  <th>Sumber Dana</th>
                  <th className="text-right">Penerimaan</th>
                  <th className="text-right">Pengeluaran</th>
                  <th className="text-right">Saldo</th>
                  {!isViewer && <th className="w-20">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="whitespace-nowrap">{row.tanggal || '-'}</td>
                    <td className="whitespace-nowrap text-slate-500">{row.tanggal_hijriyah || '-'}</td>
                    <td className="text-slate-500">{row.kode_transaksi || '-'}</td>
                    <td className="text-slate-500">{row.nomor_bukti || '-'}</td>
                    <td className="max-w-xs">
                      <p className="truncate font-medium">{row.uraian}</p>
                      {row.instansi && <p className="text-[10px] text-slate-400">{row.instansi.nama_instansi}</p>}
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">{row.sumber_dana || '-'}</td>
                    <td className="text-right text-money text-emerald-600">
                      {row.jenis === 'pemasukan' ? formatRupiah(row.nominal) : '-'}
                    </td>
                    <td className="text-right text-money text-red-500">
                      {row.jenis === 'pengeluaran' ? formatRupiah(row.nominal) : '-'}
                    </td>
                    <td className={`text-right text-money font-semibold ${row.saldo_berjalan >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                      {formatRupiah(row.saldo_berjalan)}
                    </td>
                    {!isViewer && (
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setPrintTarget(row); setShowKuitansiModal(true) }}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition"
                            title="Cetak Kuitansi"
                          >
                            <PrinterIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteId(row.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"
                              title="Hapus Khusus Super Admin"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {/* Footer totals */}
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td colSpan={7} className="text-right text-slate-600 pr-4">JUMLAH</td>
                  <td className="text-right text-money text-emerald-700">{formatRupiah(summary.pem)}</td>
                  <td className="text-right text-money text-red-600">{formatRupiah(summary.pen)}</td>
                  <td className={`text-right text-money ${summary.saldo >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{formatRupiah(summary.saldo)}</td>
                  {!isViewer && <td />}
                </tr>
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {!loading && rows.length > pageSize && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
              <p className="text-xs text-slate-500">
                Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, rows.length)} dari {rows.length} transaksi
              </p>
              <div className="flex items-center gap-1">
                <button
                  className="px-3 py-1.5 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </button>
                <button
                  className="px-3 py-1.5 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Transaksi' : 'Tambah Transaksi'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : (editRow ? 'Simpan Perubahan' : 'Simpan Transaksi')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {isSuperAdmin && (
            <div className="col-span-2">
              <label className="label">Instansi</label>
              <select className="input" value={form.instansi_id} onChange={e => setForm(f => ({...f, instansi_id: e.target.value}))}>
                <option value="">-- Pilih Instansi --</option>
                {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Jenis Transaksi</label>
            <select className="input" value={form.jenis} onChange={e => setForm(f => ({...f, jenis: e.target.value}))}>
              <option value="pemasukan">Penerimaan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="label">Nominal (Rp)</label>
            <input type="number" className="input" placeholder="0" min="0"
              value={form.nominal} onChange={e => setForm(f => ({...f, nominal: e.target.value}))} />
          </div>
          <div>
            <label className="label">Tanggal Masehi</label>
            <input type="date" className="input" value={form.tanggal}
              onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} />
          </div>
          <div>
            <label className="label">Tanggal Hijriyah</label>
            <input type="text" className="input" placeholder="mis: 1 Syawal 1446"
              value={form.tanggal_hijriyah} onChange={e => setForm(f => ({...f, tanggal_hijriyah: e.target.value}))} />
          </div>
          <div>
            <label className="label">Bulan Hijriyah *</label>
            <select className="input" value={form.bulan_hijriyah} onChange={e => setForm(f => ({...f, bulan_hijriyah: e.target.value}))} required>
              <option value="" disabled>-- Pilih Bulan --</option>
              {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tahun Hijriyah</label>
            <input type="text" className="input" placeholder="1446"
              value={form.tahun_hijriyah} onChange={e => setForm(f => ({...f, tahun_hijriyah: e.target.value}))} />
          </div>
          <div>
            <label className="label">No. Kode</label>
            <input type="text" className="input" placeholder="Kode transaksi"
              value={form.kode_transaksi} onChange={e => setForm(f => ({...f, kode_transaksi: e.target.value}))} />
          </div>
          <div>
            <label className="label">No. Bukti</label>
            <input type="text" className="input" placeholder="No. kwitansi/bukti"
              value={form.nomor_bukti} onChange={e => setForm(f => ({...f, nomor_bukti: e.target.value}))} />
          </div>
          <div className="col-span-2">
            <label className="label">Uraian *</label>
            <input type="text" className="input" placeholder="Keterangan transaksi..."
              value={form.uraian} onChange={e => setForm(f => ({...f, uraian: e.target.value}))} required />
          </div>
          <div className="col-span-2">
            <label className="label">Sumber Dana</label>
            <input type="text" className="input" placeholder="Asal sumber dana"
              value={form.sumber_dana} onChange={e => setForm(f => ({...f, sumber_dana: e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Modal Hapus */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Transaksi">
        <p className="text-slate-600 mb-6">Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Batal</button>
          <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={handleDelete}>Ya, Hapus</button>
        </div>
      </Modal>

      {/* Modal Kuitansi Preview */}
      <Modal open={showKuitansiModal} onClose={() => setShowKuitansiModal(false)} title="Preview Kuitansi" size="xl">
        <div className="bg-slate-100 p-4 rounded-xl overflow-x-auto flex justify-center border border-slate-200">
          <div className="bg-white shadow-sm border border-slate-300" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <KuitansiLayout ref={kuitansiRef} transaksi={printTarget} settings={settings} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setShowKuitansiModal(false)}>Tutup</button>
          <button className="btn-primary flex items-center gap-2" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4" /> Cetak PDF / A4
          </button>
        </div>
      </Modal>
    </div>
  )
}
