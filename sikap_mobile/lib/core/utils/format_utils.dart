import 'package:intl/intl.dart';

class FormatUtils {
  static final _rupiah = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );


  static String rupiah(num? value) {
    if (value == null) return 'Rp 0';
    return _rupiah.format(value);
  }

  static String rupiahCompact(num? value) {
    if (value == null) return 'Rp 0';
    if (value.abs() >= 1000000000) {
      return 'Rp ${(value / 1000000000).toStringAsFixed(1)}M';
    }
    if (value.abs() >= 1000000) {
      return 'Rp ${(value / 1000000).toStringAsFixed(1)}jt';
    }
    if (value.abs() >= 1000) {
      return 'Rp ${(value / 1000).toStringAsFixed(0)}rb';
    }
    return rupiah(value);
  }

  static DateTime? _parseInternal(String dateStr) {
    if (dateStr.startsWith('Timestamp(seconds=')) {
      try {
        final secStr = dateStr.replaceAll('Timestamp(seconds=', '').split(',')[0];
        final seconds = int.parse(secStr);
        return DateTime.fromMillisecondsSinceEpoch(seconds * 1000);
      } catch (_) {}
    }
    try {
      return DateTime.parse(dateStr);
    } catch (_) {
      return null;
    }
  }

  static String date(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    final dt = _parseInternal(dateStr);
    if (dt != null) {
      return DateFormat('dd MMM yyyy', 'id_ID').format(dt);
    }
    return ''; // Hilangkan hal yang tidak perlu jika gagal di-parse
  }

  static String dateShort(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    final dt = _parseInternal(dateStr);
    if (dt != null) {
      return DateFormat('dd/MM/yy', 'id_ID').format(dt);
    }
    return '';
  }

  static String todayDate() {
    return DateFormat('EEEE, dd MMMM yyyy', 'id_ID').format(DateTime.now());
  }

  static String nowDateISO() {
    return DateTime.now().toIso8601String().split('T').first;
  }

  static String greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  static String greetingEmoji() {
    final hour = DateTime.now().hour;
    if (hour < 11) return '☀️';
    if (hour < 15) return '🌤️';
    if (hour < 18) return '🌅';
    return '🌙';
  }

  /// Bulan Hijriyah label dari kode (misal: 'Muharram' → 'Muharram')
  static const List<String> _bulanHijriyah = [
    'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah',
  ];

  static List<String> get bulanHijriyahList => _bulanHijriyah;

  static String bulanLabel(String? kode) {
    if (kode == null || kode.isEmpty) return '-';
    return kode; // Already stored as label
  }
}
