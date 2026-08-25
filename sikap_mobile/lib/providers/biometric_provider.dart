import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

// State to track if the app is unlocked via Biometrics
final biometricStateProvider = StateProvider<bool>((ref) => false);

// Provider that listens to app lifecycle and locks the app when backgrounded
final biometricLifecycleProvider = Provider<BiometricLifecycleObserver>((ref) {
  final observer = BiometricLifecycleObserver(ref);
  WidgetsBinding.instance.addObserver(observer);
  ref.onDispose(() => WidgetsBinding.instance.removeObserver(observer));
  return observer;
});

class BiometricLifecycleObserver extends WidgetsBindingObserver {
  final Ref ref;
  BiometricLifecycleObserver(this.ref);

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // We lock when paused. Inactive could be just opening a dialog, so we only lock on paused
    if (state == AppLifecycleState.paused) {
      ref.read(biometricStateProvider.notifier).state = false;
    }
  }
}

final localAuthProvider = Provider<LocalAuthentication>((ref) {
  return LocalAuthentication();
});
