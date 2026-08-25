import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/transaksi_model.dart';
import '../../providers/app_providers.dart';
import '../../providers/notification_provider.dart';
import '../../shared/widgets/app_widgets.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync  = ref.watch(profileProvider);
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      body: RefreshIndicator(
        color: AppColors.emerald400,
        backgroundColor: AppColors.dark800,
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(profileProvider);
          await ref.read(dashboardProvider.future);
        },
        child: CustomScrollView(
        slivers: [
          // ── Flexible App Bar ──
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.dark900,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppColors.darkBgGradient),
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 0),
                child: profileAsync.when(
                  data: (profile) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            '${FormatUtils.greetingEmoji()} ${FormatUtils.greeting()},',
                            style: const TextStyle(color: AppColors.dark300, fontSize: 14),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.emerald600.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.emerald600.withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              profile?.roleLabel ?? '-',
                              style: const TextStyle(color: AppColors.emerald400, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                          const SizedBox(width: 12),
                          _NotificationBell(),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile?.nama ?? 'Pengguna',
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile?.namaInstansi ?? AppStrings.pondokName,
                        style: const TextStyle(color: AppColors.dark400, fontSize: 13),
                      ),
                    ],
                  ),
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
                  error: (_, __) => const SizedBox(),
                ),
              ),
            ),
          ),

          // ── Content ──
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: dashboardAsync.when(
              loading: () => SliverList(
                delegate: SliverChildListDelegate([
                  const ShimmerCard(height: 110),
                  const SizedBox(height: 12),
                  const ShimmerCard(height: 110),
                  const SizedBox(height: 12),
                  const ShimmerCard(height: 110),
                  const SizedBox(height: 24),
                  const ShimmerCard(height: 220),
                ]),
              ),
              error: (e, _) => SliverFillRemaining(
                child: EmptyState(message: 'Gagal memuat data', subtitle: e.toString(), icon: Icons.error_outline),
              ),
              data: (data) => SliverList(
                delegate: SliverChildListDelegate([
                  // ── Stat Cards ──
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: AppStrings.pemasukan,
                          amount: data.totalPemasukan,
                          icon: Icons.trending_up_rounded,
                          gradient: AppColors.incomeGradient,
                          index: 0,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: AppStrings.pengeluaran,
                          amount: data.totalPengeluaran,
                          icon: Icons.trending_down_rounded,
                          gradient: AppColors.expenseGradient,
                          index: 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  StatCard(
                    title: 'Saldo Akhir',
                    amount: data.saldo,
                    icon: Icons.account_balance_wallet_rounded,
                    gradient: data.saldo < 0 
                        ? AppColors.expenseGradient 
                        : AppColors.balanceGradient,
                    index: 2,
                  ),

                  const SizedBox(height: 24),

                  // ── Chart ──
                  if (data.chartData.isNotEmpty) ...[
                    const SectionHeader(title: 'Grafik Transaksi Bulanan'),
                    const SizedBox(height: 12),
                    // Chart Legend
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(width: 12, height: 12,
                          decoration: BoxDecoration(color: AppColors.emerald500, borderRadius: BorderRadius.circular(2))),
                        const SizedBox(width: 6),
                        const Text('Pemasukan', style: TextStyle(color: AppColors.dark400, fontSize: 11)),
                        const SizedBox(width: 20),
                        Container(width: 12, height: 12,
                          decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(2))),
                        const SizedBox(width: 6),
                        const Text('Pengeluaran', style: TextStyle(color: AppColors.dark400, fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: SizedBox(
                        height: 220,
                        child: _TransaksiBarChart(chartData: data.chartData),
                      ),
                    ).animate(delay: 400.ms).fadeIn(duration: 400.ms),
                    const SizedBox(height: 24),
                  ],

                  // ── Recent Transaksi ──
                  SectionHeader(
                    title: 'Aktivitas Terbaru',
                    onSeeAll: () => context.go(AppStrings.routeTransaksi),
                  ),
                  const SizedBox(height: 12),

                  if (data.recentTransaksi.isEmpty)
                    const EmptyState(message: 'Belum ada transaksi', icon: Icons.receipt_long_rounded)
                  else
                    ...data.recentTransaksi.asMap().entries.map((entry) {
                      if (entry.value is! TransaksiModel) return const SizedBox.shrink();
                      final t = entry.value as TransaksiModel;
                      return _RecentTransaksiCard(transaksi: t, index: entry.key);
                    }),

                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ),
        ],
        ),
      ),
    );
  }
}

