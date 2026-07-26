import { useState, useEffect, useRef } from 'react'
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useReactToPrint } from 'react-to-print'
import * as XLSX from 'xlsx'
import { useAuth } from '../../context/AuthContext'
import { anggaranService } from '../../services/anggaran.service'
import { pengaturanService, instansiService } from '../../services/firebase.service'
import { formatRupiah } from '../../utils/formatRupiah'

export default function LaporanAnggaranPage() {
  const { instansiId, isSuperAdmin } = useAuth()
  const [dataPendapatan, setDataPendapatan] = useState([])
  const [dataBelanja, setDataBelanja] = useState([])
  const [loading, setLoading] = useState(true)
  const [tahunPelajaran, setTahunPelajaran] = useState('')
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [namaInstansi, setNamaInstansi] = useState('')
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const printRef = useRef()

  useEffect(() => {
    pengaturanService.getSettings().then(settings => {
      setTahunPelajaran(settings?.tahun_aktif || '1446')
    })
    if (isSuperAdmin) {
      instansiService.getAll().then(setInstansiList)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    if (instansiId && !selectedInstansi && !isSuperAdmin) {
      setSelectedInstansi(instansiId)
    }
  }, [instansiId, isSuperAdmin, selectedInstansi])

  useEffect(() => {
    if (!tahunPelajaran) return
    const id = isSuperAdmin ? selectedInstansi : instansiId
    
    // Set Nama Instansi for header
    if (id) {
      if (isSuperAdmin) {
        const ins = instansiList.find(i => i.id === id)
        setNamaInstansi(ins ? ins.nama : 'Semua Instansi')
      } else {
        instansiService.getById(id).then(res => setNamaInstansi(res.nama)).catch(() => setNamaInstansi('Instansi'))
      }
    } else {
      setNamaInstansi('Seluruh Instansi')
    }

    fetchData(id)
  }, [tahunPelajaran, selectedInstansi, instansiId, isSuperAdmin, instansiList]) // eslint-disable-line

  const fetchData = async (id) => {
    setLoading(true)
    try {
      const realisasiAll = await anggaranService.getAllRealisasiLaporan({
        instansiId: id || null,
        tahunPelajaran
      })
      
      const resPendapatan = await anggaranService.getRencana({
        instansiId: id || null,
        tahunPelajaran,
        kategori: 'pendapatan'
      })
      
      const resBelanja = await anggaranService.getRencana({
        instansiId: id || null,
        tahunPelajaran,
        kategori: 'belanja'
      })
      
      const processData = (arr) => arr.map(rencana => {
        const rls = realisasiAll.filter(r => r.anggaran_id === rencana.id)
        const total_realisasi = rls.reduce((sum, r) => sum + (r.nominal || 0), 0)
        return {
          ...rencana,
          total_realisasi,
          sisa: (rencana.jumlah || 0) - total_realisasi
        }
      })

      setDataPendapatan(processData(resPendapatan))
      setDataBelanja(processData(resBelanja))
    } catch (error) {
      console.error(error)
      showToast('Gagal memuat laporan', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Laporan_RAPBM_${tahunPelajaran}`
  })

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new()
      
      // Formatting for excel export
      const prepData = (arr) => arr.map(r => ({
        'Kode': r.kode,
        'Uraian': r.uraian,
        'Waktu Pelaksanaan': r.waktu_pelaksanaan,
        'Pelaksana': r.pelaksana,
        'Volume': r.volume,
        'Satuan': r.satuan,
        'Harga Satuan': r.harga_satuan,
        'Jumlah Anggaran': r.jumlah,
        'Total Realisasi': r.total_realisasi,
        'Sisa Anggaran': r.sisa
      }))

      if (dataPendapatan.length > 0) {
        const wsP = XLSX.utils.json_to_sheet(prepData(dataPendapatan))
        XLSX.utils.book_append_sheet(wb, wsP, 'Pendapatan')
      }
      
      if (dataBelanja.length > 0) {
        const wsB = XLSX.utils.json_to_sheet(prepData(dataBelanja))
        XLSX.utils.book_append_sheet(wb, wsB, 'Belanja')
      }

      XLSX.writeFile(wb, `Laporan_RAPBM_${namaInstansi}_${tahunPelajaran}.xlsx`)
    } catch (err) {
      showToast('Gagal export ke Excel', 'error')
    }
  }

  const renderTable = (data, title, totalLabel) => {
    const sumAnggaran = data.reduce((a, c) => a + (c.jumlah || 0), 0)
    const sumRealisasi = data.reduce((a, c) => a + (c.total_realisasi || 0), 0)
    const sumSisa = sumAnggaran - sumRealisasi

    return (
      <div className="mb-8">
        <h3 className="font-bold text-slate-800 text-lg mb-3 uppercase border-b-2 border-slate-800 pb-2 inline-block pr-8">{title}</h3>
        <table className="w-full text-sm border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200">
              <th className="border border-slate-300 px-2 py-2 w-16">Kode</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Uraian</th>
              <th className="border border-slate-300 px-2 py-2 text-left w-32">Waktu Pelaks.</th>
              <th className="border border-slate-300 px-2 py-2 text-left w-32">Pelaksana</th>
              <th className="border border-slate-300 px-2 py-2 w-16">Vol</th>
              <th className="border border-slate-300 px-2 py-2 w-20 text-left">Satuan</th>
              <th className="border border-slate-300 px-2 py-2 text-right w-32">Harga Satuan</th>
              <th className="border border-slate-300 px-2 py-2 text-right w-32">Jml Anggaran</th>
              <th className="border border-slate-300 px-2 py-2 text-right w-32">Terealisasi</th>
              <th className="border border-slate-300 px-2 py-2 text-right w-32">Sisa</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="10" className="border border-slate-300 px-2 py-8 text-center text-slate-500 italic">Data kosong</td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id}>
                  <td className="border border-slate-300 px-2 py-1.5 text-center">{row.kode}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{row.uraian}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{row.waktu_pelaksanaan}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{row.pelaksana}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center">{row.volume}</td>
                  <td className="border border-slate-300 px-2 py-1.5">{row.satuan}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatRupiah(row.harga_satuan)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-700">{formatRupiah(row.jumlah)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-emerald-700">{formatRupiah(row.total_realisasi)}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right">{formatRupiah(row.sisa)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 print:bg-slate-100 font-bold">
              <td colSpan="7" className="border border-slate-300 px-2 py-2 text-right uppercase">{totalLabel}</td>
              <td className="border border-slate-300 px-2 py-2 text-right text-slate-800">{formatRupiah(sumAnggaran)}</td>
              <td className="border border-slate-300 px-2 py-2 text-right text-emerald-700">{formatRupiah(sumRealisasi)}</td>
              <td className="border border-slate-300 px-2 py-2 text-right">{formatRupiah(sumSisa)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Laporan RAPBM</h1>
          <p className="text-sm text-slate-500 mt-1">Laporan Realisasi Anggaran Pendapatan dan Belanja Madrasah</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <PrinterIcon className="w-5 h-5" />
            <span>Cetak PDF</span>
          </button>
          <button onClick={handleExportExcel} className="btn-primary flex items-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="card p-4 no-print bg-slate-50 border border-slate-200 flex gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="label">Filter Instansi</label>
            <select
              className="input"
              value={selectedInstansi}
              onChange={(e) => setSelectedInstansi(e.target.value)}
            >
              <option value="">-- Semua Instansi --</option>
              {instansiList.map((ins) => (
                <option key={ins.id} value={ins.id}>{ins.nama}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-5 space-y-4 no-print">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-10 skeleton w-full" />)}
        </div>
      ) : (
        <div className="card p-8 bg-white print:shadow-none print:border-none print:p-0 overflow-x-auto" ref={printRef}>
          <div className="text-center mb-10">
            <h1 className="text-xl font-bold text-slate-800 uppercase print:text-black">Laporan Realisasi Anggaran</h1>
            <h2 className="text-lg font-bold text-slate-700 uppercase print:text-black">{namaInstansi}</h2>
            <p className="text-sm text-slate-600 mt-1">Tahun Pelajaran {tahunPelajaran}</p>
          </div>

          {renderTable(dataPendapatan, 'A. Pendapatan', 'Total Pendapatan')}
          {renderTable(dataBelanja, 'B. Belanja', 'Total Belanja')}

          <div className="mt-8 flex justify-end print-only">
            <div className="text-center w-64">
              <p className="mb-20">Kepala Madrasah / Bendahara,</p>
              <p className="font-bold border-b border-black pb-1 inline-block min-w-[200px]"></p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl font-medium animate-slide-in z-50 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}
    </div>
  )
}
