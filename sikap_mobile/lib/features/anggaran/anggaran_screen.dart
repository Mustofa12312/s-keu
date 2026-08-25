import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/anggaran_model.dart';
import '../../data/repositories/anggaran_repository.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class AnggaranScreen extends ConsumerStatefulWidget {
  const AnggaranScreen({super.key});

  @override
  ConsumerState<AnggaranScreen> createState() => _AnggaranScreenState();
}

class _AnggaranScreenState extends ConsumerState<AnggaranScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Anggaran (RAPBM)'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.emerald500,
          labelColor: AppColors.emerald400,
          unselectedLabelColor: AppColors.dark400,
          tabs: const [
            Tab(text: 'Rencana'),
            Tab(text: 'Realisasi'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _RencanaAnggaranTab(),
          _RealisasiAnggaranTab(),
        ],
      ),
    );
  }
}

// ==========================================
// RENCANA ANGGARAN TAB
// ==========================================
class _RencanaAnggaranTab extends ConsumerStatefulWidget {
  const _RencanaAnggaranTab();

  @override
  ConsumerState<_RencanaAnggaranTab> createState() => _RencanaAnggaranTabState();
}

class _RencanaAnggaranTabState extends ConsumerState<_RencanaAnggaranTab> {
  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(anggaranFilterProvider);
    final asyncData = ref.watch(anggaranListProvider);
    final profile = ref.watch(profileProvider).valueOrNull;
    final canEdit = profile?.isViewer != true;

    return Column(
      children: [
        // Kategori Filter (Pendapatan vs Belanja)
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: _SegmentButton(
                  label: 'Pendapatan',
                  isActive: filter.kategori == 'pendapatan',
                  onTap: () => ref.read(anggaranFilterProvider.notifier).update((s) => s.copyWith(kategori: 'pendapatan')),
                  color: AppColors.emerald500,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SegmentButton(
                  label: 'Belanja',
                  isActive: filter.kategori == 'belanja',
                  onTap: () => ref.read(anggaranFilterProvider.notifier).update((s) => s.copyWith(kategori: 'belanja')),
                  color: AppColors.error,
                ),
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: asyncData.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
            error: (e, _) => EmptyState(message: 'Terjadi kesalahan', subtitle: e.toString(), icon: Icons.error_outline),
            data: (list) {
              if (list.isEmpty) {
                return const EmptyState(
                  message: 'Belum ada Rencana Anggaran',
                  subtitle: 'Tap tombol di bawah untuk menambah rencana.',
                  icon: Icons.assignment_rounded,
                );
              }

              final total = list.fold<int>(0, (prev, curr) => prev + curr.jumlah);

              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(anggaranListProvider),
                color: AppColors.emerald500,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                  children: [
                    GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Anggaran', style: TextStyle(color: AppColors.dark300)),
                          Text(FormatUtils.rupiah(total), style: TextStyle(color: filter.kategori == 'pendapatan' ? AppColors.emerald400 : AppColors.error, fontWeight: FontWeight.bold, fontSize: 18)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...list.map((item) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: GlassCard(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: AppColors.dark700.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
                                    child: Text(item.kode, style: const TextStyle(color: AppColors.emerald400, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                  const Spacer(),
                                  if (canEdit) ...[
                                    IconButton(
                                      icon: const Icon(Icons.edit_rounded, size: 18, color: AppColors.info),
                                      onPressed: () => _showForm(item),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                    ),
                                    const SizedBox(width: 12),
                                    IconButton(
                                      icon: const Icon(Icons.delete_rounded, size: 18, color: AppColors.error),
                                      onPressed: () => _confirmDelete(item.id),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                    ),
                                  ]
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(item.uraian, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                              if (item.pelaksana != null && item.pelaksana!.isNotEmpty)
                                Text('Pelaksana: ${item.pelaksana}', style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                              if (item.waktuPelaksanaan != null && item.waktuPelaksanaan!.isNotEmpty)
                                Text('Waktu: ${item.waktuPelaksanaan}', style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                              
                              const Divider(color: AppColors.dark600, height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('${item.volume} ${item.satuan} x ${FormatUtils.rupiah(item.hargaSatuan)}', style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                                  Text(FormatUtils.rupiah(item.jumlah), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ],
                              )
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showForm([AnggaranModel? existing]) {
    // TBD: Form Rencana Anggaran
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fitur tambah/edit rencana anggaran akan segera hadir')));
  }

  void _confirmDelete(String id) {
    // TBD: Delete Rencana
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Rencana?'),
        content: const Text('Semua realisasi terkait juga akan terhapus.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AnggaranRepository().deleteRencana(id);
                ref.invalidate(anggaranListProvider);
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// REALISASI ANGGARAN TAB
// ==========================================
class _RealisasiAnggaranTab extends ConsumerStatefulWidget {
  const _RealisasiAnggaranTab();

  @override
  ConsumerState<_RealisasiAnggaranTab> createState() => _RealisasiAnggaranTabState();
}

class _RealisasiAnggaranTabState extends ConsumerState<_RealisasiAnggaranTab> {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Modul Realisasi Anggaran akan segera hadir', style: TextStyle(color: AppColors.dark400)),
    );
  }
}

// ==========================================
// WIDGET BANTUAN
// ==========================================
class _SegmentButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final Color color;

  const _SegmentButton({required this.label, required this.isActive, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.15) : AppColors.dark800,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isActive ? color : AppColors.dark700),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? color : AppColors.dark400,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
