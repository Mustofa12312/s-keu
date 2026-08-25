import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/anggaran_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class AnggaranRepository {
  final _db = FirebaseClient.firestore.collection('anggaran');
  final _realisasiDb = FirebaseClient.firestore.collection('realisasi_anggaran');
  final _instansiDb = FirebaseClient.firestore.collection('instansi');

  Future<List<AnggaranModel>> getRencana({
    String? instansiId,
    String? tahunPelajaran,
    String? kategori,
  }) async {
    try {
      Query q = _db;
      if (instansiId != null) q = q.where('instansi_id', 'isEqualTo', instansiId);
      if (tahunPelajaran != null) q = q.where('tahun_pelajaran', 'isEqualTo', tahunPelajaran);
      if (kategori != null) q = q.where('kategori', 'isEqualTo', kategori);

      final snap = await q.get();
      List<AnggaranModel> data = [];

      final instansiSnap = await _instansiDb.get();
      final instansiMap = <String, Map<String, dynamic>>{};
      for (var doc in instansiSnap.docs) {
        instansiMap[doc.id] = {'id': doc.id, ...doc.data()};
      }

      for (var e in snap.docs) {
        final d = e.data() as Map<String, dynamic>;
        d['id'] = e.id;
        final instId = d['instansi_id'] as String?;
        if (instId != null && instansiMap.containsKey(instId)) {
          d['instansi'] = instansiMap[instId];
        }
        data.add(AnggaranModel.fromJson(d));
      }

      data.sort((a, b) => (a.kode ?? '').compareTo(b.kode ?? ''));
      return data;
    } catch (e, st) {
      logger.e('Error getRencana anggaran', error: e, stackTrace: st);
      throw Exception('Gagal mengambil rencana anggaran');
    }
  }

  Future<AnggaranModel> createRencana(Map<String, dynamic> payload) async {
    try {
      payload['created_at'] = FieldValue.serverTimestamp();
      payload['updated_at'] = FieldValue.serverTimestamp();
      final docRef = await _db.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return AnggaranModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error createRencana', error: e, stackTrace: st);
      throw Exception('Gagal menambah rencana anggaran');
    }
  }

  Future<AnggaranModel> updateRencana(String id, Map<String, dynamic> payload) async {
    try {
      payload['updated_at'] = FieldValue.serverTimestamp();
      await _db.doc(id).update(payload);
      final doc = await _db.doc(id).get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return AnggaranModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error updateRencana', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui rencana anggaran');
    }
  }

  Future<void> deleteRencana(String id) async {
    try {
      final rSnap = await _realisasiDb.where('anggaran_id', 'isEqualTo', id).get();
      final batch = FirebaseClient.firestore.batch();
      for (var d in rSnap.docs) {
        batch.delete(d.reference);
      }
      batch.delete(_db.doc(id));
      await batch.commit();
    } catch (e, st) {
      logger.e('Error deleteRencana', error: e, stackTrace: st);
      throw Exception('Gagal menghapus rencana anggaran');
    }
  }

  Future<List<RealisasiAnggaranModel>> getRealisasi(String anggaranId) async {
    try {
      final snap = await _realisasiDb.where('anggaran_id', 'isEqualTo', anggaranId).get();
      List<RealisasiAnggaranModel> data = snap.docs.map((e) {
        final d = e.data();
        d['id'] = e.id;
        return RealisasiAnggaranModel.fromJson(d);
      }).toList();
      data.sort((a, b) => b.tanggal.compareTo(a.tanggal)); // descending date
      return data;
    } catch (e, st) {
      logger.e('Error getRealisasi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil realisasi anggaran');
    }
  }

  Future<RealisasiAnggaranModel> createRealisasi(String anggaranId, Map<String, dynamic> payload) async {
    try {
      payload['anggaran_id'] = anggaranId;
      payload['created_at'] = FieldValue.serverTimestamp();
      final docRef = await _realisasiDb.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return RealisasiAnggaranModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error createRealisasi', error: e, stackTrace: st);
      throw Exception('Gagal menambah realisasi anggaran');
    }
  }

  Future<void> deleteRealisasi(String id) async {
    try {
      await _realisasiDb.doc(id).delete();
    } catch (e, st) {
      logger.e('Error deleteRealisasi', error: e, stackTrace: st);
      throw Exception('Gagal menghapus realisasi anggaran');
    }
  }
}
