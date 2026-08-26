import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transaksi_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class TransaksiPage {
  final List<TransaksiModel> data;
  final DocumentSnapshot? lastDocument;
  final bool hasMore;
  final bool isFetchingMore;
  TransaksiPage({
    required this.data, 
    this.lastDocument, 
    required this.hasMore, 
    this.isFetchingMore = false,
  });

  TransaksiPage copyWith({
    List<TransaksiModel>? data,
    DocumentSnapshot? lastDocument,
    bool? hasMore,
    bool? isFetchingMore,
  }) {
    return TransaksiPage(
      data: data ?? this.data,
      lastDocument: lastDocument ?? this.lastDocument,
      hasMore: hasMore ?? this.hasMore,
      isFetchingMore: isFetchingMore ?? this.isFetchingMore,
    );
  }
}

class TransaksiRepository {
  final _db = FirebaseClient.firestore.collection('transaksi');
  final _instansiDb = FirebaseClient.firestore.collection('instansi');

  Future<TransaksiPage> getPaginated({
    String? instansiId,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? search,
    String? tglMulai,
    String? tglAkhir,
    int limit = 15,
    DocumentSnapshot? lastDocument,
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

      // We sort client side if there is a text search, but for normal pagination we order by firestore
      // Note: If tglMulai/Akhir is used, firestore requires first orderBy to be 'tanggal'
      q = q.orderBy('tanggal', descending: true);
      q = q.orderBy('created_at', descending: true);
      
      if (lastDocument != null) {
        q = q.startAfterDocument(lastDocument);
      }

      q = q.limit(limit);
      
      final snap = await q.get();
      
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

      // Join Instansi
      final instansiSnap = await _instansiDb.get();
      final instansiMap = <String, Map<String, dynamic>>{};
      for (var doc in instansiSnap.docs) {
        instansiMap[doc.id] = doc.data();
      }

      final models = docs.map((data) {
        final instId = data['instansi_id'];
        if (instId != null && instansiMap.containsKey(instId)) {
          data['instansi'] = {
            'nama_instansi': instansiMap[instId]!['nama_instansi'],
            'kode_instansi': instansiMap[instId]!['kode_instansi']
          };
        }
        return TransaksiModel.fromJson(data);
      }).toList();

      return TransaksiPage(
        data: models,
        lastDocument: snap.docs.isNotEmpty ? snap.docs.last : null,
        hasMore: snap.docs.length == limit,
      );

    } catch (e, st) {
      logger.e('Error getPaginated transaksi', error: e, stackTrace: st);
      throw Exception('Gagal memuat: ${e.toString()}');
    }
  }

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
      
      if (limit < 100000) {
        q = q.limit(limit);
      }
      final snap = await q.get();
      
      var docs = snap.docs.map((e) {
        var data = e.data() as Map<String, dynamic>;
        data['id'] = e.id;
        return data;
      }).toList();

      if (search != null && search.isNotEmpty) {
        docs = docs.where((d) {
          final uraian = (d['uraian'] ?? '').toString().toLowerCase();
          return uraian.contains(search.toLowerCase());
        }).toList();
      }

      docs.sort((a, b) {
        final dateA = a['tanggal'] ?? '';
        final dateB = b['tanggal'] ?? '';
        int cmp = dateA.compareTo(dateB);
        if (cmp != 0) return orderDesc ? -cmp : cmp;
        
        final caA = a['created_at'];
        final caB = b['created_at'];
        
        DateTime? dtA;
        if (caA is Timestamp) {
          dtA = caA.toDate();
        } else if (caA is String) {
          dtA = DateTime.tryParse(caA);
        }
        
        DateTime? dtB;
        if (caB is Timestamp) {
          dtB = caB.toDate();
        } else if (caB is String) {
          dtB = DateTime.tryParse(caB);
        }
        
        if (dtA != null && dtB != null) {
          return orderDesc ? dtB.compareTo(dtA) : dtA.compareTo(dtB);
        }
        return 0;
      });

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
      throw Exception('Gagal memuat: ${e.toString()}');
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
