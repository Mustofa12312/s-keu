import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/transaksi_model.dart';
import '../../data/repositories/transaksi_repository.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class TransaksiScreen extends ConsumerStatefulWidget {
  const TransaksiScreen({super.key});
  @override
  ConsumerState<TransaksiScreen> createState() => _TransaksiScreenState();
}

class _TransaksiScreenState extends ConsumerState<TransaksiScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showForm({TransaksiModel? existing}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _TransaksiForm(existing: existing, onSaved: () {
        ref.invalidate(transaksiListProvider);
        ref.invalidate(dashboardProvider);
      }),
    );
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Transaksi?'),
        content: const Text('Data transaksi akan dihapus permanen.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await TransaksiRepository().delete(id);
      ref.invalidate(transaksiListProvider);
      ref.invalidate(dashboardProvider);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Transaksi dihapus'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile      = ref.watch(profileProvider).valueOrNull;
    final filter       = ref.watch(transaksiFilterProvider);
    final transaksiAsync = ref.watch(transaksiListProvider);
    final instansiList = ref.watch(instansiListProvider).valueOrNull ?? [];
    final canEdit      = profile?.isViewer != true;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.transaksi),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            onPressed: () => _showFilter(context, ref, filter, instansiList, profile),
          ),
        ],
      ),
      floatingActionButton: canEdit
          ? FloatingActionButton.extended(
              onPressed: () => _showForm(),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Tambah'),
            )
          : null,
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Cari uraian transaksi...',
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.dark400),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.dark400),
                        onPressed: () {
                          _searchCtrl.clear();
                          ref.read(transaksiFilterProvider.notifier).update((s) => s.copyWith(clearSearch: true));
                        },
                      )
                    : null,
              ),
              onChanged: (v) => ref.read(transaksiFilterProvider.notifier).update(
                (s) => s.copyWith(search: v.isEmpty ? null : v),
              ),
            ),
          ),

          // Filter chips
          if (filter.bulanHijriyah != null || filter.instansiId != null)
            _ActiveFilterChips(filter: filter, instansiList: instansiList, ref: ref),

          const SizedBox(height: 8),

          // List
          Expanded(
            child: transaksiAsync.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, __) => const ShimmerCard(height: 80),
              ),
              error: (e, _) => EmptyState(message: 'Gagal memuat', subtitle: e.toString(), icon: Icons.error_outline),
              data: (list) {
                final items = list as List<TransaksiModel>;
                if (items.isEmpty) return const EmptyState(
                  message: 'Belum ada transaksi',
                  subtitle: 'Tap tombol + untuk menambah transaksi',
                  icon: Icons.receipt_long_rounded,
                );
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final t = items[i];
                    return _TransaksiCard(
                      transaksi: t,
                      index: i,
                      canEdit: canEdit,
                      onEdit: () => _showForm(existing: t),
                      onDelete: () => _delete(t.id),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showFilter(BuildContext ctx, WidgetRef ref, TransaksiFilter filter,
      List instansiList, dynamic profile) {
    showModalBottomSheet(
      context: ctx,
      backgroundColor: AppColors.dark800,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _FilterSheet(filter: filter, instansiList: instansiList, profile: profile),
    );
  }
}

class _ActiveFilterChips extends StatelessWidget {
  final TransaksiFilter filter;
  final List instansiList;
  final WidgetRef ref;
  const _ActiveFilterChips({required this.filter, required this.instansiList, required this.ref});

  @override
  Widget build(BuildContext context) {
    final chips = <Widget>[];

    if (filter.bulanHijriyah != null) {
      chips.add(Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Chip(
          label: Text(filter.bulanHijriyah!),
          deleteIcon: const Icon(Icons.close, size: 14),
          onDeleted: () => ref.read(transaksiFilterProvider.notifier)
              .update((s) => s.copyWith(clearBulan: true)),
        ),
      ));
    }

    if (filter.instansiId != null) {
      final inst = instansiList.cast<dynamic>().firstWhere(
        (e) => e.id == filter.instansiId, orElse: () => null,
      );
      if (inst != null) {
        chips.add(Chip(
          label: Text(inst.namaInstansi ?? ''),
          deleteIcon: const Icon(Icons.close, size: 14),
          onDeleted: () => ref.read(transaksiFilterProvider.notifier)
              .update((s) => s.copyWith(clearInstansi: true)),
        ));
      }
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(children: chips),
    );
  }
}

