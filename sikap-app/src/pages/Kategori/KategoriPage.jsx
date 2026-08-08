// ============================================================
// src/pages/Kategori/KategoriPage.jsx
// CRUD Kategori Transaksi
// ============================================================
import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { kategoriService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'

export default function KategoriPage() {
  const { isSuperAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editRow, setEditRow] = useState(null)
  
  const [form, setForm] = useState({
    nama_kategori: '',
    jenis: 'pengeluaran' // pengeluaran / pemasukan
  })

  async function load() {
    setLoading(true)
    try {
      const data = await kategoriService.getAll()
      setRows(data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ nama_kategori: '', jenis: 'pengeluaran' })
    setEditRow(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setForm({
      nama_kategori: row.nama_kategori || '',
      jenis: row.jenis || 'pengeluaran'
    })
    setEditRow(row)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nama_kategori.trim()) {
      alert('Nama kategori harus diisi')
      return
    }
    setSaving(true)
    try {
      if (editRow) {
        await kategoriService.update(editRow.id, form)
      } else {
        await kategoriService.create(form)
      }
      setModalOpen(false)
      load()
    } catch(e) {
      alert('Gagal menyimpan: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Hapus kategori ini?')) return
    try {
      await kategoriService.delete(id)
      load()
    } catch(e) { alert('Gagal menghapus: ' + e.message) }
  }

  if (!isSuperAdmin) {
    return <div className="p-5 text-center text-red-500">Akses ditolak. Halaman ini hanya untuk Super Admin.</div>
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Kategori Transaksi</h2>
          <p className="text-sm text-slate-500">Kelola master data bagan akun (Chart of Accounts)</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <PlusIcon className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map(n => <div key={n} className="h-10 skeleton w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Belum ada kategori"
            description="Tambahkan kategori pertama untuk transaksi pemasukan/pengeluaran."
            action={<button className="btn-primary btn-sm" onClick={openAdd}>+ Kategori Baru</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-12">No</th>
                  <th>Nama Kategori</th>
                  <th>Jenis</th>
                  <th className="w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="font-medium">{row.nama_kategori}</td>
                    <td>
                      <span className={`badge ${row.jenis === 'pemasukan' ? 'badge-green' : 'badge-red'}`}>
                        {row.jenis === 'pemasukan' ? 'Penerimaan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition" title="Hapus">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : (editRow ? 'Simpan' : 'Tambah')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nama Kategori</label>
            <input
              type="text"
              className="input"
              placeholder="mis. Biaya Operasional"
              value={form.nama_kategori}
              onChange={e => setForm({ ...form, nama_kategori: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Jenis</label>
            <select
              className="input"
              value={form.jenis}
              onChange={e => setForm({ ...form, jenis: e.target.value })}
            >
              <option value="pengeluaran">Pengeluaran</option>
              <option value="pemasukan">Penerimaan</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
