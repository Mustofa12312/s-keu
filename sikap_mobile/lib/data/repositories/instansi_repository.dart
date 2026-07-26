import '../models/instansi_model.dart';
import '../models/profile_model.dart';
import '../../core/supabase_client.dart';
import '../../core/utils/logger.dart';

class InstansiRepository {
  Future<List<InstansiModel>> getAll() async {
    try {
      final res = await supabase
          .from('instansi')
          .select('*')
          .order('nama_instansi');
      return (res as List).map((e) => InstansiModel.fromJson(e)).toList();
    } catch (e, st) {
      logger.e('Error getAll instansi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data instansi');
    }
  }

  Future<InstansiModel> getById(String id) async {
    try {
      final res = await supabase
          .from('instansi').select('*').eq('id', id).single();
      return InstansiModel.fromJson(res);
    } catch (e, st) {
      logger.e('Error getById instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data instansi');
    }
  }

  Future<InstansiModel> create(Map<String, dynamic> payload) async {
    try {
      final res = await supabase.from('instansi').insert(payload).select().single();
      return InstansiModel.fromJson(res);
    } catch (e, st) {
      logger.e('Error create instansi', error: e, stackTrace: st);
      throw Exception('Gagal menambah instansi');
    }
  }

  Future<InstansiModel> update(String id, Map<String, dynamic> payload) async {
    try {
      final res = await supabase.from('instansi').update(payload).eq('id', id).select().single();
      return InstansiModel.fromJson(res);
    } catch (e, st) {
      logger.e('Error update instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui instansi');
    }
  }

  Future<void> toggle(String id, bool aktif) async {
    try {
      await supabase.from('instansi').update({'aktif': aktif}).eq('id', id);
    } catch (e, st) {
      logger.e('Error toggle instansi $id', error: e, stackTrace: st);
      throw Exception('Gagal mengubah status instansi');
    }
  }
}

class ProfileRepository {
  Future<ProfileModel?> getMyProfile(String userId) async {
    try {
      final res = await supabase
          .from('profiles')
          .select('*, instansi:instansi_id(nama_instansi)')
          .eq('id', userId)
          .single();
      return ProfileModel.fromJson(res);
    } catch (e, st) {
      logger.w('Profile not found for user $userId', error: e, stackTrace: st);
      return null;
    }
  }

  Future<List<ProfileModel>> getAll() async {
    try {
      final res = await supabase
          .from('profiles')
          .select('*, instansi:instansi_id(nama_instansi)')
          .order('nama');
      return (res as List).map((e) => ProfileModel.fromJson(e)).toList();
    } catch (e, st) {
      logger.e('Error getAll profiles', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data profil');
    }
  }

  Future<void> update(String id, Map<String, dynamic> payload) async {
    try {
      await supabase.from('profiles').update(payload).eq('id', id);
    } catch (e, st) {
      logger.e('Error update profile $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui profil');
    }
  }
}

class PengaturanRepository {
  Future<PengaturanModel> getSettings() async {
    try {
      final res = await supabase
          .from('pengaturan').select('*').eq('id', 1).single();
      return PengaturanModel.fromJson(res);
    } catch (e, st) {
      logger.w('Pengaturan not found, using default', error: e, stackTrace: st);
      return PengaturanModel.defaultSettings();
    }
  }
}
