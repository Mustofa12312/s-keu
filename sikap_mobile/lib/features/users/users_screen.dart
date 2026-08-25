import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/constants/app_colors.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/instansi_repository.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/app_widgets.dart';

class UsersScreen extends ConsumerWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncData = ref.watch(usersListProvider);
    final instansiList = ref.watch(instansiListProvider).valueOrNull ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('Manajemen Pengguna')),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.emerald500,
        foregroundColor: Colors.white,
        onPressed: () => _showForm(context, ref, null, instansiList),
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Tambah User'),
      ),
      body: asyncData.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.emerald500)),
        error: (e, _) => EmptyState(message: 'Gagal memuat', subtitle: e.toString(), icon: Icons.error_outline),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyState(message: 'Belum ada pengguna', icon: Icons.people_outline_rounded);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(usersListProvider),
            color: AppColors.emerald500,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final user = list[i];
                return _UserCard(
                  user: user,
                  onEdit: () => _showForm(context, ref, user, instansiList),
                  onToggleBlock: () => _toggleBlock(context, ref, user),
                  onResetPassword: () => _resetPassword(context, user),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showForm(BuildContext context, WidgetRef ref, ProfileModel? user, List instansiList) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _UserFormSheet(existing: user, instansiList: instansiList, onSaved: () {
        ref.invalidate(usersListProvider);
      }),
    );
  }

  Future<void> _toggleBlock(BuildContext context, WidgetRef ref, ProfileModel user) async {
    if (user.role == 'super_admin') {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tidak dapat memblokir Super Admin')));
      return;
    }
    final isBlocked = user.role == 'blocked';
    final action = isBlocked ? 'Pulihkan' : 'Blokir';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$action Pengguna?'),
        content: Text(isBlocked ? 'Pengguna akan dipulihkan ke role sebelumnya (Viewer).' : 'Akses pengguna ini akan dicabut.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: isBlocked ? AppColors.emerald500 : AppColors.error),
            child: Text(action),
          ),
        ],
      ),
    );

    if (ok == true) {
      try {
        final newRole = isBlocked ? 'viewer' : 'blocked';
        await ProfileRepository().update(user.id, {'role': newRole});
        ref.invalidate(usersListProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status pengguna diperbarui')));
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
        }
      }
    }
  }

  Future<void> _resetPassword(BuildContext context, ProfileModel user) async {
    if (user.email == null || user.email!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Email pengguna tidak valid')));
      return;
    }
    
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Password?'),
        content: Text('Kirim link reset password ke:\n${user.email}'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kirim')),
        ],
      ),
    );

    if (ok == true) {
      try {
        await FirebaseAuth.instance.sendPasswordResetEmail(email: user.email!);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link reset berhasil dikirim ke email')));
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error));
        }
      }
    }
  }
}

class _UserCard extends StatelessWidget {
  final ProfileModel user;
  final VoidCallback onEdit;
  final VoidCallback onToggleBlock;
  final VoidCallback onResetPassword;

  const _UserCard({required this.user, required this.onEdit, required this.onToggleBlock, required this.onResetPassword});

