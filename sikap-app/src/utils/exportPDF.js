// ============================================================
// src/utils/exportPDF.js — Export PDF menggunakan jsPDF + autoTable
// ============================================================
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah } from './formatRupiah'
import { getBulanLabel } from './hijriyah'

/**
 * Export BKU (Buku Kas Umum) ke PDF — format A4 portrait
 */
export function exportBKUPDF({ transaksi, instansi, bulan, tahun, settings }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // ---- Header ----
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('BUKU KAS UMUM', pageW / 2, 18, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  const infoY = 26
  // Kiri
  doc.text(`Nama Yayasan : ${settings?.nama_yayasan || 'Pondok Pesantren Darur Rohman'}`, margin, infoY)
  doc.text(`Nama Madrasah : ${instansi?.nama_instansi || '___________'}`, margin, infoY + 5)
  doc.text(`Alamat : ${settings?.alamat_yayasan || "Blu'uran, Karang Penang, Sampang"}`, margin, infoY + 10)
  // Kanan
  doc.text(`Bulan   : ${getBulanLabel(bulan)}`, pageW / 2 + 10, infoY)
  doc.text(`Halaman : ____`, pageW / 2 + 10, infoY + 5)

  // ---- Table ----
  let saldo = 0
  const rows = transaksi.map((t, i) => {
    if (t.jenis === 'pemasukan') saldo += t.nominal
    else saldo -= t.nominal
    return [
      i + 1,
      t.tanggal || '',
      t.tanggal_hijriyah || '',
      t.kode_transaksi || '',
      t.nomor_bukti || '',
      t.uraian || '',
      t.sumber_dana || '',
      t.jenis === 'pemasukan' ? formatRupiah(t.nominal) : '',
      t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '',
      formatRupiah(saldo),
    ]
  })

  const totalPem = transaksi.filter(t => t.jenis === 'pemasukan').reduce((s, t) => s + t.nominal, 0)
  const totalPen = transaksi.filter(t => t.jenis === 'pengeluaran').reduce((s, t) => s + t.nominal, 0)

  autoTable(doc, {
    startY: infoY + 16,
    head: [[
      'No', 'Tgl Masehi', 'Tgl Hijriyah', 'No Kode', 'No Bukti',
      'URAIAN', 'Sumber Dana', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)',
    ]],
    body: [
      ...rows,
      ['', '', '', '', '', '', 'JUMLAH', formatRupiah(totalPem), formatRupiah(totalPen), formatRupiah(totalPem - totalPen)],
    ],
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 },
      7: { halign: 'right', cellWidth: 24 },
      8: { halign: 'right', cellWidth: 24 },
      9: { halign: 'right', cellWidth: 22 },
    },
    foot: [],
    theme: 'grid',
  })

  const finalY = doc.lastAutoTable.finalY + 8

  // ---- Footer penutup ----
  doc.setFontSize(8)
  doc.text('Pada hari .............. tanggal .......... bulan .......... tahun .......... Buku Kas Umum ditutup:', margin, finalY)
  doc.text(`Saldo Buku Kas Umum  :  ${formatRupiah(totalPem - totalPen)}`, margin + 5, finalY + 6)
  doc.text('Terdiri dari :', margin + 5, finalY + 11)
  doc.text('Saldo Kas Tunai (isi sendiri)  :  ________________________', margin + 10, finalY + 16)
  doc.text(`Saldo Bank  :  ${formatRupiah(totalPem - totalPen)}`, margin + 10, finalY + 21)
  doc.text(`Jumlah  :  ${formatRupiah(totalPem - totalPen)}`, margin + 5, finalY + 26)

  // ---- TTD ----
  const ttdY = finalY + 36
  doc.text('Mengetahui,', margin, ttdY)
  doc.text(`Sampang, ..................................... ${tahun}H`, pageW / 2 + 5, ttdY)
  doc.text('Ketua Yayasan', margin, ttdY + 5)
  doc.text('Bendahara', pageW / 2 + 5, ttdY + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(settings?.ketua_yayasan || 'K. KHOIRUS SHOLEH', margin, ttdY + 22)
  doc.text(settings?.bendahara_pusat || '......................................', pageW / 2 + 5, ttdY + 22)

  doc.save(`BKU_${instansi?.kode_instansi || 'INSTANSI'}_${bulan}_${tahun}.pdf`)
}

/**
 * Export Laporan Rekap ke PDF
 */
