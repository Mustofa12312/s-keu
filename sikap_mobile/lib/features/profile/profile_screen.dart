import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/firebase_client.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);
    final isDark = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.profile),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded),
            onPressed: () => ref.read(themeModeProvider.notifier).state = !isDark,
            tooltip: 'Ganti tema',
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat profil', subtitle: e.toString()),
        data: (profile) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Avatar & Info ──
            GlassCard(
              child: Column(
                children: [
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: AppColors.emerald500.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Center(
                      child: Text(
                        (profile?.nama ?? 'U').substring(0, 1).toUpperCase(),
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                  ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),

                  const SizedBox(height: 16),

                  Text(profile?.nama ?? '-',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(profile?.email ?? '-',
                    style: const TextStyle(fontSize: 14, color: AppColors.dark400)),
                  const SizedBox(height: 12),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(profile?.roleLabel ?? '-',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                      if (profile?.namaInstansi != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.dark600,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(profile!.namaInstansi!,
                            style: const TextStyle(color: AppColors.dark200, fontSize: 13)),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

            const SizedBox(height: 20),

            // ── Detail Info ──
            const SectionHeader(title: 'Informasi Akun'),
            const SizedBox(height: 12),
            GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _InfoTile(icon: Icons.person_rounded, label: 'Nama', value: profile?.nama ?? '-'),
                  _InfoTile(icon: Icons.email_rounded, label: 'Email', value: profile?.email ?? '-'),
                  _InfoTile(icon: Icons.badge_rounded, label: 'Role', value: profile?.roleLabel ?? '-'),
                  if (profile?.namaInstansi != null)
                    _InfoTile(icon: Icons.business_rounded, label: 'Instansi', value: profile!.namaInstansi!, isLast: true),
                ],
              ),
            ).animate(delay: 100.ms).fadeIn(duration: 400.ms),

            const SizedBox(height: 20),

            // ── App Info ──
            const SectionHeader(title: 'Aplikasi'),
            const SizedBox(height: 12),
            const GlassCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _InfoTile(icon: Icons.info_outline_rounded, label: 'Versi', value: '1.0.0'),
                  _InfoTile(icon: Icons.cloud_rounded, label: 'Backend', value: 'Firebase Cloud'),
                  _InfoTile(icon: Icons.security_rounded, label: 'Keamanan', value: 'Security Rules', isLast: true),
                ],
              ),
            ).animate(delay: 200.ms).fadeIn(duration: 400.ms),

            const SizedBox(height: 24),

            if (profile?.isViewer != true) ...[
              const SectionHeader(title: 'Modul Keuangan Lanjutan'),
              const SizedBox(height: 12),
              GlassCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.account_balance_wallet_rounded, color: AppColors.info),
                      title: const Text('Hutang & Piutang', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeHutangPiutang),
                    ),
                    Divider(height: 1, color: AppColors.dark700.withValues(alpha: 0.4), indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.assignment_rounded, color: AppColors.emerald400),
                      title: const Text('Anggaran (RAPBM)', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeAnggaran),
                    ),
                  ],
                ),
              ).animate(delay: 210.ms).fadeIn(duration: 400.ms),
              const SizedBox(height: 24),
            ],

            if (profile?.isSuperAdmin == true) ...[
              const SectionHeader(title: 'Data Master'),
              const SizedBox(height: 12),
              GlassCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.category_rounded, color: AppColors.emerald400),
                      title: const Text('Kategori Transaksi', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeKategori),
                    ),
                    Divider(height: 1, color: AppColors.dark700.withValues(alpha: 0.4), indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.business_rounded, color: AppColors.info),
                      title: const Text('Instansi', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeInstansi),
                    ),
                  ],
                ),
              ).animate(delay: 220.ms).fadeIn(duration: 400.ms),
              const SizedBox(height: 24),

              const SectionHeader(title: 'Manajemen Sistem'),
              const SizedBox(height: 12),
              GlassCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.people_rounded, color: AppColors.info),
                      title: const Text('Manajemen Pengguna', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeUsers),
                    ),
                    Divider(height: 1, color: AppColors.dark700.withValues(alpha: 0.4), indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.history_rounded, color: AppColors.warning),
                      title: const Text('Log Aktivitas', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeLogAktivitas),
                    ),
                    Divider(height: 1, color: AppColors.dark700.withValues(alpha: 0.4), indent: 16, endIndent: 16),
                    ListTile(
                      leading: const Icon(Icons.settings_rounded, color: AppColors.emerald400),
                      title: const Text('Pengaturan Sistem', style: TextStyle(color: Colors.white, fontSize: 14)),
                      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.dark400),
                      onTap: () => context.push(AppStrings.routeSettings),
                    ),
                  ],
                ),
              ).animate(delay: 230.ms).fadeIn(duration: 400.ms),
              const SizedBox(height: 24),
            ],

            // ── Change Password Button ──
            ElevatedButton.icon(
              onPressed: () => _showChangePasswordDialog(context),
              icon: const Icon(Icons.lock_reset_rounded),
              label: const Text('Ubah Password'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.dark600,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 52),
              ),
            ).animate(delay: 250.ms).fadeIn(duration: 400.ms),

            const SizedBox(height: 12),

            // ── Logout Button ──
            ElevatedButton.icon(
              onPressed: () => _confirmLogout(context, ref),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Keluar dari Akun'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 52),
              ),
            ).animate(delay: 300.ms).fadeIn(duration: 400.ms),

            const SizedBox(height: 8),
            const Center(
              child: Text('SIKAP Darur Rohman · ${AppStrings.pondokName}',
                style: TextStyle(color: AppColors.dark500, fontSize: 11),
                textAlign: TextAlign.center),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Keluar?'),
        content: const Text('Anda akan keluar dari sesi ini.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await FirebaseClient.auth.signOut();
              if (context.mounted) context.go(AppStrings.routeLogin);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final passCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool loading = false;
    String? errorMsg;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Ubah Password'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Silakan masukkan password baru Anda.', style: TextStyle(color: AppColors.dark400, fontSize: 13)),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: passCtrl,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Password Baru',
                      prefixIcon: Icon(Icons.lock_outline_rounded, color: AppColors.dark400, size: 20),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Wajib diisi';
                      if (v.length < 6) return 'Minimal 6 karakter';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: confirmCtrl,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'Konfirmasi Password Baru',
                      prefixIcon: Icon(Icons.lock_rounded, color: AppColors.dark400, size: 20),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Wajib diisi';
                      if (v != passCtrl.text) return 'Password tidak cocok';
                      return null;
                    },
                  ),
                  if (errorMsg != null) ...[
                    const SizedBox(height: 12),
                    Text(errorMsg!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: loading ? null : () => Navigator.pop(ctx),
                child: const Text('Batal'),
              ),
              ElevatedButton(
                onPressed: loading ? null : () async {
                  if (!formKey.currentState!.validate()) return;
                  setState(() { loading = true; errorMsg = null; });
                  try {
                    final user = FirebaseClient.auth.currentUser;
                    if (user != null) {
                      await user.updatePassword(passCtrl.text);
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Password berhasil diubah'), backgroundColor: AppColors.emerald500),
                        );
                      }
                    } else {
                      setState(() => errorMsg = 'Sesi tidak valid, harap login ulang');
                    }
                  } catch (e) {
                    setState(() => errorMsg = 'Gagal mengubah password: ${e.toString()}');
                  } finally {
                    if (mounted) setState(() => loading = false);
                  }
                },
                child: loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Simpan'),
              ),
            ],
          );
        }
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isLast;
  const _InfoTile({required this.icon, required this.label, required this.value, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.emerald500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: AppColors.emerald400),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(color: AppColors.dark400, fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (!isLast) Divider(height: 1, color: AppColors.dark700.withValues(alpha: 0.4), indent: 16, endIndent: 16),
      ],
    );
  }
}
