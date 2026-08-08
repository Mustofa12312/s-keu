// ============================================================
// src/pages/Laporan/LaporanPage.jsx
// Laporan Harian, Bulanan, Tahunan, Per Instansi, Rekap Semua
// react-to-print v3 (contentRef), server-side date filter
// ============================================================
import { useState, useEffect, useMemo, useRef } from 'react'
import { PrinterIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { usePrint } from '../../hooks/usePrint'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel } from '../../utils/hijriyah'
import { transaksiService, instansiService, pengaturanService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { exportLaporanPDF } from '../../utils/exportPDF'
import * as XLSX from 'xlsx'

const JENIS_LIST = [
  { value: 'harian',   label: 'Laporan Harian' },
  { value: 'bulanan',  label: 'Laporan Bulanan' },
  { value: 'tahunan',  label: 'Laporan Tahunan' },
  { value: 'instansi', label: 'Per Instansi',        superAdminOnly: false },
  { value: 'rekap',    label: 'Rekap Semua Instansi', superAdminOnly: true },
]

// ─── Summary Cards ───────────────────────────────────────────
function SummaryCards({ pem, pen, saldo }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-5">
      {[
        { label: 'Total Penerimaan', val: pem,  cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        { label: 'Total Pengeluaran', val: pen, cls: 'text-red-500',     bg: 'bg-red-50 border-red-100' },
        { label: 'Saldo Akhir', val: saldo,
          cls: saldo >= 0 ? 'text-blue-600' : 'text-amber-600',
          bg: saldo >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100' },
      ].map(({ label, val, cls, bg }) => (
        <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-base font-bold text-money ${cls}`}>{formatRupiah(val)}</p>
        </div>
      ))}
    </div>
  )
}

export default function LaporanPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [transaksi, setTransaksi]       = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [rekapData, setRekapData]       = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState(isSuperAdmin ? '' : instansiId || '')
  const [jenis, setJenis]               = useState('bulanan')
  const [filterBulan, setFilterBulan]   = useState(BULAN_HIJRIYAH[0])
  const [tahun, setTahun]               = useState('1446')
  const [tglMulai, setTglMulai]         = useState('')
  const [tglAkhir, setTglAkhir]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [settings, setSettings]         = useState(null)
  const printRef = useRef()

  // react-to-print v3
  const handlePrint = usePrint(printRef, `Laporan_${jenis}_${tahun}`)

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
    if (!isSuperAdmin) setSelectedInstansi(instansiId || '')

    pengaturanService.getSettings().then(s => {
      setSettings(s)
      if (s?.tahun_aktif) setTahun(s.tahun_aktif)
    }).catch(console.error)
  }, [isSuperAdmin, instansiId])

  async function loadTransaksi() {
    setLoading(true)
    try {
      const id = isSuperAdmin ? (selectedInstansi || null) : instansiId
      const data = await transaksiService.getAll({
        instansiId:    id,
        bulanHijriyah: jenis === 'bulanan' ? filterBulan : null,
        tahunHijriyah: tahun || null,
        tglMulai:      jenis === 'harian' && tglMulai ? tglMulai : null,
        tglAkhir:      jenis === 'harian' && tglAkhir ? tglAkhir : null,
      })
      setTransaksi(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadRekap() {
    if (!isSuperAdmin) return
    setLoading(true)
    try {
      const ins = await instansiService.getAll()
      setInstansiList(ins)
      const results = await Promise.all(ins.map(async i => {
        const txn = await transaksiService.getAll({ instansiId: i.id, tahunHijriyah: tahun || null })
        const pem = txn.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
        const pen = txn.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)
        return { ...i, pem, pen, saldo: pem - pen, count: txn.length }
      }))
      setRekapData(results)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    jenis === 'rekap' ? loadRekap() : loadTransaksi()
  }, [jenis, filterBulan, selectedInstansi, tahun, tglMulai, tglAkhir, instansiId, isSuperAdmin]) // eslint-disable-line

  // ─── Computed values ──────────────────────────────────────
  const summary = useMemo(() => {
    const pem = transaksi.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
    const pen = transaksi.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)
    return { pem, pen, saldo: pem - pen, count: transaksi.length }
  }, [transaksi])

  const rekapSummary = useMemo(() => ({
    pem:   rekapData.reduce((s, r) => s + r.pem, 0),
    pen:   rekapData.reduce((s, r) => s + r.pen, 0),
    saldo: rekapData.reduce((s, r) => s + r.saldo, 0),
    count: rekapData.reduce((s, r) => s + r.count, 0),
  }), [rekapData])

  // Kelompokkan per bulan (untuk tahunan/instansi) atau per tanggal (harian)
  const grouped = useMemo(() => {
    if (jenis === 'harian') {
      const map = {}
      transaksi.forEach(t => {
        const k = t.tanggal || '(tanpa tanggal)'
        if (!map[k]) map[k] = { label: k, pem: 0, pen: 0, count: 0 }
        if (t.jenis === 'pemasukan') map[k].pem += t.nominal
        else map[k].pen += t.nominal
        map[k].count++
      })
      return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
        .map(([,v]) => ({ ...v, saldo: v.pem - v.pen }))
    }
    return BULAN_HIJRIYAH.map(b => {
      const rows = transaksi.filter(t => t.bulan_hijriyah === b)
      const pem = rows.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0)
      const pen = rows.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0)
      return { label: getBulanLabel(b), pem, pen, saldo: pem - pen, count: rows.length }
    }).filter(b => b.count > 0)
  }, [transaksi, jenis])

  // ─── Export handlers ─────────────────────────────────────
  function getPeriodeLabel() {
    if (jenis === 'harian') return tglMulai ? `${tglMulai} s/d ${tglAkhir || 'sekarang'}` : `Tahun ${tahun}H`
    if (jenis === 'bulanan') return getBulanLabel(filterBulan)
    return `Tahun ${tahun}H`
  }

  function handleExportPDF() {
    const instansiNama = instansiList.find(i => i.id === selectedInstansi)?.nama_instansi || (isSuperAdmin ? 'Semua Instansi' : '')
    if (jenis === 'rekap') {
      exportLaporanPDF({
        bulanSummary: rekapData.map(r => ({ label: r.nama_instansi, pem: r.pem, pen: r.pen, saldo: r.saldo, count: r.count })),
        summary: rekapSummary,
        instansiNama: 'Semua Instansi',
        jenis, filterLabel: `Tahun ${tahun}H`, tahun, settings
      })
    } else {
      exportLaporanPDF({ bulanSummary: grouped, summary, instansiNama, jenis, filterLabel: getPeriodeLabel(), tahun, settings })
    }
  }

  function handleExportExcel() {
    const wb = XLSX.utils.book_new()
    if (jenis === 'rekap') {
      const rows = [
        ['REKAP KEUANGAN SEMUA INSTANSI'], [`Tahun: ${tahun}H`], [],
        ['No','Instansi','Kode','Penerimaan (Rp)','Pengeluaran (Rp)','Saldo (Rp)','Transaksi'],
        ...rekapData.map((r,i) => [i+1, r.nama_instansi, r.kode_instansi, r.pem, r.pen, r.saldo, r.count]),
        [], ['','TOTAL','', rekapSummary.pem, rekapSummary.pen, rekapSummary.saldo, rekapSummary.count],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Rekap')
    } else {
      const rows = [
        ['LAPORAN KEUANGAN'], [getPeriodeLabel()], [],
        ['No','Periode','Penerimaan (Rp)','Pengeluaran (Rp)','Saldo (Rp)','Transaksi'],
        ...grouped.map((b,i) => [i+1, b.label, b.pem, b.pen, b.saldo, b.count]),
        [], ['','JUMLAH', summary.pem, summary.pen, summary.saldo, summary.count],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Laporan')

      // Sheet detail transaksi untuk laporan harian
      if (jenis === 'harian' && transaksi.length > 0) {
        const detail = [
          ['No','Tanggal','Tgl Hijriyah','Uraian','Sumber Dana','Penerimaan','Pengeluaran'],
          ...transaksi.map((t,i) => [
            i+1, t.tanggal||'', t.tanggal_hijriyah||'', t.uraian, t.sumber_dana||'',
            t.jenis==='pemasukan'?t.nominal:'',
            t.jenis==='pengeluaran'?t.nominal:'',
          ]),
        ]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detail), 'Detail')
      }
    }
    XLSX.writeFile(wb, `Laporan_${jenis}_${tahun}.xlsx`)
  }

  const jenisLabel = JENIS_LIST.find(j => j.value === jenis)?.label || jenis

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ─── Filter Toolbar ─── */}
      <div className="no-print card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Jenis laporan */}
          <div>
            <label className="label">Jenis Laporan</label>
            <select className="input w-44" value={jenis} onChange={e => setJenis(e.target.value)}>
              {JENIS_LIST.filter(j => !j.superAdminOnly || isSuperAdmin).map(j => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Harian: date range */}
          {jenis === 'harian' && (
            <>
              <div>
                <label className="label">Dari Tanggal</label>
                <input type="date" className="input w-40" value={tglMulai}
                  onChange={e => setTglMulai(e.target.value)} />
              </div>
              <div>
                <label className="label">Sampai Tanggal</label>
                <input type="date" className="input w-40" value={tglAkhir}
                  onChange={e => setTglAkhir(e.target.value)} />
              </div>
            </>
          )}

          {/* Bulanan: pilih bulan */}
          {jenis === 'bulanan' && (
            <div>
              <label className="label">Bulan Hijriyah</label>
              <select className="input w-44" value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}>
                {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
              </select>
            </div>
          )}

          {/* Tahun */}
          <div>
            <label className="label">Tahun Hijriyah</label>
            <input type="text" className="input w-24" value={tahun}
              onChange={e => setTahun(e.target.value)} placeholder="1446" />
          </div>

          {/* Instansi (super admin, kecuali rekap semua) */}
          {isSuperAdmin && jenis !== 'rekap' && (
            <div>
              <label className="label">Instansi</label>
              <select className="input w-48" value={selectedInstansi}
                onChange={e => setSelectedInstansi(e.target.value)}>
                <option value="">Semua Instansi</option>
                {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 ml-auto flex-wrap">
            <button onClick={handleExportExcel} className="btn-secondary">
              <ArrowDownTrayIcon className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="btn-secondary">
              <DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </button>
            <button onClick={handlePrint} id="btn-print-laporan" className="btn-primary">
              <PrinterIcon className="w-4 h-4" /> Print A4
            </button>
          </div>
        </div>
      </div>

      {/* ─── REKAP SEMUA INSTANSI ─── */}
      {jenis === 'rekap' && (
        <div ref={printRef} className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 font-display">Rekap Keuangan Semua Instansi</h2>
            <p className="text-sm text-slate-500">Tahun Hijriyah {tahun}H</p>
          </div>
          <SummaryCards pem={rekapSummary.pem} pen={rekapSummary.pen} saldo={rekapSummary.saldo} />
          <div className="overflow-x-auto px-5 pb-5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat rekap semua instansi...
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>No</th><th>Instansi</th><th>Kode</th>
                    <th className="text-right">Penerimaan</th>
                    <th className="text-right">Pengeluaran</th>
                    <th className="text-right">Saldo</th>
                    <th className="text-center">Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapData.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Belum ada data</td></tr>
                  ) : (
                    <>
                      {rekapData.map((r, i) => (
                        <tr key={r.id}>
                          <td className="text-slate-400">{i+1}</td>
                          <td className="font-medium">{r.nama_instansi}</td>
                          <td><span className="badge-slate">{r.kode_instansi}</span></td>
                          <td className="text-right text-money text-emerald-600">{formatRupiah(r.pem)}</td>
                          <td className="text-right text-money text-red-500">{formatRupiah(r.pen)}</td>
                          <td className={`text-right text-money font-semibold ${r.saldo>=0?'text-blue-600':'text-amber-600'}`}>{formatRupiah(r.saldo)}</td>
                          <td className="text-center text-slate-500">{r.count}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <td colSpan={3} className="text-right pr-4 text-slate-700">TOTAL</td>
                        <td className="text-right text-money text-emerald-700">{formatRupiah(rekapSummary.pem)}</td>
                        <td className="text-right text-money text-red-600">{formatRupiah(rekapSummary.pen)}</td>
                        <td className={`text-right text-money ${rekapSummary.saldo>=0?'text-blue-700':'text-amber-700'}`}>{formatRupiah(rekapSummary.saldo)}</td>
                        <td className="text-center">{rekapSummary.count}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* TTD print */}
          <div className="hidden print:flex justify-between px-6 pb-6 mt-4">
            <div className="text-center text-sm">
              <p>Mengetahui,</p><p>Ketua Yayasan</p>
              <div className="mt-16 border-t border-black w-36 mx-auto pt-1"><p className="font-bold">{settings?.ketua_yayasan || 'K. KHOIRUS SHOLEH'}</p></div>
            </div>
            <div className="text-center text-sm">
              <p>Sampang, ....................... {tahun}H</p><p>Bendahara</p>
              <div className="mt-16 border-t border-black w-36 mx-auto pt-1"><p className="font-bold">{settings?.bendahara_pusat || '......................................'}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LAPORAN HARIAN / BULANAN / TAHUNAN / INSTANSI ─── */}
      {jenis !== 'rekap' && (
        <div ref={printRef} className="card overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="hidden print:block text-center mb-4">
              <h1 className="text-xl font-bold">LAPORAN KEUANGAN</h1>
              <p className="text-sm text-gray-500">{settings?.nama_yayasan || 'Pondok Pesantren Darur Rohman'}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-800 font-display">{jenisLabel}</h3>
                <p className="text-xs text-slate-500">
                  {getPeriodeLabel()} · Tahun {tahun}H
                  {selectedInstansi && ` · ${instansiList.find(i=>i.id===selectedInstansi)?.nama_instansi || ''}`}
                </p>
              </div>
              <span className={`badge text-xs ${jenis==='harian'?'badge-blue':jenis==='bulanan'?'badge-green':jenis==='tahunan'?'badge-amber':'badge-slate'}`}>
                {jenisLabel}
              </span>
            </div>
          </div>

          <SummaryCards pem={summary.pem} pen={summary.pen} saldo={summary.saldo} />

          {/* Rekap tabel */}
          <div className="px-5 pb-5">
            <h4 className="font-semibold text-slate-700 font-display mb-3 text-sm">
              {jenis === 'harian' ? 'Rekap Per Tanggal' : 'Rekap Per Bulan Hijriyah'}
            </h4>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <div className="w-7 h-7 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Memuat laporan...
                </div>
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>{jenis === 'harian' ? 'Tanggal' : 'Bulan'}</th>
                      <th className="text-right">Penerimaan</th>
                      <th className="text-right">Pengeluaran</th>
                      <th className="text-right">Saldo</th>
                      <th className="text-center">Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">Tidak ada data untuk periode ini</td></tr>
                    ) : (
                      <>
                        {grouped.map((b, i) => (
                          <tr key={i}>
                            <td className="text-slate-400">{i+1}</td>
                            <td className="font-medium">{b.label}</td>
                            <td className="text-right text-money text-emerald-600">{formatRupiah(b.pem)}</td>
                            <td className="text-right text-money text-red-500">{formatRupiah(b.pen)}</td>
                            <td className={`text-right text-money font-semibold ${b.saldo>=0?'text-blue-600':'text-amber-600'}`}>{formatRupiah(b.saldo)}</td>
                            <td className="text-center text-slate-500">{b.count}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td colSpan={2} className="text-right pr-4 text-slate-700">JUMLAH</td>
                          <td className="text-right text-money text-emerald-700">{formatRupiah(summary.pem)}</td>
                          <td className="text-right text-money text-red-600">{formatRupiah(summary.pen)}</td>
                          <td className={`text-right text-money ${summary.saldo>=0?'text-blue-700':'text-amber-700'}`}>{formatRupiah(summary.saldo)}</td>
                          <td className="text-center">{summary.count}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Detail transaksi (laporan harian saja) */}
            {jenis === 'harian' && !loading && transaksi.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-slate-700 font-display mb-3 text-sm">Detail Transaksi</h4>
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>No</th><th>Tanggal</th><th>Tgl Hijriyah</th>
                        <th>Uraian</th><th>Sumber Dana</th>
                        <th className="text-right">Penerimaan</th>
                        <th className="text-right">Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaksi.map((t, i) => (
                        <tr key={t.id}>
                          <td className="text-slate-400">{i+1}</td>
                          <td className="whitespace-nowrap">{t.tanggal||'-'}</td>
                          <td className="text-slate-500 whitespace-nowrap">{t.tanggal_hijriyah||'-'}</td>
                          <td className="max-w-xs font-medium">{t.uraian}</td>
                          <td className="text-slate-500">{t.sumber_dana||'-'}</td>
                          <td className="text-right text-money text-emerald-600">{t.jenis==='pemasukan'?formatRupiah(t.nominal):'-'}</td>
                          <td className="text-right text-money text-red-500">{t.jenis==='pengeluaran'?formatRupiah(t.nominal):'-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TTD area */}
            <div className="hidden print:flex justify-between mt-10">
              <div className="text-center text-sm">
                <p>Mengetahui,</p><p>Ketua Yayasan</p>
                <div className="mt-16 border-t border-black w-36 mx-auto pt-1 font-bold"><p>{settings?.ketua_yayasan || 'K. KHOIRUS SHOLEH'}</p></div>
              </div>
              <div className="text-center text-sm">
                <p>Sampang, ....................... {tahun}H</p><p>Bendahara</p>
                <div className="mt-16 border-t border-black w-36 mx-auto pt-1 font-bold"><p>{settings?.bendahara_pusat || '......................................'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
