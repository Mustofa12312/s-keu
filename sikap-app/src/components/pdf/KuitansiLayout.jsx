import { forwardRef } from 'react'
import { formatRupiah } from '../../utils/formatRupiah'
import { getBulanLabel } from '../../utils/hijriyah'

// Fungsi Helper Terbilang (Rupiah)
function terbilang(angka) {
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  const n = parseInt(angka, 10)
  if (n < 12) return huruf[n]
  if (n < 20) return terbilang(n - 10) + ' Belas'
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10)
  if (n < 200) return 'Seratus ' + terbilang(n - 100)
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100)
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000)
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000)
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000)
  return n.toString() // Angka terlalu besar
}

const KuitansiLayout = forwardRef(({ transaksi, settings }, ref) => {
  if (!transaksi) return <div ref={ref}></div>

  return (
    <div ref={ref} className="bg-white text-black p-8" style={{ fontFamily: 'Arial, sans-serif', width: '210mm', minHeight: '100mm' }}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider">{settings?.nama_yayasan || 'PONDOK PESANTREN DARUR ROHMAN'}</h1>
          <p className="text-sm mt-1">{settings?.alamat_yayasan || "Blu'uran, Karang Penang, Sampang"}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black text-gray-300 tracking-widest uppercase">KUITANSI</h2>
          <p className="text-sm mt-2 font-mono">No. {transaksi.nomor_bukti || '................'}</p>
        </div>
      </div>

      {/* Konten Kuitansi */}
      <table className="w-full text-base mb-8 border-separate" style={{ borderSpacing: '0 12px' }}>
        <tbody>
          <tr>
            <td className="w-1/4 font-semibold text-gray-600 align-top">Telah terima dari</td>
            <td className="w-2 align-top">:</td>
            <td className="font-medium italic border-b border-dashed border-gray-400 pb-1">
              {transaksi.sumber_dana || '.........................................................'}
            </td>
          </tr>
          <tr>
            <td className="font-semibold text-gray-600 align-top">Uang sejumlah</td>
            <td className="align-top">:</td>
            <td className="font-bold bg-gray-100 px-3 py-2 rounded-lg italic">
              {terbilang(transaksi.nominal)} Rupiah
            </td>
          </tr>
          <tr>
            <td className="font-semibold text-gray-600 align-top">Untuk pembayaran</td>
            <td className="align-top">:</td>
            <td className="border-b border-dashed border-gray-400 pb-1">
              {transaksi.uraian}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer / Nominal & TTD */}
      <div className="flex justify-between items-end mt-12">
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl px-6 py-3">
          <p className="text-2xl font-bold text-emerald-700">{formatRupiah(transaksi.nominal)}</p>
        </div>
        
        <div className="text-center w-64">
          <p className="mb-16">
            Sampang, {transaksi.tanggal ? new Date(transaksi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '.......................'}
          </p>
          <div className="border-b border-black mb-1"></div>
          <p className="font-semibold">{transaksi.instansi?.nama_instansi || 'Penerima / Bendahara'}</p>
        </div>
      </div>
    </div>
  )
})

KuitansiLayout.displayName = 'KuitansiLayout'
export default KuitansiLayout
