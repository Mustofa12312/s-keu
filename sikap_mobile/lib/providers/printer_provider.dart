import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';

final bluetoothStateProvider = StateProvider<bool>((ref) => false);
final scannedPrintersProvider = StateProvider<List<BluetoothInfo>>((ref) => []);
final connectedPrinterProvider = StateProvider<BluetoothInfo?>((ref) => null);

class PrinterNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  PrinterNotifier(this.ref) : super(const AsyncData(null)) {
    _init();
  }

  Future<void> _init() async {
    final isConnected = await PrintBluetoothThermal.connectionStatus;
    ref.read(bluetoothStateProvider.notifier).state = isConnected;
  }

  Future<void> scanDevices() async {
    state = const AsyncLoading();
    try {
      final bool isEnabled = await PrintBluetoothThermal.bluetoothEnabled;
      if (!isEnabled) {
        throw Exception('Bluetooth tidak aktif. Silakan aktifkan Bluetooth Anda.');
      }
      final List<BluetoothInfo> devices = await PrintBluetoothThermal.pairedBluetooths;
      ref.read(scannedPrintersProvider.notifier).state = devices;
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> connect(BluetoothInfo device) async {
    state = const AsyncLoading();
    try {
      final bool result = await PrintBluetoothThermal.connect(macPrinterAddress: device.macAdress);
      if (result) {
        ref.read(connectedPrinterProvider.notifier).state = device;
        ref.read(bluetoothStateProvider.notifier).state = true;
      } else {
        throw Exception('Gagal terhubung ke printer ${device.name}');
      }
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> disconnect() async {
    try {
      await PrintBluetoothThermal.disconnect;
      ref.read(connectedPrinterProvider.notifier).state = null;
      ref.read(bluetoothStateProvider.notifier).state = false;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}

final printerControllerProvider = StateNotifierProvider<PrinterNotifier, AsyncValue<void>>((ref) {
  return PrinterNotifier(ref);
});
