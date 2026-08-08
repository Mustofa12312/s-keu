import { useState, useEffect } from 'react'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { anggaranService } from '../../services/anggaran.service'
import { pengaturanService } from '../../services/firebase.service'
import { formatRupiah } from '../../utils/formatRupiah'
import referensiAnggaran from '../../data/referensiAnggaran.json'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'

export default function RencanaAnggaranPage() {
  const { instansiId, isSuperAdmin } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [kategori, setKategori] = useState('pendapatan')
  const [tahunPelajaran, setTahunPelajaran] = useState('')
  
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingData, setEditingData] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    kode: '',
    uraian: '',
    waktu_pelaksanaan: '',
    pelaksana: '',
    volume: 1,
    satuan: '',
    harga_satuan: 0
  })

  useEffect(() => {
    // Get active tahun from settings
    pengaturanService.getSettings().then(settings => {
      setTahunPelajaran(settings?.tahun_aktif || '1446')
    })
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await anggaranService.getRencana({
        instansiId: isSuperAdmin ? null : instansiId,
        tahunPelajaran,
        kategori
      })
      setData(res)
    } catch (error) {
      console.error(error)
      showToast('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!tahunPelajaran) return
    if (!isSuperAdmin && !instansiId) return
    
    fetchData()
  }, [tahunPelajaran, kategori, instansiId, isSuperAdmin]) // eslint-disable-line

  const activeReferensi = referensiAnggaran.anggaran.filter(item => 
    kategori === 'pendapatan' ? item.kode.startsWith('04') : item.kode.startsWith('05')
  )

  const handleKodeChange = (e) => {
    const val = e.target.value
    let newForm = { ...formData, kode: val }
    
    const ref = activeReferensi.find(item => item.kode === val)
    if (ref) {
      if (ref.uraian) newForm.uraian = ref.uraian
      if (ref.pelaksana) newForm.pelaksana = ref.pelaksana
      if (ref.satuan) newForm.satuan = ref.satuan
      if (ref.waktu_pelaksanaan) newForm.waktu_pelaksanaan = ref.waktu_pelaksanaan
    }
    setFormData(newForm)
  }

  const openAdd = () => {
    setEditingData(null)
    setFormData({
      kode: '',
      uraian: '',
      waktu_pelaksanaan: '',
      pelaksana: '',
      volume: 1,
      satuan: '',
      harga_satuan: 0
    })
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingData(item)
    setFormData({
      kode: item.kode || '',
      uraian: item.uraian || '',
      waktu_pelaksanaan: item.waktu_pelaksanaan || '',
      pelaksana: item.pelaksana || '',
      volume: item.volume || 1,
      satuan: item.satuan || '',
      harga_satuan: item.harga_satuan || 0
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus item anggaran ini? Semua realisasi terkait juga akan dihapus.')) return
    try {
      await anggaranService.deleteRencana(id)
      showToast('Berhasil dihapus')
      fetchData()
    } catch (error) {
      console.error(error)
      showToast('Gagal menghapus', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        volume: Number(formData.volume),
        harga_satuan: Number(formData.harga_satuan),
        jumlah: Number(formData.volume) * Number(formData.harga_satuan),
        kategori,
        tahun_pelajaran: tahunPelajaran,
        instansi_id: isSuperAdmin ? null : instansiId // Note: if superadmin needs to pick instansi, need a dropdown
      }
      
      if (editingData) {
        await anggaranService.updateRencana(editingData.id, payload)
        showToast('Berhasil diperbarui')
      } else {
        await anggaranService.createRencana(payload)
        showToast('Berhasil ditambahkan')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error(error)
      showToast('Gagal menyimpan', 'error')
    }
  }

  const totalAnggaran = data.reduce((acc, curr) => acc + (curr.jumlah || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Rencana Anggaran (RAPBM)</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola rencana pendapatan dan belanja madrasah</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Item</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button 
          onClick={() => setKategori('pendapatan')} 
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${kategori === 'pendapatan' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Pendapatan
        </button>
        <button 
          onClick={() => setKategori('belanja')} 
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${kategori === 'belanja' ? 'bg-red-50 text-red-700 border-b-2 border-red-500' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Belanja
        </button>
      </div>

      <div className="card p-4 bg-slate-50 border border-slate-100 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 font-medium">Tahun Pelajaran</p>
          <p className="text-sm font-bold text-slate-800">{tahunPelajaran || '-'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium">Total {kategori === 'pendapatan' ? 'Target Pendapatan' : 'Pagu Belanja'}</p>
          <p className={`text-lg font-bold ${kategori === 'pendapatan' ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatRupiah(totalAnggaran)}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-10 skeleton w-full" />)}
            </div>
          ) : data.length === 0 ? (
            <EmptyState title="Belum ada rencana anggaran" description={`Silakan tambah item rencana ${kategori}.`} />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Uraian</th>
                  <th>Waktu</th>
                  <th>Pelaksana</th>
                  <th className="text-right">Vol</th>
                  <th>Satuan</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-right">Jumlah</th>
                  <th className="w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-700">{row.kode}</td>
                    <td>{row.uraian}</td>
                    <td>{row.waktu_pelaksanaan}</td>
                    <td>{row.pelaksana}</td>
                    <td className="text-right">{row.volume}</td>
                    <td>{row.satuan}</td>
                    <td className="text-right">{formatRupiah(row.harga_satuan)}</td>
                    <td className="text-right font-bold text-slate-800">{formatRupiah(row.jumlah)}</td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
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

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingData ? 'Edit Anggaran' : 'Tambah Anggaran'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Kode Anggaran</label>
            <input type="text" className="input" required value={formData.kode} onChange={handleKodeChange} placeholder="Misal: 04.01" list="kode-list" />
          </div>
          <div>
            <label className="label">Uraian / Nama Kegiatan</label>
            <input type="text" className="input" required value={formData.uraian} onChange={e => setFormData({...formData, uraian: e.target.value})} placeholder="Misal: SPP Murid" list="uraian-list" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Waktu Pelaksanaan</label>
              <input type="text" className="input" value={formData.waktu_pelaksanaan} onChange={e => setFormData({...formData, waktu_pelaksanaan: e.target.value})} placeholder="Misal: Saniyah/Tahunan" list="waktu-list" />
            </div>
            <div>
              <label className="label">Pelaksana</label>
              <input type="text" className="input" value={formData.pelaksana} onChange={e => setFormData({...formData, pelaksana: e.target.value})} placeholder="Misal: Bendahara" list="pelaksana-list" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Volume</label>
              <input type="number" className="input" required min="1" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} />
            </div>
            <div>
              <label className="label">Satuan</label>
              <input type="text" className="input" required value={formData.satuan} onChange={e => setFormData({...formData, satuan: e.target.value})} placeholder="Org / Keg" list="satuan-list" />
            </div>
            <div>
              <label className="label">Harga Satuan</label>
              <input type="number" className="input" required min="0" value={formData.harga_satuan} onChange={e => setFormData({...formData, harga_satuan: e.target.value})} />
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500 mb-1">Total Anggaran (Jumlah)</p>
            <p className="text-xl font-bold text-slate-800">{formatRupiah(Number(formData.volume) * Number(formData.harga_satuan))}</p>
          </div>
          
          <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan</button>
          </div>

          {/* Datalists for Autocomplete */}
          <datalist id="kode-list">
            {activeReferensi.map(item => <option key={item.kode} value={item.kode}>{item.uraian}</option>)}
          </datalist>
          <datalist id="uraian-list">
            {activeReferensi.map(item => <option key={item.kode} value={item.uraian} />)}
          </datalist>
          <datalist id="pelaksana-list">
            {referensiAnggaran.pelaksanaOptions.map(opt => <option key={opt} value={opt} />)}
          </datalist>
          <datalist id="satuan-list">
            {referensiAnggaran.satuanOptions.map(opt => <option key={opt} value={opt} />)}
          </datalist>
          <datalist id="waktu-list">
            {referensiAnggaran.waktuPelaksanaanOptions.map(opt => <option key={opt} value={opt} />)}
          </datalist>
        </form>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl font-medium animate-slide-in z-50 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}
    </div>
  )
}
