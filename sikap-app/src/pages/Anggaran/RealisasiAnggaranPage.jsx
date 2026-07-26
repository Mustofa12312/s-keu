import { useState, useEffect } from 'react'
import { CheckCircleIcon, DocumentPlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { anggaranService } from '../../services/anggaran.service'
import { pengaturanService } from '../../services/firebase.service'
import { formatRupiah } from '../../utils/formatRupiah'
import { toDateInputValue, formatDateID } from '../../utils/dateUtils'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'

export default function RealisasiAnggaranPage() {
  const { instansiId, isSuperAdmin } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [kategori, setKategori] = useState('pendapatan')
  const [tahunPelajaran, setTahunPelajaran] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAnggaran, setSelectedAnggaran] = useState(null)
  const [realisasiList, setRealisasiList] = useState([])
  const [loadingRealisasi, setLoadingRealisasi] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    tanggal: toDateInputValue(new Date()),
    uraian: '',
    nominal: 0
  })

  useEffect(() => {
    pengaturanService.getSettings().then(settings => {
      setTahunPelajaran(settings?.tahun_aktif || '1446')
    })
  }, [])

  useEffect(() => {
    if (!tahunPelajaran) return
    if (!isSuperAdmin && !instansiId) return
    
    fetchData()
  }, [tahunPelajaran, kategori, instansiId, isSuperAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const realisasiAll = await anggaranService.getAllRealisasiLaporan({
        instansiId: isSuperAdmin ? null : instansiId,
        tahunPelajaran
      })
      
      const resRencana = await anggaranService.getRencana({
        instansiId: isSuperAdmin ? null : instansiId,
        tahunPelajaran,
        kategori
      })
      
      // Combine Rencana with Realisasi
      const combined = resRencana.map(rencana => {
        const itemRealisasi = realisasiAll.filter(r => r.anggaran_id === rencana.id)
        const totalRealisasi = itemRealisasi.reduce((sum, r) => sum + (r.nominal || 0), 0)
        return {
          ...rencana,
          total_realisasi: totalRealisasi,
          sisa_anggaran: (rencana.jumlah || 0) - totalRealisasi
        }
      })
      
      setData(combined)
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const openRealisasi = async (item) => {
    setSelectedAnggaran(item)
    setFormData({
      tanggal: toDateInputValue(new Date()),
      uraian: `Realisasi ${item.uraian}`,
      nominal: 0
    })
    setIsModalOpen(true)
    
    setLoadingRealisasi(true)
    try {
      const list = await anggaranService.getRealisasi(item.id)
      setRealisasiList(list)
    } catch (error) {
      toast.error('Gagal memuat riwayat')
    } finally {
      setLoadingRealisasi(false)
    }
  }

  const handleDeleteRealisasi = async (id) => {
    if (!window.confirm('Hapus realisasi ini?')) return
    try {
      await anggaranService.deleteRealisasi(id)
      toast.success('Dihapus')
      // Refresh list
      const list = await anggaranService.getRealisasi(selectedAnggaran.id)
      setRealisasiList(list)
      fetchData() // to update parent table numbers
    } catch (error) {
      toast.error('Gagal menghapus')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        nominal: Number(formData.nominal),
        instansi_id: selectedAnggaran.instansi_id,
        tahun_pelajaran: selectedAnggaran.tahun_pelajaran
      }
      
      await anggaranService.createRealisasi(selectedAnggaran.id, payload)
      toast.success('Realisasi dicatat')
      
      // Reset form and refresh list
      setFormData({
        tanggal: toDateInputValue(new Date()),
        uraian: `Realisasi ${selectedAnggaran.uraian}`,
        nominal: 0
      })
      const list = await anggaranService.getRealisasi(selectedAnggaran.id)
      setRealisasiList(list)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error('Gagal menyimpan')
    }
  }
  
  const totalRencana = data.reduce((acc, curr) => acc + (curr.jumlah || 0), 0)
  const totalRealisasi = data.reduce((acc, curr) => acc + (curr.total_realisasi || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Realisasi Anggaran</h1>
          <p className="text-sm text-slate-500 mt-1">Catat pencairan atau uang yang masuk sesuai RAPBM</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button 
          onClick={() => setKategori('pendapatan')} 
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${kategori === 'pendapatan' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Realisasi Pendapatan
        </button>
        <button 
          onClick={() => setKategori('belanja')} 
          className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-colors ${kategori === 'belanja' ? 'bg-red-50 text-red-700 border-b-2 border-red-500' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Realisasi Belanja
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Total Anggaran</p>
          <p className="text-lg font-bold text-slate-800">{formatRupiah(totalRencana)}</p>
        </div>
        <div className="card p-4 bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">Total Terealisasi</p>
          <p className="text-lg font-bold text-emerald-700">{formatRupiah(totalRealisasi)}</p>
        </div>
        <div className="card p-4 bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-600 font-medium">Sisa Belum Terealisasi</p>
          <p className="text-lg font-bold text-amber-700">{formatRupiah(totalRencana - totalRealisasi)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(n => <div key={n} className="h-10 skeleton w-full" />)}
            </div>
          ) : data.length === 0 ? (
            <EmptyState title={`Tidak ada Rencana Anggaran`} description="Silakan buat Rencana Anggaran terlebih dahulu." />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Uraian</th>
                  <th className="text-right">Target Anggaran</th>
                  <th className="text-right">Terealisasi</th>
                  <th className="text-right">Sisa</th>
                  <th className="text-center">Progress</th>
                  <th className="w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const pct = row.jumlah > 0 ? (row.total_realisasi / row.jumlah) * 100 : 0
                  return (
                  <tr key={row.id}>
                    <td className="font-medium text-slate-700">{row.kode}</td>
                    <td>{row.uraian}</td>
                    <td className="text-right font-bold text-slate-800">{formatRupiah(row.jumlah)}</td>
                    <td className="text-right font-semibold text-emerald-600">{formatRupiah(row.total_realisasi)}</td>
                    <td className="text-right text-slate-600">{formatRupiah(row.sisa_anggaran)}</td>
                    <td className="w-48 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-center">
                        <button onClick={() => openRealisasi(row)} className="btn-primary btn-sm px-3 flex items-center gap-1.5 whitespace-nowrap">
                          <DocumentPlusIcon className="w-4 h-4" />
                          <span>Catat</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Input Realisasi Anggaran" size="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Input */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Catat Realisasi Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Tanggal</label>
                <input type="date" className="form-input" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Keterangan / Uraian</label>
                <input type="text" className="form-input" required value={formData.uraian} onChange={e => setFormData({...formData, uraian: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Nominal Realisasi</label>
                <input type="number" className="form-input" required min="1" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Simpan Realisasi</span>
                </button>
              </div>
            </form>
          </div>
          
          {/* History */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Riwayat Realisasi</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loadingRealisasi ? (
                <div className="text-center text-sm text-slate-400 py-4">Memuat riwayat...</div>
              ) : realisasiList.length === 0 ? (
                <EmptyState title="Belum ada riwayat" description="Data realisasi yang Anda masukkan akan muncul di sini." />
              ) : (
                realisasiList.map((r, i) => (
                  <div key={r.id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDateID(r.tanggal)}</p>
                      <p className="text-sm font-semibold text-slate-700">{r.uraian}</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">{formatRupiah(r.nominal)}</p>
                    </div>
                    <button onClick={() => handleDeleteRealisasi(r.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-500">Total Anggaran:</span>
                <span className="font-bold text-slate-800">{formatRupiah(selectedAnggaran?.jumlah || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Sisa Anggaran:</span>
                <span className="font-bold text-amber-600">{formatRupiah(selectedAnggaran?.sisa_anggaran || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
