import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../providers/app_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    Future.delayed(const Duration(seconds: 3), _navigate);
  }

  void _navigate() {
    final user = ref.read(authProvider).valueOrNull;
    if (!mounted) return;
    if (user != null) {
      context.go(AppStrings.routeDashboard);
    } else {
      context.go(AppStrings.routeLogin);
    }
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.darkBgGradient),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (_, __) => Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.emerald500.withOpacity(0.3 + _pulseCtrl.value * 0.2),
                        blurRadius: 30 + _pulseCtrl.value * 20,
                        spreadRadius: 5 + _pulseCtrl.value * 5,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'SK',
                      style: TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -2,
                      ),
                    ),
                  ),
                ),
              ).animate().scale(duration: 600.ms, curve: Curves.elasticOut),

              const SizedBox(height: 28),

              // App Name
              Text(
                AppStrings.appName,
                style: const TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 6,
                ),
              ).animate(delay: 300.ms).fadeIn(duration: 500.ms).slideY(begin: 0.3),

              const SizedBox(height: 8),

              Text(
                AppStrings.appTagline,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.dark300,
                  letterSpacing: 1,
                ),
                textAlign: TextAlign.center,
              ).animate(delay: 500.ms).fadeIn(duration: 500.ms),

              const SizedBox(height: 12),

              Text(
                AppStrings.pondokName,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.emerald400,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ).animate(delay: 700.ms).fadeIn(duration: 500.ms),

              const SizedBox(height: 60),

              // Loading indicator
              SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: AppColors.emerald400,
                  backgroundColor: AppColors.emerald900,
                ),
              ).animate(delay: 800.ms).fadeIn(duration: 400.ms),
            ],
          ),
        ),
      ),
    );
  }
}