class _TransaksiCard extends StatelessWidget {
  final TransaksiModel transaksi;
  final int index;
  final bool canEdit;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _TransaksiCard({
    required this.transaksi,
    required this.index,
    required this.canEdit,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isPem = transaksi.isPemasukan;
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: isPem ? AppColors.emerald500.withOpacity(0.15) : AppColors.error.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isPem ? Icons.add_circle_outline_rounded : Icons.remove_circle_outline_rounded,
              color: isPem ? AppColors.emerald400 : AppColors.error,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(transaksi.uraian,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(FormatUtils.date(transaksi.tanggal),
                      style: const TextStyle(fontSize: 11, color: AppColors.dark400)),
                    if (transaksi.bulanHijriyah != null) ...[
                      const Text(' · ', style: TextStyle(color: AppColors.dark500, fontSize: 11)),
                      Text(transaksi.bulanHijriyah!,
                        style: const TextStyle(fontSize: 11, color: AppColors.dark400)),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isPem ? '+' : '-'}${FormatUtils.rupiahCompact(transaksi.nominal)}',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                  color: isPem ? AppColors.emerald400 : AppColors.error),
              ),
              if (canEdit) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    GestureDetector(onTap: onEdit,
                      child: const Icon(Icons.edit_rounded, size: 16, color: AppColors.dark400)),
                    const SizedBox(width: 10),
                    GestureDetector(onTap: onDelete,
                      child: const Icon(Icons.delete_outline_rounded, size: 16, color: AppColors.error)),
                  ],
                ),
              ],
            ],
          ),
        ],
      ),
    ).animate(delay: Duration(milliseconds: index * 50)).fadeIn(duration: 300.ms).slideX(begin: 0.05);
  }
}

// ── Filter Sheet ─────────────────────────────────────────────
class _FilterSheet extends ConsumerStatefulWidget {
  final TransaksiFilter filter;
  final List instansiList;
  final dynamic profile;
  const _FilterSheet({required this.filter, required this.instansiList, required this.profile});
  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}
class _FilterSheetState extends ConsumerState<_FilterSheet> {
  String? _bulan;
  String? _instansiId;

