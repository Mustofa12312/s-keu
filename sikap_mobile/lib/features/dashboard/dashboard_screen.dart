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
import '../../shared/widgets/app_widgets.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync  = ref.watch(profileProvider);
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      body: CustomScrollView(
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
                              color: AppColors.emerald600.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.emerald600.withOpacity(0.4)),
                            ),
                            child: Text(
                              profile?.roleLabel ?? '-',
                              style: const TextStyle(color: AppColors.emerald400, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
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
                    gradient: AppColors.balanceGradient,
                    index: 2,
                  ),

                  const SizedBox(height: 24),

                  // ── Chart ──
                  if (data.chartData.isNotEmpty) ...[
                    SectionHeader(title: 'Grafik Transaksi Bulanan'),
                    const SizedBox(height: 12),
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
      return prev < pem ? (prev < pen ? pen : prev) : (prev < pen ? pen : prev);
    });

    return BarChart(
      BarChartData(
        maxY: (maxVal * 1.2).toDouble(),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(color: AppColors.dark700.withOpacity(0.4), strokeWidth: 1),
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
                    ? AppColors.emerald500.withOpacity(0.15)
                    : AppColors.error.withOpacity(0.15),
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
