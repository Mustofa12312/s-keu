import { useState, useEffect } from 'react'
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { transaksiService, instansiService, pengaturanService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel } from '../../utils/hijriyah'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function PerbandinganTahunanPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState(isSuperAdmin ? '' : instansiId || '')
  
  const [tahun1, setTahun1] = useState('')
  const [tahun2, setTahun2] = useState('')
  const [jenisData, setJenisData] = useState('saldo') // 'saldo', 'masuk', 'keluar'
  
  const [loading, setLoading] = useState(false)
  const [dataTahun1, setDataTahun1] = useState({})
  const [dataTahun2, setDataTahun2] = useState({})
  
  const [chartData, setChartData] = useState([])
  const [summary, setSummary] = useState({ t1: 0, t2: 0, diff: 0, percent: 0 })

  // 1. Initial Load: Get Settings & Instansi
  useEffect(() => {
    async function init() {
      try {
        const set = await pengaturanService.get()
        const currentYear = parseInt(set?.tahun_aktif) || 1446
        setTahun1((currentYear - 1).toString())
        setTahun2(currentYear.toString())
        
        if (isSuperAdmin) {
          const inst = await instansiService.getAll()
          setInstansiList(inst)
        }
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [isSuperAdmin])

  // 2. Load Data on Filter Change
  useEffect(() => {
    if (!tahun1 || !tahun2) return
    
    // Validate instansi selection for super admin
    if (isSuperAdmin && !selectedInstansi) {
      // Tunggu dipilih
      setChartData([])
      return
    }

    async function loadData() {
      setLoading(true)
      try {
        const targetInstansi = selectedInstansi
        
        const [resTahun1, resTahun2] = await Promise.all([
          transaksiService.getAggregatedMonthlyData(targetInstansi, tahun1),
          transaksiService.getAggregatedMonthlyData(targetInstansi, tahun2)
        ])
        
        setDataTahun1(resTahun1)
        setDataTahun2(resTahun2)
        
        // Transform for Recharts
        let t1Total = 0
        let t2Total = 0
        
        const formatted = BULAN_HIJRIYAH.map(bulanKey => {
          const t1Val = resTahun1[bulanKey][jenisData] || 0
          const t2Val = resTahun2[bulanKey][jenisData] || 0
          
          t1Total += t1Val
          t2Total += t2Val
          
          return {
            name: getBulanLabel(bulanKey).substring(0, 3), // e.g. "Muh", "Sha"
            bulanFull: getBulanLabel(bulanKey),
            [tahun1]: t1Val,
            [tahun2]: t2Val
          }
        })
        
        setChartData(formatted)
        
        const diff = t2Total - t1Total
        let percent = 0
        if (t1Total !== 0) {
          percent = (diff / Math.abs(t1Total)) * 100
        } else if (t2Total > 0) {
          percent = 100
        } else if (t2Total < 0) {
          percent = -100
        }

        setSummary({ t1: t1Total, t2: t2Total, diff, percent })
        
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [tahun1, tahun2, selectedInstansi, jenisData, isSuperAdmin])


  const getTitleData = () => {
    if (jenisData === 'masuk') return 'Total Pemasukan'
    if (jenisData === 'keluar') return 'Total Pengeluaran'
    return 'Total Saldo'
  }
  const getIconData = () => {
    if (jenisData === 'masuk') return ArrowTrendingUpIcon
    if (jenisData === 'keluar') return ArrowTrendingDownIcon
    return ArrowsRightLeftIcon
  }
  const IconData = getIconData()

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-brand-600" />
            Perbandingan Tahunan
          </h1>
          <p className="text-sm text-slate-500 mt-1">Analisis perkembangan tren keuangan dari tahun ke tahun.</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {isSuperAdmin && (
            <div className="flex-1">
              <label className="label">Pilih Instansi</label>
              <select 
                className="input" 
                value={selectedInstansi} 
                onChange={e => setSelectedInstansi(e.target.value)}
              >
                <option value="">-- Pilih Instansi --</option>
                {instansiList.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.nama_instansi}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="w-full sm:w-32">
            <label className="label">Tahun Pembanding</label>
            <input 
              type="text" 
              className="input font-mono" 
              value={tahun1} 
              onChange={e => setTahun1(e.target.value)} 
              placeholder="1445" 
            />
          </div>
          
          <div className="flex items-center pb-2 px-1 text-slate-400 font-bold">
            vs
          </div>
          
          <div className="w-full sm:w-32">
            <label className="label">Tahun Analisis</label>
            <input 
              type="text" 
              className="input font-mono" 
              value={tahun2} 
              onChange={e => setTahun2(e.target.value)} 
              placeholder="1446" 
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="label">Metrik</label>
            <select className="input" value={jenisData} onChange={e => setJenisData(e.target.value)}>
              <option value="saldo">Saldo Netto</option>
              <option value="masuk">Pemasukan Saja</option>
              <option value="keluar">Pengeluaran Saja</option>
            </select>
          </div>
        </div>
      </div>

      {(isSuperAdmin && !selectedInstansi) ? (
        <div className="card p-10 text-center text-slate-500">
          <ChartBarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Pilih instansi terlebih dahulu untuk melihat perbandingan tahunan.</p>
        </div>
      ) : loading ? (
        <div className="card p-10 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Menghitung Data Tahunan...</p>
        </div>
      ) : chartData.length > 0 ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card p-5 border-l-4 border-l-slate-300">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{getTitleData()} ({tahun1} H)</p>
              <p className="text-xl font-bold text-slate-700 text-money">{formatRupiah(summary.t1)}</p>
            </div>
            <div className="card p-5 border-l-4 border-l-brand-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{getTitleData()} ({tahun2} H)</p>
              <p className="text-xl font-bold text-brand-700 text-money">{formatRupiah(summary.t2)}</p>
            </div>
            <div className={`card p-5 border-l-4 ${summary.diff >= 0 ? 'border-l-emerald-500 bg-emerald-50/50' : 'border-l-red-500 bg-red-50/50'}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pertumbuhan (Growth)</p>
              <div className="flex items-center gap-2">
                <IconData className={`w-6 h-6 ${summary.diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
                <p className={`text-xl font-bold text-money ${summary.diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {summary.diff > 0 ? '+' : ''}{summary.percent.toFixed(2)}%
                </p>
              </div>
              <p className={`text-xs mt-1 ${summary.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.diff >= 0 ? 'Naik' : 'Turun'} sebesar {formatRupiah(Math.abs(summary.diff))}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-6 pb-2">
            <h3 className="text-sm font-bold text-slate-800 mb-6">Grafik {getTitleData()} Bulanan</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    tickFormatter={(value) => `Rp ${(value/1000000).toFixed(0)}M`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatRupiah(value)]}
                    labelFormatter={(label, payload) => payload[0]?.payload?.bulanFull || label}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey={tahun1} name={`Tahun ${tahun1} H`} fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey={tahun2} name={`Tahun ${tahun2} H`} fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Details */}
          <div className="card overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Tabel Rincian Bulanan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Bulan (Hijriyah)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 text-money">{tahun1} H</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 text-money">{tahun2} H</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600 text-money">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map((row) => {
                    const diff = row[tahun2] - row[tahun1];
                    return (
                      <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-slate-700 font-medium">{row.bulanFull}</td>
                        <td className="px-4 py-3 text-right text-slate-600 text-money">{formatRupiah(row[tahun1])}</td>
                        <td className="px-4 py-3 text-right text-brand-700 font-semibold text-money">{formatRupiah(row[tahun2])}</td>
                        <td className={`px-4 py-3 text-right font-bold text-money ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {diff > 0 ? '+' : ''}{formatRupiah(diff)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td className="px-4 py-3 text-slate-800">TOTAL</td>
                    <td className="px-4 py-3 text-right text-slate-700 text-money">{formatRupiah(summary.t1)}</td>
                    <td className="px-4 py-3 text-right text-brand-700 text-money">{formatRupiah(summary.t2)}</td>
                    <td className={`px-4 py-3 text-right text-money ${summary.diff > 0 ? 'text-emerald-600' : summary.diff < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                       {summary.diff > 0 ? '+' : ''}{formatRupiah(summary.diff)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
