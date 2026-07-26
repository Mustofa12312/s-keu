import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaksi_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class TransaksiRepository {
  final _db = FirebaseClient.firestore.collection('transaksi');
  final _instansiDb = FirebaseClient.firestore.collection('instansi');

  Future<List<TransaksiModel>> getAll({
    String? instansiId,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? search,
    String? tglMulai,
    String? tglAkhir,
    bool orderDesc = false,
    int limit = 100000,
  }) async {
    try {
      Query q = _db;

      if (instansiId != null && instansiId.isNotEmpty) {
        q = q.where('instansi_id', isEqualTo: instansiId);
      }
      if (bulanHijriyah != null && bulanHijriyah.isNotEmpty) {
        q = q.where('bulan_hijriyah', isEqualTo: bulanHijriyah);
      }
      if (tahunHijriyah != null && tahunHijriyah.isNotEmpty) {
        q = q.where('tahun_hijriyah', isEqualTo: tahunHijriyah);
      }
      if (tglMulai != null) q = q.where('tanggal', isGreaterThanOrEqualTo: tglMulai);
      if (tglAkhir != null) q = q.where('tanggal', isLessThanOrEqualTo: tglAkhir);

      // We cannot order by 'tanggal' and 'created_at' if we have inequality filters on other fields in Firestore easily.
      // We will sort client side or just order by created_at.
      // The original ordered by tanggal then created_at.
      // We will do a basic fetch and sort in memory for simplicity to mimic supabase.
      
      final snap = await q.limit(limit).get();
      
      var docs = snap.docs.map((e) {
        var data = e.data() as Map<String, dynamic>;
        data['id'] = e.id;
        return data;
      }).toList();

      // Client-side search (ilike)
      if (search != null && search.isNotEmpty) {
        docs = docs.where((d) {
          final uraian = (d['uraian'] ?? '').toString().toLowerCase();
          return uraian.contains(search.toLowerCase());
        }).toList();
      }

      // Client-side sort
      docs.sort((a, b) {
        final dateA = a['tanggal'] ?? '';
        final dateB = b['tanggal'] ?? '';
        int cmp = dateA.compareTo(dateB);
        if (cmp != 0) return orderDesc ? -cmp : cmp;
        
        final caA = a['created_at'];
        final caB = b['created_at'];
        
        // Handle FieldValue / Timestamp
        DateTime? dtA;
        if (caA is Timestamp) dtA = caA.toDate();
        else if (caA is String) dtA = DateTime.tryParse(caA);
        
        DateTime? dtB;
        if (caB is Timestamp) dtB = caB.toDate();
        else if (caB is String) dtB = DateTime.tryParse(caB);
        
        if (dtA != null && dtB != null) {
          return orderDesc ? dtB.compareTo(dtA) : dtA.compareTo(dtB);
        }
        return 0;
      });

      // Join Instansi
      final instansiSnap = await _instansiDb.get();
      final instansiMap = <String, Map<String, dynamic>>{};
      for (var doc in instansiSnap.docs) {
        instansiMap[doc.id] = doc.data();
      }

      return docs.map((data) {
        final instId = data['instansi_id'];
        if (instId != null && instansiMap.containsKey(instId)) {
          data['instansi'] = {
            'nama_instansi': instansiMap[instId]!['nama_instansi'],
            'kode_instansi': instansiMap[instId]!['kode_instansi']
          };
        }
        return TransaksiModel.fromJson(data);
      }).toList();

    } catch (e, st) {
      logger.e('Error getAll transaksi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data transaksi');
    }
  }

  Future<TransaksiModel> create(Map<String, dynamic> payload) async {
    try {
      payload['created_at'] = FieldValue.serverTimestamp();
      payload['updated_at'] = FieldValue.serverTimestamp();
      
      final docRef = await _db.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return TransaksiModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error create transaksi', error: e, stackTrace: st);
      throw Exception('Gagal menambah transaksi');
    }
  }

  Future<TransaksiModel> update(String id, Map<String, dynamic> payload) async {
    try {
      payload['updated_at'] = FieldValue.serverTimestamp();
      await _db.doc(id).update(payload);
      
      final doc = await _db.doc(id).get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return TransaksiModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error update transaksi $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui transaksi');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _db.doc(id).delete();
    } catch (e, st) {
      logger.e('Error delete transaksi $id', error: e, stackTrace: st);
      throw Exception('Gagal menghapus transaksi');
    }
  }

  Future<List<Map<String, dynamic>>> getSummary({
    String? instansiId,
    String? tahunHijriyah,
  }) async {
    try {
      Query q = _db;
      if (instansiId != null && instansiId.isNotEmpty) {
        q = q.where('instansi_id', isEqualTo: instansiId);
      }
      if (tahunHijriyah != null && tahunHijriyah.isNotEmpty) {
        q = q.where('tahun_hijriyah', isEqualTo: tahunHijriyah);
      }
      final snap = await q.get();
      
      return snap.docs.map((e) {
        final data = e.data() as Map<String, dynamic>;
        return {
          'jenis': data['jenis'],
          'nominal': data['nominal'],
          'bulan_hijriyah': data['bulan_hijriyah'],
          'tahun_hijriyah': data['tahun_hijriyah']
        };
      }).toList();
    } catch (e, st) {
      logger.e('Error getSummary transaksi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil ringkasan transaksi');
    }
  }
}
