import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../core/utils/format_utils.dart';

class PdfExportService {
  static Future<void> generateLaporanPdf({
    required String title,
    required String subtitle,
    required int totalPemasukan,
    required int totalPengeluaran,
    required int saldoAkhir,
    required List<Map<String, dynamic>> chartData,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            _buildHeader(title, subtitle),
            pw.SizedBox(height: 24),
            _buildSummary(totalPemasukan, totalPengeluaran, saldoAkhir),
            pw.SizedBox(height: 24),
            _buildTable(chartData),
          ];
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: '${title.replaceAll(' ', '_')}.pdf',
    );
  }

  static pw.Widget _buildHeader(String title, String subtitle) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        pw.Text(
          'YAYASAN DARUR ROJA\'UL MUKHTAR',
          style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold),
        ),
        pw.Text(
          'Sistem Informasi Keuangan Pondok Pesantren (SIKAP)',
          style: const pw.TextStyle(fontSize: 12),
        ),
        pw.SizedBox(height: 16),
        pw.Divider(),
        pw.SizedBox(height: 16),
        pw.Text(
          title,
          style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
        ),
        pw.Text(
          subtitle,
          style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700),
        ),
      ],
    );
  }

  static pw.Widget _buildSummary(int pem, int pen, int saldo) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey300),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
        children: [
          _summaryItem('Total Pemasukan', pem, PdfColors.green700),
          _summaryItem('Total Pengeluaran', pen, PdfColors.red700),
          _summaryItem('Saldo Akhir', saldo, saldo >= 0 ? PdfColors.blue700 : PdfColors.red700),
        ],
      ),
    );
  }

  static pw.Widget _summaryItem(String label, int value, PdfColor color) {
    return pw.Column(
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
        pw.SizedBox(height: 4),
        pw.Text(FormatUtils.rupiah(value), style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: color)),
      ],
    );
  }

  static pw.Widget _buildTable(List<Map<String, dynamic>> chartData) {
    if (chartData.isEmpty) {
      return pw.Text('Tidak ada data transaksi.');
    }

    return pw.TableHelper.fromTextArray(
      border: pw.TableBorder.all(color: PdfColors.grey400),
      headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
      headerDecoration: const pw.BoxDecoration(color: PdfColors.blueGrey800),
      cellAlignment: pw.Alignment.centerRight,
      headers: ['Bulan', 'Pemasukan (Rp)', 'Pengeluaran (Rp)'],
      data: chartData.map((d) {
        final pem = d['pem'] as int? ?? 0;
        final pen = d['pen'] as int? ?? 0;
        return [
          d['bulan']?.toString() ?? '',
          FormatUtils.rupiah(pem).replaceAll('Rp ', ''),
          FormatUtils.rupiah(pen).replaceAll('Rp ', ''),
        ];
      }).toList(),
    );
  }
}
