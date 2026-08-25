import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_providers.dart';
import '../../data/models/instansi_model.dart';
import '../../data/repositories/instansi_repository.dart';
import '../../shared/widgets/app_widgets.dart';

class InstansiScreen extends ConsumerWidget {
  const InstansiScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final instansiAsync = ref.watch(instansiListProvider);

    return Scaffold(
      appBar: const SikapAppBar(title: 'Master Instansi'),
      body: instansiAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat instansi', subtitle: e.toString(), icon: Icons.error_outline_rounded),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              message: 'Belum ada instansi',
              subtitle: 'Data instansi/unit pendidikan belum ditambahkan.',
              icon: Icons.business_rounded,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = list[index];
              return GlassCard(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.dark700,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.business_rounded, color: AppColors.emerald400, size: 20),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(child: Text(item.namaInstansi, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: Colors.white))),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.dark600,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(item.kodeInstansi, style: const TextStyle(fontSize: 10, color: Colors.white70)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(item.alamat ?? 'Tidak ada alamat', style: const TextStyle(color: AppColors.dark400, fontSize: 13)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                width: 8, height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: item.aktif ? AppColors.emerald500 : AppColors.error,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(item.aktif ? 'Aktif' : 'Nonaktif', style: const TextStyle(fontSize: 12, color: AppColors.dark300)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_rounded, color: AppColors.info, size: 20),
                      onPressed: () => _showFormDialog(context, ref, item),
                    ),
                    IconButton(
                      icon: Icon(item.aktif ? Icons.block_rounded : Icons.check_circle_rounded, color: item.aktif ? AppColors.error : AppColors.emerald400, size: 20),
                      tooltip: item.aktif ? 'Nonaktifkan' : 'Aktifkan',
                      onPressed: () => _toggleAktif(context, ref, item),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.emerald500,
        foregroundColor: Colors.white,
        onPressed: () => _showFormDialog(context, ref, null),
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  void _showFormDialog(BuildContext context, WidgetRef ref, InstansiModel? item) {
    final namaCtrl = TextEditingController(text: item?.namaInstansi);
    final kodeCtrl = TextEditingController(text: item?.kodeInstansi);
    final alamatCtrl = TextEditingController(text: item?.alamat);
    bool aktif = item?.aktif ?? true;
    
    final formKey = GlobalKey<FormState>();
    bool loading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: Text(item == null ? 'Tambah Instansi' : 'Edit Instansi'),
            content: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: namaCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Nama Instansi', hintText: 'Mis: MTQ, MTS'),
                      validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: kodeCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Kode Instansi', hintText: 'Mis: MTS, MA'),
                      validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                      onChanged: (v) => kodeCtrl.text = v.toUpperCase(),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: alamatCtrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Alamat (Opsional)'),
                    ),
                    if (item != null) ...[
                      const SizedBox(height: 16),
                      SwitchListTile(
                        title: const Text('Status Aktif', style: TextStyle(color: Colors.white)),
                        value: aktif,
                        activeColor: AppColors.emerald500,
                        contentPadding: EdgeInsets.zero,
                        onChanged: (v) => setState(() => aktif = v),
                      ),
                    ],
                  ],
                ),
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
                  setState(() => loading = true);
                  try {
                    final repo = InstansiRepository();
                    final payload = {
                      'nama_instansi': namaCtrl.text.trim(),
                      'kode_instansi': kodeCtrl.text.trim().toUpperCase(),
                      'alamat': alamatCtrl.text.trim(),
                      'aktif': aktif,
                    };
                    if (item == null) {
                      await repo.create(payload);
                    } else {
                      await repo.update(item.id, payload);
                    }
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ref.invalidate(instansiListProvider);
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
                  } finally {
                    if (ctx.mounted) setState(() => loading = false);
                  }
                },
                child: loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Simpan'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _toggleAktif(BuildContext context, WidgetRef ref, InstansiModel item) async {
    try {
      await InstansiRepository().toggle(item.id, !item.aktif);
      ref.invalidate(instansiListProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
      }
    }
  }
}
