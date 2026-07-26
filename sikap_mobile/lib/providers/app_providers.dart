import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../data/models/profile_model.dart';
import '../data/repositories/instansi_repository.dart';
import '../data/repositories/transaksi_repository.dart';
import '../core/firebase_client.dart';

// ─── Auth Provider ──────────────────────────────────────────
final authProvider = StreamProvider<User?>((ref) {
  return FirebaseClient.auth.authStateChanges();
});

// ─── Current Profile ────────────────────────────────────────
final profileProvider = FutureProvider<ProfileModel?>((ref) async {
  final user = await ref.watch(authProvider.future);
  if (user == null) return null;
  return ProfileRepository().getMyProfile(user.uid);
});

// ─── Pengaturan ─────────────────────────────────────────────
final pengaturanProvider = FutureProvider((ref) async {
  return PengaturanRepository().getSettings();
});

// ─── Instansi List ──────────────────────────────────────────
final instansiListProvider = FutureProvider((ref) async {
  return InstansiRepository().getAll();
});

// ─── Theme Mode Provider ─────────────────────────────────────
final themeModeProvider = StateProvider((ref) => true); // true = dark

// ─── Transaksi Filter State ──────────────────────────────────
class TransaksiFilter {
  final String? instansiId;
  final String? bulanHijriyah;
  final String tahunHijriyah;
  final String? search;

  const TransaksiFilter({
    this.instansiId,
    this.bulanHijriyah,
    this.tahunHijriyah = '1446',
    this.search,
  });

  TransaksiFilter copyWith({
    String? instansiId,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? search,
    bool clearInstansi = false,
    bool clearBulan = false,
    bool clearSearch = false,
  }) => TransaksiFilter(
    instansiId:    clearInstansi   ? null : instansiId    ?? this.instansiId,
    bulanHijriyah: clearBulan      ? null : bulanHijriyah ?? this.bulanHijriyah,
    tahunHijriyah: tahunHijriyah ?? this.tahunHijriyah,
    search:        clearSearch     ? null : search        ?? this.search,
  );
}

final transaksiFilterProvider = StateProvider<TransaksiFilter>((ref) {
  return const TransaksiFilter();
});

final transaksiListProvider = FutureProvider<List>((ref) async {
  final filter = ref.watch(transaksiFilterProvider);
  return TransaksiRepository().getAll(
    instansiId:    filter.instansiId,
    bulanHijriyah: filter.bulanHijriyah,
    tahunHijriyah: filter.tahunHijriyah,
    search:        filter.search,
    orderDesc:     false,
  );
});

// ─── Dashboard Summary ───────────────────────────────────────
class DashboardSummary {
  final int totalPemasukan;
  final int totalPengeluaran;
  final int saldo;
  final List<Map<String, dynamic>> chartData;
  final List recentTransaksi;

  const DashboardSummary({
    required this.totalPemasukan,
    required this.totalPengeluaran,
    required this.saldo,
    required this.chartData,
    required this.recentTransaksi,
  });
}

final dashboardProvider = FutureProvider<DashboardSummary>((ref) async {
  final profile = await ref.watch(profileProvider.future);
  final pengaturan = await ref.watch(pengaturanProvider.future);
  final tahun = pengaturan.tahunAktif;
  final instansiId = profile?.isSuperAdmin == true ? null : profile?.instansiId;

  final repo = TransaksiRepository();
  final summary = await repo.getSummary(instansiId: instansiId, tahunHijriyah: tahun);
  final recent = await repo.getAll(
    instansiId: instansiId,
    tahunHijriyah: tahun,
    orderDesc: true,
    limit: 5,
  );

  int totalPem = 0, totalPen = 0;
  final Map<String, Map<String, int>> byBulan = {};

  for (final row in summary) {
    final nominal = (row['nominal'] as num).toInt();
    final jenis = row['jenis'] as String;
    final bulan = row['bulan_hijriyah'] as String? ?? '';

    if (jenis == 'pemasukan') totalPem += nominal;
    else totalPen += nominal;

    byBulan.putIfAbsent(bulan, () => {'pem': 0, 'pen': 0});
    byBulan[bulan]![jenis == 'pemasukan' ? 'pem' : 'pen'] =
        (byBulan[bulan]![jenis == 'pemasukan' ? 'pem' : 'pen'] ?? 0) + nominal;
  }

  final chartData = byBulan.entries
      .map((e) => {'bulan': e.key, 'pem': e.value['pem'] ?? 0, 'pen': e.value['pen'] ?? 0})
      .toList();

  return DashboardSummary(
    totalPemasukan:  totalPem,
    totalPengeluaran: totalPen,
    saldo:           totalPem - totalPen,
    chartData:       chartData,
    recentTransaksi: recent,
  );
});

// ─── Laporan Filter & Provider ───────────────────────────────
class LaporanFilter {
  final String? instansiId;
  final String? tahunHijriyah;

  const LaporanFilter({this.instansiId, this.tahunHijriyah});

  LaporanFilter copyWith({String? instansiId, String? tahunHijriyah, bool clearInstansi = false}) => 
    LaporanFilter(
      instansiId: clearInstansi ? null : instansiId ?? this.instansiId,
      tahunHijriyah: tahunHijriyah ?? this.tahunHijriyah,
    );
}

final laporanFilterProvider = StateProvider<LaporanFilter>((ref) => const LaporanFilter());

final laporanProvider = FutureProvider<DashboardSummary>((ref) async {
  final profile = await ref.watch(profileProvider.future);
  final pengaturan = await ref.watch(pengaturanProvider.future);
  final filter = ref.watch(laporanFilterProvider);
  
  final tahun = filter.tahunHijriyah ?? pengaturan.tahunAktif;
  final effectiveInstansiId = profile?.isSuperAdmin == true ? filter.instansiId : profile?.instansiId;

  final repo = TransaksiRepository();
  final summary = await repo.getSummary(instansiId: effectiveInstansiId, tahunHijriyah: tahun);
  
  int totalPem = 0, totalPen = 0;
  final Map<String, Map<String, int>> byBulan = {};

  for (final row in summary) {
    final nominal = (row['nominal'] as num).toInt();
    final jenis = row['jenis'] as String;
    final bulan = row['bulan_hijriyah'] as String? ?? '';

    if (jenis == 'pemasukan') totalPem += nominal;
    else totalPen += nominal;

    byBulan.putIfAbsent(bulan, () => {'pem': 0, 'pen': 0});
    byBulan[bulan]![jenis == 'pemasukan' ? 'pem' : 'pen'] =
        (byBulan[bulan]![jenis == 'pemasukan' ? 'pem' : 'pen'] ?? 0) + nominal;
  }

  final chartData = byBulan.entries
      .map((e) => {'bulan': e.key, 'pem': e.value['pem'] ?? 0, 'pen': e.value['pen'] ?? 0})
      .toList();

  return DashboardSummary(
    totalPemasukan:  totalPem,
    totalPengeluaran: totalPen,
    saldo:           totalPem - totalPen,
    chartData:       chartData,
    recentTransaksi: const [], // Not needed for laporan
  );
});