// ── Bar Chart Widget ─────────────────────────────────────────
class _TransaksiBarChart extends StatelessWidget {
  final List<Map<String, dynamic>> chartData;

  const _TransaksiBarChart({required this.chartData});

  @override
  Widget build(BuildContext context) {
    if (chartData.isEmpty) return const SizedBox();

    final maxVal = chartData.fold<int>(0, (prev, e) {
      final pem = (e['pem'] as int? ?? 0);
      final pen = (e['pen'] as int? ?? 0);
      final localMax = pem > pen ? pem : pen;
      return prev > localMax ? prev : localMax;
    });

    return BarChart(
      BarChartData(
        maxY: (maxVal * 1.2).toDouble(),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(color: AppColors.dark700.withValues(alpha: 0.4), strokeWidth: 1),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 55,
              getTitlesWidget: (v, _) => Text(
                FormatUtils.rupiahCompact(v.toInt()),
                style: const TextStyle(color: AppColors.dark400, fontSize: 9),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (v, _) {
                final idx = v.toInt();
                if (idx < 0 || idx >= chartData.length) return const SizedBox();
                final bulan = (chartData[idx]['bulan'] as String?) ?? '';
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    bulan.length > 3 ? bulan.substring(0, 3) : bulan,
                    style: const TextStyle(color: AppColors.dark400, fontSize: 9),
                  ),
                );
              },
            ),
          ),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles:   const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        barGroups: chartData.asMap().entries.map((entry) {
          final idx = entry.key;
          final d   = entry.value;
          final pem = (d['pem'] as int? ?? 0).toDouble();
          final pen = (d['pen'] as int? ?? 0).toDouble();
          return BarChartGroupData(
            x: idx,
            groupVertically: false,
            barsSpace: 4,
            barRods: [
              BarChartRodData(
                toY: pem,
                gradient: AppColors.incomeGradient,
                width: 10,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
              BarChartRodData(
                toY: pen,
                gradient: AppColors.expenseGradient,
                width: 10,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ],
          );
        }).toList(),
        barTouchData: BarTouchData(
          touchTooltipData: BarTouchTooltipData(
            getTooltipItem: (group, groupIdx, rod, rodIdx) {
              final bulan = chartData[groupIdx]['bulan'] ?? '';
              final label = rodIdx == 0 ? 'Pemasukan' : 'Pengeluaran';
              return BarTooltipItem(
                '$bulan\n$label\n${FormatUtils.rupiahCompact(rod.toY.toInt())}',
                const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
              );
            },
          ),
        ),
      ),
    );
  }
}

// ── Recent Transaksi Card ──────────────────────────────────
class _RecentTransaksiCard extends StatelessWidget {
  final TransaksiModel transaksi;
  final int index;

  const _RecentTransaksiCard({required this.transaksi, required this.index});

  @override
  Widget build(BuildContext context) {
    final isPem = transaksi.isPemasukan;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: isPem
                    ? AppColors.emerald500.withValues(alpha: 0.15)
                    : AppColors.error.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isPem ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
                color: isPem ? AppColors.emerald400 : AppColors.error,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaksi.uraian,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${FormatUtils.date(transaksi.tanggal)} · ${transaksi.namaInstansi ?? ''}',
                    style: const TextStyle(fontSize: 11, color: AppColors.dark400),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${isPem ? '+' : '-'}${FormatUtils.rupiahCompact(transaksi.nominal)}',
              style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700,
                color: isPem ? AppColors.emerald400 : AppColors.error,
              ),
            ),
          ],
        ),
      ),
    ).animate(delay: Duration(milliseconds: 200 + index * 80))
      .fadeIn(duration: 300.ms)
      .slideX(begin: 0.1, end: 0);
  }
}

