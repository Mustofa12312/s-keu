import 'dart:io';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';

import '../../data/models/profile_model.dart';
import '../../data/models/transaksi_model.dart';
import 'format_utils.dart';

class ExportUtils {
  // ─── EXPORT PDF (BKU Resmi) ──────────────────────────────────────────────────
  static Future<void> exportBKUPdf({
    required List<TransaksiModel> transaksi,
    required dynamic instansi, // Expect InstansiModel as dynamic to handle null/Map
    required String bulan,
    required String tahun,
    required PengaturanModel settings,
  }) async {
    final pdf = pw.Document();

    final totalPem = transaksi.where((t) => t.isPemasukan).fold(0, (s, t) => s + t.nominal);
    final totalPen = transaksi.where((t) => t.isPengeluaran).fold(0, (s, t) => s + t.nominal);
    final saldoAkhir = totalPem - totalPen;

    int runSaldo = 0;
    
    // Safety getter for instansi properties
    final String namaInstansi = (instansi != null && instansi.runtimeType != String) 
        ? (instansi.namaInstansi ?? '____________________') 
        : '____________________';

    final String kodeInstansi = (instansi != null && instansi.runtimeType != String) 
        ? (instansi.kodeInstansi ?? 'INST') 
        : 'INST';

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(vertical: 14 * PdfPageFormat.mm, horizontal: 18 * PdfPageFormat.mm),
        build: (context) => [
          // ── Judul
          pw.Center(
            child: pw.Text('BUKU KAS UMUM',
              style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, letterSpacing: 1)),
          ),
          pw.SizedBox(height: 10),

          // ── Info Lembaga
          pw.Table(
            columnWidths: {
              0: const pw.FlexColumnWidth(2.6),
              1: const pw.FlexColumnWidth(0.2),
              2: const pw.FlexColumnWidth(3.7),
              3: const pw.FlexColumnWidth(1.4),
              4: const pw.FlexColumnWidth(0.2),
              5: const pw.FlexColumnWidth(1.9),
            },
            children: [
              pw.TableRow(children: [
                pw.Text('Nama Yayasan', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(':', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(settings.namaYayasan, style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold)),
                pw.Text('Bulan', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(':', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(bulan, style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold)),
              ]),
              pw.TableRow(children: [
                pw.Text('Nama Instansi', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(':', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(namaInstansi, style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold)),
                pw.Text('Halaman', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(':', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(context.pageNumber.toString(), style: const pw.TextStyle(fontSize: 10.5)),
              ]),
              pw.TableRow(children: [
                pw.Text('Alamat', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(':', style: const pw.TextStyle(fontSize: 10.5)),
                pw.Text(settings.alamatYayasan, style: const pw.TextStyle(fontSize: 10.5)),
                pw.SizedBox(), pw.SizedBox(), pw.SizedBox(),
              ]),
            ],
          ),
          pw.SizedBox(height: 10),

          // ── Tabel BKU
          pw.TableHelper.fromTextArray(
            headers: [
              'Tanggal\n(Masehi)', 'Tanggal\n(Hijriyah)', 'No.\nKode', 'No.\nBukti',
              'URAIAN', 'SUMBER\nDANA', 'Penerimaan\n(Rp)', 'Pengeluaran\n(Rp)', 'Saldo\n(Rp)'
            ],
            headerStyle: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
            headerDecoration: const pw.BoxDecoration(color: PdfColors.grey300),
            cellStyle: const pw.TextStyle(fontSize: 9),
            cellAlignments: {
              0: pw.Alignment.topCenter, 1: pw.Alignment.topCenter,
              2: pw.Alignment.topCenter, 3: pw.Alignment.topCenter,
              4: pw.Alignment.topLeft,   5: pw.Alignment.topCenter,
              6: pw.Alignment.topRight,  7: pw.Alignment.topRight, 8: pw.Alignment.topRight,
            },
            data: [
              ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
              ...transaksi.map((t) {
                if (t.isPemasukan) runSaldo += t.nominal;
                else runSaldo -= t.nominal;
                return [
                  t.tanggal ?? '', t.tanggalHijriyah ?? '', t.kodeTransaksi ?? '', t.nomorBukti ?? '',
                  t.uraian, t.sumberDana ?? '',
                  t.isPemasukan ? FormatUtils.rupiah(t.nominal).replaceAll('Rp', '').trim() : '',
                  t.isPengeluaran ? FormatUtils.rupiah(t.nominal).replaceAll('Rp', '').trim() : '',
                  FormatUtils.rupiah(runSaldo).replaceAll('Rp', '').trim(),
                ];
              }),
              ['', '', '', '', '', 'JUMLAH', 
                FormatUtils.rupiah(totalPem).replaceAll('Rp', '').trim(),
                FormatUtils.rupiah(totalPen).replaceAll('Rp', '').trim(),
                FormatUtils.rupiah(saldoAkhir).replaceAll('Rp', '').trim(),
              ],
            ],
            border: pw.TableBorder.all(width: 0.5, color: PdfColors.grey600),
            cellPadding: const pw.EdgeInsets.all(4),
          ),
          pw.SizedBox(height: 15),

          // ── Penutup
          pw.Text('Pada hari ................ tanggal ........... bulan .......... tahun .......... Buku Kas Umum ditutup dengan keadaan sebagai berikut :',
            style: const pw.TextStyle(fontSize: 9.5)),
          pw.SizedBox(height: 4),
          pw.Padding(
            padding: const pw.EdgeInsets.only(left: 16),
            child: pw.Table(
              columnWidths: {
                0: const pw.FlexColumnWidth(4),
                1: const pw.FlexColumnWidth(6),
              },
              children: [
                pw.TableRow(children: [pw.Text('Saldo Buku Kas Umum', style: const pw.TextStyle(fontSize: 9.5)), pw.Text(': ${FormatUtils.rupiah(saldoAkhir)}', style: const pw.TextStyle(fontSize: 9.5))]),
                pw.TableRow(children: [pw.Text('Terdiri dari :', style: const pw.TextStyle(fontSize: 9.5)), pw.SizedBox()]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.only(left: 14), child: pw.Text('Saldo Kas Tunai (isi sendiri)', style: const pw.TextStyle(fontSize: 9.5))), pw.Text(': _____________________', style: const pw.TextStyle(fontSize: 9.5))]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.only(left: 14), child: pw.Text('Saldo Bank', style: const pw.TextStyle(fontSize: 9.5))), pw.Text(': ${FormatUtils.rupiah(saldoAkhir)}', style: const pw.TextStyle(fontSize: 9.5))]),
                pw.TableRow(children: [pw.Text('Jumlah', style: const pw.TextStyle(fontSize: 9.5)), pw.Text(': ${FormatUtils.rupiah(saldoAkhir)}', style: const pw.TextStyle(fontSize: 9.5))]),
              ]
            ),
          ),

          // ── TTD
          pw.SizedBox(height: 20),
          pw.Table(
            children: [
              pw.TableRow(children: [
                pw.Text('Mengetahui,', style: const pw.TextStyle(fontSize: 9.5)),
                pw.Text('Sampang, ...................................... ${tahun}H', style: const pw.TextStyle(fontSize: 9.5), textAlign: pw.TextAlign.right),
              ]),
              pw.TableRow(children: [
                pw.Text('Ketua Yayasan', style: const pw.TextStyle(fontSize: 9.5)),
                pw.Text('Bendahara', style: const pw.TextStyle(fontSize: 9.5), textAlign: pw.TextAlign.right),
              ]),
              pw.TableRow(children: [pw.SizedBox(height: 46), pw.SizedBox(height: 46)]),
              pw.TableRow(children: [
                pw.Text(settings.ketuaYayasan, style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold)),
                pw.Text(settings.bendaharaPusat.isEmpty ? '..............................................' : settings.bendaharaPusat, 
                  style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.right),
              ]),
            ]
          )
        ],
      ),
    );

    // Buka Spooler Native untuk print / save to PDF
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'BKU_${kodeInstansi}_${bulan}_$tahun',
    );
  }

  // ─── EXPORT EXCEL ────────────────────────────────────────────────────────────
  static Future<void> exportBKUExcel({
    required List<TransaksiModel> transaksi,
    required dynamic instansi,
    required String bulan,
    required String tahun,
  }) async {
    final excel = Excel.createExcel();
    final sheetName = bulan.length > 31 ? bulan.substring(0, 31) : bulan;
    final sheet = excel[sheetName];
    excel.setDefaultSheet(sheetName);

    // Delete default 'Sheet1' if it exists and is different
    if (sheetName != 'Sheet1' && excel.tables.containsKey('Sheet1')) {
      excel.delete('Sheet1');
    }

    final String namaInstansi = (instansi != null && instansi.runtimeType != String) ? (instansi.namaInstansi ?? '') : '';
    final String kodeInstansi = (instansi != null && instansi.runtimeType != String) ? (instansi.kodeInstansi ?? 'INST') : 'INST';

    // Headers & Info
    sheet.appendRow([TextCellValue('BUKU KAS UMUM')]);
    sheet.appendRow([]);
    sheet.appendRow([TextCellValue('Nama Madrasah'), TextCellValue(':'), TextCellValue(namaInstansi), TextCellValue(''), TextCellValue('Bulan'), TextCellValue(':'), TextCellValue(bulan)]);
    sheet.appendRow([TextCellValue("Desa/Kecamatan"), TextCellValue(':'), TextCellValue("Blu'uran, Karang Penang"), TextCellValue(''), TextCellValue('Halaman'), TextCellValue(':'), TextCellValue('')]);
    sheet.appendRow([TextCellValue('Kabupaten'), TextCellValue(':'), TextCellValue('Sampang')]);
    sheet.appendRow([]);
    sheet.appendRow([
      TextCellValue('Tanggal (Masehi)'), TextCellValue('Tanggal (Hijriyah)'), TextCellValue('No. Kode'), TextCellValue('No. Bukti'),
      TextCellValue('URAIAN'), TextCellValue('SUMBER DANA'), TextCellValue('Penerimaan (Rp)'), TextCellValue('Pengeluaran (Rp)'), TextCellValue('Saldo (Rp)')
    ]);
    sheet.appendRow([IntCellValue(1), IntCellValue(2), IntCellValue(3), IntCellValue(4), IntCellValue(5), IntCellValue(6), IntCellValue(7), IntCellValue(8), IntCellValue(9)]);

    // Data Rows
    int saldo = 0;
    for (final t in transaksi) {
      if (t.isPemasukan) saldo += t.nominal;
      else saldo -= t.nominal;
      sheet.appendRow([
        TextCellValue(t.tanggal ?? ''),
        TextCellValue(t.tanggalHijriyah ?? ''),
        TextCellValue(t.kodeTransaksi ?? ''),
        TextCellValue(t.nomorBukti ?? ''),
        TextCellValue(t.uraian),
        TextCellValue(t.sumberDana ?? ''),
        t.isPemasukan ? IntCellValue(t.nominal) : TextCellValue(''),
        t.isPengeluaran ? IntCellValue(t.nominal) : TextCellValue(''),
        IntCellValue(saldo),
      ]);
    }

    final tp = transaksi.where((t) => t.isPemasukan).fold(0, (s, t) => s + t.nominal);
    final tn = transaksi.where((t) => t.isPengeluaran).fold(0, (s, t) => s + t.nominal);
    sheet.appendRow([
      TextCellValue(''), TextCellValue(''), TextCellValue(''), TextCellValue(''), TextCellValue(''), 
      TextCellValue('JUMLAH'), IntCellValue(tp), IntCellValue(tn), IntCellValue(tp - tn)
    ]);

    // Save and Share
    final fileBytes = excel.save();
    if (fileBytes != null) {
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/BKU_${kodeInstansi}_${bulan}_$tahun.xlsx');
      await file.writeAsBytes(fileBytes);
      await Share.shareXFiles([XFile(file.path)], text: 'Export BKU $bulan $tahun');
    }
  }
}
