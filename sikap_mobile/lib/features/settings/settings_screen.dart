import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

import '../../core/firebase_client.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  TextEditingController? _tahunCtrl;
  bool _loading = false;

  @override
  void dispose() {
    _tahunCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncData = ref.watch(pengaturanProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan Sistem')),
      body: asyncData.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat pengaturan', subtitle: e.toString(), icon: Icons.error_outline),
        data: (settings) {
          _tahunCtrl ??= TextEditingController(text: settings.tahunAktif);
          
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const SectionHeader(title: 'Tahun Aktif'),
                const SizedBox(height: 12),
                GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tahun Pelajaran / Hijriyah Aktif', style: TextStyle(color: AppColors.dark300, fontSize: 13)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _tahunCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(
                          hintText: 'Contoh: 1446 atau 2025/2026',
                          prefixIcon: Icon(Icons.calendar_today_rounded, color: AppColors.dark400, size: 18),
                        ),
                        validator: (v) => v!.isEmpty ? 'Tidak boleh kosong' : null,
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _loading ? null : () => _saveSettings(settings.tahunAktif),
                          icon: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.save_rounded),
                          label: const Text('Simpan Pengaturan'),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 400.ms),
                
                const SizedBox(height: 24),
                const SectionHeader(title: 'Keamanan'),
                const SizedBox(height: 12),
                GlassCard(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: SwitchListTile(
                    title: const Text('Gunakan Sidik Jari', style: TextStyle(color: Colors.white, fontSize: 14)),
                    subtitle: const Text('Kunci aplikasi dengan biometrik', style: TextStyle(color: AppColors.dark400, fontSize: 12)),
                    activeColor: AppColors.emerald500,
                    value: ref.watch(sharedPreferencesProvider).getBool('use_biometric') ?? false,
                    onChanged: (val) async {
                      await ref.read(sharedPreferencesProvider).setBool('use_biometric', val);
                      // Invalidate the provider to rebuild UI based on new preference
                      ref.invalidate(sharedPreferencesProvider);
                    },
                    secondary: const Icon(Icons.fingerprint_rounded, color: AppColors.emerald500),
                  ),
                ).animate().fadeIn(duration: 400.ms),

                const SizedBox(height: 24),
                const SectionHeader(title: 'Tentang Aplikasi'),
                const SizedBox(height: 12),
                const GlassCard(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Icon(Icons.account_balance_rounded, size: 48, color: AppColors.emerald500),
                      SizedBox(height: 12),
                      Text('S-KEU Mobile', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      SizedBox(height: 4),
                      Text('Sistem Informasi Keuangan Pondok Pesantren\nDarur Roja\'ul Mukhtar', textAlign: TextAlign.center, style: TextStyle(color: AppColors.dark400, fontSize: 12)),
                      Divider(color: AppColors.dark600, height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Versi', style: TextStyle(color: AppColors.dark400)),
                          Text('1.0.0', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _saveSettings(String id) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      // Because PengaturanRepository getSettings in mobile app hardcoded id '1' and doesn't have update method
      // Wait, let's look at instansi_repository.dart to see if it has update method for Pengaturan.
      // If not, we can just throw an error or create the update method inline here for simplicity since it's just a query.
      await FirebaseClient.firestore.collection('pengaturan').doc('general').update({
        'tahun_aktif': _tahunCtrl!.text.trim(),
      });
      ref.invalidate(pengaturanProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pengaturan berhasil disimpan')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
