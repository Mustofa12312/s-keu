import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/format_utils.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class LaporanScreen extends ConsumerWidget {
  const LaporanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final laporanAsync = ref.watch(laporanProvider);
    final filter = ref.watch(laporanFilterProvider);
    final profile = ref.watch(profileProvider).valueOrNull;
    final pengaturan = ref.watch(pengaturanProvider).valueOrNull;
    final instansiList = ref.watch(instansiListProvider).valueOrNull ?? [];

    final activeTahun =
        filter.tahunHijriyah ?? pengaturan?.tahunAktif ?? '1446';

    return Scaffold(
      appBar: const SikapAppBar(title: AppStrings.laporan, showBack: false),
      body: Column(
        children: [
          // ── Controls ──
          Container(
            color: AppColors.dark800,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(
              children: [
                if (profile?.isSuperAdmin == true) ...[
                  Expanded(
                    flex: 2,
                    child: DropdownButtonFormField<String>(
                      value: filter.instansiId,
                      dropdownColor: AppColors.dark700,
                      decoration: const InputDecoration(
                          labelText: 'Instansi', isDense: true),
                      items: [
                        const DropdownMenuItem(
                            value: null, child: Text('-- Semua --')),
                        ...instansiList.map((i) => DropdownMenuItem(
                            value: i.id,
                            child: Text(i.namaInstansi))),
                      ],
                      onChanged: (v) => ref
                          .read(laporanFilterProvider.notifier)
                          .update((s) => v == null
                              ? s.copyWith(clearInstansi: true)
                              : s.copyWith(instansiId: v)),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: TextFormField(
                    key: ValueKey(activeTahun),
                    initialValue: activeTahun,
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                        labelText: 'Tahun H', isDense: true),
                    onChanged: (v) => ref
                        .read(laporanFilterProvider.notifier)
                        .update((s) => s.copyWith(tahunHijriyah: v)),
                  ),
                ),
              ],
            ),
          ),

          // ── Content ──
          Expanded(
            child: laporanAsync.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 4,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const ShimmerCard(height: 100),
              ),
              error: (e, _) =>
                  EmptyState(message: 'Gagal memuat', subtitle: e.toString()),
              data: (data) => ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ── Ringkasan Keuangan ──
                  SectionHeader(
                      title: 'Ringkasan Keuangan',
                      subtitle: 'Tahun $activeTahun H'),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                          child: _InfoCard(
                        label: 'Total Pemasukan',
                        value: data.totalPemasukan,
                        icon: Icons.arrow_circle_up_rounded,
                        color: AppColors.emerald400,
                        index: 0,
                      )),
                      const SizedBox(width: 12),
                      Expanded(
                          child: _InfoCard(
                        label: 'Total Pengeluaran',
                        value: data.totalPengeluaran,
                        icon: Icons.arrow_circle_down_rounded,
                        color: AppColors.error,
                        index: 1,
                      )),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _InfoCard(
                    label: 'Saldo Akhir',
                    value: data.saldo,
                    icon: Icons.account_balance_wallet_rounded,
                    color: AppColors.info,
                    index: 2,
                    fullWidth: true,
                  ),

                  const SizedBox(height: 24),

                  // ── Pie Chart ──
                  if (data.totalPemasukan > 0 || data.totalPengeluaran > 0) ...[
                    SectionHeader(title: 'Distribusi Keuangan'),
                    const SizedBox(height: 12),
                    GlassCard(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 160,
                            height: 160,
                            child: PieChart(
                              PieChartData(
                                sections: [
                                  PieChartSectionData(
                                    value: data.totalPemasukan.toDouble(),
                                    color: AppColors.emerald500,
                                    title:
                                        '${(data.totalPemasukan / (data.totalPemasukan + data.totalPengeluaran) * 100).toStringAsFixed(0)}%',
                                    radius: 65,
                                    titleStyle: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white),
                                  ),
                                  PieChartSectionData(
                                    value: data.totalPengeluaran.toDouble(),
                                    color: AppColors.error,
                                    title:
                                        '${(data.totalPengeluaran / (data.totalPemasukan + data.totalPengeluaran) * 100).toStringAsFixed(0)}%',
                                    radius: 65,
                                    titleStyle: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white),
                                  ),
                                ],
                                centerSpaceRadius: 30,
                                sectionsSpace: 3,
                              ),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _Legend(
                                    color: AppColors.emerald500,
                                    label: 'Pemasukan',
                                    value: FormatUtils.rupiah(
                                        data.totalPemasukan)),
                                const SizedBox(height: 12),
                                _Legend(
                                    color: AppColors.error,
                                    label: 'Pengeluaran',
                                    value: FormatUtils.rupiah(
                                        data.totalPengeluaran)),
                                const SizedBox(height: 12),
                                const Divider(color: AppColors.dark600),
                                const SizedBox(height: 8),
                                _Legend(
                                    color: AppColors.info,
                                    label: 'Saldo',
                                    value: FormatUtils.rupiah(data.saldo)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate(delay: 300.ms).fadeIn(duration: 400.ms),
                    const SizedBox(height: 24),
                  ],

                  // ── Tabel per Bulan ──
                  if (data.chartData.isNotEmpty) ...[
                    SectionHeader(title: 'Rekap Per Bulan'),
                    const SizedBox(height: 12),
                    GlassCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          // Header
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.emerald800.withOpacity(0.4),
                              borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(16)),
                            ),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 10),
                            child: Row(
                              children: const [
                                Expanded(
                                    flex: 2,
                                    child: Text('Bulan',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.emerald400,
                                            fontSize: 12))),
                                Expanded(
                                    child: Text('Masuk',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.emerald400,
                                            fontSize: 12),
                                        textAlign: TextAlign.right)),
                                Expanded(
                                    child: Text('Keluar',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.error,
                                            fontSize: 12),
                                        textAlign: TextAlign.right)),
                              ],
                            ),
                          ),

                          // Rows
                          ...data.chartData.asMap().entries.map((entry) {
                            final i = entry.key;
                            final d = entry.value;
                            final pem = d['pem'] as int? ?? 0;
                            final pen = d['pen'] as int? ?? 0;
                            return Container(
                              decoration: BoxDecoration(
                                border: Border(
                                    top: BorderSide(
                                        color: AppColors.dark700
                                            .withOpacity(0.4))),
                                color: i.isOdd
                                    ? AppColors.dark700.withOpacity(0.2)
                                    : Colors.transparent,
                              ),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                              child: Row(
                                children: [
                                  Expanded(
                                      flex: 2,
                                      child: Text(d['bulan'] as String? ?? '',
                                          style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13))),
                                  Expanded(
                                      child: Text(
                                          FormatUtils.rupiahCompact(pem),
                                          textAlign: TextAlign.right,
                                          style: const TextStyle(
                                              color: AppColors.emerald400,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600))),
                                  Expanded(
                                      child: Text(
                                          FormatUtils.rupiahCompact(pen),
                                          textAlign: TextAlign.right,
                                          style: const TextStyle(
                                              color: AppColors.error,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600))),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ).animate(delay: 400.ms).fadeIn(duration: 400.ms),
                  ],

                  const SizedBox(height: 80),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;
  final Color color;
  final int index;
  final bool fullWidth;

  const _InfoCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.index,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        color: AppColors.dark400, fontSize: 12)),
                const SizedBox(height: 4),
                Text(
                    fullWidth
                        ? FormatUtils.rupiah(value)
                        : FormatUtils.rupiahCompact(value),
                    style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w700,
                        fontSize: fullWidth ? 18 : 15)),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(delay: Duration(milliseconds: index * 100))
        .fadeIn(duration: 300.ms)
        .slideY(begin: 0.1);
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  final String value;
  const _Legend(
      {required this.color, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style:
                      const TextStyle(color: AppColors.dark400, fontSize: 12)),
              Text(value,
                  style: TextStyle(
                      color: color, fontWeight: FontWeight.w700, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}
