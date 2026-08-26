import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../providers/biometric_provider.dart';

class LockScreen extends ConsumerStatefulWidget {
  const LockScreen({super.key});

  @override
  ConsumerState<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<LockScreen> {
  bool _isAuthenticating = false;
  String _message = 'Gunakan Sidik Jari atau Face ID untuk masuk';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _authenticate();
    });
  }

  Future<void> _authenticate() async {
    final localAuth = ref.read(localAuthProvider);
    bool authenticated = false;

    setState(() {
      _isAuthenticating = true;
      _message = 'Memverifikasi identitas...';
    });

    try {
      final isAvailable = await localAuth.canCheckBiometrics || await localAuth.isDeviceSupported();
      if (!isAvailable) {
        // If device has no biometrics, just unlock for now or require PIN (future feature)
        ref.read(biometricStateProvider.notifier).state = true;
        if (mounted) context.go(AppStrings.routeDashboard);
        return;
      }

      authenticated = await localAuth.authenticate(
        localizedReason: 'Verifikasi identitas Anda untuk mengakses S-KEU',
      );

      if (authenticated) {
        ref.read(biometricStateProvider.notifier).state = true;
        if (mounted) context.go(AppStrings.routeDashboard);
      } else {
        setState(() {
          _message = 'Autentikasi gagal. Silakan coba lagi.';
        });
      }
    } catch (e) {
      setState(() {
        _message = 'Terjadi kesalahan: ${e.toString()}';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isAuthenticating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark900,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.lock_person_rounded,
              size: 80,
              color: AppColors.emerald500,
            ).animate(onPlay: (controller) => controller.repeat(reverse: true)).scaleXY(end: 1.1, duration: 1.seconds),
            const SizedBox(height: 32),
            const Text(
              'Aplikasi Terkunci',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                _message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppColors.dark400,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 48),
            if (_isAuthenticating)
              const CircularProgressIndicator(color: AppColors.emerald500)
            else
              ElevatedButton.icon(
                onPressed: _authenticate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emerald600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.fingerprint_rounded),
                label: const Text('Buka Kunci'),
              ),
          ],
        ),
      ),
    );
  }
}
