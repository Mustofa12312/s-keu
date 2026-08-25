import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/firebase_client.dart';
import '../../shared/widgets/app_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();

  bool _obscure  = true;
  bool _loading  = false;
  String? _error;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await FirebaseClient.auth.signInWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      // Tidak perlu manual context.go() karena RouterNotifier akan otomatis 
      // mengarahkan ke dashboard saat status authProvider berubah menjadi Auth
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() {
          _error = _translateError(e.message ?? '');
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Terjadi kesalahan. Coba lagi.';
          _loading = false;
        });
      }
    }
  }

  String _translateError(String msg) {
    if (msg.contains('user-not-found') || msg.contains('wrong-password') || 
        msg.contains('invalid-credential') || msg.contains('INVALID_LOGIN_CREDENTIALS')) {
      return 'Email atau password salah.';
    }
    if (msg.contains('user-disabled')) return 'Akun dinonaktifkan.';
    if (msg.contains('too-many-requests')) return 'Terlalu banyak percobaan. Coba lagi nanti.';
    if (msg.contains('network-request-failed')) return 'Tidak ada koneksi internet.';
    return 'Terjadi kesalahan. Coba lagi.';
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.darkBgGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Header Logo
                  _buildHeader(),
                  const SizedBox(height: 40),

                  // Login Card
                  _buildLoginCard(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [BoxShadow(color: AppColors.emerald500.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8))],
          ),
          child: const Center(
            child: Text('SK', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
          ),
        ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),

        const SizedBox(height: 20),

        const Text(
          AppStrings.appFullName,
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1),
        ).animate(delay: 100.ms).fadeIn().slideY(begin: 0.3),

        const SizedBox(height: 6),

        const Text(
          AppStrings.appTagline,
          style: TextStyle(color: AppColors.dark400, fontSize: 13),
        ).animate(delay: 200.ms).fadeIn(),
      ],
    );
  }

  Widget _buildLoginCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.dark800.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.dark600.withValues(alpha: 0.5)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 30, offset: const Offset(0, 10))],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Masuk ke Akun', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 6),
            const Text('Gunakan email & password yang terdaftar', style: TextStyle(color: AppColors.dark400, fontSize: 13)),

            const SizedBox(height: 28),

            // Email
            _buildLabel('Email'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'contoh@email.com',
                prefixIcon: const Icon(Icons.email_rounded, color: AppColors.dark400, size: 20),
                suffixIcon: _emailCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.dark400, size: 18),
                        onPressed: () => setState(() => _emailCtrl.clear()),
                      )
                    : null,
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Email wajib diisi';
                if (!RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) return 'Format email tidak valid';
                return null;
              },
              onChanged: (_) => setState(() {}),
            ),

            const SizedBox(height: 18),

            // Password
            _buildLabel('Password'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _passCtrl,
              obscureText: _obscure,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: '••••••••',
                prefixIcon: const Icon(Icons.lock_rounded, color: AppColors.dark400, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                    color: AppColors.dark400, size: 20,
                  ),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Password wajib diisi';
                if (v.length < 6) return 'Password minimal 6 karakter';
                return null;
              },
              onFieldSubmitted: (_) => _login(),
            ),

            const SizedBox(height: 8),
            
            // Lupa Password
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => _showForgotPasswordDialog(context),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Lupa Password?', style: TextStyle(color: AppColors.emerald400, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ),

            // Error Message
            if (_error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 28),

            // Login Button
            PrimaryButton(
              label: 'Masuk',
              onPressed: _login,
              loading: _loading,
              icon: Icons.login_rounded,
            ),

            const SizedBox(height: 20),

            // Footer
            const Center(
              child: Column(
                children: [
                  Divider(color: AppColors.dark700),
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock_rounded, size: 14, color: AppColors.emerald500),
                      SizedBox(width: 6),
                      Text('Diproteksi oleh Firebase Auth', style: TextStyle(color: AppColors.dark400, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.1);
  }

  Widget _buildLabel(String text) {
    return Text(text, style: const TextStyle(color: AppColors.dark300, fontSize: 13, fontWeight: FontWeight.w500));
  }

  void _showForgotPasswordDialog(BuildContext context) {
    final emailCtrl = TextEditingController(text: _emailCtrl.text);
    final formKey = GlobalKey<FormState>();
    bool loading = false;
    String? errorMsg;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          return AlertDialog(
            title: const Text('Lupa Password'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Masukkan email akun Anda. Kami akan mengirimkan link untuk mereset password.', 
                    style: TextStyle(color: AppColors.dark400, fontSize: 13)),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      hintText: 'contoh@email.com',
                      prefixIcon: Icon(Icons.email_rounded, color: AppColors.dark400, size: 20),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Email wajib diisi';
                      if (!RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) return 'Format email tidak valid';
                      return null;
                    },
                  ),
                  if (errorMsg != null) ...[
                    const SizedBox(height: 12),
                    Text(errorMsg!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
                  ],
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
                  setState(() { loading = true; errorMsg = null; });
                  try {
                    await FirebaseClient.auth.sendPasswordResetEmail(email: emailCtrl.text.trim());
                    if (ctx.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        const SnackBar(content: Text('Link reset password telah dikirim ke email Anda'), backgroundColor: AppColors.emerald500),
                      );
                    }
                  } on FirebaseAuthException catch (e) {
                    setState(() => errorMsg = _translateError(e.message ?? ''));
                  } catch (e) {
                    setState(() => errorMsg = 'Terjadi kesalahan. Coba lagi.');
                  } finally {
                    if (mounted) setState(() => loading = false);
                  }
                },
                child: loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Kirim Link'),
              ),
            ],
          );
        }
      ),
    );
  }
}
