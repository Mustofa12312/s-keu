import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:currency_text_input_formatter/currency_text_input_formatter.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/hutang_piutang_model.dart';
import '../../data/repositories/hutang_piutang_repository.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class HutangPiutangScreen extends ConsumerStatefulWidget {
  const HutangPiutangScreen({super.key});

  @override
  ConsumerState<HutangPiutangScreen> createState() => _HutangPiutangScreenState();
}

class _HutangPiutangScreenState extends ConsumerState<HutangPiutangScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        final jenis = _tabController.index == 0 ? 'hutang' : 'piutang';
        ref.read(hutangPiutangFilterProvider.notifier).update((state) => state.copyWith(jenis: jenis));
      }
    });
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
        title: const Text('Hutang & Piutang'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.emerald500,
          labelColor: AppColors.emerald400,
          unselectedLabelColor: AppColors.dark400,
          tabs: const [
            Tab(text: 'Data Hutang'),
            Tab(text: 'Data Piutang'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _HutangPiutangList(jenis: 'hutang'),
          _HutangPiutangList(jenis: 'piutang'),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.emerald500,
        foregroundColor: Colors.white,
        onPressed: () => _showForm(context, ref, null, _tabController.index == 0 ? 'hutang' : 'piutang'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Catat Baru'),
      ),
    );
  }

  void _showForm(BuildContext context, WidgetRef ref, HutangPiutangModel? existing, String jenis) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _HutangPiutangForm(existing: existing, jenis: jenis, onSaved: () {
        ref.invalidate(hutangPiutangListProvider);
      }),
    );
  }
}

class _HutangPiutangList extends ConsumerWidget {
  final String jenis;
  const _HutangPiutangList({required this.jenis});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncData = ref.watch(hutangPiutangListProvider);
    final profile = ref.watch(profileProvider).valueOrNull;
    final canEdit = profile?.isViewer != true;

    return asyncData.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
      error: (e, _) => EmptyState(message: 'Terjadi kesalahan', subtitle: e.toString(), icon: Icons.error_outline),
      data: (list) {
        if (list.isEmpty) {
          return EmptyState(
            message: 'Belum ada data ${jenis == 'hutang' ? 'Hutang' : 'Piutang'}',
            subtitle: 'Tap tombol di bawah untuk mencatat data baru.',
            icon: Icons.account_balance_wallet_rounded,
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(hutangPiutangListProvider),
          color: AppColors.emerald500,
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final item = list[i];
              final sisa = item.nominalTotal - item.nominalDibayar;
              final lunas = item.status == 'lunas';

              return GlassCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item.tanggal ?? '-', style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: lunas ? AppColors.emerald500.withValues(alpha: 0.2) : AppColors.error.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            lunas ? 'LUNAS' : 'BELUM LUNAS',
                            style: TextStyle(
                              color: lunas ? AppColors.emerald400 : AppColors.error,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(item.namaPihak, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                    if (item.instansi != null)
                      Text(item.instansi!['nama_instansi'], style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                    if (item.keterangan != null && item.keterangan!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(item.keterangan!, style: const TextStyle(color: AppColors.dark300, fontSize: 13)),
                      ),
                    const Divider(color: AppColors.dark600, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:', style: TextStyle(color: AppColors.dark400, fontSize: 12)),
                        Text(FormatUtils.rupiah(item.nominalTotal), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Sisa:', style: TextStyle(color: AppColors.dark400, fontSize: 12)),
                        Text(FormatUtils.rupiah(sisa), style: const TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: () => _showCicilan(context, item, ref),
                          icon: const Icon(Icons.list_alt_rounded, size: 16),
                          label: const Text('Cicilan'),
                          style: TextButton.styleFrom(foregroundColor: AppColors.info),
                        ),
                        if (canEdit) ...[
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(Icons.edit_rounded, size: 18, color: AppColors.info),
                            onPressed: () => ctx.findAncestorStateOfType<_HutangPiutangScreenState>()?._showForm(context, ref, item, jenis),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_rounded, size: 18),
                            color: AppColors.error,
                            onPressed: () => _confirmDelete(context, ref, item),
                          ),
                        ]
                      ],
                    )
                  ],
                ),
              ).animate().fadeIn(delay: (i * 50).ms).slideX(begin: 0.1);
            },
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, HutangPiutangModel item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Data?'),
        content: const Text('Data ini beserta seluruh histori pembayarannya akan dihapus.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await HutangPiutangRepository().delete(item.id);
                ref.invalidate(hutangPiutangListProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  void _showCicilan(BuildContext context, HutangPiutangModel item, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CicilanSheet(item: item, onUpdated: () => ref.invalidate(hutangPiutangListProvider)),
    );
  }
}

// ==========================================
// FORM HUTANG PIUTANG
// ==========================================
class _HutangPiutangForm extends ConsumerStatefulWidget {
  final HutangPiutangModel? existing;
  final String jenis;
  final VoidCallback onSaved;

