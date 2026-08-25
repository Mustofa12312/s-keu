import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/kategori_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class KategoriRepository {
  final _db = FirebaseClient.firestore.collection('kategori_transaksi');

  Future<List<KategoriModel>> getAll() async {
    try {
      final snap = await _db.orderBy('nama_kategori').get();
      return snap.docs.map((e) {
        final data = e.data();
        data['id'] = e.id;
        return KategoriModel.fromJson(data);
      }).toList();
    } catch (e, st) {
      logger.e('Error getAll kategori', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data kategori');
    }
  }

  Future<KategoriModel> getById(String id) async {
    try {
      final doc = await _db.doc(id).get();
      if (!doc.exists) throw Exception('Not found');
      final data = doc.data()!;
      data['id'] = doc.id;
      return KategoriModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error getById kategori $id', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data kategori');
    }
  }

  Future<KategoriModel> create(Map<String, dynamic> payload) async {
    try {
      payload['created_at'] = FieldValue.serverTimestamp();
      payload['updated_at'] = FieldValue.serverTimestamp();
      final docRef = await _db.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return KategoriModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error create kategori', error: e, stackTrace: st);
      throw Exception('Gagal menambah kategori');
    }
  }

  Future<KategoriModel> update(String id, Map<String, dynamic> payload) async {
    try {
      payload['updated_at'] = FieldValue.serverTimestamp();
      await _db.doc(id).update(payload);
      return getById(id);
    } catch (e, st) {
      logger.e('Error update kategori $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui kategori');
    }
  }

  Future<void> delete(String id) async {
    try {
      await _db.doc(id).delete();
    } catch (e, st) {
      logger.e('Error delete kategori $id', error: e, stackTrace: st);
      throw Exception('Gagal menghapus kategori');
    }
  }
}
