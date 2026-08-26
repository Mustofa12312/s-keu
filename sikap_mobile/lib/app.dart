import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'core/constants/app_strings.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/splash_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/lock_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/transaksi/transaksi_screen.dart';
import 'features/buku_kas/buku_kas_screen.dart';
import 'features/laporan/laporan_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/kategori/kategori_screen.dart';
import 'features/instansi/instansi_screen.dart';
import 'features/hutang_piutang/hutang_piutang_screen.dart';
import 'features/anggaran/anggaran_screen.dart';
import 'features/users/users_screen.dart';
import 'features/log_aktivitas/log_aktivitas_screen.dart';
import 'features/settings/settings_screen.dart';
import 'providers/app_providers.dart';
import 'providers/biometric_provider.dart';

// ── Shell with Bottom Nav ────────────────────────────────────
class _AppShell extends StatelessWidget {
  final Widget child;
  final int currentIndex;
  final GoRouterState state;

  const _AppShell({required this.child, required this.currentIndex, required this.state});

  static const _tabs = [
    AppStrings.routeDashboard, AppStrings.routeTransaksi,
    AppStrings.routeBukuKas,   AppStrings.routeLaporan,
    AppStrings.routeProfile,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.08))),
        ),
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (i) => context.go(_tabs[i]),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded),      label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded),   label: 'Transaksi'),
            BottomNavigationBarItem(icon: Icon(Icons.menu_book_rounded),      label: 'Buku Kas'),
            BottomNavigationBarItem(icon: Icon(Icons.bar_chart_rounded),      label: 'Laporan'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded),         label: 'Profil'),
          ],
        ),
      ),
    );
  }
}

// ── Router Notifier ────────────────────────────────────────────
class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AsyncValue<User?>>(authProvider, (_, __) => notifyListeners());
    _ref.listen<bool>(biometricStateProvider, (_, __) => notifyListeners());
  }
}

// ── Router Provider ──────────────────────────────────────────
final routerProvider = Provider<GoRouter>((ref) {
  final notifier = RouterNotifier(ref);

  return GoRouter(
    initialLocation: AppStrings.routeSplash,
    refreshListenable: notifier,
    redirect: (context, state) {
      final user = ref.read(authProvider).valueOrNull;
      final isAuth = user != null;
      final isUnlocked = ref.read(biometricStateProvider);
      final loc  = state.uri.path;

      if (loc == AppStrings.routeSplash) return null;
      
      if (!isAuth && loc != AppStrings.routeLogin) return AppStrings.routeLogin;
      
      if (isAuth && !isUnlocked && loc != AppStrings.routeLock) return AppStrings.routeLock;
      
      if (isAuth && isUnlocked && (loc == AppStrings.routeLogin || loc == AppStrings.routeLock)) {
        return AppStrings.routeDashboard;
      }
      
      return null;
    },
    routes: [
      GoRoute(path: AppStrings.routeSplash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: AppStrings.routeLogin,  builder: (_, __) => const LoginScreen()),
      GoRoute(path: AppStrings.routeLock,   builder: (_, __) => const LockScreen()),
      GoRoute(path: AppStrings.routeKategori, builder: (_, __) => const KategoriScreen()),
      GoRoute(path: AppStrings.routeInstansi, builder: (_, __) => const InstansiScreen()),
      GoRoute(path: AppStrings.routeHutangPiutang, builder: (_, __) => const HutangPiutangScreen()),
      GoRoute(path: AppStrings.routeAnggaran, builder: (_, __) => const AnggaranScreen()),
      GoRoute(path: AppStrings.routeUsers, builder: (_, __) => const UsersScreen()),
      GoRoute(path: AppStrings.routeLogAktivitas, builder: (_, __) => const LogAktivitasScreen()),
      GoRoute(path: AppStrings.routeSettings, builder: (_, __) => const SettingsScreen()),

      ShellRoute(
        builder: (_, state, child) {
          final loc = state.uri.path;
          final idx = [
            AppStrings.routeDashboard, AppStrings.routeTransaksi,
            AppStrings.routeBukuKas,   AppStrings.routeLaporan,
            AppStrings.routeProfile,
          ].indexWhere((r) => loc.startsWith(r));
          return _AppShell(currentIndex: idx < 0 ? 0 : idx, state: state, child: child);
        },
        routes: [
          GoRoute(path: AppStrings.routeDashboard, builder: (_, __) => const DashboardScreen()),
          GoRoute(path: AppStrings.routeTransaksi, builder: (_, __) => const TransaksiScreen()),
          GoRoute(path: AppStrings.routeBukuKas,   builder: (_, __) => const BukuKasScreen()),
          GoRoute(path: AppStrings.routeLaporan,   builder: (_, __) => const LaporanScreen()),
          GoRoute(path: AppStrings.routeProfile,   builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
});

// ── Root App ─────────────────────────────────────────────────
class S-KeuApp extends ConsumerWidget {
  const S-KeuApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark  = ref.watch(themeModeProvider);
    final router  = ref.watch(routerProvider);
    ref.watch(biometricLifecycleProvider);

    return MaterialApp.router(
      title: AppStrings.appFullName,
      debugShowCheckedModeBanner: false,
      theme:      AppTheme.lightTheme,
      darkTheme:  AppTheme.darkTheme,
      themeMode:  isDark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: router,
    );
  }
}
