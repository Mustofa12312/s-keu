import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/log_aktivitas_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class LogAktivitasScreen extends ConsumerWidget {
  const LogAktivitasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncData = ref.watch(logAktivitasListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Log Aktivitas')),
      body: asyncData.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat', subtitle: e.toString(), icon: Icons.error_outline),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(message: 'Belum ada aktivitas', icon: Icons.history_rounded);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(logAktivitasListProvider),
            color: AppColors.emerald500,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final log = list[i];
                return GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: _getModuleColor(log.module).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                        child: Icon(_getModuleIcon(log.module), color: _getModuleColor(log.module), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(log.action, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                            const SizedBox(height: 4),
                            Text(log.description, style: const TextStyle(color: AppColors.dark300, fontSize: 13)),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Text('${log.userNama} (${log.userRole})', style: const TextStyle(color: AppColors.dark400, fontSize: 11)),
                                const Spacer(),
                                Text(FormatUtils.date(log.createdAt ?? ''), style: const TextStyle(color: AppColors.dark400, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: (i * 30).ms).slideX(begin: 0.1);
              },
            ),
          );
        },
      ),
    );
  }

  Color _getModuleColor(String module) {
    switch (module.toLowerCase()) {
      case 'transaksi': return AppColors.emerald400;
      case 'buku_kas': return AppColors.info;
      case 'auth': return AppColors.warning;
      case 'users': return AppColors.error;
      case 'hutang_piutang': return AppColors.incomeGradient.colors.first;
      case 'anggaran': return AppColors.expenseGradient.colors.first;
      default: return AppColors.dark400;
    }
  }

  IconData _getModuleIcon(String module) {
    switch (module.toLowerCase()) {
      case 'transaksi': return Icons.receipt_long_rounded;
      case 'buku_kas': return Icons.menu_book_rounded;
      case 'auth': return Icons.security_rounded;
      case 'users': return Icons.people_rounded;
      case 'hutang_piutang': return Icons.account_balance_wallet_rounded;
      case 'anggaran': return Icons.assignment_rounded;
      default: return Icons.info_outline_rounded;
    }
  }
}
