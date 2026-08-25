import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/hutang_piutang_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class HutangPiutangRepository {
  final _db = FirebaseClient.firestore.collection('hutang_piutang');
  final _pembayaranDb = FirebaseClient.firestore.collection('pembayaran_hutang');
  final _instansiDb = FirebaseClient.firestore.collection('instansi');

  Future<List<HutangPiutangModel>> getAll({
    String? instansiId,
    String? jenis,
    String? status,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? search,
    bool orderDesc = true,
  }) async {
    try {
      Query q = _db;
      if (instansiId != null) q = q.where('instansi_id', 'isEqualTo', instansiId);
      if (jenis != null) q = q.where('jenis', 'isEqualTo', jenis);
      if (status != null) q = q.where('status', 'isEqualTo', status);
      if (bulanHijriyah != null) q = q.where('bulan_hijriyah', 'isEqualTo', bulanHijriyah);
      if (tahunHijriyah != null) q = q.where('tahun_hijriyah', 'isEqualTo', tahunHijriyah);

      final snap = await q.get();
      List<HutangPiutangModel> data = [];
      
      // Fetch instansi
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
        data.add(HutangPiutangModel.fromJson(d));
      }

      // Sort
      data.sort((a, b) {
        final dateA = a.tanggal ?? '';
        final dateB = b.tanggal ?? '';
        if (dateA.compareTo(dateB) != 0) {
          return orderDesc ? dateB.compareTo(dateA) : dateA.compareTo(dateB);
        }
        return 0; // simplified
      });

      // Filter search
      if (search != null && search.isNotEmpty) {
        final s = search.toLowerCase();
        data = data.where((e) => 
          (e.namaPihak.toLowerCase().contains(s)) ||
          (e.keterangan?.toLowerCase().contains(s) ?? false)
        ).toList();
      }

      return data;
    } catch (e, st) {
      logger.e('Error getAll hutang piutang', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data hutang piutang');
    }
  }

  Future<HutangPiutangModel> create(Map<String, dynamic> payload) async {
    try {
      payload['created_at'] = FieldValue.serverTimestamp();
      payload['updated_at'] = FieldValue.serverTimestamp();
      final docRef = await _db.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return HutangPiutangModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error create hutang piutang', error: e, stackTrace: st);
      throw Exception('Gagal menambah data hutang piutang');
    }
  }

  Future<HutangPiutangModel> update(String id, Map<String, dynamic> payload) async {
    try {
      payload['updated_at'] = FieldValue.serverTimestamp();
      await _db.doc(id).update(payload);
      final doc = await _db.doc(id).get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return HutangPiutangModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error update hutang piutang $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui data hutang piutang');
    }
  }

  Future<void> delete(String id) async {
    try {
      // Delete payments
      final pSnap = await _pembayaranDb.where('hutang_piutang_id', 'isEqualTo', id).get();
      final batch = FirebaseClient.firestore.batch();
      for (var d in pSnap.docs) {
        batch.delete(d.reference);
      }
      batch.delete(_db.doc(id));
      await batch.commit();
    } catch (e, st) {
      logger.e('Error delete hutang piutang $id', error: e, stackTrace: st);
      throw Exception('Gagal menghapus data hutang piutang');
    }
  }

  // ---- PEMBAYARAN ----
  Future<List<PembayaranHutangModel>> getPembayaran(String hutangPiutangId) async {
    try {
      final snap = await _pembayaranDb.where('hutang_piutang_id', 'isEqualTo', hutangPiutangId).get();
      List<PembayaranHutangModel> data = snap.docs.map((e) {
        final d = e.data();
        d['id'] = e.id;
        return PembayaranHutangModel.fromJson(d);
      }).toList();
      
      data.sort((a, b) => a.tanggal.compareTo(b.tanggal));
      return data;
    } catch (e, st) {
      logger.e('Error getPembayaran $hutangPiutangId', error: e, stackTrace: st);
      throw Exception('Gagal mengambil histori pembayaran');
    }
  }

  Future<PembayaranHutangModel> createPembayaran(String hutangPiutangId, Map<String, dynamic> payload) async {
    try {
      payload['hutang_piutang_id'] = hutangPiutangId;
      payload['created_at'] = FieldValue.serverTimestamp();
      final docRef = await _pembayaranDb.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return PembayaranHutangModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error createPembayaran', error: e, stackTrace: st);
      throw Exception('Gagal menambah pembayaran');
    }
  }

  Future<void> deletePembayaran(String id) async {
    try {
      await _pembayaranDb.doc(id).delete();
    } catch (e, st) {
      logger.e('Error deletePembayaran $id', error: e, stackTrace: st);
      throw Exception('Gagal menghapus pembayaran');
    }
  }
}