  @override
  void initState() {
    super.initState();
    _bulan      = widget.filter.bulanHijriyah;
    _instansiId = widget.filter.instansiId;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Filter Transaksi', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 20),
          const Text('Bulan Hijriyah', style: TextStyle(color: AppColors.dark300, fontSize: 13)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _bulan,
            dropdownColor: AppColors.dark700,
            decoration: const InputDecoration(hintText: 'Semua Bulan'),
            items: [
              const DropdownMenuItem(value: null, child: Text('Semua Bulan')),
              ...AppStrings.bulanHijriyah.map((b) => DropdownMenuItem(value: b, child: Text(b))),
            ],
            onChanged: (v) => setState(() => _bulan = v),
          ),
          if (widget.profile?.isSuperAdmin == true) ...[
            const SizedBox(height: 16),
            const Text('Instansi', style: TextStyle(color: AppColors.dark300, fontSize: 13)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _instansiId,
              dropdownColor: AppColors.dark700,
              decoration: const InputDecoration(hintText: 'Semua Instansi'),
              items: [
                const DropdownMenuItem(value: null, child: Text('Semua Instansi')),
                ...widget.instansiList.map((i) => DropdownMenuItem(value: i.id, child: Text(i.namaInstansi))),
              ],
              onChanged: (v) => setState(() => _instansiId = v),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ref.read(transaksiFilterProvider.notifier)
                        .update((_) => const TransaksiFilter());
                    Navigator.pop(context);
                  },
                  child: const Text('Reset'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    ref.read(transaksiFilterProvider.notifier).update((s) =>
                      s.copyWith(bulanHijriyah: _bulan, instansiId: _instansiId,
                        clearBulan: _bulan == null, clearInstansi: _instansiId == null));
                    Navigator.pop(context);
                  },
                  child: const Text('Terapkan'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

// ── Transaksi Form (Add/Edit) ─────────────────────────────
class _TransaksiForm extends ConsumerStatefulWidget {
  final TransaksiModel? existing;
  final VoidCallback onSaved;
  const _TransaksiForm({this.existing, required this.onSaved});
  @override
  ConsumerState<_TransaksiForm> createState() => _TransaksiFormState();
}

class _TransaksiFormState extends ConsumerState<_TransaksiForm> {
  final _formKey     = GlobalKey<FormState>();
  final _uraianCtrl  = TextEditingController();
  final _nominalCtrl = TextEditingController();
  final _kodCtrl     = TextEditingController();
  final _buktiCtrl   = TextEditingController();
  final _sumberCtrl  = TextEditingController();

  String  _jenis      = 'pemasukan';
  String? _tanggal;
  String? _bulanHijr;
  bool    _loading    = false;

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      final e = widget.existing!;
      _uraianCtrl.text  = e.uraian;
      _nominalCtrl.text = e.nominal.toString();
      _kodCtrl.text     = e.kodeTransaksi ?? '';
      _buktiCtrl.text   = e.nomorBukti    ?? '';
      _sumberCtrl.text  = e.sumberDana    ?? '';
      _jenis            = e.jenis;
      _tanggal          = e.tanggal;
      _bulanHijr        = e.bulanHijriyah;
    } else {
      _tanggal = FormatUtils.nowDateISO();
    }
  }

  @override
  void dispose() {
    _uraianCtrl.dispose(); _nominalCtrl.dispose();
    _kodCtrl.dispose(); _buktiCtrl.dispose(); _sumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final profile = await ref.read(profileProvider.future);
      final payload = {
        'instansi_id':    profile?.instansiId,
        'tanggal':        _tanggal,
        'bulan_hijriyah': _bulanHijr,
        'tahun_hijriyah': '1446',
        'kode_transaksi': _kodCtrl.text.trim().isEmpty  ? null : _kodCtrl.text.trim(),
        'nomor_bukti':    _buktiCtrl.text.trim().isEmpty ? null : _buktiCtrl.text.trim(),
        'uraian':         _uraianCtrl.text.trim(),
        'sumber_dana':    _sumberCtrl.text.trim().isEmpty ? null : _sumberCtrl.text.trim(),
        'jenis':          _jenis,
        'nominal':        int.parse(_nominalCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')),
      };
      final repo = TransaksiRepository();
      if (widget.existing != null) {
        await repo.update(widget.existing!.id, payload);
      } else {
        await repo.create(payload);
      }
      widget.onSaved();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.dark800,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4,
              decoration: BoxDecoration(color: AppColors.dark600, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Text(widget.existing == null ? 'Tambah Transaksi' : 'Edit Transaksi',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                  const Spacer(),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                controller: ctrl,
                padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Jenis toggle
                      Row(
                        children: ['pemasukan', 'pengeluaran'].map((j) {
                          final isPem = j == 'pemasukan';
                          final selected = _jenis == j;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _jenis = j),
                              child: AnimatedContainer(
                                duration: 200.ms,
                                margin: EdgeInsets.only(right: isPem ? 6 : 0, left: isPem ? 0 : 6),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  gradient: selected
                                      ? (isPem ? AppColors.incomeGradient : AppColors.expenseGradient)
                                      : null,
                                  color: selected ? null : AppColors.dark700,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(isPem ? Icons.add_rounded : Icons.remove_rounded,
                                      color: selected ? Colors.white : AppColors.dark400, size: 18),
                                    const SizedBox(width: 6),
                                    Text(isPem ? 'Pemasukan' : 'Pengeluaran',
                                      style: TextStyle(
                                        color: selected ? Colors.white : AppColors.dark400,
                                        fontWeight: FontWeight.w600, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 20),
                      _label('Uraian *'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _uraianCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(hintText: 'Deskripsi transaksi'),
                        validator: (v) => (v == null || v.isEmpty) ? 'Uraian wajib diisi' : null,
                        maxLines: 2,
                      ),
                      const SizedBox(height: 14),
                      _label('Nominal *'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _nominalCtrl,
                        style: const TextStyle(color: Colors.white),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: '0', prefixText: 'Rp '),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Nominal wajib diisi';
                          final n = int.tryParse(v.replaceAll(RegExp(r'[^0-9]'), ''));
                          if (n == null || n <= 0) return 'Nominal tidak valid';
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _label('No. Kode'),
                            const SizedBox(height: 6),
                            TextFormField(controller: _kodCtrl,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(hintText: 'Opsional')),
                          ])),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _label('No. Bukti'),
                            const SizedBox(height: 6),
                            TextFormField(controller: _buktiCtrl,
                              style: const TextStyle(color: Colors.white),
                              decoration: const InputDecoration(hintText: 'Opsional')),
                          ])),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _label('Sumber Dana'),
                      const SizedBox(height: 6),
                      TextFormField(controller: _sumberCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(hintText: 'Opsional')),
                      const SizedBox(height: 14),
                      _label('Bulan Hijriyah'),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _bulanHijr,
                        dropdownColor: AppColors.dark700,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(hintText: 'Pilih bulan'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('-- Pilih --')),
                          ...AppStrings.bulanHijriyah.map((b) => DropdownMenuItem(value: b, child: Text(b))),
                        ],
                        onChanged: (v) => setState(() => _bulanHijr = v),
                      ),
                      const SizedBox(height: 28),
                      PrimaryButton(label: widget.existing == null ? 'Simpan Transaksi' : 'Update Transaksi',
                        onPressed: _save, loading: _loading, icon: Icons.save_rounded),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String t) => Text(t, style: const TextStyle(color: AppColors.dark300, fontSize: 13, fontWeight: FontWeight.w500));
}
