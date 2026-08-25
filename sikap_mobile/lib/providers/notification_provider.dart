import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/transaksi_model.dart';
import '../core/firebase_client.dart';
import 'app_providers.dart';

final notificationStreamProvider = StreamProvider.autoDispose<List<TransaksiModel>>((ref) {
  final profile = ref.watch(profileProvider).valueOrNull;
  if (profile == null) return const Stream.empty();

  var q = FirebaseClient.firestore.collection('transaksi')
      .orderBy('created_at', descending: true)
      .limit(15);

  if (!profile.isSuperAdmin && profile.instansiId != null) {
    q = q.where('instansi_id', isEqualTo: profile.instansiId);
  }

  return q.snapshots().map((snap) {
    return snap.docs.map((doc) {
      final data = doc.data();
      data['id'] = doc.id;
      return TransaksiModel.fromJson(data);
    }).toList();
  });
});

class ReadNotificationNotifier extends StateNotifier<List<String>> {
  ReadNotificationNotifier() : super([]);

  void markAsRead(String id) {
    if (!state.contains(id)) {
      state = [...state, id];
    }
  }

  void markAllAsRead(List<String> ids) {
    state = ids;
  }
}

final readNotificationProvider = StateNotifierProvider<ReadNotificationNotifier, List<String>>((ref) {
  return ReadNotificationNotifier();
});
