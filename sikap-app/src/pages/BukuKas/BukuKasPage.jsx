// ============================================================
// src/pages/BukuKas/BukuKasPage.jsx
// BKU identik format Excel + Print A4 + Export PDF + Export Excel
// react-to-print v3 (contentRef API)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { PrinterIcon, ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { usePrint } from '../../hooks/usePrint'
import { formatRupiah } from '../../utils/formatRupiah'
import { BULAN_HIJRIYAH, getBulanLabel } from '../../utils/hijriyah'
import { transaksiService, instansiService, pengaturanService } from '../../services/firebase.service'
import { useAuth } from '../../context/AuthContext'
import { exportBKUPDF } from '../../utils/exportPDF'
import * as XLSX from 'xlsx'

// ─── Style helper ───────────────────────────────────────────
const thS = {
  border: '1px solid #999', padding: '4px 5px',
  textAlign: 'center', fontWeight: 'bold', whiteSpace: 'pre-line', fontSize: '9pt',
}
const tdS = {
  border: '1px solid #999', padding: '3px 5px',
  verticalAlign: 'top', fontSize: '9pt',
}

// ─── BKU Print Layout ───────────────────────────────────────
function BKUPrintLayout({ transaksi, instansi, bulan, tahun, settings }) {
  const totalPem = transaksi.filter(r => r.jenis === 'pemasukan').reduce((s, r) => s + r.nominal, 0)
  const totalPen = transaksi.filter(r => r.jenis === 'pengeluaran').reduce((s, r) => s + r.nominal, 0)
  const saldoAkhir = totalPem - totalPen

  let currentSaldo = 0
  const transaksiWithSaldo = transaksi.map(row => {
    currentSaldo += row.jenis === 'pemasukan' ? row.nominal : -row.nominal
    return { ...row, runSaldo: currentSaldo }
  })

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', padding: '14mm 18mm', color: '#000', background: '#fff' }}>
      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <strong style={{ fontSize: '13pt', letterSpacing: '1px' }}>BUKU KAS UMUM</strong>
      </div>

      {/* Info lembaga */}
      <table style={{ width: '100%', fontSize: '10.5pt', marginBottom: '8px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '26%' }}>Nama Yayasan</td>
            <td style={{ width: '2%' }}>:</td>
            <td style={{ width: '37%' }}><strong>{settings?.nama_yayasan || 'Pondok Pesantren Darur Rohman'}</strong></td>
            <td style={{ width: '14%' }}>Bulan</td>
            <td style={{ width: '2%' }}>:</td>
            <td><strong>{getBulanLabel(bulan)}</strong></td>
          </tr>
          <tr>
            <td>Nama Instansi</td><td>:</td>
            <td><strong>{instansi?.nama_instansi || '____________________'}</strong></td>
            <td>Halaman</td><td>:</td><td>____</td>
          </tr>
          <tr>
            <td>Alamat</td><td>:</td>
            <td colSpan={4}>{settings?.alamat_yayasan || "Blu'uran, Karang Penang, Sampang"}</td>
          </tr>
        </tbody>
      </table>

      {/* Tabel BKU */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', marginBottom: '10px' }}>
        <thead>
          <tr style={{ background: '#e8e8e8' }}>
            {['Tanggal\n(Masehi)', 'Tanggal\n(Hijriyah)', 'No.\nKode', 'No.\nBukti',
              'URAIAN', 'SUMBER\nDANA', 'Penerimaan\n(Rp)', 'Pengeluaran\n(Rp)', 'Saldo\n(Rp)']
              .map((h, i) => <th key={i} style={thS}>{h}</th>)}
          </tr>
          <tr style={{ background: '#f0f0f0' }}>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <th key={n} style={{ ...thS, fontWeight: 'normal', padding: '2px 4px' }}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transaksi.length === 0 && (
            <tr><td colSpan={9} style={{ ...tdS, textAlign: 'center', padding: '16px' }}>Belum ada transaksi bulan ini</td></tr>
          )}
          {transaksiWithSaldo.map(row => {
            return (
              <tr key={row.id}>
                <td style={tdS}>{row.tanggal || ''}</td>
                <td style={tdS}>{row.tanggal_hijriyah || ''}</td>
                <td style={tdS}>{row.kode_transaksi || ''}</td>
                <td style={tdS}>{row.nomor_bukti || ''}</td>
                <td style={{ ...tdS, minWidth: '110px' }}>{row.uraian}</td>
                <td style={tdS}>{row.sumber_dana || ''}</td>
                <td style={{ ...tdS, textAlign: 'right' }}>{row.jenis === 'pemasukan' ? formatRupiah(row.nominal) : ''}</td>
                <td style={{ ...tdS, textAlign: 'right' }}>{row.jenis === 'pengeluaran' ? formatRupiah(row.nominal) : ''}</td>
                <td style={{ ...tdS, textAlign: 'right' }}>{formatRupiah(row.runSaldo)}</td>
              </tr>
            )
          })}
          {/* baris kosong pengisi */}
          {Array.from({ length: Math.max(0, 17 - transaksi.length) }).map((_, i) => (
            <tr key={`bk-${i}`}>
              {Array(9).fill(0).map((_, j) => <td key={j} style={{ ...tdS, height: '19px' }} />)}
            </tr>
          ))}
          {/* baris jumlah */}
          <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
            <td colSpan={6} style={tdS} />
            <td style={{ ...tdS, textAlign: 'right' }}>{formatRupiah(totalPem)}</td>
            <td style={{ ...tdS, textAlign: 'right' }}>{formatRupiah(totalPen)}</td>
            <td style={{ ...tdS, textAlign: 'right' }}>{formatRupiah(saldoAkhir)}</td>
          </tr>
        </tbody>
      </table>

      {/* Penutup */}
      <p style={{ fontSize: '9.5pt', margin: '0 0 4px 0' }}>
        Pada hari ................ tanggal ........... bulan .......... tahun .......... Buku Kas Umum ditutup dengan keadaan sebagai berikut :
      </p>
      <table style={{ marginLeft: '16px', fontSize: '9.5pt' }}>
        <tbody>
          <tr><td style={{ paddingRight: '12px' }}>Saldo Buku Kas Umum</td><td>: {formatRupiah(saldoAkhir)}</td></tr>
          <tr><td>Terdiri dari :</td><td /></tr>
          <tr><td style={{ paddingLeft: '14px' }}>Saldo Kas Tunai (isi sendiri)</td><td>: _____________________</td></tr>
          <tr><td style={{ paddingLeft: '14px' }}>Saldo Bank</td><td>: {formatRupiah(saldoAkhir)}</td></tr>
          <tr><td>Jumlah</td><td>: {formatRupiah(saldoAkhir)}</td></tr>
        </tbody>
      </table>

      {/* TTD */}
      <table style={{ width: '100%', marginTop: '20px', fontSize: '9.5pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '42%' }}>Mengetahui,</td>
            <td style={{ textAlign: 'right' }}>Sampang, ...................................... {tahun}H</td>
          </tr>
          <tr><td>Ketua Yayasan</td><td style={{ textAlign: 'right' }}>Bendahara</td></tr>
          <tr style={{ height: '46px' }}><td /><td /></tr>
          <tr>
            <td><strong>{settings?.ketua_yayasan || 'K. KHOIRUS SHOLEH'}</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{settings?.bendahara_pusat || '..............................................'}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function BukuKasPage() {
  const { isSuperAdmin, instansiId } = useAuth()
  const [transaksi, setTransaksi]     = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState(isSuperAdmin ? '' : instansiId || '')
  const [selectedBulan, setSelectedBulan] = useState(BULAN_HIJRIYAH[0])
  const [tahun, setTahun]             = useState('1446')
  const [loading, setLoading]         = useState(false)
  const [settings, setSettings]       = useState(null)
  const printRef = useRef()

  const instansiObj = instansiList.find(i => i.id === selectedInstansi) || null

  // react-to-print v3
  const handlePrint = usePrint(
    printRef,
    `BKU_${instansiObj?.kode_instansi || 'BKU'}_${selectedBulan}_${tahun}`,
  )

  useEffect(() => {
    instansiService.getAll().then(setInstansiList).catch(console.error)
    if (!isSuperAdmin) setSelectedInstansi(instansiId || '')

    pengaturanService.getSettings().then(s => {
      setSettings(s)
      if (s?.tahun_aktif) setTahun(s.tahun_aktif)
    }).catch(console.error)
  }, [isSuperAdmin, instansiId])

  async function loadBKU() {
    setLoading(true)
    try {
      const id = isSuperAdmin ? selectedInstansi : instansiId
      if (!id) {
        setTransaksi([])
        return
      }
      const data = await transaksiService.getAll({
        instansiId: id,
        bulanHijriyah: selectedBulan,
        tahunHijriyah: tahun || null,
      })
      setTransaksi(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadBKU() }, [selectedBulan, selectedInstansi, tahun, instansiId, isSuperAdmin])

  function handleExportPDF() {
    exportBKUPDF({ transaksi, instansi: instansiObj, bulan: selectedBulan, tahun, settings })
  }

  function handleExportExcel() {
    let saldo = 0
    const wsData = [
      ['BUKU KAS UMUM'],
      [],
      ['Nama Madrasah', ':', instansiObj?.nama_instansi || '', '', 'Bulan', ':', getBulanLabel(selectedBulan)],
      ["Desa/Kecamatan", ':', "Blu'uran, Karang Penang", '', 'Halaman', ':', ''],
      ['Kabupaten', ':', 'Sampang'],
      [],
      ['Tanggal (Masehi)', 'Tanggal (Hijriyah)', 'No. Kode', 'No. Bukti',
       'URAIAN', 'SUMBER DANA', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)'],
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    ]
    transaksi.forEach(t => {
      if (t.jenis === 'pemasukan') saldo += t.nominal
      else saldo -= t.nominal
      wsData.push([
        t.tanggal || '', t.tanggal_hijriyah || '',
        t.kode_transaksi || '', t.nomor_bukti || '',
        t.uraian, t.sumber_dana || '',
        t.jenis === 'pemasukan' ? t.nominal : '',
        t.jenis === 'pengeluaran' ? t.nominal : '',
        saldo,
      ])
    })
    const tp = transaksi.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
    const tn = transaksi.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)
    wsData.push(['', '', '', '', '', 'JUMLAH', tp, tn, tp - tn])

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [14,14,10,12,30,18,16,16,16].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, getBulanLabel(selectedBulan).substring(0, 31))
    XLSX.writeFile(wb, `BKU_${instansiObj?.kode_instansi || 'INSTANSI'}_${selectedBulan}_${tahun}.xlsx`)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ─── Controls ─── */}
      <div className="no-print card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {isSuperAdmin && (
            <div>
              <label className="label">Instansi</label>
              <select className="input w-52" value={selectedInstansi}
                onChange={e => setSelectedInstansi(e.target.value)}>
                <option value="">-- Pilih Instansi --</option>
                {instansiList.map(i => <option key={i.id} value={i.id}>{i.nama_instansi}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Bulan Hijriyah</label>
            <select className="input w-44" value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}>
              {BULAN_HIJRIYAH.map(b => <option key={b} value={b}>{getBulanLabel(b)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tahun Hijriyah</label>
            <input type="text" className="input w-24" value={tahun}
              onChange={e => setTahun(e.target.value)} placeholder="1446" />
          </div>

          <div className="flex gap-2 ml-auto flex-wrap">
            <button onClick={handleExportExcel} className="btn-secondary" disabled={!instansiObj}>
              <ArrowDownTrayIcon className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="btn-secondary" disabled={!instansiObj}>
              <DocumentArrowDownIcon className="w-4 h-4" /> PDF
            </button>
            <button id="btn-print-bku" onClick={handlePrint} className="btn-primary" disabled={!instansiObj}>
              <PrinterIcon className="w-4 h-4" /> Print A4
            </button>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span>📄 <strong>{transaksi.length}</strong> transaksi</span>
          <span>📅 <strong>{getBulanLabel(selectedBulan)}</strong> {tahun}H</span>
          {instansiObj && <span>🏢 <strong>{instansiObj.nama_instansi}</strong></span>}
          {transaksi.length > 0 && (() => {
            const p = transaksi.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
            const n = transaksi.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)
            return <>
              <span>💚 Penerimaan: <strong className="text-emerald-600">{formatRupiah(p)}</strong></span>
              <span>🔴 Pengeluaran: <strong className="text-red-500">{formatRupiah(n)}</strong></span>
              <span>💰 Saldo: <strong className={p-n>=0?'text-blue-600':'text-amber-600'}>{formatRupiah(p-n)}</strong></span>
            </>
          })()}
        </div>
      </div>

      {/* ─── BKU Preview ─── */}
      {loading ? (
        <div className="card py-20 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Memuat BKU...</p>
        </div>
      ) : (
        <div className="card overflow-hidden shadow-card-md">
          {/* Mockup browser bar */}
          <div className="no-print px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono">
              Preview BKU — {instansiObj?.nama_instansi || 'Pilih Instansi'} / {getBulanLabel(selectedBulan)} {tahun}H
            </span>
          </div>

          <div ref={printRef} className="bg-white overflow-x-auto">
            {instansiObj ? (
              <BKUPrintLayout
                transaksi={transaksi}
                instansi={instansiObj}
                bulan={selectedBulan}
                tahun={tahun}
                settings={settings}
              />
            ) : (
              <div className="p-10 text-center text-slate-400">
                Silakan pilih instansi terlebih dahulu.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
