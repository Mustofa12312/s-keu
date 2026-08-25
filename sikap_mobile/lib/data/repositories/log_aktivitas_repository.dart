import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/log_aktivitas_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class LogAktivitasRepository {
  final _db = FirebaseClient.firestore.collection('activity_logs');

  Future<List<LogAktivitasModel>> getAll({int limitCount = 100}) async {
    try {
      var q = _db.orderBy('created_at', descending: true);
      if (limitCount < 100000) {
        q = q.limit(limitCount);
      }
      final snap = await q.get();

      return snap.docs.map((e) {
        final data = e.data();
        data['id'] = e.id;
        return LogAktivitasModel.fromJson(data);
      }).toList();
    } catch (e, st) {
      logger.e('Error getAll activity logs', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data log aktivitas');
    }
  }

  Future<void> log(String userId, String userNama, String userRole, String action, String module, String description) async {
    try {
      await _db.add({
        'user_id': userId,
        'user_nama': userNama,
        'user_role': userRole,
        'action': action,
        'module': module,
        'description': description,
        'created_at': FieldValue.serverTimestamp(),
      });
    } catch (e, st) {
      logger.w('Failed to write activity log', error: e, stackTrace: st);
    }
  }
}
