import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';

import '../../data/models/transaksi_model.dart';
import '../utils/format_utils.dart';

class PrinterService {
  Future<void> printTransaksiStruk(TransaksiModel transaksi, String namaInstansi) async {
    final bool isConnected = await PrintBluetoothThermal.connectionStatus;
    if (!isConnected) {
      throw Exception('Printer tidak terhubung');
    }

    // Set up ESC/POS profile (PaperSize.mm58 is standard for mini portable printers)
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    // Header
    bytes += generator.text(
      namaInstansi.toUpperCase(),
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );
    bytes += generator.text(
      'SIKAP Darur Rohman',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.emptyLines(1);
    
    // Receipt Info
    bytes += generator.text('Tgl : ${FormatUtils.date(transaksi.tanggal)}');
    bytes += generator.text('Wkt : ${DateFormat('HH:mm:ss').format(DateTime.now())}');
    bytes += generator.text('Tipe: ${transaksi.isPemasukan ? "PEMASUKAN" : "PENGELUARAN"}');
    if (transaksi.kodeTransaksi?.isNotEmpty == true) {
      bytes += generator.text('Kode: ${transaksi.kodeTransaksi}');
    }
    
    bytes += generator.hr(); // separator line
    
    // Uraian
    bytes += generator.text(transaksi.uraian, styles: const PosStyles(bold: true));
    bytes += generator.emptyLines(1);
    
    // Nominal
    bytes += generator.row([
      PosColumn(text: 'Nominal', width: 4, styles: const PosStyles(bold: true)),
      PosColumn(
        text: FormatUtils.rupiah(transaksi.nominal), 
        width: 8, 
        styles: const PosStyles(align: PosAlign.right, bold: true, height: PosTextSize.size2)
      ),
    ]);
    
    bytes += generator.hr();
    
    // Footer
    bytes += generator.emptyLines(1);
    bytes += generator.text('Terima Kasih', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.text('Simpan struk ini sebagai bukti sah', styles: const PosStyles(align: PosAlign.center));
    
    // Feed and cut
    bytes += generator.feed(2);

    // Print
    await PrintBluetoothThermal.writeBytes(bytes);
  }
}
