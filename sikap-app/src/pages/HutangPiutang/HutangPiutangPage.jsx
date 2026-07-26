// ============================================================
// src/pages/HutangPiutang/HutangPiutangPage.jsx
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, DocumentTextIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { formatRupiah } from '../../utils/formatRupiah'
import { hutangService, instansiService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'

const EMPTY_FORM = {
  nama_pihak: '',
  nominal_total: '',
  tanggal: '',
  keterangan: '',
  instansi_id: '',
}

export default function HutangPiutangPage({ type }) {
  // type = 'hutang' atau 'piutang'
  const isHutang = type === 'hutang'
  const pageTitle = isHutang ? 'Data Hutang' : 'Data Piutang'
  const pihakLabel = isHutang ? 'Pemberi Hutang (Kreditur)' : 'Peminjam (Debitur)'
  const btnColor = isHutang ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
  const badgeColor = isHutang ? 'badge-red' : 'badge-blue'

  const { isSuperAdmin, isViewer, instansiId, user } = useAuth()
  const [rows, setRows] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterInstansi, setFilterInstansi] = useState(instansiId || '')

  // Modal Induk
  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  // Modal Cicilan
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedInduk, setSelectedInduk] = useState(null)
  const [cicilanList, setCicilanList] = useState([])
  const [loadingCicilan, setLoadingCicilan] = useState(false)
  
  // Form Cicilan
  const [cicilanFormOpen, setCicilanFormOpen] = useState(false)
  const [cForm, setCForm] = useState({ nominal: '', tanggal: '', keterangan: '' })

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
  }, [])

  async function load() {
    setLoading(true)
    const id = isSuperAdmin ? (filterInstansi || null) : instansiId
    try {
      const data = await hutangService.getAll({
        instansiId: id,
        jenis: type,
        search: search || null,
        orderDesc: true
      })
      setRows(data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [type, filterInstansi, instansiId, isSuperAdmin])

  function handleSearch(e) {
    e.preventDefault()
    load()
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, instansi_id: isSuperAdmin ? (filterInstansi || '') : instansiId })
    setEditRow(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setForm({
      nama_pihak: row.nama_pihak || '',
      nominal_total: String(row.nominal_total || ''),
      tanggal: row.tanggal || '',
      keterangan: row.keterangan || '',
      instansi_id: row.instansi_id || '',
    })
    setEditRow(row)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nama_pihak || !form.nominal_total) return alert('Lengkapi data wajib')
    const finalInstansiId = isSuperAdmin ? form.instansi_id : instansiId
    if (!finalInstansiId) return alert('Pilih instansi terlebih dahulu')

    setSaving(true)
    try {
      const payload = {
        ...form,
        jenis: type,
        nominal_total: parseInt(form.nominal_total) || 0,
        nominal_dibayar: editRow ? editRow.nominal_dibayar : 0, // preserve existing if edit
        status: editRow ? editRow.status : 'belum_lunas',
        instansi_id: finalInstansiId,
      }
      if (editRow) await hutangService.update(editRow.id, payload)
      else await hutangService.create(payload)
      setModalOpen(false)
      load()
    } catch(e) { alert('Gagal menyimpan: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus data ini beserta seluruh histori cicilannya?')) return
    try {
      await hutangService.delete(id)
      load()
    } catch(e) { alert('Gagal hapus: ' + e.message) }
  }

  // ---- LOGIC CICILAN ----
  async function openDetail(row) {
    setSelectedInduk(row)
    setDetailModalOpen(true)
    setCicilanFormOpen(false)
    loadCicilan(row.id)
  }

  async function loadCicilan(hutangPiutangId) {
    setLoadingCicilan(true)
    try {
      const data = await hutangService.getPembayaran(hutangPiutangId)
      setCicilanList(data)
    } catch(e) { console.error(e) }
    finally { setLoadingCicilan(false) }
  }

  async function handleSaveCicilan() {
    if (!cForm.nominal || !cForm.tanggal) return alert('Isi nominal dan tanggal')
    const nom = parseInt(cForm.nominal) || 0
    if (nom <= 0) return alert('Nominal tidak valid')

    setSaving(true)
    try {
      // 1. Tambah cicilan
      await hutangService.createPembayaran(selectedInduk.id, {
        nominal: nom,
        tanggal: cForm.tanggal,
        keterangan: cForm.keterangan || 'Pembayaran cicilan'
      })
      // 2. Update induk
      const totalBayarBaru = (selectedInduk.nominal_dibayar || 0) + nom
      const statusBaru = totalBayarBaru >= selectedInduk.nominal_total ? 'lunas' : 'belum_lunas'
      await hutangService.update(selectedInduk.id, {
        nominal_dibayar: totalBayarBaru,
        status: statusBaru
      })
      
      // Update local state temporarily for snappy UI
      setSelectedInduk(prev => ({...prev, nominal_dibayar: totalBayarBaru, status: statusBaru}))
      setCForm({ nominal: '', tanggal: '', keterangan: '' })
      setCicilanFormOpen(false)
      loadCicilan(selectedInduk.id)
      load() // refresh table belakang
    } catch(e) { alert('Gagal memproses cicilan: ' + e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteCicilan(cicilan) {
    if (!window.confirm('Hapus histori cicilan ini? Saldo terbayar akan dikurangi otomatis.')) return
    try {
      await hutangService.deletePembayaran(cicilan.id)
      const totalBayarBaru = Math.max(0, (selectedInduk.nominal_dibayar || 0) - cicilan.nominal)
      const statusBaru = totalBayarBaru >= selectedInduk.nominal_total ? 'lunas' : 'belum_lunas'
      await hutangService.update(selectedInduk.id, {
        nominal_dibayar: totalBayarBaru,
        status: statusBaru
      })
      setSelectedInduk(prev => ({...prev, nominal_dibayar: totalBayarBaru, status: statusBaru}))
      loadCicilan(selectedInduk.id)
      load()
    } catch(e) { alert('Gagal menghapus cicilan: ' + e.message) }
  }

  const summary = useMemo(() => {
    let total = 0, dibayar = 0
    rows.forEach(r => {
      total += r.nominal_total || 0
      dibayar += r.nominal_dibayar || 0
    })
    return { total, dibayar, sisa: total - dibayar }
  }, [rows])

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={`Cari nama ${isHutang ? 'kreditur' : 'debitur'} atau keterangan...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">Cari</button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin && (
            <select className="input w-auto" value={filterInstansi} onChange={e => setFilterInstansi(e.target.value)}>
              <option value="">Semua Instansi</option>
              {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
            </select>
          )}
          {!isViewer && (
            <button className={`px-4 py-2 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-sm ${btnColor}`} onClick={openAdd}>
              <PlusIcon className="w-4 h-4" /> Catat {isHutang ? 'Hutang' : 'Piutang'} Baru
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center bg-slate-50">
          <p className="text-xs text-slate-500">Total {pageTitle}</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{formatRupiah(summary.total)}</p>
        </div>
        <div className="card p-3 text-center bg-emerald-50 border-emerald-100 border">
          <p className="text-xs text-emerald-600">Total Terbayar</p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatRupiah(summary.dibayar)}</p>
        </div>
        <div className="card p-3 text-center bg-amber-50 border-amber-100 border">
          <p className="text-xs text-amber-600">Sisa Belum Dibayar</p>
          <p className="text-sm font-bold text-amber-700 mt-0.5">{formatRupiah(summary.sisa)}</p>
        </div>
      </div>

      {/* Table Induk */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : rows.length === 0 ? (
            <EmptyState title={`Belum ada data ${type}`} description="Klik tombol di atas untuk mulai mencatat." />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Tanggal</th>
                  <th>{pihakLabel}</th>
                  <th>Keterangan</th>
                  <th className="text-right">Total Pinjaman</th>
                  <th className="text-right">Sisa Belum Dibayar</th>
                  <th className="text-center">Status</th>
                  <th className="w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const sisa = Math.max(0, (row.nominal_total || 0) - (row.nominal_dibayar || 0))
                  const lunas = row.status === 'lunas'
                  return (
                    <tr key={row.id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td className="whitespace-nowrap">{row.tanggal || '-'}</td>
                      <td>
                        <p className="font-semibold text-slate-700">{row.nama_pihak}</p>
                        {row.instansi && <p className="text-[10px] text-slate-400">{row.instansi.nama_instansi}</p>}
                      </td>
                      <td className="max-w-[200px] truncate text-slate-500">{row.keterangan || '-'}</td>
                      <td className="text-right font-mono text-sm">{formatRupiah(row.nominal_total)}</td>
                      <td className="text-right font-mono text-sm font-bold text-amber-600">{formatRupiah(sisa)}</td>
                      <td className="text-center">
                        <span className={lunas ? 'badge-green' : 'badge-orange'}>
                          {lunas ? 'LUNAS' : 'BELUM LUNAS'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => openDetail(row)} className="btn-secondary btn-sm !px-2" title="Detail & Cicilan">
                            <DocumentTextIcon className="w-4 h-4 text-slate-600" />
                          </button>
                          {!isViewer && (
                            <>
                              <button onClick={() => openEdit(row)} className="btn-secondary btn-sm !px-2" title="Edit">
                                <PencilIcon className="w-4 h-4 text-blue-500" />
                              </button>
                              {isSuperAdmin && (
                                <button onClick={() => handleDelete(row.id)} className="btn-secondary btn-sm !px-2" title="Hapus Permanen">
                                  <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Add/Edit Induk */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRow ? `Edit Data ${isHutang?'Hutang':'Piutang'}` : `Catat ${isHutang?'Hutang':'Piutang'} Baru`} size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="label">Instansi</label>
              <select className="input" value={form.instansi_id} onChange={e => setForm(f => ({...f, instansi_id: e.target.value}))}>
                <option value="">-- Pilih Instansi --</option>
                {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{pihakLabel} *</label>
            <input type="text" className="input" placeholder="Nama orang atau instansi"
              value={form.nama_pihak} onChange={e => setForm(f => ({...f, nama_pihak: e.target.value}))} required />
          </div>
          <div>
            <label className="label">Total Pinjaman (Rp) *</label>
            <input type="number" className="input" placeholder="0" min="0"
              value={form.nominal_total} onChange={e => setForm(f => ({...f, nominal_total: e.target.value}))} required />
            {form.nominal_total && <p className="text-xs text-emerald-600 font-semibold mt-1 ml-1">{formatRupiah(Number(form.nominal_total))}</p>}
          </div>
          <div>
            <label className="label">Tanggal Masehi</label>
            <input type="date" className="input" value={form.tanggal} onChange={e => setForm(f => ({...f, tanggal: e.target.value}))} />
          </div>
          <div>
            <label className="label">Keterangan / Tujuan</label>
            <input type="text" className="input" placeholder="Untuk keperluan apa..."
              value={form.keterangan} onChange={e => setForm(f => ({...f, keterangan: e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Modal Histori Cicilan */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Histori Pembayaran Cicilan" size="lg">
        {selectedInduk && (
          <div className="space-y-5">
            {/* Header Info */}
            <div className="card bg-slate-50 border-slate-200 p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">{pihakLabel}</p>
                <p className="font-bold text-slate-800 text-lg">{selectedInduk.nama_pihak}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Status</p>
                <span className={selectedInduk.status === 'lunas' ? 'badge-green' : 'badge-orange'}>
                  {selectedInduk.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-xl bg-white border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Pinjaman</p>
                <p className="font-mono font-semibold text-slate-800">{formatRupiah(selectedInduk.nominal_total)}</p>
              </div>
              <div className="p-3 border rounded-xl bg-white border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Sisa Tagihan</p>
                <p className="font-mono font-semibold text-amber-600">{formatRupiah(Math.max(0, selectedInduk.nominal_total - (selectedInduk.nominal_dibayar || 0)))}</p>
              </div>
            </div>

            {/* List Cicilan */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-sm font-bold text-slate-800">Daftar Cicilan</h3>
                {!isViewer && selectedInduk.status !== 'lunas' && !cicilanFormOpen && (
                  <button onClick={() => setCicilanFormOpen(true)} className="btn-primary btn-sm !text-xs !py-1.5">
                    + Catat Pembayaran Baru
                  </button>
                )}
              </div>

              {/* Form Inline Cicilan */}
              {cicilanFormOpen && (
                <div className="p-4 border-2 border-emerald-100 bg-emerald-50/50 rounded-xl mb-4 animate-slide-down">
                  <h4 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-wider">Form Pembayaran</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="label !text-[11px]">Tgl Bayar *</label>
                      <input type="date" className="input !text-sm !py-1.5" value={cForm.tanggal} onChange={e => setCForm(f => ({...f, tanggal: e.target.value}))} />
                    </div>
                    <div>
                      <label className="label !text-[11px]">Nominal Dibayar (Rp) *</label>
                      <input type="number" className="input !text-sm !py-1.5" placeholder="0" value={cForm.nominal} onChange={e => setCForm(f => ({...f, nominal: e.target.value}))} />
                      {cForm.nominal && <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{formatRupiah(Number(cForm.nominal))}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="label !text-[11px]">Keterangan</label>
                      <input type="text" className="input !text-sm !py-1.5" placeholder="Cicilan ke-..." value={cForm.keterangan} onChange={e => setCForm(f => ({...f, keterangan: e.target.value}))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="btn-secondary btn-sm" onClick={() => setCicilanFormOpen(false)}>Batal</button>
                    <button className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveCicilan} disabled={saving}>
                      {saving ? 'Menyimpan...' : 'Simpan Pembayaran'}
                    </button>
                  </div>
                </div>
              )}

              {loadingCicilan ? (
                <p className="text-xs text-slate-400 text-center py-6">Memuat histori...</p>
              ) : cicilanList.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl py-6 text-center bg-slate-50/50">
                  <p className="text-xs text-slate-500">Belum ada histori cicilan/pembayaran.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {cicilanList.map((c, idx) => (
                    <div key={c.id} className="flex justify-between items-center p-3 border border-slate-100 bg-white rounded-xl shadow-sm hover:border-blue-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{formatRupiah(c.nominal)}</p>
                          <div className="flex gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span>{c.tanggal}</span>
                            <span>•</span>
                            <span>{c.keterangan}</span>
                          </div>
                        </div>
                      </div>
                      {!isViewer && (
                        <button onClick={() => handleDeleteCicilan(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Hapus cicilan ini">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
