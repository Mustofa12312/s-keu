import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/format_utils.dart';
import '../../data/models/transaksi_model.dart';
import '../../data/repositories/transaksi_repository.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';
import '../../core/utils/export_utils.dart';
import '../../data/models/profile_model.dart';

final _bukuKasInstansiProvider = StateProvider<String?>((_) => null);
final _bukuKasBulanProvider = StateProvider<String>((_) => 'Muharram');
final _bukuKasTahunProvider = StateProvider<String?>((_) => null);

final bukuKasListProvider = FutureProvider.autoDispose<List<TransaksiModel>>((ref) async {
  final instansiId = ref.watch(_bukuKasInstansiProvider);
  final bulan = ref.watch(_bukuKasBulanProvider);
  final tahun = ref.watch(_bukuKasTahunProvider);
  
  final profile = await ref.watch(profileProvider.future);
  final pengaturan = await ref.watch(pengaturanProvider.future);
  
  final activeTahun = tahun ?? pengaturan.tahunAktif;
  final effectiveInstansiId = profile?.isSuperAdmin == true ? instansiId : profile?.instansiId;

  return TransaksiRepository().getAll(
    instansiId: effectiveInstansiId,
    bulanHijriyah: bulan,
    tahunHijriyah: activeTahun,
    orderDesc: false,
  );
});

class BukuKasScreen extends ConsumerStatefulWidget {
  const BukuKasScreen({super.key});
  @override
  ConsumerState<BukuKasScreen> createState() => _BukuKasScreenState();
}

class _BukuKasScreenState extends ConsumerState<BukuKasScreen> {
  bool _exporting = false;

