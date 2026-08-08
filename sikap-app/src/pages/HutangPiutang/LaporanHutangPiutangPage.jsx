// ============================================================
// src/pages/HutangPiutang/LaporanHutangPiutangPage.jsx
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { hutangService, instansiService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { formatRupiah } from '../../utils/formatRupiah'

export default function LaporanHutangPiutangPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [instansiList, setInstansiList] = useState([])
  const [filterInstansi, setFilterInstansi] = useState(instansiId || '')
  const [loading, setLoading] = useState(false)
  const [hutangList, setHutangList] = useState([])
  const [piutangList, setPiutangList] = useState([])

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const id = isSuperAdmin ? (filterInstansi || null) : instansiId
        const h = await hutangService.getAll({ instansiId: id, jenis: 'hutang' })
        const p = await hutangService.getAll({ instansiId: id, jenis: 'piutang' })
        setHutangList(h)
        setPiutangList(p)
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [filterInstansi, instansiId, isSuperAdmin])

  const rekapHutang = useMemo(() => {
    let pinjaman = 0, dibayar = 0
    hutangList.forEach(r => { pinjaman += (r.nominal_total||0); dibayar += (r.nominal_dibayar||0) })
    return { pinjaman, dibayar, sisa: pinjaman - dibayar }
  }, [hutangList])

  const rekapPiutang = useMemo(() => {
    let pinjaman = 0, dibayar = 0
    piutangList.forEach(r => { pinjaman += (r.nominal_total||0); dibayar += (r.nominal_dibayar||0) })
    return { pinjaman, dibayar, sisa: pinjaman - dibayar }
  }, [piutangList])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-slate-800">Laporan Hutang & Piutang</h1>
        <button onClick={() => window.print()} className="btn-primary flex gap-2">
          <PrinterIcon className="w-4 h-4" /> Cetak Laporan
        </button>
      </div>

      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">Laporan Rekapitulasi Hutang & Piutang</h1>
        <p className="text-sm">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <div className="card p-4 bg-white flex gap-4 items-end print:hidden">
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

      {loading ? (
        <div className="py-16 text-center text-slate-400">Menyusun laporan...</div>
      ) : (
        <div className="space-y-6">
          {/* Laporan Hutang */}
          <div className="card p-5 border-t-4 border-red-500">
            <h2 className="text-lg font-bold text-slate-800 mb-4">A. Rekapitulasi Hutang (Kewajiban)</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Pinjaman</p>
                <p className="text-lg font-mono font-bold text-slate-800">{formatRupiah(rekapHutang.pinjaman)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-600 font-bold uppercase">Sudah Dibayar</p>
                <p className="text-lg font-mono font-bold text-emerald-700">{formatRupiah(rekapHutang.dibayar)}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-xs text-red-600 font-bold uppercase">Sisa Kewajiban</p>
                <p className="text-lg font-mono font-bold text-red-700">{formatRupiah(rekapHutang.sisa)}</p>
              </div>
            </div>
            {hutangList.length > 0 && (
              <table className="tbl print:text-xs">
                <thead>
                  <tr>
                    <th>Kreditur</th>
                    <th className="text-right">Total Pinjaman</th>
                    <th className="text-right">Telah Dibayar</th>
                    <th className="text-right">Sisa Hutang</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hutangList.map(h => (
                    <tr key={h.id}>
                      <td className="font-semibold">{h.nama_pihak}</td>
                      <td className="text-right">{formatRupiah(h.nominal_total)}</td>
                      <td className="text-right text-emerald-600">{formatRupiah(h.nominal_dibayar || 0)}</td>
                      <td className="text-right text-red-600 font-bold">{formatRupiah((h.nominal_total||0) - (h.nominal_dibayar||0))}</td>
                      <td className="text-center">
                        <span className={h.status === 'lunas' ? 'badge-green' : 'badge-orange'}>{h.status === 'lunas' ? 'LUNAS' : 'BELUM'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Laporan Piutang */}
          <div className="card p-5 border-t-4 border-blue-500">
            <h2 className="text-lg font-bold text-slate-800 mb-4">B. Rekapitulasi Piutang (Tagihan)</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Dipinjamkan</p>
                <p className="text-lg font-mono font-bold text-slate-800">{formatRupiah(rekapPiutang.pinjaman)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-bold uppercase">Sudah Diterima</p>
                <p className="text-lg font-mono font-bold text-blue-700">{formatRupiah(rekapPiutang.dibayar)}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 font-bold uppercase">Sisa Tagihan</p>
                <p className="text-lg font-mono font-bold text-amber-700">{formatRupiah(rekapPiutang.sisa)}</p>
              </div>
            </div>
            {piutangList.length > 0 && (
              <table className="tbl print:text-xs">
                <thead>
                  <tr>
                    <th>Debitur</th>
                    <th className="text-right">Total Pinjaman</th>
                    <th className="text-right">Telah Diterima</th>
                    <th className="text-right">Sisa Tagihan</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {piutangList.map(h => (
                    <tr key={h.id}>
                      <td className="font-semibold">{h.nama_pihak}</td>
                      <td className="text-right">{formatRupiah(h.nominal_total)}</td>
                      <td className="text-right text-blue-600">{formatRupiah(h.nominal_dibayar || 0)}</td>
                      <td className="text-right text-amber-600 font-bold">{formatRupiah((h.nominal_total||0) - (h.nominal_dibayar||0))}</td>
                      <td className="text-center">
                        <span className={h.status === 'lunas' ? 'badge-green' : 'badge-orange'}>{h.status === 'lunas' ? 'LUNAS' : 'BELUM'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
