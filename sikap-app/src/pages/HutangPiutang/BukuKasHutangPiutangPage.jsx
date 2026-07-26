// ============================================================
// src/pages/HutangPiutang/BukuKasHutangPiutangPage.jsx
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { hutangService, instansiService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { formatRupiah } from '../../utils/formatRupiah'
import EmptyState from '../../components/ui/EmptyState'

export default function BukuKasHutangPiutangPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [instansiList, setInstansiList] = useState([])
  const [filterInstansi, setFilterInstansi] = useState(instansiId || '')
  
  const [loading, setLoading] = useState(false)
  const [mutasi, setMutasi] = useState([])

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const id = isSuperAdmin ? (filterInstansi || null) : instansiId
        
        // 1. Ambil semua Hutang & Piutang (sebagai saldo awal pencairan)
        const allHutang = await hutangService.getAll({ instansiId: id, jenis: 'hutang' })
        const allPiutang = await hutangService.getAll({ instansiId: id, jenis: 'piutang' })
        
        let allMutasi = []

        // Fungsi bantu untuk mengambil pembayaran
        async function fetchPembayaran(indukList, jenis) {
          for (const induk of indukList) {
            // Masukkan pencairan induk sebagai mutasi
            allMutasi.push({
              id: induk.id + '_induk',
              tanggal: induk.tanggal || '',
              keterangan: `Pencairan ${jenis === 'hutang' ? 'Hutang dari' : 'Piutang ke'} ${induk.nama_pihak}`,
              jenis_transaksi: jenis === 'hutang' ? 'masuk' : 'keluar', // Hutang = dapat uang, Piutang = ngeluarin uang
              nominal: induk.nominal_total,
              referensi: induk.nama_pihak,
              kategori: jenis
            })

            // Ambil pembayaran
            const pemb = await hutangService.getPembayaran(induk.id)
            pemb.forEach(p => {
              allMutasi.push({
                id: p.id,
                tanggal: p.tanggal || '',
                keterangan: `Pembayaran ${jenis === 'hutang' ? 'Hutang ke' : 'Piutang dari'} ${induk.nama_pihak} (${p.keterangan || ''})`,
                jenis_transaksi: jenis === 'hutang' ? 'keluar' : 'masuk', // Bayar hutang = keluar uang, Terima piutang = masuk uang
                nominal: p.nominal,
                referensi: induk.nama_pihak,
                kategori: `bayar_${jenis}`
              })
            })
          }
        }

        await fetchPembayaran(allHutang, 'hutang')
        await fetchPembayaran(allPiutang, 'piutang')

        // Urutkan berdasarkan tanggal terlama ke terbaru
        allMutasi.sort((a, b) => {
          const dateA = a.tanggal || ''
          const dateB = b.tanggal || ''
          if (dateA < dateB) return -1
          if (dateA > dateB) return 1
          return 0
        })

        setMutasi(allMutasi)
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [filterInstansi, instansiId, isSuperAdmin])

  const { totalMasuk, totalKeluar } = useMemo(() => {
    let masuk = 0, keluar = 0
    mutasi.forEach(m => {
      if (m.jenis_transaksi === 'masuk') masuk += m.nominal
      else keluar += m.nominal
    })
    return { totalMasuk: masuk, totalKeluar: keluar }
  }, [mutasi])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Buku Kas Hutang Piutang</h1>
        <button onClick={() => window.print()} className="btn-secondary flex gap-2">
          <PrinterIcon className="w-4 h-4" /> Cetak
        </button>
      </div>

      <div className="card p-4 bg-white flex gap-4 items-end">
        {isSuperAdmin && (
          <div className="flex-1 max-w-xs">
            <label className="label">Filter Instansi</label>
            <select className="input" value={filterInstansi} onChange={e => setFilterInstansi(e.target.value)}>
              <option value="">-- Semua Instansi --</option>
              {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Total Uang Masuk</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatRupiah(totalMasuk)}</p>
          <p className="text-[10px] text-emerald-600/80 mt-1">(Dari pencairan hutang & penerimaan piutang)</p>
        </div>
        <div className="card p-4 bg-red-50 border border-red-100">
          <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Total Uang Keluar</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatRupiah(totalKeluar)}</p>
          <p className="text-[10px] text-red-600/80 mt-1">(Untuk pencairan piutang & pembayaran hutang)</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Menyusun buku kas...</div>
          ) : mutasi.length === 0 ? (
            <EmptyState title="Belum ada mutasi" description="Data pencairan dan pembayaran akan muncul di sini." />
          ) : (
            <table className="tbl print:text-xs">
              <thead>
                <tr>
                  <th className="w-8">No</th>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Pihak Terkait</th>
                  <th className="text-right">Masuk (Rp)</th>
                  <th className="text-right">Keluar (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.map((row, i) => {
                  const isMasuk = row.jenis_transaksi === 'masuk'
                  return (
                    <tr key={row.id}>
                      <td className="text-slate-400">{i + 1}</td>
                      <td className="whitespace-nowrap">{row.tanggal || '-'}</td>
                      <td>{row.keterangan}</td>
                      <td><span className="badge-blue">{row.referensi}</span></td>
                      <td className="text-right font-mono text-emerald-600">{isMasuk ? formatRupiah(row.nominal) : '-'}</td>
                      <td className="text-right font-mono text-red-600">{!isMasuk ? formatRupiah(row.nominal) : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