export function exportLaporanPDF({ bulanSummary, summary, instansiNama, jenis, filterLabel, tahun, settings }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // Header
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN KEUANGAN', pageW / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(settings?.nama_yayasan || 'Pondok Pesantren Darur Rohman', pageW / 2, 25, { align: 'center' })

  doc.setFontSize(9)
  doc.text(`Instansi : ${instansiNama || 'Semua Instansi'}`, margin, 33)
  doc.text(`Periode  : ${filterLabel}`, margin, 38)
  doc.text(`Tahun Hijriyah : ${tahun}H`, margin, 43)

  // Summary boxes
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(margin, 48, 55, 14, 2, 2, 'F')
  doc.setFontSize(7)
  doc.text('Total Penerimaan', margin + 2, 53)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text(formatRupiah(summary.pem), margin + 2, 59)

  doc.setFillColor(255, 241, 242)
  doc.roundedRect(margin + 60, 48, 55, 14, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)
  doc.text('Total Pengeluaran', margin + 62, 53)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text(formatRupiah(summary.pen), margin + 62, 59)

  doc.setFillColor(239, 246, 255)
  doc.roundedRect(margin + 120, 48, 55, 14, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0)
  doc.text('Saldo Akhir', margin + 122, 53)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text(formatRupiah(summary.saldo), margin + 122, 59)
  doc.setTextColor(0)

  // Table
  autoTable(doc, {
    startY: 67,
    head: [['No', 'Periode', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)', 'Jml Transaksi']],
    body: [
      ...bulanSummary.map((b, i) => [
        i + 1, b.label,
        formatRupiah(b.pem),
        formatRupiah(b.pen),
        formatRupiah(b.saldo),
        b.count,
      ]),
      ['', 'JUMLAH', formatRupiah(summary.pem), formatRupiah(summary.pen), formatRupiah(summary.saldo), summary.count],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center', cellWidth: 22 },
    },
    theme: 'grid',
  })

  // TTD
  const ttdY = doc.lastAutoTable.finalY + 16
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Mengetahui,', margin, ttdY)
  doc.text(`Sampang, ..................................... ${tahun}H`, pageW / 2 + 5, ttdY)
  doc.text('Ketua Yayasan', margin, ttdY + 5)
  doc.text('Bendahara', pageW / 2 + 5, ttdY + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(settings?.ketua_yayasan || 'K. KHOIRUS SHOLEH', margin, ttdY + 22)
  doc.text(settings?.bendahara_pusat || '......................................', pageW / 2 + 5, ttdY + 22)

  doc.save(`Laporan_${jenis}_${tahun}.pdf`)
}

/**
 * Export Laporan RAPBM ke PDF — format A4 landscape
 */
export function exportRAPBMPDF({ dataPendapatan, dataBelanja, namaInstansi, tahunPelajaran }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // Header
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN REALISASI ANGGARAN', pageW / 2, 18, { align: 'center' })
  doc.setFontSize(11)
  doc.text(namaInstansi || 'Seluruh Instansi', pageW / 2, 24, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tahun Pelajaran ${tahunPelajaran}`, pageW / 2, 30, { align: 'center' })

  let currentY = 40

  const prepTable = (data, title, totalLabel) => {
    if (!data || data.length === 0) return

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(title, margin, currentY)
    currentY += 4

    const sumAnggaran = data.reduce((a, c) => a + (c.jumlah || 0), 0)
    const sumRealisasi = data.reduce((a, c) => a + (c.total_realisasi || 0), 0)
    const sumSisa = sumAnggaran - sumRealisasi

    const rows = data.map(r => [
      r.kode,
      r.uraian,
      r.waktu_pelaksanaan,
      r.pelaksana,
      r.volume,
      r.satuan,
      formatRupiah(r.harga_satuan),
      formatRupiah(r.jumlah),
      formatRupiah(r.total_realisasi),
      formatRupiah(r.sisa)
    ])

    autoTable(doc, {
      startY: currentY,
      head: [['Kode', 'Uraian', 'Waktu Pelaks.', 'Pelaksana', 'Vol', 'Satuan', 'Harga Satuan', 'Jml Anggaran', 'Terealisasi', 'Sisa']],
      body: [
        ...rows,
        [{ content: totalLabel, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } }, 
         formatRupiah(sumAnggaran), formatRupiah(sumRealisasi), formatRupiah(sumSisa)]
      ],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 10, halign: 'center' },
        5: { cellWidth: 15 },
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
        8: { halign: 'right', textColor: [5, 150, 105], fontStyle: 'bold', cellWidth: 28 },
        9: { halign: 'right', cellWidth: 25 },
      },
      theme: 'grid',
    })

    currentY = doc.lastAutoTable.finalY + 10
  }

  prepTable(dataPendapatan, 'A. PENDAPATAN', 'TOTAL PENDAPATAN')
  prepTable(dataBelanja, 'B. BELANJA', 'TOTAL BELANJA')

  // TTD
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage()
    currentY = 20
  }

  const ttdY = currentY + 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0)
  
  // Kiri (Mengetahui)
  doc.text('Mengetahui ;', margin + 10, ttdY)
  doc.text(`Kepala ${namaInstansi || 'Madrasah'}`, margin + 10, ttdY + 5)
  doc.setFont('helvetica', 'bold')
  doc.text(settings?.kepala_instansi || 'MARBIDIN', margin + 10, ttdY + 25)
  doc.setFont('helvetica', 'normal')
  doc.text('_____________________________', margin + 10, ttdY + 26)
  
  // Kanan (Bendahara)
  doc.text('Bendahara', pageW - margin - 50, ttdY + 5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(settings?.bendahara_instansi || 'MOH. RUDI', pageW - margin - 50, ttdY + 25, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('_____________________________', pageW - margin - 50, ttdY + 26, { align: 'center' })

  doc.save(`Laporan_RAPBM_${namaInstansi || 'Semua'}_${tahunPelajaran}.pdf`)
}