  Future<void> _handleExport(bool isPdf, List<TransaksiModel> list,
      dynamic instansi, String bulan, String tahun, dynamic settings) async {
    if (list.isEmpty || instansi == null) return;
    setState(() => _exporting = true);
    try {
      if (isPdf) {
        await ExportUtils.exportBKUPdf(
            transaksi: list,
            instansi: instansi,
            bulan: bulan,
            tahun: tahun,
            settings: settings ?? PengaturanModel.defaultSettings());
      } else {
        await ExportUtils.exportBKUExcel(
            transaksi: list, instansi: instansi, bulan: bulan, tahun: tahun);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Gagal export: $e'),
            backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final instansiId = ref.watch(_bukuKasInstansiProvider);
    final bulan = ref.watch(_bukuKasBulanProvider);
    final tahun = ref.watch(_bukuKasTahunProvider);
    
    final profile = ref.watch(profileProvider).valueOrNull;
    final pengaturan = ref.watch(pengaturanProvider).valueOrNull;
    final instansiList = ref.watch(instansiListProvider).valueOrNull ?? [];

    final activeTahun = tahun ?? pengaturan?.tahunAktif ?? '1446';
    final effectiveInstansiId =
        profile?.isSuperAdmin == true ? instansiId : profile?.instansiId;

    final transaksiAsyncValue = ref.watch(bukuKasListProvider);

    final instansiObj = effectiveInstansiId != null
        ? instansiList
            .cast<dynamic>()
            .firstWhere((i) => i.id == effectiveInstansiId, orElse: () => null)
        : null;

    return Scaffold(
      appBar: const S-KeuAppBar(title: AppStrings.bukuKas, showBack: false),
      body: Column(
        children: [
          // Controls
          Container(
            color: AppColors.dark800,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                if (profile?.isSuperAdmin == true)
                  DropdownButtonFormField<String>(
                    initialValue: instansiId,
                    dropdownColor: AppColors.dark700,
                    decoration: const InputDecoration(
                        labelText: 'Instansi', isDense: true),
                    items: [
                      const DropdownMenuItem(
                          value: null, child: Text('-- Pilih Instansi --')),
                      ...instansiList.map((i) => DropdownMenuItem(
                          value: i.id,
                          child: Text(i.namaInstansi))),
                    ],
                    onChanged: (v) => ref
                        .read(_bukuKasInstansiProvider.notifier)
                        .state = v,
                  ),
                if (profile?.isSuperAdmin == true) const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<String>(
                        initialValue: bulan,
                        dropdownColor: AppColors.dark700,
                        decoration: const InputDecoration(
                            labelText: 'Bulan', isDense: true),
                        items: AppStrings.bulanHijriyah
                            .map((b) => DropdownMenuItem(
                                value: b,
                                child: Text(b,
                                    style: const TextStyle(fontSize: 13))))
                            .toList(),
                        onChanged: (v) {
                          if (v != null) {
                            ref.read(_bukuKasBulanProvider.notifier).state = v;
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        key: ValueKey(activeTahun),
                        initialValue: activeTahun,
                        style: const TextStyle(color: Colors.white),
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                            labelText: 'Tahun H', isDense: true),
                        onChanged: (v) => ref
                            .read(_bukuKasTahunProvider.notifier)
                            .state = v,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Export Buttons
                () {
                  final list = transaksiAsyncValue.valueOrNull ?? [];
                  final canExport = list.isNotEmpty && instansiObj != null;
                  return Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: canExport && !_exporting
                              ? () => _handleExport(
                                  false,
                                  list,
                                  instansiObj,
                                  bulan,
                                  activeTahun,
                                  pengaturan)
                              : null,
                          icon: const Icon(Icons.table_chart_rounded,
                              size: 16),
                          label: const Text('Excel'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.emerald400,
                            side: BorderSide(
                                color:
                                    AppColors.emerald500.withValues(alpha: 0.5)),
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: canExport && !_exporting
                              ? () => _handleExport(true, list, instansiObj,
                                  bulan, activeTahun, pengaturan)
                              : null,
                          icon: _exporting
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2))
                              : const Icon(Icons.picture_as_pdf_rounded,
                                  size: 16),
                          label:
                              Text(_exporting ? 'Proses...' : 'Print PDF'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.emerald600,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  );
                }(),
              ],
            ),
          ),

          // BKU Content
          Expanded(
            child: transaksiAsyncValue.when(
              loading: () => const Center(
                  child: CircularProgressIndicator(
                      color: AppColors.emerald500)),
              error: (error, stack) => EmptyState(
                  message: 'Gagal memuat', subtitle: error.toString()),
              data: (list) {
                if (effectiveInstansiId == null &&
                    profile?.isSuperAdmin == true) {
                  return const EmptyState(
                      message: 'Pilih instansi terlebih dahulu',
                      icon: Icons.business_rounded);
                }

                final totalPem = list
                    .where((t) => t.isPemasukan)
                    .fold(0, (s, t) => s + t.nominal);
                final totalPen = list
                    .where((t) => t.isPengeluaran)
                    .fold(0, (s, t) => s + t.nominal);
                final saldo = totalPem - totalPen;
                final saldoColor = saldo < 0 ? AppColors.error : AppColors.info;

                return Column(
                  children: [
                    // Summary strip
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      color: AppColors.dark800.withValues(alpha: 0.5),
                      child: Row(
                        children: [
                          _SummaryChip(
                              label: 'Masuk',
                              value: totalPem,
                              color: AppColors.emerald400),
                          const SizedBox(width: 8),
                          _SummaryChip(
                              label: 'Keluar',
                              value: totalPen,
                              color: AppColors.error),
                          const SizedBox(width: 8),
                          _SummaryChip(
                              label: 'Saldo',
                              value: saldo,
                              color: saldoColor),
                        ],
                      ),
                    ),

                    // BKU Table
                    Expanded(
                      child: list.isEmpty
                          ? const EmptyState(
                              message: 'Belum ada transaksi bulan ini',
                              icon: Icons.book_outlined)
                          : _BKUTable(
                              transaksiList: list,
                              instansiObj: instansiObj,
                              bulan: bulan,
                              tahun: activeTahun),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _SummaryChip(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Text(label,
                style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.8))),
            const SizedBox(height: 2),
            Text(FormatUtils.rupiahCompact(value),
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}

class _BKUTable extends StatelessWidget {
  final List<TransaksiModel> transaksiList;
  final dynamic instansiObj;
  final String bulan;
  final String tahun;

  const _BKUTable(
      {required this.transaksiList,
      this.instansiObj,
      required this.bulan,
      required this.tahun});

  @override
  Widget build(BuildContext context) {
    int runSaldo = 0;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(12),
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Header Info
            Container(
              width: 820,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dark800,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                border: Border.all(color: AppColors.dark600.withValues(alpha: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('BUKU KAS UMUM',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 2)),
                  const SizedBox(height: 6),
                  Text(
                      'Instansi: ${instansiObj?.namaInstansi ?? '-'}  |  Bulan: $bulan $tahun H',
                      style: const TextStyle(
                          color: AppColors.dark400, fontSize: 12)),
                ],
              ),
            ),

            // Table Header
            Container(
              width: 820,
              color: AppColors.emerald800.withValues(alpha: 0.4),
              child: Row(
                  children: _headers
                      .map((h) => _HeaderCell(text: h.label, flex: h.flex))
                      .toList()),
            ),

            // Rows
            Container(
              width: 820,
              decoration: BoxDecoration(
                color: AppColors.dark800,
                borderRadius:
                    const BorderRadius.vertical(bottom: Radius.circular(12)),
                border: Border.all(color: AppColors.dark600.withValues(alpha: 0.5)),
              ),
              child: Column(
                children: transaksiList.map((t) {
                  if (t.isPemasukan) {
                    runSaldo += t.nominal;
                  } else {
                    runSaldo -= t.nominal;
                  }
                  return _BKURow(transaksi: t, runSaldo: runSaldo);
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static const _headers = [
    _ColDef('Tgl Masehi', 1),
    _ColDef('Tgl Hijriyah', 1),
    _ColDef('Kode', 1),
    _ColDef('Bukti', 1),
    _ColDef('Uraian', 2),
    _ColDef('Sumber', 1),
    _ColDef('Pemasukan', 1),
    _ColDef('Pengeluaran', 1),
    _ColDef('Saldo', 1),
  ];
}

class _ColDef {
  final String label;
  final int flex;
  const _ColDef(this.label, this.flex);
}

class _HeaderCell extends StatelessWidget {
  final String text;
  final int flex;
  const _HeaderCell({required this.text, required this.flex});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        child: Text(text,
            style: const TextStyle(
                color: AppColors.emerald400,
                fontSize: 11,
                fontWeight: FontWeight.w700),
            textAlign: TextAlign.center),
      ),
    );
  }
}

class _BKURow extends StatelessWidget {
  final TransaksiModel transaksi;
  final int runSaldo;
  const _BKURow({required this.transaksi, required this.runSaldo});

  @override
  Widget build(BuildContext context) {
    final isPem = transaksi.isPemasukan;
    return Container(
      decoration: BoxDecoration(
          border: Border(
              top: BorderSide(color: AppColors.dark700.withValues(alpha: 0.4)))),
      child: Row(
        children: [
          _Cell(transaksi.tanggal ?? '', 1),
          _Cell(transaksi.tanggalHijriyah ?? '', 1),
          _Cell(transaksi.kodeTransaksi ?? '', 1),
          _Cell(transaksi.nomorBukti ?? '', 1),
          _Cell(transaksi.uraian, 2, bold: false),
          _Cell(transaksi.sumberDana ?? '', 1),
          _Cell(isPem ? FormatUtils.rupiahCompact(transaksi.nominal) : '', 1,
              color: AppColors.emerald400),
          _Cell(!isPem ? FormatUtils.rupiahCompact(transaksi.nominal) : '', 1,
              color: AppColors.error),
          _Cell(FormatUtils.rupiahCompact(runSaldo), 1, color: AppColors.info),
        ],
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  final String text;
  final int flex;
  final bool bold;
  final Color? color;
  const _Cell(this.text, this.flex, {this.bold = false, this.color});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: flex,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        child: Text(text,
            style: TextStyle(
                fontSize: 11,
                color: color ?? AppColors.dark200,
                fontWeight: bold ? FontWeight.w600 : FontWeight.normal),
            maxLines: 2,
            overflow: TextOverflow.ellipsis),
      ),
    );
  }
}
