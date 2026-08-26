import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models/profile_model.dart';
import '../data/repositories/instansi_repository.dart';
import '../data/repositories/transaksi_repository.dart';
import '../data/repositories/kategori_repository.dart';
import '../data/repositories/hutang_piutang_repository.dart';
import '../data/repositories/anggaran_repository.dart';
import '../data/repositories/log_aktivitas_repository.dart';
import '../core/firebase_client.dart';

// ─── Shared Preferences ─────────────────────────────────────
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('sharedPreferencesProvider must be overridden');
});


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

final usersListProvider = FutureProvider<List<ProfileModel>>((ref) async {
  return ProfileRepository().getAll();
});

final logAktivitasListProvider = FutureProvider((ref) async {
  return LogAktivitasRepository().getAll();
});

// ─── Pengaturan ─────────────────────────────────────────────
final pengaturanProvider = FutureProvider((ref) async {
  return PengaturanRepository().getSettings();
});

// ─── Instansi List ──────────────────────────────────────────
final instansiListProvider = FutureProvider((ref) async {
  return InstansiRepository().getAll();
});

// ─── Kategori List ──────────────────────────────────────────
final kategoriListProvider = FutureProvider((ref) async {
  return KategoriRepository().getAll();
});

// ─── Theme Mode Provider ─────────────────────────────────────
final themeModeProvider = StateProvider((ref) => true); // true = dark

// ─── Transaksi Filter State ──────────────────────────────────
class TransaksiFilter {
  final String? instansiId;
  final String? bulanHijriyah;
  final String? tahunHijriyah;
  final String? search;

  const TransaksiFilter({
    this.instansiId,
    this.bulanHijriyah,
    this.tahunHijriyah,
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

class TransaksiListNotifier extends AsyncNotifier<TransaksiPage> {
  @override
  FutureOr<TransaksiPage> build() async {
    return _fetch(null);
  }

  Future<TransaksiPage> _fetch(DocumentSnapshot? lastDoc) async {
    final profile = await ref.watch(profileProvider.future);
    final filter = ref.watch(transaksiFilterProvider);
    final pengaturan = await ref.watch(pengaturanProvider.future);
    
    final effectiveInstansiId = profile?.isSuperAdmin == true 
        ? filter.instansiId 
        : profile?.instansiId;

    final effectiveTahun = filter.tahunHijriyah ?? pengaturan.tahunAktif;

    return TransaksiRepository().getPaginated(
      instansiId:    effectiveInstansiId,
      bulanHijriyah: filter.bulanHijriyah,
      tahunHijriyah: effectiveTahun,
      search:        filter.search,
      lastDocument:  lastDoc,
      limit:         15,
    );
  }

  Future<void> fetchNextPage() async {
    final currentPage = state.valueOrNull;
    if (currentPage == null || !currentPage.hasMore || currentPage.isFetchingMore) return;

    // Set UI to loading more
    state = AsyncData(currentPage.copyWith(isFetchingMore: true));

    try {
      final nextPage = await _fetch(currentPage.lastDocument);
      state = AsyncData(TransaksiPage(
        data: [...currentPage.data, ...nextPage.data],
        lastDocument: nextPage.lastDocument,
        hasMore: nextPage.hasMore,
        isFetchingMore: false,
      ));
    } catch (e, st) {
      // Revert loading state on error
      state = AsyncData(currentPage.copyWith(isFetchingMore: false));
    }
  }
}

final transaksiListProvider = AsyncNotifierProvider<TransaksiListNotifier, TransaksiPage>(() {
  return TransaksiListNotifier();
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

    if (jenis == 'pemasukan') { totalPem += nominal; }
    else { totalPen += nominal; }

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

    if (jenis == 'pemasukan') { totalPem += nominal; }
    else { totalPen += nominal; }

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

// ─── Hutang Piutang Filter & Provider ─────────────────────────
class HutangPiutangFilter {
  final String jenis; // 'hutang' | 'piutang'
  final String? instansiId;
  final String? bulanHijriyah;
  final String? tahunHijriyah;
  final String? search;

  const HutangPiutangFilter({
    this.jenis = 'hutang',
    this.instansiId,
    this.bulanHijriyah,
    this.tahunHijriyah,
    this.search,
  });

  HutangPiutangFilter copyWith({
    String? jenis,
    String? instansiId,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? search,
    bool clearInstansi = false,
    bool clearBulan = false,
    bool clearSearch = false,
  }) => HutangPiutangFilter(
    jenis: jenis ?? this.jenis,
    instansiId: clearInstansi ? null : instansiId ?? this.instansiId,
    bulanHijriyah: clearBulan ? null : bulanHijriyah ?? this.bulanHijriyah,
    tahunHijriyah: tahunHijriyah ?? this.tahunHijriyah,
    search: clearSearch ? null : search ?? this.search,
  );
}

final hutangPiutangFilterProvider = StateProvider<HutangPiutangFilter>((ref) {
  return const HutangPiutangFilter();
});

final hutangPiutangListProvider = FutureProvider<List>((ref) async {
  final profile = await ref.watch(profileProvider.future);
  final filter = ref.watch(hutangPiutangFilterProvider);
  final pengaturan = await ref.watch(pengaturanProvider.future);
  
  final effectiveInstansiId = profile?.isSuperAdmin == true 
      ? filter.instansiId 
      : profile?.instansiId;

  final effectiveTahun = filter.tahunHijriyah ?? pengaturan.tahunAktif;

  return HutangPiutangRepository().getAll(
    jenis:         filter.jenis,
    instansiId:    effectiveInstansiId,
    bulanHijriyah: filter.bulanHijriyah,
    tahunHijriyah: effectiveTahun,
    search:        filter.search,
    orderDesc:     true,
  );
});

// ─── Anggaran Filter & Provider ─────────────────────────
class AnggaranFilter {
  final String? instansiId;
  final String tahunPelajaran;
  final String kategori; // 'pemasukan' | 'pengeluaran'

  const AnggaranFilter({
    this.instansiId,
    this.tahunPelajaran = '2025/2026',
    this.kategori = 'pengeluaran',
  });

  AnggaranFilter copyWith({
    String? instansiId,
    String? tahunPelajaran,
    String? kategori,
    bool clearInstansi = false,
  }) => AnggaranFilter(
    instansiId: clearInstansi ? null : instansiId ?? this.instansiId,
    tahunPelajaran: tahunPelajaran ?? this.tahunPelajaran,
    kategori: kategori ?? this.kategori,
  );
}

final anggaranFilterProvider = StateProvider<AnggaranFilter>((ref) => const AnggaranFilter());

final anggaranListProvider = FutureProvider((ref) async {
  final profile = await ref.watch(profileProvider.future);
  final filter = ref.watch(anggaranFilterProvider);
  
  final effectiveInstansiId = profile?.isSuperAdmin == true 
      ? filter.instansiId 
      : profile?.instansiId;

  return AnggaranRepository().getRencana(
    instansiId: effectiveInstansiId,
    tahunPelajaran: filter.tahunPelajaran,
    kategori: filter.kategori,
  );
});
