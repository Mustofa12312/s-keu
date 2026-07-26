import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/instansi_model.dart';
import '../models/profile_model.dart';
import '../../core/firebase_client.dart';
import '../../core/utils/logger.dart';

class InstansiRepository {
  final _db = FirebaseClient.firestore.collection('instansi');

  Future<List<InstansiModel>> getAll() async {
    try {
      final snap = await _db.orderBy('nama_instansi').get();
      return snap.docs.map((e) {
        final data = e.data();
        data['id'] = e.id;
        return InstansiModel.fromJson(data);
      }).toList();
    } catch (e, st) {
      logger.e('Error getAll instansi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data instansi');
    }
  }

  Future<InstansiModel> getById(String id) async {
    try {
      final doc = await _db.doc(id).get();
      if (!doc.exists) throw Exception('Not found');
      final data = doc.data()!;
      data['id'] = doc.id;
      return InstansiModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error getById instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data instansi');
    }
  }

  Future<InstansiModel> create(Map<String, dynamic> payload) async {
    try {
      payload['created_at'] = FieldValue.serverTimestamp();
      payload['updated_at'] = FieldValue.serverTimestamp();
      final docRef = await _db.add(payload);
      final doc = await docRef.get();
      final data = doc.data()!;
      data['id'] = doc.id;
      return InstansiModel.fromJson(data);
    } catch (e, st) {
      logger.e('Error create instansi', error: e, stackTrace: st);
      throw Exception('Gagal menambah instansi');
    }
  }

  Future<InstansiModel> update(String id, Map<String, dynamic> payload) async {
    try {
      payload['updated_at'] = FieldValue.serverTimestamp();
      await _db.doc(id).update(payload);
      return getById(id);
    } catch (e, st) {
      logger.e('Error update instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui instansi');
    }
  }

  Future<void> toggle(String id, bool aktif) async {
    try {
      await _db.doc(id).update({'aktif': aktif});
    } catch (e, st) {
      logger.e('Error toggle instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal mengubah status instansi');
    }
  }
}

class ProfileRepository {
  final _db = FirebaseClient.firestore.collection('profiles');
  final _instansiDb = FirebaseClient.firestore.collection('instansi');

  Future<ProfileModel?> getMyProfile(String userId) async {
    try {
      final doc = await _db.doc(userId).get();
      if (!doc.exists) return null;
      
      final data = doc.data()!;
      data['id'] = doc.id;
      
      if (data['instansi_id'] != null) {
        final instDoc = await _instansiDb.doc(data['instansi_id']).get();
        if (instDoc.exists) {
          data['instansi'] = {'nama_instansi': instDoc.data()?['nama_instansi']};
        }
      }
      
      return ProfileModel.fromJson(data);
    } catch (e, st) {
      logger.w('Profile not found for user $userId', error: e, stackTrace: st);
      return null;
    }
  }

  Future<List<ProfileModel>> getAll() async {
    try {
      final snap = await _db.orderBy('nama').get();
      final instansiSnap = await _instansiDb.get();
      
      final instansiMap = <String, String>{};
      for (var doc in instansiSnap.docs) {
        instansiMap[doc.id] = doc.data()['nama_instansi'] ?? '';
      }
      
      return snap.docs.map((e) {
        final data = e.data();
        data['id'] = e.id;
        
        final instId = data['instansi_id'];
        if (instId != null && instansiMap.containsKey(instId)) {
          data['instansi'] = {'nama_instansi': instansiMap[instId]};
        }
        
        return ProfileModel.fromJson(data);
      }).toList();
    } catch (e, st) {
      logger.e('Error getAll profiles', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data profil');
    }
  }

  Future<void> update(String id, Map<String, dynamic> payload) async {
    try {
      await _db.doc(id).update(payload);
    } catch (e, st) {
      logger.e('Error update profile $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui profil');
    }
  }
}

class PengaturanRepository {
  final _db = FirebaseClient.firestore.collection('pengaturan');

  Future<PengaturanModel> getSettings() async {
    try {
      // Assuming ID is '1' in Firestore as well
      final doc = await _db.doc('1').get();
      if (!doc.exists) return PengaturanModel.defaultSettings();
      
      final data = doc.data()!;
      data['id'] = doc.id;
      return PengaturanModel.fromJson(data);
    } catch (e, st) {
      logger.w('Pengaturan not found, using default', error: e, stackTrace: st);
      return PengaturanModel.defaultSettings();
    }
  }
}