class _NotificationBell extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifsAsync = ref.watch(notificationStreamProvider);
    final readIds = ref.watch(readNotificationProvider);

    return notifsAsync.maybeWhen(
      data: (notifs) {
        final unreadCount = notifs.where((n) => !readIds.contains(n.id)).length;
        
        return InkWell(
          onTap: () => _showNotificationSheet(context, notifs, readIds, ref),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(
                unreadCount > 0 ? Icons.notifications_active_rounded : Icons.notifications_none_rounded,
                color: unreadCount > 0 ? AppColors.emerald400 : AppColors.dark400,
                size: 24,
              ).animate(target: unreadCount > 0 ? 1 : 0).shake(hz: 4, curve: Curves.easeInOut),
              if (unreadCount > 0)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                    child: Text(
                      unreadCount > 9 ? '9+' : unreadCount.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
      orElse: () => const Icon(Icons.notifications_none_rounded, color: AppColors.dark400, size: 24),
    );
  }

  void _showNotificationSheet(BuildContext context, List<TransaksiModel> notifs, List<String> readIds, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        final unreadCount = notifs.where((n) => !readIds.contains(n.id)).length;

        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          builder: (_, controller) {
            return Container(
              decoration: const BoxDecoration(
                color: AppColors.dark900,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: AppColors.dark700)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_rounded, color: AppColors.emerald400),
                        const SizedBox(width: 8),
                        const Text('Notifikasi', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        const Spacer(),
                        if (unreadCount > 0)
                          TextButton.icon(
                            onPressed: () {
                              ref.read(readNotificationProvider.notifier).markAllAsRead(notifs.map((e) => e.id).toList());
                              Navigator.pop(ctx);
                            },
                            icon: const Icon(Icons.checklist_rounded, size: 16, color: AppColors.emerald400),
                            label: const Text('Tandai Semua', style: TextStyle(color: AppColors.emerald400, fontSize: 12)),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: notifs.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.notifications_off_rounded, size: 48, color: AppColors.dark600),
                                SizedBox(height: 12),
                                Text('Belum ada notifikasi', style: TextStyle(color: AppColors.dark400)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: controller,
                            itemCount: notifs.length,
                            itemBuilder: (context, i) {
                              final n = notifs[i];
                              final isRead = readIds.contains(n.id);
                              final isMasuk = n.jenis == 'pemasukan';
                              
                              return InkWell(
                                onTap: () {
                                  ref.read(readNotificationProvider.notifier).markAsRead(n.id);
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                  decoration: BoxDecoration(
                                    color: isRead ? Colors.transparent : AppColors.emerald900.withOpacity(0.2),
                                    border: const Border(bottom: BorderSide(color: AppColors.dark800)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: isMasuk ? AppColors.emerald900.withOpacity(0.5) : AppColors.error.withOpacity(0.2),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          isMasuk ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                                          color: isMasuk ? AppColors.emerald400 : AppColors.error,
                                          size: 16,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    n.uraian,
                                                    style: TextStyle(
                                                      color: isRead ? AppColors.dark300 : Colors.white,
                                                      fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                    maxLines: 2,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                if (!isRead)
                                                  Container(width: 8, height: 8, margin: const EdgeInsets.only(left: 8), decoration: const BoxDecoration(color: AppColors.emerald500, shape: BoxShape.circle)),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '${isMasuk ? '+' : '-'}${FormatUtils.rupiah(n.nominal)}',
                                              style: TextStyle(
                                                color: isMasuk ? AppColors.emerald400 : AppColors.error,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                if (n.instansi != null) ...[
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(color: AppColors.dark700, borderRadius: BorderRadius.circular(4)),
                                                    child: Text(n.instansi!['nama_instansi'] ?? '', style: const TextStyle(color: AppColors.dark300, fontSize: 10)),
                                                  ),
                                                  const SizedBox(width: 8),
                                                ],
                                                Text(FormatUtils.date(n.createdAt ?? ''), style: const TextStyle(color: AppColors.dark500, fontSize: 11)),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
