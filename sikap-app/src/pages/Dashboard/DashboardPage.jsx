// ============================================================
// src/pages/Dashboard/DashboardPage.jsx
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import StatCard from '../../components/ui/StatCard'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel } from '../../utils/hijriyah'
import { transaksiService, instansiService, pengaturanService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{formatRupiah(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { isSuperAdmin, instansiId, profile } = useAuth()
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [tahun, setTahun] = useState('')
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('area')
  const [summaryData, setSummaryData] = useState([])
  const [recentData, setRecentData] = useState([])
  const [initialized, setInitialized] = useState(false)

  // Update selectedInstansi saat profile selesai dimuat
  useEffect(() => {
    if (instansiId && !selectedInstansi) setSelectedInstansi(instansiId)
  }, [instansiId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch settings + instansi — langsung saat mount, TIDAK tunggu profile
  // Profile berjalan di background (AuthContext), tidak perlu diblok di sini
  useEffect(() => {
    let mounted = true
    setLoading(true)

    Promise.all([
      pengaturanService.getSettings().catch(() => ({})),
      // getAll instansi hanya relevan untuk super_admin,
      // tapi kita tidak bisa cek isSuperAdmin sebelum profile dimuat.
      // Solusi: fetch saja, nanti di-render hanya jika isSuperAdmin true.
      instansiService.getAll().catch(() => []),
    ]).then(([settings, instansiData]) => {
      if (!mounted) return
      const activeTahun = settings?.tahun_aktif || '1446'
      setInstansiList(instansiData)
      setTahun(prev => prev || activeTahun)
      setInitialized(activeTahun)
    })

    return () => { mounted = false }
  }, []) // fetch sekali saat mount — tidak perlu deps lain

  // Fetch data transaksi HANYA setelah tahun aktif diketahui
  useEffect(() => {
    if (!initialized) return

    let mounted = true
    setLoading(true)
    // Untuk non-super_admin gunakan instansiId dari profile
    // Untuk super_admin gunakan filter pilihan (bisa null = semua)
    const id = isSuperAdmin ? (selectedInstansi || null) : instansiId
    const activeTahun = tahun || initialized

    Promise.all([
      transaksiService.getSummary(id, activeTahun),
      transaksiService.getAll({ instansiId: id, tahunHijriyah: activeTahun, limit: 10, orderDesc: true }),
    ])
      .then(([summary, recent]) => {
        if (!mounted) return
        setSummaryData(summary || [])
        setRecentData(recent || [])
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [selectedInstansi, instansiId, isSuperAdmin, tahun, initialized])

  const stats = useMemo(() => {
    const pem = summaryData.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + (t.nominal || 0), 0)
    const pen = summaryData.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + (t.nominal || 0), 0)
    return { pemasukan: pem, pengeluaran: pen, saldo: pem - pen }
  }, [summaryData])

  const chartData = useMemo(() => {
    return BULAN_HIJRIYAH.map(bulan => {
      const data = summaryData.filter(t => t.bulan_hijriyah === bulan)
      const pem = data.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + (t.nominal || 0), 0)
      const pen = data.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + (t.nominal || 0), 0)
      return { name: getBulanLabel(bulan).substring(0, 8), pem, pen, saldo: pem - pen, count: data.length }
    }).filter(d => d.pem > 0 || d.pen > 0)
  }, [summaryData])

  const recent = useMemo(() =>
    [...recentData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8),
    [recentData]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display">Ringkasan Keuangan</h2>
          <p className="text-sm text-slate-500">Tahun Hijriyah {tahun}H · {summaryData.length} transaksi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            className="input w-24 text-center"
            value={tahun}
            onChange={e => setTahun(e.target.value)}
            placeholder="1446"
          />
          {isSuperAdmin && (
            <select
              className="input w-48"
              value={selectedInstansi}
              onChange={e => setSelectedInstansi(e.target.value)}
            >
              <option value="">Semua Instansi</option>
              {instansiList.map(i => (
                <option key={i.id} value={i.id}>{i.nama_instansi}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="card p-5 h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={ArrowTrendingUpIcon}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            label="Total Pemasukan"
            value={formatRupiah(stats.pemasukan)}
            sub={`${summaryData.filter(t => t.jenis === 'pemasukan').length} transaksi`}
          />
          <StatCard
            icon={ArrowTrendingDownIcon}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            label="Total Pengeluaran"
            value={formatRupiah(stats.pengeluaran)}
            sub={`${summaryData.filter(t => t.jenis === 'pengeluaran').length} transaksi`}
          />
          <StatCard
            icon={ScaleIcon}
            iconBg={stats.saldo >= 0 ? 'bg-blue-50' : 'bg-amber-50'}
            iconColor={stats.saldo >= 0 ? 'text-blue-600' : 'text-amber-600'}
            label="Saldo Akhir"
            value={formatRupiah(stats.saldo)}
            sub="Pemasukan – Pengeluaran"
          />
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-800 font-display">Grafik Per Bulan Hijriyah</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tren penerimaan dan pengeluaran tahun {tahun}H</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-md transition ${chartType === 'area' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-md transition ${chartType === 'bar' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Batang
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradPen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}jt` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}rb` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '12px' }} />
                <Area type="monotone" dataKey="pem" name="Pemasukan" stroke="#10b981" strokeWidth={2.5} fill="url(#gradPem)" dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="pen" name="Pengeluaran" stroke="#f87171" strokeWidth={2.5} fill="url(#gradPen)" dot={{ r: 4, fill: '#f87171' }} activeDot={{ r: 6 }} />
              </AreaChart>
            ) : (
              <BarChart data={chartData} barGap={4} barCategoryGap="30%" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}jt` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}rb` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '12px' }} />
                <Bar dataKey="pem" name="Pemasukan" fill="#10b981" radius={[5, 5, 0, 0]} />
                <Bar dataKey="pen" name="Pengeluaran" fill="#f87171" radius={[5, 5, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {!loading && chartData.length === 0 && (
        <div className="card p-8 text-center text-slate-400">
          <BanknotesIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada data transaksi untuk tahun {tahun}H</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rekap per bulan */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 font-display">Rekap Per Bulan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th className="text-right">Penerimaan</th>
                  <th className="text-right">Pengeluaran</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {BULAN_HIJRIYAH.map(bulan => {
                  const rows = summaryData.filter(t => t.bulan_hijriyah === bulan)
                  const pem = rows.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
                  const pen = rows.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)
                  if (pem === 0 && pen === 0) return null
                  return (
                    <tr key={bulan}>
                      <td className="font-medium">{getBulanLabel(bulan)}</td>
                      <td className="text-right text-emerald-600 text-money">{formatRupiah(pem)}</td>
                      <td className="text-right text-red-500 text-money">{formatRupiah(pen)}</td>
                      <td className={`text-right text-money font-semibold ${pem - pen >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{formatRupiah(pem - pen)}</td>
                    </tr>
                  )
                })}
                {summaryData.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">Belum ada data transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-700 font-display">Transaksi Terbaru</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">Belum ada transaksi</p>
            )}
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.jenis === 'pemasukan' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {t.jenis === 'pemasukan'
                    ? <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" />
                    : <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.uraian || '-'}</p>
                  <p className="text-xs text-slate-400">{t.tanggal || ''} · {getBulanLabel(t.bulan_hijriyah)}</p>
                </div>
                <span className={`text-sm font-semibold text-money flex-shrink-0 ${t.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.jenis === 'pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
