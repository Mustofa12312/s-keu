import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_providers.dart';
import '../../data/models/kategori_model.dart';
import '../../data/repositories/kategori_repository.dart';
import '../../shared/widgets/app_widgets.dart';

class KategoriScreen extends ConsumerWidget {
  const KategoriScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kategoriAsync = ref.watch(kategoriListProvider);

    return Scaffold(
      appBar: const SikapAppBar(title: 'Master Kategori'),
      body: kategoriAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat kategori', subtitle: e.toString(), icon: Icons.error_outline_rounded),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(
              message: 'Belum ada kategori',
              subtitle: 'Kategori transaksi belum ditambahkan.',
              icon: Icons.category_rounded,
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
                      child: Icon(
                        item.jenis == 'pemasukan' ? Icons.download_rounded : Icons.upload_rounded,
                        color: item.jenis == 'pemasukan' ? AppColors.emerald400 : AppColors.error,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.namaKategori, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: Colors.white)),
                          const SizedBox(height: 4),
                          Text(item.jenis == 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', style: const TextStyle(color: AppColors.dark400, fontSize: 13)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_rounded, color: AppColors.blue400, size: 20),
                      onPressed: () => _showFormDialog(context, ref, item),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_rounded, color: AppColors.error, size: 20),
                      onPressed: () => _confirmDelete(context, ref, item),
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

  void _showFormDialog(BuildContext context, WidgetRef ref, KategoriModel? item) {
    final namaCtrl = TextEditingController(text: item?.namaKategori);
    String jenis = item?.jenis ?? 'pengeluaran';
    final formKey = GlobalKey<FormState>();
    bool loading = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: Text(item == null ? 'Tambah Kategori' : 'Edit Kategori'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: namaCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Nama Kategori',
                      hintText: 'Mis: SPP, Uang Makan, Listrik',
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: jenis,
                    dropdownColor: AppColors.dark800,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(labelText: 'Jenis'),
                    items: const [
                      DropdownMenuItem(value: 'pemasukan', child: Text('Pemasukan')),
                      DropdownMenuItem(value: 'pengeluaran', child: Text('Pengeluaran')),
                    ],
                    onChanged: (v) => setState(() => jenis = v!),
                  ),
                ],
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
                    final repo = KategoriRepository();
                    final payload = {
                      'nama_kategori': namaCtrl.text.trim(),
                      'jenis': jenis,
                    };
                    if (item == null) {
                      await repo.create(payload);
                    } else {
                      await repo.update(item.id, payload);
                    }
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ref.invalidate(kategoriListProvider);
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

  void _confirmDelete(BuildContext context, WidgetRef ref, KategoriModel item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Kategori?'),
        content: Text('Apakah Anda yakin ingin menghapus kategori "${item.namaKategori}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await KategoriRepository().delete(item.id);
                ref.invalidate(kategoriListProvider);
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
}
