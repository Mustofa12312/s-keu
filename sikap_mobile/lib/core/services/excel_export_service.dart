import 'dart:io';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/utils/format_utils.dart';

class ExcelExportService {
  static Future<void> generateLaporanExcel({
    required String title,
    required List<Map<String, dynamic>> chartData,
  }) async {
    var excel = Excel.createExcel();
    Sheet sheetObject = excel['Sheet1'];

    // Header
    sheetObject.appendRow([
      TextCellValue('Bulan'),
      TextCellValue('Pemasukan (Rp)'),
      TextCellValue('Pengeluaran (Rp)')
    ]);

    // Data
    for (var d in chartData) {
      final pem = d['pem'] as int? ?? 0;
      final pen = d['pen'] as int? ?? 0;
      sheetObject.appendRow([
        TextCellValue(d['bulan']?.toString() ?? ''),
        IntCellValue(pem),
        IntCellValue(pen),
      ]);
    }

    // Save and Share
    var fileBytes = excel.save();
    if (fileBytes != null) {
      final directory = await getTemporaryDirectory();
      final filePath = '${directory.path}/${title.replaceAll(' ', '_')}.xlsx';
      final file = File(filePath);
      await file.writeAsBytes(fileBytes);

      // Share
      await Share.shareXFiles([XFile(filePath)], text: 'Berikut adalah lampiran file laporan $title');
    }
  }
}
