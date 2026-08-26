// ============================================================
// src/pages/Instansi/InstansiPage.jsx
// Super admin only — dengan fitur Export & Import Instansi
// ============================================================
import { useState, useEffect, useRef } from 'react'
import {
  PlusIcon, PencilIcon, CheckCircleIcon, XCircleIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { instansiService } from '../../services/firebase.service'
import * as XLSX from 'xlsx'

const EMPTY = { nama_instansi: '', kode_instansi: '', alamat: '', aktif: true }
const HEADER_ROW = ['No', 'Nama Instansi', 'Kode', 'Alamat', 'Status']

export default function InstansiPage() {
  const [list, setList]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [previewRows, setPreviewRows]   = useState([])
  const [showPreview, setShowPreview]   = useState(false)
  const [toast, setToast]         = useState(null)
  const fileInputRef = useRef()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function load() {
    setLoading(true)
    try { setList(await instansiService.getAll()) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openAdd() { setForm(EMPTY); setEditItem(null); setModalOpen(true) }
  function openEdit(item) {
    setForm({ nama_instansi: item.nama_instansi, kode_instansi: item.kode_instansi, alamat: item.alamat || '', aktif: item.aktif })
    setEditItem(item)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nama_instansi || !form.kode_instansi) return
    setSaving(true)
    try {
      if (editItem) await instansiService.update(editItem.id, form)
      else await instansiService.create(form)
      setModalOpen(false); load()
    } catch(e) { showToast('Gagal: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleToggle(item) {
    try { await instansiService.toggle(item.id, !item.aktif); load() }
    catch(e) { showToast(e.message, 'error') }
  }

  // ─── EXPORT ────────────────────────────────────────────────
  function handleExport() {
    if (list.length === 0) { showToast('Tidak ada data instansi untuk diekspor.', 'error'); return }

    const wsData = [
      ['BACKUP DATA INSTANSI S-KEU'],
      ['Tanggal Backup', ':', new Date().toLocaleString()],
      [],
      HEADER_ROW,
      ...list.map((item, i) => [
        i + 1,
        item.nama_instansi,
        item.kode_instansi,
        item.alamat || '',
        item.aktif ? 'Aktif' : 'Nonaktif'
      ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    // Set lebar kolom
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 15 }, { wch: 40 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Instansi')
    XLSX.writeFile(wb, `Backup_Instansi_S-KEU_${new Date().toISOString().split('T')[0]}.xlsx`)
    showToast(`Berhasil mengekspor ${list.length} instansi!`)
  }

  // ─── IMPORT: Baca file & preview ───────────────────────────
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

        // Cari baris header
        const headerIdx = raw.findIndex(r => r[1] === 'Nama Instansi' && r[2] === 'Kode')
        if (headerIdx === -1) {
          showToast('Format file tidak valid. Gunakan file dari Export Instansi S-KEU.', 'error')
          fileInputRef.current.value = ''
          return
        }

        const rows = raw.slice(headerIdx + 1).filter(r => r[1] && r[2])
        if (rows.length === 0) { showToast('Tidak ada data instansi di file.', 'error'); return }

        setPreviewRows(rows.slice(0, 5))
        setShowPreview(true)
      } catch {
        showToast('Gagal membaca file.', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ─── IMPORT: Proses masukkan data ──────────────────────────
  async function handleImport() {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    if (!window.confirm('Data instansi dari file akan DITAMBAHKAN ke database.\nInstansi yang sudah ada tidak akan tertimpa.\n\nLanjutkan?')) return

    setImporting(true)
    setImportResult(null)
    setShowPreview(false)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const headerIdx = raw.findIndex(r => r[1] === 'Nama Instansi' && r[2] === 'Kode')
        const rows = raw.slice(headerIdx + 1).filter(r => r[1] && r[2])

        let success = 0, skipped = 0
        const errors = []

        for (const row of rows) {
          const [, nama, kode, alamat, status] = row
          const namaBersih  = nama?.toString().trim()
          const kodeBersih  = kode?.toString().trim().toUpperCase()
          const aktifValue  = status?.toString().toLowerCase() !== 'nonaktif'

          // Cek apakah kode sudah ada (skip jika duplikat)
          const existing = list.find(i => i.kode_instansi?.toUpperCase() === kodeBersih)
          if (existing) {
            skipped++
            errors.push(`"${namaBersih}" (${kodeBersih}): sudah ada, dilewati.`)
            continue
          }

          try {
            await instansiService.create({
              nama_instansi: namaBersih,
              kode_instansi: kodeBersih,
              alamat:        alamat?.toString().trim() || null,
              aktif:         aktifValue,
            })
            success++
          } catch (error) {
            errors.push(`"${namaBersih}": Error tidak terduga - ${error.message}`)
          }
        }

        setImportResult({ success, skipped, errors: errors.slice(0, 10) })
        if (success > 0) {
          showToast(`Import selesai: ${success} ditambahkan, ${skipped} dilewati.`)
          load()
        } else {
          showToast('Tidak ada instansi baru yang berhasil ditambahkan.', 'error')
        }
      } catch {
        showToast('Terjadi kesalahan saat memproses import.', 'error')
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Input file tersembunyi */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 font-display">Manajemen Instansi</h2>
          <p className="text-sm text-slate-500">{list.length} instansi terdaftar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import */}
          <button
            onClick={() => { setImportResult(null); setShowPreview(false); fileInputRef.current?.click() }}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition disabled:opacity-60"
          >
            <ArrowUpTrayIcon className="w-3.5 h-3.5" />
            {importing ? 'Mengimpor...' : 'Import (.xlsx)'}
          </button>
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Export (.xlsx)
          </button>
          {/* Tambah */}
          <button id="btn-tambah-instansi" className="btn-primary" onClick={openAdd}>
            <PlusIcon className="w-4 h-4" /> Tambah Instansi
          </button>
        </div>
      </div>

      {/* Preview sebelum Import */}
      {showPreview && previewRows.length > 0 && (
        <div className="card border-blue-200 bg-blue-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <ArrowUpTrayIcon className="w-4 h-4" />
              Preview {previewRows.length} baris pertama dari file
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl bg-white">
              <thead>
                <tr>
                  <th>Nama Instansi</th>
                  <th>Kode</th>
                  <th>Alamat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium">{r[1]}</td>
                    <td><span className="badge-slate">{r[2]}</span></td>
                    <td className="text-slate-500">{r[3] || '-'}</td>
                    <td><span className={r[4]?.toLowerCase() === 'nonaktif' ? 'badge-red' : 'badge-green'}>{r[4] || 'Aktif'}</span></td>
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
        <div className={`card p-4 border ${importResult.errors.filter(e => !e.includes('dilewati')).length === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {importResult.errors.filter(e => !e.includes('dilewati')).length === 0
              ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              : <ShieldExclamationIcon className="w-4 h-4 text-amber-600" />
            }
            <p className="text-sm font-semibold text-slate-700">
              ✓ {importResult.success} instansi ditambahkan
              {importResult.skipped > 0 && <span className="text-slate-500"> &nbsp;· {importResult.skipped} dilewati (sudah ada)</span>}
            </p>
          </div>
          {importResult.errors.length > 0 && (
            <div className="space-y-1 mt-1">
              {importResult.errors.map((e, i) => (
                <p key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                  <XCircleIcon className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-500" />{e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Memuat...</div>
          ) : list.length === 0 ? (
            <EmptyState title="Belum ada instansi" action={<button className="btn-primary btn-sm" onClick={openAdd}>+ Tambah Instansi</button>} />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Instansi</th>
                  <th>Kode</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, i) => (
                  <tr key={item.id}>
                    <td className="text-slate-400">{i+1}</td>
                    <td className="font-medium">{item.nama_instansi}</td>
                    <td><span className="badge-slate">{item.kode_instansi}</span></td>
                    <td className="text-slate-500">{item.alamat || '-'}</td>
                    <td>
                      <span className={item.aktif ? 'badge-green' : 'badge-red'}>
                        {item.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition" title="Edit">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggle(item)} className={`p-1.5 rounded transition ${item.aktif ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`} title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          {item.aktif ? <XCircleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Instansi' : 'Tambah Instansi'}
        footer={<><button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Instansi *</label>
            <input className="input" placeholder="Nama unit/instansi" value={form.nama_instansi} onChange={e => setForm(f => ({...f, nama_instansi: e.target.value}))} />
          </div>
          <div>
            <label className="label">Kode Instansi *</label>
            <input className="input" placeholder="mis: MTQ, MTS, KOPERASI" value={form.kode_instansi} onChange={e => setForm(f => ({...f, kode_instansi: e.target.value.toUpperCase()}))} />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input className="input" placeholder="Alamat instansi" value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