  @override
  Widget build(BuildContext context) {
    final isBlocked = user.role == 'blocked';
    Color roleColor = AppColors.blue400;
    if (user.role == 'admin_instansi') roleColor = AppColors.emerald400;
    if (user.role == 'viewer') roleColor = AppColors.amber400;
    if (isBlocked) roleColor = AppColors.error;

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: roleColor.withOpacity(0.2),
                foregroundColor: roleColor,
                child: Text(user.nama.substring(0, 1).toUpperCase()),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.nama, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                    const SizedBox(height: 2),
                    Text(user.email ?? '-', style: const TextStyle(color: AppColors.dark400, fontSize: 13)),
                    if (user.instansi != null)
                      Text(user.instansi!['nama_instansi'], style: const TextStyle(color: AppColors.dark300, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: roleColor.withOpacity(0.2), borderRadius: BorderRadius.circular(6)),
                child: Text(user.roleLabel, style: TextStyle(color: roleColor, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Divider(color: AppColors.dark600, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButton(icon: const Icon(Icons.lock_reset_rounded, size: 20), color: AppColors.blue400, onPressed: onResetPassword, tooltip: 'Reset Password'),
              IconButton(icon: const Icon(Icons.edit_rounded, size: 20), color: AppColors.emerald400, onPressed: onEdit, tooltip: 'Edit Profil'),
              IconButton(icon: Icon(isBlocked ? Icons.restore_rounded : Icons.block_rounded, size: 20), color: isBlocked ? AppColors.emerald400 : AppColors.error, onPressed: onToggleBlock, tooltip: isBlocked ? 'Pulihkan' : 'Blokir'),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: 0.1);
  }
}

class _UserFormSheet extends StatefulWidget {
  final ProfileModel? existing;
  final List instansiList;
  final VoidCallback onSaved;

  const _UserFormSheet({this.existing, required this.instansiList, required this.onSaved});

  @override
  State<_UserFormSheet> createState() => _UserFormSheetState();
}

class _UserFormSheetState extends State<_UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _namaCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _passCtrl;
  String _role = 'admin_instansi';
  String? _instansiId;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _namaCtrl = TextEditingController(text: widget.existing?.nama);
    _emailCtrl = TextEditingController(text: widget.existing?.email);
    _passCtrl = TextEditingController();
    _role = widget.existing?.role ?? 'admin_instansi';
    _instansiId = widget.existing?.instansiId;
  }

  @override
  Widget build(BuildContext context) {
    final isNew = widget.existing == null;

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
              Text(isNew ? 'Tambah Pengguna Baru' : 'Edit Pengguna', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _namaCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Nama Lengkap'),
                validator: (v) => v!.isEmpty ? 'Wajib diisi' : null,
              ),
              const SizedBox(height: 12),
              
              TextFormField(
                controller: _emailCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Email'),
                readOnly: !isNew,
                validator: (v) => v!.isEmpty || !v.contains('@') ? 'Email tidak valid' : null,
              ),
              const SizedBox(height: 12),

              if (isNew) ...[
                TextFormField(
                  controller: _passCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(labelText: 'Password (min. 6 karakter)'),
                  obscureText: true,
                  validator: (v) => v!.length < 6 ? 'Minimal 6 karakter' : null,
                ),
                const SizedBox(height: 12),
              ],

              DropdownButtonFormField<String>(
                value: _role,
                dropdownColor: AppColors.dark800,
                decoration: const InputDecoration(labelText: 'Role'),
                items: const [
                  DropdownMenuItem(value: 'super_admin', child: Text('Super Admin')),
                  DropdownMenuItem(value: 'admin_instansi', child: Text('Admin Instansi')),
                  DropdownMenuItem(value: 'viewer', child: Text('Viewer / Pimpinan')),
                ],
                onChanged: (v) => setState(() => _role = v!),
                style: const TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 12),

              if (_role != 'super_admin') ...[
                DropdownButtonFormField<String>(
                  value: _instansiId,
                  dropdownColor: AppColors.dark800,
                  decoration: const InputDecoration(labelText: 'Instansi'),
                  items: widget.instansiList.map((i) => DropdownMenuItem<String>(value: i.id, child: Text(i.namaInstansi))).toList(),
                  onChanged: (v) => setState(() => _instansiId = v),
                  validator: (v) => v == null ? 'Pilih instansi' : null,
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 12),
              ],
              
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  child: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Simpan'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    
    try {
      if (widget.existing != null) {
        // Edit Profile
        await ProfileRepository().update(widget.existing!.id, {
          'nama': _namaCtrl.text.trim(),
          'role': _role,
          'instansi_id': _role == 'super_admin' ? null : _instansiId,
        });
      } else {
        // Karena ini mobile, kita nggak bisa gampang pake secondary FirebaseApp untuk createUser
        // So I will just show a message. This would need Firebase Admin SDK in Cloud Functions.
        // For demonstration, let's just create profile document (auth will fail if we use FirebaseAuth directly because it logs out current user).
        throw Exception('Pembuatan user baru via mobile client tidak didukung karena Firebase Auth akan men-logout admin yang sedang aktif. Gunakan versi Web untuk menambah user baru.');
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