  const _HutangPiutangForm({this.existing, required this.jenis, required this.onSaved});

  @override
  ConsumerState<_HutangPiutangForm> createState() => _HutangPiutangFormState();
}

class _HutangPiutangFormState extends ConsumerState<_HutangPiutangForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _pihakCtrl;
  late TextEditingController _nominalCtrl;
  late TextEditingController _keteranganCtrl;
  late TextEditingController _tglCtrl;
  late TextEditingController _bulanHCtrl;
  late TextEditingController _tahunHCtrl;
  String? _instansiId;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final ext = widget.existing;
    _pihakCtrl = TextEditingController(text: ext?.namaPihak);
    _nominalCtrl = TextEditingController(text: ext != null ? FormatUtils.rupiah(ext.nominalTotal) : '');
    _keteranganCtrl = TextEditingController(text: ext?.keterangan);
    _tglCtrl = TextEditingController(text: ext?.tanggal ?? DateTime.now().toString().split(' ')[0]);
    _bulanHCtrl = TextEditingController(text: ext?.bulanHijriyah ?? AppStrings.bulanHijriyah.first);
    _tahunHCtrl = TextEditingController(text: ext?.tahunHijriyah);
    _instansiId = ext?.instansiId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_tahunHCtrl.text.isEmpty) {
        final setting = ref.read(pengaturanProvider).valueOrNull;
        if (mounted) setState(() => _tahunHCtrl.text = setting?.tahunAktif ?? '1446');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileProvider).valueOrNull;
    final isSuper = profile?.isSuperAdmin == true;
    final instansiList = ref.watch(instansiListProvider).valueOrNull ?? [];

    if (!isSuper && _instansiId == null) {
      _instansiId = profile?.instansiId;
    }

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.dark800,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.existing == null ? 'Catat ${widget.jenis == 'hutang' ? 'Hutang' : 'Piutang'} Baru' : 'Edit Data',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 16),

              if (isSuper) ...[
                const Text('Instansi', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
                const SizedBox(height: 4),
                DropdownButtonFormField<String>(
                  initialValue: _instansiId,
                  dropdownColor: AppColors.dark800,
                  items: instansiList.map((i) => DropdownMenuItem(value: i.id, child: Text(i.namaInstansi))).toList(),
                  onChanged: (v) => setState(() => _instansiId = v),
                  validator: (v) => v == null ? 'Wajib diisi' : null,
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 12),
              ],

              const Text('Nama Pihak (Orang/Lembaga)', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _pihakCtrl,
                style: const TextStyle(color: Colors.white),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 12),

              const Text('Total Pinjaman (Rp)', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _nominalCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                inputFormatters: [
                  CurrencyTextInputFormatter.currency(
                    locale: 'id',
                    decimalDigits: 0,
                    symbol: 'Rp ',
                  )
                ],
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.attach_money_rounded, color: AppColors.dark400),
                  hintText: 'Rp 0',
                ),
                validator: (v) {
                  final val = int.tryParse(v!.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
                  if (val <= 0) return 'Wajib diisi';
                  return null;
                },
              ),
              const SizedBox(height: 12),

              const Text('Tanggal', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _tglCtrl,
                style: const TextStyle(color: Colors.white),
                readOnly: true,
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2100),
                  );
                  if (date != null) {
                    _tglCtrl.text = date.toString().split(' ')[0];
                  }
                },
              ),
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Bulan Hijriyah', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
                        const SizedBox(height: 4),
                        DropdownButtonFormField<String>(
                          initialValue: _bulanHCtrl.text,
                          dropdownColor: AppColors.dark800,
                          items: AppStrings.bulanHijriyah.map((b) => DropdownMenuItem(value: b, child: Text(b))).toList(),
                          onChanged: (v) => setState(() => _bulanHCtrl.text = v!),
                          style: const TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Tahun H', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
                        const SizedBox(height: 4),
                        TextFormField(
                          controller: _tahunHCtrl,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              const Text('Keterangan', style: TextStyle(color: AppColors.dark300, fontSize: 12)),
              const SizedBox(height: 4),
              TextFormField(
                controller: _keteranganCtrl,
                style: const TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 24),

              PrimaryButton(
                label: 'Simpan',
                loading: _loading,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_instansiId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Instansi belum dipilih')));
      return;
    }

    setState(() => _loading = true);
    try {
      final repo = HutangPiutangRepository();
      final payload = {
        'instansi_id': _instansiId,
        'jenis': widget.jenis,
        'nama_pihak': _pihakCtrl.text.trim(),
        'nominal_total': int.tryParse(_nominalCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        'nominal_dibayar': widget.existing?.nominalDibayar ?? 0,
        'status': widget.existing?.status ?? 'belum_lunas',
        'tanggal': _tglCtrl.text,
        'bulan_hijriyah': _bulanHCtrl.text,
        'tahun_hijriyah': _tahunHCtrl.text,
        'keterangan': _keteranganCtrl.text.trim(),
      };

      if (widget.existing != null) {
        await repo.update(widget.existing!.id, payload);
      } else {
        await repo.create(payload);
      }

      if (mounted) {
        Navigator.pop(context);
        widget.onSaved();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}

// ==========================================
// SHEET CICILAN (PEMBAYARAN)
// ==========================================
class _CicilanSheet extends StatefulWidget {
  final HutangPiutangModel item;
  final VoidCallback onUpdated;

  const _CicilanSheet({required this.item, required this.onUpdated});

  @override
  State<_CicilanSheet> createState() => _CicilanSheetState();
}

class _CicilanSheetState extends State<_CicilanSheet> {
  List<PembayaranHutangModel> _cicilanList = [];
  bool _loading = true;
  bool _formOpen = false;
  
  final _nominalCtrl = TextEditingController();
  final _tglCtrl = TextEditingController(text: DateTime.now().toString().split(' ')[0]);
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await HutangPiutangRepository().getPembayaran(widget.item.id);
      if (mounted) setState(() => _cicilanList = data);
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addCicilan() async {
    final nom = int.tryParse(_nominalCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    if (nom <= 0) return;

    setState(() => _saving = true);
    try {
      final repo = HutangPiutangRepository();
      // 1. Add pembayaran
      await repo.createPembayaran(widget.item.id, {
        'nominal': nom,
        'tanggal': _tglCtrl.text,
        'keterangan': 'Cicilan',
      });
      
      // 2. Update induk
      final totalBayarBaru = widget.item.nominalDibayar + nom;
      final statusBaru = totalBayarBaru >= widget.item.nominalTotal ? 'lunas' : 'belum_lunas';
      await repo.update(widget.item.id, {
        'nominal_dibayar': totalBayarBaru,
        'status': statusBaru,
      });

      _nominalCtrl.clear();
      _formOpen = false;
      widget.onUpdated();
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
  
  Future<void> _deleteCicilan(PembayaranHutangModel c) async {
    try {
      final repo = HutangPiutangRepository();
      await repo.deletePembayaran(c.id);
      
      final totalBayarBaru = widget.item.nominalDibayar - c.nominal;
      final statusBaru = totalBayarBaru >= widget.item.nominalTotal ? 'lunas' : 'belum_lunas';
      await repo.update(widget.item.id, {
        'nominal_dibayar': totalBayarBaru,
        'status': statusBaru,
      });

      widget.onUpdated();
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.dark800,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Histori Cicilan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              if (widget.item.status != 'lunas')
                TextButton(
                  onPressed: () => setState(() => _formOpen = !_formOpen),
                  child: Text(_formOpen ? 'Batal' : '+ Tambah'),
                )
            ],
          ),
          const SizedBox(height: 16),

          if (_formOpen) ...[
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _nominalCtrl,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    inputFormatters: [
                      CurrencyTextInputFormatter.currency(
                        locale: 'id',
                        decimalDigits: 0,
                        symbol: 'Rp ',
                      )
                    ],
                    decoration: const InputDecoration(labelText: 'Nominal (Rp)', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _tglCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Tanggal', contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                    readOnly: true,
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2000),
                        lastDate: DateTime(2100),
                      );
                      if (date != null) {
                        _tglCtrl.text = date.toString().split(' ')[0];
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _addCicilan,
                child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Simpan Pembayaran'),
              ),
            ),
            const SizedBox(height: 16),
          ],

          if (_loading)
            const Center(child: CircularProgressIndicator(color: AppColors.emerald500))
          else if (_cicilanList.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: Text('Belum ada cicilan', style: TextStyle(color: AppColors.dark400))),
            )
          else
            ConstrainedBox(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.4),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _cicilanList.length,
                separatorBuilder: (_, __) => const Divider(color: AppColors.dark600),
                itemBuilder: (ctx, i) {
                  final c = _cicilanList[i];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(FormatUtils.rupiah(c.nominal), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text(c.tanggal, style: const TextStyle(color: AppColors.dark400, fontSize: 12)),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_rounded, color: AppColors.error, size: 20),
                      onPressed: () => _deleteCicilan(c),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
